"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

/** O evento que Chrome e Edge disparam quando o app é instalável. Não está no lib.dom. */
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

type Plataforma = "automatica" | "ios" | "nenhuma";

/**
 * Convite para instalar a plataforma como aplicativo.
 *
 * Funciona em três mundos, e eles se comportam de forma diferente:
 *
 * · **Chrome e Edge**, no Windows, no Mac e no Android, avisam quando o
 *   site se qualifica e deixam abrir a caixa de instalação por código.
 *   Ali o convite tem botão, e um clique resolve.
 *
 * · **iPhone e iPad** não têm esse evento. O Safari só instala pelo menu
 *   Compartilhar, e o próprio Safari não avisa que dá. Sem uma instrução
 *   na tela, ninguém descobre — então ali o convite vira um passo a
 *   passo em vez de um botão.
 *
 * · **Firefox no computador** não instala, e nada é mostrado: oferecer o
 *   que o navegador não faz é pior que ficar calado.
 */
export function ConviteInstalacao() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  /* Plataforma e visibilidade num estado só: elas sempre mudam juntas, e
     separadas obrigavam duas atualizações seguidas dentro do efeito. */
  const [estado, setEstado] = useState<{ plataforma: Plataforma; visivel: boolean }>({
    plataforma: "nenhuma",
    visivel: false,
  });
  const [instalando, setInstalando] = useState(false);
  const { plataforma, visivel } = estado;

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
    const podeMostrar = Date.now() > adiadoAte;

    const ua = navigator.userAgent;
    /* iPad moderno se apresenta como Mac; o toque é o que o separa de um
       Mac de verdade, onde o Chrome resolve pelo evento. */
    const ehIOS =
      /iphone|ipod|ipad/i.test(ua) ||
      (/Macintosh/.test(ua) && typeof document !== "undefined" && navigator.maxTouchPoints > 1);
    const ehSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);

    if (ehIOS && ehSafari) {
      /* Descoberta de capacidade do aparelho, feita uma vez: não há dado
         derivado que volte a mudar o estado, então não encadeia render. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstado({ plataforma: "ios", visivel: podeMostrar });
      return;
    }

    const aoPoderInstalar = (e: Event) => {
      // Sem isto o Chrome mostra o próprio aviso, e ficariam dois.
      e.preventDefault();
      setEvento(e as EventoInstalacao);
      setEstado({ plataforma: "automatica", visivel: podeMostrar });
    };

    const aoInstalar = () => {
      setEstado((e) => ({ ...e, visivel: false }));
      setEvento(null);
    };

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  function adiar() {
    setEstado((e) => ({ ...e, visivel: false }));
    try {
      localStorage.setItem(CHAVE_ADIADO, String(Date.now() + DIAS_ADIADO * 86_400_000));
    } catch {
      /* Sem armazenamento, volta no próximo carregamento. Tudo bem. */
    }
  }

  async function instalar() {
    if (!evento) return;
    setInstalando(true);
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setInstalando(false);

    if (outcome === "accepted") {
      setEstado((e) => ({ ...e, visivel: false }));
      return;
    }
    /* Recusou na caixa do navegador: o evento não serve mais, e insistir
       na mesma sessão seria teimosia. */
    adiar();
  }

  if (!visivel || plataforma === "nenhuma") return null;

  return (
    <div
      role="region"
      aria-label="Instalar a plataforma"
      className="cartao rounded-lg border-acento/30 bg-acento/8 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-acento/15 text-acento">
            <Download className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-tinta">
              Instale a plataforma como aplicativo
            </p>
            <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-grafite">
              Ganha ícone próprio, abre em janela sem barra de endereço e para de se perder entre as
              abas. Os dados continuam os mesmos, em qualquer aparelho.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:ml-4">
          {plataforma === "automatica" && (
            <button
              onClick={instalar}
              disabled={instalando}
              className="foco-anel inline-flex h-9 items-center gap-1.5 rounded-full bg-acento px-4 text-xs font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
            >
              <Download className="size-4" />
              {instalando ? "Instalando…" : "Instalar"}
            </button>
          )}
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

      {/* No iPhone não há botão possível: o Safari só instala pelo menu
          Compartilhar, e não avisa que dá. Sem o passo a passo, ninguém
          descobre. */}
      {plataforma === "ios" && (
        <ol className="mt-3 space-y-2 border-t border-acento/20 pt-3 text-[13px] text-grafite">
          <li className="flex items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-acento/15 text-[10px] font-bold text-acento">
              1
            </span>
            Toque em <Share className="size-4 text-acento" aria-label="Compartilhar" /> na barra do
            Safari
          </li>
          <li className="flex items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-acento/15 text-[10px] font-bold text-acento">
              2
            </span>
            Role e escolha{" "}
            <strong className="inline-flex items-center gap-1 text-tinta">
              <SquarePlus className="size-4" aria-hidden />
              Adicionar à Tela de Início
            </strong>
          </li>
          <li className="flex items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-acento/15 text-[10px] font-bold text-acento">
              3
            </span>
            Confirme em <strong className="text-tinta">Adicionar</strong>
          </li>
        </ol>
      )}
    </div>
  );
}

/**
 * Registra o service worker.
 *
 * Fica separado do convite porque precisa rodar mesmo quando o convite
 * não aparece: é o service worker que dá a página de "sem conexão" a quem
 * já instalou, e é ele que Chrome e Edge exigem para considerar o site
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
