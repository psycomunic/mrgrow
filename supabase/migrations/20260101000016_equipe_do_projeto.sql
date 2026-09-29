-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0016 — Equipe do projeto
--
-- `projetos.responsavel_id` guarda uma pessoa só, e um projeto de
-- rebranding tem quem desenha, quem escreve e quem sobe a página. Com um
-- responsável apenas, ou o nome fica errado ou vira uma lista dentro do
-- campo de descrição — que ninguém consegue filtrar nem cobrar.
--
-- `frente` é o que a pessoa responde dentro do projeto: "Design",
-- "Copy", "Tráfego". Fica texto livre de propósito: cada projeto divide
-- o trabalho de um jeito, e uma lista fechada obrigaria a inventar
-- categoria para o caso que não coube.
--
-- O `responsavel_id` do projeto continua existindo e vira o responsável
-- principal — quem responde pelo todo quando a pergunta é "quem toca
-- isso?".
-- ════════════════════════════════════════════════════════════════

create table if not exists public.equipe_projeto (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  frente text,
  criado_em timestamptz not null default now(),
  -- A mesma pessoa não entra duas vezes no mesmo projeto; para responder
  -- por duas frentes, o texto acomoda ambas.
  unique (projeto_id, perfil_id)
);

create index if not exists idx_equipe_projeto on public.equipe_projeto(projeto_id);
create index if not exists idx_equipe_projeto_perfil on public.equipe_projeto(perfil_id);

-- ── RLS, no mesmo molde das demais tabelas da organização ───────
alter table public.equipe_projeto enable row level security;

drop policy if exists equipe_projeto_ler on public.equipe_projeto;
create policy equipe_projeto_ler on public.equipe_projeto
  for select using (public.e_equipe(organizacao_id));

drop policy if exists equipe_projeto_escrever on public.equipe_projeto;
create policy equipe_projeto_escrever on public.equipe_projeto
  for all to authenticated
  using (public.e_equipe(organizacao_id))
  with check (public.e_equipe(organizacao_id));

-- ── Próximos passos ─────────────────────────────────────────────
--
-- Vivem em `tarefas`, que já existe e já tem responsável, prazo, status e
-- quadro próprio. Criar uma segunda lista de afazeres dentro do projeto
-- produziria duas caixas de entrada para a mesma pessoa — e a que não
-- aparece no quadro é a que ninguém olha.
--
-- O que faltava era a ordem dentro do projeto: sem ela, "próximos
-- passos" sai na ordem em que foi digitado, que raramente é a ordem em
-- que se faz.
alter table public.tarefas
  add column if not exists ordem_projeto int not null default 0;

create index if not exists idx_tarefas_projeto_ordem
  on public.tarefas(projeto_id, ordem_projeto);
