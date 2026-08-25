import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { MARCA, linkWhatsApp } from "@/lib/marca";

const NUMEROS = [
  { v: "R$ 18M+", r: "gerenciados em mídia paga" },
  { v: "4,7x", r: "ROAS médio das contas ativas" },
  { v: "92%", r: "de retenção de clientes" },
  { v: "48h", r: "para colocar a operação no ar" },
];

export function Hero() {
  return (
    <>
      <section className="cartaz">
        {/* Foto do escritório sangrando no fundo inteiro. `priority` porque
            é o maior elemento acima da dobra, sem isso o LCP sofre. */}
        <div className="cartaz__fundo">
          <Image
            src="/marca/hero-fundo.webp"
            alt={`${MARCA.fundador} no escritório da ${MARCA.nome}`}
            width={2048}
            height={1152}
            sizes="100vw"
            priority
            fetchPriority="high"
          />
        </div>

        <div className="area cartaz__grade">
          <div className="cartaz__texto">
            <span className="chapeu">
              <i />
              Assessoria de performance
            </span>

            <h1>
              Seu anúncio não precisa de mais alcance.
              <br />
              Precisa de <em>mais vendas</em>
            </h1>

            <p className="cartaz__linha">
              Tráfego, criativo, página e rastreamento numa operação só, com painel aberto para
              você conferir cada real investido e o que ele trouxe de volta.
            </p>

            <div className="cartaz__acoes">
              <a href="#diagnostico" className="acao acao--azul">
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
    </>
  );
}
