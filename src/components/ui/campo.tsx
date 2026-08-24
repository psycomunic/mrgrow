import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-400 transition-colors focus:border-mrg-500/60 focus:bg-white/[0.05] foco-anel disabled:opacity-50";

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

export const Selecao = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(base, "appearance-none bg-ink-900 pr-9", className)} {...props} />
));
Selecao.displayName = "Selecao";

export function Rotulo({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-xs font-medium text-ink-200", className)} {...props} />;
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
      {dica && !erro && <p className="mt-1 text-xs text-ink-400">{dica}</p>}
      {erro && <p className="mt-1 text-xs text-perigo">{erro}</p>}
    </div>
  );
}
