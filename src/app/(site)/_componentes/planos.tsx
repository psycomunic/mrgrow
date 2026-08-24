import { Secao, CabecaSecao } from "./secao";

const PLANOS = [
  {
    nome: "Essencial",
    para: "Para quem está começando a investir com consistência",
    preco: "R$ 2.500",
    ciclo: "/mês",
    itens: [
      "Uma plataforma (Meta ou Google)",
      "Estruturação completa de campanhas",
      "Rastreamento GA4 e Pixel",
      "Até 8 criativos novos por mês",
      "Painel aberto",
      "Reunião mensal de performance",
    ],
  },
  {
    nome: "Performance",
    para: "Para quem já investe e quer escalar com previsibilidade",
    preco: "R$ 4.200",
    ciclo: "/mês",
    destaque: true,
    itens: [
      "Meta Ads e Google Ads integrados",
      "API de Conversões e rastreamento server-side",
      "Até 20 criativos novos por mês",
      "Landing page inclusa com testes A/B",
      "CRM com funil e automações",
      "Reunião quinzenal com plano de ação",
      "Suporte prioritário no WhatsApp",
    ],
  },
  {
    nome: "Growth Partner",
    para: "Operação dedicada para contas de alto volume",
    preco: "Sob consulta",
    ciclo: "",
    itens: [
      "Tudo do Performance",
      "Time dedicado de mídia, criativo e dados",
      "Produção audiovisual mensal",
      "BI customizado e integrações sob medida",
      "Acompanhamento semanal",
      "Modelo híbrido com variável sobre resultado",
    ],
  },
];

export function Planos() {
  return (
    <Secao id="planos">
      <CabecaSecao
        chapeu="Planos"
        titulo="Escolha pelo estágio da sua operação"
        apoio="Valores de referência. O escopo final sai do diagnóstico — e a gente só propõe o que faz sentido para a sua margem."
      />

      <div className="planos espaco">
        {PLANOS.map((p) => (
          <div className={p.destaque ? "plano plano--destaque" : "plano vidro"} key={p.nome}>
            {p.destaque && <span className="plano__selo">Escolhido por quem escala</span>}

            <h3>{p.nome}</h3>
            <p className="plano__para">{p.para}</p>

            <p className="plano__valor">
              <span className={p.ciclo ? "plano__preco" : "plano__preco plano__preco--texto"}>
                {p.preco}
              </span>
              {p.ciclo && <span className="plano__ciclo">{p.ciclo}</span>}
            </p>

            <ul>
              {p.itens.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>

            <a href="#diagnostico" className={p.destaque ? "acao acao--azul" : "acao acao--linha"}>
              Solicitar diagnóstico
            </a>
          </div>
        ))}
      </div>

      <p className="planos__nota">
        O investimento em mídia é pago diretamente por você às plataformas. O valor acima é o da
        assessoria.
      </p>
    </Secao>
  );
}
