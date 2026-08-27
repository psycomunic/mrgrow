/** Identidade e dados públicos da MR Grow, fonte única de verdade do site. */

/**
 * Lê uma variável pública tratando string vazia como ausente.
 *
 * `??` sozinho não serve: uma variável cadastrada e vazia na Vercel passa
 * pelo nullish e chega como `""`. No caso do endereço do site isso vira
 * `new URL("")` no metadataBase, que lança e derruba o build inteiro.
 */
function publica(valor: string | undefined, padrao: string) {
  const limpo = valor?.trim();
  return limpo ? limpo : padrao;
}

/**
 * Endereço público do site.
 *
 * Sem `NEXT_PUBLIC_SITE_URL` cadastrada, cai no domínio que a própria
 * Vercel injeta, para o deploy funcionar antes de o domínio final existir.
 * Só variáveis `NEXT_PUBLIC_` entram aqui: elas são substituídas no build,
 * então servidor e cliente enxergam o mesmo valor e não há divergência de
 * hidratação.
 */
function enderecoDoSite() {
  const declarado = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (declarado) return declarado.replace(/\/+$/, "");

  const naVercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (naVercel) return `https://${naVercel}`;

  return "https://mrgrow.com.br";
}

export const MARCA = {
  nome: "MR Grow",
  nomeCompleto: "MR Grow · Assessoria de Marketing, Conteúdo e Performance",
  fundador: "Mateus Rodrigues",
  descricao:
    "Assessoria de marketing que une estratégia, produção de conteúdo e tráfego pago para transformar a comunicação da sua marca em faturamento.",
  site: enderecoDoSite(),
  email: "contato@mrgrow.com.br",
  whatsapp: publica(process.env.NEXT_PUBLIC_WHATSAPP, "5500000000000"),
  instagramAgencia: publica(
    process.env.NEXT_PUBLIC_INSTAGRAM,
    "https://www.instagram.com/mrgrow.ag/",
  ),
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
