"use client";

import { useState } from "react";
import { Columns3, List, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Filtros } from "./filtros";
import { Indicadores, PorPessoa, Quadro } from "./quadro";
import { Lista } from "./lista";

const VISOES = [
  { valor: "quadro", rotulo: "Quadro", icone: Columns3 },
  { valor: "pessoa", rotulo: "Por pessoa", icone: Users },
  { valor: "lista", rotulo: "Lista", icone: List },
] as const;

type Visao = (typeof VISOES)[number]["valor"];

/**
 * A tela de tarefas por inteiro.
 *
 * A visão escolhida mora aqui, e não na URL como o recorte da visão geral:
 * ela é preferência de quem está olhando naquele instante, não um estado que
 * alguém vá querer compartilhar por link.
 */
export function Area() {
  const [visao, setVisao] = useState<Visao>("quadro");

  return (
    <>
      <Indicadores />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="inline-flex gap-1 rounded-full border border-borda bg-carta p-1">
          {VISOES.map((v) => {
            const Icone = v.icone;
            return (
              <button
                key={v.valor}
                type="button"
                onClick={() => setVisao(v.valor)}
                aria-pressed={visao === v.valor}
                className={cn(
                  "foco-anel inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  visao === v.valor
                    ? "bg-mrg-500 text-white shadow-[0_6px_16px_-8px_color-mix(in_oklab,var(--color-mrg-500)_85%,transparent)]"
                    : "text-cinza hover:bg-nevoa hover:text-tinta",
                )}
              >
                <Icone className="size-3.5" />
                {v.rotulo}
              </button>
            );
          })}
        </nav>
      </div>

      <Filtros />

      {visao === "quadro" && <Quadro />}
      {visao === "pessoa" && <PorPessoa />}
      {visao === "lista" && <Lista />}
    </>
  );
}
