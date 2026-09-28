import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_CLIENTES, DEMO_SERIE, type PontoSerie } from "@/lib/demo";
import { resumir, type Resumo } from "@/lib/metricas";

/**
 * Diagnóstico de mídia: uma consulta, vários recortes.
 *
 * A tela de métricas antes somava tudo de todo mundo em 30 dias fixos. Aqui o
 * mesmo intervalo é lido por dia, por plataforma, por cliente e por campanha,
 * porque são perguntas diferentes sobre o mesmo dinheiro: "como evoluiu",
 * "onde está indo", "qual conta puxa o resultado" e "o que dentro da conta
 * está pagando".
 */

export { PLATAFORMAS, rotuloPlataforma } from "@/lib/plataformas";

export type Recorte = {
  de: string;
  ate: string;
  clienteId: string | null;
  provedor: string | null;
};

export type FatiaPlataforma = {
  provedor: string;
  investimento: number;
  receita: number;
  leads: number;
  compras: number;
  cliques: number;
  impressoes: number;
  roas: number;
  cpl: number;
};

export type FatiaCliente = {
  id: string;
  nome: string;
  investimento: number;
  receita: number;
  leads: number;
  compras: number;
  roas: number;
  cpl: number;
  cpa: number;
};

export type FatiaCampanha = {
  id: string;
  nome: string;
  provedor: string;
  cliente: string | null;
  investimento: number;
  receita: number;
  leads: number;
  compras: number;
  roas: number;
};

export type Diagnostico = {
  serie: PontoSerie[];
  totais: Resumo;
  anterior: Resumo;
  porPlataforma: FatiaPlataforma[];
  porCliente: FatiaCliente[];
  porCampanha: FatiaCampanha[];
  demo: boolean;
  falhou: boolean;
};

const VAZIO: Diagnostico = {
  serie: [],
  totais: resumir([]),
  anterior: resumir([]),
  porPlataforma: [],
  porCliente: [],
  porCampanha: [],
  demo: false,
  falhou: false,
};

/** Dias inteiros entre duas datas `YYYY-MM-DD`, inclusive nas pontas. */
export function diasNoIntervalo(de: string, ate: string) {
  const ms = new Date(`${ate}T00:00:00`).getTime() - new Date(`${de}T00:00:00`).getTime();
  return Math.max(Math.round(ms / 86_400_000) + 1, 1);
}

/** O período de igual tamanho imediatamente anterior, para a comparação. */
export function periodoAnterior(de: string, ate: string) {
  const dias = diasNoIntervalo(de, ate);
  const fim = new Date(`${de}T00:00:00`);
  fim.setDate(fim.getDate() - 1);
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - (dias - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { de: iso(inicio), ate: iso(fim) };
}

/**
 * Resumo do período anterior, ou zerado quando ele mal existe.
 *
 * Com recorte livre, o período anterior pode cair fora do histórico que a
 * conta tem. Comparar 59 dias contra os 31 que sobraram dava "+135%" de
 * investimento sem nada ter mudado. Abaixo de 80% de cobertura a comparação
 * é descartada — e como `delta` devolve `undefined` quando a base é zero, o
 * chip de variação simplesmente não aparece.
 */
function anteriorComparavel(atual: PontoSerie[], anterior: PontoSerie[]) {
  if (!atual.length || anterior.length < atual.length * 0.8) return resumir([]);
  return resumir(anterior);
}

/* ── Demonstração ──────────────────────────────────────────────── */

/* Divisão fixa entre plataformas. Fixa, e não sorteada, para a tela não
   mudar de números a cada carregamento — os fatores de ROAS diferem porque
   é isso que a tela existe para mostrar. */
/* `lead` é o rendimento em volume de leads por real, relativo à média. Sem
   ele, leads e investimento encolhiam pela mesma fatia e o CPL saía idêntico
   em toda linha da tabela — o número existia, mas não dizia nada. O TikTok
   entrega lead barato e converte pior; o Google é o oposto. */
const MISTURA = [
  { provedor: "meta_ads", fatia: 0.54, roas: 1.12, lead: 1.16 },
  { provedor: "google_ads", fatia: 0.34, roas: 0.95, lead: 0.78 },
  { provedor: "tiktok_ads", fatia: 0.12, roas: 0.64, lead: 1.52 },
];

const CAMPANHAS_DEMO = [
  { nome: "Conversão · Remarketing 7d", provedor: "meta_ads", fatia: 0.24, roas: 1.42 },
  { nome: "Conversão · Público frio", provedor: "meta_ads", fatia: 0.2, roas: 0.86 },
  { nome: "Search · Marca", provedor: "google_ads", fatia: 0.14, roas: 1.78 },
  { nome: "Search · Termos genéricos", provedor: "google_ads", fatia: 0.13, roas: 0.71 },
  { nome: "Performance Max", provedor: "google_ads", fatia: 0.09, roas: 1.04 },
  { nome: "Reconhecimento · Vídeo", provedor: "meta_ads", fatia: 0.1, roas: 0.38 },
  { nome: "TikTok · Criativo UGC", provedor: "tiktok_ads", fatia: 0.1, roas: 0.64 },
];

/** Recorta a série da demonstração no intervalo pedido. */
function fatiarSerie(de: string, ate: string) {
  return DEMO_SERIE.filter((p) => p.data >= de && p.data <= ate);
}

/** Aplica um fator a todos os números de um ponto da série. */
function escalar(p: PontoSerie, fatia: number, ganho: number): PontoSerie {
  return {
    data: p.data,
    investimento: Math.round(p.investimento * fatia),
    receita: Math.round(p.receita * fatia * ganho),
    leads: Math.round(p.leads * fatia),
    cliques: Math.round(p.cliques * fatia),
    impressoes: Math.round(p.impressoes * fatia),
    compras: Math.round(p.compras * fatia * ganho),
  };
}

/** Peso de cada cliente na demonstração, proporcional à verba prevista. */
function pesosDemo() {
  const ativos = DEMO_CLIENTES.filter((c) => c.investimento_previsto > 0);
  const total = ativos.reduce((s, c) => s + c.investimento_previsto, 0) || 1;
  return ativos.map((c) => ({
    id: c.id,
    nome: c.nome,
    fatia: c.investimento_previsto / total,
    /* O ROAS de cada conta vem da carteira; aqui ele vira um fator sobre a
       receita média, para as contas não saírem todas iguais. */
    ganho: c.roas / 4.2,
    /* Conta que rende mais também costuma captar mais lead pelo mesmo real,
       mas não na mesma proporção — daí a fração. É o que faz o CPL variar
       entre as contas em vez de sair igual em todas. */
    lead: 0.62 + (c.roas / 6.2) * 0.85,
  }));
}

function diagnosticoDemo(r: Recorte): Diagnostico {
  const pesos = pesosDemo();
  const cliente = r.clienteId ? pesos.find((p) => p.id === r.clienteId) : null;

  /* Com um cliente escolhido, a série inteira encolhe para a fatia dele; com
     uma plataforma escolhida, encolhe de novo para a fatia dela. */
  const daPlataforma = r.provedor ? MISTURA.find((m) => m.provedor === r.provedor) : null;
  const fatia = (cliente?.fatia ?? 1) * (daPlataforma?.fatia ?? 1);
  const ganho = (cliente?.ganho ?? 1) * (daPlataforma?.roas ?? 1);

  const bruta = fatiarSerie(r.de, r.ate);
  const serie = fatia === 1 && ganho === 1 ? bruta : bruta.map((p) => escalar(p, fatia, ganho));

  const ant = periodoAnterior(r.de, r.ate);
  const brutaAnterior = fatiarSerie(ant.de, ant.ate);
  const serieAnterior =
    fatia === 1 && ganho === 1 ? brutaAnterior : brutaAnterior.map((p) => escalar(p, fatia, ganho));

  const base = resumir(bruta.map((p) => escalar(p, cliente?.fatia ?? 1, cliente?.ganho ?? 1)));

  const porPlataforma = MISTURA.filter((m) => !r.provedor || m.provedor === r.provedor).map((m) => {
    const investimento = Math.round(base.investimento * m.fatia);
    const receita = Math.round(base.receita * m.fatia * m.roas);
    const leads = Math.round(base.leads * m.fatia * m.lead);
    return {
      provedor: m.provedor,
      investimento,
      receita,
      leads,
      compras: Math.round(base.compras * m.fatia * m.roas),
      cliques: Math.round(base.cliques * m.fatia),
      impressoes: Math.round(base.impressoes * m.fatia),
      roas: investimento ? receita / investimento : 0,
      cpl: leads ? investimento / leads : 0,
    };
  });

  const totalGeral = resumir(bruta);
  const porCliente = pesos
    .filter((p) => !r.clienteId || p.id === r.clienteId)
    .map((p) => {
      const escala = p.fatia * (daPlataforma?.fatia ?? 1);
      const rendimento = p.ganho * (daPlataforma?.roas ?? 1);
      const investimento = Math.round(totalGeral.investimento * escala);
      const receita = Math.round(totalGeral.receita * escala * rendimento);
      const leads = Math.round(totalGeral.leads * escala * p.lead);
      const compras = Math.round(totalGeral.compras * escala * rendimento);
      return {
        id: p.id,
        nome: p.nome,
        investimento,
        receita,
        leads,
        compras,
        roas: investimento ? receita / investimento : 0,
        cpl: leads ? investimento / leads : 0,
        cpa: compras ? investimento / compras : 0,
      };
    })
    .sort((a, b) => b.investimento - a.investimento);

  const totalRecorte = resumir(serie);
  const porCampanha = CAMPANHAS_DEMO.filter((c) => !r.provedor || c.provedor === r.provedor)
    .map((c, i) => {
      const investimento = Math.round(totalRecorte.investimento * c.fatia);
      const receita = Math.round(totalRecorte.receita * c.fatia * c.roas);
      return {
        id: `camp-${i}`,
        nome: c.nome,
        provedor: c.provedor,
        cliente: cliente?.nome ?? null,
        investimento,
        receita,
        leads: Math.round(totalRecorte.leads * c.fatia),
        compras: Math.round(totalRecorte.compras * c.fatia * c.roas),
        roas: investimento ? receita / investimento : 0,
      };
    })
    .sort((a, b) => b.investimento - a.investimento);

  return {
    serie,
    totais: totalRecorte,
    anterior: anteriorComparavel(serie, serieAnterior),
    porPlataforma,
    porCliente,
    porCampanha,
    demo: true,
    falhou: false,
  };
}

/* ── Banco ─────────────────────────────────────────────────────── */

type LinhaMetrica = {
  data: string;
  provedor: string;
  cliente_id: string | null;
  campanha_id: string | null;
  investimento: number | string | null;
  receita: number | string | null;
  leads: number | string | null;
  compras: number | string | null;
  cliques: number | string | null;
  impressoes: number | string | null;
};

const n = (v: number | string | null | undefined) => Number(v ?? 0) || 0;

/** Soma as linhas por dia, para virar a série do gráfico. */
function porDia(linhas: LinhaMetrica[]): PontoSerie[] {
  const mapa = new Map<string, PontoSerie>();
  for (const l of linhas) {
    const atual = mapa.get(l.data) ?? {
      data: l.data,
      investimento: 0,
      receita: 0,
      leads: 0,
      cliques: 0,
      impressoes: 0,
      compras: 0,
    };
    atual.investimento += n(l.investimento);
    atual.receita += n(l.receita);
    atual.leads += n(l.leads);
    atual.cliques += n(l.cliques);
    atual.impressoes += n(l.impressoes);
    atual.compras += n(l.compras);
    mapa.set(l.data, atual);
  }
  return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
}

/** Soma por uma chave qualquer da linha (plataforma, cliente, campanha). */
function agrupar(linhas: LinhaMetrica[], chave: (l: LinhaMetrica) => string | null) {
  const mapa = new Map<
    string,
    { investimento: number; receita: number; leads: number; compras: number; cliques: number; impressoes: number }
  >();
  for (const l of linhas) {
    const k = chave(l);
    if (!k) continue;
    const a = mapa.get(k) ?? {
      investimento: 0,
      receita: 0,
      leads: 0,
      compras: 0,
      cliques: 0,
      impressoes: 0,
    };
    a.investimento += n(l.investimento);
    a.receita += n(l.receita);
    a.leads += n(l.leads);
    a.compras += n(l.compras);
    a.cliques += n(l.cliques);
    a.impressoes += n(l.impressoes);
    mapa.set(k, a);
  }
  return mapa;
}

export async function carregarDiagnostico(r: Recorte): Promise<Diagnostico> {
  if (modoDemonstracao()) return diagnosticoDemo(r);

  try {
    const sessao = await obterSessao();
    if (!sessao) return VAZIO;

    const db = await criarClienteServidor();
    const ant = periodoAnterior(r.de, r.ate);

    const colunas =
      "data, provedor, cliente_id, campanha_id, investimento, receita, leads, compras, cliques, impressoes";

    /* Só as linhas agregadas da conta (`campanha_id` nulo) entram na série e
       nos totais. Somar conta e campanha junto contaria o mesmo investimento
       duas vezes — a quebra por campanha sai de outra consulta. */
    let consulta = db
      .from("metricas_diarias")
      .select(colunas)
      .eq("organizacao_id", sessao.organizacaoId)
      .is("campanha_id", null)
      .gte("data", ant.de)
      .lte("data", r.ate)
      .limit(50_000);

    if (r.clienteId) consulta = consulta.eq("cliente_id", r.clienteId);
    if (r.provedor) consulta = consulta.eq("provedor", r.provedor);

    if (sessao.papel === "cliente") {
      if (!sessao.clientesPermitidos.length) return VAZIO;
      consulta = consulta.in("cliente_id", sessao.clientesPermitidos);
    }

    let porCampanhaConsulta = db
      .from("metricas_diarias")
      .select(`${colunas}, campanhas(nome), clientes(nome)`)
      .eq("organizacao_id", sessao.organizacaoId)
      .not("campanha_id", "is", null)
      .gte("data", r.de)
      .lte("data", r.ate)
      .limit(50_000);

    if (r.clienteId) porCampanhaConsulta = porCampanhaConsulta.eq("cliente_id", r.clienteId);
    if (r.provedor) porCampanhaConsulta = porCampanhaConsulta.eq("provedor", r.provedor);
    if (sessao.papel === "cliente") {
      porCampanhaConsulta = porCampanhaConsulta.in("cliente_id", sessao.clientesPermitidos);
    }

    const [{ data, error }, { data: campanhas, error: erroCampanhas }, { data: nomes }] =
      await Promise.all([
        consulta,
        porCampanhaConsulta,
        db
          .from("clientes")
          .select("id, nome")
          .eq("organizacao_id", sessao.organizacaoId),
      ]);

    if (error) {
      registrarFalha("carregarDiagnostico", error);
      return { ...VAZIO, falhou: true };
    }
    if (erroCampanhas) registrarFalha("carregarDiagnostico/campanhas", erroCampanhas);

    const linhas = (data ?? []) as unknown as LinhaMetrica[];
    const doPeriodo = linhas.filter((l) => l.data >= r.de);
    const doAnterior = linhas.filter((l) => l.data < r.de);

    const nomePorId = new Map(
      ((nomes ?? []) as { id: string; nome: string }[]).map((c) => [c.id, c.nome]),
    );

    const plataformas = agrupar(doPeriodo, (l) => l.provedor);
    const clientes = agrupar(doPeriodo, (l) => l.cliente_id);

    type LinhaCampanha = LinhaMetrica & {
      campanhas: { nome: string } | { nome: string }[] | null;
      clientes: { nome: string } | { nome: string }[] | null;
    };
    const um = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);
    const linhasCampanha = (campanhas ?? []) as unknown as LinhaCampanha[];
    const rotuloCampanha = new Map<string, { nome: string; provedor: string; cliente: string | null }>();
    for (const l of linhasCampanha) {
      if (l.campanha_id && !rotuloCampanha.has(l.campanha_id)) {
        rotuloCampanha.set(l.campanha_id, {
          nome: um(l.campanhas)?.nome ?? "Campanha sem nome",
          provedor: l.provedor,
          cliente: um(l.clientes)?.nome ?? null,
        });
      }
    }
    const campanhasAgrupadas = agrupar(linhasCampanha, (l) => l.campanha_id);

    return {
      serie: porDia(doPeriodo),
      totais: resumir(porDia(doPeriodo)),
      anterior: anteriorComparavel(porDia(doPeriodo), porDia(doAnterior)),
      porPlataforma: [...plataformas.entries()]
        .map(([provedor, a]) => ({
          provedor,
          ...a,
          roas: a.investimento ? a.receita / a.investimento : 0,
          cpl: a.leads ? a.investimento / a.leads : 0,
        }))
        .sort((a, b) => b.investimento - a.investimento),
      porCliente: [...clientes.entries()]
        .map(([id, a]) => ({
          id,
          nome: nomePorId.get(id) ?? "Sem cliente",
          investimento: a.investimento,
          receita: a.receita,
          leads: a.leads,
          compras: a.compras,
          roas: a.investimento ? a.receita / a.investimento : 0,
          cpl: a.leads ? a.investimento / a.leads : 0,
          cpa: a.compras ? a.investimento / a.compras : 0,
        }))
        .sort((a, b) => b.investimento - a.investimento),
      porCampanha: [...campanhasAgrupadas.entries()]
        .map(([id, a]) => {
          const meta = rotuloCampanha.get(id);
          return {
            id,
            nome: meta?.nome ?? "Campanha",
            provedor: meta?.provedor ?? "",
            cliente: meta?.cliente ?? null,
            investimento: a.investimento,
            receita: a.receita,
            leads: a.leads,
            compras: a.compras,
            roas: a.investimento ? a.receita / a.investimento : 0,
          };
        })
        .sort((a, b) => b.investimento - a.investimento),
      demo: false,
      falhou: false,
    };
  } catch (e) {
    registrarFalha("carregarDiagnostico", e);
    return { ...VAZIO, falhou: true };
  }
}
