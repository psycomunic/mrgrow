import { NextResponse } from "next/server";
import { exigirSessao } from "@/lib/sessao";
import { sincronizarOrganizacao, janelaPadrao } from "@/lib/integracoes/sincronizar";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const sessao = await exigirSessao();
  if (sessao.papel === "cliente") {
    return NextResponse.json({ erro: "sem permissão" }, { status: 403 });
  }

  try {
    const resultado = await sincronizarOrganizacao(sessao.organizacaoId, janelaPadrao(7));
    return NextResponse.json({ ok: true, ...resultado });
  } catch (erro) {
    console.error("[sincronizar]", erro);
    return NextResponse.json({ erro: "falha na sincronização" }, { status: 500 });
  }
}
