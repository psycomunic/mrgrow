/**
 * Fonte única dos números financeiros.
 *
 * Visão geral, Recebimentos e Financeiro mostravam três valores diferentes
 * para "em atraso" — R$ 12.650, R$ 8.500 e R$ 3.500 — porque cada tela
 * tinha a sua própria conta. A da visão geral somava atraso de qualquer
 * data, a de recebimentos gerava cobrança a partir do contrato em vez de
 * ler o lançamento, e só a do financeiro olhava o mês. Três respostas para
 * a mesma pergunta é pior do que nenhuma: quem lê não sabe em qual
 * acreditar, e passa a não acreditar em nenhuma.
 *
 * Este módulo é puro de propósito — sem Supabase, sem React, sem `import`
 * nenhum. Assim a mesma função roda no servidor, roda no navegador e roda
 * no teste, e não existe lugar onde a regra possa divergir.
 */

export type Movimento = {
  tipo: string;
  status: string;
  valor: number;
  /** Quanto entrou de fato. Ausente, vale o próprio `valor`. */
  valor_pago?: number | null;
  /** `AAAA-MM-DD`. Comparado como texto: a ordem lexical já é cronológica. */
  vencimento: string;
};

export type ResumoFinanceiro = {
  /** Tudo que deveria entrar no período, pago ou não. */
  previsto: number;
  /** O que entrou de fato. */
  recebido: number;
  /** Previsto menos recebido: o que ainda falta entrar. */
  aReceber: number;
  /** Vencido e não pago. Subconjunto de `aReceber`. */
  atrasado: number;
  qtdAtrasada: number;
  despesas: number;
  /** Recebido menos despesas — dinheiro que existe, não promessa. */
  resultado: number;
  /** Previsto menos despesas: o mesmo mês se todo mundo pagar. */
  resultadoPrevisto: number;
  /** Quantas cobranças de receita entram na conta. */
  cobrancas: number;
};

/**
 * Cancelado não conta em lugar nenhum.
 *
 * Fica numa função só para que nenhuma tela lembre de filtrar por conta
 * própria — esquecer disso num lugar já faria dois números divergirem.
 */
export function vivo(m: Movimento) {
  return m.status !== "cancelado";
}

/**
 * Dentro do período, com os dois lados fechados.
 *
 * O `<=` é o que faltava no financeiro: com só o `>=`, "este mês" somava
 * setembro, outubro e novembro e mostrava R$ 142.250 de receita num mês
 * de R$ 48.450.
 */
export function noPeriodo(m: Movimento, de: string, ate: string) {
  return m.vencimento >= de && m.vencimento <= ate;
}

export function recebido(m: Movimento) {
  return m.status === "pago";
}

/**
 * Vencido e não pago.
 *
 * O `valor > 0` existe porque a planilha de origem trazia linhas de R$ 0
 * como marcador de controle; sem o filtro, elas entravam na contagem de
 * cobranças vencidas e a tela acusava atraso que não existia.
 */
export function atrasado(m: Movimento, hoje: string) {
  return m.tipo === "receita" && !recebido(m) && m.valor > 0 && m.vencimento < hoje;
}

function soma(ms: Movimento[], quanto: (m: Movimento) => number = (m) => m.valor) {
  return ms.reduce((s, m) => s + quanto(m), 0);
}

/** Primeiro e último dia do mês de uma competência `AAAA-MM`. */
export function limitesDoMes(competencia: string): { de: string; ate: string } {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return { de: `${competencia}-01`, ate: `${competencia}-${String(ultimo).padStart(2, "0")}` };
}

/** A competência `AAAA-MM` de uma data `AAAA-MM-DD`. */
export function mesDe(data: string) {
  return data.slice(0, 7);
}

export function resumirFinanceiro(
  movimentos: Movimento[],
  { de, ate, hoje }: { de: string; ate: string; hoje: string },
): ResumoFinanceiro {
  const dentro = movimentos.filter((m) => vivo(m) && noPeriodo(m, de, ate));
  const receitas = dentro.filter((m) => m.tipo === "receita");
  const despesas = dentro.filter((m) => m.tipo === "despesa");
  const vencidas = receitas.filter((m) => atrasado(m, hoje));

  const previsto = soma(receitas);
  /* `valor_pago ?? valor` e não só `valor`: quitação parcial existe no
     banco, e contar o valor cheio inflaria o recebido. */
  const entrou = soma(
    receitas.filter(recebido),
    (m) => (m.valor_pago === null || m.valor_pago === undefined ? m.valor : m.valor_pago),
  );
  const saiu = soma(despesas);

  return {
    previsto,
    recebido: entrou,
    aReceber: previsto - entrou,
    atrasado: soma(vencidas),
    qtdAtrasada: vencidas.length,
    despesas: saiu,
    resultado: entrou - saiu,
    resultadoPrevisto: previsto - saiu,
    cobrancas: receitas.length,
  };
}

export type MesResumo = { competencia: string; previsto: number; recebido: number };

/**
 * Previsto contra recebido, mês a mês.
 *
 * Alimenta o gráfico da visão geral e o de recebimentos. Sai da mesma
 * lista e das mesmas regras do resumo, então as barras não podem discordar
 * dos cartões acima delas.
 */
export function porMes(movimentos: Movimento[]): MesResumo[] {
  const mapa = new Map<string, MesResumo>();

  for (const m of movimentos) {
    if (!vivo(m) || m.tipo !== "receita") continue;
    const k = mesDe(m.vencimento);
    const linha = mapa.get(k) ?? { competencia: k, previsto: 0, recebido: 0 };
    linha.previsto += m.valor;
    if (recebido(m)) {
      linha.recebido += m.valor_pago === null || m.valor_pago === undefined ? m.valor : m.valor_pago;
    }
    mapa.set(k, linha);
  }

  return [...mapa.values()].sort((a, b) => a.competencia.localeCompare(b.competencia));
}
