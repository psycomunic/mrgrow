import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Sora, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { MARCA } from "@/lib/marca";
import "./globals.css";
import { SCRIPT_TEMA } from "@/components/painel/tema";

// Fontes auto-hospedadas: sem requisição bloqueante ao Google e sem salto de layout.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--fonte-sans",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--fonte-display",
});

/* Só a seção de escopos usa esta: nomes, números e a palavra de fundo.
   Poucas palavras, então o arquivo é barato, e ela dá a esses elementos
   um caráter que a Sora, usada em todos os títulos do site, não daria. */
/* A fonte do painel. Uma família só, variando o peso, como nas
   referências de dashboard: a Inter é neutra demais para dar caráter e
   a Sora é de display, pesada para tabela e formulário. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--fonte-painel",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--fonte-cartaz",
});

export const metadata: Metadata = {
  metadataBase: new URL(MARCA.site),
  title: {
    default: `${MARCA.nome} · Tráfego pago e performance para negócios que querem escalar`,
    template: `%s · ${MARCA.nome}`,
  },
  description: MARCA.descricao,
  applicationName: MARCA.nome,
  authors: [{ name: MARCA.fundador }],
  keywords: [
    "agência de tráfego pago",
    "gestão de tráfego",
    "meta ads",
    "google ads",
    "marketing de performance",
    "MR Grow",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: MARCA.site,
    siteName: MARCA.nome,
    title: `${MARCA.nome} · Tráfego pago que vira faturamento`,
    description: MARCA.descricao,
    images: [{ url: "/marca/og.png", width: 1200, height: 630, alt: MARCA.nome }],
  },
  twitter: { card: "summary_large_image", images: ["/marca/og.png"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#04060b",
  width: "device-width",
  initialScale: 1,
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable} ${grotesk.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        {/* Antes de qualquer pintura: sem isto o painel piscaria escuro
            a cada carregamento de quem escolheu o tema claro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="antialiased">
        {children}
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
