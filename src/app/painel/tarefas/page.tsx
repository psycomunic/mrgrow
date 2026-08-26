import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { TarefasProvider } from "./contexto";
import { AcaoNovaTarefa, Indicadores, Quadro } from "./quadro";
import { exigirPermissao } from "@/lib/sessao";
import { carregarTarefas } from "@/lib/tarefas";
import { listarClientesParaSelecao } from "@/lib/clientes";

export const metadata: Metadata = { title: "Tarefas" };

export default async function PaginaTarefas() {
  /* O menu lateral já esconde o item para quem não tem acesso, mas quem digita
     a URL passa por cima dele — a permissão precisa valer no servidor. */
  await exigirPermissao("tarefas");

  const [{ tarefas, demo }, clientes] = await Promise.all([
    carregarTarefas(),
    listarClientesParaSelecao(),
  ]);

  return (
    <TarefasProvider tarefasIniciais={tarefas} clientes={clientes} demo={demo}>
      <Topo
        titulo="Tarefas"
        descricao="Operação da semana, coluna por coluna. Arraste para mudar o status."
        acao={<AcaoNovaTarefa />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        <Indicadores />
        <Quadro />
      </div>
    </TarefasProvider>
  );
}
