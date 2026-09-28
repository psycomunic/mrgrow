import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Kanban } from "./kanban";
import { CrmProvider } from "./contexto";
import { AcaoNovoNegocio, Indicadores } from "./indicadores";
import { BotaoEditarFunil } from "./funil";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarFunil } from "@/lib/crm";

export const metadata: Metadata = { title: "CRM" };

export default async function PaginaCrm({
  searchParams,
}: {
  searchParams: Promise<{ negocio?: string }>;
}) {
  const [{ etapas, negocios, funilId, demo }, { negocio }] = await Promise.all([
    carregarFunil(),
    searchParams,
  ]);

  return (
    <CrmProvider etapas={etapas} negociosIniciais={negocios} funilId={funilId} demo={demo}>
      <Topo
        titulo="CRM"
        descricao="Funil comercial da agência, do lead ao contrato assinado."
        acao={
          <div className="flex items-center gap-2">
            <BotaoEditarFunil etapas={etapas} funilId={funilId} />
            <AcaoNovoNegocio />
          </div>
        }
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        <Indicadores />
        <Kanban aberturaInicial={negocio ?? null} />
      </div>
    </CrmProvider>
  );
}
