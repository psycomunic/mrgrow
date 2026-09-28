import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, numero } from "@/lib/utils";

/**
 * Linha de estatística com barra de proporção.
 *
 * É o formato das referências de dashboard: em vez de mais um cartão grande
 * por número, várias medidas empilhadas dentro de um cartão só, cada uma com
 * a sua barra. Cabe mais informação na mesma altura de tela.
 *
 * `proporcao` é opcional de propósito. Barra pede denominador, e nem todo
 * indicador tem um: desenhar uma barra de "leads no período" exigiria inventar
 * uma meta. Sem `proporcao`, a linha sai sem barra.
 */
export function Faixa({
  rotulo,
  valor,
  detalhe,
  proporcao,
  variacao,
  invertido = false,
  cor = "var(--color-acento)",
  icone,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  /** De 0 a 1. Fora disso a barra é aparada, não estourada. */
  proporcao?: number;
  variacao?: number;
  invertido?: boolean;
  cor?: string;
  icone?: React.ReactNode;
}) {
  const boa = variacao === undefined ? null : invertido ? variacao < 0 : variacao > 0;
  const largura = proporcao === undefined ? 0 : Math.min(Math.max(proporcao, 0), 1) * 100;

  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        {icone && (
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full [&_svg]:size-4"
            style={{ background: `color-mix(in oklab, ${cor} 16%, transparent)`, color: cor }}
          >
            {icone}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-grafite">{rotulo}</p>
          {detalhe && <p className="mt-0.5 truncate text-[11px] text-cinza-claro">{detalhe}</p>}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-[15px] leading-none font-bold tabular-nums text-tinta">
            {valor}
          </p>
          {variacao !== undefined && Math.abs(variacao) >= 0.05 && (
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                boa ? "text-sucesso" : "text-perigo",
              )}
            >
              {variacao > 0 ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {numero(Math.abs(variacao), 1)}%
            </p>
          )}
        </div>
      </div>

      {proporcao !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-nevoa-2">
          <div className="h-full rounded-full" style={{ width: `${largura}%`, background: cor }} />
        </div>
      )}
    </div>
  );
}
