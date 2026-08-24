import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_LANCAMENTOS } from "@/lib/demo";
import { brl, dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Financeiro" };

const TOM: Record<string, "sucesso" | "alerta" | "perigo" | "neutro"> = {
  pago: "sucesso", pendente: "alerta", atrasado: "perigo", previsto: "neutro", cancelado: "neutro",
};

const FLUXO = ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago"].map((mes, i) => ({
  data: mes,
  receitas: 24000 + i * 3100,
  despesas: 15000 + i * 1200,
}));

export default function PaginaFinanceiro() {
  const demo = !supabaseConfigurado();
  const receitas = DEMO_LANCAMENTOS.filter((l) => l.tipo === "receita");
  const despesas = DEMO_LANCAMENTOS.filter((l) => l.tipo === "despesa");
  const totalReceita = receitas.reduce((s, l) => s + l.valor, 0);
  const totalDespesa = despesas.reduce((s, l) => s + l.valor, 0);
  const atrasado = receitas.filter((l) => l.status === "atrasado").reduce((s, l) => s + l.valor, 0);

  return (
    <>
      <Topo
        titulo="Financeiro"
        descricao="Receitas, despesas, cobranças e fluxo de caixa da agência."
        acao={<BotaoLink href="/painel/financeiro/novo" tamanho="sm">Novo lançamento</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Receita do mês" valor={brl(totalReceita)} variacao={14.9} />
          <Kpi rotulo="Despesas do mês" valor={brl(totalDespesa)} variacao={4.2} invertido />
          <Kpi rotulo="Resultado" valor={brl(totalReceita - totalDespesa)} variacao={22.6} />
          <Kpi rotulo="Em atraso" valor={brl(atrasado)} variacao={-18} invertido detalhe="a receber" />
        </section>

        <section className="cartao-vidro rounded-lg p-5">
          <h2 className="mb-4 font-display text-base font-bold text-white">Fluxo de caixa · 6 meses</h2>
          <GraficoArea
            dados={FLUXO}
            series={[
              { chave: "receitas", rotulo: "Receitas", cor: "#12b981" },
              { chave: "despesas", rotulo: "Despesas", cor: "#f43f5e" },
            ]}
            altura={260}
          />
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-white">Lançamentos do mês</h2>
          <Tabela>
            <Cabecalhos colunas={["Descrição", "Cliente", "Tipo", "Vencimento", "Valor", "Status"]} />
            <tbody>
              {DEMO_LANCAMENTOS.map((l) => (
                <Linha key={l.id}>
                  <Celula className="text-white">{l.descricao}</Celula>
                  <Celula className="text-ink-400">{l.cliente ?? "—"}</Celula>
                  <Celula>
                    <Etiqueta tom={l.tipo === "receita" ? "sucesso" : "neutro"}>{l.tipo}</Etiqueta>
                  </Celula>
                  <Celula className="text-ink-400">{dataCompleta(l.vencimento)}</Celula>
                  <Celula className="font-semibold text-white">{brl(l.valor)}</Celula>
                  <Celula><Etiqueta tom={TOM[l.status]}>{l.status}</Etiqueta></Celula>
                </Linha>
              ))}
            </tbody>
          </Tabela>
        </section>
      </div>
    </>
  );
}
