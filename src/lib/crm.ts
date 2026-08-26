import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_ETAPAS, DEMO_NEGOCIOS } from "@/lib/demo";
import type { EtapaFunil } from "@/types/dominio";

/** Negócio no formato que o quadro consome. */
export type NegocioQuadro = {
  id: string;
  titulo: string;
  etapa_id: string;
  valor_mensal: number;
  valor_unico: number;
  temperatura: string;
  origem: string | null;
  contato: string | null;
  previsao: string | null;
  ordem_kanban: number;
};

export type Funil = {
  funilId: string | null;
  etapas: EtapaFunil[];
  negocios: NegocioQuadro[];
  /** Sem Supabase o quadro roda com dados fictícios e não persiste. */
  demo: boolean;
};

/** Converte a demonstração para o mesmo formato do banco. */
function funilDemo(): Funil {
  return {
    funilId: null,
    etapas: DEMO_ETAPAS as EtapaFunil[],
    negocios: DEMO_NEGOCIOS.map((n, i) => ({
      id: n.id,
      titulo: n.titulo,
      etapa_id: n.etapa_id,
      valor_mensal: n.valor_mensal,
      valor_unico: n.valor_unico,
      temperatura: n.temperatura,
      origem: n.origem,
      contato: n.contato,
      previsao: n.previsao,
      ordem_kanban: i,
    })),
    demo: true,
  };
}

type LinhaNegocio = {
  id: string;
  titulo: string;
  etapa_id: string;
  valor_mensal: number | string | null;
  valor_unico: number | string | null;
  temperatura: string;
  origem: string | null;
  previsao_fechamento: string | null;
  ordem_kanban: number | null;
  contatos: { nome: string } | { nome: string }[] | null;
};

/** O join do Supabase devolve objeto ou array conforme a cardinalidade. */
function nomeDoContato(c: LinhaNegocio["contatos"]) {
  if (!c) return null;
  return Array.isArray(c) ? (c[0]?.nome ?? null) : c.nome;
}

/** Sem funil configurado o quadro abre vazio e convida a criar o primeiro. */
const FUNIL_VAZIO: Funil = { funilId: null, etapas: [], negocios: [], demo: false };

/**
 * Carrega o funil padrão da organização com as etapas e os negócios abertos.
 *
 * Só cai na demonstração quando não existe Supabase configurado. Com banco
 * ligado, ausência de dados é ausência de dados: mostrar o funil fictício
 * fazia o quadro operar sobre etapas inexistentes, e toda ação de arrastar
 * falhava depois no servidor.
 */
export async function carregarFunil(): Promise<Funil> {
  if (modoDemonstracao()) return funilDemo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return FUNIL_VAZIO;

    const db = await criarClienteServidor();

    const { data: funil } = await db
      .from("funis")
      .select("id")
      .eq("organizacao_id", sessao.organizacaoId)
      .order("padrao", { ascending: false })
      .order("ordem", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!funil) return FUNIL_VAZIO;
    const funilId = (funil as { id: string }).id;

    const [{ data: etapas }, { data: negocios }] = await Promise.all([
      db
        .from("etapas_funil")
        .select("id, nome, ordem, probabilidade, cor, tipo")
        .eq("funil_id", funilId)
        .order("ordem", { ascending: true }),
      db
        .from("negocios")
        .select(
          "id, titulo, etapa_id, valor_mensal, valor_unico, temperatura, origem, previsao_fechamento, ordem_kanban, contatos(nome)",
        )
        .eq("funil_id", funilId)
        .eq("status", "aberto")
        .order("ordem_kanban", { ascending: true }),
    ]);

    if (!etapas?.length) return FUNIL_VAZIO;

    return {
      funilId,
      etapas: etapas as EtapaFunil[],
      negocios: ((negocios ?? []) as unknown as LinhaNegocio[]).map((n) => ({
        id: n.id,
        titulo: n.titulo,
        etapa_id: n.etapa_id,
        valor_mensal: Number(n.valor_mensal ?? 0),
        valor_unico: Number(n.valor_unico ?? 0),
        temperatura: n.temperatura,
        origem: n.origem,
        contato: nomeDoContato(n.contatos),
        previsao: n.previsao_fechamento,
        ordem_kanban: n.ordem_kanban ?? 0,
      })),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarFunil", e);
    return FUNIL_VAZIO;
  }
}
