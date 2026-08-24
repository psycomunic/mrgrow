import { Secao, CabecaSecao } from "./secao";

const LINHAS = [
  {
    criterio: "Rastreamento",
    comum: "Pixel instalado e “tá certo”",
    nossa: "GA4, GTM, Pixel e API de Conversões auditados todo mês",
  },
  {
    criterio: "Criativos",
    comum: "Duas a quatro artes por mês",
    nossa: "Matriz de ângulos com testes semanais e vencedor documentado",
  },
  {
    criterio: "Relatório",
    comum: "PDF no dia 5 do mês seguinte",
    nossa: "Painel aberto, 24 horas por dia, com investimento e retorno por conta",
  },
  {
    criterio: "Página",
    comum: "“Manda o link que a gente anuncia”",
    nossa: "Landing page própria, otimizada e testada",
  },
  {
    criterio: "Comercial",
    comum: "Entrega o lead e some",
    nossa: "CRM, prazo de resposta acordado e acompanhamento até o fechamento",
  },
  {
    criterio: "Meta",
    comum: "Alcance e engajamento",
    nossa: "CPA e ROAS alvo calculados sobre a sua margem",
  },
];

export function Comparativo() {
  return (
    <Secao id="comparativo">
      <CabecaSecao
        chapeu="A diferença"
        titulo="O mesmo serviço, cobrado de dois jeitos muito diferentes"
        apoio="À esquerda, o que costuma vir na proposta. À direita, o que está no nosso escopo."
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
