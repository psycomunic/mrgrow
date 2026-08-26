import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Lancamentos } from "./lancamentos";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarFinanceiro, listarClientesSimples } from "@/lib/financeiro";

export const metadata: Metadata = { title: "Financeiro" };

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
      </div>
    </>
  );
}
