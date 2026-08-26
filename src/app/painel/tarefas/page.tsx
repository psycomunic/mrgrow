import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_TAREFAS } from "@/lib/demo";
import { dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Tarefas" };

const COLUNAS = [
  { chave: "backlog", rotulo: "Backlog" },
  { chave: "fazendo", rotulo: "Em andamento" },
  { chave: "revisao", rotulo: "Em revisão" },
  { chave: "concluida", rotulo: "Concluídas" },
];

const TOM_PRIORIDADE: Record<string, "perigo" | "alerta" | "azul" | "neutro"> = {
  urgente: "perigo", alta: "alerta", media: "azul", baixa: "neutro",
};

export default function PaginaTarefas() {
  const demo = !supabaseConfigurado();

  return (
    <>
      <Topo
        titulo="Tarefas"
        descricao="Operação diária da equipe, organizada por status."
        acao={<BotaoLink href="/painel/tarefas/nova" tamanho="sm">Nova tarefa</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <div className="grid gap-4 lg:grid-cols-4">
          {COLUNAS.map((coluna) => {
            const daColuna = DEMO_TAREFAS.filter((t) => t.status === coluna.chave);
            return (
              <section key={coluna.chave} className="rounded-lg border border-borda bg-nevoa p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-tinta">{coluna.rotulo}</h2>
                  <span className="rounded-full bg-nevoa-2 px-1.5 text-[11px] text-grafite">{daColuna.length}</span>
                </div>
                <div className="space-y-2">
                  {daColuna.map((t) => (
                    <article key={t.id} className="cartao rounded-md p-3.5">
                      <p className="text-sm font-medium text-tinta">{t.titulo}</p>
                      <p className="mt-1 text-xs text-cinza">{t.cliente}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Etiqueta tom={TOM_PRIORIDADE[t.prioridade]}>{t.prioridade}</Etiqueta>
                        <span className="text-[11px] text-cinza-claro">{dataCompleta(t.vence_em)}</span>
                      </div>
                    </article>
                  ))}
                  {!daColuna.length && (
                    <p className="rounded-md border border-dashed border-borda p-4 text-center text-xs text-cinza-claro">
                      Nada por aqui
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
