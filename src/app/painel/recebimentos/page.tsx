import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Grade, SeletorMes } from "./grade";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea, LegendaGrafico, type SerieGrafico } from "@/components/painel/grafico-area";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { exigirEquipe } from "@/lib/sessao";
import { pode } from "@/lib/papeis";
import { carregarRecebimentos } from "@/lib/recebimentos";
import { competencia } from "@/lib/tempo";
import { brl, divisao, numero } from "@/lib/utils";

export const metadata: Metadata = { title: "Recebimentos" };

const SERIES: SerieGrafico[] = [
  { chave: "previsto", rotulo: "Previsto", cor: "azul" },
  { chave: "recebido", rotulo: "Recebido", cor: "menta" },
];

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function rotuloMes(comp: string) {
  const [ano, mes] = comp.split("-");
  return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`;
}

export default async function PaginaRecebimentos({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const sessao = await exigirEquipe();
  const p = await searchParams;
  const mes = p.mes && /^\d{4}-\d{2}$/.test(p.mes) ? p.mes : competencia();

  const { linhas, historico, demo } = await carregarRecebimentos(mes);
  const podeEditar = pode(sessao.papel, "financeiro", "editar");

  const previsto = linhas.reduce((s, l) => s + l.valor, 0);
  const recebido = linhas.filter((l) => l.situacao === "pago").reduce((s, l) => s + l.valor, 0);
  const atrasadas = linhas.filter((l) => l.situacao === "atrasado");
  const emAtraso = atrasadas.reduce((s, l) => s + l.valor, 0);

  /* Últimos doze meses: o suficiente para ver sazonalidade sem espremer as
     barras a ponto de não dar para comparar duas. */
  const serie = historico.slice(-12).map((m) => ({
    data: rotuloMes(m.competencia),
    previsto: m.previsto,
    recebido: m.recebido,
  }));

  return (
    <>
      <Topo
        titulo="Recebimentos"
        descricao="Uma linha por cliente. Marque o check quando o dinheiro entrar."
        acao={<SeletorMes competencia={mes} />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Previsto no mês"
            valor={brl(previsto)}
            detalhe={`${numero(linhas.length)} ${linhas.length === 1 ? "cobrança" : "cobranças"}`}
          />
          <Kpi
            rotulo="Recebido"
            valor={brl(recebido)}
            tom="menta"
            detalhe={`${numero(divisao(recebido, previsto) * 100)}% do previsto`}
          />
          <Kpi
            rotulo="A receber"
            valor={brl(previsto - recebido)}
            detalhe={`${numero(linhas.filter((l) => l.situacao !== "pago").length)} em aberto`}
          />
          <Kpi
            rotulo="Em atraso"
            valor={brl(emAtraso)}
            tom={atrasadas.length ? "rosa" : "menta"}
            detalhe={
              atrasadas.length
                ? `${numero(atrasadas.length)} ${atrasadas.length === 1 ? "cobrança vencida" : "cobranças vencidas"}`
                : "nenhuma vencida"
            }
          />
        </section>

        <Grade linhas={linhas} competencia={mes} podeEditar={podeEditar} />

        {serie.length > 1 && (
          <section className="cartao rounded-lg p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-bold text-tinta">
                  Previsto contra recebido
                </h2>
                <p className="mt-0.5 text-xs text-cinza">Últimos doze meses</p>
              </div>
              <LegendaGrafico series={SERIES} />
            </div>
            <GraficoArea dados={serie} series={SERIES} rotuloX={(v) => v} />
          </section>
        )}
      </div>
    </>
  );
}
