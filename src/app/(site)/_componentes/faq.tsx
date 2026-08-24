"use client";

import { useState } from "react";
import { Secao, CabecaSecao } from "./secao";
import { PERGUNTAS } from "./faq-dados";

export function Faq() {
  const [aberto, setAberto] = useState<number | null>(0);

  return (
    <Secao id="faq">
      <CabecaSecao chapeu="Dúvidas" titulo="O que perguntam antes de começar" />

      <div className="faq espaco">
        {PERGUNTAS.map((item, i) => {
          const ativo = aberto === i;
          return (
            <div className="faq__item vidro" key={item.p}>
              <button
                className="faq__pergunta"
                onClick={() => setAberto(ativo ? null : i)}
                aria-expanded={ativo}
              >
                {item.p}
                <span className="faq__sinal" aria-hidden>
                  {ativo ? "−" : "+"}
                </span>
              </button>

              <div className={ativo ? "faq__corpo faq__corpo--aberto" : "faq__corpo"}>
                <div>
                  <p>{item.r}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Secao>
  );
}
