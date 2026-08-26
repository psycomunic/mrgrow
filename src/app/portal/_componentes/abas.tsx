"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/portal", rotulo: "Desempenho" },
  { href: "/portal/relatorios", rotulo: "Relatórios" },
  { href: "/portal/financeiro", rotulo: "Faturas" },
  { href: "/portal/entregas", rotulo: "Entregas" },
];

/**
 * As abas precisam saber qual está aberta, e isso só existe no cliente.
 * Sem o estado ativo, as quatro ficam idênticas e o cliente perde a
 * referência de onde está.
 */
export function Abas() {
  const caminho = usePathname();

  return (
    <nav className="container-mrg flex gap-1 overflow-x-auto pb-px">
      {ABAS.map((a) => {
        const ativa = a.href === "/portal" ? caminho === "/portal" : caminho.startsWith(a.href);
        return (
          <Link
            key={a.href}
            href={a.href}
            aria-current={ativa ? "page" : undefined}
            className={[
              "border-b-2 px-3 py-2.5 text-sm transition-colors foco-anel",
              ativa
                ? "border-mrg-500 font-semibold text-tinta"
                : "border-transparent font-medium text-grafite hover:border-borda-forte hover:text-tinta",
            ].join(" ")}
          >
            {a.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
