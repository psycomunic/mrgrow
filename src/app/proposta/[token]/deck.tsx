"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Lampada } from "./slide";
import { Logotipo } from "@/components/marca";
import { MARCA } from "@/lib/marca";

/**
 * A proposta como apresentação que passa para o lado.
 *
 * ============================================================
 * POR QUE ROLAGEM NATIVA, E NÃO UMA BIBLIOTECA DE CARROSSEL
 * ============================================================
 * `overflow-x: auto` com `scroll-snap` já entrega o gesto de arrastar do
 * celular, com a física do sistema, a inércia certa e sem atraso de
 * toque. Biblioteca nenhuma faz isso melhor, e todas cobram peso de
 * JavaScript por um comportamento que o navegador tem de graça.
 *
 * Consequência que importa: se o JavaScript não carregar, a proposta
 * CONTINUA passando com o dedo. O que se perde são as setas e a
 * contagem, que são conforto — não a leitura. Numa proposta comercial
 * aberta no 4G do cliente, essa diferença é a diferença entre o
 * documento existir e não existir.
 *
 * ============================================================
 * CADA TELA LEVA O PRÓPRIO FUNDO
 * ============================================================
 * As telas alternam preto com foto e branco só com frase, como no deck
 * impresso da agência, então o fundo é da tela e passa junto com ela.
 * O que dá profundidade é o parallax das camadas por dentro de cada uma.
 */
export function Deck({
  marca,
  logo = null,
  arroba,
  children,
}: {
  marca: string;
  /** Logo da agência, quando cadastrada. Sem ela, a lâmpada da MR Grow. */
  logo?: string | null;
  /** O @ do Instagram no canto, como no deck impresso. */
  arroba: string;
  children: ReactNode;
}) {
  /* `Children.toArray` achata array aninhado — é por isso que as seções
     da página podem devolver arrays de slides sem virar uma tela só. */
  const slides = Children.toArray(children);
  const total = slides.length;

  const trilho = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  const irPara = useCallback(
    (i: number) => {
      const el = trilho.current;
      if (!el) return;
      const alvo = Math.max(0, Math.min(total - 1, i));
      el.scrollTo({ left: alvo * el.clientWidth, behavior: "smooth" });
    },
    [total],
  );

  /* Qual slide está na tela, medido pela rolagem e não contado nos
     cliques: a pessoa também chega aqui arrastando, e um contador que só
     escuta botão mente na primeira vez que ela usa o dedo. */
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    let parado: ReturnType<typeof setTimeout>;
    const aoRolar = () => {
      clearTimeout(parado);
      parado = setTimeout(
        () => setAtual(Math.round(el.scrollLeft / el.clientWidth)),
        80,
      );
    };

    el.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      el.removeEventListener("scroll", aoRolar);
      clearTimeout(parado);
    };
  }, []);


  /* ============================================================
     O MOTOR DE MOVIMENTO
     ============================================================
     Um laço só, a cada quadro, escreve três coisas em variáveis CSS:

       --x        posição contínua do trilho (2.37 = entre a 3ª e a 4ª)
       --d        em cada slide vizinho: a distância dele até o centro
       --mx/--my  onde está o mouse, de -1 a 1, com inércia

     Todo o parallax é CSS lendo essas variáveis com `transform`, que a
     placa de vídeo compõe sem refazer layout. Nenhum componente React
     renderiza de novo enquanto a pessoa desliza — é isso que mantém os
     60 quadros num celular intermediário.

     Com movimento reduzido no sistema, o laço não liga: as variáveis
     ficam em zero e a proposta vira a versão parada, inteira. */
  useEffect(() => {
    const el = trilho.current;
    const raiz = palco.current;
    if (!el || !raiz) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const secoes = Array.from(el.children) as HTMLElement[];
    const fino = window.matchMedia("(pointer: fine)").matches;

    let alvoX = 0;
    let alvoY = 0;
    let mx = 0;
    let my = 0;
    let ultimoX = -1;
    let raf = 0;

    const quadro = () => {
      const largura = el.clientWidth || 1;
      const x = el.scrollLeft / largura;

      if (Math.abs(x - ultimoX) > 0.0005) {
        ultimoX = x;
        raiz.style.setProperty("--x", x.toFixed(4));
        for (let i = 0; i < secoes.length; i++) {
          const d = i - x;
          // Só os vizinhos: slide a três telas de distância não aparece.
          if (Math.abs(d) < 1.6) {
            secoes[i].style.setProperty("--d", d.toFixed(4));
            secoes[i].style.setProperty("--a", Math.min(1, Math.abs(d)).toFixed(4));
            // A tela começa a se apresentar quando passa da metade, ainda
            // durante o arrasto — e não só depois que o trilho assenta.
            if (Math.abs(d) < 0.5 && !secoes[i].hasAttribute("data-visto"))
              secoes[i].setAttribute("data-visto", "");
          }
        }
      }

      mx += (alvoX - mx) * 0.07;
      my += (alvoY - my) * 0.07;
      raiz.style.setProperty("--mx", mx.toFixed(4));
      raiz.style.setProperty("--my", my.toFixed(4));

      raf = requestAnimationFrame(quadro);
    };

    const aoMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      alvoX = (e.clientX / window.innerWidth - 0.5) * 2;
      alvoY = (e.clientY / window.innerHeight - 0.5) * 2;
      raiz.style.setProperty("--cx", `${e.clientX}px`);
      raiz.style.setProperty("--cy", `${e.clientY}px`);
    };

    if (fino) raiz.setAttribute("data-mouse", "");
    raf = requestAnimationFrame(quadro);
    window.addEventListener("pointermove", aoMover, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", aoMover);
    };
  }, [total]);

  /* A entrada de cada tela. `data-ativo` liga a cascata de revelação;
     `data-visto` fica para sempre, para que o conteúdo não suma enquanto
     a pessoa ainda está arrastando para fora. Cada tela se apresenta uma
     vez — na volta ela já está lá, como numa apresentação de verdade. */
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const secoes = Array.from(el.children);
    // Um quadro de folga: na primeira pintura o CSS precisa ver o estado
    // escondido antes do visível, senão a capa nasce pronta, sem entrada.
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        secoes.forEach((s, i) => {
          s.toggleAttribute("data-ativo", i === atual);
          if (i === atual) s.setAttribute("data-visto", "");
        });
      }),
    );
    return () => cancelAnimationFrame(t);
  }, [atual]);

  /* Marca a tela que TEM mais coisa abaixo. Slide com muitos itens não
     cabe no telefone e rola por dentro, o que é o desenho. O problema
     nunca foi a rolagem: era ela ser invisível. */
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const secoes = Array.from(el.children);

    const conferir = () => {
      for (const secao of secoes) {
        const rola = secao.scrollHeight > secao.clientHeight + 8;
        const noFim =
          secao.scrollTop + secao.clientHeight >= secao.scrollHeight - 12;
        secao.toggleAttribute("data-tem-mais", rola && !noFim);
      }
    };

    conferir();
    // As fontes chegam depois e mudam a altura do texto.
    const t = setTimeout(conferir, 400);
    window.addEventListener("resize", conferir);
    for (const secao of secoes)
      secao.addEventListener("scroll", conferir, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", conferir);
      for (const secao of secoes) secao.removeEventListener("scroll", conferir);
    };
  }, [total]);

  /* Setas do teclado, porque quem abre no computador tenta isso antes de
     procurar botão. Só quando o foco não está num campo. */
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") irPara(atual + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") irPara(atual - 1);
      if (e.key === "Home") irPara(0);
      if (e.key === "End") irPara(total - 1);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [atual, irPara, total]);

  const primeiro = atual === 0;
  const ultimo = atual === total - 1;

  return (
    /* `data-mov` já vem do servidor, para a capa nascer no estado de
       antes da entrada e não piscar pronta antes de animar. Quem está sem
       JavaScript recebe o `noscript` abaixo, que desliga a revelação. */
    <div ref={palco} className="pp-palco" data-mov="">
      <noscript>
        <style>{`.pp-palco [data-revela], .pp-palco .pp-linha > span { opacity: 1 !important; transform: none !important; filter: none !important; clip-path: none !important; }`}</style>
      </noscript>

      <div ref={trilho} className="pp-trilho" tabIndex={-1}>
        {slides.map((slide, i) => (
          /* O `id` deixa mandar "olha a tela 5" com link que abre nela:
             a âncora do navegador rola o trilho sozinha, sem código. */
          <section
            key={i}
            id={`tela-${i + 1}`}
            aria-label={`Slide ${i + 1} de ${total}`}
          >
            {slide}
          </section>
        ))}
      </div>

      <div aria-hidden className="pp-mais">
        <span>↓</span>
      </div>

      <div aria-hidden className="pp-progresso">
        <span style={{ width: `${((atual + 1) / total) * 100}%` }} />
      </div>

      {/* Cabeçalho e pontos em `difference`: brancos sobre a tela escura,
          pretos sobre a branca, sem o Deck precisar saber o tom de cada
          tela. */}
      <header className="pp-topo">
        {logo && /^https?:\/\//i.test(logo) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={marca} className="pp-topo-logo" />
        ) : (
          /* A marca inteira, e não só a lâmpada. A lâmpada sozinha não
             identifica ninguém: num documento que o cliente encaminha
             para o sócio, o cabeçalho é a única assinatura que viaja
             junto. A lâmpada fica para quem não é a MR Grow, onde a
             única coisa certa é o nome escrito. */
          <span className="pp-topo-marca" aria-label={marca}>
            {marca === MARCA.nome ? (
              <Logotipo className="pp-topo-vetor" />
            ) : (
              <Lampada className="pp-topo-lampada" />
            )}
          </span>
        )}
        <p className="pp-topo-arroba">{arroba}</p>
      </header>

      <nav aria-label="Navegação da proposta" className="pp-controles">
        <button
          type="button"
          onClick={() => irPara(atual - 1)}
          disabled={primeiro}
          aria-label="Slide anterior"
          className="pp-botao"
        >
          <span aria-hidden>←</span>
        </button>

        {/* Pontos no computador; no celular eles ficariam menores que o
            alvo mínimo de toque, então lá vira contador. */}
        <ol className="pp-pontos">
          {slides.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o slide ${i + 1}`}
                aria-current={i === atual ? "true" : undefined}
                className="pp-ponto"
              >
                <span aria-hidden />
              </button>
            </li>
          ))}
        </ol>

        <p aria-live="polite" className="pp-contador-mob">
          {primeiro ? "arraste →" : ultimo ? "fim" : `${atual + 1} de ${total}`}
        </p>

        <button
          type="button"
          onClick={() => irPara(atual + 1)}
          disabled={ultimo}
          aria-label="Próximo slide"
          className="pp-botao"
          data-principal=""
        >
          <span aria-hidden>→</span>
        </button>
      </nav>

      <div aria-hidden className="pp-grao" />
    </div>
  );
}
