import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { exigirSessao } from "@/lib/sessao";
import { urlAutorizacaoMeta } from "@/lib/integracoes/meta";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessao = await exigirSessao();
  const estado = `${sessao.organizacaoId}.${crypto.randomBytes(8).toString("hex")}`;

  const resposta = NextResponse.redirect(urlAutorizacaoMeta(estado));
  resposta.cookies.set("mrg_oauth_estado", estado, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return resposta;
}
