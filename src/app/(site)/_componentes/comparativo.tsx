import { Secao, CabecaSecao } from "./secao";

/* Frases curtas de propósito: a seção é para bater o olho e comparar,
   não para ler. Cada lado cabe numa linha só. */
const LINHAS = [
  {
    criterio: "Rastreamento",
    comum: "Pixel instalado e pronto",
    nossa: "GA4, GTM, Pixel e CAPI auditados todo mês",
  },
  {
    criterio: "Criativos",
    comum: "2 a 4 artes por mês",
    nossa: "Testes semanais, com vencedor documentado",
  },
  {
    criterio: "Relatório",
    comum: "PDF no dia 5",
    nossa: "Painel aberto, 24 horas por dia",
  },
  {
    criterio: "Página",
    comum: "“Manda o link que a gente anuncia”",
    nossa: "Landing page própria e testada",
  },
  {
    criterio: "Comercial",
    comum: "Entrega o lead e some",
    nossa: "CRM e acompanhamento até fechar",
  },
  {
    criterio: "Meta",
    comum: "Alcance e engajamento",
    nossa: "CPA e ROAS sobre a sua margem",
  },
];

export function Comparativo() {
  return (
    <Secao id="comparativo">
      <CabecaSecao
        chapeu="A diferença"
        titulo="O mesmo serviço, cobrado de dois jeitos"
        apoio="À esquerda, o que costuma vir na proposta. À direita, o nosso escopo."
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
