import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea, LegendaGrafico } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { carregarRelatorioPorToken, carregarDadosDoRelatorio } from "@/lib/relatorios";
import type { CriativoDestaque, DesempenhoCampanha, Entrega } from "@/lib/relatorios";
import { comparar, tracado, type Comparativo, type Resumo } from "@/lib/metricas";
import {
  blocosEscolhidos,
  janelaDoPeriodo,
  rotuloFormatoCriativo,
} from "@/lib/blocos-relatorio";
import { STATUS_TAREFA } from "@/lib/rotulos";
import { MARCA, linkWhatsApp } from "@/lib/marca";
import { brl, dataCompleta, divisao, multiplo, numero, percentual } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Relatório de performance",
  // Relatório de um cliente: fora do índice de busca.
  robots: { index: false, follow: false },
};

/* Os números vêm da sincronização de mídia e mudam várias vezes ao dia: o
   cliente que reabre o link tem de ver o dado de agora, não o do cache. */
export const dynamic = "force-dynamic";

const CORES = {
  investimento: "#5798ff",
  receita: "#12b981",
  leads: "#1668f5",
  compras: "#f5a524",
} as const;

const SERIES_DINHEIRO = [
  { chave: "investimento", rotulo: "Investimento", cor: CORES.investimento },
  { chave: "receita", rotulo: "Retorno atribuído", cor: CORES.receita },
];

const SERIES_VOLUME = [
  { chave: "leads", rotulo: "Leads", cor: CORES.leads },
  { chave: "compras", rotulo: "Vendas", cor: CORES.compras },
];

const roas = (v: number) => multiplo(v);

/** Blocos que só fazem sentido com série sincronizada no período. */
const DEPENDEM_DE_METRICAS = [
  "resumo_executivo",
  "evolucao_diaria",
  "desempenho_campanhas",
  "leads_cpl",
  "comparativo_periodo",
];

export default async function PaginaRelatorio({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const relatorio = await carregarRelatorioPorToken(token);
  if (!relatorio) notFound();

  const dados = await carregarDadosDoRelatorio(relatorio);
  const { dias, rotulo: cadencia, inicio, fim } = janelaDoPeriodo(relatorio.periodicidade);
  const comparativo = comparar(dados.serie, dias);
  const temMetricas = comparativo.serie.length > 0;

  const blocos = blocosEscolhidos(relatorio.blocos).filter(
    (b) => temMetricas || !DEPENDEM_DE_METRICAS.includes(b.chave),
  );

  const titulo = relatorio.cliente_nome ?? relatorio.nome;

  return (
    <div className="min-h-screen bg-papel">
      <header className="border-b border-borda bg-carta">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center justify-between gap-4">
            <Image
              src="/marca/mr-grow-logo.webp"
              alt={MARCA.nome}
              width={1400}
              height={728}
              priority
              style={{ height: "1.75rem", width: "auto" }}
            />
            <Etiqueta tom="azul">{cadencia}</Etiqueta>
          </div>

          <p className="mt-7 text-[11px] font-bold tracking-[0.16em] text-mrg-600 uppercase">
            Relatório de performance
          </p>
          <h1 className="mt-2 font-display text-[1.75rem] leading-[1.1] font-extrabold tracking-tight text-tinta sm:text-4xl">
            {titulo}
          </h1>
          <p className="mt-3 text-sm text-grafite">
            {dataCompleta(inicio)} a {dataCompleta(fim)} · {dias} dias
          </p>
          {relatorio.cliente_nome && (
            <p className="mt-0.5 text-xs text-cinza">{relatorio.nome}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-9 px-5 py-8 sm:px-8 sm:py-10">
        {!temMetricas && (
          <section className="cartao rounded-lg p-6">
            <h2 className="font-display text-base font-bold text-tinta">
              Ainda sem números neste período
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-grafite">
              As contas de anúncios desta operação não devolveram dados entre{" "}
              {dataCompleta(inicio)} e {dataCompleta(fim)}. Os indicadores aparecem sozinhos na
              próxima sincronização — nada aqui é preenchido à mão.
            </p>
          </section>
        )}

        {blocos.map((bloco, i) => (
          <Secao key={bloco.chave} ordem={i + 1} titulo={bloco.rotulo} apoio={bloco.resumo}>
            {bloco.chave === "resumo_executivo" && <BlocoResumo c={comparativo} />}
            {bloco.chave === "evolucao_diaria" && <Evolucao c={comparativo} />}
            {bloco.chave === "desempenho_campanhas" && (
              <Campanhas campanhas={dados.campanhas} total={comparativo.atual} />
            )}
            {bloco.chave === "criativos_vencedores" && <Criativos criativos={dados.criativos} />}
            {bloco.chave === "leads_cpl" && <Leads c={comparativo} />}
            {bloco.chave === "comparativo_periodo" && <BlocoComparativo c={comparativo} dias={dias} />}
            {bloco.chave === "plano_de_acao" && <Plano entregas={dados.entregas} />}
          </Secao>
        ))}

        {blocos.length === 0 && temMetricas && (
          <p className="cartao rounded-lg p-8 text-center text-sm text-cinza">
            Este relatório ainda não tem blocos escolhidos.
          </p>
        )}
      </main>

      <footer className="border-t border-borda bg-carta">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm font-semibold text-tinta">
              {MARCA.fundador} · {MARCA.nome}
            </p>
            <p className="mt-1 text-xs text-cinza">
              Dúvida em qualquer número deste relatório? Chame que a gente abre a conta com você.
            </p>
          </div>
          <a
            href={linkWhatsApp(`Olá! Estou vendo o relatório de ${titulo} e queria falar sobre ele.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mrg-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-mrg-600 foco-anel"
          >
            <MessageCircle className="size-4" />
            Falar com a MR Grow
          </a>
        </div>
      </footer>
    </div>
  );
}

function Secao({
  ordem,
  titulo,
  apoio,
  children,
}: {
  ordem: number;
  titulo: string;
  apoio: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-display text-xs font-bold tabular-nums text-mrg-600">
          {String(ordem).padStart(2, "0")}
        </span>
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-tinta sm:text-xl">
            {titulo}
          </h2>
          <p className="mt-0.5 text-xs text-cinza">{apoio}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function BlocoResumo({ c }: { c: Comparativo }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        rotulo="Investimento em mídia"
        valor={brl(c.atual.investimento)}
        variacao={c.delta("investimento")}
        serie={tracado(c.serie, "investimento")}
        detalhe="verba paga às plataformas"
      />
      <Kpi
        rotulo="Retorno atribuído"
        valor={brl(c.atual.receita)}
        variacao={c.delta("receita")}
        serie={tracado(c.serie, "receita")}
        tom="menta"
        detalhe="vendas rastreadas no período"
      />
      <Kpi
        rotulo="ROAS"
        valor={roas(c.atual.roas)}
        variacao={c.delta("roas")}
        tom="azul"
        detalhe={`cada R$ 1 devolveu ${brl(c.atual.roas)}`}
      />
      <Kpi
        rotulo="Ticket médio"
        valor={brl(c.atual.ticketMedio)}
        variacao={c.delta("ticketMedio")}
        tom="pessego"
        detalhe={`${numero(c.atual.compras)} vendas`}
      />
    </div>
  );
}

function Evolucao({ c }: { c: Comparativo }) {
  return (
    <div className="cartao rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-grafite">
          Retorno acumulado de{" "}
          <strong className="text-tinta">{brl(c.atual.receita)}</strong> sobre{" "}
          <strong className="text-tinta">{brl(c.atual.investimento)}</strong> investidos.
        </p>
        <LegendaGrafico series={SERIES_DINHEIRO} />
      </div>
      <GraficoArea dados={c.serie} series={SERIES_DINHEIRO} altura={260} />
    </div>
  );
}

function Campanhas({
  campanhas,
  total,
}: {
  campanhas: DesempenhoCampanha[];
  total: Resumo;
}) {
  if (!campanhas.length) {
    return (
      <p className="cartao rounded-lg p-6 text-sm text-grafite">
        Nenhuma campanha com veiculação registrada no período. O consolidado da conta continua nos
        blocos acima.
      </p>
    );
  }

  return (
    <Tabela larguraMinima="38rem">
      <Cabecalhos colunas={["Campanha", "Investimento", "Retorno", "ROAS", "Fatia da verba"]} />
      <tbody>
        {campanhas.map((c) => {
          const retorno = divisao(c.receita, c.investimento);
          return (
            <Linha key={c.id}>
              <Celula className="font-medium text-tinta">{c.nome}</Celula>
              <Celula className="tabular-nums">{brl(c.investimento)}</Celula>
              <Celula className="tabular-nums">{brl(c.receita)}</Celula>
              <Celula>
                <Etiqueta tom={retorno >= 4 ? "sucesso" : retorno >= 2 ? "azul" : "alerta"}>
                  {roas(retorno)}
                </Etiqueta>
              </Celula>
              <Celula className="tabular-nums text-cinza">
                {percentual(divisao(c.investimento, total.investimento) * 100, 0)}
              </Celula>
            </Linha>
          );
        })}
      </tbody>
    </Tabela>
  );
}

function Criativos({ criativos }: { criativos: CriativoDestaque[] }) {
  if (!criativos.length) {
    return (
      <p className="cartao rounded-lg p-6 text-sm text-grafite">
        Os testes deste ciclo ainda estão rodando. O criativo vencedor entra aqui quando bater a
        meta de retorno.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {criativos.map((c) => (
        <li key={c.id} className="cartao flex flex-col gap-2 rounded-lg p-4">
          <Etiqueta tom="sucesso" className="self-start">
            {rotuloFormatoCriativo(c.formato)}
          </Etiqueta>
          <p className="text-sm font-medium text-tinta">{c.nome}</p>
          {c.angulo && <p className="mt-auto text-xs text-cinza">Ângulo: {c.angulo}</p>}
        </li>
      ))}
    </ul>
  );
}

function Leads({ c }: { c: Comparativo }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          rotulo="Leads gerados"
          valor={numero(c.atual.leads)}
          variacao={c.delta("leads")}
          serie={tracado(c.serie, "leads")}
        />
        <Kpi
          rotulo="Custo por lead"
          valor={brl(c.atual.cpl)}
          variacao={c.delta("cpl")}
          invertido
          tom="menta"
        />
        <Kpi
          rotulo="Vendas"
          valor={numero(c.atual.compras)}
          variacao={c.delta("compras")}
          serie={tracado(c.serie, "compras")}
          tom="pessego"
        />
        <Kpi
          rotulo="Custo por venda"
          valor={brl(c.atual.cpa)}
          variacao={c.delta("cpa")}
          invertido
          tom="rosa"
        />
      </div>

      <div className="cartao rounded-lg p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-grafite">
            De cada 100 leads, {numero(divisao(c.atual.compras, c.atual.leads) * 100, 1)} viraram
            venda.
          </p>
          <LegendaGrafico series={SERIES_VOLUME} />
        </div>
        <GraficoArea dados={c.serie} series={SERIES_VOLUME} formatoY="numero" altura={220} />
      </div>
    </div>
  );
}

type LinhaComparativo = {
  chave: keyof Resumo;
  rotulo: string;
  formatar: (v: number) => string;
  /** true quando cair é bom: CPL e custo por venda. */
  invertido?: boolean;
};

const LINHAS_COMPARATIVO: LinhaComparativo[] = [
  { chave: "investimento", rotulo: "Investimento", formatar: brl },
  { chave: "receita", rotulo: "Retorno atribuído", formatar: brl },
  { chave: "roas", rotulo: "ROAS", formatar: roas },
  { chave: "leads", rotulo: "Leads", formatar: (v) => numero(v) },
  { chave: "compras", rotulo: "Vendas", formatar: (v) => numero(v) },
  { chave: "cpl", rotulo: "Custo por lead", formatar: brl, invertido: true },
  { chave: "cpa", rotulo: "Custo por venda", formatar: brl, invertido: true },
  { chave: "ctr", rotulo: "CTR", formatar: (v) => percentual(v, 2) },
];

function BlocoComparativo({ c, dias }: { c: Comparativo; dias: number }) {
  const semBase = !c.anterior.investimento;

  return (
    <>
      <Tabela larguraMinima="34rem">
        <Cabecalhos colunas={["Indicador", `Últimos ${dias} dias`, `${dias} dias anteriores`, "Variação"]} />
        <tbody>
          {LINHAS_COMPARATIVO.map((l) => {
            const variacao = c.delta(l.chave);
            const melhorou =
              variacao === undefined ? null : l.invertido ? variacao < 0 : variacao > 0;
            return (
              <Linha key={l.chave}>
                <Celula className="font-medium text-tinta">{l.rotulo}</Celula>
                <Celula className="tabular-nums text-tinta">{l.formatar(c.atual[l.chave])}</Celula>
                <Celula className="tabular-nums text-cinza">
                  {l.formatar(c.anterior[l.chave])}
                </Celula>
                <Celula
                  className={`tabular-nums ${
                    melhorou === null ? "text-cinza-claro" : melhorou ? "text-sucesso" : "text-perigo"
                  }`}
                >
                  {variacao === undefined
                    ? "—"
                    : `${variacao > 0 ? "+" : ""}${numero(variacao, 1)}%`}
                </Celula>
              </Linha>
            );
          })}
        </tbody>
      </Tabela>

      {semBase && (
        <p className="mt-3 text-xs text-cinza">
          O período anterior não tem veiculação suficiente para comparar todos os indicadores —
          por isso alguns aparecem sem variação.
        </p>
      )}
    </>
  );
}

function Plano({ entregas }: { entregas: Entrega[] }) {
  if (!entregas.length) {
    return (
      <p className="cartao rounded-lg p-6 text-sm text-grafite">
        O próximo ciclo é fechado na reunião de planejamento. Assim que as entregas entrarem na
        fila, elas aparecem aqui.
      </p>
    );
  }

  return (
    <ul className="cartao divide-y divide-borda-fraca rounded-lg">
      {entregas.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5">
          <span className="text-sm text-tinta">{e.titulo}</span>
          <span className="flex items-center gap-3">
            {e.vence_em && (
              <span className="text-xs text-cinza">até {dataCompleta(e.vence_em)}</span>
            )}
            <Etiqueta tom={STATUS_TAREFA.tom(e.status)}>{STATUS_TAREFA.rotulo(e.status)}</Etiqueta>
          </span>
        </li>
      ))}
    </ul>
  );
}
