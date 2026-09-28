import type { Metadata } from "next";
import { Topo } from "../../_componentes/topo";
import { FormularioNovoCliente } from "./formulario";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { exigirPermissao } from "@/lib/sessao";
import { modoDemonstracao } from "@/lib/dados";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function PaginaNovoCliente() {
  /* A permissão vale no servidor: o botão some para quem não pode, mas
     quem digita a URL passa por cima dele. */
  await exigirPermissao("clientes", "criar");

  return (
    <>
      <Topo
        titulo="Novo cliente"
        descricao="O essencial para a conta entrar na carteira. O resto se completa na ficha."
      />

      <div className="space-y-5 p-5 sm:p-8">
        {modoDemonstracao() && <AvisoDemo />}
        <FormularioNovoCliente />
      </div>
    </>
  );
}
