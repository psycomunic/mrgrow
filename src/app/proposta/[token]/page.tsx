import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Outfit, Manrope } from "next/font/google";
import { Deck } from "./deck";
import { carregarPorToken } from "@/lib/propostas";
import "./deck.css";

const display = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--fonte-display",
});

const texto = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fonte-texto",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const proposta = await carregarPorToken(token);

  return {
    /* O layout raiz já aplica o template "%s · MR Grow"; repetir a marca aqui
       produzia "… · MR Grow · MR Grow" na aba do navegador. */
    title: proposta ? proposta.titulo : "Proposta",
    // Documento comercial de terceiro: fora do índice de busca.
    robots: { index: false, follow: false },
  };
}

export default async function PaginaProposta({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposta = await carregarPorToken(token);
  if (!proposta) notFound();

  return (
    <div className={`${display.variable} ${texto.variable}`}>
      <Deck proposta={proposta} />
    </div>
  );
}
