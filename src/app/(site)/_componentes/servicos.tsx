import { BarChart3, Blocks, Camera, LayoutTemplate, Radar, Target } from "lucide-react";
import { Secao, TituloSecao } from "./secao";
import { Etiqueta } from "@/components/ui/etiqueta";

const SERVICOS = [
  {
    icone: Target,
    titulo: "Gestão de Tráfego Meta Ads",
    texto:
      "Estrutura por temperatura de público, teste contínuo de criativo e leitura diária da conta.",
    tags: ["Instagram", "Facebook", "Advantage+"],
  },
  {
    icone: Radar,
    titulo: "Gestão de Tráfego Google Ads",
    texto:
      "Search, Performance Max, YouTube e remarketing capturando quem já está pronto para comprar.",
    tags: ["Search", "PMax", "YouTube"],
  },
  {
    icone: Camera,
    titulo: "Criativos que vendem",
    texto:
      "Roteiro, edição e variação. Matriz de ângulos testada semana a semana, com vencedor documentado.",
    tags: ["Reels", "Estático", "UGC"],
  },
  {
    icone: LayoutTemplate,
    titulo: "Landing pages de alta conversão",
    texto:
      "Página construída para converter: oferta clara, prova, velocidade e teste A/B contínuo.",
    tags: ["Copy", "Design", "Teste A/B"],
  },
  {
    icone: Blocks,
    titulo: "Rastreamento e dados",
    texto:
      "GA4, GTM, Pixel e API de Conversões. A plataforma só otimiza bem quando enxerga direito.",
    tags: ["GA4", "CAPI", "Server-side"],
  },
  {
    icone: BarChart3,
    titulo: "Painel e relatórios ao vivo",
    texto:
      "Você acompanha investimento, retorno e projeção sem esperar o relatório do fim do mês.",
    tags: ["Tempo real", "CRM", "Metas"],
  },
];

export function Servicos() {
  return (
    <Secao id="servicos">
      <TituloSecao
        sobre="O que entregamos"
        titulo={
          <>
            Uma operação inteira, não um <span className="texto-gradiente">serviço solto</span>
          </>
        }
        descricao="Tráfego sozinho não resolve. A MR Grow cuida de todas as peças que decidem se o seu investimento vira venda."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SERVICOS.map(({ icone: Icone, titulo, texto, tags }) => (
          <article
            key={titulo}
            className="group cartao-vidro flex flex-col rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 hover:border-mrg-500/35 hover:shadow-[0_24px_60px_-30px_rgba(22,104,245,.8)]"
          >
            <span className="grid size-11 place-items-center rounded-md bg-mrg-500/12 text-mrg-300 ring-1 ring-inset ring-mrg-500/25">
              <Icone className="size-5" />
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-white">{titulo}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-300">{texto}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Etiqueta key={t}>{t}</Etiqueta>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Secao>
  );
}
