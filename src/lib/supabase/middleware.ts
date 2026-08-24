import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Renova a sessão do Supabase a cada request e devolve o usuário. */
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem credenciais ainda: deixa passar para o projeto rodar recém-clonado.
  if (!url || !chave || url.includes("xxxxxxxxxxxx")) {
    return { resposta, user: null, configurado: false as const };
  }

  const supabase = createServerClient(
    url,
    chave,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaDefinir) {
          cookiesParaDefinir.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          cookiesParaDefinir.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { resposta, user, configurado: true as const };
  } catch {
    return { resposta, user: null, configurado: true as const };
  }
}
