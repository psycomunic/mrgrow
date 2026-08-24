-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0003 — CRM: funis, leads, negócios, atividades
-- ════════════════════════════════════════════════════════════════

create table if not exists public.funis (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  descricao text,
  padrao boolean not null default false,
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.etapas_funil (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  funil_id uuid not null references public.funis(id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  probabilidade int not null default 10 check (probabilidade between 0 and 100),
  cor text default '#1668f5',
  tipo text not null default 'aberta',      -- aberta | ganho | perdido
  criado_em timestamptz not null default now()
);

create index if not exists idx_etapas_funil on public.etapas_funil(funil_id, ordem);

create table if not exists public.contatos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  email citext,
  telefone text,
  cargo text,
  empresa text,
  instagram text,
  site text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_contatos_busca on public.contatos using gin (nome gin_trgm_ops);

create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  funil_id uuid not null references public.funis(id) on delete cascade,
  etapa_id uuid not null references public.etapas_funil(id) on delete restrict,
  contato_id uuid references public.contatos(id) on delete set null,
  cliente_id uuid,                            -- preenchido ao converter (FK adicionada em 0004)
  responsavel_id uuid references public.perfis(id) on delete set null,

  titulo text not null,
  valor_mensal numeric(14,2) not null default 0,
  valor_unico numeric(14,2) not null default 0,
  moeda text not null default 'BRL',
  status status_negocio not null default 'aberto',
  temperatura temperatura_lead not null default 'morno',

  origem text,                                -- meta_ads | google_ads | indicacao | organico | outbound ...
  utm jsonb not null default '{}'::jsonb,
  campos_extras jsonb not null default '{}'::jsonb,
  motivo_perda text,

  previsao_fechamento date,
  fechado_em timestamptz,
  ordem_kanban int not null default 0,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_negocios_org_etapa on public.negocios(organizacao_id, etapa_id, ordem_kanban);
create index if not exists idx_negocios_status on public.negocios(organizacao_id, status, criado_em desc);

create table if not exists public.historico_etapas (
  id bigserial primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  etapa_origem uuid references public.etapas_funil(id) on delete set null,
  etapa_destino uuid references public.etapas_funil(id) on delete set null,
  usuario_id uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);

create table if not exists public.atividades (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  negocio_id uuid references public.negocios(id) on delete cascade,
  contato_id uuid references public.contatos(id) on delete cascade,
  cliente_id uuid,
  tipo text not null default 'nota',          -- nota | ligacao | reuniao | email | whatsapp | tarefa
  titulo text,
  conteudo text,
  concluida boolean not null default false,
  vence_em timestamptz,
  usuario_id uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_atividades_negocio on public.atividades(negocio_id, criado_em desc);

-- Leads brutos capturados pela landing page / formulários / integrações
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references public.organizacoes(id) on delete cascade,
  nome text not null,
  email citext,
  telefone text,
  empresa text,
  instagram text,
  faturamento_mensal text,
  investimento_trafego text,
  servico_desejado text,
  mensagem text,
  origem text not null default 'landing_page',
  utm jsonb not null default '{}'::jsonb,
  pagina text,
  referrer text,
  user_agent text,
  ip inet,
  fbclid text,
  gclid text,
  pontuacao int not null default 0,
  negocio_id uuid references public.negocios(id) on delete set null,
  processado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists idx_leads_criado on public.leads(criado_em desc);

do $$
declare t text;
begin
  foreach t in array array['funis','contatos','negocios','atividades'] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on public.%1$s;
       create trigger trg_%1$s_atualizado before update on public.%1$s
       for each row execute function public.tocar_atualizado_em();', t);
  end loop;
end $$;

-- Registra automaticamente a troca de etapa
create or replace function public.ao_mover_negocio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.etapa_id is distinct from old.etapa_id then
    insert into public.historico_etapas (organizacao_id, negocio_id, etapa_origem, etapa_destino, usuario_id)
    values (new.organizacao_id, new.id, old.etapa_id, new.etapa_id, auth.uid());
  end if;
  if new.status in ('ganho','perdido') and old.status = 'aberto' then
    new.fechado_em := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ao_mover_negocio on public.negocios;
create trigger trg_ao_mover_negocio before update on public.negocios
for each row execute function public.ao_mover_negocio();
