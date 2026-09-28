"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tema = "claro" | "escuro";

const CHAVE = "mrg-tema";

/**
 * Script que roda antes da primeira pintura.
 *
 * A preferência mora em `sessionStorage`, e não em `localStorage`, porque
 * o painel deve sempre abrir no escuro: a sessão guarda a troca enquanto a
 * aba está aberta e esquece quando ela fecha. Com `localStorage`, quem
 * experimentasse o claro uma vez veria claro para sempre.
 *
 * O `try` existe porque o armazenamento lança em janela anônima com dados
 * de site bloqueados, e um erro aqui derrubaria a página inteira antes de
 * qualquer coisa aparecer.
 */
export const SCRIPT_TEMA = `try{var t=sessionStorage.getItem(${JSON.stringify(CHAVE)});document.documentElement.dataset.tema=t==="claro"?"claro":"escuro"}catch(e){document.documentElement.dataset.tema="escuro"}`;

/* O tema mora no DOM, não em estado do React: o script acima já o
   escreveu antes de qualquer componente existir. `useSyncExternalStore`
   lê de lá e avisa quem estiver na tela quando mudar. */
const ouvintes = new Set<() => void>();

function inscrever(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
  };
}

function noCliente(): Tema {
  return document.documentElement.dataset.tema === "claro" ? "claro" : "escuro";
}

/* O servidor não tem como saber a preferência de quem vai abrir. Entrega o
   escuro, que é o padrão, e o script corrige antes de pintar. */
function noServidor(): Tema {
  return "escuro";
}

export function useTema() {
  const tema = useSyncExternalStore(inscrever, noCliente, noServidor);

  const definir = useCallback((novo: Tema) => {
    document.documentElement.dataset.tema = novo;
    try {
      sessionStorage.setItem(CHAVE, novo);
    } catch {
      /* Sem armazenamento a troca vale só até recarregar, e tudo bem: o
         que não pode é ela falhar por causa disso. */
    }
    for (const avisar of ouvintes) avisar();
  }, []);

  const alternar = useCallback(
    () => definir(noCliente() === "claro" ? "escuro" : "claro"),
    [definir],
  );

  return { tema, definir, alternar };
}

/** Botão de alternar entre claro e escuro. */
export function BotaoTema({ className }: { className?: string }) {
  const { tema, alternar } = useTema();
  const claro = tema === "claro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={claro ? "Mudar para o tema escuro" : "Mudar para o tema claro"}
      title={claro ? "Tema escuro" : "Tema claro"}
      className={cn(
        "foco-anel grid size-9 place-items-center rounded-sm border border-borda-forte bg-nevoa text-grafite transition-colors hover:bg-nevoa-2 hover:text-tinta",
        className,
      )}
    >
      {claro ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
