import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-md border border-borda bg-nevoa px-3.5 py-2.5 text-sm text-tinta placeholder:text-cinza transition-colors focus:border-mrg-500/60 focus:bg-nevoa foco-anel disabled:opacity-50";

export const Entrada = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(base, className)} {...props} />,
);
Entrada.displayName = "Entrada";

export const AreaTexto = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "min-h-28 resize-y", className)} {...props} />
));
AreaTexto.displayName = "AreaTexto";

/**
 * O `appearance-none` tira a seta nativa, então ela precisa ser desenhada.
 * Sem isso o campo fica idêntico a um input de texto e ninguém percebe que
 * pode abrir.
 */
export const Selecao = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <span className="relative block">
    <select
      ref={ref}
      className={cn(
        base,
        "appearance-none bg-carta pr-9",
        /* A lista suspensa é desenhada pelo sistema, não por este CSS. Sem
           pintar as <option> e sem declarar color-scheme, ela abre clara e
           herda o texto claro do campo, ficando ilegível. */
        "[color-scheme:dark] [&>option]:bg-carta [&>option]:text-tinta",
        className,
      )}
      {...props}
    />
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-cinza"
    />
  </span>
));
Selecao.displayName = "Selecao";

export function Rotulo({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-xs font-medium text-grafite", className)} {...props} />;
}

export function Campo({
  rotulo,
  dica,
  erro,
  children,
  className,
}: {
  rotulo?: string;
  dica?: string;
  erro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {rotulo && <Rotulo>{rotulo}</Rotulo>}
      {children}
      {dica && !erro && <p className="mt-1 text-xs text-cinza">{dica}</p>}
      {erro && <p className="mt-1 text-xs text-perigo">{erro}</p>}
    </div>
  );
}
