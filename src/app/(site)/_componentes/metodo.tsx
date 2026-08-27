import Image from "next/image";
import { Secao, CabecaSecao } from "./secao";

const PILARES = [
  {
    letra: "G",
    titulo: "Ground · Fundação",
    resumo: "Antes de publicar ou anunciar",
    itens: [
      "Diagnóstico de marca, oferta e margem",
      "Posicionamento: o que a marca diz e para quem",
      "Rastreamento completo: GA4, GTM, Pixel e API de Conversões",
      "Planejamento estratégico do primeiro mês",
    ],
  },
  {
    letra: "R",
    titulo: "Reach · Alcance",
    resumo: "Conteúdo e mídia na mesma direção",
    itens: [
      "Cronograma mensal de feed, reels e stories",
      "Scripts de vídeo escritos para gravar sem travar",
      "Captação, edição e legenda dentro do planejamento",
      "Campanhas no Meta e no Google a partir do que já performa",
    ],
  },
  {
    letra: "O",
    titulo: "Optimize · Otimização",
    resumo: "Decisão por dado, não por achismo",
    itens: [
      "Leitura de performance de conteúdo e de campanha juntas",
      "Separar o que engaja do que realmente traz cliente",
      "Mais volume no formato que responde, corte no que não responde",
      "Ajuste de oferta e de página quando o gargalo está ali",
    ],
  },
  {
    letra: "W",
    titulo: "Win · Previsibilidade",
    resumo: "Do conteúdo ao caixa",
    itens: [
      "Relatório mensal de resultados, sem métrica de vaidade",
      "Reunião estratégica com o plano do mês seguinte",
      "Grupo de WhatsApp aberto para o dia a dia",
      "Metas acordadas e acompanhadas mês a mês",
    ],
  },
];


export function Metodo() {
  return (
    <Secao id="metodo">
      <CabecaSecao
        chapeu="Método G.R.O.W"
        titulo="Quatro etapas para sair do imprevisível"
        apoio="Nada de fórmula mágica. É processo: o mesmo que roda em todas as contas da MR Grow, da definição do que a marca vai dizer até o resultado no caixa."
        antes={
          <Image
            src="/marca/grow-roda.webp"
            alt="Roda do método G.R.O.W: Ground, Reach, Optimize e Win"
            width={720}
            height={720}
            sizes="(max-width: 40rem) 100vw, 140px"
            className="roda"
          />
        }
      />

      <div className="pilares espaco">
        {PILARES.map((p, i) => (
          <article className="pilar vidro" key={p.letra}>
            <div className="pilar__topo">
              <span className="pilar__letra" aria-hidden>
                {p.letra}
              </span>
              <div>
                {/* A grade 2x2 apaga a ordem, e estas sao etapas: a
                    fundacao vem antes da aquisicao, que vem antes da
                    otimizacao. O numero devolve a sequencia que o
                    acronimo sozinho nao entrega quando os cartoes sao
                    lidos em bloco. */}
                <span className="pilar__passo">
                  Etapa {String(i + 1).padStart(2, "0")} de 04
                </span>
                <h3>{p.titulo}</h3>
                <p className="pilar__resumo">{p.resumo}</p>
              </div>
            </div>
            <ul>
              {p.itens.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Secao>
  );
}
