import Image from "next/image";
import { Secao, CabecaSecao } from "./secao";

const PILARES = [
  {
    letra: "G",
    titulo: "Ground · Fundação",
    resumo: "Antes de gastar o primeiro real",
    itens: [
      "Diagnóstico de conta, oferta e margem",
      "Rastreamento completo: GA4, GTM, Pixel e API de Conversões",
      "CPA e ROAS alvo definidos a partir da sua margem real",
      "Página e fluxo de atendimento revisados",
    ],
  },
  {
    letra: "R",
    titulo: "Reach · Aquisição",
    resumo: "Estrutura de campanha que escala",
    itens: [
      "Arquitetura de campanhas por temperatura de público",
      "Meta Ads e Google Ads trabalhando juntos, não competindo",
      "Volume real de criativos em teste toda semana",
      "Controle diário de orçamento e curva de aprendizagem",
    ],
  },
  {
    letra: "O",
    titulo: "Optimize · Otimização",
    resumo: "Decisão por dado, não por achismo",
    itens: [
      "Rotina diária de leitura de conta",
      "Matriz de criativos: ângulo × formato × oferta",
      "Testes A/B de página com meta de conversão declarada",
      "Corte rápido do que não performa, escala do que performa",
    ],
  },
  {
    letra: "W",
    titulo: "Win · Previsibilidade",
    resumo: "Do lead ao caixa",
    itens: [
      "CRM com funil, follow-up e prazo de resposta",
      "Painel aberto com investimento, retorno e projeção",
      "Reunião de performance quinzenal com plano de ação",
      "Metas mensais acordadas e acompanhadas",
    ],
  },
];

export function Metodo() {
  return (
    <Secao id="metodo">
      <CabecaSecao
        chapeu="Método G.R.O.W"
        titulo="Quatro etapas para sair do imprevisível"
        apoio="Nada de fórmula mágica. É processo — o mesmo que roda em todas as contas da MR Grow, com responsável, prazo e indicador em cada etapa."
        antes={
          <Image
            src="/marca/grow-roda.webp"
            alt="Roda do método G.R.O.W: Ground, Reach, Optimize e Win"
            width={720}
            height={720}
            sizes="140px"
            className="roda"
          />
        }
      />

      <div className="pilares espaco">
        {PILARES.map((p) => (
          <article className="pilar vidro" key={p.letra}>
            <div className="pilar__topo">
              <span className="pilar__letra" aria-hidden>
                {p.letra}
              </span>
              <div>
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
