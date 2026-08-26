import { NextResponse, type NextRequest } from "next/server";
import { exigirEquipe } from "@/lib/sessao";
import { pode } from "@/lib/papeis";
import { cookieDoEstado, gerarEstado, OPCOES_COOKIE } from "@/lib/oauth";
import { urlAutorizacaoMeta } from "@/lib/integracoes/meta";

export const runtime = "nodejs";

const PROVEDOR = "meta";

export async function GET(request: NextRequest) {
  /* `exigirSessao` não bloqueava o papel "cliente": um cliente da agência com
     login no portal conseguia iniciar a conexão e, no callback, sobrescrever
     o token da própria agência (o upsert usa `conta_externa_id: "me"`). */
  const sessao = await exigirEquipe();
  if (!pode(sessao.papel, "integracoes", "editar")) {
    return NextResponse.redirect(
      new URL("/painel/integracoes?erro=sem_permissao", request.nextUrl.origin),
    );
  }

  const estado = gerarEstado(sessao.organizacaoId);
  const resposta = NextResponse.redirect(urlAutorizacaoMeta(estado));
  resposta.cookies.set(
    cookieDoEstado(PROVEDOR),
    estado,
    OPCOES_COOKIE(request.nextUrl.protocol === "https:"),
  );
  return resposta;
}
