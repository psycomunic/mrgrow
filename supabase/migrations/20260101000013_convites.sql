-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0013 — Convites de equipe
--
-- A migração 0002 já criava `public.convites`, mas nada usava a tabela: ela
-- não tinha os clientes liberados para um acesso de cliente, o `select` do
-- criador vinha com outro nome e a RLS herdada da 0009 liberava a leitura
-- para qualquer membro da equipe — inclusive o token, que é a credencial de
-- entrada. Este arquivo fecha os três pontos e é idempotente: roda igual em
-- banco novo e em banco que já subiu até a 0012.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  email citext not null,
  papel papel_usuario not null default 'operador',
  clientes_permitidos uuid[] not null default '{}',
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  expira_em timestamptz not null default (now() + interval '7 days'),
  aceito_em timestamptz,
  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Bancos vindos da 0002 não têm esta coluna.
alter table public.convites
  add column if not exists clientes_permitidos uuid[] not null default '{}';

-- `convidado_por` da 0002 passa a `criado_por`, o nome usado no resto do
-- schema. O default do token continua o de 0002 (24 bytes): mesmo formato,
-- mais entropia.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'convites' and column_name = 'convidado_por'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'convites' and column_name = 'criado_por'
  ) then
    alter table public.convites rename column convidado_por to criado_por;
  end if;
end $$;

alter table public.convites
  add column if not exists criado_por uuid references public.perfis(id) on delete set null;

/* Um convite em aberto por e-mail e organização. Sem isto, clicar duas vezes
   em "Convidar" gera dois tokens válidos para a mesma pessoa e revogar um
   deixa o outro de pé. Índice parcial: convites já aceitos não competem, e a
   pessoa pode ser convidada de novo depois de sair da equipe. */
create unique index if not exists idx_convites_pendente
  on public.convites(organizacao_id, email)
  where aceito_em is null;

create index if not exists idx_convites_org on public.convites(organizacao_id, criado_em desc);

-- ── RLS: convite é assunto de quem administra a equipe ──────────
alter table public.convites enable row level security;

-- Políticas genéricas da 0009 (`e_equipe`): abriam o token para operador e
-- financeiro, que não gerenciam acesso nenhum.
drop policy if exists convites_ler on public.convites;
drop policy if exists convites_escrever on public.convites;

create policy convites_ler on public.convites
  for select using (public.e_gestor(organizacao_id));

create policy convites_gerir on public.convites
  for all to authenticated
  using (public.e_gestor(organizacao_id))
  with check (public.e_gestor(organizacao_id));
