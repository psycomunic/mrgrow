import "server-only";
import crypto from "node:crypto";

/**
 * Comparação de segredos em tempo constante.
 *
 * `a === b` em string sai no primeiro byte diferente, o que vaza o prefixo
 * correto para quem consegue medir o tempo de resposta. `timingSafeEqual`
 * exige buffers do mesmo tamanho, então o comprimento é conferido antes —
 * ele já é público de qualquer forma.
 */
export function segredoConfere(recebido: string | null | undefined, esperado: string | undefined) {
  if (!recebido || !esperado) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Confere o header `Authorization: Bearer <segredo>` de uma rota de cron. */
export function cronAutorizado(cabecalhos: Headers) {
  const esperado = process.env.CRON_SECRET;
  if (!esperado) return false;
  const cabecalho = cabecalhos.get("authorization");
  if (!cabecalho?.startsWith("Bearer ")) return false;
  return segredoConfere(cabecalho.slice(7), esperado);
}

/**
 * Confere a assinatura HMAC-SHA256 do corpo cru de um webhook.
 * Aceita a assinatura em hex ou base64, com ou sem o prefixo "sha256=".
 */
export function hmacConfere(corpoCru: string, assinatura: string | null, segredo: string) {
  if (!assinatura) return false;
  const limpa = assinatura.replace(/^sha256=/i, "").trim();
  /* Um objeto Hmac só aceita `digest()` uma vez — daí duas instâncias. */
  const emHex = crypto.createHmac("sha256", segredo).update(corpoCru, "utf8").digest("hex");
  const emBase64 = crypto.createHmac("sha256", segredo).update(corpoCru, "utf8").digest("base64");
  return segredoConfere(limpa, emHex) || segredoConfere(limpa, emBase64);
}
