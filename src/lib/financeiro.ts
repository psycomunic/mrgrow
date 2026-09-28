import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_LANCAMENTOS } from "@/lib/demo";

export type Lancamento = {
  id: string;
  descricao: string;
  cliente: string | null;
  cliente_id: string | null;
  tipo: string;
  status: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
  observacoes: string | null;
  /* Campos que a tabela já tinha e nenhuma tela lia. */
  competencia: string;
  valor_pago: number;
  forma_pagamento: string | null;
  categoria_id: string | null;
  categoria: string | null;
  /** Caminho do comprovante no Storage, quando houver. */
  comprovante: string | null;
  comprovante_nome: string | null;
};

export type Financeiro = { lancamentos: Lancamento[]; demo: boolean };

function demo(): Financeiro {
  return {
    lancamentos: DEMO_LANCAMENTOS.map((l) => ({
      id: l.id,
      descricao: l.descricao,
      cliente: l.cliente ?? null,
      cliente_id: null,
      tipo: l.tipo,
      status: l.status,
      valor: l.valor,
      vencimento: l.vencimento,
      pago_em: null,
      observacoes: null,
      competencia: l.vencimento.slice(0, 8) + "01",
      valor_pago: l.status === "pago" ? l.valor : 0,
      forma_pagamento: null,
      categoria_id: null,
      categoria: null,
      comprovante: null,
      comprovante_nome: null,
    })),
    demo: true,
  };
}

type Linha = {
  id: string;
  descricao: string;
  cliente_id: string | null;
  tipo: string;
  status: string;
  valor: number | string | null;
  vencimento: string;
  pago_em: string | null;
  observacoes: string | null;
  competencia: string;
  valor_pago: number | string | null;
  forma_pagamento: string | null;
  documento_url: string | null;
  categoria_id: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
  categorias_financeiras: { nome: string } | { nome: string }[] | null;
};

const VAZIO: Financeiro = { lancamentos: [], demo: false };

export async function carregarFinanceiro(): Promise<Financeiro> {
  if (modoDemonstracao()) return demo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return VAZIO;

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("lancamentos")
      .select(
        "id, descricao, cliente_id, tipo, status, valor, valor_pago, vencimento, competencia, pago_em, forma_pagamento, documento_url, categoria_id, observacoes, clientes(nome), categorias_financeiras(nome)",
      )
      .eq("organizacao_id", sessao.organizacaoId)
      .order("vencimento", { ascending: false })
      .limit(200);

    if (error) {
      registrarFalha("carregarFinanceiro", error);
      return VAZIO;
    }
    if (!data) return VAZIO;

    return {
      lancamentos: (data as unknown as Linha[]).map((l) => {
        const c = Array.isArray(l.clientes) ? l.clientes[0] : l.clientes;
        return {
          id: l.id,
          descricao: l.descricao,
          cliente: c?.nome ?? null,
          cliente_id: l.cliente_id,
          tipo: l.tipo,
          status: l.status,
          valor: Number(l.valor ?? 0),
          vencimento: l.vencimento,
          pago_em: l.pago_em,
          observacoes: l.observacoes,
          competencia: l.competencia,
          valor_pago: Number(l.valor_pago ?? 0),
          forma_pagamento: l.forma_pagamento,
          categoria_id: l.categoria_id,
          categoria:
            (Array.isArray(l.categorias_financeiras)
              ? l.categorias_financeiras[0]
              : l.categorias_financeiras)?.nome ?? null,
          comprovante: l.documento_url,
          /* O nome original fica na tabela `arquivos`; aqui vem o que o
             caminho guarda, já higienizado. Serve para a tela mostrar algo
             legível sem uma consulta a mais por lançamento. */
          comprovante_nome: l.documento_url
            ? decodeURIComponent(l.documento_url.split("/").pop() ?? "").replace(
                /^[0-9a-f-]{36}-/i,
                "",
              )
            : null,
        };
      }),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarFinanceiro", e);
    return VAZIO;
  }
}

/** Nomes para o seletor de cliente do formulário. */
export async function listarClientesSimples(): Promise<{ id: string; nome: string }[]> {
  if (modoDemonstracao()) return [];
  try {
    const sessao = await obterSessao();
    if (!sessao) return [];
    const db = await criarClienteServidor();
    const { data } = await db
      .from("clientes")
      .select("id, nome")
      .eq("organizacao_id", sessao.organizacaoId)
      .order("nome");
    return (data ?? []) as { id: string; nome: string }[];
  } catch (e) {
    registrarFalha("listarClientesSimples", e);
    return [];
  }
}

/**
 * Categorias do plano de contas, para o seletor do lançamento.
 *
 * O tipo vem junto porque receita e despesa têm listas próprias: oferecer
 * "Impostos" num lançamento de receita só serviria para errar.
 */
export async function listarCategorias(): Promise<{ id: string; nome: string; tipo: string }[]> {
  if (modoDemonstracao()) return [];

  try {
    const sessao = await obterSessao();
    if (!sessao) return [];

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("categorias_financeiras")
      .select("id, nome, tipo")
      .eq("organizacao_id", sessao.organizacaoId)
      .order("tipo")
      .order("nome");

    if (error) {
      registrarFalha("listarCategorias", error);
      return [];
    }
    return (data ?? []) as { id: string; nome: string; tipo: string }[];
  } catch (e) {
    registrarFalha("listarCategorias", e);
    return [];
  }
}
