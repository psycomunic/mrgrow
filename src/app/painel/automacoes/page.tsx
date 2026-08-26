import type { Metadata } from "next";
import { Zap } from "lucide-react";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_AUTOMACOES } from "@/lib/demo";
import { CATALOGO_GATILHOS } from "@/lib/automacoes";
import { numero } from "@/lib/utils";

export const metadata: Metadata = { title: "Automações" };

export default function PaginaAutomacoes() {
  const demo = !supabaseConfigurado();
  const rotulo = new Map(CATALOGO_GATILHOS.map((g) => [g.valor, g.rotulo]));

  return (
    <>
      <Topo
        titulo="Automações"
        descricao="Regras que rodam sozinhas: cobrança, alerta de performance e follow-up comercial."
        acao={<BotaoLink href="/painel/automacoes/nova" tamanho="sm">Nova automação</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 lg:grid-cols-2">
          {DEMO_AUTOMACOES.map((a) => (
            <article key={a.id} className="cartao rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-mrg-500/12 text-mrg-600 ring-1 ring-inset ring-mrg-500/25">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-tinta">{a.nome}</h3>
                    <p className="mt-0.5 text-xs text-cinza">
                      Gatilho: {rotulo.get(a.gatilho as never) ?? a.gatilho}
                    </p>
                  </div>
                </div>
                <Etiqueta tom={a.ativa ? "sucesso" : "neutro"}>{a.ativa ? "ativa" : "pausada"}</Etiqueta>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-borda pt-4 text-xs text-cinza">
                <span>{numero(a.execucoes)} execuções</span>
                <BotaoLink href={`/painel/automacoes/${a.id}`} variante="fantasma" tamanho="sm">
                  Editar
                </BotaoLink>
              </div>
            </article>
          ))}
        </section>

        <section className="cartao rounded-lg p-5">
          <h2 className="font-display text-base font-bold text-tinta">Gatilhos disponíveis</h2>
          <p className="mt-1 text-sm text-cinza">
            Combine qualquer gatilho com as ações: notificar, e-mail, WhatsApp, criar tarefa, mover no funil,
            ajustar saúde do cliente ou chamar um webhook.
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
    </>
  );
}
