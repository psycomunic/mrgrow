-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0008 — Motor de automações, relatórios e views
-- ════════════════════════════════════════════════════════════════

create table if not exists public.automacoes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  descricao text,
  ativa boolean not null default true,
  gatilho gatilho_automacao not null,
  -- Ex.: {"etapa_id":"...","dias_antes":3,"indicador":"roas","operador":"<","valor":2}
  condicoes jsonb not null default '{}'::jsonb,
  -- Ex.: [{"tipo":"notificar","para":"responsavel"},{"tipo":"whatsapp","template":"cobranca"}]
  acoes jsonb not null default '[]'::jsonb,
  agendamento text,                              -- cron, quando gatilho = 'agendado'
  execucoes int not null default 0,
  ultima_execucao_em timestamptz,
  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.execucoes_automacao (
  id bigserial primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  automacao_id uuid not null references public.automacoes(id) on delete cascade,
  status status_execucao not null default 'sucesso',
  contexto jsonb not null default '{}'::jsonb,
  resultado jsonb not null default '{}'::jsonb,
  erro text,
  duracao_ms int,
  criado_em timestamptz not null default now()
);

create index if not exists idx_execucoes_automacao on public.execucoes_automacao(automacao_id, criado_em desc);

-- ── Relatórios recorrentes para o cliente ───────────────────────
create table if not exists public.relatorios (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  nome text not null,
  periodicidade text not null default 'mensal',  -- semanal | quinzenal | mensal
  formato text not null default 'link',          -- link | pdf | email
  destinatarios text[] not null default '{}',
  blocos jsonb not null default '[]'::jsonb,     -- widgets escolhidos
  token_publico text not null unique default encode(gen_random_bytes(16), 'hex'),
  ativo boolean not null default true,
  ultimo_envio_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ── Webhooks de entrada/saída ───────────────────────────────────
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  direcao text not null default 'saida',         -- entrada | saida
  url text,
  segredo text default encode(gen_random_bytes(16), 'hex'),
  eventos text[] not null default '{}',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.eventos_webhook (
  id bigserial primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  webhook_id uuid references public.webhooks(id) on delete cascade,
  evento text not null,
  carga jsonb not null default '{}'::jsonb,
  status_http int,
  resposta text,
  criado_em timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['automacoes','relatorios'] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on public.%1$s;
       create trigger trg_%1$s_atualizado before update on public.%1$s
       for each row execute function public.tocar_atualizado_em();', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════
-- Views analíticas
-- ════════════════════════════════════════════════════════════════

create or replace view public.vw_mrr as
select
  c.organizacao_id,
  date_trunc('month', current_date)::date as competencia,
  sum(c.fee_mensal) filter (where c.status = 'ativo') as mrr,
  count(*) filter (where c.status = 'ativo') as clientes_ativos,
  case when count(*) filter (where c.status = 'ativo') > 0
       then sum(c.fee_mensal) filter (where c.status = 'ativo') / count(*) filter (where c.status = 'ativo')
       else 0 end as ticket_medio
from public.clientes c
group by c.organizacao_id;

create or replace view public.vw_funil_resumo as
select
  n.organizacao_id,
  n.funil_id,
  e.id as etapa_id,
  e.nome as etapa,
  e.ordem,
  count(n.id) filter (where n.status = 'aberto') as negocios,
  coalesce(sum(n.valor_mensal) filter (where n.status = 'aberto'), 0) as valor_mensal,
  coalesce(sum(n.valor_unico) filter (where n.status = 'aberto'), 0) as valor_unico
from public.etapas_funil e
left join public.negocios n on n.etapa_id = e.id
group by n.organizacao_id, n.funil_id, e.id, e.nome, e.ordem;

create or replace view public.vw_desempenho_cliente as
select
  m.organizacao_id,
  m.cliente_id,
  m.data,
  sum(m.investimento) as investimento,
  sum(m.impressoes) as impressoes,
  sum(m.cliques) as cliques,
  sum(m.leads) as leads,
  sum(m.compras) as compras,
  sum(m.receita) as receita,
  case when sum(m.investimento) > 0 then sum(m.receita) / sum(m.investimento) else 0 end as roas,
  case when sum(m.leads) > 0 then sum(m.investimento) / sum(m.leads) else 0 end as cpl,
  case when sum(m.cliques) > 0 then sum(m.investimento) / sum(m.cliques) else 0 end as cpc,
  case when sum(m.impressoes) > 0 then (sum(m.cliques)::numeric / sum(m.impressoes)) * 100 else 0 end as ctr
from public.metricas_diarias m
group by m.organizacao_id, m.cliente_id, m.data;

create or replace view public.vw_fluxo_caixa as
select
  l.organizacao_id,
  date_trunc('month', l.competencia)::date as competencia,
  sum(l.valor) filter (where l.tipo = 'receita') as receitas,
  sum(l.valor) filter (where l.tipo = 'despesa') as despesas,
  sum(l.valor) filter (where l.tipo = 'receita') - coalesce(sum(l.valor) filter (where l.tipo = 'despesa'), 0) as resultado,
  sum(l.valor) filter (where l.tipo = 'receita' and l.status = 'atrasado') as inadimplencia
from public.lancamentos l
where l.status <> 'cancelado'
group by l.organizacao_id, date_trunc('month', l.competencia);
