/** Identidade e dados públicos da MR Grow — fonte única de verdade do site. */

export const MARCA = {
  nome: "MR Grow",
  nomeCompleto: "MR Grow · Assessoria de Marketing e Performance",
  fundador: "Mateus Rodrigues",
  descricao:
    "Assessoria de marketing e performance que transforma investimento em anúncios em faturamento previsível.",
  site: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mrgrow.com.br",
  email: "contato@mrgrow.com.br",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5500000000000",
  instagramAgencia: process.env.NEXT_PUBLIC_INSTAGRAM ?? "https://www.instagram.com/mrgrow.ag/",
  instagramFundador: "https://www.instagram.com/mvteusrodrigues/",
  cidade: "Brasil",
} as const;

export function linkWhatsApp(mensagem?: string) {
  const texto = encodeURIComponent(
    mensagem ?? "Olá! Vim pelo site da MR Grow e quero fazer o diagnóstico gratuito.",
  );
  return `https://wa.me/${MARCA.whatsapp}?text=${texto}`;
}

export const CORES = {
  azul: "#1668f5",
  azulClaro: "#5798ff",
  azulEscuro: "#0b4fd1",
  preto: "#04060b",
  grafite: "#0b0f17",
} as const;
