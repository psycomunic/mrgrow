import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, numero } from "@/lib/utils";

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
  dica,
}: {
  rotulo: string;
  valor: string;
  variacao?: number;
  detalhe?: string;
  /** true quando cair é bom (CPL, CPA, inadimplência). */
  invertido?: boolean;
  icone?: React.ReactNode;
  tom?: TomKpi;
  /** Série curta para o traço de tendência do cartão. */
  serie?: number[];
  /** Texto de apoio no hover — explica de onde vem o número. */
  dica?: string;
}) {
  /* Três estados, não dois. Variação exatamente zero não é queda: antes ela
     caía no `else` e o cartão mostrava seta para baixo em vermelho para uma
     métrica que simplesmente não mudou. */
  const direcao =
    variacao === undefined || Math.abs(variacao) < 0.05
      ? "estavel"
      : (invertido ? variacao < 0 : variacao > 0)
        ? "boa"
        : "ruim";

  /* Uma série com dois valores distintos não é tendência: desenharia uma linha
     reta com um degrau, que informa menos do que engana. */
  const temTraco = !!serie && new Set(serie.filter((v) => Number.isFinite(v))).size > 2;
  const temRodape = variacao !== undefined || !!detalhe || temTraco;

  return (
    <div className="cartao p-5" title={dica}>
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

      {/* `tabular-nums` alinha os dígitos entre cartões vizinhos: sem isso,
          quatro números lado a lado dançam de um para o outro. */}
      <p className="font-display truncate text-[1.65rem] leading-none font-bold tracking-[-0.02em] tabular-nums text-tinta">
        {valor}
      </p>
      <p className="mt-2 truncate text-[13px] font-medium text-cinza">{rotulo}</p>

      {/* O traço fica nesta linha, e não ao lado do número.
          Alinhado ao número, ele disputava a mesma largura: em cartão estreito
          o valor não tinha para onde encolher e o desenho passava por cima
          de "R$ 246.202,00". */}
      {temRodape && (
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {variacao !== undefined && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  direcao === "boa" && "bg-sucesso/12 text-sucesso",
                  direcao === "ruim" && "bg-perigo/12 text-perigo",
                  direcao === "estavel" && "bg-nevoa-2 text-cinza",
                )}
              >
                {direcao === "estavel" ? (
                  <Minus className="size-3" />
                ) : variacao > 0 ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {numero(Math.abs(variacao), 1)}%
              </span>
            )}
            {detalhe && <span className="truncate text-[11px] text-cinza-claro">{detalhe}</span>}
          </div>

          {temTraco && <Faisca pontos={serie!} cor={TRACO[tom]} id={`${tom}-${rotulo}`} />}
        </div>
      )}
    </div>
  );
}

/**
 * Traço de tendência em SVG puro. Não usa Recharts de propósito: são quatro ou
 * mais por tela e a biblioteca custaria mais que o desenho.
 */
function Faisca({ pontos, cor, id }: { pontos: number[]; cor: string; id: string }) {
  const L = 72;
  const A = 26;
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const faixa = max - min || 1;

  const xy = pontos.map((p, i) => [
    (i / (pontos.length - 1)) * L,
    A - 2 - ((p - min) / faixa) * (A - 5),
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
    <svg
      width={L}
      height={A}
      viewBox={`0 0 ${L} ${A}`}
      className="shrink-0 self-end"
      aria-hidden
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={cor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d}L${L},${A}L0,${A}Z`} fill={`url(#${grad})`} />
      <path d={d} fill="none" stroke={cor} strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}
