import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { ListaPropostas } from "./lista";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarPropostas } from "@/lib/propostas";

export const metadata: Metadata = { title: "Propostas" };

export default async function PaginaPropostas() {
  const { propostas, demo } = await carregarPropostas();

  return (
    <>
      <Topo
        titulo="Propostas"
        descricao="Documentos comerciais com link público e aceite registrado."
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        <ListaPropostas propostas={propostas} />
      </div>
    </>
  );
}
