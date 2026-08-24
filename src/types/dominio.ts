import type { Enums } from "./supabase";

export type Cliente = {
  id: string;
  organizacao_id: string;
  nome: string;
  slug: string;
  segmento: string | null;
  logo_url: string | null;
  status: Enums<"status_cliente">;
  fee_mensal: number;
  investimento_previsto: number;
  saude: number;
  nps: number | null;
  responsavel_id: string | null;
  inicio_contrato: string | null;
  fim_contrato: string | null;
};

export type Negocio = {
  id: string;
  titulo: string;
  etapa_id: string;
  funil_id: string;
  valor_mensal: number;
  valor_unico: number;
  status: Enums<"status_negocio">;
  temperatura: Enums<"temperatura_lead">;
  origem: string | null;
  responsavel_id: string | null;
  previsao_fechamento: string | null;
  ordem_kanban: number;
  contato?: { nome: string; email: string | null; telefone: string | null } | null;
};

export type EtapaFunil = {
  id: string;
  nome: string;
  ordem: number;
  probabilidade: number;
  cor: string | null;
  tipo: string;
};

export type MetricaDia = {
  data: string;
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  compras: number;
  receita: number;
};

export type ResumoMetricas = {
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  compras: number;
  receita: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cpa: number;
  roas: number;
};
