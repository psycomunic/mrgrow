-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0002 — Organizações (multi-tenant), perfis e acesso
-- ════════════════════════════════════════════════════════════════

create table if not exists public.organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug citext not null unique,
  documento text,                          -- CNPJ
  logo_url text,
  cor_primaria text default '#1668f5',
  fuso_horario text not null default 'America/Sao_Paulo',
  moeda text not null default 'BRL',
  plano text not null default 'interno',   -- interno | starter | pro | white_label
  configuracoes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text,
  email citext,
  avatar_url text,
  telefone text,
  cargo text,
  ultimo_acesso_em timestamptz,
  preferencias jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.membros_organizacao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  papel papel_usuario not null default 'operador',
  -- quando papel = 'cliente', restringe o acesso a estes clientes
  clientes_permitidos uuid[] not null default '{}',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, usuario_id)
);

create index if not exists idx_membros_usuario on public.membros_organizacao(usuario_id);
create index if not exists idx_membros_org on public.membros_organizacao(organizacao_id);

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  email citext not null,
  papel papel_usuario not null default 'operador',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expira_em timestamptz not null default (now() + interval '7 days'),
  aceito_em timestamptz,
  convidado_por uuid references public.perfis(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.auditoria (
  id bigserial primary key,
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  usuario_id uuid references public.perfis(id) on delete set null,
  acao text not null,
  tabela text,
  registro_id uuid,
  dados_antes jsonb,
  dados_depois jsonb,
  ip inet,
  criado_em timestamptz not null default now()
);

create index if not exists idx_auditoria_org_data on public.auditoria(organizacao_id, criado_em desc);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  usuario_id uuid references public.perfis(id) on delete cascade,
  titulo text not null,
  mensagem text,
  tipo text not null default 'info',       -- info | sucesso | alerta | perigo
  url text,
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists idx_notificacoes_usuario on public.notificacoes(usuario_id, lida_em, criado_em desc);

-- ── Triggers de atualização ─────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['organizacoes','perfis','membros_organizacao'] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on public.%1$s;
       create trigger trg_%1$s_atualizado before update on public.%1$s
       for each row execute function public.tocar_atualizado_em();', t);
  end loop;
end $$;

-- ── Provisionamento do perfil ao criar usuário ──────────────────
create or replace function public.ao_criar_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome_completo, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ao_criar_usuario on auth.users;
create trigger trg_ao_criar_usuario
after insert on auth.users
for each row execute function public.ao_criar_usuario();

-- ── Helpers de autorização (usados por toda a RLS) ──────────────
create or replace function public.orgs_do_usuario()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organizacao_id
  from public.membros_organizacao
  where usuario_id = auth.uid() and ativo = true;
$$;

create or replace function public.papel_na_org(org uuid)
returns papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select papel
  from public.membros_organizacao
  where usuario_id = auth.uid() and organizacao_id = org and ativo = true
  limit 1;
$$;

create or replace function public.e_membro(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_organizacao
    where usuario_id = auth.uid() and organizacao_id = org and ativo = true
  );
$$;

create or replace function public.e_equipe(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_organizacao
    where usuario_id = auth.uid() and organizacao_id = org and ativo = true
      and papel <> 'cliente'
  );
$$;

create or replace function public.e_gestor(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_organizacao
    where usuario_id = auth.uid() and organizacao_id = org and ativo = true
      and papel in ('proprietario','administrador','gestor')
  );
$$;

-- Cliente enxerga apenas as contas liberadas para ele
create or replace function public.pode_ver_cliente(org uuid, cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_organizacao m
    where m.usuario_id = auth.uid() and m.organizacao_id = org and m.ativo = true
      and (m.papel <> 'cliente' or cliente = any(m.clientes_permitidos))
  );
$$;
