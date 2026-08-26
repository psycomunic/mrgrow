import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/**
 * O destino vem da query (`?proximo=`). O prefixo de origem já impedia
 * redirect para fora do domínio, mas ainda permitia levar o usuário a
 * qualquer rota interna depois do login — inclusive uma que ele não deveria
 * abrir. Só as duas áreas logadas são aceitas.
 */
function destinoSeguro(proximo: string | null) {
  if (!proximo) return "/painel";
  const permitidas = ["/painel", "/portal", "/convite"];
  if (!permitidas.some((r) => proximo.startsWith(r))) return "/painel";
  // Barra dupla é interpretada como host pelo navegador: //exemplo.com
  if (proximo.startsWith("//")) return "/painel";
  return proximo;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const proximo = destinoSeguro(searchParams.get("proximo"));

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${proximo}`);
    console.error("[auth callback] troca de código falhou", error);
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
}
