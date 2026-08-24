import type { Metadata } from "next";
import Link from "next/link";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_CLIENTES } from "@/lib/demo";
import { brl, numero } from "@/lib/utils";

export const metadata: Metadata = { title: "Clientes" };

const TOM: Record<string, "sucesso" | "azul" | "alerta" | "neutro"> = {
  ativo: "sucesso", onboarding: "azul", pausado: "alerta", encerrado: "neutro", prospecto: "neutro",
};

export default function PaginaClientes() {
  const demo = !supabaseConfigurado();
  const ativos = DEMO_CLIENTES.filter((c) => c.status === "ativo");
  const mrr = ativos.reduce((s, c) => s + c.fee_mensal, 0);
  const midia = DEMO_CLIENTES.reduce((s, c) => s + c.investimento_previsto, 0);

  return (
    <>
      <Topo
        titulo="Clientes"
        descricao="Carteira da agência, saúde da conta e contratos."
        acao={<BotaoLink href="/painel/clientes/novo" tamanho="sm">Novo cliente</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Clientes ativos" valor={numero(ativos.length)} detalhe={`${DEMO_CLIENTES.length} na base`} />
          <Kpi rotulo="MRR da carteira" valor={brl(mrr)} variacao={12.4} />
          <Kpi rotulo="Mídia sob gestão" valor={brl(midia)} detalhe="previsto no mês" />
          <Kpi rotulo="Saúde média" valor={numero(DEMO_CLIENTES.reduce((s, c) => s + c.saude, 0) / DEMO_CLIENTES.length)} detalhe="de 0 a 100" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DEMO_CLIENTES.map((c) => (
            <Link
              key={c.id}
              href={`/painel/clientes/${c.slug}`}
              className="cartao-vidro group rounded-lg p-5 transition-all hover:-translate-y-0.5 hover:border-mrg-500/30 foco-anel"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-gradient-to-br from-mrg-500/30 to-mrg-800/30 font-display text-sm font-bold text-mrg-200 ring-1 ring-white/10">
                    {c.nome.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-mrg-200">{c.nome}</h3>
                    <p className="text-xs text-ink-400">{c.segmento}</p>
                  </div>
                </div>
                <Etiqueta tom={TOM[c.status] ?? "neutro"}>{c.status}</Etiqueta>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/8 pt-4 text-center">
                <div>
                  <dt className="text-[10px] tracking-wide text-ink-500 uppercase">Fee</dt>
                  <dd className="mt-0.5 text-sm font-bold text-white">{brl(c.fee_mensal)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-ink-500 uppercase">ROAS</dt>
                  <dd className="mt-0.5 text-sm font-bold text-white">{c.roas ? `${c.roas.toFixed(1)}x` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-ink-500 uppercase">NPS</dt>
                  <dd className="mt-0.5 text-sm font-bold text-white">{c.nps ?? "—"}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-ink-500">
                  <span>Saúde da conta</span>
                  <span>{c.saude}/100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={c.saude >= 80 ? "h-full bg-sucesso" : c.saude >= 60 ? "h-full bg-alerta" : "h-full bg-perigo"}
                    style={{ width: `${c.saude}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
