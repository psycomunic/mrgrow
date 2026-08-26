import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const estilos = cva(
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 foco-anel [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        primario:
          "bg-mrg-500 text-white shadow-[0_8px_20px_-8px_rgba(22,104,245,.55)] hover:bg-mrg-600 hover:shadow-[0_10px_26px_-8px_rgba(22,104,245,.7)] active:translate-y-px",
        // Invertido: escuro sobre claro é o que sobressai neste tema.
        secundario: "bg-tinta text-white hover:bg-grafite",
        contorno: "border border-borda-forte bg-carta text-tinta hover:bg-nevoa",
        fantasma: "text-grafite hover:bg-nevoa hover:text-tinta",
        perigo: "bg-perigo text-white hover:brightness-110",
        sucesso: "bg-sucesso text-white hover:brightness-110",
      },
      tamanho: {
        sm: "h-9 rounded-sm px-3.5 text-sm",
        md: "h-11 rounded-md px-5 text-sm",
        lg: "h-13 rounded-md px-7 text-base",
        xl: "h-15 rounded-lg px-9 text-base sm:text-lg",
        icone: "h-9 w-9 rounded-sm",
      },
      largura: { auto: "", cheia: "w-full" },
    },
    defaultVariants: { variante: "primario", tamanho: "md", largura: "auto" },
  },
);

type BaseProps = VariantProps<typeof estilos> & { className?: string; children?: React.ReactNode };

export type BotaoProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">;

export function Botao({ className, variante, tamanho, largura, ...props }: BotaoProps) {
  return <button className={cn(estilos({ variante, tamanho, largura }), className)} {...props} />;
}

export type BotaoLinkProps = BaseProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { externo?: boolean };

export function BotaoLink({
  className,
  variante,
  tamanho,
  largura,
  externo,
  ...props
}: BotaoLinkProps) {
  return (
    <Link
      className={cn(estilos({ variante, tamanho, largura }), className)}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}

export { estilos as estilosBotao };
