import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { exigirEquipe } from "@/lib/sessao";
import { pode } from "@/lib/papeis";
import { ipDaRequisicao, limitar } from "@/lib/limite";
import { sincronizarOrganizacao, janelaPadrao } from "@/lib/integracoes/sincronizar";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const sessao = await exigirEquipe();

  /* Antes bastava não ser "cliente". Sincronizar consome cota das APIs de
     anúncio e escreve na base de métricas: é ação de quem administra as
     integrações, não de qualquer membro. */
  if (!pode(sessao.papel, "integracoes", "editar")) {
    return NextResponse.json({ erro: "sem permissão" }, { status: 403 });
  }

  /* Cada chamada percorre todas as contas conectadas e bate nas APIs da Meta
     e do Google. Clicar no botão dez vezes seguidas estoura a cota da conta
     de anúncio da agência inteira. */
  const cabecalhos = await headers();
  const veredito = limitar(
    `sincronizar:${sessao.organizacaoId}:${ipDaRequisicao(cabecalhos)}`,
    2,
    60_000,
  );
  if (!veredito.permitido) {
    return NextResponse.json(
      { erro: `Sincronização já em andamento. Tente em ${veredito.esperarSegundos}s.` },
      { status: 429, headers: { "Retry-After": String(veredito.esperarSegundos) } },
    );
  }

  try {
    const resultado = await sincronizarOrganizacao(sessao.organizacaoId, janelaPadrao(7));
    return NextResponse.json({ ok: true, ...resultado });
  } catch (erro) {
    console.error("[sincronizar]", erro);
    return NextResponse.json({ erro: "falha na sincronização" }, { status: 500 });
  }
}
