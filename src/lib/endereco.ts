import type { NextRequest } from "next/server";

/**
 * O endereço público da aplicação, para montar redirecionamento.
 *
 * `request.nextUrl.origin` não serve: na Hostinger o Node escuta em
 * `0.0.0.0:3000` atrás de um proxy, e é esse o endereço que ele devolve.
 * Sair da conta mandava o navegador para `https://0.0.0.0:3000/entrar`,
 * que não existe — e o mesmo aconteceria no retorno do OAuth das
 * integrações, onde o erro seria bem mais difícil de diagnosticar.
 *
 * A variável cadastrada vem primeiro de propósito, e não os cabeçalhos do
 * proxy. `X-Forwarded-Host` é escrito por quem faz a requisição: confiar
 * nele para montar redirecionamento deixa qualquer um apontar o retorno
 * do logout para o próprio domínio. Com a variável definida — e ela está,
 * em produção — não há o que injetar.
 *
 * Os cabeçalhos ficam como segunda opção para o caso de o app rodar sem a
 * variável, em ambiente de teste ou numa instalação nova.
 */
export function origemPublica(request: NextRequest) {
  const declarada = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (declarada) return declarada.replace(/\/+$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const protocolo = request.headers.get("x-forwarded-proto") ?? "https";
    return `${protocolo}://${host}`;
  }

  return request.nextUrl.origin;
}

/** Um endereço absoluto do próprio app, pronto para `NextResponse.redirect`. */
export function urlDoApp(request: NextRequest, caminho: string) {
  return `${origemPublica(request)}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
