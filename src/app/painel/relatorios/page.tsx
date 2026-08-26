import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { ListaRelatorios } from "./lista";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarRelatorios } from "@/lib/relatorios";
import { carregarCarteira } from "@/lib/clientes";

export const metadata: Metadata = { title: "Relatórios" };

export default async function PaginaRelatorios() {
  const [{ relatorios, demo }, { clientes }] = await Promise.all([
    carregarRelatorios(),
    carregarCarteira(),
  ]);

  return (
    <>
      <Topo
        titulo="Relatórios"
        descricao="Fechamento recorrente por cliente, com link público e envio automático."
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <ListaRelatorios
          relatorios={relatorios}
          clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
        />
      </div>
    </>
  );
}
