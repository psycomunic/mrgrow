import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { dispararGatilho } from "@/lib/automacoes";
import { cronAutorizado } from "@/lib/segredos";
import { emDias, hoje } from "@/lib/tempo";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Job horário: avalia os gatilhos que dependem de tempo
 * (faturas, contratos, tarefas atrasadas, contas sem veiculação).
 *
 * Duas correções em relação à versão anterior: o segredo só é aceito no
 * header (na query string ele vaza em log de acesso, histórico de proxy e
 * Referer), e cada fato carrega uma chave de deduplicação por dia — antes,
 * uma fatura atrasada gerava 24 notificações por dia, uma por execução.
 */
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request.headers)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const db = criarClienteAdmin();
  /* Datas no fuso da agência, não em UTC: entre 21h e meia-noite em Brasília
     o "hoje" do servidor já é amanhã, e faturas eram marcadas atrasadas um
     dia antes da hora. */
  const dia = hoje();
  const em3dias = emDias(3);
  const disparos: Array<Record<string, unknown>> = [];

  const { error: erroRpc } = await db.rpc("marcar_lancamentos_atrasados");
  if (erroRpc) console.error("[cron automacoes] marcar_lancamentos_atrasados", erroRpc);

  // Faturas vencendo em até 3 dias
  const { data: vencendo, error: erroVencendo } = await db
    .from("lancamentos")
    .select("id, organizacao_id, cliente_id, descricao, valor, vencimento")
    .eq("tipo", "receita")
    .in("status", ["pendente", "previsto"])
    .gte("vencimento", dia)
    .lte("vencimento", em3dias);
  if (erroVencendo) console.error("[cron automacoes] faturas vencendo", erroVencendo);

  for (const l of vencendo ?? []) {
    disparos.push(
      ...(await dispararGatilho(
        l.organizacao_id,
        "fatura_vencendo",
        {
          lancamento_id: l.id,
          cliente_id: l.cliente_id,
          valor: l.valor,
          vencimento: l.vencimento,
          url: "/painel/financeiro",
        },
        { chaveDedupe: `fatura_vencendo:${l.id}:${dia}` },
      )),
    );
  }

  // Faturas atrasadas
  const { data: atrasadas, error: erroAtrasadas } = await db
    .from("lancamentos")
    .select("id, organizacao_id, cliente_id, valor, vencimento")
    .eq("tipo", "receita")
    .eq("status", "atrasado");
  if (erroAtrasadas) console.error("[cron automacoes] faturas atrasadas", erroAtrasadas);

  for (const l of atrasadas ?? []) {
    disparos.push(
      ...(await dispararGatilho(
        l.organizacao_id,
        "fatura_atrasada",
        {
          lancamento_id: l.id,
          cliente_id: l.cliente_id,
          valor: l.valor,
          url: "/painel/financeiro",
        },
        { chaveDedupe: `fatura_atrasada:${l.id}:${dia}` },
      )),
    );
  }

  // Tarefas atrasadas
  const { data: tarefas, error: erroTarefas } = await db
    .from("tarefas")
    .select("id, organizacao_id, cliente_id, titulo, responsavel_id, vence_em")
    .lt("vence_em", dia)
    .neq("status", "concluida");
  if (erroTarefas) console.error("[cron automacoes] tarefas atrasadas", erroTarefas);

  for (const t of tarefas ?? []) {
    disparos.push(
      ...(await dispararGatilho(
        t.organizacao_id,
        "tarefa_atrasada",
        {
          tarefa_id: t.id,
          cliente_id: t.cliente_id,
          responsavel_id: t.responsavel_id,
          url: "/painel/tarefas",
        },
        { chaveDedupe: `tarefa_atrasada:${t.id}:${dia}` },
      )),
    );
  }

  // Contratos vencendo em até 30 dias
  const { data: contratos, error: erroContratos } = await db
    .from("clientes")
    .select("id, organizacao_id, nome, fim_contrato")
    .eq("status", "ativo")
    .gte("fim_contrato", dia)
    .lte("fim_contrato", emDias(30));
  if (erroContratos) console.error("[cron automacoes] contratos vencendo", erroContratos);

  for (const c of contratos ?? []) {
    disparos.push(
      ...(await dispararGatilho(
        c.organizacao_id,
        "contrato_vencendo",
        { cliente_id: c.id, fim_contrato: c.fim_contrato, url: `/painel/clientes` },
        { chaveDedupe: `contrato_vencendo:${c.id}:${dia}` },
      )),
    );
  }

  return NextResponse.json({ ok: true, dia, disparos: disparos.length });
}
