import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Kanban } from "./kanban";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_ETAPAS, DEMO_NEGOCIOS } from "@/lib/demo";
import { brl, numero } from "@/lib/utils";

export const metadata: Metadata = { title: "CRM" };

export default function PaginaCrm() {
  const demo = !supabaseConfigurado();
  const total = DEMO_NEGOCIOS.reduce((s, n) => s + n.valor_mensal, 0);
  const quentes = DEMO_NEGOCIOS.filter((n) => n.temperatura === "quente").length;

  return (
    <>
      <Topo
        titulo="CRM"
        descricao="Funil comercial da agência — do lead ao contrato assinado."
        acao={<BotaoLink href="/painel/crm/novo" tamanho="sm">Novo negócio</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Negócios abertos" valor={numero(DEMO_NEGOCIOS.length)} detalhe="no funil comercial" />
          <Kpi rotulo="Valor do pipeline" valor={brl(total)} detalhe="recorrente mensal" />
          <Kpi rotulo="Oportunidades quentes" valor={numero(quentes)} detalhe="prioridade de contato" />
          <Kpi rotulo="Ciclo médio de venda" valor="14 dias" variacao={-9.4} invertido detalhe="lead → assinatura" />
        </section>

        <Kanban etapas={DEMO_ETAPAS} negocios={DEMO_NEGOCIOS} />
      </div>
    </>
  );
}
