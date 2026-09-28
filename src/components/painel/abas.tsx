import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Barra de abas em pílula.
 *
 * São links, e não botões: o recorte escolhido vira `?` na URL, então
 * recarregar, compartilhar ou voltar mantém a tela no mesmo estado, e a
 * barra funciona sem JavaScript no cliente.
 */
export function Abas({
  itens,
  className,
}: {
  itens: { rotulo: string; href: string; ativo: boolean }[];
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-borda bg-carta p-1",
        className,
      )}
    >
      {itens.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.ativo ? "page" : undefined}
          className={cn(
            "foco-anel rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
            i.ativo
              ? "bg-mrg-500 text-white shadow-[0_6px_16px_-8px_color-mix(in_oklab,var(--color-mrg-500)_85%,transparent)]"
              : "text-cinza hover:bg-nevoa hover:text-tinta",
          )}
        >
          {i.rotulo}
        </Link>
      ))}
    </nav>
  );
}
