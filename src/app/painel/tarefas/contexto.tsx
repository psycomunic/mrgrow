"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  alternarConclusao,
  atribuirTarefa,
  atualizarTarefa,
  criarTarefa,
  duplicarTarefa,
  excluirTarefa,
  moverTarefa,
  type DadosTarefa,
} from "./acoes";
import { hoje } from "@/lib/tempo";
import type { Tarefa } from "@/lib/tarefas";

export type OpcaoCliente = { id: string; nome: string };
export type OpcaoProjeto = { id: string; nome: string };
export type OpcaoPessoa = { id: string; nome: string; papel: string };

/**
 * Estado dos filtros.
 *
 * `responsavel` aceita a sentinela `"sem"` além de um id: "sem responsável" é
 * uma pergunta que a equipe faz toda semana, e sem ela só dava para listar
 * quem tem dono. O mesmo vale para `cliente`, com `"interno"`.
 */
export type Filtros = {
  busca: string;
  responsavel: string | null;
  cliente: string | null;
  prioridade: string | null;
  etiqueta: string | null;
  soAtrasadas: boolean;
  ocultarConcluidas: boolean;
};

export const FILTROS_VAZIOS: Filtros = {
  busca: "",
  responsavel: null,
  cliente: null,
  prioridade: null,
  etiqueta: null,
  soAtrasadas: false,
  ocultarConcluidas: false,
};

export const atrasada = (t: Tarefa) =>
  !!t.vence_em && t.status !== "concluida" && t.vence_em < hoje();

type Contexto = {
  /** Lista completa — para contagens que não devem seguir o filtro. */
  todas: Tarefa[];
  /** Lista já filtrada — é o que o quadro e a lista desenham. */
  tarefas: Tarefa[];
  clientes: OpcaoCliente[];
  projetos: OpcaoProjeto[];
  equipe: OpcaoPessoa[];
  etiquetas: string[];
  filtros: Filtros;
  filtrando: boolean;
  demo: boolean;
  salvando: boolean;
  definirFiltros: (f: Partial<Filtros>) => void;
  limparFiltros: () => void;
  criar: (d: DadosTarefa) => Promise<boolean>;
  editar: (id: string, d: DadosTarefa) => Promise<boolean>;
  mover: (id: string, status: string) => void;
  atribuir: (id: string, responsavelId: string | null) => void;
  concluir: (id: string, concluida: boolean) => void;
  duplicar: (id: string) => void;
  excluir: (id: string) => void;
};

const Ctx = createContext<Contexto | null>(null);

export function useTarefas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTarefas precisa estar dentro de <TarefasProvider>.");
  return ctx;
}

let sequencia = 0;

/** Acentos fora, minúscula: buscar "video" acha "Vídeo". */
function dobrar(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function TarefasProvider({
  tarefasIniciais,
  clientes,
  projetos,
  equipe,
  demo,
  children,
}: {
  tarefasIniciais: Tarefa[];
  clientes: OpcaoCliente[];
  projetos: OpcaoProjeto[];
  equipe: OpcaoPessoa[];
  demo: boolean;
  children: React.ReactNode;
}) {
  const [tarefas, setTarefas] = useState(tarefasIniciais);
  const [ultimoDoServidor, setUltimo] = useState(tarefasIniciais);
  const [filtros, setFiltrosBrutos] = useState<Filtros>(FILTROS_VAZIOS);
  const [salvando, iniciar] = useTransition();

  /* Depois de gravar, `revalidatePath` reexecuta o componente de servidor e
     manda uma lista nova. Sem sincronizar aqui, o estado local continuaria
     com o cartão otimista de id falso e a próxima edição dele falharia. */
  if (tarefasIniciais !== ultimoDoServidor) {
    setUltimo(tarefasIniciais);
    setTarefas(tarefasIniciais);
  }

  const nomeDe = useCallback(
    (id: string | null) => (id ? (equipe.find((p) => p.id === id)?.nome ?? null) : null),
    [equipe],
  );

  const definirFiltros = useCallback(
    (f: Partial<Filtros>) => setFiltrosBrutos((atual) => ({ ...atual, ...f })),
    [],
  );
  const limparFiltros = useCallback(() => setFiltrosBrutos(FILTROS_VAZIOS), []);

  /* Toda etiqueta em uso, para o menu de filtro. Sai das tarefas, e não de uma
     lista fixa: etiqueta aqui é texto livre da equipe. */
  const etiquetas = useMemo(
    () => [...new Set(tarefas.flatMap((t) => t.etiquetas))].sort((a, b) => a.localeCompare(b)),
    [tarefas],
  );

  const filtradas = useMemo(() => {
    const busca = dobrar(filtros.busca.trim());

    return tarefas.filter((t) => {
      if (filtros.ocultarConcluidas && t.status === "concluida") return false;
      if (filtros.soAtrasadas && !atrasada(t)) return false;
      if (filtros.prioridade && t.prioridade !== filtros.prioridade) return false;
      if (filtros.etiqueta && !t.etiquetas.includes(filtros.etiqueta)) return false;

      if (filtros.responsavel === "sem") {
        if (t.responsavel_id) return false;
      } else if (filtros.responsavel && t.responsavel_id !== filtros.responsavel) {
        return false;
      }

      if (filtros.cliente === "interno") {
        if (t.cliente_id) return false;
      } else if (filtros.cliente && t.cliente_id !== filtros.cliente) {
        return false;
      }

      if (busca) {
        const alvo = dobrar(
          [t.titulo, t.descricao, t.cliente, t.responsavel, t.projeto, ...t.etiquetas]
            .filter(Boolean)
            .join(" "),
        );
        if (!alvo.includes(busca)) return false;
      }
      return true;
    });
  }, [tarefas, filtros]);

  const filtrando = useMemo(
    () => JSON.stringify(filtros) !== JSON.stringify(FILTROS_VAZIOS),
    [filtros],
  );

  const criar = useCallback(
    async (d: DadosTarefa) => {
      const anterior = tarefas;
      const cliente = clientes.find((c) => c.id === d.cliente_id) ?? null;
      const projeto = projetos.find((p) => p.id === d.projeto_id) ?? null;

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
          projeto: projeto?.nome ?? null,
          projeto_id: d.projeto_id,
          responsavel: nomeDe(d.responsavel_id),
          responsavel_id: d.responsavel_id,
          vence_em: d.vence_em,
          etiquetas: d.etiquetas,
          estimativa_horas: d.estimativa_horas,
          horas_gastas: d.horas_gastas,
          recorrente: d.recorrente,
          recorrencia: d.recorrencia,
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
    [tarefas, clientes, projetos, nomeDe],
  );

  const editar = useCallback(
    async (id: string, d: DadosTarefa) => {
      const anterior = tarefas;
      const cliente = clientes.find((c) => c.id === d.cliente_id) ?? null;
      const projeto = projetos.find((p) => p.id === d.projeto_id) ?? null;

      setTarefas((l) =>
        l.map((t) =>
          t.id === id
            ? {
                ...t,
                titulo: d.titulo,
                descricao: d.descricao || null,
                status: d.status,
                prioridade: d.prioridade,
                cliente: cliente?.nome ?? null,
                cliente_id: d.cliente_id,
                projeto: projeto?.nome ?? null,
                projeto_id: d.projeto_id,
                responsavel: nomeDe(d.responsavel_id),
                responsavel_id: d.responsavel_id,
                vence_em: d.vence_em,
                etiquetas: d.etiquetas,
                estimativa_horas: d.estimativa_horas,
                horas_gastas: d.horas_gastas,
                recorrente: d.recorrente,
                recorrencia: d.recorrencia,
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
    [tarefas, clientes, projetos, nomeDe],
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

  const atribuir = useCallback(
    (id: string, responsavelId: string | null) => {
      const anterior = tarefas;
      setTarefas((l) =>
        l.map((t) =>
          t.id === id
            ? { ...t, responsavel_id: responsavelId, responsavel: nomeDe(responsavelId) }
            : t,
        ),
      );

      iniciar(async () => {
        const r = await atribuirTarefa(id, responsavelId);
        if (!r.ok) {
          setTarefas(anterior);
          toast.error(r.erro ?? "Não foi possível atribuir.");
          return;
        }
        toast.success(
          responsavelId ? `Agora é com ${nomeDe(responsavelId)}.` : "Responsável removido.",
        );
      });
    },
    [tarefas, nomeDe],
  );

  const concluir = useCallback(
    (id: string, concluida: boolean) => {
      const anterior = tarefas;
      setTarefas((l) =>
        l.map((t) => (t.id === id ? { ...t, status: concluida ? "concluida" : "fazendo" } : t)),
      );

      iniciar(async () => {
        const r = await alternarConclusao(id, concluida);
        if (!r.ok) {
          setTarefas(anterior);
          toast.error(r.erro ?? "Não foi possível mudar a tarefa.");
          return;
        }
        if (concluida) toast.success("Tarefa concluída.");
      });
    },
    [tarefas],
  );

  const duplicar = useCallback((id: string) => {
    iniciar(async () => {
      const r = await duplicarTarefa(id);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível duplicar.");
        return;
      }
      toast.success(
        r.demo ? "Duplicada (não salva: modo demonstração)." : "Cópia criada no backlog.",
      );
    });
  }, []);

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
    () => ({
      todas: tarefas,
      tarefas: filtradas,
      clientes,
      projetos,
      equipe,
      etiquetas,
      filtros,
      filtrando,
      demo,
      salvando,
      definirFiltros,
      limparFiltros,
      criar,
      editar,
      mover,
      atribuir,
      concluir,
      duplicar,
      excluir,
    }),
    [
      tarefas,
      filtradas,
      clientes,
      projetos,
      equipe,
      etiquetas,
      filtros,
      filtrando,
      demo,
      salvando,
      definirFiltros,
      limparFiltros,
      criar,
      editar,
      mover,
      atribuir,
      concluir,
      duplicar,
      excluir,
    ],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
