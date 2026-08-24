import { Outfit, Manrope } from "next/font/google";
import { Cabecalho } from "./_componentes/cabecalho";
import { Rodape } from "./_componentes/rodape";
import { AcoesFlutuantes } from "./_componentes/acoes-flutuantes";
import { Rastreadores } from "@/components/site/rastreadores";
import "./sitio.css";
import "./secoes.css";

// Outfit: geométrica, confiante em caixa alta e corpo grande.
const display = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--fonte-display",
});

// Manrope: humanista, boa leitura sobre fundo escuro.
const texto = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fonte-texto",
});

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sitio ${display.variable} ${texto.variable}`}>
      {/* Marca antes da pintura que há JS: só então o reveal esconde
          os blocos. Sem isso, falha de script deixaria a página vazia. */}
      <script
        dangerouslySetInnerHTML={{ __html: 'document.documentElement.dataset.js="sim"' }}
      />
      <Rastreadores />
      <Cabecalho />
      <main>{children}</main>
      <Rodape />
      <AcoesFlutuantes />
    </div>
  );
}
