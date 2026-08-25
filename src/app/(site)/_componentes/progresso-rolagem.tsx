"use client";

import { useEffect, useState } from "react";

/** Fio de progresso no topo, mostra quanto da página já foi lida. */
export function ProgressoRolagem() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let pedido = 0;

    const medir = () => {
      const doc = document.documentElement;
      const percorrivel = doc.scrollHeight - doc.clientHeight;
      setPct(percorrivel > 0 ? (doc.scrollTop / percorrivel) * 100 : 0);
    };

    const aoRolar = () => {
      cancelAnimationFrame(pedido);
      pedido = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar, { passive: true });
    return () => {
      cancelAnimationFrame(pedido);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  return (
    <div className="progresso-rolagem" aria-hidden>
      <span style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );
}
