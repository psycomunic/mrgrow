"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que sobe do zero até o valor final quando a tela dele aparece.
 *
 * O valor é renderizado inteiro no servidor: sem JavaScript, ou com
 * movimento reduzido, a pessoa vê o número certo de cara. A contagem roda
 * uma vez. Recontar toda vez que a pessoa volta à tela pareceria truque;
 * contar uma vez parece apresentação.
 */
export function Contador({
  valor,
  duracao = 1600,
  moeda = false,
}: {
  valor: number;
  duracao?: number;
  moeda?: boolean;
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
      {moeda
        ? mostrado.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
            maximumFractionDigits: mostrado % 1 === 0 ? 0 : 2,
          })
        : mostrado.toLocaleString("pt-BR")}
    </span>
  );
}

/**
 * Contagem regressiva até o fim da validade da proposta.
 *
 * Só aparece depois de montar no navegador: o servidor não sabe a hora do
 * leitor, e um relógio renderizado no servidor chegaria errado e trocaria
 * de valor na frente da pessoa. Até lá, fica a data por extenso, que já
 * diz o essencial. A validade vale até o fim do dia, no fuso de Brasília.
 */
export function Regressiva({ ate }: { ate: string }) {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    const t0 = setTimeout(() => setAgora(Date.now()), 0);
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
    };
  }, []);

  const fim = new Date(`${ate}T23:59:59-03:00`).getTime();
  if (agora === null || Number.isNaN(fim)) return null;

  const resta = Math.max(0, fim - agora);
  if (resta === 0) return null;

  const s = Math.floor(resta / 1000);
  const partes = [
    { v: Math.floor(s / 86400), r: "dias" },
    { v: Math.floor((s % 86400) / 3600), r: "horas" },
    { v: Math.floor((s % 3600) / 60), r: "min" },
    { v: s % 60, r: "seg" },
  ];

  return (
    <div className="pp-regressiva" role="timer" aria-label="Tempo até o fim da oferta">
      {partes.map((p) => (
        <span key={p.r}>
          <b>{String(p.v).padStart(2, "0")}</b>
          <i>{p.r}</i>
        </span>
      ))}
    </div>
  );
}
