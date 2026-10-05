import type { CSSProperties, ReactNode } from "react";

/**
 * O gabarito de um slide.
 *
 * ============================================================
 * POR QUE UM GABARITO, E NÃO CADA SLIDE LIVRE
 * ============================================================
 * Apresentação boa tem batida: o rótulo cai sempre na mesma altura, o
 * título tem sempre o mesmo tamanho, o corpo começa sempre na mesma
 * linha. É isso que faz doze telas parecerem um documento só em vez de
 * doze páginas soltas.
 *
 * ============================================================
 * AS TRÊS CAMADAS DE PROFUNDIDADE
 * ============================================================
 * Cada slide pode ter até três planos, e cada um corre numa velocidade
 * diferente quando a pessoa desliza:
 *
 *   fundo   → foto de tela cheia, anda MAIS que o dedo (`--d` × 30%)
 *   visual  → foto emoldurada, anda contra o dedo dentro da moldura
 *   texto   → anda MENOS que o dedo e esmaece ao sair
 *
 * É a diferença de velocidade, e não o movimento em si, que o olho lê
 * como profundidade. O `--d` vem do Deck: é a distância contínua entre o
 * slide e o centro da tela (0 = no centro, ±1 = uma tela para o lado).
 *
 * Tudo isso é CSS lendo uma variável. Sem JavaScript o `--d` fica em 0
 * e o slide aparece parado, inteiro e legível.
 */
export function Slide({
  rotulo,
  titulo,
  apoio,
  children,
  /** Abertura e fecho respiram mais e centram na vertical. */
  centrado = false,
  /** Foto de tela cheia atrás do slide. */
  fundo,
  /** De que lado o véu escuro do fundo pesa, para o texto ler bem. */
  veu = "esquerda",
  /** Foto emoldurada ao lado do texto. */
  visual,
  /** Numeral grande e vazado ao fundo, em parallax mais profundo. */
  numeral,
}: {
  rotulo?: string;
  titulo?: ReactNode;
  apoio?: ReactNode;
  children?: ReactNode;
  centrado?: boolean;
  fundo?: string;
  veu?: "esquerda" | "direita" | "total" | "centro";
  visual?: ReactNode;
  numeral?: string;
}) {
  const cabeca =
    rotulo || titulo || apoio ? (
      <header className="pp-cabeca">
        {rotulo ? (
          <p className="pp-rotulo" data-revela="" style={ordem(0)}>
            {rotulo}
          </p>
        ) : null}
        {titulo ? (
          <h2 className="pp-titulo">
            <span className="pp-mascara">
              <span>{titulo}</span>
            </span>
          </h2>
        ) : null}
        {apoio ? (
          <p className="pp-apoio" data-revela="" style={ordem(2)}>
            {apoio}
          </p>
        ) : null}
      </header>
    ) : null;

  const corpo = children ? <div className="pp-corpo">{children}</div> : null;

  /* Uma raiz só, e com `display: contents`. O Slide é componente de
     servidor: chega ao Deck já resolvido, e um fragmento chegaria como
     lista — o `Children.toArray` do Deck faria do fundo um slide à parte.
     O `contents` some da caixa, e o fundo continua se posicionando pela
     seção, que é o que importa. */
  return (
    <div className="pp-camadas">
      {fundo ? <Fundo src={fundo} veu={veu} /> : null}
      {numeral ? (
        <span aria-hidden className="pp-numeral">
          {numeral}
        </span>
      ) : null}

      <div
        className="pp-slide"
        data-centrado={centrado ? "" : undefined}
        data-com-visual={visual ? "" : undefined}
      >
        {visual ? (
          <>
            <div className="pp-slide-visual">{visual}</div>
            <div className="pp-slide-texto">
              {cabeca}
              {corpo}
            </div>
          </>
        ) : (
          <>
            {cabeca}
            {corpo}
          </>
        )}
      </div>
    </div>
  );
}

/** Atraso em cascata: cada peça entra 90 ms depois da anterior. */
export function ordem(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

/**
 * Foto de tela cheia.
 *
 * `img` puro, e não `next/image`: a produção roda em Node próprio, onde o
 * otimizador de imagem depende de binário nativo que nem sempre carrega.
 * As fotos já saem do repositório em WebP leve, no tamanho de uso.
 */
function Fundo({ src, veu }: { src: string; veu: string }) {
  return (
    <div aria-hidden className="pp-fundo">
      <div className="pp-fundo-movel">
        <div className="pp-kb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" decoding="async" />
        </div>
      </div>
      <div className="pp-fundo-veu" data-lado={veu} />
    </div>
  );
}

/**
 * Foto emoldurada.
 *
 * A moldura fica parada no lugar e a foto corre por dentro, contra o
 * movimento do dedo — é o efeito de janela: parece que se olha através
 * dela, e não para um retângulo colado na tela. O selo flutua num plano
 * à frente e por isso anda mais que a foto.
 */
export function Janela({
  src,
  alt,
  selo,
  legenda,
}: {
  src: string;
  alt: string;
  selo?: ReactNode;
  legenda?: string;
}) {
  return (
    <figure className="pp-janela" data-revela="" style={ordem(1)}>
      <div className="pp-janela-moldura">
        <div className="pp-janela-movel">
          <div className="pp-kb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} decoding="async" />
          </div>
        </div>
        <span aria-hidden className="pp-janela-varredura" />
        <span aria-hidden className="pp-janela-cantos" />
        {legenda ? (
          <figcaption className="pp-janela-legenda pp-mono">
            {legenda}
          </figcaption>
        ) : null}
      </div>

      {selo ? <div className="pp-selo">{selo}</div> : null}
    </figure>
  );
}

/** Cartão de conteúdo. Um só, para o documento inteiro. */
export function Bloco({
  children,
  destaque = false,
  className = "",
  /** Posição na cascata de entrada. Sem ela, o bloco entra junto do corpo. */
  indice = 3,
}: {
  children: ReactNode;
  destaque?: boolean;
  className?: string;
  indice?: number;
}) {
  return (
    <div
      className={`pp-bloco ${className}`}
      data-destaque={destaque ? "" : undefined}
      data-revela=""
      style={ordem(indice)}
    >
      {children}
    </div>
  );
}

/**
 * Título com a última palavra em azul e ponto final.
 *
 * O ponto é deliberado: ele fecha a frase e faz o título soar como
 * afirmação — "O que encontramos." — em vez de rótulo de seção. Repetido
 * em toda tela, vira a assinatura do documento.
 */
export function eco(frase: string) {
  const partes = frase.trim().split(" ");
  const ultima = partes.pop() ?? "";
  return (
    <>
      {partes.length > 0 ? `${partes.join(" ")} ` : null}
      <span className="pp-eco">{ultima}.</span>
    </>
  );
}
