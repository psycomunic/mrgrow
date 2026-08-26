import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { ProjetosProvider } from "./contexto";
import { AcaoNovoProjeto, Lista } from "./lista";
import { exigirPermissao } from "@/lib/sessao";
import { carregarProjetos } from "@/lib/projetos";
import { listarClientesParaSelecao } from "@/lib/clientes";

export const metadata: Metadata = { title: "Projetos" };

export default async function PaginaProjetos() {
  await exigirPermissao("projetos");

  const [{ projetos, demo }, clientes] = await Promise.all([
    carregarProjetos(),
    listarClientesParaSelecao(),
  ]);

  return (
    <ProjetosProvider projetosIniciais={projetos} clientes={clientes} demo={demo}>
      <Topo
        titulo="Projetos"
        descricao="Entregas por cliente, com prazo e progresso. Arraste a barra para atualizar."
        acao={<AcaoNovoProjeto />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        <Lista />
      </div>
    </ProjetosProvider>
  );
}
