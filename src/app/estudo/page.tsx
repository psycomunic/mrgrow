import Image from "next/image";
import { ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import { MARCA, linkWhatsApp } from "@/lib/marca";

const NAV = [
  { h: "#servicos", r: "Serviços" },
  { h: "#trabalho", r: "Trabalho" },
  { h: "#contato", r: "Contato" },
];

const SERIE = [22, 30, 27, 41, 38, 52, 49, 63, 58, 74, 81, 96];

const REGUA = [
  { v: "R$ 18M+", r: "gerenciados em mídia paga" },
  { v: "4,7x", r: "ROAS médio das contas ativas" },
  { v: "92%", r: "de retenção de clientes" },
  { v: "48h", r: "para colocar a operação no ar" },
];

const SERVICOS = [
  {
    n: "01",
    t: "Gestão de tráfego",
    d: "Meta Ads e Google Ads trabalhando juntos, com estrutura por temperatura de público e leitura diária da conta.",
    tags: ["Meta Ads", "Google Ads", "Advantage+"],
  },
  {
    n: "02",
    t: "Criativos que vendem",
    d: "Roteiro, edição e variação. Matriz de ângulos testada semana a semana, com vencedor documentado.",
    tags: ["Reels", "Estático", "UGC"],
  },
  {
    n: "03",
    t: "Landing pages",
    d: "Página construída para converter: oferta clara, prova, velocidade e teste A/B contínuo.",
    tags: ["Copy", "Design", "Teste A/B"],
  },
  {
    n: "04",
    t: "Rastreamento e dados",
    d: "GA4, GTM, Pixel e API de Conversões. A plataforma só otimiza bem quando enxerga direito.",
    tags: ["GA4", "CAPI", "Server-side"],
  },
  {
    n: "05",
    t: "Painel ao vivo",
    d: "Investimento, retorno e projeção em tempo real. Você não espera o relatório do fim do mês.",
    tags: ["Tempo real", "CRM", "Metas"],
  },
  {
    n: "06",
    t: "Operação comercial",
    d: "CRM com funil, follow-up e SLA de resposta, para o lead não morrer entre a mídia e a venda.",
    tags: ["Funil", "SLA", "Automação"],
  },
];

const TRABALHO = [
  { a: "manalinda-fitness", n: "Mana Linda Fitness", s: "Moda fitness", t: "E-commerce", h: 3045 },
  { a: "casalinda", n: "Casa Linda", s: "Casa e decoração", t: "E-commerce", h: 3526 },
  { a: "sneakpeak", n: "SneakPeak", s: "Sneakers", t: "E-commerce", h: 1350 },
  { a: "pro-pay", n: "Pro Pay", s: "Meios de pagamento", t: "Institucional", h: 5049 },
  { a: "doris-kids", n: "Doris Kids", s: "Moda infantil", t: "E-commerce", h: 2467 },
  { a: "guardpay", n: "GuardPay", s: "Meios de pagamento", t: "Landing page", h: 2173 },
];

export default function PaginaEstudo() {
  const maximo = Math.max(...SERIE);

  return (
    <>
      <header className="topo">
        <div className="area topo__linha">
          <a href="#" className="topo__marca" aria-label={MARCA.nome}>
            <Image
              src="/marca/mr-grow-logo.webp"
              alt={MARCA.nome}
              width={1400}
              height={728}
              style={{ height: "2.15rem", width: "auto" }}
              loading="eager"
              fetchPriority="high"
            />
          </a>

          <nav className="topo__nav">
            {NAV.map((l) => (
              <a key={l.h} href={l.h}>
                {l.r}
              </a>
            ))}
          </nav>

          <a href="#contato" className="acao acao--forte acao--mini">
            Diagnóstico gratuito
          </a>
        </div>
      </header>

      <main>
        <section className="abertura">
          <div className="area abertura__grade">
            <div>
              <span className="selo sobe">
                <b>●</b> Vagas limitadas para o próximo ciclo
              </span>

              <h1 className="display sobe sobe--2">
                Seu anúncio não precisa de mais alcance.
                <br />
                Precisa de <span>mais vendas</span>.
              </h1>

              <p className="corpo abertura__texto sobe sobe--3">
                A MR Grow monta a estrutura completa que transforma investimento em anúncios em
                faturamento previsível: tráfego, criativo, página, rastreamento e um painel onde
                você acompanha cada real — em tempo real.
              </p>

              <div className="abertura__acoes sobe sobe--3">
                <a href="#contato" className="acao acao--forte">
                  Quero meu diagnóstico
                  <ArrowRight size={17} />
                </a>
                <a
                  href={linkWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acao acao--fantasma"
                >
                  Falar com um especialista
                </a>
              </div>

              <p className="abertura__pe sobe sobe--3">
                <ShieldCheck size={15} />
                Análise gratuita da sua conta em até 24h · sem compromisso
              </p>
            </div>

            <div className="painel sobe sobe--4">
              <div className="painel__caixa">
                <div className="painel__barra">
                  <i />
                  <i />
                  <i />
                  <span className="painel__url">painel.mrgrow.com.br</span>
                </div>

                <div className="painel__corpo">
                  <div className="painel__topo">
                    <div>
                      <p className="painel__rot">Faturamento atribuído · últimos 30 dias</p>
                      <p className="painel__valor">R$ 487.320</p>
                    </div>
                    <span className="painel__alta">
                      <TrendingUp size={13} /> +38,4%
                    </span>
                  </div>

                  <div className="grafico" aria-hidden>
                    {SERIE.map((v, i) => (
                      <i key={i} style={{ height: `${(v / maximo) * 100}%` }} />
                    ))}
                  </div>

                  <dl className="painel__medidas">
                    {[
                      { r: "Investimento", v: "R$ 103.900" },
                      { r: "ROAS", v: "4,69x" },
                      { r: "CPL", v: "R$ 11,40" },
                    ].map((m) => (
                      <div className="medida" key={m.r}>
                        <dt>{m.r}</dt>
                        <dd>{m.v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="area">
            <dl className="regua">
              {REGUA.map((n) => (
                <div key={n.r}>
                  <dt>{n.v}</dt>
                  <dd>{n.r}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="secao" id="servicos">
          <div className="area">
            <div className="secao__cabeca">
              <div>
                <span className="kicker">O que entregamos</span>
                <h2>
                  Uma operação inteira, não um <span>serviço solto</span>.
                </h2>
              </div>
              <p className="corpo">
                Tráfego sozinho não resolve. A gente cuida de todas as peças que decidem se o seu
                investimento vira venda — e responde por todas elas.
              </p>
            </div>

            <div className="servicos">
              {SERVICOS.map((s) => (
                <article className="servico" key={s.n}>
                  <span className="servico__num">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <div className="pilulas">
                    {s.tags.map((t) => (
                      <span className="pilula" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="secao secao--linha" id="trabalho">
          <div className="area">
            <div className="secao__cabeca">
              <div>
                <span className="kicker">Trabalho</span>
                <h2>
                  Páginas feitas para <span>vender</span>, não para enfeitar.
                </h2>
              </div>
              <p className="corpo">
                Todo site que entregamos nasce com rastreamento, velocidade e um caminho claro até
                a compra. Passe o mouse para percorrer a página inteira.
              </p>
            </div>

            <div className="obras">
              {TRABALHO.map((p) => (
                <figure className="obra" key={p.a}>
                  <div className="obra__janela">
                    <div className="obra__quadro">
                      <Image
                        src={`/portfolio/${p.a}.webp`}
                        alt={`Site desenvolvido para ${p.n}`}
                        width={768}
                        height={p.h}
                        sizes="(max-width: 768px) 100vw, (max-width: 1216px) 50vw, 400px"
                      />
                    </div>
                  </div>
                  <figcaption className="obra__pe">
                    <div>
                      <p className="obra__nome">{p.n}</p>
                      <p className="obra__seg">{p.s}</p>
                    </div>
                    <span className="tag">{p.t}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="fecho" id="contato">
          <div className="area">
            <div className="fecho__caixa">
              <div>
                <span className="kicker kicker--solto">Diagnóstico gratuito</span>
                <h2>Descubra o que está travando o seu resultado.</h2>
                <p>
                  Auditamos a estrutura de campanhas, o rastreamento e a página de destino, e
                  devolvemos os três gargalos que mais custam dinheiro hoje. Atendemos um número
                  limitado de contas novas por mês.
                </p>
              </div>

              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="acao acao--forte"
              >
                Começar pelo WhatsApp
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
