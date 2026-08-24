-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0009 — Row Level Security
-- Regra geral:
--   · equipe (papel <> 'cliente') → leitura e escrita na organização
--   · cliente                     → leitura apenas dos registros das
--                                   contas liberadas em clientes_permitidos
-- ════════════════════════════════════════════════════════════════

-- ── Organizações e perfis ───────────────────────────────────────
alter table public.organizacoes enable row level security;
drop policy if exists org_ler on public.organizacoes;
create policy org_ler on public.organizacoes
  for select using (public.e_membro(id));
drop policy if exists org_escrever on public.organizacoes;
create policy org_escrever on public.organizacoes
  for update using (public.e_gestor(id)) with check (public.e_gestor(id));

alter table public.perfis enable row level security;
drop policy if exists perfil_ler on public.perfis;
create policy perfil_ler on public.perfis
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.membros_organizacao m1
      join public.membros_organizacao m2 on m1.organizacao_id = m2.organizacao_id
      where m1.usuario_id = auth.uid() and m2.usuario_id = public.perfis.id and m1.ativo and m2.ativo
    )
  );
drop policy if exists perfil_atualizar on public.perfis;
create policy perfil_atualizar on public.perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

alter table public.membros_organizacao enable row level security;
drop policy if exists membros_ler on public.membros_organizacao;
create policy membros_ler on public.membros_organizacao
  for select using (usuario_id = auth.uid() or public.e_membro(organizacao_id));
drop policy if exists membros_gerir on public.membros_organizacao;
create policy membros_gerir on public.membros_organizacao
  for all using (public.e_gestor(organizacao_id)) with check (public.e_gestor(organizacao_id));

-- ── Políticas genéricas por organização ─────────────────────────
do $$
declare
  r record;
  tem_cliente boolean;
  cond_leitura text;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'organizacao_id'
      and t.table_type = 'BASE TABLE'
      and c.table_name not in ('organizacoes','perfis','membros_organizacao')
  loop
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = r.table_name and column_name = 'cliente_id'
    ) into tem_cliente;

    if tem_cliente then
      cond_leitura := format(
        '(public.e_equipe(organizacao_id) or (cliente_id is not null and public.pode_ver_cliente(organizacao_id, cliente_id)))'
      );
    else
      cond_leitura := 'public.e_equipe(organizacao_id)';
    end if;

    execute format('alter table public.%I enable row level security;', r.table_name);

    execute format('drop policy if exists %I on public.%I;', r.table_name || '_ler', r.table_name);
    execute format(
      'create policy %I on public.%I for select using (%s);',
      r.table_name || '_ler', r.table_name, cond_leitura
    );

    execute format('drop policy if exists %I on public.%I;', r.table_name || '_escrever', r.table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.e_equipe(organizacao_id))
         with check (public.e_equipe(organizacao_id));',
      r.table_name || '_escrever', r.table_name
    );
  end loop;
end $$;

-- ── Notificações: cada um vê as suas ────────────────────────────
drop policy if exists notificacoes_ler on public.notificacoes;
create policy notificacoes_ler on public.notificacoes
  for select using (usuario_id = auth.uid() or public.e_gestor(organizacao_id));
drop policy if exists notificacoes_marcar on public.notificacoes;
create policy notificacoes_marcar on public.notificacoes
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ── Integrações: apenas gestores manipulam credenciais ──────────
drop policy if exists integracoes_escrever on public.integracoes;
create policy integracoes_escrever on public.integracoes
  for all to authenticated
  using (public.e_gestor(organizacao_id))
  with check (public.e_gestor(organizacao_id));

-- ── Financeiro: cliente nunca vê despesas da agência ────────────
drop policy if exists lancamentos_ler on public.lancamentos;
create policy lancamentos_ler on public.lancamentos
  for select using (
    public.e_equipe(organizacao_id)
    or (tipo = 'receita' and cliente_id is not null and public.pode_ver_cliente(organizacao_id, cliente_id))
  );

-- ── Auditoria é somente leitura para gestores ───────────────────
drop policy if exists auditoria_escrever on public.auditoria;
drop policy if exists auditoria_ler on public.auditoria;
create policy auditoria_ler on public.auditoria
  for select using (public.e_gestor(organizacao_id));

-- ── Leads: gravados pelo service role (API pública) ─────────────
drop policy if exists leads_escrever on public.leads;
create policy leads_ler_equipe on public.leads
  for select using (organizacao_id is null or public.e_equipe(organizacao_id));
