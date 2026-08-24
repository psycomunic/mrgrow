"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { linkWhatsApp } from "@/lib/marca";
import { rastrear } from "@/lib/rastreamento";

export function AcoesFlutuantes() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > 600);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <>
      <div className="barra-fixa" data-visivel={visivel ? "sim" : "nao"}>
        <a
          href="#diagnostico"
          onClick={() => rastrear("clique_cta_fixo")}
          className="acao acao--azul acao--largo"
        >
          Quero meu diagnóstico gratuito
        </a>
      </div>

      <div className="flutuantes">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Voltar ao topo"
          className="flutuante"
          data-visivel={visivel ? "sim" : "nao"}
        >
          <ArrowUp size={18} />
        </button>

        <a
          href={linkWhatsApp()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => rastrear("Contact", { canal: "whatsapp" })}
          aria-label="Falar no WhatsApp"
          className="flutuante flutuante--zap"
        >
          <MessageCircle size={22} />
        </a>
      </div>
    </>
  );
}
