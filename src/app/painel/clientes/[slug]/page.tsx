import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Topo } from "../../_componentes/topo";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea, LegendaGrafico, type SerieGrafico } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula, CelulaTexto } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { exigirPermissao } from "@/lib/sessao";
import { pode } from "@/lib/papeis";
import { carregarCarteira } from "@/lib/clientes";
import { carregarSerieDoCliente } from "@/lib/metricas-servidor";
import { comparar, tracado } from "@/lib/metricas";
import { carregarTarefas } from "@/lib/tarefas";
import { carregarProjetos } from "@/lib/projetos";
import { carregarFinanceiro } from "@/lib/financeiro";
import { STATUS_CLIENTE, STATUS_LANCAMENTO, STATUS_PROJETO, STATUS_TAREFA } from "@/lib/rotulos";
import { hoje } from "@/lib/tempo";
import { brl, dataCompleta, multiplo, numero } from "@/lib/utils";

const SERIES: SerieGrafico[] = [
  { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
  { chave: "receita", rotulo: "Receita atribuída", cor: "#0f9d76", eixo: "direita" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { clientes } = await carregarCarteira();
  const cliente = clientes.find((c) => c.slug === slug);
  return { title: cliente?.nome ?? "Cliente" };
}

export default async function PaginaCliente({ params }: { params: Promise<{ slug: string }> }) {
  const sessao = await exigirPermissao("clientes");
  const { slug } = await params;

  const { clientes, demo } = await carregarCarteira();
  const cliente = clientes.find((c) => c.slug === slug);
  if (!cliente) notFound();

  const verFinanceiro = pode(sessao.papel, "financeiro");

  /* Tudo filtrado pelo cliente. A versão anterior mostrava a série da agência
     inteira, as quatro primeiras tarefas de qualquer cliente e as quatro
     primeiras receitas da carteira toda — na página de um cliente só. */
  const [metricas, quadro, portfolio, financeiro] = await Promise.all([
    carregarSerieDoCliente(cliente.id, 60),
    carregarTarefas(),
    carregarProjetos(),
    verFinanceiro ? carregarFinanceiro() : Promise.resolve({ lancamentos: [], demo: false }),
  ]);

  const c = comparar(metricas.serie, 30);
  const dia = hoje();

  const doCliente = <T extends { cliente_id: string | null; cliente: string | null }>(itens: T[]) =>
    itens.filter((i) => (i.cliente_id ? i.cliente_id === cliente.id : i.cliente === cliente.nome));

  const tarefas = doCliente(quadro.tarefas)
    .filter((t) => t.status !== "concluida")
    .sort((a, b) => (a.vence_em ?? "9999").localeCompare(b.vence_em ?? "9999"));
  const projetos = doCliente(portfolio.projetos.map((p) => ({ ...p, cliente: p.cliente })));
  const faturas = doCliente(financeiro.lancamentos)
    .filter((l) => l.tipo === "receita")
    .sort((a, b) => b.vencimento.localeCompare(a.vencimento))
    .slice(0, 6);

  return (
    <>
      <Topo
        titulo={cliente.nome}
        descricao={`${cliente.segmento ?? "Sem segmento"} · fee ${brl(cliente.fee_mensal)}/mês · saúde ${numero(cliente.saude)}/100`}
        acao={
          <>
            <BotaoLink href="/painel/relatorios" variante="contorno" tamanho="sm">
              Relatórios
            </BotaoLink>
            <BotaoLink href="/painel/integracoes" tamanho="sm">
              Contas conectadas
            </BotaoLink>
          </>
        }
      />

      <div className="space-y-5 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <div className="flex flex-wrap items-center gap-2">
          <Etiqueta tom={STATUS_CLIENTE.tom(cliente.status)}>
            {STATUS_CLIENTE.rotulo(cliente.status)}
          </Etiqueta>
          {cliente.responsavel && (
            <span className="text-xs text-cinza">Responsável: {cliente.responsavel}</span>
          )}
          {cliente.fim_contrato && (
            <span className="text-xs text-cinza">
              Contrato até {dataCompleta(cliente.fim_contrato)}
            </span>
          )}
          {cliente.nps !== null && (
            <span className="text-xs text-cinza">NPS {numero(cliente.nps)}</span>
          )}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Investimento · 30 dias"
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
            detalhe="receita ÷ investimento"
          />
          <Kpi
            rotulo="Leads gerados"
            valor={numero(c.atual.leads)}
            variacao={c.delta("leads")}
            detalhe={`CPL ${brl(c.atual.cpl)}`}
            serie={tracado(c.serie, "leads")}
          />
        </section>

        <section className="cartao rounded-lg p-5">
          <div className="mb-4">
            <h2 className="font-display text-[15px] font-bold text-tinta">Desempenho diário</h2>
            <div className="mt-2">
              <LegendaGrafico series={SERIES} />
            </div>
          </div>
          <GraficoArea
            dados={c.serie}
            series={SERIES}
            altura={280}
            vazio="Nenhuma métrica sincronizada para esta conta."
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-[15px] font-bold text-tinta">
              Entregas em andamento
            </h2>
            {projetos.length ? (
              <div className="space-y-3">
                {projetos.map((p) => (
                  <div key={p.id} className="cartao rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-tinta">{p.nome}</h3>
                      <Etiqueta tom={STATUS_PROJETO.tom(p.status)}>
                        {STATUS_PROJETO.rotulo(p.status)}
                      </Etiqueta>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-nevoa-2">
                        <div
                          className="h-full bg-gradient-to-r from-mrg-600 to-mrg-400"
                          style={{ width: `${p.progresso}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-cinza">{p.progresso}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cartao rounded-lg p-6 text-center text-sm text-cinza">
                Nenhum projeto aberto para esta conta.
              </div>
            )}

            <h2 className="mt-5 mb-3 font-display text-[15px] font-bold text-tinta">
              Tarefas em aberto
            </h2>
            <Tabela>
              <Cabecalhos colunas={["Tarefa", "Prazo", "Situação"]} />
              <tbody>
                {tarefas.slice(0, 6).map((t) => {
                  const atrasada = !!t.vence_em && t.vence_em < dia;
                  return (
                    <Linha key={t.id}>
                      <CelulaTexto largura="16rem" className="text-tinta" titulo={t.titulo}>
                        {t.titulo}
                      </CelulaTexto>
                      <Celula
                        className={[
                          "tabular-nums whitespace-nowrap",
                          atrasada ? "font-semibold text-perigo" : "text-cinza",
                        ].join(" ")}
                      >
                        {t.vence_em ? dataCompleta(t.vence_em) : "—"}
                      </Celula>
                      <Celula>
                        <Etiqueta tom={atrasada ? "perigo" : STATUS_TAREFA.tom(t.status)}>
                          {atrasada ? "Atrasada" : STATUS_TAREFA.rotulo(t.status)}
                        </Etiqueta>
                      </Celula>
                    </Linha>
                  );
                })}
                {!tarefas.length && (
                  <Linha>
                    <Celula className="py-8 text-center text-cinza">
                      Nada em aberto para esta conta.
                    </Celula>
                  </Linha>
                )}
              </tbody>
            </Tabela>
          </div>

          {verFinanceiro && (
            <div>
              <h2 className="mb-3 font-display text-[15px] font-bold text-tinta">
                Faturamento do cliente
              </h2>
              <Tabela>
                <Cabecalhos colunas={["Descrição", "Vencimento", "Valor", "Situação"]} />
                <tbody>
                  {faturas.map((l) => {
                    const atrasada =
                      l.status === "atrasado" || (l.status === "pendente" && l.vencimento < dia);
                    return (
                      <Linha key={l.id}>
                        <CelulaTexto largura="14rem" className="text-tinta" titulo={l.descricao}>
                          {l.descricao}
                        </CelulaTexto>
                        <Celula className="tabular-nums whitespace-nowrap text-cinza">
                          {dataCompleta(l.vencimento)}
                        </Celula>
                        <Celula className="font-medium tabular-nums whitespace-nowrap text-tinta">
                          {brl(l.valor)}
                        </Celula>
                        <Celula>
                          <Etiqueta tom={atrasada ? "perigo" : STATUS_LANCAMENTO.tom(l.status)}>
                            {atrasada ? "Vencida" : STATUS_LANCAMENTO.rotulo(l.status)}
                          </Etiqueta>
                        </Celula>
                      </Linha>
                    );
                  })}
                  {!faturas.length && (
                    <Linha>
                      <Celula className="py-8 text-center text-cinza">
                        Nenhuma fatura lançada para esta conta.
                      </Celula>
                    </Linha>
                  )}
                </tbody>
              </Tabela>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
