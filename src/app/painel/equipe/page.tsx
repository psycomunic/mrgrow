import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { EquipeProvider } from "./contexto";
import { AcaoConvidar, Convites, Membros } from "./lista";
import { carregarEquipe } from "@/lib/equipe";
import { exigirPermissao } from "@/lib/sessao";
import { MATRIZ, ROTULO_PAPEL, type Papel } from "@/lib/papeis";
import { RECURSO, nivelDeAcesso } from "@/lib/rotulos";

export const metadata: Metadata = { title: "Equipe" };

export default async function PaginaEquipe() {
  const sessao = await exigirPermissao("equipe");
  const { membros, convites, demo } = await carregarEquipe();
  const papeis = Object.keys(MATRIZ) as Papel[];

  return (
    <EquipeProvider
      membrosIniciais={membros}
      convitesIniciais={convites}
      usuarioId={sessao.usuarioId}
      meuPapel={sessao.papel}
      demo={demo}
    >
      <Topo
        titulo="Equipe e acessos"
        descricao="Quem entra, o que vê e o que pode alterar."
        acao={<AcaoConvidar />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <Membros />
        <Convites />

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-tinta">Matriz de permissões</h2>
          <Tabela larguraMinima="40rem">
            <Cabecalhos colunas={["Papel", "O que cada um alcança"]} />
            <tbody>
              {papeis.map((p) => (
                <Linha key={p}>
                  <Celula className="align-top font-medium whitespace-nowrap text-tinta">
                    {ROTULO_PAPEL[p]}
                  </Celula>
                  <Celula>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(MATRIZ[p]).map(([recurso, acoes]) => (
                        <span
                          key={recurso}
                          className="rounded bg-nevoa px-2 py-0.5 text-[11px] text-grafite ring-1 ring-inset ring-borda"
                        >
                          {RECURSO.rotulo(recurso)}
                          <span className="ml-1 text-mrg-600">
                            {nivelDeAcesso(acoes).toLowerCase()}
                          </span>
                        </span>
                      ))}
                    </div>
                  </Celula>
                </Linha>
              ))}
            </tbody>
          </Tabela>
        </section>
      </div>
    </EquipeProvider>
  );
}
