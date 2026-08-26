import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo, AvisoFalha } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea, LegendaGrafico, type SerieGrafico } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula, CelulaTexto } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoSincronizar } from "./botao-sincronizar";
import { exigirPermissao } from "@/lib/sessao";
import { carregarPorConta, carregarSerie } from "@/lib/metricas-servidor";
import { comparar, tracado } from "@/lib/metricas";
import { brl, multiplo, numero, percentual } from "@/lib/utils";

export const metadata: Metadata = { title: "Métricas" };

const DINHEIRO: SerieGrafico[] = [
  { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
  { chave: "receita", rotulo: "Receita", cor: "#0f9d76", eixo: "direita" },
];

const VOLUME: SerieGrafico[] = [
  { chave: "leads", rotulo: "Leads", cor: "#1668f5" },
  { chave: "compras", rotulo: "Compras", cor: "#b54708" },
];

/** Meta de ROAS da agência. Abaixo disso a conta entra na fila de revisão. */
const META_ROAS = 3.5;

export default async function PaginaMetricas() {
  await exigirPermissao("metricas");

  const [metricas, porConta] = await Promise.all([carregarSerie(60), carregarPorConta(30)]);
  const c = comparar(metricas.serie, 30);

  return (
    <>
      <Topo
        titulo="Métricas"
        descricao="Consolidado de Meta Ads, Google Ads e GA4 · últimos 30 dias."
        acao={<BotaoSincronizar />}
      />

      <div className="space-y-5 p-5 sm:p-8">
        {metricas.demo && <AvisoDemo />}
        {(metricas.falhou || porConta.falhou) && <AvisoFalha o_que="as métricas sincronizadas" />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Investimento"
            valor={brl(c.atual.investimento)}
            variacao={c.delta("investimento")}
            serie={tracado(c.serie, "investimento")}
          />
          <Kpi
            rotulo="Receita atribuída"
            valor={brl(c.atual.receita)}
            variacao={c.delta("receita")}
            tom="menta"
            serie={tracado(c.serie, "receita")}
          />
          <Kpi
            rotulo="ROAS"
            valor={multiplo(c.atual.roas)}
            variacao={c.delta("roas")}
            detalhe={`meta ${multiplo(META_ROAS, 1)}`}
          />
          {/* Faísca só nos indicadores de volume. Razão (ROAS, CPL, CTR, CPC)
              não ganha traço: a leitura útil dela é a variação, não a curva. */}
          <Kpi
            rotulo="Compras"
            valor={numero(c.atual.compras)}
            variacao={c.delta("compras")}
            detalhe={`ticket ${brl(c.atual.ticketMedio)}`}
            tom="menta"
            serie={tracado(c.serie, "compras")}
          />
          <Kpi
            rotulo="Leads"
            valor={numero(c.atual.leads)}
            variacao={c.delta("leads")}
            serie={tracado(c.serie, "leads")}
          />
          <Kpi
            rotulo="Custo por lead"
            valor={brl(c.atual.cpl)}
            variacao={c.delta("cpl")}
            invertido
            tom="pessego"
            detalhe="menor é melhor"
          />
          <Kpi rotulo="CTR" valor={percentual(c.atual.ctr, 2)} variacao={c.delta("ctr")} />
          <Kpi
            rotulo="Custo por clique"
            valor={brl(c.atual.cpc)}
            variacao={c.delta("cpc")}
            invertido
            tom="pessego"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="cartao rounded-lg p-5">
            <div className="mb-4">
              <h2 className="font-display text-[15px] font-bold text-tinta">
                Investimento × receita
              </h2>
              <div className="mt-2">
                <LegendaGrafico series={DINHEIRO} />
              </div>
            </div>
            <GraficoArea dados={c.serie} series={DINHEIRO} altura={260} />
          </div>

          <div className="cartao rounded-lg p-5">
            <div className="mb-4">
              <h2 className="font-display text-[15px] font-bold text-tinta">Leads e compras</h2>
              <div className="mt-2">
                <LegendaGrafico series={VOLUME} />
              </div>
            </div>
            <GraficoArea dados={c.serie} series={VOLUME} formatoY="numero" altura={260} />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[15px] font-bold text-tinta">Desempenho por conta</h2>
            <span className="text-xs text-cinza-claro">
              {porConta.contas.length
                ? `soma ${brl(porConta.contas.reduce((s, x) => s + x.investimento, 0))} de mídia`
                : ""}
            </span>
          </div>

          <Tabela larguraMinima="52rem">
            <Cabecalhos
              colunas={["Cliente", "Investimento", "Receita", "Leads", "ROAS", "Situação"]}
            />
            <tbody>
              {porConta.contas.map((conta) => (
                <Linha key={conta.id}>
                  <CelulaTexto largura="16rem" className="font-medium text-tinta" titulo={conta.nome}>
                    {conta.nome}
                  </CelulaTexto>
                  <Celula className="tabular-nums whitespace-nowrap">{brl(conta.investimento)}</Celula>
                  <Celula className="tabular-nums whitespace-nowrap">{brl(conta.receita)}</Celula>
                  <Celula className="tabular-nums">{numero(conta.leads)}</Celula>
                  <Celula className="font-semibold tabular-nums whitespace-nowrap text-tinta">
                    {multiplo(conta.roas)}
                  </Celula>
                  <Celula>
                    <Etiqueta
                      tom={
                        conta.roas >= META_ROAS
                          ? "sucesso"
                          : conta.roas >= META_ROAS * 0.75
                            ? "alerta"
                            : "perigo"
                      }
                    >
                      {conta.roas >= META_ROAS
                        ? "Acima da meta"
                        : conta.roas >= META_ROAS * 0.75
                          ? "Perto da meta"
                          : "Abaixo da meta"}
                    </Etiqueta>
                  </Celula>
                </Linha>
              ))}
              {!porConta.contas.length && (
                <Linha>
                  <Celula className="py-10 text-center text-cinza">
                    Nenhuma métrica por conta ainda. Conecte as contas de anúncio em Integrações e
                    rode a primeira sincronização.
                  </Celula>
                </Linha>
              )}
            </tbody>
          </Tabela>
        </section>
      </div>
    </>
  );
}
