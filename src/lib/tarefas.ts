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
  responsavel: string | null;
  vence_em: string | null;
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
      responsavel: t.responsavel,
      vence_em: t.vence_em,
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
  vence_em: string | null;
  ordem: number | null;
  clientes: { nome: string } | { nome: string }[] | null;
  perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
};

/** O join do Supabase devolve objeto ou array conforme a cardinalidade. */
function um<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
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
        "id, titulo, descricao, status, prioridade, cliente_id, vence_em, ordem, clientes(nome), perfis:responsavel_id(nome_completo)",
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
        responsavel: um(t.perfis)?.nome_completo ?? null,
        vence_em: t.vence_em,
        ordem: t.ordem ?? 0,
      })),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarTarefas", e);
    return VAZIO;
  }
}
