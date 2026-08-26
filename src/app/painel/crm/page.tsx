import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Kanban } from "./kanban";
import { CrmProvider } from "./contexto";
import { AcaoNovoNegocio, Indicadores } from "./indicadores";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarFunil } from "@/lib/crm";

export const metadata: Metadata = { title: "CRM" };

export default async function PaginaCrm() {
  const { etapas, negocios, funilId, demo } = await carregarFunil();

  return (
    <CrmProvider etapas={etapas} negociosIniciais={negocios} funilId={funilId} demo={demo}>
      <Topo
        titulo="CRM"
        descricao="Funil comercial da agência, do lead ao contrato assinado."
        acao={<AcaoNovoNegocio />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        <Indicadores />
        <Kanban />
      </div>
    </CrmProvider>
  );
}
