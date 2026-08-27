import { Secao, CabecaSecao } from "./secao";

/* Frases curtas de propósito: a seção é para bater o olho e comparar,
   não para ler. Cada lado cabe numa linha só. */
const LINHAS = [
  {
    criterio: "Estratégia",
    comum: "Post do que der na cabeça",
    nossa: "Planejamento mensal com tema e objetivo",
  },
  {
    criterio: "Conteúdo",
    comum: "2 a 4 artes por mês",
    nossa: "Cronograma de feed, reels e stories",
  },
  {
    criterio: "Vídeo",
    comum: "“Grava aí que a gente edita”",
    nossa: "Roteiro pronto, captação e edição",
  },
  {
    criterio: "Tráfego",
    comum: "Impulsiona o post que foi bem",
    nossa: "Campanha estruturada com meta de CPA",
  },
  {
    criterio: "Relatório",
    comum: "PDF no dia 5",
    nossa: "Relatório mensal e reunião estratégica",
  },
  {
    criterio: "Meta",
    comum: "Alcance e engajamento",
    nossa: "Demanda e faturamento",
  },
];


export function Comparativo() {
  return (
    <Secao id="comparativo">
      <CabecaSecao
        chapeu="A diferença"
        titulo="O mesmo serviço, cobrado de dois jeitos"
        apoio="À esquerda, o que costuma vir na proposta de agência. À direita, o nosso escopo."
      />

      <div className="contraste vidro espaco">
        <div className="contraste__cabeca">
          <span />
          <span className="contraste__rot">Agência comum</span>
          <span className="contraste__rot contraste__rot--nossa">MR Grow</span>
        </div>

        {LINHAS.map((l) => (
          <div className="contraste__linha" key={l.criterio}>
            <span className="contraste__criterio">{l.criterio}</span>
            <span className="contraste__comum">{l.comum}</span>
            <span className="contraste__nossa">{l.nossa}</span>
          </div>
        ))}
      </div>
    </Secao>
  );
}
