import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo, AvisoFalha } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { Rosca, type FatiaRosca } from "@/components/painel/rosca";
import { GraficoArea, LegendaGrafico, type SerieGrafico } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula, CelulaTexto } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Avatar } from "@/components/painel/avatares";
import { BotaoSincronizar } from "./botao-sincronizar";
import { FiltroPeriodo } from "@/components/painel/filtro-periodo";
import { exigirPermissao } from "@/lib/sessao";
import { listarClientesParaSelecao } from "@/lib/clientes";
import { carregarDiagnostico, diasNoIntervalo } from "@/lib/diagnostico";
import { rotuloPlataforma, PLATAFORMAS } from "@/lib/plataformas";
import { tracado } from "@/lib/metricas";
import { brl, cn, compacto, divisao, multiplo, numero, percentual } from "@/lib/utils";
import { hoje } from "@/lib/tempo";

export const metadata: Metadata = { title: "Métricas" };

const DINHEIRO: SerieGrafico[] = [
  { chave: "investimento", rotulo: "Investimento", cor: "azul" },
  { chave: "receita", rotulo: "Receita", cor: "menta", eixo: "direita" },
];

const VOLUME: SerieGrafico[] = [
  { chave: "leads", rotulo: "Leads", cor: "ciano" },
  { chave: "compras", rotulo: "Compras", cor: "laranja" },
];

const TONS = [
  "var(--color-grafico-1)",
  "var(--color-grafico-2)",
  "var(--color-grafico-4)",
  "var(--color-grafico-3)",
  "var(--color-grafico-5)",
  "var(--color-grafico-6)",
];

/** Meta de ROAS da agência. Abaixo disso a conta entra na fila de revisão. */
const META_ROAS = 3.5;

function tomDoRoas(roas: number) {
  if (roas >= META_ROAS) return "sucesso" as const;
  if (roas >= META_ROAS * 0.75) return "alerta" as const;
  return "perigo" as const;
}

/** `YYYY-MM-DD` válido, senão o recorte cai no padrão. */
function data(v: string | undefined, padrao: string) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : padrao;
}

function recuar(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - (dias - 1));
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default async function PaginaMetricas({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; cliente?: string; plataforma?: string }>;
}) {
  await exigirPermissao("metricas");

  const p = await searchParams;
  const de = data(p.de, recuar(30));
  const ate = data(p.ate, hoje());
  const clienteId = p.cliente || null;
  const provedor = PLATAFORMAS.some((x) => x.v === p.plataforma) ? p.plataforma! : null;

  const [d, clientes] = await Promise.all([
    carregarDiagnostico({ de, ate, clienteId, provedor }),
    listarClientesParaSelecao(),
  ]);

  const dias = diasNoIntervalo(de, ate);
  const t = d.totais;
  const a = d.anterior;

  /* Variação percentual contra o período anterior de igual tamanho.
     `undefined` quando não há base — é o que evita o "+100%" sem sentido. */
  const delta = (chave: keyof typeof t) => {
    const base = a[chave];
    if (!base) return undefined;
    return ((t[chave] - base) / base) * 100;
  };

  const clienteEscolhido = clientes.find((c) => c.id === clienteId) ?? null;
  const lucro = t.receita - t.investimento;

  /* Funil de mídia. Leads e compras pendem os dois do clique, e não um do
     outro: a série mistura conta de e-commerce, que vende sem passar por
     formulário, com conta de geração de lead, que não vende no site. Medir
     compra como percentual de lead dava 114% de conversão — número que não
     existe. Por isso os dois últimos degraus se comparam com os cliques. */
  const funil = [
    { rotulo: "Impressões", valor: t.impressoes, taxa: null as number | null, base: "" },
    {
      rotulo: "Cliques",
      valor: t.cliques,
      taxa: divisao(t.cliques, t.impressoes) * 100,
      base: "das impressões",
    },
    {
      rotulo: "Leads",
      valor: t.leads,
      taxa: divisao(t.leads, t.cliques) * 100,
      base: "dos cliques",
    },
    {
      rotulo: "Compras",
      valor: t.compras,
      taxa: divisao(t.compras, t.cliques) * 100,
      base: "dos cliques",
    },
  ];


  const fatias: FatiaRosca[] = d.porPlataforma.map((x, i) => ({
    rotulo: rotuloPlataforma(x.provedor),
    valor: x.investimento,
    cor: TONS[i % TONS.length],
    formatado: brl(x.investimento),
  }));

  return (
    <>
      <Topo
        titulo="Métricas"
        descricao="Diagnóstico de mídia por período, cliente e plataforma."
        acao={<BotaoSincronizar />}
      />

      <div className="space-y-5 p-5 sm:p-8">
        {d.demo && <AvisoDemo />}
        {d.falhou && <AvisoFalha o_que="as métricas sincronizadas" />}

        <FiltroPeriodo
          caminho="/painel/metricas"
          clientes={clientes}
          de={de}
          ate={ate}
          clienteId={clienteId}
          provedor={provedor}
          comPlataforma
        />

        <p className="text-[13px] text-cinza">
          {clienteEscolhido ? (
            <strong className="font-semibold text-tinta">{clienteEscolhido.nome}</strong>
          ) : (
            <strong className="font-semibold text-tinta">Todos os clientes</strong>
          )}
          {provedor && <> · {rotuloPlataforma(provedor)}</>} · {numero(dias)}{" "}
          {dias === 1 ? "dia" : "dias"}, comparado com os {numero(dias)} anteriores.
        </p>

        {/* ── Resultado ─────────────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Investimento"
            valor={brl(t.investimento)}
            variacao={delta("investimento")}
            detalhe={`${brl(divisao(t.investimento, dias))} por dia`}
            serie={tracado(d.serie, "investimento")}
          />
          <Kpi
            rotulo="Receita atribuída"
            valor={brl(t.receita)}
            variacao={delta("receita")}
            tom="menta"
            serie={tracado(d.serie, "receita")}
          />
          <Kpi
            rotulo="ROAS"
            valor={multiplo(t.roas)}
            variacao={delta("roas")}
            tom={t.roas >= META_ROAS ? "menta" : "rosa"}
            detalhe={`meta ${multiplo(META_ROAS, 1)}`}
            dica="Receita atribuída dividida pelo investimento em mídia."
          />
          <Kpi
            rotulo="Retorno líquido"
            valor={brl(lucro)}
            tom={lucro >= 0 ? "menta" : "rosa"}
            detalhe="receita menos mídia"
            dica="Não desconta o fee da agência nem custos de produção."
          />
        </section>

        {/* ── Volume e eficiência ───────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Leads"
            valor={numero(t.leads)}
            variacao={delta("leads")}
            serie={tracado(d.serie, "leads")}
          />
          <Kpi
            rotulo="Custo por lead"
            valor={brl(t.cpl)}
            variacao={delta("cpl")}
            invertido
            tom="pessego"
            detalhe="menor é melhor"
          />
          <Kpi
            rotulo="Compras"
            valor={numero(t.compras)}
            variacao={delta("compras")}
            tom="menta"
            detalhe={`ticket ${brl(t.ticketMedio)}`}
            serie={tracado(d.serie, "compras")}
          />
          <Kpi
            rotulo="Custo por venda"
            valor={brl(t.cpa)}
            variacao={delta("cpa")}
            invertido
            tom="pessego"
            detalhe="menor é melhor"
          />
        </section>

        {/* ── Alcance ───────────────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Impressões" valor={compacto(t.impressoes)} variacao={delta("impressoes")} />
          <Kpi rotulo="Cliques" valor={compacto(t.cliques)} variacao={delta("cliques")} />
          <Kpi rotulo="CTR" valor={percentual(t.ctr, 2)} variacao={delta("ctr")} />
          <Kpi
            rotulo="Custo por clique"
            valor={brl(t.cpc)}
            variacao={delta("cpc")}
            invertido
            tom="pessego"
          />
        </section>

        {/* ── Evolução ──────────────────────────────────────────── */}
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
            <GraficoArea
              dados={d.serie}
              series={DINHEIRO}
              altura={260}
              vazio="Nenhuma métrica no período."
            />
          </div>

          <div className="cartao rounded-lg p-5">
            <div className="mb-4">
              <h2 className="font-display text-[15px] font-bold text-tinta">Leads e compras</h2>
              <div className="mt-2">
                <LegendaGrafico series={VOLUME} />
              </div>
            </div>
            <GraficoArea
              dados={d.serie}
              series={VOLUME}
              formatoY="numero"
              altura={260}
              vazio="Nenhuma métrica no período."
            />
          </div>
        </section>

        {/* ── Onde o dinheiro está e onde ele trava ─────────────── */}
        <section className="grid gap-4 xl:grid-cols-12">
          <div className="cartao rounded-lg p-5 xl:col-span-5">
            <h2 className="font-display mb-4 text-[15px] font-bold text-tinta">
              Investimento por plataforma
            </h2>
            <Rosca
              fatias={fatias}
              centro={brl(t.investimento)}
              rotuloCentro="no período"
              vazio="Nenhuma plataforma com investimento."
            />
          </div>

          <div className="cartao rounded-lg p-5 xl:col-span-7">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[15px] font-bold text-tinta">Funil de mídia</h2>
              <span className="text-xs text-cinza-claro">taxa de passagem entre os degraus</span>
            </div>

            <ul className="mt-4 space-y-3">
              {funil.map((f, i) => {
                /* A barra é proporcional ao topo do funil, e não ao degrau
                   anterior: é o que deixa a queda visível de relance. */
                const largura = divisao(f.valor, funil[0].valor) * 100;
                return (
                  <li key={f.rotulo}>
                    <div className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="text-grafite">{f.rotulo}</span>
                      <span className="flex items-baseline gap-2">
                        {f.taxa !== null && (
                          <span className="text-[11px] tabular-nums text-cinza-claro">
                            {percentual(f.taxa, f.taxa < 10 ? 2 : 1)} {f.base}
                          </span>
                        )}
                        <strong className="font-display font-bold tabular-nums text-tinta">
                          {compacto(f.valor)}
                        </strong>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-nevoa-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(largura, f.valor > 0 ? 1.5 : 0)}%`,
                          background: TONS[i % TONS.length],
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── Plataformas em detalhe ────────────────────────────── */}
        <section>
          <h2 className="font-display mb-3 text-[15px] font-bold text-tinta">
            Desempenho por plataforma
          </h2>
          <Tabela larguraMinima="48rem">
            <Cabecalhos
              colunas={["Plataforma", "Investimento", "Receita", "Leads", "CPL", "ROAS"]}
            />
            <tbody>
              {d.porPlataforma.map((x) => (
                <Linha key={x.provedor}>
                  <CelulaTexto largura="12rem" className="font-medium text-tinta">
                    {rotuloPlataforma(x.provedor)}
                  </CelulaTexto>
                  <Celula className="tabular-nums whitespace-nowrap">{brl(x.investimento)}</Celula>
                  <Celula className="tabular-nums whitespace-nowrap">{brl(x.receita)}</Celula>
                  <Celula className="tabular-nums">{numero(x.leads)}</Celula>
                  <Celula className="tabular-nums whitespace-nowrap">{brl(x.cpl)}</Celula>
                  <Celula>
                    <Etiqueta tom={tomDoRoas(x.roas)}>{multiplo(x.roas)}</Etiqueta>
                  </Celula>
                </Linha>
              ))}
              {!d.porPlataforma.length && (
                <Linha>
                  <Celula className="py-10 text-center text-cinza">
                    Nenhuma plataforma com dados no período.
                  </Celula>
                </Linha>
              )}
            </tbody>
          </Tabela>
        </section>

        {/* ── Ranking de contas ─────────────────────────────────── */}
        {!clienteId && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-[15px] font-bold text-tinta">
                Desempenho por cliente
              </h2>
              <span className="text-xs text-cinza-claro">
                {d.porCliente.length
                  ? `${numero(d.porCliente.length)} contas · ${brl(t.investimento)} de mídia`
                  : ""}
              </span>
            </div>

            <Tabela larguraMinima="58rem">
              <Cabecalhos
                colunas={["Cliente", "Investimento", "Receita", "Leads", "CPL", "ROAS", "Situação"]}
              />
              <tbody>
                {d.porCliente.map((c) => (
                  <Linha key={c.id}>
                    <CelulaTexto largura="16rem" titulo={c.nome}>
                      <span className="flex items-center gap-2.5">
                        <Avatar nome={c.nome} medida="sm" />
                        <span className="truncate font-medium text-tinta">{c.nome}</span>
                      </span>
                    </CelulaTexto>
                    <Celula className="tabular-nums whitespace-nowrap">
                      {brl(c.investimento)}
                    </Celula>
                    <Celula className="tabular-nums whitespace-nowrap">{brl(c.receita)}</Celula>
                    <Celula className="tabular-nums">{numero(c.leads)}</Celula>
                    <Celula className="tabular-nums whitespace-nowrap">{brl(c.cpl)}</Celula>
                    <Celula
                      className={cn(
                        "font-semibold tabular-nums whitespace-nowrap",
                        c.roas >= META_ROAS ? "text-sucesso" : "text-tinta",
                      )}
                    >
                      {multiplo(c.roas)}
                    </Celula>
                    <Celula>
                      <Etiqueta tom={tomDoRoas(c.roas)}>
                        {c.roas >= META_ROAS
                          ? "Acima da meta"
                          : c.roas >= META_ROAS * 0.75
                            ? "Perto da meta"
                            : "Abaixo da meta"}
                      </Etiqueta>
                    </Celula>
                  </Linha>
                ))}
                {!d.porCliente.length && (
                  <Linha>
                    <Celula className="py-10 text-center text-cinza">
                      Nenhuma métrica por cliente no período. Conecte as contas em Integrações e
                      rode a primeira sincronização.
                    </Celula>
                  </Linha>
                )}
              </tbody>
            </Tabela>
          </section>
        )}

        {/* ── Campanhas ─────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[15px] font-bold text-tinta">
              Campanhas que mais consomem
            </h2>
            <span className="text-xs text-cinza-claro">ordenadas por investimento</span>
          </div>

          <Tabela larguraMinima="56rem">
            <Cabecalhos
              colunas={["Campanha", "Plataforma", "Investimento", "Receita", "Compras", "ROAS"]}
            />
            <tbody>
              {d.porCampanha.slice(0, 12).map((c) => (
                <Linha key={c.id}>
                  <CelulaTexto largura="20rem" className="font-medium text-tinta" titulo={c.nome}>
                    {c.nome}
                    {c.cliente && (
                      <span className="block truncate text-[11px] font-normal text-cinza">
                        {c.cliente}
                      </span>
                    )}
                  </CelulaTexto>
                  <CelulaTexto largura="9rem" className="text-cinza">
                    {rotuloPlataforma(c.provedor)}
                  </CelulaTexto>
                  <Celula className="tabular-nums whitespace-nowrap">{brl(c.investimento)}</Celula>
                  <Celula className="tabular-nums whitespace-nowrap">{brl(c.receita)}</Celula>
                  <Celula className="tabular-nums">{numero(c.compras)}</Celula>
                  <Celula>
                    <Etiqueta tom={tomDoRoas(c.roas)}>{multiplo(c.roas)}</Etiqueta>
                  </Celula>
                </Linha>
              ))}
              {!d.porCampanha.length && (
                <Linha>
                  <Celula className="py-10 text-center text-cinza">
                    Nenhuma campanha com dados no período.
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
