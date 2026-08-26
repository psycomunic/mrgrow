import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const estilos = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      tom: {
        neutro: "bg-nevoa text-grafite ring-borda",
        azul: "bg-mrg-500/15 text-mrg-600 ring-mrg-500/30",
        sucesso: "bg-sucesso/15 text-sucesso ring-sucesso/30",
        alerta: "bg-alerta/15 text-alerta ring-alerta/30",
        perigo: "bg-perigo/15 text-perigo ring-perigo/30",
      },
    },
    defaultVariants: { tom: "neutro" },
  },
);

export type EtiquetaProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof estilos>;

export function Etiqueta({ className, tom, ...props }: EtiquetaProps) {
  return <span className={cn(estilos({ tom }), className)} {...props} />;
}
