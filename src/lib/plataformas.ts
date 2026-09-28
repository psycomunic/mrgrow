/**
 * Rótulos das plataformas de mídia.
 *
 * Vivem fora de `diagnostico.ts` de propósito: aquele módulo é `server-only`
 * e importá-lo de um componente de cliente arrastaria o Supabase inteiro para
 * o navegador — o build quebra antes, com "server-only cannot be imported
 * from a Client Component". Aqui é só texto, e os dois lados podem usar.
 */
export const PLATAFORMAS = [
  { v: "meta_ads", r: "Meta Ads" },
  { v: "google_ads", r: "Google Ads" },
  { v: "tiktok_ads", r: "TikTok Ads" },
  { v: "google_analytics", r: "Google Analytics" },
] as const;

export function rotuloPlataforma(v: string) {
  return PLATAFORMAS.find((p) => p.v === v)?.r ?? v;
}
