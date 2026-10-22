-- Orça: fecha a tabela events para quem não entrou com login.
--
-- Antes: qualquer pessoa com a chave pública (que vai dentro do site) lia e
-- gravava tudo. Depois: só contas cadastradas em orca_membros leem e gravam, e
-- só os eventos da própria família. O app continua igual para quem entrou.
--
-- Cadastrar uma pessoa (fora deste arquivo, que é público):
--   insert into public.orca_membros (user_id, family_id)
--   select id, '<family_id>' from auth.users where email = '<email>';

begin;

create table if not exists public.orca_membros (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  family_id text not null,
  criado_em timestamptz not null default now()
);
alter table public.orca_membros enable row level security;
revoke all on public.orca_membros from public, anon, authenticated;

-- Famílias da conta que está usando o app. Security definer para poder ler
-- orca_membros (que ninguém lê diretamente).
create or replace function public.orca_minhas_familias()
returns setof text
language sql stable security definer
set search_path = public, pg_temp
as $$ select family_id from public.orca_membros where user_id = auth.uid() $$;

-- O app pergunta isto logo depois do login para mostrar "sem acesso".
create or replace function public.orca_sou_membro()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$ select exists (select 1 from public.orca_membros where user_id = auth.uid()) $$;

revoke all on function public.orca_minhas_familias() from public, anon;
revoke all on function public.orca_sou_membro() from public, anon;
grant execute on function public.orca_minhas_familias() to authenticated;
grant execute on function public.orca_sou_membro() to authenticated;

drop policy if exists "Enable insert for all users" on public.events;
drop policy if exists "Enable read access for all users" on public.events;
drop policy if exists orca_ler on public.events;
drop policy if exists orca_gravar on public.events;

create policy orca_ler on public.events
  for select to authenticated
  using (family_id in (select public.orca_minhas_familias()));

create policy orca_gravar on public.events
  for insert to authenticated
  with check (family_id in (select public.orca_minhas_familias()));

-- Só leitura e inclusão (events é só de acréscimo), e só com login.
revoke all on public.events from public, anon, authenticated;
grant select, insert on public.events to authenticated;

commit;
