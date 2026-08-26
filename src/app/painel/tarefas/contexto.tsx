"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { atualizarTarefa, criarTarefa, excluirTarefa, moverTarefa, type DadosTarefa } from "./acoes";
import type { Tarefa } from "@/lib/tarefas";

export type OpcaoCliente = { id: string; nome: string };

type Contexto = {
  tarefas: Tarefa[];
  clientes: OpcaoCliente[];
  demo: boolean;
  salvando: boolean;
  criar: (d: DadosTarefa) => Promise<boolean>;
  editar: (id: string, d: DadosTarefa) => Promise<boolean>;
  mover: (id: string, status: string) => void;
  excluir: (id: string) => void;
};

const Ctx = createContext<Contexto | null>(null);

export function useTarefas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTarefas precisa estar dentro de <TarefasProvider>.");
  return ctx;
}

let sequencia = 0;

export function TarefasProvider({
  tarefasIniciais,
  clientes,
  demo,
  children,
}: {
  tarefasIniciais: Tarefa[];
  clientes: OpcaoCliente[];
  demo: boolean;
  children: React.ReactNode;
}) {
  const [tarefas, setTarefas] = useState(tarefasIniciais);
  const [ultimoDoServidor, setUltimo] = useState(tarefasIniciais);
  const [salvando, iniciar] = useTransition();

  /* Depois de gravar, `revalidatePath` reexecuta o componente de servidor e
     manda uma lista nova. Sem sincronizar aqui, o estado local continuaria
     com o cartão otimista de id falso e a próxima edição dele falharia. */
  if (tarefasIniciais !== ultimoDoServidor) {
    setUltimo(tarefasIniciais);
    setTarefas(tarefasIniciais);
  }

  const criar = useCallback(
    async (d: DadosTarefa) => {
      const anterior = tarefas;
      const cliente = clientes.find((c) => c.id === d.cliente_id) ?? null;

      setTarefas((l) => [
        ...l,
        {
          id: `local-${++sequencia}`,
          titulo: d.titulo,
          descricao: d.descricao || null,
          status: d.status,
          prioridade: d.prioridade,
          cliente: cliente?.nome ?? null,
          cliente_id: d.cliente_id,
          responsavel: null,
          vence_em: d.vence_em,
          ordem: l.length,
        },
      ]);

      const r = await criarTarefa(d);
      if (!r.ok) {
        setTarefas(anterior);
        toast.error(r.erro ?? "Não foi possível criar a tarefa.");
        return false;
      }
      toast.success(r.demo ? "Tarefa criada (não salva: modo demonstração)." : "Tarefa criada.");
      return true;
    },
    [tarefas, clientes],
  );

  const editar = useCallback(
    async (id: string, d: DadosTarefa) => {
      const anterior = tarefas;
      const cliente = clientes.find((c) => c.id === d.cliente_id) ?? null;

      setTarefas((l) =>
        l.map((t) =>
          t.id === id
            ? {
                ...t,
                titulo: d.titulo,
                descricao: d.descricao || null,
                status: d.status,
                prioridade: d.prioridade,
                cliente: cliente?.nome ?? t.cliente,
                cliente_id: d.cliente_id,
                vence_em: d.vence_em,
              }
            : t,
        ),
      );

      const r = await atualizarTarefa(id, d);
      if (!r.ok) {
        setTarefas(anterior);
        toast.error(r.erro ?? "Não foi possível salvar.");
        return false;
      }
      toast.success(r.demo ? "Alterada (não salva: modo demonstração)." : "Tarefa atualizada.");
      return true;
    },
    [tarefas, clientes],
  );

  const mover = useCallback(
    (id: string, status: string) => {
      const atual = tarefas.find((t) => t.id === id);
      if (!atual || atual.status === status) return;

      const anterior = tarefas;
      const ordem = tarefas.filter((t) => t.status === status).length;
      setTarefas((l) => l.map((t) => (t.id === id ? { ...t, status, ordem } : t)));

      iniciar(async () => {
        const r = await moverTarefa(id, status, ordem);
        if (!r.ok) {
          setTarefas(anterior);
          toast.error(r.erro ?? "Não foi possível mover a tarefa.");
        }
      });
    },
    [tarefas],
  );

  const excluir = useCallback(
    (id: string) => {
      const anterior = tarefas;
      setTarefas((l) => l.filter((t) => t.id !== id));

      iniciar(async () => {
        const r = await excluirTarefa(id);
        if (!r.ok) {
          setTarefas(anterior);
          toast.error(r.erro ?? "Não foi possível excluir.");
          return;
        }
        toast.success("Tarefa excluída.");
      });
    },
    [tarefas],
  );

  const valor = useMemo<Contexto>(
    () => ({ tarefas, clientes, demo, salvando, criar, editar, mover, excluir }),
    [tarefas, clientes, demo, salvando, criar, editar, mover, excluir],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
