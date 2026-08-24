import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoSincronizar } from "./botao-sincronizar";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_SERIE, DEMO_CLIENTES } from "@/lib/demo";
import { brl, numero, percentual, divisao } from "@/lib/utils";

export const metadata: Metadata = { title: "Métricas" };

export default function PaginaMetricas() {
  const demo = !supabaseConfigurado();
  const investimento = DEMO_SERIE.reduce((s, d) => s + d.investimento, 0);
  const receita = DEMO_SERIE.reduce((s, d) => s + d.receita, 0);
  const leads = DEMO_SERIE.reduce((s, d) => s + d.leads, 0);
  const cliques = DEMO_SERIE.reduce((s, d) => s + d.cliques, 0);
  const impressoes = DEMO_SERIE.reduce((s, d) => s + d.impressoes, 0);
  const compras = DEMO_SERIE.reduce((s, d) => s + d.compras, 0);

  return (
    <>
      <Topo
        titulo="Métricas"
        descricao="Consolidado de Meta Ads, Google Ads e GA4 · últimos 30 dias."
        acao={<BotaoSincronizar />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Investimento" valor={brl(investimento)} variacao={16.4} />
          <Kpi rotulo="Receita atribuída" valor={brl(receita)} variacao={28.1} />
          <Kpi rotulo="ROAS" valor={`${divisao(receita, investimento).toFixed(2)}x`} variacao={10.1} />
          <Kpi rotulo="Compras" valor={numero(compras)} variacao={19.3} />
          <Kpi rotulo="Leads" valor={numero(leads)} variacao={22.8} />
          <Kpi rotulo="CPL" valor={brl(divisao(investimento, leads))} variacao={-8.4} invertido />
          <Kpi rotulo="CTR" valor={percentual(divisao(cliques, impressoes) * 100, 2)} variacao={5.6} />
          <Kpi rotulo="CPC" valor={brl(divisao(investimento, cliques))} variacao={-3.9} invertido />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="cartao-vidro rounded-lg p-5">
            <h2 className="mb-4 font-display text-base font-bold text-white">Investimento × receita</h2>
            <GraficoArea
              dados={DEMO_SERIE}
              series={[
                { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
                { chave: "receita", rotulo: "Receita", cor: "#12b981" },
              ]}
              altura={260}
            />
          </div>
          <div className="cartao-vidro rounded-lg p-5">
            <h2 className="mb-4 font-display text-base font-bold text-white">Leads e cliques</h2>
            <GraficoArea
              dados={DEMO_SERIE}
              series={[
                { chave: "leads", rotulo: "Leads", cor: "#1668f5" },
                { chave: "compras", rotulo: "Compras", cor: "#f5a524" },
              ]}
              formatoY="numero"
              altura={260}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-white">Desempenho por conta</h2>
          <Tabela>
            <Cabecalhos colunas={["Cliente", "Plataforma", "Investimento", "Receita", "ROAS", "Status"]} />
            <tbody>
              {DEMO_CLIENTES.filter((c) => c.roas > 0).map((c, i) => {
                const inv = c.investimento_previsto * 0.86;
                return (
                  <Linha key={c.id}>
                    <Celula className="font-medium text-white">{c.nome}</Celula>
                    <Celula className="text-ink-400">{i % 2 === 0 ? "Meta + Google" : "Meta Ads"}</Celula>
                    <Celula>{brl(inv)}</Celula>
                    <Celula>{brl(inv * c.roas)}</Celula>
                    <Celula className="font-semibold text-white">{c.roas.toFixed(2)}x</Celula>
                    <Celula>
                      <Etiqueta tom={c.roas >= 4 ? "sucesso" : c.roas >= 2.5 ? "alerta" : "perigo"}>
                        {c.roas >= 4 ? "acima da meta" : c.roas >= 2.5 ? "na meta" : "abaixo da meta"}
                      </Etiqueta>
                    </Celula>
                  </Linha>
                );
              })}
            </tbody>
          </Tabela>
        </section>
      </div>
    </>
  );
}
