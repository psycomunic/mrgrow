/**
 * Vocabulário do relatório: os blocos que ele pode conter, a periodicidade e
 * o formato de entrega.
 *
 * Fica fora de `relatorios.ts` porque o construtor é client component e
 * `relatorios.ts` é `server-only`. E a separação chave/rótulo não é
 * enfeite: a chave é o que vai para o `blocos` jsonb e nunca muda, o rótulo
 * é o que aparece na tela e pode ser reescrito à vontade. Guardar o texto no
 * banco significaria que corrigir uma palavra quebraria todo relatório salvo.
 */

import { emDias, hoje } from "@/lib/tempo";

export type ChaveBloco =
  | "resumo_executivo"
  | "evolucao_diaria"
  | "desempenho_campanhas"
  | "criativos_vencedores"
  | "leads_cpl"
  | "comparativo_periodo"
  | "plano_de_acao";

export type Bloco = {
  chave: ChaveBloco;
  rotulo: string;
  /** Frase de apoio no construtor: o que o cliente vê se marcar este bloco. */
  resumo: string;
};

/** A ordem daqui é a ordem em que os blocos são renderizados na página pública. */
export const BLOCOS: readonly Bloco[] = [
  {
    chave: "resumo_executivo",
    rotulo: "Resumo executivo",
    resumo: "Investimento, retorno, ROAS e ticket médio do período.",
  },
  {
    chave: "evolucao_diaria",
    rotulo: "Evolução diária",
    resumo: "Gráfico de investimento e retorno dia a dia.",
  },
  {
    chave: "desempenho_campanhas",
    rotulo: "Desempenho por campanha",
    resumo: "Onde a verba entrou e quanto cada campanha devolveu.",
  },
  {
    chave: "criativos_vencedores",
    rotulo: "Criativos vencedores",
    resumo: "Os anúncios que sustentaram o resultado do ciclo.",
  },
  {
    chave: "leads_cpl",
    rotulo: "Leads e custo por lead",
    resumo: "Volume de leads, vendas fechadas e o custo de cada uma.",
  },
  {
    chave: "comparativo_periodo",
    rotulo: "Comparativo com o ciclo anterior",
    resumo: "Cada indicador contra o período anterior de igual tamanho.",
  },
  {
    chave: "plano_de_acao",
    rotulo: "Plano do próximo ciclo",
    resumo: "As entregas que já estão em fila para a conta.",
  },
] as const;

export const CHAVES_BLOCO = BLOCOS.map((b) => b.chave);

/** Blocos escolhidos, sempre na ordem da definição — não na ordem do clique. */
export function blocosEscolhidos(chaves: readonly string[]): Bloco[] {
  return BLOCOS.filter((b) => chaves.includes(b.chave));
}

export type Periodicidade = {
  valor: string;
  rotulo: string;
  /** Tamanho da janela que o relatório cobre, em dias. */
  dias: number;
  /** Quando o próximo fechamento sai, em texto. */
  cadencia: string;
};

export const PERIODICIDADES: readonly Periodicidade[] = [
  { valor: "semanal", rotulo: "Semanal", dias: 7, cadencia: "toda segunda-feira" },
  { valor: "quinzenal", rotulo: "Quinzenal", dias: 15, cadencia: "nos dias 1º e 16" },
  { valor: "mensal", rotulo: "Mensal", dias: 30, cadencia: "no dia 1º de cada mês" },
] as const;

export const MENSAL = PERIODICIDADES[2];

export function periodicidadeDe(valor: string | null | undefined): Periodicidade {
  return PERIODICIDADES.find((p) => p.valor === valor) ?? MENSAL;
}

export type Formato = { valor: string; rotulo: string; detalhe: string };

export const FORMATOS: readonly Formato[] = [
  { valor: "link", rotulo: "Só o link", detalhe: "Você envia o endereço quando quiser." },
  { valor: "email", rotulo: "E-mail automático", detalhe: "O link vai para os destinatários no fechamento." },
  { valor: "pdf", rotulo: "PDF por e-mail", detalhe: "Mesmo conteúdo, anexado como arquivo." },
] as const;

export function formatoDe(valor: string | null | undefined): Formato {
  return FORMATOS.find((f) => f.valor === valor) ?? FORMATOS[0];
}

/**
 * Data do próximo fechamento.
 *
 * O relatório fecha um ciclo, então ele sai no primeiro dia do ciclo
 * seguinte — nunca "hoje + 30". Sem isso, dois relatórios mensais criados em
 * dias diferentes cairiam em datas diferentes, e o cliente que recebe os dois
 * veria períodos desencontrados.
 */
export function proximoEnvio(periodicidade: string): string {
  const dia = hoje();
  const [ano, mes, diaDoMes] = dia.split("-").map(Number);

  if (periodicidade === "semanal") {
    // getDay() sobre a data pura precisa de hora fixa, senão o fuso vira o dia.
    const semana = new Date(`${dia}T12:00:00`).getDay();
    return emDias(((8 - semana) % 7) || 7);
  }

  if (periodicidade === "quinzenal") {
    if (diaDoMes < 16) return `${dia.slice(0, 8)}16`;
    return proximoPrimeiro(ano, mes);
  }

  return proximoPrimeiro(ano, mes);
}

function proximoPrimeiro(ano: number, mes: number) {
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  return `${proximoAno}-${String(proximoMes).padStart(2, "0")}-01`;
}

/** Janela coberta pelo relatório: o período que a página pública apresenta. */
export function janelaDoPeriodo(periodicidade: string) {
  const { dias, rotulo } = periodicidadeDe(periodicidade);
  return { dias, rotulo, inicio: emDias(-(dias - 1)), fim: hoje() };
}

/**
 * Formato do criativo como o banco guarda ("estatico") e como o cliente lê.
 * Valor novo na coluna aparece humanizado, não cru.
 */
const FORMATO_CRIATIVO: Record<string, string> = {
  reels: "Reels",
  estatico: "Estático",
  carrossel: "Carrossel",
  video: "Vídeo",
  search: "Search",
  pmax: "Performance Max",
};

export function rotuloFormatoCriativo(valor: string | null | undefined) {
  if (!valor) return "Criativo";
  const conhecido = FORMATO_CRIATIVO[valor];
  if (conhecido) return conhecido;
  const limpo = valor.replace(/[_-]+/g, " ").trim();
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}
