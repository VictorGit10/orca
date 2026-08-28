import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = !!(supabaseUrl && supabaseKey);

if (!supabaseReady) {
  console.warn('Supabase env vars ausentes. App funcionará apenas offline.');
}

const noopClient = {
  from: () => ({ insert: async () => ({ error: { message: 'Supabase not configured' } }), select: async () => ({ data: null }) }),
  channel: () => ({ on: function() { return this; }, subscribe: function() { return this; } }),
  removeChannel: () => {},
};

export const supabase = supabaseReady
  ? createClient(supabaseUrl, supabaseKey)
  : noopClient;