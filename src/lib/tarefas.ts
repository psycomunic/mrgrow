import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_TAREFAS } from "@/lib/demo";

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  cliente: string | null;
  cliente_id: string | null;
  projeto: string | null;
  projeto_id: string | null;
  /** Nome de quem responde, para a tela. */
  responsavel: string | null;
  /** Id de quem responde, para o formulário e os filtros. */
  responsavel_id: string | null;
  vence_em: string | null;
  /** Rótulos livres da equipe: "criativo", "tracking", "relatório"… */
  etiquetas: string[];
  estimativa_horas: number | null;
  horas_gastas: number;
  recorrente: boolean;
  recorrencia: string | null;
  ordem: number;
};

export type Quadro = { tarefas: Tarefa[]; demo: boolean };

function demo(): Quadro {
  return {
    tarefas: DEMO_TAREFAS.map((t, i) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: null,
      status: t.status,
      prioridade: t.prioridade,
      cliente: t.cliente,
      cliente_id: null,
      projeto: null,
      projeto_id: null,
      responsavel: t.responsavel,
      responsavel_id: t.responsavel_id,
      vence_em: t.vence_em,
      etiquetas: t.etiquetas ?? [],
      estimativa_horas: t.estimativa_horas ?? null,
      horas_gastas: t.horas_gastas ?? 0,
      recorrente: t.recorrente ?? false,
      recorrencia: t.recorrencia ?? null,
      ordem: i,
    })),
    demo: true,
  };
}

const VAZIO: Quadro = { tarefas: [], demo: false };

type Linha = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  cliente_id: string | null;
  projeto_id: string | null;
  responsavel_id: string | null;
  vence_em: string | null;
  etiquetas: string[] | null;
  estimativa_horas: number | string | null;
  horas_gastas: number | string | null;
  recorrente: boolean | null;
  recorrencia: string | null;
  ordem: number | null;
  clientes: { nome: string } | { nome: string }[] | null;
  projetos: { nome: string } | { nome: string }[] | null;
  perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
};

/** O join do Supabase devolve objeto ou array conforme a cardinalidade. */
function um<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/* `numeric` volta do Postgres como string para não perder precisão. Somar sem
   converter concatenaria: "2" + "3" daria "23" horas gastas. */
function numerico(v: number | string | null): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function carregarTarefas(): Promise<Quadro> {
  if (modoDemonstracao()) return demo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return VAZIO;

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("tarefas")
      .select(
        "id, titulo, descricao, status, prioridade, cliente_id, projeto_id, responsavel_id, vence_em, etiquetas, estimativa_horas, horas_gastas, recorrente, recorrencia, ordem, clientes(nome), projetos(nome), perfis:responsavel_id(nome_completo)",
      )
      .eq("organizacao_id", sessao.organizacaoId)
      .order("ordem", { ascending: true })
      .order("criado_em", { ascending: false })
      .limit(400);

    if (error) {
      registrarFalha("carregarTarefas", error);
      return VAZIO;
    }

    return {
      tarefas: ((data ?? []) as unknown as Linha[]).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        status: t.status,
        prioridade: t.prioridade,
        cliente: um(t.clientes)?.nome ?? null,
        cliente_id: t.cliente_id,
        projeto: um(t.projetos)?.nome ?? null,
        projeto_id: t.projeto_id,
        responsavel: um(t.perfis)?.nome_completo ?? null,
        responsavel_id: t.responsavel_id,
        vence_em: t.vence_em,
        etiquetas: t.etiquetas ?? [],
        estimativa_horas: numerico(t.estimativa_horas),
        horas_gastas: numerico(t.horas_gastas) ?? 0,
        recorrente: t.recorrente ?? false,
        recorrencia: t.recorrencia,
        ordem: t.ordem ?? 0,
      })),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarTarefas", e);
    return VAZIO;
  }
}
