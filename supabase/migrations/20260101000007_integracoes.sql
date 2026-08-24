-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0007 — Central de integrações e métricas de mídia
-- ════════════════════════════════════════════════════════════════

create table if not exists public.integracoes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  provedor provedor_integracao not null,
  status status_integracao not null default 'desconectada',
  rotulo text,

  -- Tokens são gravados cifrados (AES-256-GCM) pela camada server-side.
  token_acesso_cifrado text,
  token_atualizacao_cifrado text,
  expira_em timestamptz,
  escopos text[],

  conta_externa_id text,
  conta_externa_nome text,
  metadados jsonb not null default '{}'::jsonb,

  ultimo_erro text,
  ultima_sincronizacao_em timestamptz,
  conectado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, provedor, conta_externa_id)
);

-- Contas de anúncio / propriedades vinculadas a um cliente
create table if not exists public.contas_externas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  integracao_id uuid not null references public.integracoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  provedor provedor_integracao not null,
  tipo text not null default 'conta_anuncio',   -- conta_anuncio | propriedade_ga4 | pixel | pagina | perfil_ig
  id_externo text not null,
  nome text not null,
  moeda text default 'BRL',
  fuso_horario text,
  ativa boolean not null default true,
  sincronizar boolean not null default true,
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, provedor, id_externo)
);

create index if not exists idx_contas_externas_cliente on public.contas_externas(cliente_id, provedor);

-- Campanhas espelhadas das plataformas
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  conta_externa_id uuid not null references public.contas_externas(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  provedor provedor_integracao not null,
  id_externo text not null,
  nome text not null,
  objetivo text,
  status text,
  orcamento_diario numeric(14,2),
  orcamento_total numeric(14,2),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_externa_id, id_externo)
);

-- Série diária de métricas — base de todos os dashboards e relatórios
create table if not exists public.metricas_diarias (
  id bigserial primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  conta_externa_id uuid not null references public.contas_externas(id) on delete cascade,
  campanha_id uuid references public.campanhas(id) on delete cascade,
  provedor provedor_integracao not null,
  data date not null,

  investimento numeric(14,2) not null default 0,
  impressoes bigint not null default 0,
  alcance bigint not null default 0,
  cliques bigint not null default 0,
  cliques_link bigint not null default 0,
  conversas bigint not null default 0,
  leads bigint not null default 0,
  compras bigint not null default 0,
  receita numeric(14,2) not null default 0,
  sessoes bigint not null default 0,
  usuarios bigint not null default 0,

  metricas_extras jsonb not null default '{}'::jsonb,
  sincronizado_em timestamptz not null default now()
);

-- Uma linha por conta+campanha+dia (campanha nula = agregado da conta)
create unique index if not exists idx_metricas_unicas on public.metricas_diarias (
  conta_externa_id,
  coalesce(campanha_id, '00000000-0000-0000-0000-000000000000'::uuid),
  data
);

create index if not exists idx_metricas_cliente_data on public.metricas_diarias(cliente_id, data desc);
create index if not exists idx_metricas_org_data on public.metricas_diarias(organizacao_id, data desc);

-- Log de sincronizações (observabilidade da central de integrações)
create table if not exists public.sincronizacoes (
  id bigserial primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  integracao_id uuid references public.integracoes(id) on delete cascade,
  provedor provedor_integracao not null,
  janela_inicio date,
  janela_fim date,
  registros int not null default 0,
  duracao_ms int,
  sucesso boolean not null default true,
  erro text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_sincronizacoes_org on public.sincronizacoes(organizacao_id, criado_em desc);

do $$
declare t text;
begin
  foreach t in array array['integracoes','contas_externas','campanhas'] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on public.%1$s;
       create trigger trg_%1$s_atualizado before update on public.%1$s
       for each row execute function public.tocar_atualizado_em();', t);
  end loop;
end $$;
