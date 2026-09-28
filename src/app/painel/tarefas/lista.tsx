"use client";

import { useState } from "react";
import { ArrowDownUp, Check, Clock, Repeat } from "lucide-react";
import { Tabela, Cabecalhos, Linha, Celula, CelulaTexto } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Avatar } from "@/components/painel/avatares";
import { PRIORIDADE, STATUS_TAREFA } from "@/lib/rotulos";
import { cn, dataCurta, numero } from "@/lib/utils";
import { atrasada, useTarefas } from "./contexto";
import { DialogoTarefa } from "./dialogo";
import type { Tarefa } from "@/lib/tarefas";

/* Peso da prioridade para ordenar. O enum do banco é texto, e ordenar por ele
   deixaria "alta" antes de "urgente" — ordem alfabética, não de urgência. */
const PESO: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };

type Ordem = "prazo" | "prioridade" | "responsavel" | "cliente";

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "prazo", rotulo: "Prazo" },
  { valor: "prioridade", rotulo: "Prioridade" },
  { valor: "responsavel", rotulo: "Responsável" },
  { valor: "cliente", rotulo: "Cliente" },
];

function ordenar(lista: Tarefa[], por: Ordem): Tarefa[] {
  const copia = [...lista];
  switch (por) {
    case "prioridade":
      return copia.sort((a, b) => (PESO[a.prioridade] ?? 9) - (PESO[b.prioridade] ?? 9));
    case "responsavel":
      return copia.sort((a, b) => (a.responsavel ?? "zzz").localeCompare(b.responsavel ?? "zzz"));
    case "cliente":
      return copia.sort((a, b) => (a.cliente ?? "zzz").localeCompare(b.cliente ?? "zzz"));
    default:
      /* Sem prazo vai para o fim: uma tarefa sem data não é a mais urgente,
         que é o que aconteceria se `null` ordenasse como string vazia. */
      return copia.sort((a, b) => (a.vence_em ?? "9999").localeCompare(b.vence_em ?? "9999"));
  }
}

export function Lista() {
  const { tarefas, concluir } = useTarefas();
  const [por, setPor] = useState<Ordem>("prazo");
  const [editando, setEditando] = useState<Tarefa | null>(null);

  const ordenadas = ordenar(tarefas, por);

  return (
    <>
      <div className="mb-3 flex items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs text-cinza">
          <ArrowDownUp className="size-3.5" />
          Ordenar por
          <select
            value={por}
            onChange={(e) => setPor(e.target.value as Ordem)}
            className="foco-anel cursor-pointer rounded-full border border-borda bg-carta px-3 py-1.5 text-[13px] font-semibold text-tinta"
          >
            {ORDENS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Tabela>
        <Cabecalhos
          colunas={["", "Tarefa", "Responsável", "Cliente", "Prazo", "Prioridade", "Situação"]}
        />
        <tbody>
          {ordenadas.map((t) => {
            const concluida = t.status === "concluida";
            const vencida = atrasada(t);

            return (
              <Linha key={t.id}>
                <Celula className="w-8">
                  <button
                    type="button"
                    onClick={() => concluir(t.id, !concluida)}
                    aria-pressed={concluida}
                    aria-label={concluida ? `Reabrir "${t.titulo}"` : `Concluir "${t.titulo}"`}
                    className={cn(
                      "foco-anel grid size-[18px] place-items-center rounded-full border transition-colors",
                      concluida
                        ? "border-sucesso bg-sucesso text-papel"
                        : "border-borda-forte text-transparent hover:border-sucesso hover:text-sucesso/60",
                    )}
                  >
                    <Check className="size-3" strokeWidth={3.5} />
                  </button>
                </Celula>

                <CelulaTexto largura="20rem" titulo={t.titulo}>
                  <button
                    type="button"
                    onClick={() => setEditando(t)}
                    className={cn(
                      "foco-anel max-w-full truncate text-left font-medium text-tinta hover:text-acento",
                      concluida && "line-through decoration-cinza-claro",
                    )}
                  >
                    {t.titulo}
                  </button>
                  <span className="ml-1.5 inline-flex items-center gap-1.5 align-middle">
                    {t.recorrente && (
                      <Repeat
                        className="size-3 text-cinza-claro"
                        aria-label={`Recorrência ${t.recorrencia ?? ""}`}
                      />
                    )}
                    {!!t.estimativa_horas && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-cinza-claro">
                        <Clock className="size-3" />
                        {numero(t.horas_gastas, 1)}/{numero(t.estimativa_horas, 1)}h
                      </span>
                    )}
                  </span>
                </CelulaTexto>

                <CelulaTexto largura="11rem">
                  {t.responsavel ? (
                    <span className="flex items-center gap-2">
                      <Avatar nome={t.responsavel} medida="sm" />
                      <span className="truncate text-grafite">{t.responsavel}</span>
                    </span>
                  ) : (
                    <span className="text-cinza-claro">Sem responsável</span>
                  )}
                </CelulaTexto>

                <CelulaTexto largura="10rem" className="text-cinza">
                  {t.cliente ?? "Interno"}
                </CelulaTexto>

                <Celula
                  className={cn(
                    "tabular-nums whitespace-nowrap",
                    vencida ? "font-semibold text-perigo" : "text-cinza",
                  )}
                >
                  {t.vence_em ? dataCurta(t.vence_em) : "—"}
                </Celula>

                <Celula>
                  <Etiqueta tom={PRIORIDADE.tom(t.prioridade)}>
                    {PRIORIDADE.rotulo(t.prioridade)}
                  </Etiqueta>
                </Celula>

                <Celula>
                  <Etiqueta tom={vencida ? "perigo" : STATUS_TAREFA.tom(t.status)}>
                    {vencida ? "Atrasada" : STATUS_TAREFA.rotulo(t.status)}
                  </Etiqueta>
                </Celula>
              </Linha>
            );
          })}

          {!ordenadas.length && (
            <Linha>
              <Celula className="py-10 text-center text-cinza">
                Nenhuma tarefa no recorte atual.
              </Celula>
            </Linha>
          )}
        </tbody>
      </Tabela>

      {editando && <DialogoTarefa tarefa={editando} aoFechar={() => setEditando(null)} />}
    </>
  );
}
