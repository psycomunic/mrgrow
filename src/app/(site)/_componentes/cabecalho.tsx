"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { MARCA, linkWhatsApp } from "@/lib/marca";
import { ProgressoRolagem } from "./progresso-rolagem";

const LINKS = [
  { href: "#diagnostico-dores", rotulo: "Diagnóstico" },
  { href: "#metodo", rotulo: "Método" },
  { href: "#servicos", rotulo: "Serviços" },
  { href: "#resultados", rotulo: "Resultados" },
  { href: "#trabalho", rotulo: "Trabalho" },
  { href: "#planos", rotulo: "Planos" },
];

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header className="topo" data-rolou={rolou ? "sim" : "nao"}>
      <ProgressoRolagem />
      <div className="area topo__linha">
        <Link href="/" aria-label={MARCA.nome} style={{ display: "flex", flexShrink: 0 }}>
          <Logo />
        </Link>

        <nav className="topo__nav">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>

        <div className="topo__acoes">
          <Link href="/entrar" className="acao acao--linha acao--mini">
            Área do cliente
          </Link>
          <a href="#diagnostico" className="acao acao--azul acao--mini">
            Diagnóstico gratuito
          </a>
        </div>

        <button
          className="topo__menu"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        >
          {aberto ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {aberto && (
        <div className="topo__gaveta">
          <div className="area">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setAberto(false)}>
                {l.rotulo}
              </a>
            ))}
            <Link href="/entrar" onClick={() => setAberto(false)}>
              Área do cliente
            </Link>
            <a
              href="#diagnostico"
              onClick={() => setAberto(false)}
              className="acao acao--azul acao--largo"
            >
              Pedir diagnóstico
            </a>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="acao acao--linha acao--largo"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/** Logotipo oficial. `altura` em rem; a largura acompanha. */
export function Logo({ altura = 2.15 }: { altura?: number }) {
  return (
    <Image
      src="/marca/mr-grow-logo.webp"
      alt={MARCA.nome}
      width={1400}
      height={728}
      style={{ height: `${altura}rem`, width: "auto" }}
      loading="eager"
      fetchPriority="high"
    />
  );
}

/** Só a lâmpada da marca — para blocos pequenos (usada no painel). */
export function Lampada({ className }: { className?: string }) {
  return (
    <Image
      src="/marca/lampada.webp"
      alt=""
      width={512}
      height={512}
      aria-hidden
      className={className ?? "size-8"}
    />
  );
}
