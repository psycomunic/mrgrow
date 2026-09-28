"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, pertence, type Resultado } from "@/lib/acoes";

export type { Resultado };

const COMP = /^\d{4}-\d{2}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Marca o recebimento do mês como pago — é o check da planilha.
 *
 * Quando a linha ainda é só previsão (`id` nulo), ela nasce aqui: o
 * lançamento é criado já quitado. Marcar é o único momento em que a
 * previsão vira registro, e é de propósito — enquanto ninguém confirma,
 * não há dinheiro nenhum a contabilizar.
 */
export async function marcarRecebido(
  lancamentoId: string | null,
  dados: { clienteId: string; competencia: string; valor: number; vencimento: string },
): Promise<Resultado> {
  if (!COMP.test(dados.competencia)) return { ok: false, demo: false, erro: "Competência inválida." };
  if (!DATA.test(dados.vencimento)) return { ok: false, demo: false, erro: "Vencimento inválido." };
  if (!Number.isFinite(dados.valor) || dados.valor < 0) {
    return { ok: false, demo: false, erro: "Valor inválido." };
  }

  const ctx = await contextoDeAcao("financeiro", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (lancamentoId) {
      if (!(await pertence(db, "lancamentos", lancamentoId, sessao.organizacaoId))) {
        return { ok: false, demo: false, erro: "Lançamento não encontrado." };
      }
      const { error } = await db
        .from("lancamentos")
        .update({ status: "pago", valor_pago: dados.valor, pago_em: dados.vencimento })
        .eq("id", lancamentoId)
        .eq("organizacao_id", sessao.organizacaoId);

      if (error) return falha("marcarRecebido", error, "Não foi possível marcar.");
    } else {
      if (!(await pertence(db, "clientes", dados.clienteId, sessao.organizacaoId))) {
        return { ok: false, demo: false, erro: "Cliente não encontrado." };
      }
      const { data: cliente } = await db
        .from("clientes")
        .select("nome")
        .eq("id", dados.clienteId)
        .maybeSingle();

      const nome = (cliente as { nome: string } | null)?.nome ?? "Cliente";
      const { error } = await db.from("lancamentos").insert({
        organizacao_id: sessao.organizacaoId,
        cliente_id: dados.clienteId,
        tipo: "receita",
        status: "pago",
        descricao: `Mensalidade ${nome}`,
        valor: dados.valor,
        valor_pago: dados.valor,
        competencia: `${dados.competencia}-01`,
        vencimento: dados.vencimento,
        pago_em: dados.vencimento,
        recorrente: true,
        recorrencia_meses: 1,
      });

      if (error) return falha("marcarRecebido", error, "Não foi possível marcar.");
    }

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
 * com o histórico de uma cobrança que existiu, e o lançamento continua
 * na régua do mês esperando confirmação.
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
