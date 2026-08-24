import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Topo } from "./_componentes/topo";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea } from "@/components/painel/grafico-area";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_KPIS, DEMO_SERIE, DEMO_CLIENTES, DEMO_TAREFAS } from "@/lib/demo";
import { brl, numero, percentual, dataCompleta } from "@/lib/utils";

export default async function PaginaVisao() {
  const demo = !supabaseConfigurado();
  const k = DEMO_KPIS;

  return (
    <>
      <Topo
        titulo="Visão geral"
        descricao="O estado da agência agora — comercial, operação e caixa."
        acao={<BotaoLink href="/painel/crm" tamanho="sm">Abrir CRM</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="MRR (receita recorrente)" valor={brl(k.mrr)} variacao={12.4} detalhe="vs. mês anterior" />
          <Kpi rotulo="Clientes ativos" valor={numero(k.clientesAtivos)} variacao={9.1} detalhe={`ticket ${brl(k.ticketMedio)}`} />
          <Kpi rotulo="Investimento gerido" valor={brl(k.investimentoGerido)} variacao={18.6} detalhe="mídia no mês" />
          <Kpi rotulo="ROAS médio das contas" valor={`${k.roasMedio.toFixed(2)}x`} variacao={6.3} detalhe="últimos 30 dias" />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="cartao-vidro rounded-lg p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-white">Investimento × receita atribuída</h2>
                <p className="text-xs text-ink-400">Consolidado de todas as contas conectadas · 30 dias</p>
              </div>
              <Link href="/painel/metricas" className="inline-flex items-center gap-1 text-xs font-semibold text-mrg-400 hover:text-mrg-300">
                Detalhar <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <GraficoArea
              dados={DEMO_SERIE}
              series={[
                { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
                { chave: "receita", rotulo: "Receita atribuída", cor: "#12b981" },
              ]}
              altura={420}
            />
          </div>

          <div className="space-y-4">
            <Kpi rotulo="Leads no mês" valor={numero(k.leadsMes)} variacao={22.8} detalhe={`CPL ${brl(k.cplMedio)}`} />
            <Kpi rotulo="Pipeline aberto" valor={brl(k.valorPipeline)} detalhe={`${k.negociosAbertos} negócios`} />
            <Kpi rotulo="Taxa de conversão" valor={percentual(k.taxaConversao)} variacao={3.2} detalhe="lead → cliente" />
            <Kpi rotulo="Inadimplência" valor={brl(k.inadimplencia)} variacao={-18.0} invertido detalhe="em aberto" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-base font-bold text-white">Saúde das contas</h2>
            <Tabela>
              <Cabecalhos colunas={["Cliente", "Segmento", "ROAS", "Saúde"]} />
              <tbody>
                {DEMO_CLIENTES.slice(0, 6).map((c) => (
                  <Linha key={c.id}>
                    <Celula>
                      <Link href={`/painel/clientes/${c.slug}`} className="font-medium text-white hover:text-mrg-300">
                        {c.nome}
                      </Link>
                    </Celula>
                    <Celula className="text-ink-400">{c.segmento}</Celula>
                    <Celula>{c.roas ? `${c.roas.toFixed(1)}x` : "—"}</Celula>
                    <Celula>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={
                              c.saude >= 80 ? "h-full bg-sucesso" : c.saude >= 60 ? "h-full bg-alerta" : "h-full bg-perigo"
                            }
                            style={{ width: `${c.saude}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink-400">{c.saude}</span>
                      </div>
                    </Celula>
                  </Linha>
                ))}
              </tbody>
            </Tabela>
          </div>

          <div>
            <h2 className="mb-3 font-display text-base font-bold text-white">Tarefas da semana</h2>
            <Tabela>
              <Cabecalhos colunas={["Tarefa", "Cliente", "Prazo", "Status"]} />
              <tbody>
                {DEMO_TAREFAS.map((t) => (
                  <Linha key={t.id}>
                    <Celula className="max-w-64 truncate text-white">{t.titulo}</Celula>
                    <Celula className="text-ink-400">{t.cliente}</Celula>
                    <Celula className="text-ink-400">{dataCompleta(t.vence_em)}</Celula>
                    <Celula>
                      <Etiqueta
                        tom={
                          t.status === "concluida" ? "sucesso" :
                          t.prioridade === "urgente" ? "perigo" :
                          t.status === "fazendo" ? "azul" : "neutro"
                        }
                      >
                        {t.status}
                      </Etiqueta>
                    </Celula>
                  </Linha>
                ))}
              </tbody>
            </Tabela>
          </div>
        </section>
      </div>
    </>
  );
}
