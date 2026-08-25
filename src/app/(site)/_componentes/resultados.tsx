import { Secao, CabecaSecao } from "./secao";

const CASOS = [
  {
    segmento: "E-commerce de moda",
    salto: "6,2×",
    metrica: "ROAS em 90 dias",
    contexto:
      "Reestruturação de campanhas, API de Conversões e 24 criativos testados por mês.",
    antes: "2,1×",
    depois: "6,2×",
  },
  {
    segmento: "Clínica de estética",
    salto: "−63%",
    metrica: "no custo por agendamento",
    contexto: "Nova landing page, formulário curto e primeiro contato em até 10 minutos.",
    antes: "R$ 84",
    depois: "R$ 31",
  },
  {
    segmento: "Serviço local B2B",
    salto: "3,4×",
    metrica: "mais orçamentos fechados",
    contexto: "Google Ads de intenção alta somado a CRM com follow-up automatizado.",
    antes: "18/mês",
    depois: "61/mês",
  },
];

const DEPOIMENTOS = [
  {
    texto:
      "A diferença foi parar de olhar para métrica bonita e passar a olhar para faturamento. Em dois meses a operação virou outra coisa.",
    quem: "L.M. · sócio-fundador, e-commerce",
  },
  {
    texto:
      "O que mais me pegou foi a transparência. Eu abro o painel e vejo exatamente onde o dinheiro está indo e o que ele trouxe de volta.",
    quem: "C.A. · diretora de marketing, serviços",
  },
];

export function Resultados() {
  return (
    <Secao id="resultados">
      <CabecaSecao
        chapeu="Resultados"
        titulo="O que muda quando a estrutura está certa"
        apoio="Recortes reais de operação. Os números variam por segmento, oferta e verba, e a gente diz isso na primeira conversa."
      />

      <div className="casos espaco">
        {CASOS.map((c) => (
          <article className="caso vidro" key={c.segmento}>
            <span className="chapeu">
              <i />
              {c.segmento}
            </span>
            <p className="caso__salto">{c.salto}</p>
            <p className="caso__metrica">{c.metrica}</p>
            <p className="caso__contexto">{c.contexto}</p>
            <p className="caso__delta">
              <span className="caso__antes">{c.antes}</span>
              <span aria-hidden>→</span>
              <span className="caso__depois">{c.depois}</span>
            </p>
          </article>
        ))}
      </div>

      <div className="depoimentos espaco">
        {DEPOIMENTOS.map((d) => (
          <figure className="depoimento vidro" key={d.quem}>
            <blockquote>{d.texto}</blockquote>
            <figcaption>{d.quem}</figcaption>
          </figure>
        ))}
      </div>
    </Secao>
  );
}
