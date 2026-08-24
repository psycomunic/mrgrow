import { Faixa } from "./faixa";
import { MARCA, linkWhatsApp } from "@/lib/marca";

export function Hero() {
  return (
    <section className="abertura">
      <div className="limite">
        <div className="abertura__meta">
          <span className="etiqueta etiqueta--azul">
            <span className="ponto" />
            Aceitando contas para o próximo ciclo
          </span>
          <span className="etiqueta">
            Assessoria de performance · {MARCA.fundador}
          </span>
        </div>

        <h1 className="titulao">
          Toda agência mostra o alcance.
          <br />A gente mostra <em>a conta</em>.
        </h1>

        <div className="abertura__base">
          <div>
            <p className="abertura__texto">
              Tráfego, criativo, página e rastreamento numa operação só. E um painel aberto, com o
              seu login, onde você confere para onde foi cada real e o que ele trouxe de volta.
            </p>
            <p className="abertura__nota">
              Analisamos a sua conta e devolvemos um parecer em até 24 horas úteis. Se não fizer
              sentido trabalharmos juntos, a gente diz.
            </p>
          </div>

          <div className="abertura__acoes">
            <a href="#diagnostico" className="bt bt--claro">
              Pedir diagnóstico
            </a>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="bt bt--linha"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>

      <Faixa />
    </section>
  );
}
