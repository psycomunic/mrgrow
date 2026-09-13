import { BorderBeamPanel } from "@/components/ui/border-beam-panel";
import { Secao, CabecaSecao } from "./secao";

/**
 * Os três escopos da assessoria, sem valor.
 *
 * Conteúdo transcrito da proposta comercial da agência. Cada escopo
 * lista as entregas por inteiro, como no documento: aqui não cabe
 * resumir em "tudo do anterior", porque os planos não são cumulativos
 * item a item e o leitor precisa conferir o que exatamente recebe.
 *
 * O lugar do preço é ocupado pelo volume mensal de conteúdo, que é o
 * eixo em que os escopos escalam e o que a pessoa compara para se
 * reconhecer em um deles. A unidade muda em cada um de propósito: no
 * Basic são artes, no Pro são posts entre feed e reels, no Premium são
 * conteúdos. Chamar tudo de "conteúdo" apagaria a diferença.
 */
const PLANOS = [
  {
    nome: "Grow Basic",
    linha: "Estratégia, conteúdo base e tráfego",
    para: "Para organizar o marketing e sair do improviso, com estrutura interna para executar parte da produção",
    volume: "6 a 8",
    unidade: "artes por mês",
    itens: [
      "Planejamento estratégico mensal de marketing",
      "Cronograma mensal de conteúdo",
      "Direcionamento dos temas para redes sociais",
      "Scripts estratégicos para gravação de vídeos",
      "Roteiro de stories para execução interna",
      "Planejamento das campanhas de tráfego pago",
      "Gestão de tráfego pago com análise de performance",
      "Relatórios mensais de resultados",
      "1 reunião estratégica mensal",
      "Grupo de WhatsApp para acompanhamento",
    ],
    nota: "Você grava os vídeos seguindo os roteiros aprovados e envia para a Grow editar e usar na estratégia.",
  },
  {
    nome: "Grow Pro",
    linha: "Conteúdo, tráfego e posicionamento",
    para: "Para profissionalizar a presença digital e parar de depender de conteúdo feito no improviso",
    volume: "12",
    unidade: "posts por mês, entre feed e reels",
    destaque: true,
    itens: [
      "Planejamento estratégico mensal de marketing",
      "Cronograma mensal de conteúdo e roteiro de stories",
      "Scripts estratégicos para gravação de vídeos",
      "Edição e produção de vídeos e legendas",
      "Gestão de tráfego pago com análise de performance",
      "Relatórios mensais de resultados",
      "1 reunião estratégica mensal",
      "1 visita mensal presencial da social media",
      "Grupo de WhatsApp para acompanhamento",
    ],
    nota: "A nossa social media vai até você captar, então o vídeo sai sem depender da sua agenda.",
  },
  {
    nome: "Grow Premium",
    linha: "Conteúdo, tráfego multicanal e posicionamento avançado",
    para: "Para acelerar a geração de demanda com mais volume, mais acompanhamento e mais fontes de tráfego",
    volume: "20",
    unidade: "conteúdos por mês, cerca de 5 por semana",
    itens: [
      "Planejamento estratégico mensal de marketing",
      "Cronograma mensal de conteúdo e roteiro de stories",
      "Scripts estratégicos para gravação de vídeos",
      "Edição e produção de vídeos e legendas",
      "Gestão de tráfego pago no Meta Ads",
      "Gestão de tráfego pago no Google Ads",
      "Análise de performance das campanhas",
      "Relatórios mensais de resultados",
      "1 reunião estratégica mensal",
      "2 visitas mensais presenciais para captação",
      "Grupo de WhatsApp para acompanhamento",
    ],
    nota: "Duas frentes de mídia e o dobro de captação presencial, para testar e escalar mais rápido.",
  },
];

export function Planos() {
  return (
    <Secao id="planos">
      <CabecaSecao
        chapeu="Escopos"
        titulo="Escolha o nível de crescimento"
        apoio="Estratégia, conteúdo e tráfego para a sua marca sair do improviso e crescer com direção. O investimento sai no diagnóstico, junto do escopo fechado para o seu caso."
      />

      <div className="planos espaco">
        {PLANOS.map((p) => {
          const cartao = (
            <div className={p.destaque ? "plano plano--destaque" : "plano vidro"}>
              {p.destaque && <span className="plano__selo">O mais recomendado</span>}

              <h3>{p.nome}</h3>
              <p className="plano__linha">{p.linha}</p>
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
