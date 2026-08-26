-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0011 — Marca do destinatário na proposta
--
-- A proposta costuma ir para prospect, que ainda não é cliente e por
-- isso não tem linha em `clientes`. Sem estes campos não haveria onde
-- guardar o nome e o logotipo que abrem o documento.
-- ════════════════════════════════════════════════════════════════

alter table public.propostas
  add column if not exists cliente_nome text,
  add column if not exists cliente_logo_url text;

comment on column public.propostas.cliente_nome is
  'Nome exibido na capa. Usado quando a proposta ainda não tem cliente_id.';
comment on column public.propostas.cliente_logo_url is
  'URL do logotipo do destinatário, exibido na capa do documento público.';
