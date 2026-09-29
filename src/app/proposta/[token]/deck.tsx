"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

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
 * O FUNDO É FIXO, E OS SLIDES CORREM POR CIMA
 * ============================================================
 * Grade, brilhos e grão ficam numa camada que não se move. Se cada
 * slide levasse o próprio fundo, o brilho passaria correndo junto e
 * viraria efeito de carrossel barato. Parado, ele funciona como o
 * cenário de um palco: o que se move é o conteúdo.
 */
export function Deck({
  marca,
  children,
}: {
  marca: string;
  children: ReactNode;
}) {
  /* `Children.toArray` achata array aninhado — é por isso que as seções
     da página podem devolver arrays de slides sem virar uma tela só. */
  const slides = Children.toArray(children);
  const total = slides.length;

  const trilho = useRef<HTMLDivElement>(null);
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
    <div className="pp-palco">
      <div aria-hidden className="pp-cenario">
        <div className="pp-grade" />
        <div className="pp-brilho pp-brilho-azul" />
        <div className="pp-brilho pp-brilho-frio" />
      </div>

      <div ref={trilho} className="pp-trilho" tabIndex={-1}>
        {slides.map((slide, i) => (
          /* O `id` deixa mandar "olha a tela 5" com link que abre nela:
             a ancora do navegador rola o trilho sozinha, sem codigo. */
          <section
            key={i}
            id={`tela-${i + 1}`}
            aria-label={`Slide ${i + 1} de ${total}`}
          >
            {/* As faixas de topo e base existem para o conteúdo não passar
                por baixo do cabeçalho e dos controles — e sumir
                justamente onde o polegar fica. */}
            <div className="pp-quadro">{slide}</div>
          </section>
        ))}
      </div>

      <div aria-hidden className="pp-progresso">
        <span style={{ width: `${((atual + 1) / total) * 100}%` }} />
      </div>

      <header className="pp-topo">
        <p
          style={{
            margin: 0,
            fontFamily: "var(--fonte-display), system-ui, sans-serif",
            fontSize: "0.85rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {marca}
        </p>
        <p
          className="pp-mono"
          style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}
        >
          <span style={{ color: "var(--branco)" }}>
            {String(atual + 1).padStart(2, "0")}
          </span>
          <span style={{ margin: "0 0.25rem", opacity: 0.5 }}>/</span>
          {String(total).padStart(2, "0")}
        </p>
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

        <p
          aria-live="polite"
          className="pp-mono pp-contador-mob"
          style={{ margin: 0 }}
        >
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
