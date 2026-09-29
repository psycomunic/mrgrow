"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** O evento que o Chrome dispara quando o app é instalável. Não está no lib.dom. */
type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CHAVE_ADIADO = "mrg-instalar-adiado";
/* Adiar esconde por uma semana, não para sempre. "Agora não" quase nunca
   quer dizer "nunca" — e um convite que some de vez deixa quem mudou de
   ideia sem caminho, porque o ícone da barra de endereço é discreto
   demais para ser encontrado por acaso. */
const DIAS_ADIADO = 7;

/**
 * Convite para instalar a plataforma como aplicativo.
 *
 * No Mac com Chrome, instalar tira a barra de endereço, põe o ícone no
 * Dock e faz a plataforma abrir como programa — em vez de mais uma aba
 * perdida entre vinte.
 *
 * O Chrome guarda o evento de instalação e só o dispara quando decide
 * que o site se qualifica. Não dá para forçar: o que este componente faz
 * é segurar o evento quando ele chega e oferecer o botão num lugar que a
 * pessoa olha, em vez de depender do ícone discreto na barra de endereço.
 */
export function ConviteInstalacao() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [visivel, setVisivel] = useState(false);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    /* Já instalado abre em janela própria: oferecer instalação ali seria
       oferecer o que a pessoa já tem. */
    const jaInstalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      // O Safari usa uma propriedade própria, fora do padrão.
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (jaInstalado) return;

    let adiadoAte = 0;
    try {
      adiadoAte = Number(localStorage.getItem(CHAVE_ADIADO) ?? 0);
    } catch {
      /* Armazenamento bloqueado em janela anônima. Sem memória do adiamento
         o convite reaparece, que é melhor que não aparecer nunca. */
    }

    const aoPoderInstalar = (e: Event) => {
      // Sem isto o Chrome mostra o próprio aviso, e ficariam dois.
      e.preventDefault();
      setEvento(e as EventoInstalacao);
      if (Date.now() > adiadoAte) setVisivel(true);
    };

    const aoInstalar = () => {
      setVisivel(false);
      setEvento(null);
    };

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (!visivel || !evento) return null;

  async function instalar() {
    if (!evento) return;
    setInstalando(true);
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setInstalando(false);

    if (outcome === "accepted") {
      setVisivel(false);
      return;
    }
    /* Recusou na caixa do Chrome: o evento não serve mais, e insistir na
       mesma sessão seria teimosia. */
    adiar();
  }

  function adiar() {
    setVisivel(false);
    try {
      localStorage.setItem(CHAVE_ADIADO, String(Date.now() + DIAS_ADIADO * 86_400_000));
    } catch {
      /* Sem armazenamento, volta no próximo carregamento. Tudo bem. */
    }
  }

  return (
    <div
      role="region"
      aria-label="Instalar a plataforma"
      className={cn(
        "cartao flex flex-col gap-3 rounded-lg border-acento/30 bg-acento/8 p-4",
        "sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-acento/15 text-acento">
          <Download className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-tinta">Instale a plataforma no seu computador</p>
          <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-grafite">
            Vira um aplicativo com ícone próprio, abre em janela sem barra de endereço e para de se
            perder entre as abas. Os dados continuam os mesmos.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:ml-4">
        <button
          onClick={instalar}
          disabled={instalando}
          className="foco-anel inline-flex h-9 items-center gap-1.5 rounded-full bg-acento px-4 text-xs font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          <Download className="size-4" />
          {instalando ? "Instalando…" : "Instalar"}
        </button>
        <button
          onClick={adiar}
          aria-label="Agora não"
          title="Agora não"
          className="foco-anel rounded-full p-2 text-cinza transition-colors hover:bg-nevoa hover:text-tinta"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Registra o service worker.
 *
 * Fica separado do convite porque precisa rodar mesmo quando o convite
 * não aparece: é o service worker que dá a página de "sem conexão" a quem
 * já instalou, e é ele que o Chrome exige para considerar o site
 * instalável.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    /* Depois do `load`: registrar durante o carregamento disputa banda com
       o que a pessoa está esperando ver. */
    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Falha aqui custa a instalação e a página de offline, não o
           painel. Não vale um aviso na tela de quem só quer trabalhar. */
      });
    };
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return null;
}
