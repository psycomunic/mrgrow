import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Banner institucional do topo do painel.
 *
 * A arte definitiva entra em `public/painel/banner.webp` (ou no caminho que
 * for) e basta apontar `IMAGEM` para ela — o resto do componente não muda.
 * Enquanto a arte não chega, o banner desenha a si mesmo com a marca: assim a
 * faixa já ocupa o lugar certo e ninguém precisa mexer no layout depois.
 *
 * `PROPORCAO` existe porque banner é arte de largura variável: a altura sai
 * dela, e não de um `height` fixo, senão a imagem esmaga ou corta conforme a
 * largura da janela.
 */
const IMAGEM: string | null = null;
const PROPORCAO = "1440 / 220";

const TITULO = "MR Grow · Plataforma da agência";
const APOIO = "Estratégia, conteúdo e tráfego no mesmo lugar — da primeira conversa ao resultado.";
const DESTINO = "/painel/clientes";
const CHAMADA = "Ver a carteira";

export function Banner() {
  if (IMAGEM) {
    return (
      <Link
        href={DESTINO}
        className="foco-anel relative block overflow-hidden rounded-lg border border-borda"
        style={{ aspectRatio: PROPORCAO }}
      >
        <Image
          src={IMAGEM}
          alt={TITULO}
          fill
          sizes="(max-width: 64rem) 100vw, 1200px"
          className="object-cover"
          priority
        />
      </Link>
    );
  }

  return (
    <section className="relative flex flex-col gap-5 overflow-hidden rounded-lg border border-mrg-800/60 bg-gradient-to-r from-mrg-950 via-mrg-900 to-carta p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      {/* Duas luzes frias e um véu: é o que tira o aspecto de retângulo
          chapado sem precisar de imagem nenhuma. */}
      <div
        className="pointer-events-none absolute -top-24 -left-10 size-64 rounded-full bg-mrg-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full bg-mrg-400/12 blur-3xl"
        aria-hidden
      />

      <div className="relative flex min-w-0 items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full border border-white/12 bg-white/8 backdrop-blur-sm">
          <Image
            src="/marca/mr-grow-logo.webp"
            alt=""
            width={72}
            height={72}
            className="size-8 object-contain"
          />
        </span>

        <div className="min-w-0">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
            {TITULO}
          </h2>
          <p className="mt-1 max-w-[52ch] text-[13px] leading-snug text-white/70">{APOIO}</p>
        </div>
      </div>

      <Link
        href={DESTINO}
        className="foco-anel relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-mrg-700 transition hover:bg-white/90"
      >
        {CHAMADA} <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
