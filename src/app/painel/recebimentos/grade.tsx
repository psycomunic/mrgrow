"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Etiqueta } from "@/components/ui/etiqueta";
import { brl, cn, dataCurta } from "@/lib/utils";
import { desmarcarRecebido, marcarRecebido } from "./acoes";
import type { Recebimento } from "@/lib/recebimentos";

const SITUACAO = {
  pago: { rotulo: "Recebido", tom: "sucesso" as const },
  previsto: { rotulo: "Em dia", tom: "neutro" as const },
  atrasado: { rotulo: "Atrasado", tom: "perigo" as const },
};

export function Grade({
  linhas,
  competencia,
  podeEditar,
}: {
  linhas: Recebimento[];
  competencia: string;
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [, iniciar] = useTransition();

  /* O check precisa responder no clique. Sem isto, quem confere quinze
     cobranças seguidas espera a ida ao servidor a cada uma e acha que o
     clique não pegou — então clica de novo, e desmarca o que acabou de
     marcar. */
  const [otimista, aplicar] = useOptimistic(
    linhas,
    (atual, chave: string) =>
      atual.map((l) =>
        `${l.clienteId}|${l.id ?? ""}` === chave
          ? { ...l, situacao: l.situacao === "pago" ? ("previsto" as const) : ("pago" as const) }
          : l,
      ),
  );

  function alternar(l: Recebimento) {
    if (!podeEditar) return;
    const chave = `${l.clienteId}|${l.id ?? ""}`;

    iniciar(async () => {
      aplicar(chave);
      const r =
        l.situacao === "pago" && l.id
          ? await desmarcarRecebido(l.id)
          : await marcarRecebido(l.id, {
              clienteId: l.clienteId,
              competencia,
              valor: l.valor,
              vencimento: l.vencimento,
            });

      if (r.ok) {
        router.refresh();
      } else {
        toast.error(r.erro ?? "Não foi possível salvar.");
      }
    });
  }

  if (!otimista.length) {
    return (
      <div className="cartao rounded-lg p-10 text-center">
        <p className="text-sm text-cinza">
          Nenhuma cobrança neste mês. Clientes ativos e em onboarding entram aqui
          automaticamente, com o valor e o dia do contrato.
        </p>
      </div>
    );
  }

  return (
    <div className="cartao overflow-hidden rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-borda text-left text-xs font-medium text-cinza">
            <th className="w-12 px-4 py-3">Pago</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Vencimento</th>
            <th className="px-4 py-3 text-right">Valor</th>
            <th className="px-4 py-3">Situação</th>
          </tr>
        </thead>
        <tbody>
          {otimista.map((l) => {
            const s = SITUACAO[l.situacao];
            const pago = l.situacao === "pago";

            return (
              <tr
                key={`${l.clienteId}|${l.id ?? ""}`}
                className="border-b border-borda-fraca last:border-0 hover:bg-nevoa/60"
              >
                <td className="px-4 py-2.5">
                  {/* Caixa quadrada e verde quando marcada: é o mesmo gesto e
                      a mesma leitura do check da planilha que a equipe já usa. */}
                  <button
                    onClick={() => alternar(l)}
                    disabled={!podeEditar}
                    role="checkbox"
                    aria-checked={pago}
                    aria-label={`${pago ? "Desmarcar" : "Marcar"} ${l.cliente} como recebido`}
                    className={cn(
                      "foco-anel grid size-5 place-items-center rounded-sm border transition-colors",
                      pago
                        ? "border-sucesso bg-sucesso text-papel"
                        : "border-borda-forte bg-concha hover:border-acento",
                      !podeEditar && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {pago && <Check className="size-3.5" strokeWidth={3} />}
                  </button>
                </td>
                <td className="px-4 py-2.5 font-medium text-tinta">
                  {l.slug ? (
                    <Link href={`/painel/clientes/${l.slug}`} className="hover:text-acento">
                      {l.cliente}
                    </Link>
                  ) : (
                    l.cliente
                  )}
                </td>
                <td className="px-4 py-2.5 text-grafite">
                  {dataCurta(l.vencimento)}
                  {l.atraso > 0 && (
                    <span className="ml-2 text-xs text-perigo">
                      {l.atraso} {l.atraso === 1 ? "dia" : "dias"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums text-tinta">
                  {brl(l.valor)}
                </td>
                <td className="px-4 py-2.5">
                  <Etiqueta tom={s.tom}>{s.rotulo}</Etiqueta>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Troca de mês, no formato que a competência usa. */
export function SeletorMes({ competencia }: { competencia: string }) {
  const router = useRouter();
  const [valor, setValor] = useState(competencia);

  return (
    <input
      type="month"
      value={valor}
      onChange={(e) => {
        const v = e.target.value;
        if (!/^\d{4}-\d{2}$/.test(v)) return;
        setValor(v);
        router.push(`/painel/recebimentos?mes=${v}`);
      }}
      className="h-9 rounded-sm border border-borda-forte bg-concha px-3 text-sm text-tinta"
      aria-label="Mês da régua de cobrança"
    />
  );
}

const RECORTES = [
  { v: null, r: "Todas", chave: "todas" as const },
  { v: "atrasado", r: "Atrasadas", chave: "atrasado" as const },
  { v: "previsto", r: "Em dia", chave: "previsto" as const },
  { v: "pago", r: "Recebidas", chave: "pago" as const },
];

/**
 * Filtro por situação.
 *
 * É link e não estado local de propósito: quem chega da visão geral clicando
 * em "em atraso" precisa cair aqui já filtrado, e o endereço tem de carregar
 * o recorte para poder ser recarregado ou mandado para outra pessoa.
 */
export function Recorte({
  atual,
  mes,
  contagens,
}: {
  atual: string | null;
  mes: string;
  contagens: { todas: number; pago: number; previsto: number; atrasado: number };
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {RECORTES.map((r) => {
        const n = contagens[r.chave];
        const ativo = atual === r.v;
        return (
          <Link
            key={r.r}
            href={`/painel/recebimentos?mes=${mes}${r.v ? `&situacao=${r.v}` : ""}`}
            className={cn(
              "foco-anel rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              ativo
                ? "bg-acento text-white"
                : "border border-borda bg-nevoa text-grafite hover:border-borda-forte hover:text-tinta",
            )}
          >
            {r.r}
            <span className={cn("ml-1.5 tabular-nums", ativo ? "text-white/70" : "text-cinza")}>
              {n}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
