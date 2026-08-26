"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { supabaseConfigurado } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { escreverCondicoes } from "@/lib/propostas";

export type Resultado = { ok: boolean; demo: boolean; token?: string; erro?: string };

export type DadosProposta = {
  titulo: string;
  cliente_nome: string;
  cliente_logo_url: string;
  introducao: string;
  escopo: string;
  condicoes: string;
  valor_mensal: number;
  valor_setup: number;
  validade: string | null;
};

function validar(d: DadosProposta): string | null {
  if (!d.titulo.trim()) return "Informe o título da proposta.";
  if (!d.cliente_nome.trim()) return "Informe o nome do cliente.";
  if (d.cliente_logo_url && !/^https?:\/\//i.test(d.cliente_logo_url)) {
    return "O logo precisa ser uma URL começando com http.";
  }
  if (!Number.isFinite(d.valor_mensal) || d.valor_mensal < 0) return "Valor mensal inválido.";
  if (!Number.isFinite(d.valor_setup) || d.valor_setup < 0) return "Valor de setup inválido.";
  if (!d.escopo.trim()) return "Descreva ao menos um item do escopo.";
  return null;
}

async function contexto() {
  if (!supabaseConfigurado()) return null;
  const sessao = await obterSessao();
  if (!sessao) return null;
  return { sessao, db: await criarClienteServidor() };
}

/** PRP-2026-001, contando as que já existem no ano. */
async function proximoNumero(
  db: Awaited<ReturnType<typeof criarClienteServidor>>,
  organizacaoId: string,
) {
  const ano = new Date().getFullYear();
  const { count } = await db
    .from("propostas")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .like("numero", `PRP-${ano}-%`);
  return `PRP-${ano}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function criarProposta(d: DadosProposta): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true, token: "demo-1" };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("propostas")
      .insert({
        organizacao_id: sessao.organizacaoId,
        numero: await proximoNumero(db, sessao.organizacaoId),
        titulo: d.titulo.trim(),
        cliente_nome: d.cliente_nome.trim(),
        cliente_logo_url: d.cliente_logo_url.trim() || null,
        introducao: d.introducao.trim() || null,
        escopo: d.escopo.trim(),
        condicoes: escreverCondicoes(d.valor_mensal, d.valor_setup, d.condicoes.trim()),
        total: d.valor_mensal,
        validade: d.validade || null,
        status: "enviada",
        enviada_em: new Date().toISOString(),
        criado_por: sessao.usuarioId,
      })
      .select("token_publico")
      .single();

    if (error || !data) return { ok: false, demo: false, erro: "Não foi possível criar." };
    revalidatePath("/painel/propostas");
    return { ok: true, demo: false, token: (data as { token_publico: string }).token_publico };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível criar." };
  }
}

export async function atualizarProposta(id: string, d: DadosProposta): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("propostas")
      .update({
        titulo: d.titulo.trim(),
        cliente_nome: d.cliente_nome.trim(),
        cliente_logo_url: d.cliente_logo_url.trim() || null,
        introducao: d.introducao.trim() || null,
        escopo: d.escopo.trim(),
        condicoes: escreverCondicoes(d.valor_mensal, d.valor_setup, d.condicoes.trim()),
        total: d.valor_mensal,
        validade: d.validade || null,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return { ok: false, demo: false, erro: "Não foi possível salvar." };
    revalidatePath("/painel/propostas");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível salvar." };
  }
}

export async function excluirProposta(id: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("propostas")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return { ok: false, demo: false, erro: "Não foi possível excluir." };
    revalidatePath("/painel/propostas");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível excluir." };
  }
}

/** Registra o aceite feito na página pública. */
export async function aceitarProposta(token: string, nome: string): Promise<Resultado> {
  if (!nome.trim()) return { ok: false, demo: false, erro: "Escreva o seu nome para aceitar." };

  if (!supabaseConfigurado()) return { ok: true, demo: true };

  try {
    const db = await criarClienteServidor();
    const { error } = await db
      .from("propostas")
      .update({
        status: "aceita",
        respondida_em: new Date().toISOString(),
        assinatura_nome: nome.trim(),
      })
      .eq("token_publico", token)
      .in("status", ["enviada", "visualizada"]);

    if (error) return { ok: false, demo: false, erro: "Não foi possível registrar o aceite." };
    revalidatePath(`/proposta/${token}`);
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível registrar o aceite." };
  }
}
