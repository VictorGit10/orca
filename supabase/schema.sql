-- Cole e rode este script na página de SQL Editor do seu projeto no Supabase
--
-- IMPORTANTE: o modelo de acesso usa a anon/publishable key + um family_id
-- definido no frontend (VITE_SUPABASE_FAMILY_ID). As políticas abaixo liberam
-- o acesso a qualquer cliente que tenha a key pública — a proteção real dos
-- seus dados é o family_id, que deve ser longo, aleatório e tratado como senha.

-- 1. Cria a tabela events (Apenas Append)
CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    family_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    device_ts bigint NOT NULL,
    client_id text
);

-- 2. Ativa o Row Level Security (Neste formato, liberado para qualquer um com a Anon Key modificar dados. Restringiremos via Frontend/family_id por enquanto)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. Cria política para INSERIR (Todos podem inserir)
CREATE POLICY "Enable insert for all users" ON public.events
    FOR INSERT
    WITH CHECK (true);

-- 4. Cria política para LER (Todos podem ler)
CREATE POLICY "Enable read access for all users" ON public.events
    FOR SELECT
    USING (true);

-- 5. Ativa o Realtime para a tabela events! (Esse é crucial)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
