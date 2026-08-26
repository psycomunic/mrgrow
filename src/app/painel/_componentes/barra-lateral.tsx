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
      <div className="flex h-[4.25rem] items-center gap-2.5 px-5">
        <Lampada className="size-8 shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-extrabold text-tinta">{organizacao}</p>
          <p className="text-[11px] text-cinza-claro">Plataforma da agência</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GRUPOS.map((grupo) => {
          const doGrupo = itens.filter((i) => i.grupo === grupo);
          if (!doGrupo.length) return null;
          return (
            <div key={grupo}>
              <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] text-cinza-claro uppercase">
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
                          "relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors foco-anel",
                          ativo
                            ? "bg-mrg-50 font-semibold text-mrg-700"
                            : "font-medium text-grafite hover:bg-nevoa hover:text-tinta",
                        )}
                      >
                        {ativo && (
                          <span
                            aria-hidden
                            className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-mrg-500"
                          />
                        )}
                        <Icone
                          nome={item.icone}
                          className={cn("size-4.5", ativo ? "text-mrg-600" : "text-cinza-claro")}
                        />
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

      <div className="m-3 mt-0 rounded-lg bg-nevoa p-1.5">
        <div className="flex items-center gap-3 rounded-sm px-2 py-2">
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
              aria-label="Sair"
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
      >
        <Menu className="size-5" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-tinta/40" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-carta shadow-concha">
            <button
              onClick={() => setAberto(false)}
              className="absolute top-4 right-3 rounded-sm p-2 text-grafite foco-anel"
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
