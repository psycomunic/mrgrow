import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_ETAPAS, DEMO_NEGOCIOS } from "@/lib/demo";
import type { EtapaFunil } from "@/types/dominio";

/** Ficha do contato do negócio — é o que o card do lead mostra. */
export type ContatoNegocio = {
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  empresa: string | null;
  instagram: string | null;
  site: string | null;
};

/** O próximo passo combinado. Sem ele, o negócio está à deriva. */
export type ProximaAtividade = {
  id: string;
  tipo: string;
  titulo: string | null;
  vence_em: string;
};

/** Negócio no formato que o quadro consome. */
export type NegocioQuadro = {
  id: string;
  titulo: string;
  etapa_id: string;
  valor_mensal: number;
  valor_unico: number;
  temperatura: string;
  origem: string | null;
  /** Nome do contato, que é o que o cartão mostra em uma linha. */
  contato: string | null;
  /** A ficha inteira, para o card do lead. */
  dados: ContatoNegocio | null;
  responsavel: string | null;
  previsao: string | null;
  criado_em: string;
  /** Quando entrou na etapa atual — dá o "parado há N dias". */
  etapa_desde: string;
  /** Data da última atividade registrada. */
  ultimo_contato: string | null;
  proxima: ProximaAtividade | null;
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
      contato: n.contato.nome,
      dados: n.contato,
      responsavel: n.responsavel,
      previsao: n.previsao,
      criado_em: n.criado_em,
      etapa_desde: n.etapa_desde,
      ultimo_contato: n.ultimo_contato,
      proxima: n.proxima,
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
  criado_em: string;
  contatos: ContatoNegocio | ContatoNegocio[] | null;
  perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
};

/** O join do Supabase devolve objeto ou array conforme a cardinalidade. */
function um<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
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
 *
 * São quatro consultas, e não uma com joins: o histórico de etapas e as
 * atividades são muitos-para-um e viriam multiplicando as linhas do negócio.
 * Buscar separado e cruzar em memória custa duas idas a mais ao banco e evita
 * transportar o mesmo negócio repetido uma vez por atividade.
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
          "id, titulo, etapa_id, valor_mensal, valor_unico, temperatura, origem, previsao_fechamento, ordem_kanban, criado_em, contatos(nome, email, telefone, cargo, empresa, instagram, site), perfis:responsavel_id(nome_completo)",
        )
        .eq("funil_id", funilId)
        .eq("status", "aberto")
        .order("ordem_kanban", { ascending: true }),
    ]);

    if (!etapas?.length) return FUNIL_VAZIO;

    const linhas = (negocios ?? []) as unknown as LinhaNegocio[];
    const ids = linhas.map((n) => n.id);

    const [entradaNaEtapa, agenda, ultimoContato] = ids.length
      ? await Promise.all([
          entradasDeEtapa(db, ids, sessao.organizacaoId),
          proximasAtividades(db, ids, sessao.organizacaoId),
          ultimosContatos(db, ids, sessao.organizacaoId),
        ])
      : [new Map<string, string>(), new Map<string, ProximaAtividade>(), new Map<string, string>()];

    return {
      funilId,
      etapas: etapas as EtapaFunil[],
      negocios: linhas.map((n) => {
        const contato = um(n.contatos);
        return {
          id: n.id,
          titulo: n.titulo,
          etapa_id: n.etapa_id,
          valor_mensal: Number(n.valor_mensal ?? 0),
          valor_unico: Number(n.valor_unico ?? 0),
          temperatura: n.temperatura,
          origem: n.origem,
          contato: contato?.nome ?? null,
          dados: contato,
          responsavel: um(n.perfis)?.nome_completo ?? null,
          previsao: n.previsao_fechamento,
          criado_em: n.criado_em,
          /* Sem histórico, o negócio nunca mudou de etapa: está nela desde
             que nasceu. */
          etapa_desde: entradaNaEtapa.get(n.id) ?? n.criado_em,
          ultimo_contato: ultimoContato.get(n.id) ?? null,
          proxima: agenda.get(n.id) ?? null,
          ordem_kanban: n.ordem_kanban ?? 0,
        };
      }),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarFunil", e);
    return FUNIL_VAZIO;
  }
}

type Banco = Awaited<ReturnType<typeof criarClienteServidor>>;

/** Quando cada negócio entrou na etapa em que está. */
async function entradasDeEtapa(db: Banco, ids: string[], organizacaoId: string) {
  const mapa = new Map<string, string>();
  const { data, error } = await db
    .from("historico_etapas")
    .select("negocio_id, criado_em")
    .in("negocio_id", ids)
    .eq("organizacao_id", organizacaoId)
    .order("criado_em", { ascending: false })
    .limit(2000);

  if (error) {
    registrarFalha("carregarFunil/historico", error);
    return mapa;
  }

  /* Ordenado do mais novo para o mais antigo: o primeiro de cada negócio é a
     entrada na etapa atual, e os seguintes são passagens anteriores. */
  for (const l of (data ?? []) as { negocio_id: string; criado_em: string }[]) {
    if (!mapa.has(l.negocio_id)) mapa.set(l.negocio_id, l.criado_em);
  }
  return mapa;
}

/** O próximo passo de cada negócio: a atividade aberta que vence primeiro. */
async function proximasAtividades(db: Banco, ids: string[], organizacaoId: string) {
  const mapa = new Map<string, ProximaAtividade>();
  const { data, error } = await db
    .from("atividades")
    .select("id, negocio_id, tipo, titulo, vence_em")
    .in("negocio_id", ids)
    .eq("organizacao_id", organizacaoId)
    .eq("concluida", false)
    .not("vence_em", "is", null)
    .order("vence_em", { ascending: true })
    .limit(2000);

  if (error) {
    registrarFalha("carregarFunil/agenda", error);
    return mapa;
  }

  type Linha = ProximaAtividade & { negocio_id: string };
  for (const a of (data ?? []) as unknown as Linha[]) {
    if (!mapa.has(a.negocio_id)) {
      mapa.set(a.negocio_id, { id: a.id, tipo: a.tipo, titulo: a.titulo, vence_em: a.vence_em });
    }
  }
  return mapa;
}

/** Data da última atividade registrada em cada negócio. */
async function ultimosContatos(db: Banco, ids: string[], organizacaoId: string) {
  const mapa = new Map<string, string>();
  const { data, error } = await db
    .from("atividades")
    .select("negocio_id, criado_em")
    .in("negocio_id", ids)
    .eq("organizacao_id", organizacaoId)
    .order("criado_em", { ascending: false })
    .limit(2000);

  if (error) {
    registrarFalha("carregarFunil/contatos", error);
    return mapa;
  }

  for (const a of (data ?? []) as { negocio_id: string; criado_em: string }[]) {
    if (!mapa.has(a.negocio_id)) mapa.set(a.negocio_id, a.criado_em);
  }
  return mapa;
}
