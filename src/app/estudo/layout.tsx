import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import "./estudo.css";

// Outfit: geométrica, contemporânea, confiante em corpo grande.
const display = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--fonte-display",
});

// Manrope: humanista, ótima leitura sobre fundo escuro.
const texto = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fonte-texto",
});

export const metadata: Metadata = {
  title: "Estudo de direção · Assinatura",
  robots: { index: false, follow: false },
};

export default function LayoutEstudo({ children }: { children: React.ReactNode }) {
  return <div className={`pc ${display.variable} ${texto.variable}`}>{children}</div>;
}
