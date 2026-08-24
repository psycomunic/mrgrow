import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { dispararGatilho } from "@/lib/automacoes";
import { enviarEventoCapi } from "@/lib/capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Esquema = z.object({
  nome: z.string().min(3).max(120),
  email: z.email(),
  telefone: z.string().min(10).max(20),
  empresa: z.string().max(160).optional().default(""),
  instagram: z.string().max(120).optional().default(""),
  faturamento_mensal: z.string().max(80).optional().default(""),
  investimento_trafego: z.string().max(80).optional().default(""),
  servico_desejado: z.string().max(120).optional().default(""),
  mensagem: z.string().max(2000).optional().default(""),
  origem: z.string().max(60).optional().default("landing_page"),
  pagina: z.string().max(300).optional().default("/"),
  referrer: z.string().max(500).optional().default(""),
  utm: z.record(z.string(), z.string()).optional().default({}),
  event_id: z.string().max(80).optional(),
});

/** Pontuação simples para priorizar o follow-up comercial. */
function pontuar(dados: z.infer<typeof Esquema>) {
  let p = 0;
  const faixa = dados.faturamento_mensal;
  if (faixa.includes("Acima de R$ 300")) p += 40;
  else if (faixa.includes("100 mil a R$ 300")) p += 32;
  else if (faixa.includes("50 mil a R$ 100")) p += 24;
  else if (faixa.includes("20 mil a R$ 50")) p += 14;

  const investe = dados.investimento_trafego;
  if (investe.includes("Acima de R$ 30")) p += 30;
  else if (investe.includes("10 mil a R$ 30")) p += 24;
  else if (investe.includes("3 mil a R$ 10")) p += 16;
  else if (investe.includes("Até R$ 3")) p += 8;

  if (dados.mensagem.length > 60) p += 8;
  if (dados.instagram) p += 4;
  if (dados.utm?.utm_source) p += 4;
  return Math.min(p, 100);
}

export async function POST(request: NextRequest) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const analise = Esquema.safeParse(corpo);
  if (!analise.success) {
    return NextResponse.json(
      { erro: "Dados inválidos", detalhes: analise.error.issues.map((i) => i.path.join(".")) },
      { status: 422 },
    );
  }

  const dados = analise.data;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;

  try {
    const db = criarClienteAdmin();

    const { data: org } = await db.from("organizacoes").select("id").eq("slug", "mr-grow").maybeSingle();

    const { data: lead, error } = await db
      .from("leads")
      .insert({
        organizacao_id: org?.id ?? null,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        empresa: dados.empresa,
        instagram: dados.instagram,
        faturamento_mensal: dados.faturamento_mensal,
        investimento_trafego: dados.investimento_trafego,
        servico_desejado: dados.servico_desejado,
        mensagem: dados.mensagem,
        origem: dados.origem,
        pagina: dados.pagina,
        referrer: dados.referrer,
        utm: dados.utm,
        user_agent: request.headers.get("user-agent") ?? undefined,
        ip,
        fbclid: dados.utm?.fbclid ?? null,
        gclid: dados.utm?.gclid ?? null,
        pontuacao: pontuar(dados),
      })
      .select("id")
      .single();

    if (error) throw error;

    // Efeitos colaterais não bloqueiam a resposta ao usuário.
    if (org?.id) {
      void dispararGatilho(org.id, "lead_criado", {
        lead_id: lead.id,
        nome: dados.nome,
        origem: dados.origem,
        url: "/painel/crm",
      });
    }

    void enviarEventoCapi({
      evento: "Lead",
      eventId: dados.event_id,
      email: dados.email,
      telefone: dados.telefone,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
      urlOrigem: `${request.nextUrl.origin}${dados.pagina}`,
      fbclid: dados.utm?.fbclid,
    });

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (erro) {
    console.error("[leads] falha ao gravar", erro);
    return NextResponse.json({ erro: "Não foi possível registrar o lead" }, { status: 500 });
  }
}
