import { Kpi } from "@/components/painel/kpi";
import { GraficoArea, LegendaGrafico, type SerieGrafico } from "@/components/painel/grafico-area";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarSerie } from "@/lib/metricas-servidor";
import { comparar, tracado } from "@/lib/metricas";
import { brl, multiplo, numero } from "@/lib/utils";

const SERIES: SerieGrafico[] = [
  { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
  { chave: "receita", rotulo: "Retorno atribuído", cor: "#0f9d76", eixo: "direita" },
];

export default async function PaginaPortal() {
  const metricas = await carregarSerie(60);
  const c = comparar(metricas.serie, 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-tinta">
          Sua conta nos últimos 30 dias
        </h1>
        <p className="mt-1 text-sm text-cinza">
          {metricas.serie.length
            ? "Números vindos direto do Meta Ads, Google Ads e GA4, sincronizados todos os dias."
            : "Assim que a primeira sincronização rodar, os números aparecem aqui."}
        </p>
      </div>

      {metricas.demo && <AvisoDemo />}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Investimento"
          valor={brl(c.atual.investimento)}
          variacao={c.delta("investimento")}
          serie={tracado(c.serie, "investimento")}
        />
        <Kpi
          rotulo="Retorno atribuído"
          valor={brl(c.atual.receita)}
          variacao={c.delta("receita")}
          tom="menta"
          serie={tracado(c.serie, "receita")}
        />
        <Kpi
          rotulo="ROAS"
          valor={multiplo(c.atual.roas)}
          variacao={c.delta("roas")}
          detalhe="cada R$ 1 investido"
        />
        <Kpi
          rotulo="Leads e vendas"
          valor={`${numero(c.atual.leads)} / ${numero(c.atual.compras)}`}
          variacao={c.delta("leads")}
          detalhe={`CPL ${brl(c.atual.cpl)}`}
        />
      </section>

      <section className="cartao rounded-lg p-5">
        <div className="mb-4">
          <h2 className="font-display text-[15px] font-bold text-tinta">Evolução diária</h2>
          <div className="mt-2">
            <LegendaGrafico series={SERIES} />
          </div>
        </div>
        <GraficoArea
          dados={c.serie}
          series={SERIES}
          altura={300}
          vazio="Sem dados sincronizados no período."
        />
      </section>
    </div>
  );
}
