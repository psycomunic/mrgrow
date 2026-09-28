"use client";

import { useRef, useState } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Kpi } from "@/components/painel/kpi";
import { Anel } from "@/components/painel/rosca";
import { Avatar } from "@/components/painel/avatares";
import { cn, divisao, numero, percentual } from "@/lib/utils";
import { hoje } from "@/lib/tempo";
import { atrasada, useTarefas } from "./contexto";
import { CartaoTarefa } from "./cartao-tarefa";
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

export function Indicadores() {
  const { todas } = useTarefas();

  const abertas = todas.filter((t) => t.status !== "concluida");
  const concluidas = todas.filter((t) => t.status === "concluida");
  const vencidas = abertas.filter(atrasada);
  const paraHoje = abertas.filter((t) => t.vence_em === hoje());
  const urgentes = abertas.filter((t) => t.prioridade === "urgente");
  const semDono = abertas.filter((t) => !t.responsavel_id);

  const feito = divisao(concluidas.length, todas.length) * 100;
  const horasPrevistas = abertas.reduce((s, t) => s + (t.estimativa_horas ?? 0), 0);

  return (
    <section className="grid gap-4 xl:grid-cols-12">
      {/* O anel de progresso da operação inteira, no lugar de mais um número
          solto: é a leitura que a pessoa faz primeiro ao abrir a tela. */}
      <div className="cartao flex items-center gap-5 rounded-lg p-5 xl:col-span-4">
        <Anel
          percentual={feito}
          centro={percentual(feito, 0)}
          rotuloCentro="concluído"
          tamanho={116}
          espessura={12}
          trilha="var(--color-nevoa-2)"
        />
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-bold text-tinta">Semana da operação</h2>
          <p className="mt-1 text-[13px] leading-snug text-cinza">
            {numero(concluidas.length)} de {numero(todas.length)} tarefas concluídas.
          </p>
          {horasPrevistas > 0 && (
            <p className="mt-2 text-[11px] text-cinza-claro">
              {numero(horasPrevistas, 1)}h estimadas ainda em aberto.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:col-span-8 xl:grid-cols-4">
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
        <Kpi
          rotulo="Sem responsável"
          valor={numero(semDono.length)}
          tom={semDono.length ? "pessego" : "menta"}
          detalhe={semDono.length ? "ninguém responde por elas" : `${numero(urgentes.length)} urgentes`}
          dica="Tarefa sem dono some do radar de todo mundo."
        />
      </div>
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
  const { tarefas, filtros, mover } = useTarefas();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [editando, setEditando] = useState<Tarefa | null>(null);
  const [criandoEm, setCriandoEm] = useState<string | null>(null);

  /* Em alguns navegadores o clique dispara logo depois do arrasto; a marca
     evita que soltar o cartão numa coluna também abra o formulário. */
  const houveArrasto = useRef(false);

  const colunas = filtros.ocultarConcluidas
    ? COLUNAS.filter((c) => c.status !== "concluida")
    : COLUNAS;

  return (
    <>
      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
        <div
          className="grid min-w-max gap-4 lg:min-w-0"
          style={{ gridTemplateColumns: `repeat(${colunas.length}, minmax(0, 1fr))` }}
        >
          {colunas.map(({ status, titulo }) => {
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
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-lg border p-3 transition-colors lg:w-auto",
                  sobre === status ? "border-mrg-500/50 bg-mrg-500/5" : "border-borda bg-nevoa",
                )}
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
                    className="foco-anel rounded-sm p-1 text-cinza-claro transition-colors hover:bg-carta hover:text-acento"
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
                    <CartaoTarefa
                      key={t.id}
                      t={t}
                      arrastavel
                      arrastando={arrastando === t.id}
                      aoArrastar={() => {
                        houveArrasto.current = true;
                        setArrastando(t.id);
                      }}
                      aoEditar={() => {
                        if (houveArrasto.current) {
                          houveArrasto.current = false;
                          return;
                        }
                        setEditando(t);
                      }}
                    />
                  ))}

                  {!daColuna.length && (
                    <button
                      type="button"
                      onClick={() => setCriandoEm(status)}
                      className="foco-anel w-full rounded-md border border-dashed border-borda p-4 text-center text-xs text-cinza-claro transition-colors hover:border-mrg-500/40 hover:text-acento"
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
      {criandoEm && <DialogoTarefa statusPadrao={criandoEm} aoFechar={() => setCriandoEm(null)} />}
    </>
  );
}

/**
 * A mesma operação, agrupada por quem responde por ela.
 *
 * É a visão que responde "quem está sobrecarregado?" — a única pergunta que o
 * quadro por status não consegue responder, porque lá o trabalho de uma pessoa
 * fica espalhado por quatro colunas.
 */
export function PorPessoa() {
  const { tarefas, equipe } = useTarefas();
  const [editando, setEditando] = useState<Tarefa | null>(null);
  const [criandoPara, setCriandoPara] = useState<string | null>(null);

  /* Quem tem tarefa aqui, mais o balde de quem não tem dono. Pessoas da
     equipe sem nada nesta filtragem não viram raia vazia: seriam só ruído. */
  const raias = [
    ...equipe
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        itens: tarefas.filter((t) => t.responsavel_id === p.id),
      }))
      .filter((r) => r.itens.length),
    ...(tarefas.some((t) => !t.responsavel_id)
      ? [{ id: "sem", nome: "Sem responsável", itens: tarefas.filter((t) => !t.responsavel_id) }]
      : []),
  ];

  if (!raias.length) {
    return (
      <p className="cartao rounded-lg p-8 text-center text-sm text-cinza">
        Nenhuma tarefa no recorte atual.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {raias.map((r) => {
          const abertas = r.itens.filter((t) => t.status !== "concluida");
          const vencidas = abertas.filter(atrasada).length;
          const horas = abertas.reduce((s, t) => s + (t.estimativa_horas ?? 0), 0);

          return (
            <section key={r.id} className="cartao rounded-lg p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {r.id === "sem" ? (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-borda-forte text-sm text-cinza-claro">
                    ?
                  </span>
                ) : (
                  <Avatar nome={r.nome} medida="lg" />
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-sm font-bold text-tinta">{r.nome}</h2>
                  <p className="mt-0.5 text-[11px] text-cinza">
                    {numero(abertas.length)} em aberto
                    {horas > 0 && ` · ${numero(horas, 1)}h estimadas`}
                    {vencidas > 0 && (
                      <span className="font-semibold text-perigo">
                        {" · "}
                        {vencidas} atrasada{vencidas > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>

                {r.id !== "sem" && (
                  <button
                    type="button"
                    onClick={() => setCriandoPara(r.id)}
                    className="foco-anel inline-flex shrink-0 items-center gap-1 rounded-full border border-borda px-3 py-1.5 text-[11px] font-semibold text-cinza hover:border-borda-forte hover:text-tinta"
                  >
                    <Plus className="size-3.5" />
                    Atribuir tarefa
                  </button>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {r.itens.map((t) => (
                  <CartaoTarefa key={t.id} t={t} aoEditar={() => setEditando(t)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {editando && <DialogoTarefa tarefa={editando} aoFechar={() => setEditando(null)} />}
      {criandoPara && (
        <DialogoTarefa responsavelPadrao={criandoPara} aoFechar={() => setCriandoPara(null)} />
      )}
    </>
  );
}
