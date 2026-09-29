import type { ReactNode } from "react";

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
 * A proposta anterior deixava cada seção montar o próprio cabeçalho, e
 * o resultado foi o previsível: espaçamentos diferentes, títulos de
 * tamanhos diferentes, e a sensação de coisa remendada — que foi
 * exatamente a queixa.
 */
export function Slide({
  rotulo,
  titulo,
  apoio,
  children,
  /** Abertura e fecho respiram mais e centram na vertical. */
  centrado = false,
}: {
  rotulo?: string;
  titulo?: ReactNode;
  apoio?: ReactNode;
  children?: ReactNode;
  centrado?: boolean;
}) {
  return (
    <div className="pp-slide" data-centrado={centrado ? "" : undefined}>
      {rotulo || titulo || apoio ? (
        <header className="pp-cabeca">
          {rotulo ? <p className="pp-rotulo">{rotulo}</p> : null}
          {titulo ? <h2 className="pp-titulo">{titulo}</h2> : null}
          {apoio ? <p className="pp-apoio">{apoio}</p> : null}
        </header>
      ) : null}

      {children ? <div className="pp-corpo">{children}</div> : null}
    </div>
  );
}

/** Cartão de conteúdo. Um só, para o documento inteiro. */
export function Bloco({
  children,
  destaque = false,
  className = "",
}: {
  children: ReactNode;
  destaque?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`pp-bloco ${className}`}
      data-destaque={destaque ? "" : undefined}
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
