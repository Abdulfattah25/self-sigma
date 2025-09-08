import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url);
const SUPABASE_ANON =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey);

let client = window.supabaseClient || null;

export function getSupabase() {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn(
      'Supabase config missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or window.SUPABASE_CONFIG are set.',
    );
    return null;
  }
  client = createClient(SUPABASE_URL, SUPABASE_ANON);
  window.supabaseClient = client;
  return client;
}

export function signOutSafely(supabase) {
  return (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data?.session;
      if (hasSession) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
    } catch (_) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  })();
}
