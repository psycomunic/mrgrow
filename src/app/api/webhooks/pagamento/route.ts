import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { dispararGatilho } from "@/lib/automacoes";

export const runtime = "nodejs";

/**
 * Webhook de gateway de cobrança (Asaas/Stripe).
 * Dá baixa na fatura e dispara a automação de "fatura paga".
 */
export async function POST(request: NextRequest) {
  const assinatura = request.headers.get("asaas-access-token") ?? request.headers.get("stripe-signature");
  if (process.env.ASAAS_API_KEY && assinatura !== process.env.ASAAS_API_KEY) {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  const corpo = (await request.json()) as {
    event?: string;
    payment?: { externalReference?: string; value?: number; id?: string };
  };

  const referencia = corpo.payment?.externalReference;
  if (!referencia) return NextResponse.json({ ok: true, ignorado: true });

  const db = criarClienteAdmin();
  const pago = corpo.event?.includes("RECEIVED") || corpo.event?.includes("CONFIRMED");

  const { data: lancamento } = await db
    .from("lancamentos")
    .update({
      status: pago ? "pago" : "pendente",
      pago_em: pago ? new Date().toISOString().slice(0, 10) : null,
      valor_pago: pago ? (corpo.payment?.value ?? 0) : 0,
      gateway_id: corpo.payment?.id ?? null,
    })
    .eq("id", referencia)
    .select("organizacao_id, cliente_id, valor")
    .maybeSingle();

  if (pago && lancamento) {
    void dispararGatilho(lancamento.organizacao_id, "fatura_paga", {
      cliente_id: lancamento.cliente_id,
      valor: lancamento.valor,
      url: "/painel/financeiro",
    });
  }

  return NextResponse.json({ ok: true });
}
