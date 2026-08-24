import { Bricolage_Grotesque, Schibsted_Grotesk } from "next/font/google";
import { Cabecalho } from "./_componentes/cabecalho";
import { Rodape } from "./_componentes/rodape";
import { AcoesFlutuantes } from "./_componentes/acoes-flutuantes";
import { Rastreadores } from "@/components/site/rastreadores";
import "./sitio.css";
import "./secoes.css";

// Bricolage Grotesque: grotesca de largura irregular, com desenho próprio.
// O eixo wdth deixa o título grande respirar sem virar bloco.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth", "opsz"],
  display: "swap",
  variable: "--fonte-display",
});

// Schibsted Grotesk: texto editorial, legível sobre fundo escuro.
const texto = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-texto",
});

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sitio ${display.variable} ${texto.variable}`}>
      <Rastreadores />
      <Cabecalho />
      <main>{children}</main>
      <Rodape />
      <AcoesFlutuantes />
    </div>
  );
}
