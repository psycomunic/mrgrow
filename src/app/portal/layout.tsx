import type { Metadata } from "next";
import Link from "next/link";
import { exigirSessao } from "@/lib/sessao";
import { Logo } from "@/app/(site)/_componentes/cabecalho";

export const metadata: Metadata = { title: { default: "Portal", template: "%s · Portal MR Grow" } };

const ABAS = [
  { href: "/portal", rotulo: "Desempenho" },
  { href: "/portal/relatorios", rotulo: "Relatórios" },
  { href: "/portal/financeiro", rotulo: "Faturas" },
  { href: "/portal/entregas", rotulo: "Entregas" },
];

export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();

  return (
    <div className="min-h-dvh bg-ink-950">
      <header className="border-b border-white/8 bg-ink-900/50 backdrop-blur-xl">
        <div className="container-mrg flex h-16 items-center justify-between">
          <Link href="/portal" className="flex items-center gap-3 foco-anel"><span className="rounded-sm bg-white px-2 py-1.5">
            <Logo className="h-8" /></span>
            <span className="border-l border-white/10 pl-3 text-xs font-medium text-ink-400">
              Portal do cliente
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-300 sm:block">{sessao.nome}</span>
            <form action="/api/auth/sair" method="post">
              <button className="rounded-sm border border-white/10 px-3 py-1.5 text-xs text-ink-200 hover:bg-white/5 foco-anel">
                Sair
              </button>
            </form>
          </div>
        </div>
        <nav className="container-mrg flex gap-1 overflow-x-auto pb-px">
          {ABAS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-300 transition-colors hover:border-mrg-500/50 hover:text-white foco-anel"
            >
              {a.rotulo}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-mrg py-8">{children}</main>
    </div>
  );
}
