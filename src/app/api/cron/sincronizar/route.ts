import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { sincronizarOrganizacao, janelaPadrao } from "@/lib/integracoes/sincronizar";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Job diário: sincroniza métricas de todas as organizações. */
export async function GET(request: NextRequest) {
  const autorizado =
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` ||
    request.nextUrl.searchParams.get("segredo") === process.env.CRON_SECRET;

  if (!process.env.CRON_SECRET || !autorizado) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const db = criarClienteAdmin();
  const { data: orgs } = await db.from("organizacoes").select("id");

  const resultados = [];
  for (const org of orgs ?? []) {
    resultados.push({ org: org.id, ...(await sincronizarOrganizacao(org.id, janelaPadrao(3))) });
  }

  return NextResponse.json({ ok: true, resultados });
}
