-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0014 — Papéis comercial e marketing
--
-- A agência separa quem vende de quem executa a mídia, e nenhum dos
-- dois deve enxergar o financeiro. O enum original só tinha papéis
-- genéricos ('gestor', 'operador'), que não distinguem os dois.
--
-- A RLS não precisa mudar: `e_equipe` aceita tudo que não é 'cliente',
-- então os dois entram como equipe; e `e_gestor` lista os três papéis
-- administrativos pelo nome, então os dois ficam de fora do que é
-- restrito a administração. É a matriz em `src/lib/papeis.ts` que
-- decide o que cada um abre na interface.
--
-- `add value` vai sozinho neste arquivo de propósito: o Postgres não
-- deixa usar um valor novo de enum na mesma transação em que ele é
-- criado, então nada aqui pode referenciá-los.
-- ════════════════════════════════════════════════════════════════

alter type papel_usuario add value if not exists 'comercial';
alter type papel_usuario add value if not exists 'marketing';
