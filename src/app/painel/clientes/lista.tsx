"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Search, User } from "lucide-react";
import { Kpi } from "@/components/painel/kpi";
import { Etiqueta } from "@/components/ui/etiqueta";
import { brl, iniciais, numero, slugificar } from "@/lib/utils";
import { FichaCliente, TOM, ROTULO_STATUS, corSaude } from "./ficha";
import type { ClienteCarteira } from "@/lib/clientes";

type Ordem = "saude" | "fee" | "nome";

const FILTROS = [
  { v: "todos", r: "Todos" },
  { v: "ativo", r: "Ativos" },
  { v: "onboarding", r: "Onboarding" },
  { v: "pausado", r: "Pausados" },
];

const ORDENS: { v: Ordem; r: string }[] = [
  { v: "saude", r: "Saúde" },
  { v: "fee", r: "Fee" },
  { v: "nome", r: "Nome" },
];

/**
 * Carteira de clientes. Os KPIs seguem o recorte filtrado, para o número
 * bater com os cartões que estão à vista.
 */
export function ListaClientes({ clientes }: { clientes: ClienteCarteira[] }) {
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("saude");
  const [aberto, setAberto] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    const termo = slugificar(busca.trim());
    return clientes
      .filter((c) => (filtro === "todos" ? true : c.status === filtro))
      .filter((c) => (termo ? slugificar(c.nome).includes(termo) : true))
      .sort((a, b) => {
        if (ordem === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
        if (ordem === "fee") return b.fee_mensal - a.fee_mensal;
        return a.saude - b.saude; // pior saúde primeiro: é o que precisa de ação
      });
  }, [clientes, filtro, busca, ordem]);

  const ativos = visiveis.filter((c) => c.status === "ativo");
  const mrr = ativos.reduce((s, c) => s + c.fee_mensal, 0);
  const midia = visiveis.reduce((s, c) => s + c.investimento_previsto, 0);
  const saude = visiveis.length
    ? visiveis.reduce((s, c) => s + c.saude, 0) / visiveis.length
    : 0;
  const emRisco = visiveis.filter((c) => c.saude < 60).length;

  const emFoco = clientes.find((c) => c.id === aberto) ?? null;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Clientes ativos"
          valor={numero(ativos.length)}
          detalhe={`${visiveis.length} no recorte`}
        />
        <Kpi rotulo="MRR da carteira" valor={brl(mrr)} detalhe="somente contas ativas" />
        <Kpi rotulo="Mídia sob gestão" valor={brl(midia)} detalhe="previsto no mês" />
        <Kpi
          rotulo="Contas em risco"
          valor={numero(emRisco)}
          detalhe={`saúde média ${numero(saude)}`}
          variacao={emRisco > 0 ? -emRisco : undefined}
          invertido
        />
      </section>

      {/* Filtros */}
      <section className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltro(f.v)}
              aria-pressed={filtro === f.v}
              className={[
                "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors foco-anel",
                filtro === f.v
                  ? "bg-mrg-500/15 text-mrg-700 ring-1 ring-inset ring-mrg-500/40"
                  : "text-cinza hover:bg-nevoa hover:text-grafite",
              ].join(" ")}
            >
              {f.r}
            </button>
          ))}
        </div>

        <div className="relative min-w-48 flex-1 sm:max-w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cinza-claro" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente…"
            className="h-9 w-full rounded-sm border border-borda bg-nevoa pr-3 pl-9 text-sm text-tinta placeholder:text-cinza-claro foco-anel"
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-cinza-claro">Ordenar:</span>
          {ORDENS.map((o) => (
            <button
              key={o.v}
              onClick={() => setOrdem(o.v)}
              aria-pressed={ordem === o.v}
              className={[
                "rounded-sm px-2.5 py-1.5 text-xs transition-colors foco-anel",
                ordem === o.v ? "text-tinta" : "text-cinza-claro hover:text-grafite",
              ].join(" ")}
            >
              {o.r}
            </button>
          ))}
        </div>
      </section>

      {visiveis.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borda p-8 text-center text-sm text-cinza-claro">
          Nenhum cliente neste recorte.
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setAberto(c.id)}
              className="cartao group w-full rounded-lg p-5 text-left transition-all hover:-translate-y-0.5 hover:border-mrg-500/30 foco-anel"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-gradient-to-br from-mrg-500/30 to-mrg-800/30 font-display text-sm font-bold text-mrg-700 ring-1 ring-borda">
                    {iniciais(c.nome)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-tinta group-hover:text-mrg-700">
                      {c.nome}
                    </h3>
                    <p className="truncate text-xs text-cinza">{c.segmento ?? "Sem segmento"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Etiqueta tom={TOM[c.status] ?? "neutro"}>
                    {ROTULO_STATUS[c.status] ?? c.status}
                  </Etiqueta>
                  <ArrowUpRight className="size-4 text-cinza-claro transition-colors group-hover:text-mrg-600" />
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-borda pt-4 text-center">
                <div>
                  <dt className="text-[10px] tracking-wide text-cinza-claro uppercase">Fee</dt>
                  <dd className="mt-0.5 text-sm font-bold text-tinta">{brl(c.fee_mensal)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-cinza-claro uppercase">ROAS</dt>
                  <dd className="mt-0.5 text-sm font-bold text-tinta">
                    {c.roas ? `${c.roas.toFixed(1)}x` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-cinza-claro uppercase">NPS</dt>
                  <dd className="mt-0.5 text-sm font-bold text-tinta">{c.nps ?? "—"}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-cinza-claro">
                  <span>Saúde da conta</span>
                  <span>{c.saude}/100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-nevoa-2">
                  <div className={`h-full ${corSaude(c.saude)}`} style={{ width: `${c.saude}%` }} />
                </div>
              </div>

              {c.responsavel && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-cinza-claro">
                  <User className="size-3" />
                  {c.responsavel}
                </p>
              )}
            </button>
          ))}
        </section>
      )}

      {emFoco && <FichaCliente cliente={emFoco} aoFechar={() => setAberto(null)} />}
    </>
  );
}
