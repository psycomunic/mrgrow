"use client";

import { createContext, useContext } from "react";
import type { Papel } from "@/lib/papeis";

export type DadosSessao = { papel: Papel; nome: string | null; organizacao: string };

const Ctx = createContext<DadosSessao | null>(null);

/**
 * Espelho da sessão para os componentes de cliente do painel.
 *
 * O papel do usuário é decidido no servidor, mas a busca rápida e o menu
 * precisam dele no navegador para não oferecer atalho para uma tela que o
 * perfil não abre. Só o que a interface usa vem para cá — nada de id nem
 * e-mail.
 */
export function SessaoPainel({ valor, children }: { valor: DadosSessao; children: React.ReactNode }) {
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function usePainel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePainel precisa estar dentro de <SessaoPainel>.");
  return ctx;
}
