"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Lampada } from "@/app/(site)/_componentes/cabecalho";
import { Icone } from "@/components/painel/icone";
import { GRUPOS, MENU_LISTA, MENU_RODAPE } from "@/lib/navegacao";
import { pode, ROTULO_PAPEL, type Papel } from "@/lib/papeis";
import { cn, iniciais } from "@/lib/utils";

export function BarraLateral({
  papel,
  nome,
  organizacao,
}: {
  papel: Papel;
  nome: string | null;
  organizacao: string;
}) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);

  const daLista = MENU_LISTA.filter((i) => pode(papel, i.recurso, "ver"));
  const doRodape = MENU_RODAPE.filter((i) => pode(papel, i.recurso, "ver"));

  const ativo = (href: string) =>
    href === "/painel" ? caminho === "/painel" : caminho.startsWith(href);

  /* No celular a gaveta tem que fechar ao navegar; senão ela fica por cima da
     página nova e o clique seguinte cai no fundo escuro. Fechar no clique do
     link e não num efeito sobre o pathname: efeito que chama setState
     encadeia uma renderização a mais em toda navegação, inclusive no desktop,
     onde a gaveta nem existe. */
  const fechar = () => setAberto(false);

  const conteudo = (
    <div className="flex h-full flex-col">
      <Link
        href="/painel"
        className="flex h-16 shrink-0 items-center gap-2.5 px-5 foco-anel"
        aria-label="Ir para a visão geral"
      >
        <Lampada className="size-8 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-bold text-tinta">
            {organizacao}
          </span>
          <span className="block text-[11px] text-cinza-claro">Plataforma da agência</span>
        </span>
      </Link>

      {/* A máscara desbota as bordas da lista quando ela rola, para o corte
          parecer intencional em vez de item cortado pela metade. */}
      <nav
        className="flex-1 space-y-5 overflow-y-auto px-3 py-3 [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]"
        aria-label="Navegação do painel"
      >
        {GRUPOS.map((grupo) => {
          const doGrupo = daLista.filter((i) => i.grupo === grupo);
          if (!doGrupo.length) return null;
          return (
            <div key={grupo}>
              <p className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.16em] text-cinza-claro uppercase">
                {grupo}
              </p>
              <ul className="space-y-0.5">
                {doGrupo.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={fechar}
                      aria-current={ativo(item.href) ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors foco-anel",
                        ativo(item.href)
                          ? "bg-mrg-50 font-semibold text-mrg-700"
                          : "font-medium text-grafite hover:bg-nevoa hover:text-tinta",
                      )}
                    >
                      {ativo(item.href) && (
                        <span
                          aria-hidden
                          className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-mrg-500"
                        />
                      )}
                      <Icone
                        nome={item.icone}
                        className={cn(
                          "size-4 shrink-0",
                          ativo(item.href) ? "text-mrg-600" : "text-cinza-claro",
                        )}
                      />
                      {item.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-borda-fraca p-3">
        {doRodape.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={fechar}
            aria-current={ativo(item.href) ? "page" : undefined}
            className={cn(
              "mb-1 flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors foco-anel",
              ativo(item.href)
                ? "bg-mrg-50 font-semibold text-mrg-700"
                : "font-medium text-grafite hover:bg-nevoa hover:text-tinta",
            )}
          >
            <Icone
              nome={item.icone}
              className={cn("size-4 shrink-0", ativo(item.href) ? "text-mrg-600" : "text-cinza-claro")}
            />
            {item.rotulo}
          </Link>
        ))}

        <div className="flex items-center gap-3 rounded-lg bg-nevoa px-2.5 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mrg-500 text-xs font-bold text-white">
            {iniciais(nome)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-tinta">{nome ?? "Usuário"}</p>
            <p className="text-[11px] text-cinza-claro">{ROTULO_PAPEL[papel]}</p>
          </div>
          <form action="/api/auth/sair" method="post">
            <button
              type="submit"
              aria-label="Sair da conta"
              title="Sair"
              className="rounded-sm p-2 text-cinza transition-colors hover:bg-carta hover:text-perigo foco-anel"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-3 left-3 z-40 hidden w-60 rounded-xl bg-carta shadow-concha lg:block">
        {conteudo}
      </aside>

      <button
        onClick={() => setAberto(true)}
        className="fixed top-3.5 left-4 z-50 rounded-sm border border-borda bg-carta p-2 text-grafite shadow-card lg:hidden foco-anel"
        aria-label="Abrir menu"
        aria-expanded={aberto}
      >
        <Menu className="size-5" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-tinta/40" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-carta shadow-concha">
            <button
              onClick={() => setAberto(false)}
              className="absolute top-4 right-3 z-10 rounded-sm p-2 text-grafite foco-anel"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            {conteudo}
          </aside>
        </div>
      )}
    </>
  );
}
