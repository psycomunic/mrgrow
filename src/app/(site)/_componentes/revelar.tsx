"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Revela o bloco quando ele entra na tela. Uma vez só, reaparecer a
 * cada rolagem cansa e denuncia o efeito.
 *
 * Movimento reduzido é tratado no CSS, que força o estado final; aqui
 * não há checagem de mídia para não duplicar a regra em dois lugares.
 */
export function Revelar({
  children,
  className,
  id,
  como: Como = "div",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  como?: "div" | "section";
}) {
  const [visivel, setVisivel] = useState(false);
  const observador = useRef<IntersectionObserver | null>(null);

  // Ref callback em vez de efeito: o observador nasce e morre junto do nó.
  const referencia = useCallback((el: HTMLElement | null) => {
    observador.current?.disconnect();
    observador.current = null;

    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }

    observador.current = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setVisivel(true);
        observador.current?.disconnect();
        observador.current = null;
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observador.current.observe(el);
  }, []);

  return (
    <Como
      ref={referencia as React.Ref<HTMLDivElement & HTMLElement>}
      id={id}
      className={className}
      data-revelar
      data-visivel={visivel ? "sim" : "nao"}
    >
      {children}
    </Como>
  );
}
