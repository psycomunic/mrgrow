-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0005 — Financeiro: categorias, lançamentos, faturas
-- ════════════════════════════════════════════════════════════════

create table if not exists public.categorias_financeiras (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  tipo tipo_lancamento not null,
  cor text default '#1668f5',
  centro_custo text,
  criado_em timestamptz not null default now(),
  unique (organizacao_id, nome, tipo)
);

create table if not exists public.contas_bancarias (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  instituicao text,
  saldo_inicial numeric(14,2) not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  contrato_id uuid references public.contratos(id) on delete set null,
  categoria_id uuid references public.categorias_financeiras(id) on delete set null,
  conta_id uuid references public.contas_bancarias(id) on delete set null,

  tipo tipo_lancamento not null,
  status status_lancamento not null default 'pendente',
  descricao text not null,
  valor numeric(14,2) not null check (valor >= 0),
  valor_pago numeric(14,2) not null default 0,

  competencia date not null default current_date,
  vencimento date not null default current_date,
  pago_em date,

  recorrente boolean not null default false,
  recorrencia_meses int,
  lancamento_pai_id uuid references public.lancamentos(id) on delete set null,

  forma_pagamento text,                       -- pix | boleto | cartao | transferencia
  documento_url text,
  gateway text,                               -- asaas | stripe | manual
  gateway_id text,
  observacoes text,

  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_lancamentos_org_venc on public.lancamentos(organizacao_id, vencimento);
create index if not exists idx_lancamentos_cliente on public.lancamentos(cliente_id, competencia desc);
create index if not exists idx_lancamentos_status on public.lancamentos(organizacao_id, status, tipo);

create table if not exists public.faturas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  contrato_id uuid references public.contratos(id) on delete set null,
  numero text not null,
  competencia date not null,
  vencimento date not null,
  total numeric(14,2) not null default 0,
  status status_lancamento not null default 'pendente',
  link_pagamento text,
  nota_fiscal_url text,
  enviada_em timestamptz,
  paga_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (organizacao_id, numero)
);

create table if not exists public.itens_fatura (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  fatura_id uuid not null references public.faturas(id) on delete cascade,
  descricao text not null,
  quantidade numeric(10,2) not null default 1,
  valor_unitario numeric(14,2) not null default 0,
  ordem int not null default 0
);

-- ── Metas financeiras / comerciais ──────────────────────────────
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  usuario_id uuid references public.perfis(id) on delete cascade,
  indicador text not null,                    -- mrr | receita | leads | roas | cpa | negocios_ganhos
  periodo date not null,                      -- primeiro dia do mês
  alvo numeric(14,2) not null default 0,
  criado_em timestamptz not null default now()
);

create unique index if not exists idx_metas_unicas on public.metas (
  organizacao_id,
  indicador,
  periodo,
  coalesce(cliente_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(usuario_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

do $$
declare t text;
begin
  foreach t in array array['lancamentos','faturas'] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on public.%1$s;
       create trigger trg_%1$s_atualizado before update on public.%1$s
       for each row execute function public.tocar_atualizado_em();', t);
  end loop;
end $$;

create or replace function public.recalcular_total_fatura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare alvo uuid := coalesce(new.fatura_id, old.fatura_id);
begin
  update public.faturas f
  set total = coalesce((select sum(i.quantidade * i.valor_unitario) from public.itens_fatura i where i.fatura_id = alvo), 0)
  where f.id = alvo;
  return null;
end;
$$;

drop trigger if exists trg_itens_fatura_total on public.itens_fatura;
create trigger trg_itens_fatura_total
after insert or update or delete on public.itens_fatura
for each row execute function public.recalcular_total_fatura();

-- Marca lançamentos vencidos como atrasados (chamado pelo cron)
create or replace function public.marcar_lancamentos_atrasados()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare afetados int;
begin
  update public.lancamentos
  set status = 'atrasado'
  where status in ('pendente','previsto')
    and vencimento < current_date;
  get diagnostics afetados = row_count;
  return afetados;
end;
$$;
