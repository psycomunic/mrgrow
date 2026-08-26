"use client";

import { useState } from "react";
import { Flame, Snowflake, Thermometer, Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import { Etiqueta } from "@/components/ui/etiqueta";
import { brl, dataCompleta } from "@/lib/utils";
import { useCrm } from "./contexto";
import { DialogoNegocio } from "./dialogo";
import type { NegocioQuadro } from "@/lib/crm";

const ICONE_TEMP: Record<string, typeof Flame> = {
  quente: Flame,
  morno: Thermometer,
  frio: Snowflake,
};
const TOM_TEMP: Record<string, "perigo" | "alerta" | "azul"> = {
  quente: "perigo",
  morno: "alerta",
  frio: "azul",
};

/**
 * Quadro do funil com arrastar-e-soltar nativo (HTML5).
 * Toda mudança passa pelo contexto, que aplica na tela na hora e chama a
 * Server Action; o trigger `ao_mover_negocio` grava o histórico no banco.
 */
export function Kanban() {
  const { etapas, negocios, mover, fechar, excluir } = useCrm();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [editando, setEditando] = useState<NegocioQuadro | null>(null);
  const [criandoEm, setCriandoEm] = useState<string | null>(null);

  return (
    <>
      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
        <div className="flex min-w-max gap-4">
          {etapas.map((etapa) => {
            const daEtapa = negocios.filter((n) => n.etapa_id === etapa.id);
            const soma = daEtapa.reduce((s, n) => s + n.valor_mensal, 0);

            return (
              <div
                key={etapa.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSobre(etapa.id);
                }}
                onDragLeave={() => setSobre(null)}
                onDrop={() => {
                  if (arrastando) mover(arrastando, etapa.id);
                  setArrastando(null);
                  setSobre(null);
                }}
                className={[
                  "flex w-72 shrink-0 flex-col rounded-lg border p-3 transition-colors",
                  sobre === etapa.id
                    ? "border-mrg-500/50 bg-mrg-500/5"
                    : "border-white/8 bg-white/[0.02]",
                ].join(" ")}
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: etapa.cor ?? "#1668f5" }}
                    />
                    <h3 className="text-sm font-semibold text-white">{etapa.nome}</h3>
                    <span className="rounded-full bg-white/8 px-1.5 text-[11px] text-ink-300">
                      {daEtapa.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-500">{etapa.probabilidade}%</span>
                </div>

                <p className="mb-3 px-1 text-xs text-ink-400">{brl(soma)} /mês</p>

                <div className="flex-1 space-y-2">
                  {daEtapa.map((n) => {
                    const IconeTemp = ICONE_TEMP[n.temperatura] ?? Thermometer;
                    return (
                      <article
                        key={n.id}
                        draggable
                        onDragStart={() => setArrastando(n.id)}
                        onDragEnd={() => setArrastando(null)}
                        className="cartao-vidro group/cartao cursor-grab rounded-md p-3.5 transition-shadow hover:border-mrg-500/30 active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white">{n.titulo}</h4>
                          <IconeTemp className="size-3.5 shrink-0 text-ink-400" />
                        </div>
                        {n.contato && <p className="mt-1 text-xs text-ink-400">{n.contato}</p>}

                        <p className="mt-3 font-display text-base font-bold text-white">
                          {brl(n.valor_mensal)}
                          <span className="text-xs font-normal text-ink-400">/mês</span>
                        </p>
                        {n.valor_unico > 0 && (
                          <p className="text-[11px] text-ink-500">+ {brl(n.valor_unico)} de setup</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <Etiqueta tom={TOM_TEMP[n.temperatura]}>{n.temperatura}</Etiqueta>
                          {n.origem && <Etiqueta>{n.origem}</Etiqueta>}
                        </div>
                        {n.previsao && (
                          <p className="mt-2.5 text-[11px] text-ink-500">
                            Previsão: {dataCompleta(n.previsao)}
                          </p>
                        )}

                        {/* Ações do cartão: aparecem no hover e no foco por teclado. */}
                        <div className="mt-3 flex items-center gap-1 border-t border-white/8 pt-2.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/cartao:opacity-100">
                          <BotaoCartao
                            rotulo="Marcar como ganho"
                            onClick={() => fechar(n.id, "ganho")}
                            classe="hover:bg-sucesso/15 hover:text-sucesso"
                          >
                            <Check className="size-3.5" />
                          </BotaoCartao>
                          <BotaoCartao
                            rotulo="Marcar como perdido"
                            onClick={() => fechar(n.id, "perdido")}
                            classe="hover:bg-perigo/15 hover:text-perigo"
                          >
                            <X className="size-3.5" />
                          </BotaoCartao>
                          <BotaoCartao rotulo="Editar" onClick={() => setEditando(n)}>
                            <Pencil className="size-3.5" />
                          </BotaoCartao>
                          <BotaoCartao
                            rotulo="Excluir"
                            onClick={() => {
                              if (confirm(`Excluir "${n.titulo}"? Isso não pode ser desfeito.`)) {
                                excluir(n.id);
                              }
                            }}
                            classe="ml-auto hover:bg-perigo/15 hover:text-perigo"
                          >
                            <Trash2 className="size-3.5" />
                          </BotaoCartao>
                        </div>
                      </article>
                    );
                  })}

                  <button
                    onClick={() => setCriandoEm(etapa.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/10 py-2.5 text-xs text-ink-500 transition-colors hover:border-mrg-500/40 hover:text-mrg-300 foco-anel"
                  >
                    <Plus className="size-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {criandoEm && (
        <DialogoNegocio etapaPadrao={criandoEm} aoFechar={() => setCriandoEm(null)} />
      )}
      {editando && <DialogoNegocio negocio={editando} aoFechar={() => setEditando(null)} />}
    </>
  );
}

function BotaoCartao({
  rotulo,
  onClick,
  classe = "",
  children,
}: {
  rotulo: string;
  onClick: () => void;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={`rounded-sm p-1.5 text-ink-400 transition-colors hover:text-white foco-anel ${classe}`}
    >
      {children}
    </button>
  );
}
