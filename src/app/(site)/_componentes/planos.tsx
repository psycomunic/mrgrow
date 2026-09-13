import { BorderBeamPanel } from "@/components/ui/border-beam-panel";
import { Secao, CabecaSecao } from "./secao";

/**
 * Os três escopos da assessoria, sem valor.
 *
 * O lugar do preço é ocupado pelo volume mensal de conteúdo, que é o
 * eixo real em que os escopos escalam: é o que mais muda de um para o
 * outro e o que a pessoa precisa comparar para se reconhecer em um
 * deles. Preço sai no diagnóstico, junto do escopo fechado.
 *
 * Cada escopo lista só o que ele acrescenta ao anterior. Repetir a
 * lista inteira nos três faria o leitor caçar a diferença.
 */
const PLANOS = [
  {
    nome: "Grow Basic",
    para: "Para sair do improviso e ter presença constante",
    volume: "6 a 8",
    unidade: "conteúdos por mês",
    itens: [
      "Planejamento estratégico mensal de marketing",
      "Cronograma mensal de conteúdo",
      "Conteúdo para feed e reels",
      "Scripts estratégicos para gravação de vídeos",
      "Edição, produção e legendas",
      "Gestão de tráfego no Meta Ads com análise de performance",
      "Relatório mensal de resultados",
      "Grupo de WhatsApp para acompanhamento",
    ],
    nota: "A captação é sua, com o roteiro já pronto e aprovado.",
  },
  {
    nome: "Grow Pro",
    para: "Para quem já tem constância e quer escalar",
    volume: "12",
    unidade: "conteúdos por mês",
    destaque: true,
    itens: [
      "Tudo do Grow Basic",
      "Roteiro de stories",
      "1 visita mensal para captação presencial",
      "Reunião estratégica mensal",
    ],
    nota: "A nossa social media vai até você gravar.",
  },
  {
    nome: "Grow Premium",
    para: "Para volume alto e as duas frentes de mídia",
    volume: "20",
    unidade: "conteúdos por mês",
    itens: [
      "Tudo do Grow Pro",
      "2 visitas mensais para captação presencial",
      "Gestão de tráfego no Meta Ads e no Google Ads",
    ],
    nota: "Cobertura de campanha nas duas plataformas.",
  },
];

export function Planos() {
  return (
    <Secao id="planos">
      <CabecaSecao
        chapeu="Escopos"
        titulo="Escolha o nível de crescimento"
        apoio="Estratégia, conteúdo e tráfego em três profundidades. O investimento sai no diagnóstico, junto do escopo fechado para o seu caso."
      />

      <div className="planos espaco">
        {PLANOS.map((p) => {
          const cartao = (
            <div className={p.destaque ? "plano plano--destaque" : "plano vidro"}>
              {p.destaque && <span className="plano__selo">O mais contratado</span>}

              <h3>{p.nome}</h3>
              <p className="plano__para">{p.para}</p>

              <p className="plano__valor">
                <span className="plano__volume">{p.volume}</span>
                <span className="plano__unidade">{p.unidade}</span>
              </p>

              <ul>
                {p.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>

              <p className="plano__nota">{p.nota}</p>

              <a
                href="#diagnostico"
                className={p.destaque ? "acao acao--azul" : "acao acao--linha"}
              >
                Quero este escopo
              </a>
            </div>
          );

          // Só o escopo recomendado ganha o feixe, é ele que a página quer que
          // você escolha. Nos outros, a moldura seria ruído.
          return p.destaque ? (
            <BorderBeamPanel
              key={p.nome}
              radius={0}
              thickness={2}
              beams={1}
              idleSpeed={11}
              hoverSpeed={34}
              colors={["#7fb2ff"]}
              className="plano-feixe !border-transparent !bg-transparent !p-0"
            >
              {cartao}
            </BorderBeamPanel>
          ) : (
            <div key={p.nome} style={{ display: "flex" }}>
              {cartao}
            </div>
          );
        })}
      </div>

      <p className="planos__nota">
        O investimento em mídia é pago diretamente por você às plataformas e não entra no valor da
        assessoria.
      </p>
    </Secao>
  );
}
