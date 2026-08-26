import { Kpi } from "@/components/painel/kpi";
import { GraficoArea } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { DEMO_SERIE, DEMO_TAREFAS } from "@/lib/demo";
import { brl, numero, divisao, dataCompleta } from "@/lib/utils";

export default function PaginaPortal() {
  const investimento = DEMO_SERIE.reduce((s, d) => s + d.investimento, 0);
  const receita = DEMO_SERIE.reduce((s, d) => s + d.receita, 0);
  const leads = DEMO_SERIE.reduce((s, d) => s + d.leads, 0);
  const compras = DEMO_SERIE.reduce((s, d) => s + d.compras, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-tinta">Sua conta nos últimos 30 dias</h1>
        <p className="mt-1 text-sm text-cinza">
          Dados sincronizados direto do Meta Ads, Google Ads e GA4 — atualizados várias vezes ao dia.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi rotulo="Investimento" valor={brl(investimento)} variacao={14.2} />
        <Kpi rotulo="Retorno atribuído" valor={brl(receita)} variacao={31.7} />
        <Kpi rotulo="ROAS" valor={`${divisao(receita, investimento).toFixed(2)}x`} variacao={8.9} />
        <Kpi rotulo="Leads / vendas" valor={`${numero(leads)} / ${numero(compras)}`} variacao={22.8} />
      </section>

      <section className="cartao rounded-lg p-5">
        <h2 className="mb-4 font-display text-base font-bold text-tinta">Evolução diária</h2>
        <GraficoArea
          dados={DEMO_SERIE}
          series={[
            { chave: "investimento", rotulo: "Investimento", cor: "#5798ff" },
            { chave: "receita", rotulo: "Retorno", cor: "#12b981" },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-base font-bold text-tinta">O que a MR Grow está fazendo agora</h2>
        <Tabela>
          <Cabecalhos colunas={["Entrega", "Prazo", "Status"]} />
          <tbody>
            {DEMO_TAREFAS.slice(0, 5).map((t) => (
              <Linha key={t.id}>
                <Celula className="text-tinta">{t.titulo}</Celula>
                <Celula className="text-cinza">{dataCompleta(t.vence_em)}</Celula>
                <Celula><Etiqueta tom={t.status === "concluida" ? "sucesso" : "azul"}>{t.status}</Etiqueta></Celula>
              </Linha>
            ))}
          </tbody>
        </Tabela>
      </section>
    </div>
  );
}
