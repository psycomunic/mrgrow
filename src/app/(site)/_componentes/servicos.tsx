import { BarChart3, CalendarRange, Clapperboard, Images } from "lucide-react";
import { Secao, CabecaSecao } from "./secao";
import { GoogleAdsIcone, MetaIcone } from "./marcas";

/* Os seis blocos espelham as entregas reais da assessoria: estratégia,
   conteúdo, vídeo, as duas frentes de mídia e o acompanhamento. Tráfego
   é uma das seis, não o serviço todo. */
const SERVICOS = [
  {
    icone: CalendarRange,
    titulo: "Planejamento estratégico mensal",
    texto:
      "Todo mês começa com direção definida: tema, objetivo e o que vai ao ar em cada semana. Sem post decidido na véspera.",
    tags: ["Posicionamento", "Cronograma", "Reunião mensal"],
  },
  {
    icone: Images,
    titulo: "Conteúdo para redes sociais",
    texto:
      "Feed, reels e stories produzidos dentro do planejamento, com intenção comercial. Rede ativa não é a meta, é o meio.",
    tags: ["Feed", "Reels", "Stories"],
  },
  {
    icone: Clapperboard,
    titulo: "Roteiro, captação e edição de vídeo",
    texto:
      "O vídeo que converte não nasce de inspiração, nasce de roteiro. A gente escreve, capta e edita, com legenda pronta para publicar.",
    tags: ["Script", "Captação", "Legenda"],
  },
  {
    icone: MetaIcone,
    titulo: "Gestão de tráfego no Meta Ads",
    texto:
      "O mesmo conteúdo que sustenta a rede vira anúncio, com estrutura por temperatura de público e leitura constante da conta.",
    tags: ["Instagram", "Facebook", "Advantage+"],
  },
  {
    icone: GoogleAdsIcone,
    titulo: "Gestão de tráfego no Google Ads",
    texto:
      "Search, Performance Max e remarketing capturando quem já está procurando o que você vende.",
    tags: ["Search", "PMax", "YouTube"],
  },
  {
    icone: BarChart3,
    titulo: "Relatório e acompanhamento",
    texto:
      "Relatório mensal de resultados, reunião estratégica e grupo de WhatsApp aberto. Você não espera o fim do mês para saber como está.",
    tags: ["Relatório", "Reunião", "WhatsApp"],
  },
];

export function Servicos() {
  return (
    <Secao id="servicos">
      <CabecaSecao
        chapeu="Escopo"
        titulo="Uma operação inteira, não um serviço solto"
        apoio="Conteúdo sem tráfego não escala e tráfego sem conteúdo não sustenta. A MR Grow cuida das duas pontas e do que liga uma na outra."
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
