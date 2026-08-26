"use client";

import { useRef, useState } from "react";
import { CircleAlert, Plus, Trash2 } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Kpi } from "@/components/painel/kpi";
import { dataCurta, numero } from "@/lib/utils";
import { hoje } from "@/lib/tempo";
import { PRIORIDADE } from "@/lib/rotulos";
import { useTarefas } from "./contexto";
import { DialogoTarefa } from "./dialogo";
import type { Tarefa } from "@/lib/tarefas";

/**
 * Ordem em que as colunas aparecem — é o fluxo da operação, não alfabética.
 *
 * O rótulo da coluna é plural: a etiqueta de um cartão diz "Concluída", mas o
 * topo de uma pilha de cartões diz "Concluídas".
 */
const COLUNAS = [
  { status: "backlog", titulo: "Backlog" },
  { status: "fazendo", titulo: "Em andamento" },
  { status: "revisao", titulo: "Em revisão" },
  { status: "concluida", titulo: "Concluídas" },
];

const atrasada = (t: Tarefa) =>
  !!t.vence_em && t.status !== "concluida" && t.vence_em < hoje();

export function Indicadores() {
  const { tarefas } = useTarefas();

  const abertas = tarefas.filter((t) => t.status !== "concluida");
  const vencidas = abertas.filter(atrasada);
  const paraHoje = abertas.filter((t) => t.vence_em === hoje());
  const urgentes = abertas.filter((t) => t.prioridade === "urgente");

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi rotulo="Em aberto" valor={numero(abertas.length)} detalhe="fora das concluídas" />
      <Kpi
        rotulo="Vencem hoje"
        valor={numero(paraHoje.length)}
        tom="pessego"
        detalhe="prazo é hoje"
      />
      <Kpi
        rotulo="Atrasadas"
        valor={numero(vencidas.length)}
        tom={vencidas.length ? "rosa" : "menta"}
        detalhe={vencidas.length ? "precisam de decisão" : "nenhuma no vermelho"}
      />
      <Kpi rotulo="Urgentes" valor={numero(urgentes.length)} detalhe="prioridade máxima" />
    </section>
  );
}

/** Botão do topo da página. Vive no contexto para a tarefa nova entrar no quadro. */
export function AcaoNovaTarefa() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Botao tamanho="sm" onClick={() => setAberto(true)}>
        <Plus className="size-4" />
        Nova tarefa
      </Botao>
      {aberto && <DialogoTarefa aoFechar={() => setAberto(false)} />}
    </>
  );
}

/**
 * Quadro com arrastar-e-soltar nativo (HTML5), igual ao do CRM.
 * Toda mudança passa pelo contexto: aparece na hora e chama a Server Action.
 */
export function Quadro() {
  const { tarefas, mover, excluir } = useTarefas();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [editando, setEditando] = useState<Tarefa | null>(null);
  const [criandoEm, setCriandoEm] = useState<string | null>(null);

  /* Em alguns navegadores o clique dispara logo depois do arrasto; a marca
     evita que soltar o cartão numa coluna também abra o formulário. */
  const houveArrasto = useRef(false);

  return (
    <>
      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
        <div className="grid min-w-max grid-cols-4 gap-4 lg:min-w-0">
          {COLUNAS.map(({ status, titulo }) => {
            const daColuna = tarefas.filter((t) => t.status === status);
            const vencidas = daColuna.filter(atrasada).length;

            return (
              <section
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSobre(status);
                }}
                onDragLeave={() => setSobre(null)}
                onDrop={() => {
                  if (arrastando) mover(arrastando, status);
                  setArrastando(null);
                  setSobre(null);
                }}
                className={[
                  "flex w-72 shrink-0 flex-col rounded-lg border p-3 transition-colors lg:w-auto",
                  sobre === status ? "border-mrg-500/50 bg-mrg-500/5" : "border-borda bg-nevoa",
                ].join(" ")}
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-tinta">{titulo}</h2>
                    <span className="rounded-full bg-nevoa-2 px-1.5 text-[11px] text-grafite">
                      {daColuna.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCriandoEm(status)}
                    aria-label={`Nova tarefa em ${titulo}`}
                    className="rounded-sm p-1 text-cinza-claro transition-colors hover:bg-carta hover:text-mrg-600 foco-anel"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                {vencidas > 0 && (
                  <p className="mb-3 flex items-center gap-1.5 px-1 text-[11px] text-perigo">
                    <CircleAlert className="size-3.5" />
                    {vencidas} {vencidas === 1 ? "atrasada" : "atrasadas"}
                  </p>
                )}

                <div className="flex-1 space-y-2">
                  {daColuna.map((t) => (
                    <article
                      key={t.id}
                      draggable
                      onDragStart={() => {
                        houveArrasto.current = true;
                        setArrastando(t.id);
                      }}
                      onDragEnd={() => setArrastando(null)}
                      className={[
                        "cartao group rounded-md p-3.5 transition-opacity",
                        arrastando === t.id ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (houveArrasto.current) {
                              houveArrasto.current = false;
                              return;
                            }
                            setEditando(t);
                          }}
                          className="flex-1 cursor-grab text-left text-sm font-medium text-tinta hover:text-mrg-700 foco-anel active:cursor-grabbing"
                        >
                          {t.titulo}
                        </button>
                        <button
                          type="button"
                          onClick={() => excluir(t.id)}
                          aria-label={`Excluir "${t.titulo}"`}
                          className="rounded-sm p-1 text-cinza-claro opacity-0 transition-opacity group-hover:opacity-100 hover:text-perigo focus-visible:opacity-100 foco-anel"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <p className="mt-1 truncate text-xs text-cinza">
                        {t.cliente ?? "Interno da agência"}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Etiqueta tom={PRIORIDADE.tom(t.prioridade)}>
                          {PRIORIDADE.rotulo(t.prioridade)}
                        </Etiqueta>
                        {t.vence_em && (
                          <span
                            className={[
                              "text-[11px] tabular-nums",
                              atrasada(t) ? "font-semibold text-perigo" : "text-cinza-claro",
                            ].join(" ")}
                          >
                            {dataCurta(t.vence_em)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}

                  {!daColuna.length && (
                    <button
                      type="button"
                      onClick={() => setCriandoEm(status)}
                      className="w-full rounded-md border border-dashed border-borda p-4 text-center text-xs text-cinza-claro transition-colors hover:border-mrg-500/40 hover:text-mrg-600 foco-anel"
                    >
                      Arraste uma tarefa até aqui, ou clique para criar
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {editando && <DialogoTarefa tarefa={editando} aoFechar={() => setEditando(null)} />}
      {criandoEm && (
        <DialogoTarefa statusPadrao={criandoEm} aoFechar={() => setCriandoEm(null)} />
      )}
    </>
  );
}
