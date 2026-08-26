import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { sincronizarOrganizacao, janelaPadrao } from "@/lib/integracoes/sincronizar";
import { cronAutorizado } from "@/lib/segredos";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Job diário: sincroniza métricas de todas as organizações. */
export async function GET(request: NextRequest) {
  /* Só header. O segredo na query string vaza em log de acesso e Referer. */
  if (!cronAutorizado(request.headers)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const db = criarClienteAdmin();
  const { data: orgs, error } = await db.from("organizacoes").select("id");
  if (error) {
    console.error("[cron sincronizar] falha ao listar organizações", error);
    return NextResponse.json({ erro: "falha interna" }, { status: 500 });
  }

  const resultados = [];
  for (const org of orgs ?? []) {
    resultados.push({ org: org.id, ...(await sincronizarOrganizacao(org.id, janelaPadrao(3))) });
  }

  return NextResponse.json({ ok: true, resultados });
}
