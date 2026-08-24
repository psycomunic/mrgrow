import { NextResponse, type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

const ROTAS_PRIVADAS = ["/painel", "/portal"];
const ROTAS_AUTH = ["/entrar", "/cadastro", "/recuperar-senha"];

export async function middleware(request: NextRequest) {
  const { resposta, user, configurado } = await atualizarSessao(request);
  const { pathname } = request.nextUrl;

  const ehPrivada = ROTAS_PRIVADAS.some((r) => pathname.startsWith(r));
  const ehAuth = ROTAS_AUTH.some((r) => pathname.startsWith(r));

  // Modo demonstração: sem Supabase configurado, o painel abre livremente.
  if (!configurado) return resposta;

  if (ehPrivada && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  if (ehAuth && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/painel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
