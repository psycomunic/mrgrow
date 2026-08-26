"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Vazio } from "@/components/painel/tabela";
import { dataCompleta } from "@/lib/utils";
import { hoje } from "@/lib/tempo";
import { STATUS_PROJETO } from "@/lib/rotulos";
import { useProjetos } from "./contexto";
import { DialogoProjeto } from "./dialogo";
import type { Projeto } from "@/lib/projetos";

export function AcaoNovoProjeto() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Botao tamanho="sm" onClick={() => setAberto(true)}>
        <Plus className="size-4" />
        Novo projeto
      </Botao>
      {aberto && <DialogoProjeto aoFechar={() => setAberto(false)} />}
    </>
  );
}

export function Lista() {
  const { projetos, ajustar, excluir } = useProjetos();
  const [editando, setEditando] = useState<Projeto | null>(null);
  const [criando, setCriando] = useState(false);

  if (!projetos.length) {
    return (
      <>
        <Vazio
          mensagem="Nenhum projeto por aqui. Projeto é entrega com prazo — onboarding, landing page, reestruturação de conta. O que é rotina vive em Tarefas."
          acao={
            <Botao tamanho="sm" onClick={() => setCriando(true)}>
              <Plus className="size-4" />
              Criar o primeiro projeto
            </Botao>
          }
        />
        {criando && <DialogoProjeto aoFechar={() => setCriando(false)} />}
      </>
    );
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projetos.map((p) => {
          const atrasado = !!p.prazo && p.status !== "concluido" && p.prazo < hoje();

          return (
            <article key={p.id} className="cartao group flex flex-col rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm leading-snug font-semibold text-tinta">{p.nome}</h3>
                <Etiqueta tom={STATUS_PROJETO.tom(p.status)}>
                  {STATUS_PROJETO.rotulo(p.status)}
                </Etiqueta>
              </div>

              <p className="mt-1.5 text-xs text-cinza">
                {p.cliente ?? "Interno da agência"}
                {p.responsavel ? ` · ${p.responsavel}` : ""}
              </p>

              <div className="mt-auto pt-5">
                <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                  <span className="text-cinza-claro">Progresso</span>
                  <span className="font-semibold tabular-nums text-grafite">{p.progresso}%</span>
                </div>

                {/* A barra é o próprio controle: arrastar aqui grava o novo
                    progresso, sem abrir o formulário. */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={p.progresso}
                  onChange={(e) => ajustar(p.id, Number(e.target.value))}
                  aria-label={`Progresso de ${p.nome}`}
                  className="h-2 w-full cursor-pointer accent-mrg-500 foco-anel"
                />

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-borda pt-4">
                  <span
                    className={[
                      "text-xs tabular-nums",
                      atrasado ? "font-semibold text-perigo" : "text-cinza-claro",
                    ].join(" ")}
                  >
                    {p.prazo
                      ? `${atrasado ? "Venceu em" : "Prazo"} ${dataCompleta(p.prazo)}`
                      : "Sem prazo definido"}
                  </span>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditando(p)}
                      aria-label={`Editar ${p.nome}`}
                      className="rounded-sm p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-mrg-600 foco-anel"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(p.id)}
                      aria-label={`Excluir ${p.nome}`}
                      className="rounded-sm p-1.5 text-cinza opacity-0 transition-opacity group-hover:opacity-100 hover:text-perigo focus-visible:opacity-100 foco-anel"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {editando && <DialogoProjeto projeto={editando} aoFechar={() => setEditando(null)} />}
    </>
  );
}
