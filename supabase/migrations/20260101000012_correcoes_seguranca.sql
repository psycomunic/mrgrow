-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0012 — Correções de segurança e integridade
--
-- Cinco problemas concretos, cada um com o cenário que ele permitia:
--
--  1. `leads_ler_equipe` valia também para o papel `anon` e liberava todo
--     lead com `organizacao_id` nulo. Como a chave anônima é pública por
--     definição (vai no bundle do browser), qualquer visitante podia ler
--     nome, e-mail, telefone, faturamento declarado e IP desses leads.
--  2. `marcar_lancamentos_atrasados()` é SECURITY DEFINER, altera
--     lançamentos de TODAS as organizações e estava com EXECUTE para
--     PUBLIC — ou seja, exposta como RPC para qualquer um com a chave
--     anônima.
--  3. O índice único de `metricas_diarias` era sobre uma expressão
--     (`coalesce(campanha_id, uuid-zero)`), então o `ON CONFLICT
--     (conta_externa_id, campanha_id, data)` do código não batia com
--     índice nenhum: o Postgres respondia 42P10 e a sincronização de
--     métricas nunca gravava uma linha.
--  4. `execucoes_automacao` não tinha como saber que um fato já havia sido
--     processado, e o cron horário redisparava o mesmo gatilho 24 vezes ao
--     dia (24 cobranças por WhatsApp para a mesma fatura atrasada).
--  5. Datas de negócio decididas em UTC: entre 21h e meia-noite em
--     Brasília o servidor já está no dia seguinte.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Leads: nunca legíveis por visitante anônimo ──────────────

-- Adota os leads órfãos, se houver uma organização evidente para eles.
do $$
declare
  destino uuid;
begin
  if exists (select 1 from public.leads where organizacao_id is null) then
    select id into destino from public.organizacoes order by criado_em limit 1;
    if destino is not null then
      update public.leads set organizacao_id = destino where organizacao_id is null;
      raise notice 'leads órfãos adotados pela organização %', destino;
    end if;
  end if;
end $$;

-- Com todos adotados, a coluna passa a ser obrigatória: é a garantia de que
-- nenhum lead novo volte a nascer fora do alcance da RLS.
do $$
begin
  if not exists (select 1 from public.leads where organizacao_id is null) then
    alter table public.leads alter column organizacao_id set not null;
  else
    raise warning 'leads sem organizacao_id continuam existindo — NOT NULL não aplicado';
  end if;
end $$;

drop policy if exists leads_ler_equipe on public.leads;
create policy leads_ler_equipe on public.leads
  for select to authenticated
  using (public.e_equipe(organizacao_id));

-- ── 2. Função de manutenção fora do alcance da API pública ──────

-- Agora aceita uma organização (opcional) e usa o fuso da agência em vez do
-- fuso do servidor. Sem argumento, é a varredura global do cron.
create or replace function public.marcar_lancamentos_atrasados(org uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  afetados int;
  dia date := (timezone('America/Sao_Paulo', now()))::date;
begin
  update public.lancamentos
  set status = 'atrasado'
  where status in ('pendente','previsto')
    and vencimento < dia
    and (org is null or organizacao_id = org);
  get diagnostics afetados = row_count;
  return afetados;
end;
$$;

-- A assinatura antiga (sem argumento) deixa de existir para não ficar uma
-- porta aberta com as permissões velhas.
drop function if exists public.marcar_lancamentos_atrasados();

revoke all on function public.marcar_lancamentos_atrasados(uuid) from public;
revoke all on function public.marcar_lancamentos_atrasados(uuid) from anon;
revoke all on function public.marcar_lancamentos_atrasados(uuid) from authenticated;
grant execute on function public.marcar_lancamentos_atrasados(uuid) to service_role;

-- ── 3. Índice único que corresponde ao ON CONFLICT do código ────

drop index if exists public.idx_metricas_unicas;

-- `nulls not distinct` é o que faz a linha agregada da conta (campanha nula)
-- conflitar consigo mesma. Sem isso, cada execução da sincronização criaria
-- uma linha nova para o mesmo dia, porque no Postgres NULL nunca é igual a
-- NULL num índice único comum.
create unique index if not exists idx_metricas_unicas
  on public.metricas_diarias (conta_externa_id, campanha_id, data) nulls not distinct;

-- ── 4. Deduplicação das automações disparadas por tempo ─────────

alter table public.execucoes_automacao
  add column if not exists chave_dedupe text;

create unique index if not exists idx_execucoes_dedupe
  on public.execucoes_automacao (chave_dedupe)
  where chave_dedupe is not null;

comment on column public.execucoes_automacao.chave_dedupe is
  'Chave estável por fato+dia+automação (ex.: fatura_atrasada:<id>:2026-08-26:<automacao>). Impede que o cron horário reprocesse o mesmo fato.';

-- ── 5. Datas de negócio no fuso da agência ──────────────────────

create or replace function public.hoje_agencia()
returns date
language sql
stable
set search_path = public
as $$ select (timezone('America/Sao_Paulo', now()))::date $$;

comment on function public.hoje_agencia() is
  'Data corrente no fuso da agência. Usar em vez de current_date em qualquer regra de vencimento, prazo ou competência.';

-- ── Rede de segurança: nenhuma tabela de `public` sem RLS ───────

-- O bloco de políticas da 0009 percorre o catálogo no momento em que roda,
-- então qualquer tabela criada depois nasceria sem RLS — e com os grants
-- default do Supabase para `anon`. Ligar RLS sem policy nega tudo, que é o
-- padrão seguro: quem criar tabela nova precisa declarar a policy junto.
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security;', r.relname);
    raise notice 'RLS ligada em public.% (sem policy: nega tudo até declarar)', r.relname;
  end loop;
end $$;
