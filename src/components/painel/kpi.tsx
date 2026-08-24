import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Kpi({
  rotulo,
  valor,
  variacao,
  detalhe,
  invertido = false,
}: {
  rotulo: string;
  valor: string;
  variacao?: number;
  detalhe?: string;
  /** true quando cair é bom (CPL, CPA, inadimplência). */
  invertido?: boolean;
}) {
  const positivo = variacao === undefined ? null : invertido ? variacao < 0 : variacao > 0;

  return (
    <div className="cartao-vidro rounded-lg p-5">
      <p className="text-xs font-medium text-ink-400">{rotulo}</p>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white">{valor}</p>
      <div className="mt-2 flex items-center gap-2">
        {variacao !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              positivo ? "bg-sucesso/15 text-sucesso" : "bg-perigo/15 text-perigo",
            )}
          >
            {variacao > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(variacao).toFixed(1)}%
          </span>
        )}
        {detalhe && <span className="text-[11px] text-ink-500">{detalhe}</span>}
      </div>
    </div>
  );
}
