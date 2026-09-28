import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_CLIENTES } from "@/lib/demo";

/** Cliente no formato que a carteira consome. */
export type ClienteCarteira = {
  id: string;
  nome: string;
  slug: string;
  segmento: string | null;
  status: string;
  fee_mensal: number;
  investimento_previsto: number;
  saude: number;
  nps: number | null;
  roas: number;
  site: string | null;
  instagram: string | null;
  inicio_contrato: string | null;
  fim_contrato: string | null;
  dia_vencimento: number;
  responsavel: string | null;
  /* Campos que a tabela já tinha e nenhuma tela lia. */
  documento: string | null;
  percentual_sobre_investimento: number;
  observacoes: string | null;
  gestor_trafego: string | null;
};

export type Carteira = { clientes: ClienteCarteira[]; demo: boolean };

/** A demonstração não traz todos os campos; o resto vira nulo, não inventado. */
function carteiraDemo(): Carteira {
  return {
    clientes: DEMO_CLIENTES.map((c) => ({
      id: c.id,
      nome: c.nome,
      slug: c.slug,
      segmento: c.segmento,
      status: c.status,
      fee_mensal: c.fee_mensal,
      investimento_previsto: c.investimento_previsto,
      saude: c.saude,
      nps: c.nps,
      roas: c.roas,
      dia_vencimento: c.dia_vencimento ?? 10,
      responsavel: c.responsavel ?? null,
      documento: c.documento ?? null,
      percentual_sobre_investimento: c.percentual ?? 0,
      observacoes: c.observacoes ?? null,
      gestor_trafego: c.gestor_trafego ?? null,
      site: c.site ?? null,
      instagram: c.instagram ?? null,
      inicio_contrato: c.inicio_contrato ?? null,
      fim_contrato: c.fim_contrato ?? null,
    })),
    demo: true,
  };
}

type Linha = {
  id: string;
  nome: string;
  slug: string;
  segmento: string | null;
  status: string;
  fee_mensal: number | string | null;
  investimento_previsto: number | string | null;
  saude: number | null;
  nps: number | null;
  site: string | null;
  instagram: string | null;
  inicio_contrato: string | null;
  fim_contrato: string | null;
  dia_vencimento: number | null;
  documento: string | null;
  percentual_sobre_investimento: number | string | null;
  observacoes: string | null;
  perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
  gestor: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
};

/** Com banco ligado, carteira vazia é carteira vazia — nunca a demonstração. */
const CARTEIRA_VAZIA: Carteira = { clientes: [], demo: false };

export async function carregarCarteira(): Promise<Carteira> {
  if (modoDemonstracao()) return carteiraDemo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return CARTEIRA_VAZIA;

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("clientes")
      .select(
        "id, nome, slug, segmento, status, fee_mensal, investimento_previsto, saude, nps, site, instagram, inicio_contrato, fim_contrato, dia_vencimento, documento, percentual_sobre_investimento, observacoes, perfis:responsavel_id(nome_completo), gestor:gestor_trafego_id(nome_completo)",
      )
      .eq("organizacao_id", sessao.organizacaoId)
      .order("nome", { ascending: true });

    /* Cair na demonstração aqui era o pior comportamento possível: uma
       organização recém-criada via três clientes que não existem, e a ficha
       lateral tentava abrir ids fictícios. */
    if (error) {
      registrarFalha("carregarCarteira", error);
      return CARTEIRA_VAZIA;
    }
    if (!data?.length) return CARTEIRA_VAZIA;

    return {
      clientes: (data as unknown as Linha[]).map((c) => {
        const p = Array.isArray(c.perfis) ? c.perfis[0] : c.perfis;
        return {
          id: c.id,
          nome: c.nome,
          slug: c.slug,
          segmento: c.segmento,
          status: c.status,
          fee_mensal: Number(c.fee_mensal ?? 0),
          investimento_previsto: Number(c.investimento_previsto ?? 0),
          saude: c.saude ?? 0,
          nps: c.nps,
          // O ROAS real vem das métricas sincronizadas, não da tabela de
          // clientes. Enquanto a sincronização não roda, fica zerado.
          roas: 0,
          site: c.site,
          instagram: c.instagram,
          inicio_contrato: c.inicio_contrato,
          fim_contrato: c.fim_contrato,
          dia_vencimento: c.dia_vencimento ?? 10,
          responsavel: p?.nome_completo ?? null,
          documento: c.documento,
          percentual_sobre_investimento: Number(c.percentual_sobre_investimento ?? 0),
          observacoes: c.observacoes,
          gestor_trafego:
            (Array.isArray(c.gestor) ? c.gestor[0] : c.gestor)?.nome_completo ?? null,
        };
      }),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarCarteira", e);
    return CARTEIRA_VAZIA;
  }
}

/**
 * Nomes para o seletor de cliente dos formulários.
 *
 * Passa por `carregarCarteira` de propósito: assim o seletor mostra os
 * clientes da demonstração quando não há banco, em vez de abrir vazio e dar a
 * impressão de que o formulário está quebrado.
 */
export async function listarClientesParaSelecao(): Promise<{ id: string; nome: string }[]> {
  const { clientes } = await carregarCarteira();
  return clientes
    .filter((c) => c.status !== "encerrado")
    .map((c) => ({ id: c.id, nome: c.nome }));
}
