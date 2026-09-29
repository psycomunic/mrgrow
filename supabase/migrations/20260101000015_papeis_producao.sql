-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0015 — Papéis de produção
--
-- Quem executa a entrega não é um bloco só. Web design monta página e
-- site, social media produz e publica conteúdo, e o editor corta vídeo.
-- Os três compartilham projetos e tarefas, mas nenhum precisa do funil,
-- do financeiro ou das configurações — e 'operador', que era onde todos
-- caíam, abre o CRM.
--
-- A RLS não muda: `e_equipe` aceita tudo que não é 'cliente', então os
-- três entram como equipe; e `e_gestor` lista os papéis administrativos
-- pelo nome, então ficam de fora do que é restrito a administração. É a
-- matriz em `src/lib/papeis.ts` que decide o que cada um abre na tela.
--
-- `add value` vai sozinho neste arquivo de propósito: o Postgres não
-- deixa usar um valor novo de enum na mesma transação em que ele é
-- criado, então nada aqui pode referenciá-los.
-- ════════════════════════════════════════════════════════════════

alter type papel_usuario add value if not exists 'web_design';
alter type papel_usuario add value if not exists 'social_media';
alter type papel_usuario add value if not exists 'editor_video';
