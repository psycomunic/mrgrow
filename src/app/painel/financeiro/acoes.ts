"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, fkDaOrganizacao, type Resultado } from "@/lib/acoes";
import { hoje } from "@/lib/tempo";

export type { Resultado };

export type DadosLancamento = {
  descricao: string;
  tipo: string;
  status: string;
  valor: number;
  vencimento: string;
  cliente_id: string | null;
  observacoes: string;
};

const TIPOS = ["receita", "despesa"];
const STATUS = ["pendente", "previsto", "pago", "atrasado", "cancelado"];

function validar(d: DadosLancamento): string | null {
  if (!d.descricao.trim()) return "Informe a descrição.";
  if (d.descricao.trim().length > 200) return "A descrição ficou longa demais.";
  if (!TIPOS.includes(d.tipo)) return "Tipo inválido.";
  if (!STATUS.includes(d.status)) return "Status inválido.";
  if (!Number.isFinite(d.valor) || d.valor <= 0) return "O valor precisa ser maior que zero.";
  if (d.valor > 100_000_000) return "Valor fora da faixa.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.vencimento)) return "Informe o vencimento.";
  if (Number.isNaN(new Date(d.vencimento).getTime())) return "Data de vencimento inválida.";
  if (d.observacoes.length > 2000) return "As observações ficaram longas demais.";
  return null;
}

function paraBanco(d: DadosLancamento) {
  return {
    descricao: d.descricao.trim(),
    tipo: d.tipo,
    status: d.status,
    valor: d.valor,
    vencimento: d.vencimento,
    competencia: d.vencimento,
    cliente_id: d.cliente_id || null,
    observacoes: d.observacoes.trim() || null,
    // Quem já nasce pago tem a data preenchida; o resto fica em aberto.
    pago_em: d.status === "pago" ? d.vencimento : null,
    valor_pago: d.status === "pago" ? d.valor : 0,
  };
}

export async function criarLancamento(d: DadosLancamento): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("financeiro", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    const { error } = await db.from("lancamentos").insert({
      organizacao_id: sessao.organizacaoId,
      criado_por: sessao.usuarioId,
      ...paraBanco(d),
    });

    if (error) return falha("criarLancamento", error, "Não foi possível criar o lançamento.");
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("criarLancamento", e, "Não foi possível criar o lançamento.");
  }
}

export async function atualizarLancamento(id: string, d: DadosLancamento): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("financeiro", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    /* `.select("id")` não é enfeite: sem ele, um id inexistente ou de outra
       organização devolve zero linhas afetadas sem erro — e a tela mostraria
       "salvo" para uma escrita que não aconteceu. */
    const { data, error } = await db
      .from("lancamentos")
      .update(paraBanco(d))
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("atualizarLancamento", error, "Não foi possível salvar.");
    if (!data?.length) return { ok: false, demo: false, erro: "Lançamento não encontrado." };
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarLancamento", e, "Não foi possível salvar.");
  }
}

/** Baixa rápida na tabela, sem abrir o formulário. */
export async function marcarPago(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("financeiro", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("lancamentos")
      .select("valor")
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .maybeSingle();

    if (error) return falha("marcarPago/leitura", error, "Não foi possível dar baixa.");
    if (!data) return { ok: false, demo: false, erro: "Lançamento não encontrado." };

    const { error: erroBaixa } = await db
      .from("lancamentos")
      .update({ status: "pago", pago_em: hoje(), valor_pago: Number(data.valor ?? 0) })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (erroBaixa) return falha("marcarPago", erroBaixa, "Não foi possível dar baixa.");
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("marcarPago", e, "Não foi possível dar baixa.");
  }
}

export async function excluirLancamento(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("financeiro", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("lancamentos")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("excluirLancamento", error, "Não foi possível excluir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Lançamento não encontrado." };
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirLancamento", e, "Não foi possível excluir.");
  }
}
