"use client";

import { useId } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { brl, compacto, dataCurta, numero } from "@/lib/utils";
import { useTema } from "./tema";

type Ponto = Record<string, number | string>;

/* Grade, marcas dos eixos e caixa da dica mudam com o tema. Ficam aqui em
   JavaScript, e não em token CSS, porque o Recharts entrega estes valores
   como atributo de SVG — e `var()` não resolve em atributo, só em
   declaração de estilo. */
export const CROMO = {
  escuro: {
    grade: "#232833",
    marca: "#646d7e",
    dicaFundo: "#14171e",
    dicaBorda: "#333a48",
    dicaTexto: "#f4f6fa",
    cursor: "#333a48",
  },
  claro: {
    grade: "#e6eaf0",
    marca: "#94a3b8",
    dicaFundo: "#ffffff",
    dicaBorda: "#e3e8ef",
    dicaTexto: "#0e1726",
    cursor: "#ccd5e1",
  },
} as const;

/* Cores das séries. Pelo mesmo motivo do cromo, são valores e não tokens:
   o Recharts as entrega como atributo de SVG. Quem chama escolhe pelo nome
   e o tema decide o tom — assim a mesma série sai clara sobre preto e
   escura sobre branco sem nenhuma tela saber disso. */
export const PALETA = {
  escuro: {
    azul: "#5798ff",
    menta: "#2fd39b",
    roxo: "#a78bfa",
    laranja: "#f5a524",
    vermelho: "#ff6b7d",
    ciano: "#22d3ee",
  },
  claro: {
    azul: "#1668f5",
    menta: "#067a55",
    roxo: "#7c3aed",
    laranja: "#b45309",
    vermelho: "#d92d3f",
    ciano: "#0891b2",
  },
} as const;

export type CorSerie = keyof (typeof PALETA)["escuro"];

export type SerieGrafico = {
  chave: string;
  rotulo: string;
  cor: CorSerie;
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
  const { tema } = useTema();
  const cromo = CROMO[tema];
  const paleta = PALETA[tema];
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
                <stop offset="0%" stopColor={paleta[s.cor]} stopOpacity={0.2} />
                <stop offset="92%" stopColor={paleta[s.cor]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke={cromo.grade} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="data"
            tickFormatter={(v) => rotuloX(v as string)}
            tick={{ fill: cromo.marca, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
            dy={6}
          />
          <YAxis
            yAxisId="esquerda"
            tickFormatter={(v) => compacto(v as number)}
            tick={{ fill: cromo.marca, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          {temDireita && (
            <YAxis
              yAxisId="direita"
              orientation="right"
              tickFormatter={(v) => compacto(v as number)}
              tick={{ fill: cromo.marca, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
          )}
          <Tooltip
            /* Fundo opaco: com o cartão translúcido, a linha do gráfico
               atravessava o texto do próprio tooltip. */
            contentStyle={{
              background: cromo.dicaFundo,
              border: `1px solid ${cromo.dicaBorda}`,
              borderRadius: 12,
              boxShadow: "0 16px 40px -16px rgb(16 24 40 / .28)",
              fontSize: 12,
              padding: "10px 12px",
              color: cromo.dicaTexto,
            }}
            itemStyle={{ padding: "2px 0" }}
            labelStyle={{ fontWeight: 600, marginBottom: 4, color: cromo.dicaTexto }}
            cursor={{ stroke: cromo.cursor, strokeWidth: 1 }}
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
              stroke={paleta[s.cor]}
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
  const { tema } = useTema();
  const paleta = PALETA[tema];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((s) => (
        <span key={s.chave} className="inline-flex items-center gap-1.5 text-xs text-cinza">
          <span className="size-2 rounded-full" style={{ background: paleta[s.cor] }} aria-hidden />
          {s.rotulo}
          {/* Com dois eixos, dizer qual é qual não é opcional. */}
          {s.eixo === "direita" && <span className="text-cinza-claro">(eixo direito)</span>}
        </span>
      ))}
    </div>
  );
}
