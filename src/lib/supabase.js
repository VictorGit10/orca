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

// O login fica salvo no aparelho (sessão renovada sozinha). No GitHub Pages o
// Orça divide o endereço com o Tarefas (apps-victor.github.io): quem entrou num
// já está dentro do outro, porque a chave de armazenamento padrão é a mesma.
export const supabase = supabaseReady
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    })
  : noopClient;