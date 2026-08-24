import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Toaster } from "sonner";
import { MARCA } from "@/lib/marca";
import "./globals.css";

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
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
