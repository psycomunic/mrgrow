import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { MARCA, linkWhatsApp } from "@/lib/marca";

const NAV = [
  { h: "#trabalho", r: "Trabalho" },
  { h: "#contato", r: "Contato" },
];

const NUMEROS = [
  { v: "R$ 18M+", r: "gerenciados em mídia paga" },
  { v: "4,7x", r: "ROAS médio das contas ativas" },
  { v: "92%", r: "de retenção de clientes" },
  { v: "48h", r: "para colocar a operação no ar" },
];

const CLIENTES = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, "0"));

const TRABALHO = [
  { a: "manalinda-fitness", n: "Mana Linda Fitness", s: "Moda fitness", t: "E-commerce", h: 3045 },
  { a: "casalinda", n: "Casa Linda", s: "Casa e decoração", t: "E-commerce", h: 3526 },
  { a: "sneakpeak", n: "SneakPeak", s: "Sneakers", t: "E-commerce", h: 1350 },
  { a: "pro-pay", n: "Pro Pay", s: "Meios de pagamento", t: "Institucional", h: 5049 },
  { a: "doris-kids", n: "Doris Kids", s: "Moda infantil", t: "E-commerce", h: 2467 },
  { a: "guardpay", n: "GuardPay", s: "Meios de pagamento", t: "Landing page", h: 2173 },
];

export default function PaginaEstudo() {
  return (
    <>
      <header className="topo">
        <div className="area topo__linha">
          <a href="#" aria-label={MARCA.nome} style={{ display: "flex", flexShrink: 0 }}>
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

          <a href="#contato" className="acao acao--azul acao--mini">
            Diagnóstico gratuito
          </a>
        </div>
      </header>

      <main>
        <section className="cartaz">
          <div className="area cartaz__grade">
            <div className="cartaz__texto">
              <span className="chapeu">
                <i />
                Assessoria de performance
              </span>

              <h1>
                Seu anúncio não precisa de mais alcance.
                <br />
                Precisa de <mark>mais vendas</mark>
              </h1>

              <p className="cartaz__linha">
                Tráfego, criativo, página e rastreamento numa operação só — com painel aberto para
                você conferir cada real investido e o que ele trouxe de volta.
              </p>

              <div className="cartaz__acoes">
                <a href="#contato" className="acao acao--azul">
                  Quero meu diagnóstico
                  <ArrowRight size={17} />
                </a>
                <a
                  href={linkWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acao acao--linha"
                >
                  Falar com o Mateus
                </a>
              </div>

              <p className="cartaz__nota">
                Análise gratuita da sua conta em até 24h · sem compromisso
              </p>
            </div>

            <figure className="retrato">
              <Image
                src="/marca/mateus.webp"
                alt={`${MARCA.fundador}, fundador da ${MARCA.nome}`}
                width={1147}
                height={1246}
                sizes="(max-width: 992px) 90vw, 544px"
                priority={false}
                loading="eager"
              />
              <figcaption className="retrato__cita">
                Você não precisa confiar na palavra da agência. Precisa ver os números.
                <b>{MARCA.fundador}</b>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="faixa">
          <div className="area">
            <dl className="faixa__grade">
              {NUMEROS.map((n) => (
                <div className="faixa__item" key={n.r}>
                  <dt>{n.v}</dt>
                  <dd>{n.r}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mural">
          <div className="area">
            <p className="mural__rot">Marcas que já passaram pela nossa operação</p>
            <ul>
              {CLIENTES.map((n) => (
                <li key={n}>
                  <Image
                    src={`/clientes/${n}.webp`}
                    alt=""
                    aria-hidden
                    width={944}
                    height={432}
                    sizes="(max-width: 640px) 30vw, 130px"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="secao" id="trabalho">
          <div className="area">
            <div className="secao__cabeca">
              <div>
                <span className="chapeu">
                  <i />
                  Trabalho
                </span>
                <h2>Páginas feitas para vender, não para enfeitar</h2>
              </div>
              <p className="secao__apoio">
                Todo site que entregamos nasce com rastreamento, velocidade e um caminho claro até
                a compra. Passe o mouse para percorrer a página inteira.
              </p>
            </div>

            <div className="obras">
              {TRABALHO.map((p) => (
                <figure className="obra" key={p.a}>
                  <div className="obra__quadro">
                    <Image
                      src={`/portfolio/${p.a}.webp`}
                      alt={`Site desenvolvido para ${p.n}`}
                      width={768}
                      height={p.h}
                      sizes="(max-width: 768px) 100vw, (max-width: 1216px) 50vw, 400px"
                    />
                  </div>
                  <figcaption className="obra__pe">
                    <div>
                      <p className="obra__nome">{p.n}</p>
                      <p className="obra__seg">{p.s}</p>
                    </div>
                    <span className="obra__tipo">{p.t}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="fecho" id="contato">
          <div className="area fecho__grade">
            <div>
              <span className="chapeu">
                <i />
                Diagnóstico gratuito
              </span>
              <h2>Descubra o que está travando o seu resultado</h2>
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
              className="acao acao--azul"
            >
              Começar pelo WhatsApp
              <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
