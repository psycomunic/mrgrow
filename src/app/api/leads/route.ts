import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { dispararGatilho } from "@/lib/automacoes";
import { enviarEventoCapi } from "@/lib/capi";
import { ipDaRequisicao, limitar } from "@/lib/limite";

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

/** Slug da organização que recebe os leads do site. */
const SLUG_ORGANIZACAO = process.env.ORGANIZACAO_PADRAO_SLUG ?? "mr-grow";

export async function POST(request: NextRequest) {
  /* Rota pública sem limite era um convite: um script enchia a tabela de
     leads, disparava as automações (e portanto notificações, e-mails e
     WhatsApp) e mandava eventos falsos para a CAPI da Meta, estragando a
     otimização das campanhas com dados inventados. */
  const ipOrigem = ipDaRequisicao(request.headers);
  const veredito = limitar(`leads:${ipOrigem}`, 5, 10 * 60_000);
  if (!veredito.permitido) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(veredito.esperarSegundos) } },
    );
  }

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
  /* `ip` e `user_agent` ficam gravados para atribuição e antifraude. São dados
     pessoais: a política de privacidade do site precisa declará-los e a
     retenção deve ser limitada (uma rotina de expurgo em `leads` resolve). */
  const ip = ipOrigem === "desconhecido" ? undefined : ipOrigem;

  try {
    const db = criarClienteAdmin();

    const { data: org, error: erroOrg } = await db
      .from("organizacoes")
      .select("id")
      .eq("slug", SLUG_ORGANIZACAO)
      .maybeSingle();

    /* Gravar com `organizacao_id: null` era o pior desfecho possível: o lead
       ficava órfão, fora da RLS de qualquer organização e legível por
       qualquer visitante com a chave anônima (que é pública por natureza).
       Sem organização resolvida, a rota falha e o erro aparece no log. */
    if (erroOrg || !org?.id) {
      console.error(
        `[leads] organização "${SLUG_ORGANIZACAO}" não encontrada — lead recusado`,
        erroOrg,
      );
      return NextResponse.json({ erro: "Não foi possível registrar o lead" }, { status: 503 });
    }

    const { data: lead, error } = await db
      .from("leads")
      .insert({
        organizacao_id: org.id,
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

    /* `after` em vez de `void`: numa função serverless o processo é congelado
       assim que a resposta sai, e o disparo com `void` morria pelo caminho de
       forma intermitente — o lead entrava e ninguém era avisado. */
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const urlOrigem = `${request.nextUrl.origin}${dados.pagina}`;

    after(async () => {
      try {
        await dispararGatilho(org.id, "lead_criado", {
          lead_id: lead.id,
          nome: dados.nome,
          origem: dados.origem,
          url: "/painel/crm",
        });
      } catch (erro) {
        console.error("[leads] gatilho lead_criado falhou", erro);
      }

      try {
        await enviarEventoCapi({
          evento: "Lead",
          eventId: dados.event_id,
          email: dados.email,
          telefone: dados.telefone,
          ip,
          userAgent,
          urlOrigem,
          fbclid: dados.utm?.fbclid,
        });
      } catch (erro) {
        console.error("[leads] evento da CAPI falhou", erro);
      }
    });

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (erro) {
    console.error("[leads] falha ao gravar", erro);
    return NextResponse.json({ erro: "Não foi possível registrar o lead" }, { status: 500 });
  }
}
