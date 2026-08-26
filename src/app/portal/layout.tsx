import type { Metadata } from "next";
import Link from "next/link";
import { exigirSessao } from "@/lib/sessao";
import { Lampada } from "@/app/(site)/_componentes/cabecalho";
import { Abas } from "./_componentes/abas";

export const metadata: Metadata = { title: { default: "Portal", template: "%s · Portal MR Grow" } };
/**
 * Sempre renderizado por requisição.
 *
 * Sem isto, o build de produção pré-renderiza o painel como estático — foi o
 * que o `next build` mostrou. Em modo demonstração nada aqui toca cookie, então
 * o Next conclui que a página é estática e a congela no instante do deploy:
 * "vence hoje" passa a significar o dia do deploy, e o prazo que aparece
 * vermelho hoje continua vermelho no mês que vem. Um app atrás de login não
 * tem o que ganhar sendo estático.
 */
export const dynamic = "force-dynamic";


export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();

  return (
    <div className="min-h-dvh bg-papel">
      <header className="border-b border-borda bg-carta">
        <div className="container-mrg flex h-16 items-center justify-between">
          {/* A arte do logotipo é clara, feita para o fundo escuro da landing:
              sobre este cabeçalho branco ela simplesmente desaparecia. Aqui vale
              a lâmpada com o nome, igual à barra lateral do painel. */}
          <Link href="/portal" className="flex items-center gap-2.5 foco-anel">
            <Lampada className="size-8 shrink-0" />
            <span className="font-display text-sm font-bold text-tinta">MR Grow</span>
            <span className="border-l border-borda pl-2.5 text-xs font-medium text-cinza">
              Portal do cliente
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-grafite sm:block">{sessao.nome}</span>
            <form action="/api/auth/sair" method="post">
              <button className="rounded-sm border border-borda px-3 py-1.5 text-xs text-grafite hover:bg-nevoa foco-anel">
                Sair
              </button>
            </form>
          </div>
        </div>
        <Abas />
      </header>
      <main className="container-mrg py-8">{children}</main>
    </div>
  );
}
