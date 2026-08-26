"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  atualizarNegocio,
  criarNegocio,
  excluirNegocio,
  fecharNegocio,
  moverNegocio,
  type DadosNegocio,
} from "./acoes";
import type { NegocioQuadro } from "@/lib/crm";
import type { EtapaFunil } from "@/types/dominio";

type Crm = {
  etapas: EtapaFunil[];
  negocios: NegocioQuadro[];
  demo: boolean;
  salvando: boolean;
  criar: (d: DadosNegocio) => Promise<boolean>;
  editar: (id: string, d: DadosNegocio) => Promise<boolean>;
  mover: (id: string, etapaId: string) => void;
  fechar: (id: string, status: "ganho" | "perdido") => void;
  excluir: (id: string) => void;
};

const Contexto = createContext<Crm | null>(null);

export function useCrm() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useCrm precisa estar dentro de <CrmProvider>.");
  return ctx;
}

/** Id local para o cartão aparecer na hora em modo demonstração. */
let sequencia = 0;
const idLocal = () => `local-${++sequencia}`;

export function CrmProvider({
  etapas,
  negociosIniciais,
  funilId,
  demo,
  children,
}: {
  etapas: EtapaFunil[];
  negociosIniciais: NegocioQuadro[];
  funilId: string | null;
  demo: boolean;
  children: React.ReactNode;
}) {
  const [negocios, setNegocios] = useState(negociosIniciais);
  const [ultimoDoServidor, setUltimoDoServidor] = useState(negociosIniciais);
  const [salvando, iniciar] = useTransition();

  /* Depois de gravar, `revalidatePath` reexecuta o componente de servidor e
     manda uma lista nova. Sem isto o estado local continuaria com o cartão
     otimista de id falso, e a próxima edição dele falharia no servidor.
     Ajustar estado durante o render é o padrão do React para sincronizar
     com props que mudam — não é efeito, então nada pisca. */
  if (negociosIniciais !== ultimoDoServidor) {
    setUltimoDoServidor(negociosIniciais);
    setNegocios(negociosIniciais);
  }

  /* Todas as mutações aplicam na tela primeiro e chamam o servidor depois.
     Se o servidor recusar, o estado anterior volta e o erro aparece. */

  const criar = useCallback(
    async (d: DadosNegocio) => {
      const anterior = negocios;
      const otimista: NegocioQuadro = {
        id: idLocal(),
        titulo: d.titulo,
        etapa_id: d.etapa_id,
        valor_mensal: d.valor_mensal,
        valor_unico: d.valor_unico,
        temperatura: d.temperatura,
        origem: d.origem || null,
        contato: d.contato || null,
        previsao: d.previsao,
        ordem_kanban: negocios.length,
      };
      setNegocios((l) => [...l, otimista]);

      const r = await criarNegocio(funilId, d);
      if (!r.ok) {
        setNegocios(anterior);
        toast.error(r.erro ?? "Não foi possível criar o negócio.");
        return false;
      }
      toast.success(r.demo ? "Negócio criado (não salvo: modo demonstração)." : "Negócio criado.");
      return true;
    },
    [funilId, negocios],
  );

  const editar = useCallback(
    async (id: string, d: DadosNegocio) => {
      const anterior = negocios;
      setNegocios((l) =>
        l.map((n) =>
          n.id === id
            ? {
                ...n,
                titulo: d.titulo,
                etapa_id: d.etapa_id,
                valor_mensal: d.valor_mensal,
                valor_unico: d.valor_unico,
                temperatura: d.temperatura,
                origem: d.origem || null,
                contato: d.contato || n.contato,
                previsao: d.previsao,
              }
            : n,
        ),
      );

      const r = await atualizarNegocio(id, d);
      if (!r.ok) {
        setNegocios(anterior);
        toast.error(r.erro ?? "Não foi possível salvar.");
        return false;
      }
      toast.success(r.demo ? "Alterado (não salvo: modo demonstração)." : "Negócio atualizado.");
      return true;
    },
    [negocios],
  );

  const mover = useCallback(
    (id: string, etapaId: string) => {
      const atual = negocios.find((n) => n.id === id);
      if (!atual || atual.etapa_id === etapaId) return;

      const anterior = negocios;
      const ordem = negocios.filter((n) => n.etapa_id === etapaId).length;
      setNegocios((l) =>
        l.map((n) => (n.id === id ? { ...n, etapa_id: etapaId, ordem_kanban: ordem } : n)),
      );

      iniciar(async () => {
        const r = await moverNegocio(id, etapaId, ordem);
        if (!r.ok) {
          setNegocios(anterior);
          toast.error(r.erro ?? "Não foi possível mover.");
        }
      });
    },
    [negocios],
  );

  const fechar = useCallback(
    (id: string, status: "ganho" | "perdido") => {
      const anterior = negocios;
      setNegocios((l) => l.filter((n) => n.id !== id));

      iniciar(async () => {
        const r = await fecharNegocio(id, status);
        if (!r.ok) {
          setNegocios(anterior);
          toast.error(r.erro ?? "Não foi possível fechar.");
          return;
        }
        toast.success(status === "ganho" ? "Negócio marcado como ganho." : "Negócio marcado como perdido.");
      });
    },
    [negocios],
  );

  const excluir = useCallback(
    (id: string) => {
      const anterior = negocios;
      setNegocios((l) => l.filter((n) => n.id !== id));

      iniciar(async () => {
        const r = await excluirNegocio(id);
        if (!r.ok) {
          setNegocios(anterior);
          toast.error(r.erro ?? "Não foi possível excluir.");
          return;
        }
        toast.success("Negócio excluído.");
      });
    },
    [negocios],
  );

  const valor = useMemo<Crm>(
    () => ({ etapas, negocios, demo, salvando, criar, editar, mover, fechar, excluir }),
    [etapas, negocios, demo, salvando, criar, editar, mover, fechar, excluir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
