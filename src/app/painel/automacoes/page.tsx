import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { AutomacoesProvider } from "./contexto";
import { AcaoNovaAutomacao, Lista } from "./lista";
import { carregarAutomacoes, listarEtapas } from "@/lib/automacoes-dados";
import { CATALOGO_ACOES, CATALOGO_GATILHOS } from "@/lib/automacoes-catalogo";
import { exigirPermissao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Automações" };

export default async function PaginaAutomacoes() {
  await exigirPermissao("automacoes");

  const [{ automacoes, demo }, etapas] = await Promise.all([carregarAutomacoes(), listarEtapas()]);
  const acoesDisponiveis = CATALOGO_ACOES.filter((a) => a.disponivel);

  return (
    <AutomacoesProvider automacoesIniciais={automacoes} etapas={etapas} demo={demo}>
      <Topo
        titulo="Automações"
        descricao="Regras que rodam sozinhas: cobrança, alerta de performance e follow-up comercial."
        acao={<AcaoNovaAutomacao />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <Lista />

        <section className="cartao rounded-lg p-5">
          <h2 className="font-display text-base font-bold text-tinta">Gatilhos disponíveis</h2>
          <p className="mt-1 text-sm text-cinza">
            Cada gatilho aceita qualquer combinação destas ações:{" "}
            {acoesDisponiveis.map((a) => a.rotulo.toLowerCase()).join(", ")}.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATALOGO_GATILHOS.map((g) => (
              <li key={g.valor} className="rounded-md border border-borda bg-nevoa p-3.5">
                <p className="text-sm font-semibold text-tinta">{g.rotulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-cinza">{g.descricao}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AutomacoesProvider>
  );
}
