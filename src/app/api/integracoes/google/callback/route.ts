import { NextResponse, type NextRequest } from "next/server";
import { exigirSessao } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { cifrar } from "@/lib/cripto";
import { trocarCodigoPorTokenGoogle, listarContasGoogleAds } from "@/lib/integracoes/google";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessao = await exigirSessao();
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const estado = searchParams.get("state");
  const esperado = request.cookies.get("mrg_oauth_estado")?.value;

  if (!codigo || !estado || estado !== esperado) {
    return NextResponse.redirect(`${origin}/painel/integracoes?erro=estado_invalido`);
  }

  try {
    const token = await trocarCodigoPorTokenGoogle(codigo);
    const db = criarClienteAdmin();

    const { data: integracao, error } = await db
      .from("integracoes")
      .upsert(
        {
          organizacao_id: sessao.organizacaoId,
          provedor: "google_ads",
          status: "conectada",
          rotulo: "Google",
          token_acesso_cifrado: cifrar(token.access_token),
          token_atualizacao_cifrado: token.refresh_token ? cifrar(token.refresh_token) : null,
          expira_em: new Date(Date.now() + token.expires_in * 1000).toISOString(),
          escopos: token.scope?.split(" ") ?? [],
          conta_externa_id: "me",
          conectado_por: sessao.usuarioId,
          ultimo_erro: null,
        },
        { onConflict: "organizacao_id,provedor,conta_externa_id" },
      )
      .select("id")
      .single();

    if (error) throw error;

    let quantidade = 0;
    try {
      const contas = await listarContasGoogleAds(token.access_token);
      quantidade = contas.length;
      if (contas.length) {
        await db.from("contas_externas").upsert(
          contas.map((id) => ({
            organizacao_id: sessao.organizacaoId,
            integracao_id: integracao.id,
            provedor: "google_ads" as const,
            tipo: "conta_anuncio",
            id_externo: id,
            nome: `Google Ads ${id}`,
          })),
          { onConflict: "organizacao_id,provedor,id_externo" },
        );
      }
    } catch (erro) {
      // Sem developer token ainda: a conexão OAuth continua válida.
      console.warn("[google callback] não foi possível listar contas", erro);
    }

    return NextResponse.redirect(`${origin}/painel/integracoes?conectado=google&contas=${quantidade}`);
  } catch (erro) {
    console.error("[google callback]", erro);
    return NextResponse.redirect(`${origin}/painel/integracoes?erro=google`);
  }
}
