import { getSupabase } from '@/lib/supabaseClient';

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  if (!navigator.serviceWorker.controller) {
    try {
      await navigator.serviceWorker.ready;
    } catch (_) {}
  }
  return navigator.serviceWorker.ready;
}

export async function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const res = await Notification.requestPermission();
  return res;
}

export async function subscribePush(userId) {
  const reg = await getRegistration();
  if (!reg || !('pushManager' in reg)) throw new Error('SW not ready');
  const existing = await reg.pushManager.getSubscription();
  let sub = existing;
  if (!existing) {
    if (!VAPID_KEY) {
      throw new Error('VAPID public key is missing');
    }
    const appServerKey = urlBase64ToUint8Array(VAPID_KEY);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    });
  }
  const { endpoint, keys } = sub.toJSON();
  const supabase = getSupabase();
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh: keys?.p256dh || null,
      auth: keys?.auth || null,
      ua: navigator.userAgent,
      is_active: true,
    },
    { onConflict: 'user_id,endpoint' },
  );
  return sub;
}

export async function unsubscribePush(userId) {
  const reg = await getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  if (sub?.endpoint) {
    const supabase = getSupabase();
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', sub.endpoint);
  }
}

export async function hasActiveSubscription() {
  const reg = await getRegistration();
  if (!reg || !('pushManager' in reg)) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
