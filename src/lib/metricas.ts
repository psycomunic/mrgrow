/**
 * Contas da casa: um lugar só onde os indicadores são calculados.
 *
 * Antes, a visão geral trazia constantes (`roasMedio: 4.69`, `leadsMes: 843`)
 * e a tela de métricas somava a série de verdade. Resultado: a mesma agência
 * tinha ROAS 4,69x numa tela e 3,6x na tela ao lado, e ninguém sabia qual
 * acreditar. Aqui todo número sai da mesma série, e a variação percentual sai
 * da comparação com o período anterior de igual tamanho — não de um valor
 * escrito à mão.
 */

import type { PontoSerie } from "@/lib/demo";
import { divisao } from "@/lib/utils";

export type Resumo = {
  investimento: number;
  receita: number;
  leads: number;
  cliques: number;
  impressoes: number;
  compras: number;
  /** Derivados — sempre por divisão protegida, para não vazar NaN na tela. */
  roas: number;
  cpl: number;
  cpa: number;
  cpc: number;
  ctr: number;
  ticketMedio: number;
};

const ZERADO: Resumo = {
  investimento: 0, receita: 0, leads: 0, cliques: 0, impressoes: 0, compras: 0,
  roas: 0, cpl: 0, cpa: 0, cpc: 0, ctr: 0, ticketMedio: 0,
};

export function resumir(serie: PontoSerie[]): Resumo {
  if (!serie.length) return ZERADO;

  const t = serie.reduce(
    (a, p) => ({
      investimento: a.investimento + p.investimento,
      receita: a.receita + p.receita,
      leads: a.leads + p.leads,
      cliques: a.cliques + p.cliques,
      impressoes: a.impressoes + p.impressoes,
      compras: a.compras + p.compras,
    }),
    { investimento: 0, receita: 0, leads: 0, cliques: 0, impressoes: 0, compras: 0 },
  );

  return {
    ...t,
    roas: divisao(t.receita, t.investimento),
    cpl: divisao(t.investimento, t.leads),
    cpa: divisao(t.investimento, t.compras),
    cpc: divisao(t.investimento, t.cliques),
    ctr: divisao(t.cliques, t.impressoes) * 100,
    ticketMedio: divisao(t.receita, t.compras),
  };
}

export type Comparativo = {
  atual: Resumo;
  anterior: Resumo;
  serie: PontoSerie[];
  /** Variação percentual do indicador entre os dois períodos. */
  delta: (indicador: keyof Resumo) => number | undefined;
};

/**
 * Compara os últimos `dias` com os `dias` imediatamente anteriores.
 *
 * `delta` devolve `undefined` quando não há período anterior com dados — é o
 * que impede aquele "+100%" sem sentido numa conta que começou ontem. A
 * interface trata `undefined` escondendo o chip de variação.
 */
export function comparar(serieCompleta: PontoSerie[], dias = 30): Comparativo {
  const atualSerie = serieCompleta.slice(-dias);
  const anteriorSerie = serieCompleta.slice(-dias * 2, -dias);

  const atual = resumir(atualSerie);
  const anterior = resumir(anteriorSerie);

  return {
    atual,
    anterior,
    serie: atualSerie,
    delta: (indicador) => {
      if (!anteriorSerie.length) return undefined;
      const base = anterior[indicador];
      if (!base) return undefined;
      return ((atual[indicador] - base) / base) * 100;
    },
  };
}

/** Série curta de um indicador, para o traço de tendência do cartão. */
export function tracado(serie: PontoSerie[], indicador: keyof PontoSerie, pontos = 14) {
  return serie
    .slice(-pontos)
    .map((p) => Number(p[indicador]))
    .filter((v) => Number.isFinite(v));
}
