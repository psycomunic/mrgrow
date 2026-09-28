"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { cn } from "@/lib/utils";
import type { NegocioQuadro } from "@/lib/crm";

/**
 * Motivos prontos, porque motivo de perda só serve se for comparável.
 *
 * Em campo livre cada pessoa escreve de um jeito ("caro", "achou caro",
 * "preço") e no fim do trimestre não dá para somar nada. A lista fecha as
 * respostas; o campo de observação guarda o detalhe que não cabe nelas.
 */
const MOTIVOS = [
  "Preço acima do orçamento",
  "Sem verba no momento",
  "Escolheu outra agência",
  "Vai fazer internamente",
  "Sem retorno do contato",
  "Não era o perfil da agência",
  "Fora de hora — voltar depois",
];

export function DialogoPerda({
  negocio,
  aoFechar,
  aoConfirmar,
}: {
  negocio: NegocioQuadro;
  aoFechar: () => void;
  aoConfirmar: (motivo: string) => void;
}) {
  const idBase = useId();
  const [motivo, setMotivo] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState("");

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  function confirmar() {
    if (!motivo) return;
    const texto = detalhe.trim() ? `${motivo} — ${detalhe.trim()}` : motivo;
    aoConfirmar(texto);
  }

  return (
    <Sobreposicao
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-papel/85 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idBase}-titulo`}
        className="cartao my-auto w-full max-w-lg overflow-hidden rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-borda px-6 py-4">
          <div>
            <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-tinta">
              Por que este negócio foi perdido?
            </h2>
            <p className="mt-0.5 truncate text-xs text-cinza">{negocio.titulo}</p>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="foco-anel rounded-sm p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-tinta"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <ul className="flex flex-wrap gap-1.5">
            {MOTIVOS.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => setMotivo(m)}
                  aria-pressed={motivo === m}
                  className={cn(
                    "foco-anel rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    motivo === m
                      ? "border-perigo/50 bg-perigo/15 font-semibold text-perigo"
                      : "border-borda bg-nevoa text-cinza hover:border-borda-forte hover:text-tinta",
                  )}
                >
                  {m}
                </button>
              </li>
            ))}
          </ul>

          <textarea
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value)}
            rows={3}
            placeholder="Algum detalhe que ajude a entender depois? (opcional)"
            className="foco-anel w-full resize-y rounded-md border border-borda bg-nevoa px-3.5 py-2.5 text-sm text-tinta placeholder:text-cinza-claro focus:border-mrg-500/60"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
          <Botao variante="contorno" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao variante="perigo" onClick={confirmar} disabled={!motivo}>
            Marcar como perdido
          </Botao>
        </div>
      </div>
    </Sobreposicao>
  );
}
