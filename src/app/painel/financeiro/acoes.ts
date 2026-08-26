"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { supabaseConfigurado } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";

export type Resultado = { ok: boolean; demo: boolean; erro?: string };

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
  if (!TIPOS.includes(d.tipo)) return "Tipo inválido.";
  if (!STATUS.includes(d.status)) return "Status inválido.";
  if (!Number.isFinite(d.valor) || d.valor <= 0) return "O valor precisa ser maior que zero.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.vencimento)) return "Informe o vencimento.";
  return null;
}

async function contexto() {
  if (!supabaseConfigurado()) return null;
  const sessao = await obterSessao();
  if (!sessao) return null;
  return { sessao, db: await criarClienteServidor() };
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

  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    const { error } = await db.from("lancamentos").insert({
      organizacao_id: sessao.organizacaoId,
      criado_por: sessao.usuarioId,
      ...paraBanco(d),
    });

    if (error) return { ok: false, demo: false, erro: "Não foi possível criar o lançamento." };
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível criar o lançamento." };
  }
}

export async function atualizarLancamento(id: string, d: DadosLancamento): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("lancamentos")
      .update(paraBanco(d))
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return { ok: false, demo: false, erro: "Não foi possível salvar." };
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível salvar." };
  }
}

/** Baixa rápida na tabela, sem abrir o formulário. */
export async function marcarPago(id: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const { error } = await db
      .from("lancamentos")
      .update({ status: "pago", pago_em: hoje })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return { ok: false, demo: false, erro: "Não foi possível dar baixa." };
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível dar baixa." };
  }
}

export async function excluirLancamento(id: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("lancamentos")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return { ok: false, demo: false, erro: "Não foi possível excluir." };
    revalidatePath("/painel/financeiro");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível excluir." };
  }
}
