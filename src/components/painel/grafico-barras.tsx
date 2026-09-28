"use client";

import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { brl, compacto, numero } from "@/lib/utils";
import { useTema } from "./tema";
import { CROMO, PALETA, type SerieGrafico } from "./grafico-area";

type Ponto = Record<string, number | string>;

/**
 * Barras lado a lado, uma por série.
 *
 * Existe para o par previsto contra recebido, que a agência lia numa
 * planilha antes de ter painel. Área e linha somem quando os dois valores
 * quase coincidem — e é exatamente nesse caso que importa enxergar a
 * folga, porque a folga é a inadimplência do mês. Duas barras encostadas
 * mostram a diferença mesmo quando ela é pequena.
 */
export function GraficoBarras({
  dados,
  series,
  formatoY = "moeda",
  altura = 280,
  rotuloX = (v) => v,
  vazio = "Sem dados no período.",
}: {
  dados: Ponto[];
  series: SerieGrafico[];
  formatoY?: "moeda" | "numero";
  altura?: number;
  rotuloX?: (v: string) => string;
  vazio?: string;
}) {
  const { tema } = useTema();
  const cromo = CROMO[tema];
  const paleta = PALETA[tema];
  const fmt = (v: number) => (formatoY === "moeda" ? brl(v) : numero(v));

  if (!dados.length) {
    return (
      <p className="grid place-items-center text-sm text-cinza" style={{ height: altura }}>
        {vazio}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={cromo.grade} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="data"
          tickFormatter={rotuloX}
          tick={{ fill: cromo.marca, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          /* Doze meses não cabem no celular sem virar tinta ilegível; o
             Recharts remove os que colidem em vez de girar o texto. */
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis
          tickFormatter={(v: number) => compacto(v)}
          tick={{ fill: cromo.marca, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          cursor={{ fill: cromo.cursor, opacity: 0.25 }}
          contentStyle={{
            background: cromo.dicaFundo,
            border: `1px solid ${cromo.dicaBorda}`,
            borderRadius: 10,
            color: cromo.dicaTexto,
            fontSize: 12,
          }}
          labelFormatter={(v: string) => rotuloX(v)}
          formatter={(v: number, nome: string) => [fmt(v), nome]}
        />
        {series.map((s) => (
          <Bar
            key={s.chave}
            dataKey={s.chave}
            name={s.rotulo}
            fill={paleta[s.cor]}
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
