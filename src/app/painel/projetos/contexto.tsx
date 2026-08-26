"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ajustarProgresso,
  atualizarProjeto,
  criarProjeto,
  excluirProjeto,
  type DadosProjeto,
} from "./acoes";
import type { Projeto } from "@/lib/projetos";

export type OpcaoCliente = { id: string; nome: string };

type Contexto = {
  projetos: Projeto[];
  clientes: OpcaoCliente[];
  demo: boolean;
  salvando: boolean;
  criar: (d: DadosProjeto) => Promise<boolean>;
  editar: (id: string, d: DadosProjeto) => Promise<boolean>;
  ajustar: (id: string, progresso: number) => void;
  excluir: (id: string) => void;
};

const Ctx = createContext<Contexto | null>(null);

export function useProjetos() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProjetos precisa estar dentro de <ProjetosProvider>.");
  return ctx;
}

let sequencia = 0;

export function ProjetosProvider({
  projetosIniciais,
  clientes,
  demo,
  children,
}: {
  projetosIniciais: Projeto[];
  clientes: OpcaoCliente[];
  demo: boolean;
  children: React.ReactNode;
}) {
  const [projetos, setProjetos] = useState(projetosIniciais);
  const [ultimoDoServidor, setUltimo] = useState(projetosIniciais);
  const [salvando, iniciar] = useTransition();

  if (projetosIniciais !== ultimoDoServidor) {
    setUltimo(projetosIniciais);
    setProjetos(projetosIniciais);
  }

  const criar = useCallback(
    async (d: DadosProjeto) => {
      const anterior = projetos;
      const cliente = clientes.find((c) => c.id === d.cliente_id) ?? null;

      setProjetos((l) => [
        {
          id: `local-${++sequencia}`,
          nome: d.nome,
          descricao: d.descricao || null,
          status: d.status,
          progresso: d.progresso,
          prazo: d.prazo,
          cliente: cliente?.nome ?? null,
          cliente_id: d.cliente_id,
          responsavel: null,
        },
        ...l,
      ]);

      const r = await criarProjeto(d);
      if (!r.ok) {
        setProjetos(anterior);
        toast.error(r.erro ?? "Não foi possível criar o projeto.");
        return false;
      }
      toast.success(r.demo ? "Projeto criado (não salvo: modo demonstração)." : "Projeto criado.");
      return true;
    },
    [projetos, clientes],
  );

  const editar = useCallback(
    async (id: string, d: DadosProjeto) => {
      const anterior = projetos;
      const cliente = clientes.find((c) => c.id === d.cliente_id) ?? null;

      setProjetos((l) =>
        l.map((p) =>
          p.id === id
            ? {
                ...p,
                nome: d.nome,
                descricao: d.descricao || null,
                status: d.status,
                progresso: d.status === "concluido" ? 100 : d.progresso,
                prazo: d.prazo,
                cliente: cliente?.nome ?? p.cliente,
                cliente_id: d.cliente_id,
              }
            : p,
        ),
      );

      const r = await atualizarProjeto(id, d);
      if (!r.ok) {
        setProjetos(anterior);
        toast.error(r.erro ?? "Não foi possível salvar.");
        return false;
      }
      toast.success(r.demo ? "Alterado (não salvo: modo demonstração)." : "Projeto atualizado.");
      return true;
    },
    [projetos, clientes],
  );

  const ajustar = useCallback(
    (id: string, progresso: number) => {
      const anterior = projetos;
      setProjetos((l) =>
        l.map((p) =>
          p.id === id
            ? { ...p, progresso, status: progresso === 100 ? "concluido" : "ativo" }
            : p,
        ),
      );

      iniciar(async () => {
        const r = await ajustarProgresso(id, progresso);
        if (!r.ok) {
          setProjetos(anterior);
          toast.error(r.erro ?? "Não foi possível atualizar.");
        }
      });
    },
    [projetos],
  );

  const excluir = useCallback(
    (id: string) => {
      const anterior = projetos;
      setProjetos((l) => l.filter((p) => p.id !== id));

      iniciar(async () => {
        const r = await excluirProjeto(id);
        if (!r.ok) {
          setProjetos(anterior);
          toast.error(r.erro ?? "Não foi possível excluir.");
          return;
        }
        toast.success("Projeto excluído.");
      });
    },
    [projetos],
  );

  const valor = useMemo<Contexto>(
    () => ({ projetos, clientes, demo, salvando, criar, editar, ajustar, excluir }),
    [projetos, clientes, demo, salvando, criar, editar, ajustar, excluir],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
