import type { Metadata } from "next";
import { FileBarChart, Link2, Mail } from "lucide-react";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { BotaoLink } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_CLIENTES } from "@/lib/demo";

export const metadata: Metadata = { title: "Relatórios" };

const BLOCOS = [
  "Resumo executivo (investimento, retorno, ROAS)",
  "Evolução diária de investimento e receita",
  "Desempenho por campanha",
  "Criativos vencedores do período",
  "Leads gerados e custo por lead",
  "Comparativo com o período anterior",
  "Plano de ação do próximo ciclo",
];

export default function PaginaRelatorios() {
  const demo = !supabaseConfigurado();

  return (
    <>
      <Topo
        titulo="Relatórios"
        descricao="Relatório recorrente por cliente, com link público e envio automático."
        acao={<BotaoLink href="/painel/relatorios/novo" tamanho="sm">Novo relatório</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="cartao-vidro rounded-lg p-5">
          <div className="flex items-start gap-3">
            <FileBarChart className="mt-0.5 size-5 text-mrg-400" />
            <div>
              <h2 className="font-display text-base font-bold text-white">Como o cliente recebe</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-300">
                Cada relatório gera um link público com token próprio — o cliente abre no celular sem
                precisar de senha. Se preferir, o mesmo conteúdo vai por e-mail no dia definido, ou o
                cliente entra no portal e vê tudo ao vivo.
              </p>
            </div>
          </div>

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {BLOCOS.map((b) => (
              <li key={b} className="flex items-center gap-2 rounded-md border border-white/8 bg-white/[0.02] px-3 py-2.5 text-sm text-ink-200">
                <span className="size-1.5 rounded-full bg-mrg-400" />
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DEMO_CLIENTES.filter((c) => c.status === "ativo").map((c) => (
            <article key={c.id} className="cartao-vidro rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-white">{c.nome}</h3>
                <Etiqueta tom="azul">mensal</Etiqueta>
              </div>
              <p className="mt-1 text-xs text-ink-400">Próximo envio: dia 1º · por e-mail e link</p>
              <div className="mt-5 flex gap-2">
                <BotaoLink href={`/relatorio/exemplo-${c.slug}`} variante="contorno" tamanho="sm" className="flex-1">
                  <Link2 className="size-3.5" /> Link público
                </BotaoLink>
                <BotaoLink href={`/painel/relatorios/${c.slug}`} variante="fantasma" tamanho="sm">
                  <Mail className="size-3.5" /> Editar
                </BotaoLink>
              </div>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
