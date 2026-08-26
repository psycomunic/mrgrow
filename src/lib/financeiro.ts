import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { supabaseConfigurado } from "@/lib/dados";
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
  clientes: { nome: string } | { nome: string }[] | null;
};

export async function carregarFinanceiro(): Promise<Financeiro> {
  if (!supabaseConfigurado()) return demo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return demo();

    const db = await criarClienteServidor();
    const { data } = await db
      .from("lancamentos")
      .select(
        "id, descricao, cliente_id, tipo, status, valor, vencimento, pago_em, observacoes, clientes(nome)",
      )
      .eq("organizacao_id", sessao.organizacaoId)
      .order("vencimento", { ascending: false })
      .limit(200);

    if (!data) return demo();

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
        };
      }),
      demo: false,
    };
  } catch {
    return demo();
  }
}

/** Nomes para o seletor de cliente do formulário. */
export async function listarClientesSimples(): Promise<{ id: string; nome: string }[]> {
  if (!supabaseConfigurado()) return [];
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
  } catch {
    return [];
  }
}
