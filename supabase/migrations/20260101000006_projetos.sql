-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0006 — Operação: projetos, tarefas, criativos, arquivos
-- ════════════════════════════════════════════════════════════════

create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  nome text not null,
  descricao text,
  responsavel_id uuid references public.perfis(id) on delete set null,
  status text not null default 'ativo',        -- ativo | pausado | concluido
  inicio date,
  prazo date,
  progresso int not null default 0 check (progresso between 0 and 100),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  projeto_id uuid references public.projetos(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  titulo text not null,
  descricao text,
  status status_tarefa not null default 'backlog',
  prioridade prioridade not null default 'media',
  responsavel_id uuid references public.perfis(id) on delete set null,
  criado_por uuid references public.perfis(id) on delete set null,
  etiquetas text[] not null default '{}',
  estimativa_horas numeric(6,2),
  horas_gastas numeric(6,2) not null default 0,
  vence_em date,
  concluida_em timestamptz,
  ordem int not null default 0,
  recorrente boolean not null default false,
  recorrencia text,                             -- diaria | semanal | mensal
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_tarefas_org_status on public.tarefas(organizacao_id, status, ordem);
create index if not exists idx_tarefas_responsavel on public.tarefas(responsavel_id, status);

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  tarefa_id uuid references public.tarefas(id) on delete cascade,
  projeto_id uuid references public.projetos(id) on delete cascade,
  autor_id uuid references public.perfis(id) on delete set null,
  conteudo text not null,
  mencoes uuid[] not null default '{}',
  criado_em timestamptz not null default now()
);

create table if not exists public.arquivos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  projeto_id uuid references public.projetos(id) on delete cascade,
  tarefa_id uuid references public.tarefas(id) on delete cascade,
  nome text not null,
  caminho text not null,                        -- caminho no Supabase Storage
  mime text,
  tamanho_bytes bigint,
  visivel_ao_cliente boolean not null default false,
  enviado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Banco de criativos com performance associada
create table if not exists public.criativos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  nome text not null,
  formato text,                                 -- reels | estatico | carrossel | video | search | pmax
  angulo text,                                  -- prova social | dor | oferta | autoridade
  copy_principal text,
  cta text,
  arquivo_url text,
  miniatura_url text,
  id_externo text,                              -- ad_id na plataforma
  plataforma provedor_integracao,
  status text not null default 'em_teste',      -- em_teste | vencedor | pausado | reprovado
  aprovado_pelo_cliente boolean,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['projetos','tarefas','criativos'] loop
    execute format(
      'drop trigger if exists trg_%1$s_atualizado on public.%1$s;
       create trigger trg_%1$s_atualizado before update on public.%1$s
       for each row execute function public.tocar_atualizado_em();', t);
  end loop;
end $$;

create or replace function public.ao_concluir_tarefa()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'concluida' and old.status <> 'concluida' then
    new.concluida_em := now();
  elsif new.status <> 'concluida' then
    new.concluida_em := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ao_concluir_tarefa on public.tarefas;
create trigger trg_ao_concluir_tarefa before update on public.tarefas
for each row execute function public.ao_concluir_tarefa();
