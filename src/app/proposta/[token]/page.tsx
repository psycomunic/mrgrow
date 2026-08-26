import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Outfit, Manrope } from "next/font/google";
import { Deck } from "./deck";
import { carregarPorToken } from "@/lib/propostas";
import { MARCA } from "@/lib/marca";
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
    title: proposta ? `${proposta.titulo} · ${MARCA.nome}` : "Proposta",
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
