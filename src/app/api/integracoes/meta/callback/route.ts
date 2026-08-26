import { NextResponse, type NextRequest } from "next/server";
import { exigirEquipe } from "@/lib/sessao";
import { pode } from "@/lib/papeis";
import { cookieDoEstado, estadoValido } from "@/lib/oauth";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { cifrar } from "@/lib/cripto";
import { trocarCodigoPorToken, tokenLongaDuracao, listarContasDeAnuncio } from "@/lib/integracoes/meta";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessao = await exigirEquipe();
  const { searchParams, origin } = request.nextUrl;

  if (!pode(sessao.papel, "integracoes", "editar")) {
    return NextResponse.redirect(`${origin}/painel/integracoes?erro=sem_permissao`);
  }

  const codigo = searchParams.get("code");
  const estado = searchParams.get("state");
  const doCookie = request.cookies.get(cookieDoEstado("meta"))?.value;

  /* Um cookie de estado usado é um cookie queimado: apagar sempre, mesmo
     quando a validação falha, para não deixar 10 minutos de janela de reuso. */
  const limpar = (resposta: NextResponse) => {
    resposta.cookies.delete(cookieDoEstado("meta"));
    return resposta;
  };

  if (!codigo || !estadoValido(estado, doCookie, sessao.organizacaoId)) {
    return limpar(NextResponse.redirect(`${origin}/painel/integracoes?erro=estado_invalido`));
  }

  try {
    const curto = await trocarCodigoPorToken(codigo);
    const longo = await tokenLongaDuracao(curto.access_token);
    const contas = await listarContasDeAnuncio(longo.access_token);

    /* Cliente autenticado, não service role: assim a policy `integracoes_escrever`
       (restrita a gestor) também vale, em vez de ser ignorada. */
    const db = await criarClienteServidor();
    const expiraEm = longo.expires_in
      ? new Date(Date.now() + longo.expires_in * 1000).toISOString()
      : null;

    const { data: integracao, error } = await db
      .from("integracoes")
      .upsert(
        {
          organizacao_id: sessao.organizacaoId,
          provedor: "meta_ads",
          status: "conectada",
          rotulo: "Meta Ads",
          token_acesso_cifrado: cifrar(longo.access_token),
          expira_em: expiraEm,
          conta_externa_id: "me",
          conectado_por: sessao.usuarioId,
          ultima_sincronizacao_em: null,
          ultimo_erro: null,
        },
        { onConflict: "organizacao_id,provedor,conta_externa_id" },
      )
      .select("id")
      .single();

    if (error) throw error;

    if (contas.length) {
      await db.from("contas_externas").upsert(
        contas.map((c) => ({
          organizacao_id: sessao.organizacaoId,
          integracao_id: integracao.id,
          provedor: "meta_ads" as const,
          tipo: "conta_anuncio",
          id_externo: String(c.id),
          nome: String(c.name ?? c.account_id ?? c.id),
          moeda: (c.currency as string) ?? "BRL",
          fuso_horario: (c.timezone_name as string) ?? null,
          metadados: c,
        })),
        { onConflict: "organizacao_id,provedor,id_externo" },
      );
    }

    return limpar(NextResponse.redirect(`${origin}/painel/integracoes?conectado=meta&contas=${contas.length}`));
  } catch (erro) {
    console.error("[meta callback]", erro);
    return limpar(NextResponse.redirect(`${origin}/painel/integracoes?erro=meta`));
  }
}
