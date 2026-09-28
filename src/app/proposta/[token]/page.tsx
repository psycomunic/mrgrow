import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { Deck } from "./deck";
import { carregarMarcaPublica, carregarPorToken } from "@/lib/propostas";
import "./deck.css";

/* Três papéis, três vozes.

   O grotesco da Bricolage tem largura levemente comprimida e desenho
   "engenheirado" — serve ao que este documento é: um instrumento, não um
   anúncio. A Newsreader carrega a prosa: quem está decidindo gastar
   milhares por mês lê os parágrafos inteiros, e serifa com itálico de
   verdade sustenta leitura longa melhor que qualquer sans.

   A mono não é enfeite de código: ela dá algarismo tabular, e é isso que
   alinha a coluna de valores do investimento. Números que não se alinham
   parecem números que não batem. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-display",
});

const prosa = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fonte-prosa",
});

const dado = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fonte-dado",
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

  const marca = await carregarMarcaPublica(proposta.organizacao_id);

  return (
    <div className={`${display.variable} ${prosa.variable} ${dado.variable}`}>
      <Deck proposta={proposta} marca={marca} />
    </div>
  );
}
