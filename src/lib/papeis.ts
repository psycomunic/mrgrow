/**
 * Matriz de permissões da plataforma.
 * A RLS no Postgres é a barreira real; isto controla a interface.
 */

export type Papel =
  | "proprietario"
  | "administrador"
  | "gestor"
  | "comercial"
  | "marketing"
  | "operador"
  | "financeiro"
  | "cliente";

export const ROTULO_PAPEL: Record<Papel, string> = {
  proprietario: "Proprietário",
  administrador: "Administrador",
  gestor: "Gestor",
  comercial: "Comercial",
  marketing: "Marketing",
  operador: "Operador",
  financeiro: "Financeiro",
  cliente: "Cliente",
};

export type Recurso =
  | "visao"
  | "crm"
  | "clientes"
  | "propostas"
  | "financeiro"
  | "projetos"
  | "tarefas"
  | "metricas"
  | "integracoes"
  | "automacoes"
  | "relatorios"
  | "equipe"
  | "configuracoes";

export type Acao = "ver" | "criar" | "editar" | "excluir";

const TUDO: Acao[] = ["ver", "criar", "editar", "excluir"];
const LEITURA: Acao[] = ["ver"];
const EDICAO: Acao[] = ["ver", "criar", "editar"];

export const MATRIZ: Record<Papel, Partial<Record<Recurso, Acao[]>>> = {
  proprietario: {
    visao: TUDO, crm: TUDO, clientes: TUDO, propostas: TUDO, financeiro: TUDO,
    projetos: TUDO, tarefas: TUDO, metricas: TUDO, integracoes: TUDO,
    automacoes: TUDO, relatorios: TUDO, equipe: TUDO, configuracoes: TUDO,
  },
  administrador: {
    visao: TUDO, crm: TUDO, clientes: TUDO, propostas: TUDO, financeiro: TUDO,
    projetos: TUDO, tarefas: TUDO, metricas: TUDO, integracoes: TUDO,
    automacoes: TUDO, relatorios: TUDO, equipe: TUDO, configuracoes: EDICAO,
  },
  gestor: {
    visao: LEITURA, crm: TUDO, clientes: EDICAO, propostas: TUDO, financeiro: LEITURA,
    projetos: TUDO, tarefas: TUDO, metricas: LEITURA, integracoes: EDICAO,
    automacoes: EDICAO, relatorios: EDICAO, equipe: LEITURA,
  },
  /* Comercial vive no funil: fecha negócio, monta proposta e cadastra a
     conta que entra. Não toca em mídia nem em dinheiro — vê o próprio
     resultado em Métricas, e só. */
  comercial: {
    visao: LEITURA, crm: TUDO, propostas: TUDO, clientes: EDICAO,
    tarefas: TUDO, projetos: LEITURA, metricas: LEITURA, relatorios: LEITURA,
  },
  /* Marketing toca a entrega: campanha, criativo, projeto e relatório.
     Enxerga o funil para saber o que está entrando, mas não mexe nele. */
  marketing: {
    visao: LEITURA, crm: LEITURA, clientes: LEITURA,
    projetos: TUDO, tarefas: TUDO, metricas: LEITURA,
    integracoes: EDICAO, automacoes: EDICAO, relatorios: TUDO,
  },
  operador: {
    visao: LEITURA, crm: EDICAO, clientes: LEITURA, propostas: LEITURA,
    projetos: EDICAO, tarefas: TUDO, metricas: LEITURA, relatorios: LEITURA,
  },
  financeiro: {
    visao: LEITURA, clientes: LEITURA, propostas: LEITURA, financeiro: TUDO,
    relatorios: LEITURA,
  },
  cliente: {
    metricas: LEITURA, relatorios: LEITURA, tarefas: LEITURA, financeiro: LEITURA,
  },
};

export function pode(papel: Papel | null | undefined, recurso: Recurso, acao: Acao = "ver") {
  if (!papel) return false;
  return MATRIZ[papel]?.[recurso]?.includes(acao) ?? false;
}

export const ehEquipe = (papel?: Papel | null) => !!papel && papel !== "cliente";
