import type { Metadata, Viewport } from "next";
/* Fontes servidas do próprio projeto, e não do `next/font/google`.

   O build na Hostinger caiu buscando fonte na rede — o carregador do
   Google pede o CSS em tempo de compilação e quebrou com um `null`
   quando a resposta não veio como esperado. Eram seis famílias em dois
   layouts: seis chances de o deploy falhar por motivo que não tem nada
   a ver com o código.

   São as versões variáveis: um arquivo por família cobre toda a faixa
   de peso, e o visitante também deixa de fazer uma ida ao
   `fonts.gstatic.com` para ver a página. */
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { MARCA } from "@/lib/marca";
import "./globals.css";
import { SCRIPT_TEMA } from "@/components/painel/tema";

// Fontes auto-hospedadas: sem requisição bloqueante ao Google e sem salto de layout.
const inter = localFont({
  src: "../fontes/inter.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--fonte-sans",
});

const sora = localFont({
  src: "../fontes/sora.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--fonte-display",
});

/* Só a seção de escopos usa esta: nomes, números e a palavra de fundo.
   Poucas palavras, então o arquivo é barato, e ela dá a esses elementos
   um caráter que a Sora, usada em todos os títulos do site, não daria. */
/* A fonte do painel. Uma família só, variando o peso, como nas
   referências de dashboard: a Inter é neutra demais para dar caráter e
   a Sora é de display, pesada para tabela e formulário. */
const jakarta = localFont({
  src: "../fontes/jakarta.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--fonte-painel",
});

const grotesk = localFont({
  src: "../fontes/grotesk.woff2",
  weight: "400 700",
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
  /* O iPhone não lê o manifesto: ele tem as próprias marcas para abrir em
     tela cheia, e sem elas "Adicionar à Tela de Início" cria um atalho
     que abre no Safari com barra de endereço — ou seja, não vira app. */
  appleWebApp: {
    capable: true,
    title: MARCA.nome,
    statusBarStyle: "black-translucent",
  },
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
  /* Respeita o recorte da câmera e a barra de gestos do iPhone: sem isto
     a tela cheia do app deixa faixas brancas em cima e embaixo. */
  viewportFit: "cover",
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
