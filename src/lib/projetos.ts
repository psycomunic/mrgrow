import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_PROJETOS } from "@/lib/demo";

export type Projeto = {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  progresso: number;
  prazo: string | null;
  cliente: string | null;
  cliente_id: string | null;
  responsavel: string | null;
};

export type Portfolio = { projetos: Projeto[]; demo: boolean };

function demo(): Portfolio {
  return {
    projetos: DEMO_PROJETOS.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: null,
      status: p.status,
      progresso: p.progresso,
      prazo: p.prazo,
      cliente: p.cliente,
      cliente_id: null,
      responsavel: p.responsavel,
    })),
    demo: true,
  };
}

const VAZIO: Portfolio = { projetos: [], demo: false };

type Linha = {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  progresso: number | null;
  prazo: string | null;
  cliente_id: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
  perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
};

function um<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function carregarProjetos(): Promise<Portfolio> {
  if (modoDemonstracao()) return demo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return VAZIO;

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("projetos")
      .select(
        "id, nome, descricao, status, progresso, prazo, cliente_id, clientes(nome), perfis:responsavel_id(nome_completo)",
      )
      .eq("organizacao_id", sessao.organizacaoId)
      /* Concluído no fim: o que está em execução é o que precisa de atenção.
         `nullsFirst: false` põe quem não tem prazo depois de quem tem. */
      .order("status", { ascending: true })
      .order("prazo", { ascending: true, nullsFirst: false })
      .limit(200);

    if (error) {
      registrarFalha("carregarProjetos", error);
      return VAZIO;
    }

    return {
      projetos: ((data ?? []) as unknown as Linha[]).map((p) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        status: p.status,
        progresso: p.progresso ?? 0,
        prazo: p.prazo,
        cliente: um(p.clientes)?.nome ?? null,
        cliente_id: p.cliente_id,
        responsavel: um(p.perfis)?.nome_completo ?? null,
      })),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarProjetos", e);
    return VAZIO;
  }
}
