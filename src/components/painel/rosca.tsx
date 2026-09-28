import { cn } from "@/lib/utils";

export type FatiaRosca = {
  rotulo: string;
  valor: number;
  cor: string;
  /** Texto já formatado à direita da legenda (moeda, contagem, o que for). */
  formatado?: string;
};

/**
 * Rosca com o total no miolo e legenda ao lado.
 *
 * SVG puro, e não Recharts, pelo mesmo motivo do traço de tendência do KPI:
 * é desenho estático de meia dúzia de arcos, e a biblioteca custaria mais em
 * JavaScript do que o próprio gráfico. Como não há interação, também não
 * precisa virar componente de cliente.
 *
 * O vão entre as fatias é subtraído do arco de cada uma, não somado: somando,
 * a soma das fatias passaria de 360° e a última invadiria a primeira.
 */
export function Rosca({
  fatias,
  centro,
  rotuloCentro,
  tamanho = 176,
  espessura = 20,
  vazio = "Sem dados no período.",
  className,
}: {
  fatias: FatiaRosca[];
  centro: string;
  rotuloCentro: string;
  tamanho?: number;
  espessura?: number;
  vazio?: string;
  className?: string;
}) {
  const uteis = fatias.filter((f) => f.valor > 0);
  const total = uteis.reduce((s, f) => s + f.valor, 0);

  const r = (tamanho - espessura) / 2;
  const C = 2 * Math.PI * r;
  const vao = uteis.length > 1 ? 3 : 0;

  /* O início de cada arco é a soma dos anteriores. Sai de uma soma por
     índice, e não de um acumulador reatribuído no `map`: o compilador do
     React proíbe mutação durante o render, e com meia dúzia de fatias o
     custo de refazer a soma é irrelevante. */
  const comprimentos = uteis.map((f) => (f.valor / total) * C);
  const arcos = uteis.map((f, i) => {
    const desenhado = Math.max(comprimentos[i] - vao, 1);
    const inicio = comprimentos.slice(0, i).reduce((s, a) => s + a, 0);
    return { ...f, desenhado, resto: C - desenhado, inicio, fracao: f.valor / total };
  });

  return (
    <div className={cn("flex flex-col items-center gap-5 sm:flex-row sm:gap-6", className)}>
      <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden>
          <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
            <circle
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={r}
              fill="none"
              style={{ stroke: "var(--color-nevoa-2)" }}
              strokeWidth={espessura}
            />
            {arcos.map((a) => (
              <circle
                key={a.rotulo}
                cx={tamanho / 2}
                cy={tamanho / 2}
                r={r}
                fill="none"
                style={{ stroke: a.cor }}
                strokeWidth={espessura}
                strokeLinecap="round"
                strokeDasharray={`${a.desenhado} ${a.resto}`}
                strokeDashoffset={-a.inicio}
              />
            ))}
          </g>
        </svg>

        {/* Centralizado por sobreposição, e não por `text` dentro do SVG:
            assim o número herda a fonte e o `tabular-nums` do painel. */}
        <div className="absolute inset-0 grid place-content-center text-center">
          <p className="font-display text-[1.45rem] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-tinta">
            {centro}
          </p>
          <p className="mt-1.5 text-[11px] leading-tight font-medium text-cinza">{rotuloCentro}</p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5 self-stretch sm:self-center">
        {arcos.map((a) => (
          <li key={a.rotulo} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: a.cor }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-grafite">{a.rotulo}</span>
            <span className="shrink-0 tabular-nums text-cinza">
              {a.formatado ?? `${Math.round(a.fracao * 100)}%`}
            </span>
          </li>
        ))}
        {!arcos.length && <li className="text-[13px] text-cinza-claro">{vazio}</li>}
      </ul>
    </div>
  );
}

/**
 * Anel de progresso de um único número.
 *
 * Aceita passar de 100%: a meta batida com folga é informação, e travar o
 * arco em 100% esconderia justamente o melhor resultado. O arco fecha a volta
 * e o rótulo continua mostrando o valor real.
 */
export function Anel({
  percentual,
  centro,
  rotuloCentro,
  tamanho = 128,
  espessura = 12,
  cor = "var(--color-acento)",
  trilha = "color-mix(in oklab, currentColor 18%, transparent)",
}: {
  percentual: number;
  centro: string;
  rotuloCentro?: string;
  tamanho?: number;
  espessura?: number;
  cor?: string;
  trilha?: string;
}) {
  const r = (tamanho - espessura) / 2;
  const C = 2 * Math.PI * r;
  const cheio = Math.min(Math.max(percentual, 0), 100) / 100;

  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden>
        <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            fill="none"
            style={{ stroke: trilha }}
            strokeWidth={espessura}
          />
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            fill="none"
            style={{ stroke: cor }}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={`${cheio * C} ${C}`}
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <p className="font-display text-lg leading-none font-extrabold tabular-nums">{centro}</p>
        {rotuloCentro && (
          <p className="mt-1 text-[10px] leading-tight font-medium opacity-70">{rotuloCentro}</p>
        )}
      </div>
    </div>
  );
}
