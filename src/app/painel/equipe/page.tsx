import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { MATRIZ, ROTULO_PAPEL, type Papel } from "@/lib/papeis";
import { iniciais } from "@/lib/utils";

export const metadata: Metadata = { title: "Equipe" };

const MEMBROS = [
  { id: "u1", nome: "Mateus Rodrigues", email: "mateus@mrgrow.com.br", papel: "proprietario" as Papel, ativo: true },
  { id: "u2", nome: "Gestor de Tráfego", email: "trafego@mrgrow.com.br", papel: "gestor" as Papel, ativo: true },
  { id: "u3", nome: "Analista de Criativos", email: "criativos@mrgrow.com.br", papel: "operador" as Papel, ativo: true },
  { id: "u4", nome: "Financeiro", email: "financeiro@mrgrow.com.br", papel: "financeiro" as Papel, ativo: true },
  { id: "u5", nome: "Vitrine Prime (cliente)", email: "contato@vitrineprime.com.br", papel: "cliente" as Papel, ativo: true },
];

export default function PaginaEquipe() {
  const demo = !supabaseConfigurado();
  const papeis = Object.keys(MATRIZ) as Papel[];

  return (
    <>
      <Topo
        titulo="Equipe e acessos"
        descricao="Quem entra, o que vê e o que pode alterar."
        acao={<BotaoLink href="/painel/equipe/convidar" tamanho="sm">Convidar</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <Tabela>
          <Cabecalhos colunas={["Pessoa", "E-mail", "Papel", "Status", ""]} />
          <tbody>
            {MEMBROS.map((m) => (
              <Linha key={m.id}>
                <Celula>
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-mrg-500/20 text-[11px] font-bold text-mrg-300">
                      {iniciais(m.nome)}
                    </span>
                    <span className="font-medium text-white">{m.nome}</span>
                  </div>
                </Celula>
                <Celula className="text-ink-400">{m.email}</Celula>
                <Celula><Etiqueta tom={m.papel === "cliente" ? "neutro" : "azul"}>{ROTULO_PAPEL[m.papel]}</Etiqueta></Celula>
                <Celula><Etiqueta tom={m.ativo ? "sucesso" : "neutro"}>{m.ativo ? "ativo" : "inativo"}</Etiqueta></Celula>
                <Celula><BotaoLink href={`/painel/equipe/${m.id}`} variante="fantasma" tamanho="sm">Editar</BotaoLink></Celula>
              </Linha>
            ))}
          </tbody>
        </Tabela>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-white">Matriz de permissões</h2>
          <Tabela>
            <Cabecalhos colunas={["Papel", "Acesso"]} />
            <tbody>
              {papeis.map((p) => (
                <Linha key={p}>
                  <Celula className="font-medium whitespace-nowrap text-white">{ROTULO_PAPEL[p]}</Celula>
                  <Celula>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(MATRIZ[p]).map(([recurso, acoes]) => (
                        <span
                          key={recurso}
                          className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-ink-300"
                          title={acoes?.join(", ")}
                        >
                          {recurso}
                          {acoes && acoes.length > 1 && (
                            <span className="ml-1 text-mrg-400">{acoes.length === 4 ? "total" : "edição"}</span>
                          )}
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
    </>
  );
}
