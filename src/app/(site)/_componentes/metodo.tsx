import Image from "next/image";
import { Secao, CabecaSecao } from "./secao";

/**
 * O método G.R.O.W como a agência o define na proposta comercial.
 *
 * Não são etapas em ordem cronológica: Results vem antes de Optimization
 * no acrônimo porque a palavra manda, não o calendário, e Winner Mind é
 * postura de trabalho, não fase de projeto. Por isso os cartões não
 * carregam numeração de passo, ao contrário da seção "Como funciona",
 * onde a ordem é informação de verdade.
 */
const PILARES = [
  {
    letra: "G",
    titulo: "Goals · Metas",
    resumo: "Onde queremos chegar e como medir",
    itens: [
      "Definir cronograma e atribuições",
      "Estabelecer os indicadores-chave de desempenho (KPIs)",
      "Implementação de novos canais de aquisição",
      "Comunicação clara e objetiva",
    ],
  },
  {
    letra: "R",
    titulo: "Results · Resultados",
    resumo: "Mensuração, relatório e leitura contínua",
    itens: [
      "Ferramentas de mensuração de resultado, CRM e desenvolvimento",
      "Apresentação de relatórios e análise de performance mensal",
      "Integração das principais plataformas de anúncio, Google e Meta",
      "Grupo de acompanhamento do projeto",
      "Análise diária buscando melhoria contínua",
    ],
  },
  {
    letra: "O",
    titulo: "Optimization · Otimização",
    resumo: "O que rende mais e onde investir",
    itens: [
      "Mapear os produtos e serviços que despertam mais interesse e os que mais vendem",
      "Monitorar o ROI por mídia para aumentar a rentabilidade do investimento",
      "Administração dos investimentos em mídia paga",
      "Manter os clientes novos envolvidos com conteúdo estratégico e redes sociais",
      "Implementar estratégias e ações comerciais para aumento do faturamento",
      "Comunicação criativa focada em criar movimento de marca",
      "Elaboração de conteúdos que conversem com as estratégias propostas",
    ],
  },
  {
    letra: "W",
    titulo: "Winner Mind · Mente campeã",
    resumo: "O que depende de nós e o que depende de você",
    itens: [
      "Mentalidade de crescimento",
      "Comemorar todas as conquistas, seja uma grande venda, o primeiro reels gravado ou uma campanha assertiva de tráfego",
      "Trabalho a quatro mãos: a gente faz a nossa parte e precisa que você faça a sua",
      "Foco no médio e longo prazo, nada se faz da noite para o dia",
      "Com todos esses checkpoints alinhados, o sucesso do seu projeto é inevitável",
    ],
  },
];

export function Metodo() {
  return (
    <Secao id="metodo">
      <CabecaSecao
        chapeu="Método G.R.O.W"
        titulo="Quatro pilares para sair do imprevisível"
        apoio="Nada de fórmula mágica. É processo: o mesmo que roda em todas as contas da MR Grow, da definição da meta até a mentalidade com que a conta é tocada."
        antes={
          <Image
            src="/marca/grow-roda.webp"
            alt="Roda do método G.R.O.W: Goals, Results, Optimization e Winner Mind"
            width={720}
            height={720}
            sizes="(max-width: 40rem) 100vw, 140px"
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
