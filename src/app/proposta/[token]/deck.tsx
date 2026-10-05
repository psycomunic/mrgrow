"use client";

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
/* Antes da pintura no cliente, e `useEffect` no servidor — onde layout
   não existe e o React avisaria. É o par usual para quem precisa escrever
   no DOM sem deixar o quadro anterior aparecer. */
const useAntesDePintar = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Deck({
  marca,
  logo = null,
  children,
}: {
  marca: string;
  /** Logo da agência, quando cadastrada. Sem ela, o nome em texto. */
  logo?: string | null;
  children: ReactNode;
}) {
  /* `Children.toArray` achata array aninhado — é por isso que as seções
     da página podem devolver arrays de slides sem virar uma tela só. */
  const slides = Children.toArray(children);
  const total = slides.length;

  const trilho = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  /**
   * Liga o movimento, e só então esconde o que vai ser revelado.
   *
   * `data-mov` vinha do servidor, para a capa nascer no estado de antes
   * da entrada e não piscar pronta. O preço era alto demais: era ele que
   * escondia TODO o texto, e a revelação dependia do React hidratar. Numa
   * rede ruim, num telefone velho, ou se um pedaço do bundle não chegar,
   * a proposta que a agência mandou abre em branco — com a foto, os
   * controles e nenhuma palavra.
   *
   * Agora o servidor entrega o documento legível e o atributo entra aqui,
   * antes da pintura: não há piscada, e sem JavaScript sobra a proposta
   * inteira e parada, que é o pior caso aceitável.
   */
  useAntesDePintar(() => {
    palco.current?.setAttribute("data-mov", "");
  }, []);

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

    /* A tela de abertura se revela JÁ, antes de qualquer quadro, e antes
       da checagem de movimento reduzido.

       A revelação dependia só do laço, e `requestAnimationFrame` não
       dispara em aba de fundo — nem quando o navegador o estrangula para
       poupar bateria. Ali a proposta abria em branco: foto, controles, e
       o texto escondido esperando um quadro que nunca vinha. Numa
       proposta comercial isso não é um efeito que falha, é o documento
       que não existe.

       Abrir é obrigação; o parallax é enfeite. */
    const telas = Array.from(el.children) as HTMLElement[];
    telas[0]?.setAttribute("data-visto", "");

    /* E se nenhum quadro rodar mesmo assim, o resto aparece sozinho. Um
       segundo é mais que o laço precisa quando ele está vivo. */
    const resgate = setTimeout(() => {
      if (!raiz.style.getPropertyValue("--x")) {
        for (const t of telas) t.setAttribute("data-visto", "");
      }
    }, 1000);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearTimeout(resgate);
      for (const t of telas) t.setAttribute("data-visto", "");
      return;
    }

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
        for (let i = 0; i < telas.length; i++) {
          const d = i - x;
          // Só os vizinhos: slide a três telas de distância não aparece.
          if (Math.abs(d) < 1.6) {
            telas[i].style.setProperty("--d", d.toFixed(4));
            telas[i].style.setProperty("--a", Math.min(1, Math.abs(d)).toFixed(4));
            // A tela começa a se apresentar quando passa da metade, ainda
            // durante o arrasto — e não só depois que o trilho assenta.
            if (Math.abs(d) < 0.5 && !telas[i].hasAttribute("data-visto"))
              telas[i].setAttribute("data-visto", "");
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
      clearTimeout(resgate);
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
    <div ref={palco} className="pp-palco">
      <noscript>
        <style>{`.pp-palco [data-revela], .pp-palco .pp-mascara > span { opacity: 1 !important; transform: none !important; filter: none !important; }`}</style>
      </noscript>
      <div aria-hidden className="pp-cenario">
        <div className="pp-grade" />
        <div className="pp-brilho pp-brilho-azul" />
        <div className="pp-brilho pp-brilho-frio" />
        {/* Partículas em três profundidades. Poucas e lentas: é poeira de
            luz no palco, não efeito de tela de descanso. */}
        <div className="pp-poeira">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      {/* A luz que segue o mouse. Só no computador, e só sobre o
          cenário: ilumina o palco, nunca o texto. */}
      <div aria-hidden className="pp-lanterna" />

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

      <div aria-hidden className="pp-mais">
        <span>↓</span>
      </div>

      <div aria-hidden className="pp-progresso">
        <span style={{ width: `${((atual + 1) / total) * 100}%` }} />
      </div>

      <header className="pp-topo">
        {logo && /^https?:\/\//i.test(logo) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={marca} className="pp-topo-logo" />
        ) : (
          <p className="pp-topo-marca">{marca}</p>
        )}
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
