"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";
import { MARCA, linkWhatsApp } from "@/lib/marca";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#metodo", rotulo: "Método" },
  { href: "#servicos", rotulo: "Serviços" },
  { href: "#resultados", rotulo: "Resultados" },
  { href: "#portfolio", rotulo: "Portfólio" },
  { href: "#processo", rotulo: "Como funciona" },
  { href: "#planos", rotulo: "Planos" },
  { href: "#faq", rotulo: "Dúvidas" },
];

export function Cabecalho() {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 16);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        rolou
          ? "border-b border-white/10 bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="container-mrg flex h-16 items-center justify-between gap-6 sm:h-18">
        <Link href="/" className="flex items-center foco-anel" aria-label={MARCA.nome}>
          <Logo className="h-9 sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-300 transition-colors hover:text-white foco-anel"
            >
              {l.rotulo}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <BotaoLink href="/entrar" variante="fantasma" tamanho="sm">
            Área do cliente
          </BotaoLink>
          <BotaoLink href="#diagnostico" tamanho="sm">
            Diagnóstico gratuito
          </BotaoLink>
        </div>

        <button
          onClick={() => setAberto((v) => !v)}
          className="rounded-sm p-2 text-ink-200 lg:hidden foco-anel"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
        >
          {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {aberto && (
        <div className="border-t border-white/10 bg-ink-950/95 backdrop-blur-xl lg:hidden">
          <div className="container-mrg flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="rounded-sm px-2 py-3 text-sm font-medium text-ink-200 hover:bg-white/5 hover:text-white"
              >
                {l.rotulo}
              </a>
            ))}
            <div className="mt-3 grid gap-2">
              <BotaoLink href="/entrar" variante="contorno" largura="cheia">
                Área do cliente
              </BotaoLink>
              <BotaoLink href={linkWhatsApp()} externo largura="cheia">
                Falar no WhatsApp
              </BotaoLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/** Logotipo oficial. `className` controla a altura — a largura acompanha. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/marca/mr-grow-logo.webp"
      alt={MARCA.nome}
      width={1400}
      height={728}
      className={cn("h-9 w-auto", className)}
      loading="eager"
      fetchPriority="high"
    />
  );
}

/** Só a lâmpada da marca — para selos, avatares e blocos pequenos. */
export function Lampada({ className }: { className?: string }) {
  return (
    <Image
      src="/marca/lampada.webp"
      alt=""
      width={512}
      height={512}
      aria-hidden
      className={cn("size-8", className)}
    />
  );
}
