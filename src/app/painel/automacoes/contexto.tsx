"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  alternarAtiva,
  atualizarAutomacao,
  criarAutomacao,
  excluirAutomacao,
  type DadosAutomacao,
} from "./acoes";
import { Construtor } from "./construtor";
import type { Automacao } from "@/lib/automacoes-dados";

type Estado = {
  automacoes: Automacao[];
  etapas: { id: string; nome: string }[];
  demo: boolean;
  salvando: boolean;
  abrirNova: () => void;
  abrirEdicao: (a: Automacao) => void;
  alternar: (a: Automacao) => void;
  excluir: (a: Automacao) => void;
};

const Contexto = createContext<Estado | null>(null);

export function useAutomacoes() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAutomacoes precisa estar dentro de <AutomacoesProvider>.");
  return ctx;
}

/** Id só para o cartão novo aparecer antes de o servidor responder. */
let sequencia = 0;
const idLocal = () => `local-${++sequencia}`;

export function AutomacoesProvider({
  automacoesIniciais,
  etapas,
  demo,
  children,
}: {
  automacoesIniciais: Automacao[];
  etapas: { id: string; nome: string }[];
  demo: boolean;
  children: React.ReactNode;
}) {
  const [automacoes, setAutomacoes] = useState(automacoesIniciais);
  const [doServidor, setDoServidor] = useState(automacoesIniciais);
  const [construindo, setConstruindo] = useState(false);
  const [editando, setEditando] = useState<Automacao | null>(null);
  const [salvando, iniciar] = useTransition();

  /* `revalidatePath` reexecuta o componente de servidor e manda uma lista
     nova; sem isto o cartão otimista ficaria com o id local e a próxima
     edição dele bateria num id que o banco não conhece. */
  if (automacoesIniciais !== doServidor) {
    setDoServidor(automacoesIniciais);
    setAutomacoes(automacoesIniciais);
  }

  const criar = useCallback(
    async (d: DadosAutomacao) => {
      const anterior = automacoes;
      setAutomacoes((l) => [
        {
          id: idLocal(),
          nome: d.nome.trim(),
          gatilho: d.gatilho as Automacao["gatilho"],
          ativa: true,
          acoes: d.acoes,
          execucoes: 0,
          ultimaExecucao: null,
        },
        ...l,
      ]);

      const r = await criarAutomacao(d);
      if (!r.ok) {
        setAutomacoes(anterior);
        toast.error(r.erro ?? "Não foi possível criar a automação.");
        return false;
      }
      toast.success(r.demo ? "Automação criada (não salva: modo demonstração)." : "Automação criada e ativa.");
      return true;
    },
    [automacoes],
  );

  const editar = useCallback(
    async (id: string, d: DadosAutomacao) => {
      const anterior = automacoes;
      setAutomacoes((l) =>
        l.map((a) =>
          a.id === id
            ? { ...a, nome: d.nome.trim(), gatilho: d.gatilho as Automacao["gatilho"], acoes: d.acoes }
            : a,
        ),
      );

      const r = await atualizarAutomacao(id, d);
      if (!r.ok) {
        setAutomacoes(anterior);
        toast.error(r.erro ?? "Não foi possível salvar.");
        return false;
      }
      toast.success(r.demo ? "Alterado (não salvo: modo demonstração)." : "Automação atualizada.");
      return true;
    },
    [automacoes],
  );

  const alternar = useCallback(
    (a: Automacao) => {
      const anterior = automacoes;
      const ativa = !a.ativa;
      setAutomacoes((l) => l.map((x) => (x.id === a.id ? { ...x, ativa } : x)));

      iniciar(async () => {
        const r = await alternarAtiva(a.id, ativa);
        if (!r.ok) {
          setAutomacoes(anterior);
          toast.error(r.erro ?? "Não foi possível mudar o estado da automação.");
          return;
        }
        toast.success(ativa ? `"${a.nome}" está ativa.` : `"${a.nome}" foi pausada.`);
      });
    },
    [automacoes],
  );

  const excluir = useCallback(
    (a: Automacao) => {
      if (!confirm(`Excluir "${a.nome}"? O histórico de execuções vai junto.`)) return;

      const anterior = automacoes;
      setAutomacoes((l) => l.filter((x) => x.id !== a.id));

      iniciar(async () => {
        const r = await excluirAutomacao(a.id);
        if (!r.ok) {
          setAutomacoes(anterior);
          toast.error(r.erro ?? "Não foi possível excluir.");
          return;
        }
        toast.success("Automação excluída.");
      });
    },
    [automacoes],
  );

  const valor = useMemo<Estado>(
    () => ({
      automacoes,
      etapas,
      demo,
      salvando,
      abrirNova: () => setConstruindo(true),
      abrirEdicao: (a) => setEditando(a),
      alternar,
      excluir,
    }),
    [automacoes, etapas, demo, salvando, alternar, excluir],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      {construindo && (
        <Construtor
          etapas={etapas}
          aoCriar={criar}
          aoEditar={editar}
          aoFechar={() => setConstruindo(false)}
        />
      )}
      {editando && (
        <Construtor
          automacao={editando}
          etapas={etapas}
          aoCriar={criar}
          aoEditar={editar}
          aoFechar={() => setEditando(null)}
        />
      )}
    </Contexto.Provider>
  );
}
