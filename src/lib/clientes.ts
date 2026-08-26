import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { supabaseConfigurado } from "@/lib/dados";
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
      site: null,
      instagram: null,
      inicio_contrato: null,
      fim_contrato: null,
      dia_vencimento: 10,
      responsavel: null,
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
  perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
};

export async function carregarCarteira(): Promise<Carteira> {
  if (!supabaseConfigurado()) return carteiraDemo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return carteiraDemo();

    const db = await criarClienteServidor();
    const { data } = await db
      .from("clientes")
      .select(
        "id, nome, slug, segmento, status, fee_mensal, investimento_previsto, saude, nps, site, instagram, inicio_contrato, fim_contrato, dia_vencimento, perfis:responsavel_id(nome_completo)",
      )
      .eq("organizacao_id", sessao.organizacaoId)
      .order("nome", { ascending: true });

    if (!data?.length) return carteiraDemo();

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
        };
      }),
      demo: false,
    };
  } catch {
    return carteiraDemo();
  }
}
