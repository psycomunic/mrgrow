"use client";

import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { brl, compacto, dataCurta } from "@/lib/utils";

type Ponto = Record<string, number | string>;

export function GraficoArea({
  dados,
  series,
  formatoY = "moeda",
  altura = 300,
  rotuloX = dataCurta,
}: {
  dados: Ponto[];
  series: Array<{ chave: string; rotulo: string; cor: string }>;
  formatoY?: "moeda" | "numero";
  altura?: number;
  /** O eixo X nem sempre é data: o fluxo mensal passa rótulos de mês. */
  rotuloX?: (v: string) => string;
}) {
  const fmt = (v: number) => (formatoY === "moeda" ? brl(v) : compacto(v));

  return (
    <div style={{ height: altura }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.chave} id={`grad-${s.chave}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.cor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.cor} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#eceef5" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="data"
            tickFormatter={(v) => rotuloX(v as string)}
            tick={{ fill: "#98a2b3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v) => compacto(v as number)}
            tick={{ fill: "#98a2b3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e9ebf3",
              borderRadius: 12,
              boxShadow: "0 12px 32px -12px rgb(48 56 112 / .18)",
              fontSize: 12,
              color: "#0f1728",
            }}
            labelFormatter={(v) => rotuloX(v as string)}
            formatter={(valor, nome) => [fmt(Number(valor)), nome as string]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#667085" }} iconType="circle" iconSize={8} />
          {series.map((s) => (
            <Area
              key={s.chave}
              type="monotone"
              dataKey={s.chave}
              name={s.rotulo}
              stroke={s.cor}
              strokeWidth={2.5}
              fill={`url(#grad-${s.chave})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
