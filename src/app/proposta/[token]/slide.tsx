import type { CSSProperties, ReactNode } from "react";

/**
 * As peças de montagem de cada tela da proposta.
 *
 * ============================================================
 * DOIS TONS, COMO NO DECK ORIGINAL DA MR GROW
 * ============================================================
 * A apresentação alterna telas escuras, com foto, e telas brancas, só de
 * tipografia. A branca é a pausa: depois de uma imagem forte, uma frase
 * grande sozinha no branco é lida inteira. É essa alternância que dá
 * ritmo ao documento, e por isso o tom é propriedade da tela, não um
 * detalhe de estilo.
 *
 * ============================================================
 * PROFUNDIDADE
 * ============================================================
 * O Deck escreve em cada tela `--d`, a distância contínua dela até o
 * centro (0 no centro, ±1 uma tela para o lado), e no palco `--mx/--my`,
 * a posição do mouse. Cada `Camada` diz o quanto se move com `prof`:
 * negativo fica para trás, positivo vem para a frente. É a diferença de
 * velocidade entre as camadas que o olho lê como profundidade. Sem
 * JavaScript tudo vale zero e a tela aparece parada, inteira.
 */
export function Tela({
  tom = "escuro",
  children,
  className = "",
  rotulo,
}: {
  tom?: "escuro" | "claro";
  children: ReactNode;
  className?: string;
  /** Nome da tela para leitor de tela. */
  rotulo?: string;
}) {
  return (
    <div className={`pp-tela ${className}`} data-tom={tom} aria-label={rotulo}>
      {children}
    </div>
  );
}

/** Uma camada com velocidade própria no parallax. */
export function Camada({
  prof,
  children,
  className = "",
  style,
}: {
  prof: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`pp-camada ${className}`}
      style={{ ...style, "--p": prof } as CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Foto de fundo de tela cheia, numa camada que anda devagar.
 *
 * `img` puro, e não `next/image`: a produção roda em Node próprio, onde o
 * otimizador de imagem depende de binário nativo que nem sempre carrega.
 * As fotos já saem do repositório em WebP no tamanho de uso.
 */
export function Foto({
  src,
  alt = "",
  posicao = "center",
  prof = -2,
  className = "",
  zoom = true,
}: {
  src: string;
  alt?: string;
  posicao?: string;
  prof?: number;
  className?: string;
  /** Aproximação lenta e contínua da câmera. */
  zoom?: boolean;
}) {
  return (
    <Camada prof={prof} className={`pp-foto ${className}`}>
      <div className={zoom ? "pp-kb" : "pp-kb-parado"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          decoding="async"
          style={{ objectPosition: posicao }}
        />
      </div>
    </Camada>
  );
}

/** Atraso em cascata: cada peça entra 90 ms depois da anterior. */
export function ordem(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

/**
 * Linha de título que sobe de trás de uma máscara, como letreiro.
 * `i` é a posição na cascata.
 */
export function Linha({
  children,
  i = 0,
  className = "",
}: {
  children: ReactNode;
  i?: number;
  className?: string;
}) {
  return (
    <span className={`pp-linha ${className}`}>
      <span style={ordem(i)}>{children}</span>
    </span>
  );
}

/** O cabeçalho fixo de toda tela: a lâmpada da marca e o @. */
export function Lampada({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 34"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.2 0 11.7c0 4.1 2.1 7.2 4.3 9.6 1.4 1.5 2.2 3.1 2.4 4.7h10.6c.2-1.6 1-3.2 2.4-4.7 2.2-2.4 4.3-5.5 4.3-9.6C24 5.2 18.6 0 12 0Z" />
      <rect x="6.8" y="27.4" width="10.4" height="2.4" rx="1.2" />
      <rect x="7.8" y="31" width="8.4" height="2.4" rx="1.2" />
    </svg>
  );
}
