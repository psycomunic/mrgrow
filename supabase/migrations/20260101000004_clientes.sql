-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0004 — Clientes, contratos e propostas
-- ════════════════════════════════════════════════════════════════

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  slug citext not null,
  documento text,
  segmento text,
  site text,
  instagram text,
  logo_url text,
  status status_cliente not null default 'ativo',

  responsavel_id uuid references public.perfis(id) on delete set null,
  gestor_trafego_id uuid references public.perfis(id) on delete set null,

  fee_mensal numeric(14,2) not null default 0,
  percentual_sobre_investimento numeric(5,2) not null default 0,
  investimento_previsto numeric(14,2) not null default 0,
  dia_vencimento int not null default 10 check (dia_vencimento between 1 and 28),

  inicio_contrato date,
  fim_contrato date,
  nps int,
  saude int not null default 80 check (saude between 0 and 100),

  contato_principal_id uuid references public.contatos(id) on delete set null,
  observacoes text,
  campos_extras jsonb not null default '{}'::jsonb,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, slug)
);

create index if not exists idx_clientes_org_status on public.clientes(organizacao_id, status);

alter table public.negocios
  drop constraint if exists negocios_cliente_id_fkey,
  add constraint negocios_cliente_id_fkey
  foreign key (cliente_id) references public.clientes(id) on delete set null;

alter table public.atividades
  drop constraint if exists atividades_cliente_id_fkey,
  add constraint atividades_cliente_id_fkey
  foreign key (cliente_id) references public.clientes(id) on delete cascade;

create table if not exists public.contatos_cliente (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  contato_id uuid not null references public.contatos(id) on delete cascade,
  principal boolean not null default false,
  unique (cliente_id, contato_id)
);

-- ── Serviços do catálogo ────────────────────────────────────────
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  descricao text,
  preco_padrao numeric(14,2) not null default 0,
  recorrente boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ── Propostas comerciais ────────────────────────────────────────
create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  negocio_id uuid references public.negocios(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  contato_id uuid references public.contatos(id) on delete set null,

  numero text not null,
  titulo text not null,
  status status_proposta not null default 'rascunho',
  token_publico text not null unique default encode(gen_random_bytes(16), 'hex'),

  introducao text,
  escopo text,
  condicoes text,
  observacoes text,

  desconto numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  validade date,

  enviada_em timestamptz,
  visualizada_em timestamptz,
  respondida_em timestamptz,
  assinatura_nome text,
  assinatura_ip inet,

  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, numero)
);

create table if not exists public.itens_proposta (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  proposta_id uuid not null references public.propostas(id) on delete cascade,
  servico_id uuid references public.servicos(id) on delete set null,
  descricao text not null,
  quantidade numeric(10,2) not null default 1,
  valor_unitario numeric(14,2) not null default 0,
  recorrente boolean not null default true,
  ordem int not null default 0
);

-- ── Contratos ───────────────────────────────────────────────────
create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  proposta_id uuid references public.propostas(id) on delete set null,
  numero text not null,
  status status_contrato not null default 'ativo',
  valor_mensal numeric(14,2) not null default 0,
  fidelidade_meses int not null default 3,
  inicio date not null default current_date,
  fim date,
  renovacao_automatica boolean not null default true,
  arquivo_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, numero)
);

do $$
declare t text;
begin
  foreach t in array array['clientes','propostas','contratos'] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on public.%1$s;
       create trigger trg_%1$s_atualizado before update on public.%1$s
       for each row execute function public.tocar_atualizado_em();', t);
  end loop;
end $$;

-- Total da proposta recalculado a partir dos itens
create or replace function public.recalcular_total_proposta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  alvo uuid := coalesce(new.proposta_id, old.proposta_id);
begin
  update public.propostas p
  set total = greatest(
    coalesce((select sum(i.quantidade * i.valor_unitario) from public.itens_proposta i where i.proposta_id = alvo), 0) - p.desconto,
    0
  )
  where p.id = alvo;
  return null;
end;
$$;

drop trigger if exists trg_itens_proposta_total on public.itens_proposta;
create trigger trg_itens_proposta_total
after insert or update or delete on public.itens_proposta
for each row execute function public.recalcular_total_proposta();
