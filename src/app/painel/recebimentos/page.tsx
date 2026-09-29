import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Grade, Recorte, SeletorMes } from "./grade";
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
  searchParams: Promise<{ mes?: string; situacao?: string }>;
}) {
  const sessao = await exigirEquipe();
  const p = await searchParams;
  const mes = p.mes && /^\d{4}-\d{2}$/.test(p.mes) ? p.mes : competencia();

  const { linhas: todas, resumo, historico, demo } = await carregarRecebimentos(mes);

  /* O recorte vem da visão geral: clicar em "em atraso" lá tem de abrir a
     lista já filtrada aqui, senão a pessoa chega numa tela cheia e precisa
     procurar de novo o que acabou de clicar. */
  const recorte = ["pago", "previsto", "atrasado"].includes(p.situacao ?? "")
    ? (p.situacao as "pago" | "previsto" | "atrasado")
    : null;
  const linhas = recorte ? todas.filter((l) => l.situacao === recorte) : todas;
  const podeEditar = pode(sessao.papel, "financeiro", "editar");

  /* Os quatro números vêm do resumo, a mesma função que alimenta a visão
     geral e o financeiro, e somam o mês inteiro mesmo com recorte ativo:
     se encolhessem junto, "em atraso" diria 100% do previsto — verdade
     dentro do filtro, mentira sobre o mês. */
  const atrasadas = todas.filter((l) => l.situacao === "atrasado");

  /* Últimos doze meses: o suficiente para ver sazonalidade sem espremer as
     barras a ponto de não dar para comparar duas. */
  const emAberto = todas.filter((l) => l.situacao !== "pago").length;

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
            dica="Soma das mensalidades que vencem neste mês, geradas a partir do contrato de cada cliente."
            valor={brl(resumo.previsto)}
            detalhe={`${numero(resumo.cobrancas)} ${resumo.cobrancas === 1 ? "cobrança" : "cobranças"}`}
          />
          <Kpi
            rotulo="Recebido"
            dica="Quanto já foi confirmado com o check. Enquanto ninguém marca, a cobrança continua contando como em aberto."
            valor={brl(resumo.recebido)}
            tom="menta"
            detalhe={`${numero(divisao(resumo.recebido, resumo.previsto) * 100)}% do previsto`}
          />
          <Kpi
            rotulo="A receber"
            dica="O que falta entrar até o fim do mês, incluindo o que já venceu."
            valor={brl(resumo.aReceber)}
            detalhe={`${numero(todas.length - (todas.length - emAberto))} em aberto`}
          />
          <Kpi
            rotulo="Em atraso"
            dica="Cobranças cujo vencimento já passou e ninguém marcou como paga. É aqui que a inadimplência aparece antes de virar problema."
            valor={brl(resumo.atrasado)}
            tom={resumo.qtdAtrasada ? "rosa" : "menta"}
            detalhe={
              resumo.qtdAtrasada
                ? `${numero(resumo.qtdAtrasada)} ${resumo.qtdAtrasada === 1 ? "cobrança vencida" : "cobranças vencidas"}`
                : "nenhuma vencida"
            }
          />
        </section>

        <Recorte atual={recorte} mes={mes} contagens={{
          todas: todas.length,
          pago: todas.length - emAberto,
          previsto: todas.filter((l) => l.situacao === "previsto").length,
          atrasado: atrasadas.length,
        }} />

        <Grade linhas={linhas} podeEditar={podeEditar} />

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
            <GraficoArea dados={serie} series={SERIES} formatoX="texto" />
          </section>
        )}
      </div>
    </>
  );
}
