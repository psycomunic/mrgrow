import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Lancamentos } from "./lancamentos";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { GraficoArea } from "@/components/painel/grafico-area";
import { carregarFinanceiro, listarClientesSimples } from "@/lib/financeiro";

export const metadata: Metadata = { title: "Financeiro" };

/* Rótulos de mês, não datas: o eixo do gráfico os mostra como texto.
   Ver a guarda em `formatarData`, que existe por causa disto. */
const FLUXO = ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago"].map((mes, i) => ({
  data: mes,
  receitas: 24000 + i * 3100,
  despesas: 15000 + i * 1200,
}));

export default async function PaginaFinanceiro() {
  const [{ lancamentos, demo }, clientes] = await Promise.all([
    carregarFinanceiro(),
    listarClientesSimples(),
  ]);

  return (
    <>
      <Topo
        titulo="Financeiro"
        descricao="Receitas, despesas, cobranças e fluxo de caixa da agência."
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <Lancamentos lancamentos={lancamentos} clientes={clientes} />

        <section className="cartao-vidro rounded-lg p-5">
          <h2 className="mb-4 font-display text-base font-bold text-white">
            Fluxo de caixa · 6 meses
          </h2>
          <GraficoArea
            dados={FLUXO}
            series={[
              { chave: "receitas", rotulo: "Receitas", cor: "#12b981" },
              { chave: "despesas", rotulo: "Despesas", cor: "#f43f5e" },
            ]}
            altura={260}
          />
        </section>
      </div>
    </>
  );
}
