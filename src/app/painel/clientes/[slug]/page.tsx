import { notFound } from "next/navigation";
import { Topo } from "../../_componentes/topo";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { DEMO_CLIENTES, DEMO_SERIE, DEMO_TAREFAS, DEMO_LANCAMENTOS } from "@/lib/demo";
import { brl, numero, dataCompleta, divisao } from "@/lib/utils";

export default async function PaginaCliente({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cliente = DEMO_CLIENTES.find((c) => c.slug === slug);
  if (!cliente) notFound();

  const investimento = DEMO_SERIE.reduce((s, d) => s + d.investimento, 0);
  const receita = DEMO_SERIE.reduce((s, d) => s + d.receita, 0);
  const leads = DEMO_SERIE.reduce((s, d) => s + d.leads, 0);

  return (
    <>
      <Topo
        titulo={cliente.nome}
        descricao={`${cliente.segmento} · fee ${brl(cliente.fee_mensal)}/mês`}
        acao={
          <>
            <BotaoLink href={`/painel/relatorios?cliente=${cliente.slug}`} variante="contorno" tamanho="sm">
              Gerar relatório
            </BotaoLink>
            <BotaoLink href="/painel/integracoes" tamanho="sm">Contas conectadas</BotaoLink>
          </>
        }
      />

      <div className="space-y-6 p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Investimento (30d)" valor={brl(investimento)} variacao={14.2} />
          <Kpi rotulo="Receita atribuída" valor={brl(receita)} variacao={31.7} />
          <Kpi rotulo="ROAS" valor={`${divisao(receita, investimento).toFixed(2)}x`} variacao={8.9} />
          <Kpi rotulo="Leads gerados" valor={numero(leads)} detalhe={`CPL ${brl(divisao(investimento, leads))}`} />
        </section>

        <section className="cartao-vidro rounded-lg p-5">
          <h2 className="mb-4 font-display text-base font-bold text-white">Desempenho diário</h2>
          <GraficoArea
            dados={DEMO_SERIE}
            series={[
              { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
              { chave: "receita", rotulo: "Receita", cor: "#12b981" },
            ]}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-base font-bold text-white">Tarefas do cliente</h2>
            <Tabela>
              <Cabecalhos colunas={["Tarefa", "Responsável", "Prazo", "Status"]} />
              <tbody>
                {DEMO_TAREFAS.slice(0, 4).map((t) => (
                  <Linha key={t.id}>
                    <Celula className="max-w-56 truncate text-white">{t.titulo}</Celula>
                    <Celula className="text-ink-400">{t.responsavel}</Celula>
                    <Celula className="text-ink-400">{dataCompleta(t.vence_em)}</Celula>
                    <Celula><Etiqueta tom={t.status === "concluida" ? "sucesso" : "azul"}>{t.status}</Etiqueta></Celula>
                  </Linha>
                ))}
              </tbody>
            </Tabela>
          </div>

          <div>
            <h2 className="mb-3 font-display text-base font-bold text-white">Financeiro do cliente</h2>
            <Tabela>
              <Cabecalhos colunas={["Descrição", "Vencimento", "Valor", "Status"]} />
              <tbody>
                {DEMO_LANCAMENTOS.filter((l) => l.tipo === "receita").slice(0, 4).map((l) => (
                  <Linha key={l.id}>
                    <Celula className="text-white">{l.descricao}</Celula>
                    <Celula className="text-ink-400">{dataCompleta(l.vencimento)}</Celula>
                    <Celula className="font-medium text-white">{brl(l.valor)}</Celula>
                    <Celula>
                      <Etiqueta tom={l.status === "pago" ? "sucesso" : l.status === "atrasado" ? "perigo" : "alerta"}>
                        {l.status}
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
