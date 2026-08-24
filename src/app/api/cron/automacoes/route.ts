import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { dispararGatilho } from "@/lib/automacoes";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Job horário: avalia os gatilhos que dependem de tempo
 * (faturas, contratos, tarefas atrasadas, contas sem veiculação).
 */
export async function GET(request: NextRequest) {
  const autorizado =
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` ||
    request.nextUrl.searchParams.get("segredo") === process.env.CRON_SECRET;

  if (!process.env.CRON_SECRET || !autorizado) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const db = criarClienteAdmin();
  const hoje = new Date().toISOString().slice(0, 10);
  const em3dias = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  const disparos: Array<Record<string, unknown>> = [];

  await db.rpc("marcar_lancamentos_atrasados");

  // Faturas vencendo em até 3 dias
  const { data: vencendo } = await db
    .from("lancamentos")
    .select("id, organizacao_id, cliente_id, descricao, valor, vencimento")
    .eq("tipo", "receita")
    .in("status", ["pendente", "previsto"])
    .gte("vencimento", hoje)
    .lte("vencimento", em3dias);

  for (const l of vencendo ?? []) {
    disparos.push(
      ...(await dispararGatilho(l.organizacao_id, "fatura_vencendo", {
        lancamento_id: l.id,
        cliente_id: l.cliente_id,
        valor: l.valor,
        vencimento: l.vencimento,
        url: "/painel/financeiro",
      })),
    );
  }

  // Faturas atrasadas
  const { data: atrasadas } = await db
    .from("lancamentos")
    .select("id, organizacao_id, cliente_id, valor, vencimento")
    .eq("tipo", "receita")
    .eq("status", "atrasado");

  for (const l of atrasadas ?? []) {
    disparos.push(
      ...(await dispararGatilho(l.organizacao_id, "fatura_atrasada", {
        lancamento_id: l.id,
        cliente_id: l.cliente_id,
        valor: l.valor,
        url: "/painel/financeiro",
      })),
    );
  }

  // Tarefas atrasadas
  const { data: tarefas } = await db
    .from("tarefas")
    .select("id, organizacao_id, cliente_id, titulo, responsavel_id, vence_em")
    .lt("vence_em", hoje)
    .neq("status", "concluida");

  for (const t of tarefas ?? []) {
    disparos.push(
      ...(await dispararGatilho(t.organizacao_id, "tarefa_atrasada", {
        tarefa_id: t.id,
        cliente_id: t.cliente_id,
        responsavel_id: t.responsavel_id,
        url: "/painel/tarefas",
      })),
    );
  }

  return NextResponse.json({ ok: true, disparos: disparos.length });
}
