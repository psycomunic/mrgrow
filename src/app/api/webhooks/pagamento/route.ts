import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { dispararGatilho } from "@/lib/automacoes";
import { hmacConfere, segredoConfere } from "@/lib/segredos";
import { hoje } from "@/lib/tempo";

export const runtime = "nodejs";

/**
 * Webhook do gateway de cobrança (Asaas/Stripe).
 * Dá baixa na fatura e dispara a automação de "fatura paga".
 *
 * A versão anterior era um buraco: se `ASAAS_API_KEY` não estivesse definida a
 * verificação era pulada por inteiro (fail-open), e um POST com o id de um
 * lançamento qualquer marcava a fatura de qualquer organização como paga —
 * ou, com um `event` sem RECEIVED/CONFIRMED, desfazia uma baixa já feita.
 * Agora: sem segredo configurado a rota recusa tudo, a assinatura é conferida
 * em tempo constante, e um evento repetido não é reprocessado.
 */

const EVENTOS_DE_BAIXA = ["RECEIVED", "CONFIRMED", "PAYMENT_SUCCEEDED", "SUCCEEDED"];

type Corpo = {
  event?: string;
  type?: string;
  payment?: { externalReference?: string; value?: number; id?: string };
  data?: { object?: { client_reference_id?: string; amount_received?: number; id?: string } };
};

function autenticado(request: NextRequest, corpoCru: string) {
  const segredoAsaas = process.env.ASAAS_WEBHOOK_TOKEN ?? process.env.ASAAS_API_KEY;
  if (segredoAsaas && segredoConfere(request.headers.get("asaas-access-token"), segredoAsaas)) {
    return true;
  }

  const segredoStripe = process.env.STRIPE_WEBHOOK_SECRET;
  if (segredoStripe && hmacConfere(corpoCru, request.headers.get("stripe-signature"), segredoStripe)) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  /* O corpo cru precisa vir antes de qualquer parse: HMAC é sobre os bytes
     exatos que o gateway assinou, não sobre o JSON reserializado. */
  const corpoCru = await request.text();

  if (!process.env.ASAAS_WEBHOOK_TOKEN && !process.env.ASAAS_API_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook pagamento] nenhum segredo de webhook configurado — recusando");
    return NextResponse.json({ erro: "webhook não configurado" }, { status: 503 });
  }

  if (!autenticado(request, corpoCru)) {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  let corpo: Corpo;
  try {
    corpo = JSON.parse(corpoCru) as Corpo;
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const evento = (corpo.event ?? corpo.type ?? "").toUpperCase();
  const referencia = corpo.payment?.externalReference ?? corpo.data?.object?.client_reference_id;
  const idGateway = corpo.payment?.id ?? corpo.data?.object?.id ?? null;
  const valorRecebido = corpo.payment?.value ?? corpo.data?.object?.amount_received;

  if (!referencia) return NextResponse.json({ ok: true, ignorado: "sem referência" });

  /* Só eventos de baixa mexem no lançamento. Antes, qualquer outro evento
     (inclusive um estorno ou uma simples atualização) rebaixava a fatura para
     "pendente" com valor_pago zerado. */
  if (!EVENTOS_DE_BAIXA.some((e) => evento.includes(e))) {
    return NextResponse.json({ ok: true, ignorado: evento || "evento sem nome" });
  }

  const db = criarClienteAdmin();

  const { data: lancamento, error: erroLeitura } = await db
    .from("lancamentos")
    .select("id, organizacao_id, cliente_id, valor, status, gateway_id")
    .eq("id", referencia)
    .maybeSingle();

  if (erroLeitura) {
    console.error("[webhook pagamento] falha ao ler o lançamento", erroLeitura);
    return NextResponse.json({ erro: "falha interna" }, { status: 500 });
  }
  if (!lancamento) return NextResponse.json({ ok: true, ignorado: "referência desconhecida" });

  /* Idempotência: gateway reenvia o mesmo evento até receber 200. Sem isto,
     cada reentrega redisparava a automação de fatura paga. */
  if (lancamento.status === "pago" && (!idGateway || lancamento.gateway_id === idGateway)) {
    return NextResponse.json({ ok: true, repetido: true });
  }

  const { error } = await db
    .from("lancamentos")
    .update({
      status: "pago",
      pago_em: hoje(),
      valor_pago: Number(valorRecebido ?? lancamento.valor ?? 0),
      gateway_id: idGateway,
    })
    .eq("id", lancamento.id);

  if (error) {
    console.error("[webhook pagamento] falha ao dar baixa", error);
    return NextResponse.json({ erro: "falha interna" }, { status: 500 });
  }

  /* `after` em vez de `void`: numa função serverless a execução congela ao
     responder, e o disparo com `void` se perdia de forma intermitente. */
  after(async () => {
    try {
      await dispararGatilho(lancamento.organizacao_id, "fatura_paga", {
        cliente_id: lancamento.cliente_id,
        valor: lancamento.valor,
        url: "/painel/financeiro",
      });
    } catch (erro) {
      console.error("[webhook pagamento] gatilho fatura_paga falhou", erro);
    }
  });

  return NextResponse.json({ ok: true });
}
