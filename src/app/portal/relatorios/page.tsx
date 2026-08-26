import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { Vazio } from "@/components/painel/tabela";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { carregarRelatorios } from "@/lib/relatorios";
import { periodicidadeDe, proximoEnvio } from "@/lib/blocos-relatorio";
import { dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Relatórios" };

export default async function PaginaRelatoriosCliente() {
  const { relatorios, demo } = await carregarRelatorios();
  const ativos = relatorios.filter((r) => r.ativo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-tinta">
          Seus relatórios
        </h1>
        <p className="mt-1 text-sm text-cinza">
          Cada relatório abre num link próprio, com os números do período fechado. Pode abrir no
          celular e compartilhar com quem precisar.
        </p>
      </div>

      {demo && <AvisoDemo />}

      {ativos.length ? (
        <section className="grid gap-4 sm:grid-cols-2">
          {ativos.map((r) => {
            const cadencia = periodicidadeDe(r.periodicidade);
            return (
              <article key={r.id} className="cartao flex flex-col rounded-lg p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm leading-snug font-semibold text-tinta">{r.nome}</h2>
                  <Etiqueta tom="azul">{cadencia.rotulo}</Etiqueta>
                </div>

                <p className="mt-1.5 text-xs text-cinza">
                  {r.blocos.length} {r.blocos.length === 1 ? "seção" : "seções"} ·{" "}
                  {r.ultimo_envio_em
                    ? `último em ${dataCompleta(r.ultimo_envio_em)}`
                    : "primeiro fechamento a caminho"}
                </p>

                <p className="mt-4 text-xs text-cinza-claro">
                  Próximo fechamento em {dataCompleta(proximoEnvio(r.periodicidade))}
                </p>

                <BotaoLink
                  href={`/relatorio/${r.token}`}
                  variante="contorno"
                  tamanho="sm"
                  largura="cheia"
                  className="mt-5"
                  externo
                >
                  Abrir relatório <ArrowUpRight className="size-3.5" />
                </BotaoLink>
              </article>
            );
          })}
        </section>
      ) : (
        <Vazio mensagem="Nenhum relatório publicado ainda. Assim que a MR Grow ativar o primeiro fechamento, o link aparece aqui." />
      )}
    </div>
  );
}
