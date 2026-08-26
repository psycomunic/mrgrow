import type { Metadata } from "next";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Tabela, Cabecalhos, Linha, Celula, CelulaTexto, Vazio } from "@/components/painel/tabela";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarTarefas } from "@/lib/tarefas";
import { carregarProjetos } from "@/lib/projetos";
import { STATUS_PROJETO, STATUS_TAREFA } from "@/lib/rotulos";
import { dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Entregas" };

export default async function PaginaEntregas() {
  const [quadro, portfolio] = await Promise.all([carregarTarefas(), carregarProjetos()]);

  /* O cliente não precisa ver o backlog inteiro da agência: o que interessa a
     ele é o que está em movimento e o que já saiu. */
  const emAndamento = quadro.tarefas.filter((t) => t.status !== "backlog");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-tinta">
          O que está sendo entregue
        </h1>
        <p className="mt-1 text-sm text-cinza">
          Projetos com prazo e as entregas em andamento da sua conta.
        </p>
      </div>

      {(quadro.demo || portfolio.demo) && <AvisoDemo />}

      <section>
        <h2 className="mb-3 font-display text-[15px] font-bold text-tinta">Projetos</h2>
        {portfolio.projetos.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {portfolio.projetos.map((p) => (
              <article key={p.id} className="cartao rounded-lg p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm leading-snug font-semibold text-tinta">{p.nome}</h3>
                  <Etiqueta tom={STATUS_PROJETO.tom(p.status)}>
                    {STATUS_PROJETO.rotulo(p.status)}
                  </Etiqueta>
                </div>
                <div className="mt-5">
                  <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                    <span className="text-cinza-claro">Progresso</span>
                    <span className="font-semibold tabular-nums text-grafite">{p.progresso}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-nevoa-2">
                    <div
                      className="h-full bg-gradient-to-r from-mrg-600 to-mrg-400"
                      style={{ width: `${p.progresso}%` }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs text-cinza-claro">
                  {p.prazo ? `Entrega prevista para ${dataCompleta(p.prazo)}` : "Sem prazo definido"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <Vazio mensagem="Nenhum projeto aberto no momento. Quando houver uma entrega com prazo, ela aparece aqui." />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-[15px] font-bold text-tinta">Em andamento</h2>
        {emAndamento.length ? (
          <Tabela>
            <Cabecalhos colunas={["Entrega", "Prazo", "Situação"]} />
            <tbody>
              {emAndamento.map((t) => (
                <Linha key={t.id}>
                  <CelulaTexto largura="28rem" className="text-tinta" titulo={t.titulo}>
                    {t.titulo}
                  </CelulaTexto>
                  <Celula className="tabular-nums whitespace-nowrap text-cinza">
                    {t.vence_em ? dataCompleta(t.vence_em) : "—"}
                  </Celula>
                  <Celula>
                    <Etiqueta tom={STATUS_TAREFA.tom(t.status)}>
                      {STATUS_TAREFA.rotulo(t.status)}
                    </Etiqueta>
                  </Celula>
                </Linha>
              ))}
            </tbody>
          </Tabela>
        ) : (
          <Vazio mensagem="Nada em execução neste momento." />
        )}
      </section>
    </div>
  );
}
