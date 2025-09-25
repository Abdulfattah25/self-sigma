// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import webpush from 'npm:web-push@3.6.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const SUBJECT = Deno.env.get('PUSH_SUBJECT') || 'mailto:admin@example.com';
const CRON_SECRET = (Deno.env.get('CRON_SECRET') || '').trim();

webpush.setVapidDetails(SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function todayWITA() {
  const now = new Date();
  const offsetMs = 8 * 60 * 60 * 1000; // UTC+8
  const wita = new Date(now.getTime() + offsetMs);
  return wita.toISOString().slice(0, 10);
}

function getTypeFromUrl(url: URL): 'morning' | 'evening' {
  const t = url.searchParams.get('type');
  if (t === 'morning' || t === 'evening') return t;
  if (url.pathname.endsWith('/evening')) return 'evening';
  if (url.pathname.endsWith('/morning')) return 'morning';
  const hourUTC = new Date().getUTCHours();
  const witaHour = (hourUTC + 8) % 24;
  return witaHour < 12 ? 'morning' : 'evening';
}

Deno.serve(async (req: Request) => {
  try {
    if (CRON_SECRET) {
      const header = (req.headers.get('x-cron-key') || '').trim();
      if (header !== CRON_SECRET) {
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        });
      }
    }
    const url = new URL(req.url);
    const type = getTypeFromUrl(url);
    const today = todayWITA();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: users, error: uErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);
    if (uErr) throw uErr;

    let sentTotal = 0;

    for (const u of users || []) {
      const userId = u.id as string;

      const { data: logged } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('type', type)
        .maybeSingle();
      if (logged) continue;

      const countQuery = supabase
        .from('daily_tasks_instance')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('date', today);

      const { count: totalToday, error: cErr1 } = await countQuery;
      if (cErr1) continue;

      let remaining = 0;
      if (type === 'evening') {
        const { count, error: cErr2 } = await supabase
          .from('daily_tasks_instance')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('date', today)
          .eq('is_completed', false);
        if (cErr2) continue;
        remaining = count ?? 0;
      }

      const { data: subs, error: sErr } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (sErr) continue;
      if (!subs || subs.length === 0) {
        // Tetap catat agar tidak dikirim berulang kali pada hari ini
        await supabase.from('notification_logs').insert({ user_id: userId, type, date: today });
        continue;
      }

      const title =
        type === 'morning'
          ? `Selamat pagi! ${totalToday ?? 0} tugas siap dikerjakan`
          : `${remaining} tugas belum selesai hari ini`;
      const body =
        type === 'morning'
          ? 'Buka Task Manager dan mulai dari prioritas tertinggi.'
          : 'Selesaikan yang tersisa atau jadwalkan ulang.';

      const payload = JSON.stringify({ type, date: today, title, body });

      let success = false;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            } as any,
            payload,
          );
          success = true;
          sentTotal++;
        } catch (e: any) {
          const status = e?.statusCode || e?.status;
          if (status === 404 || status === 410) {
            await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
          }
        }
      }

      if (success) {
        await supabase.from('notification_logs').insert({ user_id: userId, type, date: today });
      } else {
        // Catat tetap agar idempoten, bisa diubah sesuai kebutuhan
        await supabase.from('notification_logs').insert({ user_id: userId, type, date: today });
      }
    }

    return new Response(JSON.stringify({ ok: true, type, date: today, sent: sentTotal }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
});
