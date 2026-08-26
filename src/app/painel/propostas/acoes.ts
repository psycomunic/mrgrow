"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { modoDemonstracao } from "@/lib/dados";
import { contextoDeAcao, falha, type Banco } from "@/lib/acoes";
import { escreverCondicoes, TOKEN_VALIDO } from "@/lib/propostas";
import { hoje } from "@/lib/tempo";

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
  if (d.titulo.trim().length > 200) return "O título ficou longo demais.";
  if (!d.cliente_nome.trim()) return "Informe o nome do cliente.";
  if (d.cliente_logo_url && !/^https:\/\//i.test(d.cliente_logo_url)) {
    return "O logo precisa ser uma URL https.";
  }
  if (!Number.isFinite(d.valor_mensal) || d.valor_mensal < 0) return "Valor mensal inválido.";
  if (!Number.isFinite(d.valor_setup) || d.valor_setup < 0) return "Valor de setup inválido.";
  if (d.valor_mensal + d.valor_setup <= 0) return "A proposta precisa de um valor.";
  if (d.valor_mensal > 10_000_000 || d.valor_setup > 10_000_000) return "Valor fora da faixa.";
  if (!d.escopo.trim()) return "Descreva ao menos um item do escopo.";
  if (d.escopo.length > 8000) return "O escopo ficou longo demais.";
  if (d.validade && !/^\d{4}-\d{2}-\d{2}$/.test(d.validade)) return "Data de validade inválida.";
  return null;
}

function paraBanco(d: DadosProposta) {
  return {
    titulo: d.titulo.trim(),
    cliente_nome: d.cliente_nome.trim(),
    cliente_logo_url: d.cliente_logo_url.trim() || null,
    introducao: d.introducao.trim() || null,
    escopo: d.escopo.trim(),
    condicoes: escreverCondicoes(d.valor_mensal, d.valor_setup, d.condicoes.trim()),
    /* Primeiro ciclo: recorrente + setup. Antes só o mensal ia para `total`,
       e todo relatório financeiro subestimava o contrato pelo valor do setup. */
    total: d.valor_mensal + d.valor_setup,
    validade: d.validade || null,
  };
}

/**
 * PRP-2026-001, contando as que já existem no ano.
 *
 * Há `unique (organizacao_id, numero)` no banco, e contar + somar 1 colide
 * quando duas propostas nascem no mesmo instante — ou depois de uma exclusão,
 * quando a contagem volta para um número já usado. Por isso a criação tenta
 * de novo com o número seguinte em vez de devolver erro ao usuário.
 */
async function proximoNumero(db: Banco, organizacaoId: string, tentativa: number) {
  const ano = new Date().getFullYear();
  const { data } = await db
    .from("propostas")
    .select("numero")
    .eq("organizacao_id", organizacaoId)
    .like("numero", `PRP-${ano}-%`)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultimo = Number((data as { numero?: string } | null)?.numero?.split("-").pop() ?? 0);
  return `PRP-${ano}-${String(ultimo + 1 + tentativa).padStart(3, "0")}`;
}

/** 23505 = unique_violation no Postgres. */
const CONFLITO = "23505";

export async function criarProposta(d: DadosProposta): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("propostas", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true, token: "demo-1" };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const { data, error } = await db
        .from("propostas")
        .insert({
          organizacao_id: sessao.organizacaoId,
          numero: await proximoNumero(db, sessao.organizacaoId, tentativa),
          ...paraBanco(d),
          status: "enviada",
          enviada_em: new Date().toISOString(),
          criado_por: sessao.usuarioId,
        })
        .select("token_publico")
        .single();

      if (!error && data) {
        revalidatePath("/painel/propostas");
        return { ok: true, demo: false, token: (data as { token_publico: string }).token_publico };
      }

      const codigo = (error as { code?: string } | null)?.code;
      if (codigo !== CONFLITO) return falha("criarProposta", error, "Não foi possível criar.");
    }

    return falha("criarProposta", "numeração esgotou as tentativas", "Não foi possível criar.");
  } catch (e) {
    return falha("criarProposta", e, "Não foi possível criar.");
  }
}

export async function atualizarProposta(id: string, d: DadosProposta): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("propostas", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("propostas")
      .update(paraBanco(d))
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("atualizarProposta", error, "Não foi possível salvar.");
    if (!data?.length) return { ok: false, demo: false, erro: "Proposta não encontrada." };
    revalidatePath("/painel/propostas");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarProposta", e, "Não foi possível salvar.");
  }
}

export async function excluirProposta(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("propostas", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("propostas")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("excluirProposta", error, "Não foi possível excluir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Proposta não encontrada." };
    revalidatePath("/painel/propostas");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirProposta", e, "Não foi possível excluir.");
  }
}

/**
 * Registra o aceite feito na página pública.
 *
 * Quem aceita não tem sessão, então o caminho anterior (cliente anônimo) não
 * passava pela RLS de escrita: o update afetava zero linhas, `error` vinha
 * nulo e a função devolvia sucesso. O cliente via "proposta aceita" e o
 * painel da agência continuava com a proposta em aberto — aceite perdido em
 * silêncio. Aqui o service role grava, o token é o que autoriza, e o número
 * de linhas afetadas é conferido.
 */
export async function aceitarProposta(token: string, nome: string): Promise<Resultado> {
  const assinatura = nome.trim();
  if (!assinatura) return { ok: false, demo: false, erro: "Escreva o seu nome para aceitar." };
  if (assinatura.length > 120) return { ok: false, demo: false, erro: "Nome longo demais." };

  if (modoDemonstracao()) return { ok: true, demo: true };
  if (!TOKEN_VALIDO.test(token)) return { ok: false, demo: false, erro: "Link inválido." };

  try {
    const db = criarClienteAdmin();
    const { data, error } = await db
      .from("propostas")
      .update({
        status: "aceita",
        respondida_em: new Date().toISOString(),
        assinatura_nome: assinatura,
      })
      .eq("token_publico", token)
      .in("status", ["enviada", "visualizada"])
      .or(`validade.is.null,validade.gte.${hoje()}`)
      .select("id");

    if (error) return falha("aceitarProposta", error, "Não foi possível registrar o aceite.");
    if (!data?.length) {
      return {
        ok: false,
        demo: false,
        erro: "Esta proposta não está mais disponível para aceite. Fale com a gente.",
      };
    }

    revalidatePath(`/proposta/${token}`);
    revalidatePath("/painel/propostas");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("aceitarProposta", e, "Não foi possível registrar o aceite.");
  }
}
