import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { ListaClientes } from "./lista";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { BotaoLink } from "@/components/ui/botao";
import { carregarCarteira } from "@/lib/clientes";

export const metadata: Metadata = { title: "Clientes" };

export default async function PaginaClientes() {
  const { clientes, demo } = await carregarCarteira();

  return (
    <>
      <Topo
        titulo="Clientes"
        descricao="Carteira da agência, saúde da conta e contratos."
        acao={
          <BotaoLink href="/painel/clientes/novo" tamanho="sm">
            Novo cliente
          </BotaoLink>
        }
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        <ListaClientes clientes={clientes} />
      </div>
    </>
  );
}
