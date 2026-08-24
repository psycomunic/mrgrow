/**
 * Tipos do banco.
 *
 * Este arquivo é um "stub" permissivo para o projeto compilar antes de você
 * conectar o Supabase. Depois de rodar as migrations, gere os tipos reais:
 *
 *   npx supabase link --project-ref <ref>
 *   npx supabase gen types typescript --linked > src/types/supabase.ts
 *
 * (ou `npm run db:types` com o Supabase local rodando)
 */

export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

/* eslint-disable @typescript-eslint/no-explicit-any */
type LinhaGenerica = Record<string, any>;

type TabelaGenerica = {
  Row: LinhaGenerica;
  Insert: LinhaGenerica;
  Update: LinhaGenerica;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: { [tabela: string]: TabelaGenerica };
    Views: { [view: string]: { Row: LinhaGenerica; Relationships: [] } };
    Functions: { [fn: string]: { Args: LinhaGenerica; Returns: any } };
    Enums: {
      papel_usuario: "proprietario" | "administrador" | "gestor" | "operador" | "financeiro" | "cliente";
      status_cliente: "prospecto" | "onboarding" | "ativo" | "pausado" | "encerrado";
      status_negocio: "aberto" | "ganho" | "perdido" | "congelado";
      temperatura_lead: "frio" | "morno" | "quente";
      tipo_lancamento: "receita" | "despesa";
      status_lancamento: "previsto" | "pendente" | "pago" | "atrasado" | "cancelado";
      status_proposta: "rascunho" | "enviada" | "visualizada" | "aceita" | "recusada" | "expirada";
      status_contrato: "rascunho" | "ativo" | "suspenso" | "encerrado";
      status_tarefa: "backlog" | "fazendo" | "revisao" | "concluida" | "arquivada";
      prioridade: "baixa" | "media" | "alta" | "urgente";
      provedor_integracao:
        | "meta_ads" | "google_ads" | "google_analytics" | "google_search_console"
        | "tiktok_ads" | "whatsapp" | "asaas" | "stripe" | "slack" | "webhook";
      status_integracao: "desconectada" | "conectada" | "expirada" | "erro";
      status_execucao: "sucesso" | "falha" | "ignorada";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tabelas<T extends string> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
