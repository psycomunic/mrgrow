"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  alterarPapel,
  convidarMembro,
  desativarMembro,
  reativarMembro,
  revogarConvite,
} from "./acoes";
import { emDias, hoje } from "@/lib/tempo";
import type { Convite, Membro } from "@/lib/equipe";
import { ROTULO_PAPEL, type Papel } from "@/lib/papeis";

type Estado = {
  membros: Membro[];
  convites: Convite[];
  /** Vínculo de quem está olhando — a linha dele não ganha controles. */
  usuarioId: string;
  meuPapel: Papel;
  demo: boolean;
  ocupado: boolean;
  mudarPapel: (m: Membro, papel: Papel) => void;
  alternarAcesso: (m: Membro) => void;
  convidar: (email: string, papel: Papel) => Promise<string | null>;
  revogar: (c: Convite) => void;
};

const Contexto = createContext<Estado | null>(null);

export function useEquipe() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useEquipe precisa estar dentro de <EquipeProvider>.");
  return ctx;
}

export function EquipeProvider({
  membrosIniciais,
  convitesIniciais,
  usuarioId,
  meuPapel,
  demo,
  children,
}: {
  membrosIniciais: Membro[];
  convitesIniciais: Convite[];
  usuarioId: string;
  meuPapel: Papel;
  demo: boolean;
  children: React.ReactNode;
}) {
  const [membros, setMembros] = useState(membrosIniciais);
  const [convites, setConvites] = useState(convitesIniciais);
  const [doServidor, setDoServidor] = useState({ membrosIniciais, convitesIniciais });
  const [ocupado, iniciar] = useTransition();

  // Depois de gravar, `revalidatePath` manda listas novas; o estado local segue.
  if (
    doServidor.membrosIniciais !== membrosIniciais ||
    doServidor.convitesIniciais !== convitesIniciais
  ) {
    setDoServidor({ membrosIniciais, convitesIniciais });
    setMembros(membrosIniciais);
    setConvites(convitesIniciais);
  }

  const mudarPapel = useCallback(
    (m: Membro, papel: Papel) => {
      if (papel === m.papel) return;
      const anterior = membros;
      setMembros((l) => l.map((x) => (x.id === m.id ? { ...x, papel } : x)));

      iniciar(async () => {
        const r = await alterarPapel(m.id, papel);
        if (!r.ok) {
          setMembros(anterior);
          toast.error(r.erro ?? "Não foi possível alterar o papel.");
          return;
        }
        toast.success(
          r.demo
            ? "Papel alterado (não salvo: modo demonstração)."
            : `${m.nome} agora entra como ${ROTULO_PAPEL[papel]}.`,
        );
      });
    },
    [membros],
  );

  const alternarAcesso = useCallback(
    (m: Membro) => {
      const anterior = membros;
      const ativo = !m.ativo;
      if (!ativo && !confirm(`Desativar o acesso de ${m.nome}? Ele perde o login imediatamente.`)) {
        return;
      }
      setMembros((l) => l.map((x) => (x.id === m.id ? { ...x, ativo } : x)));

      iniciar(async () => {
        const r = ativo ? await reativarMembro(m.id) : await desativarMembro(m.id);
        if (!r.ok) {
          setMembros(anterior);
          toast.error(r.erro ?? "Não foi possível mudar o acesso.");
          return;
        }
        toast.success(ativo ? `Acesso de ${m.nome} reativado.` : `Acesso de ${m.nome} desativado.`);
      });
    },
    [membros],
  );

  /** Devolve o link do convite para o diálogo mostrar, ou null se falhou. */
  const convidar = useCallback(async (email: string, papel: Papel) => {
    const r = await convidarMembro(email, papel);
    if (!r.ok || !r.link) {
      toast.error(r.erro ?? "Não foi possível gerar o convite.");
      return null;
    }

    // Fora do callback: dentro dele o TypeScript já perdeu o estreitamento.
    const link = r.link;
    setConvites((l) => [
      {
        id: `local-${Date.now()}`,
        email: email.trim().toLowerCase(),
        papel,
        token: link.split("=")[1] ?? "",
        expiraEm: emDias(7),
        criadoEm: hoje(),
      },
      ...l,
    ]);
    toast.success(r.demo ? "Convite gerado (não salvo: modo demonstração)." : "Convite gerado.");
    return link;
  }, []);

  const revogar = useCallback(
    (c: Convite) => {
      const anterior = convites;
      setConvites((l) => l.filter((x) => x.id !== c.id));

      iniciar(async () => {
        const r = await revogarConvite(c.id);
        if (!r.ok) {
          setConvites(anterior);
          toast.error(r.erro ?? "Não foi possível revogar o convite.");
          return;
        }
        toast.success(`Convite de ${c.email} revogado. O link deixa de funcionar.`);
      });
    },
    [convites],
  );

  const valor = useMemo<Estado>(
    () => ({
      membros,
      convites,
      usuarioId,
      meuPapel,
      demo,
      ocupado,
      mudarPapel,
      alternarAcesso,
      convidar,
      revogar,
    }),
    [membros, convites, usuarioId, meuPapel, demo, ocupado, mudarPapel, alternarAcesso, convidar, revogar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
