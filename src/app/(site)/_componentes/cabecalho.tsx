"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { MARCA, linkWhatsApp } from "@/lib/marca";

const LINKS = [
  { href: "#diagnostico-dores", rotulo: "Diagnóstico" },
  { href: "#metodo", rotulo: "Método" },
  { href: "#servicos", rotulo: "Serviços" },
  { href: "#resultados", rotulo: "Resultados" },
  { href: "#portfolio", rotulo: "Trabalho" },
  { href: "#planos", rotulo: "Planos" },
];

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="topo">
      <div className="limite topo__linha">
        <Link href="/" className="topo__marca" aria-label={MARCA.nome}>
          <Lampada />
          <span className="topo__nome">MR Grow</span>
        </Link>

        <nav className="topo__nav">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>

        <div className="topo__acoes">
          <Link href="/entrar" className="bt bt--linha bt--mini">
            Área do cliente
          </Link>
          <a href="#diagnostico" className="bt bt--claro bt--mini">
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
          <div className="limite">
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
              className="bt bt--claro bt--largo"
            >
              Pedir diagnóstico
            </a>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="bt bt--linha bt--largo"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/** A lâmpada da marca. Funciona sobre o escuro sem precisar de chapa branca. */
export function Lampada({ altura = 1.75 }: { altura?: number }) {
  return (
    <Image
      src="/marca/lampada.webp"
      alt=""
      width={512}
      height={512}
      aria-hidden
      style={{ height: `${altura}rem`, width: "auto" }}
      loading="eager"
      fetchPriority="high"
    />
  );
}

/** Logotipo completo — usado onde há chapa clara atrás (login, portal). */
export function Logo({ altura = 2 }: { altura?: number }) {
  return (
    <Image
      src="/marca/mr-grow-logo.webp"
      alt={MARCA.nome}
      width={1400}
      height={728}
      style={{ height: `${altura}rem`, width: "auto" }}
      loading="eager"
    />
  );
}
