import "server-only";
import crypto from "node:crypto";
import { segredoConfere } from "@/lib/segredos";

/**
 * Estado (anti-CSRF) das conexões OAuth.
 *
 * Antes, Meta e Google gravavam o estado no MESMO cookie
 * (`mrg_oauth_estado`): começar duas conexões em paralelo fazia uma
 * sobrescrever o estado da outra, e o cookie continuava válido por 10 minutos
 * depois do uso. Agora há um cookie por provedor, ele é apagado no retorno, e
 * a organização embutida no estado é conferida contra a sessão de quem
 * voltou — sem isso, o callback gravaria o token na organização que o
 * atacante escolhesse no parâmetro.
 */

export const cookieDoEstado = (provedor: string) => `mrg_oauth_${provedor}`;

export function gerarEstado(organizacaoId: string) {
  return `${organizacaoId}.${crypto.randomBytes(16).toString("hex")}`;
}

export function estadoValido(
  recebido: string | null,
  doCookie: string | undefined,
  organizacaoId: string,
) {
  if (!recebido || !doCookie) return false;
  if (!segredoConfere(recebido, doCookie)) return false;
  return recebido.split(".")[0] === organizacaoId;
}

export const OPCOES_COOKIE = (https: boolean) =>
  ({
    httpOnly: true,
    secure: https,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  }) as const;
