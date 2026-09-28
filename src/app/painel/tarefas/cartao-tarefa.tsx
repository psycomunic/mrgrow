"use client";

import { Briefcase, Check, Clock, Copy, Repeat, Trash2 } from "lucide-react";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Avatar } from "@/components/painel/avatares";
import { PRIORIDADE } from "@/lib/rotulos";
import { cn, dataCurta, numero } from "@/lib/utils";
import { atrasada, useTarefas } from "./contexto";
import type { Tarefa } from "@/lib/tarefas";

/* A faixa de cor na lateral esquerda do cartão. É o que deixa a prioridade
   legível de longe, sem depender de ler a etiqueta. */
const FAIXA: Record<string, string> = {
  urgente: "bg-perigo",
  alta: "bg-alerta",
  media: "bg-acento",
  baixa: "bg-borda-forte",
};

export function CartaoTarefa({
  t,
  aoEditar,
  arrastavel = false,
  aoArrastar,
  arrastando = false,
}: {
  t: Tarefa;
  aoEditar: () => void;
  arrastavel?: boolean;
  aoArrastar?: () => void;
  arrastando?: boolean;
}) {
  const { concluir, duplicar, excluir, equipe, atribuir } = useTarefas();

  const concluida = t.status === "concluida";
  const vencida = atrasada(t);
  const estourou = !!t.estimativa_horas && t.horas_gastas > t.estimativa_horas;

  return (
    <article
      draggable={arrastavel}
      onDragStart={aoArrastar}
      className={cn(
        "cartao group relative overflow-hidden rounded-md p-3.5 pl-4 transition-opacity",
        arrastando && "opacity-40",
        concluida && "opacity-70",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", FAIXA[t.prioridade] ?? FAIXA.baixa)}
        aria-hidden
      />

      <div className="flex items-start gap-2.5">
        {/* Concluir sem abrir o formulário: é a ação mais repetida do quadro. */}
        <button
          type="button"
          onClick={() => concluir(t.id, !concluida)}
          aria-pressed={concluida}
          aria-label={concluida ? `Reabrir "${t.titulo}"` : `Concluir "${t.titulo}"`}
          className={cn(
            "foco-anel mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border transition-colors",
            concluida
              ? "border-sucesso bg-sucesso text-papel"
              : "border-borda-forte text-transparent hover:border-sucesso hover:text-sucesso/60",
          )}
        >
          <Check className="size-3" strokeWidth={3.5} />
        </button>

        <button
          type="button"
          onClick={aoEditar}
          className={cn(
            "foco-anel flex-1 text-left text-sm font-medium text-tinta hover:text-acento-forte",
            arrastavel && "cursor-grab active:cursor-grabbing",
            concluida && "line-through decoration-cinza-claro",
          )}
        >
          {t.titulo}
        </button>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => duplicar(t.id)}
            aria-label={`Duplicar "${t.titulo}"`}
            title="Duplicar"
            className="foco-anel rounded-sm p-1 text-cinza-claro hover:text-acento"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => excluir(t.id)}
            aria-label={`Excluir "${t.titulo}"`}
            title="Excluir"
            className="foco-anel rounded-sm p-1 text-cinza-claro hover:text-perigo"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <p className="mt-1 truncate pl-7 text-xs text-cinza">
        {t.cliente ?? "Interno da agência"}
        {t.projeto && (
          <span className="text-cinza-claro">
            {" · "}
            <Briefcase className="inline size-3 -translate-y-px" /> {t.projeto}
          </span>
        )}
      </p>

      {!!t.etiquetas.length && (
        <ul className="mt-2.5 flex flex-wrap gap-1 pl-7">
          {t.etiquetas.slice(0, 3).map((e) => (
            <li
              key={e}
              className="rounded-full bg-nevoa-2 px-2 py-0.5 text-[10px] font-medium text-grafite"
            >
              {e}
            </li>
          ))}
          {t.etiquetas.length > 3 && (
            <li className="px-1 py-0.5 text-[10px] text-cinza-claro">
              +{t.etiquetas.length - 3}
            </li>
          )}
        </ul>
      )}

      {/* Barra de horas: só aparece quando existe estimativa, senão a barra
          não teria denominador e mediria o nada. */}
      {!!t.estimativa_horas && (
        <div className="mt-2.5 pl-7">
          <div className="flex items-baseline justify-between text-[10px] text-cinza-claro">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {numero(t.horas_gastas, 1)}h de {numero(t.estimativa_horas, 1)}h
            </span>
            {estourou && <span className="font-semibold text-alerta">estourou</span>}
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-nevoa-2">
            <div
              className={cn("h-full rounded-full", estourou ? "bg-alerta" : "bg-acento")}
              style={{
                width: `${Math.min((t.horas_gastas / t.estimativa_horas) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 pl-7">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* Trocar o responsável direto no cartão: o `select` fica por cima do
              avatar, invisível, para o alvo de clique ser a própria foto. */}
          <span className="relative inline-flex">
            {t.responsavel ? (
              <Avatar nome={t.responsavel} medida="sm" />
            ) : (
              <span className="grid size-6 place-items-center rounded-full border border-dashed border-borda-forte text-[10px] text-cinza-claro">
                ?
              </span>
            )}
            <select
              value={t.responsavel_id ?? ""}
              onChange={(e) => atribuir(t.id, e.target.value || null)}
              aria-label={`Responsável por "${t.titulo}"`}
              title={t.responsavel ?? "Sem responsável"}
              className="foco-anel absolute inset-0 cursor-pointer rounded-full opacity-0"
            >
              <option value="">Sem responsável</option>
              {equipe.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </span>

          <Etiqueta tom={PRIORIDADE.tom(t.prioridade)}>{PRIORIDADE.rotulo(t.prioridade)}</Etiqueta>

          {t.recorrente && (
            <Repeat
              className="size-3 shrink-0 text-cinza-claro"
              aria-label={`Recorrência ${t.recorrencia ?? ""}`}
            />
          )}
        </div>

        {t.vence_em && (
          <span
            className={cn(
              "shrink-0 text-[11px] tabular-nums",
              vencida ? "font-semibold text-perigo" : "text-cinza-claro",
            )}
          >
            {dataCurta(t.vence_em)}
          </span>
        )}
      </div>
    </article>
  );
}
