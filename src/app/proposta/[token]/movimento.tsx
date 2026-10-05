"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Valor que sobe do zero até o número final quando a tela dele aparece.
 *
 * O número é renderizado inteiro no servidor: sem JavaScript, ou com
 * movimento reduzido, a pessoa vê o valor certo de cara. A contagem só
 * começa depois que o componente monta e a tela fica visível, e roda uma
 * vez. Proposta que recontaria o preço toda vez que a pessoa volta ao
 * slide pareceria truque; contar uma vez parece apresentação.
 */
export function Contador({
  valor,
  duracao = 1600,
}: {
  valor: number;
  duracao?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mostrado, setMostrado] = useState(valor);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let feito = false;

    const contar = () => {
      feito = true;
      const inicio = performance.now();
      const passo = (agora: number) => {
        const t = Math.min(1, (agora - inicio) / duracao);
        // Desacelera no fim: o olho lê o número quando ele quase para.
        const suave = 1 - Math.pow(1 - t, 4);
        setMostrado(t < 1 ? Math.round(valor * suave) : valor);
        if (t < 1) raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !feito) {
          setMostrado(0);
          contar();
          obs.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [valor, duracao]);

  return (
    <span ref={ref}>
      {mostrado.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: mostrado % 1 === 0 ? 0 : 2,
      })}
    </span>
  );
}

/**
 * Número que sobe do zero quando a tela dele entra.
 *
 * Irmão do `Contador`, para o que não é dinheiro: contagem de campanhas,
 * de empresas, de anos. O `Contador` formata em reais sempre, e "R$ 2.326
 * campanhas" não é um número, é um erro.
 *
 * Mesma regra do outro: o valor final é o que o servidor renderiza. Sem
 * JavaScript, ou com movimento reduzido, aparece certo de cara — e a
 * contagem roda uma vez só, porque recontar a cada volta ao slide
 * pareceria truque em vez de apresentação.
 */
export function Numero({
  valor,
  prefixo = "",
  sufixo = "",
  duracao = 1800,
}: {
  valor: number;
  prefixo?: string;
  sufixo?: string;
  duracao?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mostrado, setMostrado] = useState(valor);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let feito = false;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || feito) return;
        feito = true;
        obs.disconnect();
        setMostrado(0);
        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / duracao);
          // Desacelera no fim: o olho lê o número quando ele quase para.
          const suave = 1 - Math.pow(1 - t, 4);
          setMostrado(t < 1 ? Math.round(valor * suave) : valor);
          if (t < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      },
      { threshold: 0.5 },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [valor, duracao]);

  return (
    <span ref={ref}>
      {prefixo}
      {mostrado.toLocaleString("pt-BR")}
      {sufixo}
    </span>
  );
}
