import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tons pastel dos chips: cada indicador ganha uma cor própria e constante. */
const CHIP = {
  azul: "bg-chip-azul text-mrg-600",
  menta: "bg-chip-menta text-sucesso",
  rosa: "bg-chip-rosa text-perigo",
  pessego: "bg-chip-pessego text-alerta",
} as const;

const TRACO = {
  azul: "#1668f5",
  menta: "#067a55",
  rosa: "#d92d3f",
  pessego: "#b54708",
} as const;

export type TomKpi = keyof typeof CHIP;

export function Kpi({
  rotulo,
  valor,
  variacao,
  detalhe,
  invertido = false,
  icone,
  tom = "azul",
  serie,
}: {
  rotulo: string;
  valor: string;
  variacao?: number;
  detalhe?: string;
  /** true quando cair é bom (CPL, CPA, inadimplência). */
  invertido?: boolean;
  icone?: React.ReactNode;
  tom?: TomKpi;
  /** Série curta para o traço de tendência ao lado do número. */
  serie?: number[];
}) {
  const positivo = variacao === undefined ? null : invertido ? variacao < 0 : variacao > 0;

  return (
    <div className="cartao p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {icone && (
            <span
              className={cn(
                "mb-3 grid size-10 place-items-center rounded-full [&_svg]:size-5",
                CHIP[tom],
              )}
            >
              {icone}
            </span>
          )}
          <p className="font-display text-2xl font-extrabold tracking-tight text-tinta">{valor}</p>
          <p className="mt-1 text-xs font-medium text-cinza">{rotulo}</p>
        </div>

        {/* Menos de dois meses com movimento não é tendência: seria uma
            linha reta com um pico no fim, que engana mais do que informa. */}
        {serie && serie.filter((v) => v !== 0).length > 1 && (
          <Faisca pontos={serie} cor={TRACO[tom]} id={`${tom}-${rotulo}`} />
        )}
      </div>

      {(variacao !== undefined || detalhe) && (
        <div className="mt-3 flex items-center gap-2">
          {variacao !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                positivo ? "bg-sucesso/12 text-sucesso" : "bg-perigo/12 text-perigo",
              )}
            >
              {variacao > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(variacao).toFixed(1)}%
            </span>
          )}
          {detalhe && <span className="text-[11px] text-cinza-claro">{detalhe}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Traço de tendência em SVG puro. Não usa Recharts de propósito: são
 * quatro por tela e a biblioteca custaria mais que o desenho.
 */
function Faisca({ pontos, cor, id }: { pontos: number[]; cor: string; id: string }) {
  const L = 88;
  const A = 40;
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const faixa = max - min || 1;

  const xy = pontos.map((p, i) => [
    (i / (pontos.length - 1)) * L,
    A - 3 - ((p - min) / faixa) * (A - 6),
  ]);

  // Curva suave por ponto médio: evita bicos sem precisar de spline.
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    d += `Q${x0},${y0} ${(x0 + x1) / 2},${(y0 + y1) / 2}`;
  }
  d += `L${xy[xy.length - 1][0]},${xy[xy.length - 1][1]}`;

  const grad = `faisca-${id.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity={0.22} />
          <stop offset="100%" stopColor={cor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d}L${L},${A}L0,${A}Z`} fill={`url(#${grad})`} />
      <path d={d} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
