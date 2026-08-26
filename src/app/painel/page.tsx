import Link from "next/link";
import { ArrowRight, Plug } from "lucide-react";
import { Topo } from "./_componentes/topo";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea, LegendaGrafico, type SerieGrafico } from "@/components/painel/grafico-area";
import { AvisoDemo, AvisoFalha } from "@/components/painel/aviso-demo";
import { Tabela, Cabecalhos, Linha, Celula, CelulaTexto } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { exigirEquipe } from "@/lib/sessao";
import { pode } from "@/lib/papeis";
import { carregarSerie } from "@/lib/metricas-servidor";
import { comparar, tracado } from "@/lib/metricas";
import { carregarCarteira } from "@/lib/clientes";
import { carregarFunil } from "@/lib/crm";
import { carregarFinanceiro } from "@/lib/financeiro";
import { carregarTarefas } from "@/lib/tarefas";
import { PRIORIDADE, STATUS_TAREFA } from "@/lib/rotulos";
import { competencia, hoje } from "@/lib/tempo";
import { brl, dataCurta, divisao, multiplo, numero, percentual } from "@/lib/utils";

const SERIES: SerieGrafico[] = [
  { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
  { chave: "receita", rotulo: "Receita atribuída", cor: "#0f9d76", eixo: "direita" },
];

export default async function PaginaVisao() {
  const sessao = await exigirEquipe();
  const verFinanceiro = pode(sessao.papel, "financeiro");

  /* Tudo em paralelo: são cinco consultas independentes e em série elas
     somariam a latência de todas. */
  const [metricas, carteira, funil, financeiro, quadro] = await Promise.all([
    carregarSerie(60),
    carregarCarteira(),
    carregarFunil(),
    verFinanceiro ? carregarFinanceiro() : Promise.resolve({ lancamentos: [], demo: false }),
    carregarTarefas(),
  ]);

  const demo = metricas.demo || carteira.demo;
  const c = comparar(metricas.serie, 30);

  /* ── Carteira ─────────────────────────────────────────────────── */
  const ativos = carteira.clientes.filter((cl) => cl.status === "ativo");
  const mrr = ativos.reduce((s, cl) => s + cl.fee_mensal, 0);

  /* ── Funil ────────────────────────────────────────────────────── */
  const pipeline = funil.negocios.reduce((s, n) => s + n.valor_mensal + n.valor_unico, 0);
  // Ponderado pela probabilidade da etapa: o que a agência pode de fato esperar.
  const ponderado = funil.negocios.reduce((s, n) => {
    const etapa = funil.etapas.find((e) => e.id === n.etapa_id);
    return s + (n.valor_mensal + n.valor_unico) * ((etapa?.probabilidade ?? 0) / 100);
  }, 0);

  /* ── Caixa ────────────────────────────────────────────────────── */
  const mesAtual = competencia();
  const receitas = financeiro.lancamentos.filter((l) => l.tipo === "receita");
  const aReceber = receitas
    .filter((l) => ["pendente", "previsto"].includes(l.status) && l.vencimento.startsWith(mesAtual))
    .reduce((s, l) => s + l.valor, 0);
  const emAtraso = receitas
    .filter((l) => l.status === "atrasado")
    .reduce((s, l) => s + l.valor, 0);

  /* ── Operação ─────────────────────────────────────────────────── */
  const dia = hoje();
  const abertas = quadro.tarefas
    .filter((t) => t.status !== "concluida")
    .sort((a, b) => (a.vence_em ?? "9999").localeCompare(b.vence_em ?? "9999"))
    .slice(0, 7);

  /* Pior saúde primeiro: a lista existe para mostrar onde agir, não para
     exibir os melhores. */
  const contas = [...carteira.clientes]
    .filter((cl) => cl.status !== "encerrado")
    .sort((a, b) => a.saude - b.saude)
    .slice(0, 7);

  return (
    <>
      <Topo
        titulo="Visão geral"
        descricao="O estado da agência agora — comercial, operação e caixa."
        acao={
          <BotaoLink href="/painel/crm" tamanho="sm">
            Abrir CRM
          </BotaoLink>
        }
      />

      <div className="space-y-5 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        {metricas.falhou && <AvisoFalha o_que="as métricas das contas conectadas" />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Receita recorrente (MRR)"
            valor={brl(mrr)}
            detalhe={
              ativos.length
                ? `${numero(ativos.length)} ativos · ticket ${brl(divisao(mrr, ativos.length))}`
                : "nenhum cliente ativo"
            }
            dica="Soma dos fees mensais dos clientes com status ativo."
          />
          <Kpi
            rotulo="Investimento gerido"
            valor={brl(c.atual.investimento)}
            variacao={c.delta("investimento")}
            detalhe="últimos 30 dias"
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
            rotulo="ROAS médio"
            valor={multiplo(c.atual.roas)}
            variacao={c.delta("roas")}
            detalhe="receita ÷ investimento"
            dica="Consolidado de todas as contas conectadas."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="cartao flex flex-col rounded-lg p-5 lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[15px] font-bold text-tinta">
                  Investimento × receita atribuída
                </h2>
                <p className="mt-0.5 text-xs text-cinza">
                  Consolidado das contas conectadas · últimos 30 dias
                </p>
                <div className="mt-3">
                  <LegendaGrafico series={SERIES} />
                </div>
              </div>
              <Link
                href="/painel/metricas"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-mrg-600 hover:text-mrg-700 foco-anel"
              >
                Detalhar <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <GraficoArea
              dados={c.serie}
              series={SERIES}
              altura={300}
              vazio="Nenhuma métrica sincronizada ainda."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Kpi
              rotulo="Leads no período"
              valor={numero(c.atual.leads)}
              variacao={c.delta("leads")}
              detalhe={`CPL ${brl(c.atual.cpl)}`}
              serie={tracado(c.serie, "leads")}
            />
            <Kpi
              rotulo="Pipeline aberto"
              valor={brl(pipeline)}
              detalhe={
                funil.negocios.length
                  ? `${numero(funil.negocios.length)} negócios · ${brl(ponderado)} ponderado`
                  : "nenhum negócio no funil"
              }
              dica="Primeiro ciclo de cada negócio: recorrente + setup."
            />
            {verFinanceiro ? (
              <>
                <Kpi
                  rotulo="A receber neste mês"
                  valor={brl(aReceber)}
                  tom="menta"
                  detalhe="faturas em aberto e previstas"
                />
                <Kpi
                  rotulo="Em atraso"
                  valor={brl(emAtraso)}
                  tom={emAtraso ? "rosa" : "menta"}
                  detalhe={emAtraso ? "cobrança pendente" : "nada vencido"}
                />
              </>
            ) : (
              <Kpi
                rotulo="Compras atribuídas"
                valor={numero(c.atual.compras)}
                variacao={c.delta("compras")}
                detalhe={`CPA ${brl(c.atual.cpa)}`}
                tom="menta"
              />
            )}
          </div>
        </section>

        {!metricas.serie.length && !demo && !metricas.falhou && (
          <div className="cartao flex flex-col gap-4 rounded-lg p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Plug className="mt-0.5 size-5 shrink-0 text-mrg-600" />
              <div>
                <h2 className="font-display text-base font-bold text-tinta">
                  Nenhuma conta de mídia conectada
                </h2>
                <p className="mt-1 max-w-xl text-sm text-grafite">
                  Investimento, receita, leads e ROAS chegam sozinhos depois que as contas do Meta
                  Ads e do Google Ads são conectadas uma única vez.
                </p>
              </div>
            </div>
            <BotaoLink href="/painel/integracoes" tamanho="sm" className="shrink-0">
              Conectar contas
            </BotaoLink>
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-[15px] font-bold text-tinta">Contas em atenção</h2>
              <Link
                href="/painel/clientes"
                className="text-xs font-semibold text-mrg-600 hover:text-mrg-700 foco-anel"
              >
                Ver carteira
              </Link>
            </div>

            <Tabela>
              <Cabecalhos colunas={["Cliente", "Segmento", "ROAS", "Saúde"]} />
              <tbody>
                {contas.map((cl) => (
                  <Linha key={cl.id}>
                    <CelulaTexto largura="12rem" titulo={cl.nome}>
                      <Link
                        href={`/painel/clientes/${cl.slug}`}
                        className="font-medium text-tinta hover:text-mrg-600 foco-anel"
                      >
                        {cl.nome}
                      </Link>
                    </CelulaTexto>
                    <CelulaTexto largura="10rem" className="text-cinza" titulo={cl.segmento ?? ""}>
                      {cl.segmento ?? "—"}
                    </CelulaTexto>
                    <Celula className="tabular-nums whitespace-nowrap">
                      {cl.roas ? multiplo(cl.roas, 1) : "—"}
                    </Celula>
                    <Celula>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-nevoa-2">
                          <div
                            className={
                              cl.saude >= 80
                                ? "h-full bg-sucesso"
                                : cl.saude >= 60
                                  ? "h-full bg-alerta"
                                  : "h-full bg-perigo"
                            }
                            style={{ width: `${cl.saude}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-cinza">{cl.saude}</span>
                      </div>
                    </Celula>
                  </Linha>
                ))}
                {!contas.length && (
                  <Linha>
                    <Celula className="py-8 text-center text-cinza">
                      Nenhum cliente cadastrado ainda.
                    </Celula>
                  </Linha>
                )}
              </tbody>
            </Tabela>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-[15px] font-bold text-tinta">Próximos prazos</h2>
              <Link
                href="/painel/tarefas"
                className="text-xs font-semibold text-mrg-600 hover:text-mrg-700 foco-anel"
              >
                Ver quadro
              </Link>
            </div>

            <Tabela>
              <Cabecalhos colunas={["Tarefa", "Cliente", "Prazo", "Situação"]} />
              <tbody>
                {abertas.map((t) => {
                  const atrasada = !!t.vence_em && t.vence_em < dia;
                  return (
                    <Linha key={t.id}>
                      <CelulaTexto largura="14rem" titulo={t.titulo} className="text-tinta">
                        {t.titulo}
                      </CelulaTexto>
                      <CelulaTexto largura="8rem" className="text-cinza">
                        {t.cliente ?? "Interno"}
                      </CelulaTexto>
                      <Celula
                        className={[
                          "tabular-nums whitespace-nowrap",
                          atrasada ? "font-semibold text-perigo" : "text-cinza",
                        ].join(" ")}
                      >
                        {t.vence_em ? dataCurta(t.vence_em) : "—"}
                      </Celula>
                      <Celula>
                        <Etiqueta
                          tom={atrasada ? "perigo" : STATUS_TAREFA.tom(t.status)}
                          title={`Prioridade ${PRIORIDADE.rotulo(t.prioridade).toLowerCase()}`}
                        >
                          {atrasada ? "Atrasada" : STATUS_TAREFA.rotulo(t.status)}
                        </Etiqueta>
                      </Celula>
                    </Linha>
                  );
                })}
                {!abertas.length && (
                  <Linha>
                    <Celula className="py-8 text-center text-cinza">
                      Nada em aberto. Bom sinal.
                    </Celula>
                  </Linha>
                )}
              </tbody>
            </Tabela>
          </div>
        </section>

        {/* Taxa de conversão do funil só faz sentido com histórico de negócios
            fechados; enquanto não houver, este rodapé não finge um número. */}
        {funil.negocios.length > 0 && (
          <p className="text-xs text-cinza-claro">
            Funil com {numero(funil.negocios.length)} negócios abertos em {funil.etapas.length}{" "}
            etapas · previsão ponderada de {brl(ponderado)} ({percentual(
              divisao(ponderado, pipeline) * 100,
              0,
            )}{" "}
            do pipeline).
          </p>
        )}
      </div>
    </>
  );
}
