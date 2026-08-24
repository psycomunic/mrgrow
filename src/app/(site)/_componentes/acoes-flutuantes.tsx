"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { linkWhatsApp } from "@/lib/marca";
import { rastrear } from "@/lib/rastreamento";
import { cn } from "@/lib/utils";

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
      {/* CTA fixo no mobile */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/90 p-3 backdrop-blur-xl transition-transform duration-300 sm:hidden",
          visivel ? "translate-y-0" : "translate-y-full",
        )}
      >
        <a
          href="#diagnostico"
          onClick={() => rastrear("clique_cta_fixo")}
          className="flex h-12 w-full items-center justify-center rounded-md bg-mrg-500 text-sm font-semibold text-white"
        >
          Quero meu diagnóstico gratuito
        </a>
      </div>

      <div className="fixed right-4 bottom-20 z-40 flex flex-col gap-2 sm:right-6 sm:bottom-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Voltar ao topo"
          className={cn(
            "grid size-11 place-items-center rounded-full border border-white/10 bg-ink-900/90 text-ink-200 backdrop-blur transition-all hover:bg-ink-800 foco-anel",
            visivel ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <ArrowUp className="size-5" />
        </button>

        <a
          href={linkWhatsApp()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => rastrear("Contact", { canal: "whatsapp" })}
          aria-label="Falar no WhatsApp"
          className="grid size-13 place-items-center rounded-full bg-sucesso text-ink-950 shadow-[0_12px_34px_-10px_rgba(18,185,129,.9)] transition-transform hover:scale-105 foco-anel"
        >
          <MessageCircle className="size-6" />
        </a>
      </div>
    </>
  );
}
