import crypto from "node:crypto";

/**
 * Cifra/decifra tokens OAuth antes de gravar no banco (AES-256-GCM).
 * Chave em TOKEN_ENCRYPTION_KEY (32 bytes em base64):
 *   openssl rand -base64 32
 */

const ALGORITMO = "aes-256-gcm";

function chave() {
  const bruta = process.env.TOKEN_ENCRYPTION_KEY;
  if (!bruta) throw new Error("TOKEN_ENCRYPTION_KEY não configurada.");
  const buf = Buffer.from(bruta, "base64");
  if (buf.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY deve ter 32 bytes em base64.");
  return buf;
}

export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, chave(), iv);
  const dados = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), dados.toString("base64")].join(".");
}

export function decifrar(pacote: string): string {
  const [iv, tag, dados] = pacote.split(".");
  if (!iv || !tag || !dados) throw new Error("Pacote cifrado inválido.");
  const decipher = crypto.createDecipheriv(ALGORITMO, chave(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dados, "base64")), decipher.final()]).toString("utf8");
}

/** Hash SHA-256 em hex — usado na Conversions API da Meta. */
export function sha256(valor: string) {
  return crypto.createHash("sha256").update(valor.trim().toLowerCase()).digest("hex");
}

export function assinarHmac(carga: string, segredo: string) {
  return crypto.createHmac("sha256", segredo).update(carga).digest("hex");
}
