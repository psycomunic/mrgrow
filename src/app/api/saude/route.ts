import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/servidor";

export const dynamic = "force-dynamic";

/**
 * Mede a latência do servidor até o banco.
 *
 * Existe porque "está lento" não diz onde: pode ser a rede até o
 * Supabase, o número de idas ao banco numa ação, ou o render da página.
 * Aqui isolamos a primeira parcela — uma consulta trivial, repetida, sem
 * nada em volta.
 *
 * Protegido pelo `CRON_SECRET` porque expõe tempo de resposta interno, e
 * porque um endpoint aberto que consulta o banco é um convite a abuso.
 */
export async function GET(req: Request) {
  const chave = new URL(req.url).searchParams.get("chave");
  if (!process.env.CRON_SECRET || chave !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const db = criarClienteAdmin();
  const tempos: number[] = [];

  /* Seis idas em série, como uma Server Action faz: a primeira carrega a
     conexão TLS e costuma sair mais cara que as seguintes. */
  for (let i = 0; i < 6; i++) {
    const inicio = performance.now();
    await db.from("organizacoes").select("id").limit(1);
    tempos.push(Math.round(performance.now() - inicio));
  }

  const emParalelo = performance.now();
  await Promise.all(
    Array.from({ length: 6 }, () => db.from("organizacoes").select("id").limit(1)),
  );
  const paralelo = Math.round(performance.now() - emParalelo);

  return NextResponse.json({
    regiao: process.env.VERCEL_REGION ?? "hostinger",
    em_serie_ms: tempos,
    total_serie_ms: tempos.reduce((s, t) => s + t, 0),
    seis_em_paralelo_ms: paralelo,
  });
}
