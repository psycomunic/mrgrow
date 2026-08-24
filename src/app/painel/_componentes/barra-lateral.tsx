"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Lampada } from "@/app/(site)/_componentes/cabecalho";
import { Icone } from "@/components/painel/icone";
import { GRUPOS, MENU } from "@/lib/navegacao";
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
  const itens = MENU.filter((i) => pode(papel, i.recurso, "ver"));

  const conteudo = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/8 px-5">
        <Lampada className="size-8 shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-extrabold text-white">{organizacao}</p>
          <p className="text-[11px] text-ink-500">Plataforma da agência</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GRUPOS.map((grupo) => {
          const doGrupo = itens.filter((i) => i.grupo === grupo);
          if (!doGrupo.length) return null;
          return (
            <div key={grupo}>
              <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] text-ink-500 uppercase">
                {grupo}
              </p>
              <ul className="space-y-0.5">
                {doGrupo.map((item) => {
                  const ativo =
                    item.href === "/painel" ? caminho === "/painel" : caminho.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setAberto(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors foco-anel",
                          ativo
                            ? "bg-mrg-500/15 text-white ring-1 ring-inset ring-mrg-500/30"
                            : "text-ink-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icone nome={item.icone} className={cn("size-4.5", ativo && "text-mrg-400")} />
                        {item.rotulo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-3">
        <div className="flex items-center gap-3 rounded-sm px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mrg-500/20 text-xs font-bold text-mrg-300">
            {iniciais(nome)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-100">{nome ?? "Usuário"}</p>
            <p className="text-[11px] text-ink-500">{ROTULO_PAPEL[papel]}</p>
          </div>
          <form action="/api/auth/sair" method="post">
            <button
              type="submit"
              aria-label="Sair"
              className="rounded-sm p-2 text-ink-400 transition-colors hover:bg-white/5 hover:text-perigo foco-anel"
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/8 bg-ink-900/60 backdrop-blur-xl lg:block">
        {conteudo}
      </aside>

      <button
        onClick={() => setAberto(true)}
        className="fixed top-3.5 left-4 z-50 rounded-sm border border-white/10 bg-ink-900/90 p-2 text-ink-200 backdrop-blur lg:hidden foco-anel"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-ink-950">
            <button
              onClick={() => setAberto(false)}
              className="absolute top-4 right-3 rounded-sm p-2 text-ink-300 foco-anel"
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
