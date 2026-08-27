import { BarChart3, Blocks, Camera, LayoutTemplate } from "lucide-react";
import { Secao, CabecaSecao } from "./secao";
import { GoogleAdsIcone, MetaIcone } from "./marcas";

const SERVICOS = [
  {
    icone: MetaIcone,
    titulo: "Gestão de tráfego no Meta Ads",
    texto:
      "Estrutura por temperatura de público, teste contínuo de criativo e leitura diária da conta.",
    tags: ["Instagram", "Facebook", "Advantage+"],
  },
  {
    icone: GoogleAdsIcone,
    titulo: "Gestão de tráfego no Google Ads",
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
      <CabecaSecao
        chapeu="Escopo"
        titulo="Uma operação inteira, não um serviço solto"
        apoio="Tráfego sozinho não resolve. A MR Grow cuida de todas as peças que decidem se o seu investimento vira venda."
      />

      <div className="servicos espaco">
        {SERVICOS.map(({ icone: Icone, titulo, texto, tags }) => (
          <article className="servico vidro" key={titulo}>
            <span className="servico__icone">
              <Icone size={19} />
            </span>
            <h3>{titulo}</h3>
            <p>{texto}</p>
            <div className="pilulas">
              {tags.map((t) => (
                <span className="pilula" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Secao>
  );
}
