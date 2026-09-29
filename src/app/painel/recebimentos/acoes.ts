"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, pertence, type Resultado } from "@/lib/acoes";
import { hoje } from "@/lib/tempo";

export type { Resultado };

/**
 * Marca o recebimento como pago — é o check da planilha.
 *
 * Só muda o status de um lançamento que já existe. A primeira versão
 * criava a linha na hora, porque a tela gerava cobrança a partir do
 * contrato; isso produzia cobrança para cliente cujo contrato ainda nem
 * tinha começado e escondia as cobranças avulsas. Agora a tela lê a mesma
 * tabela do financeiro, e marcar não inventa nada.
 */
export async function marcarRecebido(lancamentoId: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("financeiro", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "lancamentos", lancamentoId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Lançamento não encontrado." };
    }

    const { data: atual } = await db
      .from("lancamentos")
      .select("valor, vencimento")
      .eq("id", lancamentoId)
      .maybeSingle();

    const l = atual as { valor: number | string; vencimento: string } | null;
    if (!l) return { ok: false, demo: false, erro: "Lançamento não encontrado." };

    /* Quita na data de hoje quando o vencimento já passou, e na data do
       vencimento quando ainda não chegou: assim o "pago em" nunca fica no
       futuro nem antes de a cobrança existir. */
    const dia = hoje();
    const { error } = await db
      .from("lancamentos")
      .update({
        status: "pago",
        valor_pago: Number(l.valor ?? 0),
        pago_em: l.vencimento > dia ? l.vencimento : dia,
      })
      .eq("id", lancamentoId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("marcarRecebido", error, "Não foi possível marcar.");

    revalidatePath("/painel/recebimentos");
    revalidatePath("/painel/financeiro");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("marcarRecebido", e, "Não foi possível marcar.");
  }
}

/**
 * Desfaz o check.
 *
 * Volta para pendente em vez de apagar: um clique errado não pode sumir
 * com o histórico de uma cobrança que existiu.
 */
export async function desmarcarRecebido(lancamentoId: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("financeiro", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "lancamentos", lancamentoId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Lançamento não encontrado." };
    }

    const { error } = await db
      .from("lancamentos")
      .update({ status: "pendente", valor_pago: 0, pago_em: null })
      .eq("id", lancamentoId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("desmarcarRecebido", error, "Não foi possível desfazer.");

    revalidatePath("/painel/recebimentos");
    revalidatePath("/painel/financeiro");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("desmarcarRecebido", e, "Não foi possível desfazer.");
  }
}
