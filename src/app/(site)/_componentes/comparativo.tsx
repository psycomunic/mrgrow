import { Secao, CabecaSecao } from "./secao";

const CONTRASTE = [
  {
    c: "Rastreamento",
    comum: "Pixel instalado e “tá certo”",
    nossa: "GA4, GTM, Pixel e API de Conversões auditados todo mês",
  },
  {
    c: "Criativos",
    comum: "Duas a quatro artes por mês",
    nossa: "Matriz de ângulos com testes semanais e vencedor documentado",
  },
  {
    c: "Relatório",
    comum: "PDF no dia 5 do mês seguinte",
    nossa: "Painel aberto, 24 horas por dia, com investimento e retorno por conta",
  },
  {
    c: "Página",
    comum: "“Manda o link que a gente anuncia”",
    nossa: "Landing page própria, otimizada e testada",
  },
  {
    c: "Comercial",
    comum: "Entrega o lead e some",
    nossa: "CRM, prazo de resposta acordado e acompanhamento até o fechamento",
  },
  {
    c: "Meta",
    comum: "Alcance e engajamento",
    nossa: "CPA e ROAS alvo calculados sobre a sua margem",
  },
];

export function Comparativo() {
  return (
    <Secao id="comparativo">
      <CabecaSecao
        etiqueta="A diferença"
        titulo="O mesmo serviço, cobrado de dois jeitos muito diferentes."
        apoio="À esquerda, o que costuma vir na proposta. À direita, o que está no nosso escopo."
      />

      <div className="contraste espaco">
        <div className="contraste__rotulos">
          <span />
          <span className="etiqueta etiqueta--brasa">Agência comum</span>
          <span className="etiqueta etiqueta--azul">MR Grow</span>
        </div>

        {CONTRASTE.map((l) => (
          <div className="linha" key={l.c}>
            <span className="linha__criterio">{l.c}</span>
            <span className="linha__comum">{l.comum}</span>
            <span className="linha__nossa">{l.nossa}</span>
          </div>
        ))}
      </div>
    </Secao>
  );
}
