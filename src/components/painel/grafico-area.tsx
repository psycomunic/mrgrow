"use client";

import { useId } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { brl, compacto, dataCurta, numero } from "@/lib/utils";

type Ponto = Record<string, number | string>;

export type SerieGrafico = {
  chave: string;
  rotulo: string;
  cor: string;
  /**
   * Eixo em que a série é plotada.
   *
   * Investimento e receita atribuída vivem em ordens de grandeza diferentes
   * (um ROAS de 4x já significa 4× a escala). No mesmo eixo, a linha de
   * investimento fica colada no zero e não se lê variação nenhuma nela —
   * exatamente o gráfico que existia antes. Colocar a receita à direita
   * devolve relevo às duas.
   */
  eixo?: "esquerda" | "direita";
};

export function GraficoArea({
  dados,
  series,
  formatoY = "moeda",
  altura = 300,
  rotuloX = dataCurta,
  vazio = "Sem dados no período.",
}: {
  dados: Ponto[];
  series: SerieGrafico[];
  formatoY?: "moeda" | "numero";
  altura?: number;
  /** O eixo X nem sempre é data: o fluxo mensal passa rótulos de mês. */
  rotuloX?: (v: string) => string;
  vazio?: string;
}) {
  /* Ids de gradiente precisam ser únicos no documento. Com o id derivado só
     da chave da série, dois gráficos que plotam "investimento" na mesma
     página disputavam o mesmo `<linearGradient>` — e um deles ficava sem
     preenchimento, ou com o preenchimento do outro. */
  const prefixo = useId().replace(/:/g, "");
  const fmt = (v: number) => (formatoY === "moeda" ? brl(v) : numero(v));
  const temDireita = series.some((s) => s.eixo === "direita");

  if (!dados.length) {
    return (
      <div
        style={{ height: altura }}
        className="grid place-items-center rounded-md border border-dashed border-borda text-sm text-cinza-claro"
      >
        {vazio}
      </div>
    );
  }

  return (
    <div style={{ height: altura }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.chave} id={`${prefixo}-${s.chave}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.cor} stopOpacity={0.2} />
                <stop offset="92%" stopColor={s.cor} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke="#eceef5" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="data"
            tickFormatter={(v) => rotuloX(v as string)}
            tick={{ fill: "#98a2b3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
            dy={6}
          />
          <YAxis
            yAxisId="esquerda"
            tickFormatter={(v) => compacto(v as number)}
            tick={{ fill: "#98a2b3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          {temDireita && (
            <YAxis
              yAxisId="direita"
              orientation="right"
              tickFormatter={(v) => compacto(v as number)}
              tick={{ fill: "#98a2b3", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
          )}
          <Tooltip
            /* Fundo opaco: com o cartão translúcido, a linha do gráfico
               atravessava o texto do próprio tooltip. */
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e9ebf3",
              borderRadius: 12,
              boxShadow: "0 16px 40px -16px rgb(48 56 112 / .24)",
              fontSize: 12,
              padding: "10px 12px",
              color: "#0f1728",
            }}
            itemStyle={{ padding: "2px 0" }}
            labelStyle={{ fontWeight: 600, marginBottom: 4, color: "#0f1728" }}
            cursor={{ stroke: "#d6dae8", strokeWidth: 1 }}
            labelFormatter={(v) => rotuloX(v as string)}
            formatter={(valor, nome) => [fmt(Number(valor)), nome as string]}
          />
          {series.map((s) => (
            <Area
              key={s.chave}
              yAxisId={s.eixo === "direita" ? "direita" : "esquerda"}
              type="monotone"
              dataKey={s.chave}
              name={s.rotulo}
              stroke={s.cor}
              strokeWidth={2}
              fill={`url(#${prefixo}-${s.chave})`}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#fff" }}
              dot={false}
              /* Sem animação de entrada: um painel com oito gráficos
                 desenhando-se na abertura lê como lentidão. E o Recharts
                 anima por requestAnimationFrame, que o Chrome congela em aba
                 sem foco — o gráfico ficava em branco até alguém clicar nela. */
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Legenda em texto, fora do gráfico.
 *
 * A `<Legend>` do Recharts ocupa altura dentro da área de plotagem e empurra
 * o desenho para cima, o que deixava um vão morto embaixo do cartão. No
 * cabeçalho ela fica junto do título, onde o olho já está.
 */
export function LegendaGrafico({ series }: { series: SerieGrafico[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((s) => (
        <span key={s.chave} className="inline-flex items-center gap-1.5 text-xs text-cinza">
          <span className="size-2 rounded-full" style={{ background: s.cor }} aria-hidden />
          {s.rotulo}
          {/* Com dois eixos, dizer qual é qual não é opcional. */}
          {s.eixo === "direita" && <span className="text-cinza-claro">(eixo direito)</span>}
        </span>
      ))}
    </div>
  );
}
