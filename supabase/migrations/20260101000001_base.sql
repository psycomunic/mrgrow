-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0001 — Extensões, tipos e utilitários
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "citext";

-- ── Enums ───────────────────────────────────────────────────────
do $$ begin
  create type papel_usuario as enum ('proprietario','administrador','gestor','operador','financeiro','cliente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_cliente as enum ('prospecto','onboarding','ativo','pausado','encerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_negocio as enum ('aberto','ganho','perdido','congelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type temperatura_lead as enum ('frio','morno','quente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_lancamento as enum ('receita','despesa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_lancamento as enum ('previsto','pendente','pago','atrasado','cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_proposta as enum ('rascunho','enviada','visualizada','aceita','recusada','expirada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_contrato as enum ('rascunho','ativo','suspenso','encerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_tarefa as enum ('backlog','fazendo','revisao','concluida','arquivada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prioridade as enum ('baixa','media','alta','urgente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type provedor_integracao as enum ('meta_ads','google_ads','google_analytics','google_search_console','tiktok_ads','whatsapp','asaas','stripe','slack','webhook');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_integracao as enum ('desconectada','conectada','expirada','erro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gatilho_automacao as enum (
    'lead_criado','negocio_mudou_etapa','negocio_ganho','negocio_perdido',
    'fatura_vencendo','fatura_atrasada','fatura_paga',
    'metrica_fora_da_meta','conta_sem_veiculacao','orcamento_estourado',
    'tarefa_atrasada','contrato_vencendo','agendado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_execucao as enum ('sucesso','falha','ignorada');
exception when duplicate_object then null; end $$;

-- ── updated_at automático ───────────────────────────────────────
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ── Slug ────────────────────────────────────────────────────────
create or replace function public.unaccent_simples(texto text)
returns text
language sql
immutable
as $$
  select translate(
    texto,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
  );
$$;

create or replace function public.gerar_slug(texto text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(public.unaccent_simples(texto)), '[^a-z0-9]+', '-', 'g'));
$$;
