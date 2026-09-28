"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { CalendarRange, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATAFORMAS } from "@/lib/plataformas";

export type OpcaoCliente = { id: string; nome: string };

/**
 * Atalhos de período.
 *
 * `dias` conta para trás a partir de hoje, inclusive. "Este mês" e "mês
 * passado" não cabem nessa conta, então trazem o próprio cálculo.
 */
const ATALHOS: { id: string; rotulo: string; calcular: () => { de: string; ate: string } }[] = [
  { id: "7", rotulo: "7 dias", calcular: () => recuar(7) },
  { id: "14", rotulo: "14 dias", calcular: () => recuar(14) },
  { id: "30", rotulo: "30 dias", calcular: () => recuar(30) },
  { id: "90", rotulo: "90 dias", calcular: () => recuar(90) },
  {
    id: "mes",
    rotulo: "Este mês",
    calcular: () => {
      const h = new Date();
      return { de: iso(new Date(h.getFullYear(), h.getMonth(), 1)), ate: iso(h) };
    },
  },
  {
    id: "mes-passado",
    rotulo: "Mês passado",
    calcular: () => {
      const h = new Date();
      return {
        de: iso(new Date(h.getFullYear(), h.getMonth() - 1, 1)),
        ate: iso(new Date(h.getFullYear(), h.getMonth(), 0)),
      };
    },
  },
];

/* Data local, e não `toISOString`: este converte para UTC e, à noite no fuso
   de Brasília, devolveria o dia seguinte. */
function iso(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function recuar(dias: number) {
  const ate = new Date();
  const de = new Date();
  de.setDate(de.getDate() - (dias - 1));
  return { de: iso(de), ate: iso(ate) };
}

export function FiltrosMetricas({
  clientes,
  de,
  ate,
  clienteId,
  provedor,
}: {
  clientes: OpcaoCliente[];
  de: string;
  ate: string;
  clienteId: string | null;
  provedor: string | null;
}) {
  const router = useRouter();
  const busca = useSearchParams();
  const [pendente, setPendente] = useState(false);

  /* O recorte viaja na URL, e não em estado: assim o diagnóstico de um
     cliente num período vira um link que dá para mandar para ele, e voltar
     no navegador desfaz o filtro em vez de sair da tela. */
  const navegar = useCallback(
    (mudancas: Record<string, string | null>) => {
      const p = new URLSearchParams(busca.toString());
      for (const [k, v] of Object.entries(mudancas)) {
        if (v === null || v === "") p.delete(k);
        else p.set(k, v);
      }
      setPendente(true);
      router.push(`/painel/metricas?${p.toString()}`);
    },
    [busca, router],
  );

  const atalhoAtivo = ATALHOS.find((a) => {
    const c = a.calcular();
    return c.de === de && c.ate === ate;
  });

  return (
    <section className={cn("space-y-3", pendente && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <nav className="inline-flex gap-1 rounded-full border border-borda bg-carta p-1">
          {ATALHOS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navegar(a.calcular())}
              aria-pressed={atalhoAtivo?.id === a.id}
              className={cn(
                "foco-anel rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
                atalhoAtivo?.id === a.id
                  ? "bg-mrg-500 text-white"
                  : "text-cinza hover:bg-nevoa hover:text-tinta",
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </nav>

        <label className="inline-flex items-center gap-2 rounded-full border border-borda bg-carta px-3 py-1.5 text-[13px] text-cinza">
          <CalendarRange className="size-3.5 shrink-0" />
          <input
            type="date"
            value={de}
            max={ate}
            onChange={(e) => e.target.value && navegar({ de: e.target.value })}
            aria-label="Data inicial"
            className="foco-anel bg-transparent text-tinta"
          />
          <span className="text-cinza-claro">até</span>
          <input
            type="date"
            value={ate}
            min={de}
            onChange={(e) => e.target.value && navegar({ ate: e.target.value })}
            aria-label="Data final"
            className="foco-anel bg-transparent text-tinta"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Menu
          rotulo="Filtrar por cliente"
          valor={clienteId ?? ""}
          aoMudar={(v) => navegar({ cliente: v || null })}
        >
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Menu>

        <Menu
          rotulo="Filtrar por plataforma"
          valor={provedor ?? ""}
          aoMudar={(v) => navegar({ plataforma: v || null })}
        >
          <option value="">Todas as plataformas</option>
          {PLATAFORMAS.map((p) => (
            <option key={p.v} value={p.v}>
              {p.r}
            </option>
          ))}
        </Menu>

        {(clienteId || provedor || !atalhoAtivo) && (
          <button
            type="button"
            onClick={() => {
              const p = recuar(30);
              setPendente(true);
              router.push(`/painel/metricas?de=${p.de}&ate=${p.ate}`);
            }}
            className="foco-anel inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-cinza hover:text-tinta"
          >
            <RotateCcw className="size-3.5" />
            Limpar filtros
          </button>
        )}
      </div>
    </section>
  );
}

function Menu({
  valor,
  aoMudar,
  children,
  rotulo,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  children: React.ReactNode;
  rotulo: string;
}) {
  return (
    <select
      aria-label={rotulo}
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className={cn(
        "foco-anel cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
        valor
          ? "border-mrg-500/50 bg-mrg-500/15 text-acento-forte"
          : "border-borda bg-carta text-cinza hover:border-borda-forte hover:text-tinta",
      )}
    >
      {children}
    </select>
  );
}
