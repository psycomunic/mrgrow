"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Secao, TituloSecao } from "./secao";
import { cn } from "@/lib/utils";
import { PERGUNTAS } from "./faq-dados";

export function Faq() {
  const [aberto, setAberto] = useState<number | null>(0);

  return (
    <Secao id="faq">
      <TituloSecao
        sobre="Dúvidas frequentes"
        titulo={
          <>
            O que perguntam <span className="texto-gradiente">antes de começar</span>
          </>
        }
      />

      <div className="mx-auto mt-14 max-w-3xl space-y-3">
        {PERGUNTAS.map((item, i) => {
          const ativo = aberto === i;
          return (
            <div key={item.p} className="cartao-vidro overflow-hidden rounded-lg">
              <button
                onClick={() => setAberto(ativo ? null : i)}
                aria-expanded={ativo}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left foco-anel"
              >
                <span className="font-display text-base font-bold text-white">{item.p}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-mrg-400 transition-transform",
                    ativo && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  ativo ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm leading-relaxed text-ink-300">{item.r}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Secao>
  );
}
