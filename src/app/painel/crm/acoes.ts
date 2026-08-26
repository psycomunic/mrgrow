"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { supabaseConfigurado } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";

export type Resultado = { ok: boolean; demo: boolean; erro?: string };

/** Campos que o formulário do quadro edita. */
export type DadosNegocio = {
  titulo: string;
  contato: string;
  valor_mensal: number;
  valor_unico: number;
  temperatura: string;
  origem: string;
  previsao: string | null;
  etapa_id: string;
};

const TEMPERATURAS = ["quente", "morno", "frio"];

function validar(d: DadosNegocio): string | null {
  if (!d.titulo.trim()) return "Informe o nome do negócio.";
  if (d.titulo.trim().length > 120) return "O nome ficou longo demais.";
  if (!d.etapa_id) return "Selecione a etapa.";
  if (!TEMPERATURAS.includes(d.temperatura)) return "Temperatura inválida.";
  if (!Number.isFinite(d.valor_mensal) || d.valor_mensal < 0) return "Valor mensal inválido.";
  if (!Number.isFinite(d.valor_unico) || d.valor_unico < 0) return "Valor de setup inválido.";
  return null;
}

/**
 * Sem Supabase o painel roda em demonstração: as ações respondem `ok` para a
 * interface seguir viva, mas nada é gravado. O aviso no topo da tela já diz
 * isso ao usuário, então aqui basta sinalizar `demo`.
 */
async function contexto() {
  if (!supabaseConfigurado()) return null;
  const sessao = await obterSessao();
  if (!sessao) return null;
  return { sessao, db: await criarClienteServidor() };
}

/** Garante que o negócio pertence à organização de quem está editando. */
async function pertence(
  db: Awaited<ReturnType<typeof criarClienteServidor>>,
  organizacaoId: string,
  negocioId: string,
) {
  const { data } = await db
    .from("negocios")
    .select("id")
    .eq("id", negocioId)
    .eq("organizacao_id", organizacaoId)
    .maybeSingle();
  return !!data;
}

export async function criarNegocio(funilId: string | null, d: DadosNegocio): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contexto();
  if (!ctx || !funilId) return { ok: true, demo: true };

  const { sessao, db } = ctx;

  try {
    let contatoId: string | null = null;
    if (d.contato.trim()) {
      const { data: contato } = await db
        .from("contatos")
        .insert({ organizacao_id: sessao.organizacaoId, nome: d.contato.trim() })
        .select("id")
        .single();
      contatoId = (contato as { id: string } | null)?.id ?? null;
    }

    const { error } = await db.from("negocios").insert({
      organizacao_id: sessao.organizacaoId,
      funil_id: funilId,
      etapa_id: d.etapa_id,
      contato_id: contatoId,
      responsavel_id: sessao.usuarioId,
      titulo: d.titulo.trim(),
      valor_mensal: d.valor_mensal,
      valor_unico: d.valor_unico,
      temperatura: d.temperatura,
      origem: d.origem || null,
      previsao_fechamento: d.previsao || null,
    });

    if (error) return { ok: false, demo: false, erro: "Não foi possível criar o negócio." };
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível criar o negócio." };
  }
}

export async function atualizarNegocio(id: string, d: DadosNegocio): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, sessao.organizacaoId, id))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db
      .from("negocios")
      .update({
        etapa_id: d.etapa_id,
        titulo: d.titulo.trim(),
        valor_mensal: d.valor_mensal,
        valor_unico: d.valor_unico,
        temperatura: d.temperatura,
        origem: d.origem || null,
        previsao_fechamento: d.previsao || null,
      })
      .eq("id", id);

    if (error) return { ok: false, demo: false, erro: "Não foi possível salvar." };
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível salvar." };
  }
}

/**
 * Move o negócio de etapa. O trigger `ao_mover_negocio` grava o histórico
 * sozinho, então aqui só o `etapa_id` e a ordem mudam.
 */
export async function moverNegocio(
  id: string,
  etapaId: string,
  ordem: number,
): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, sessao.organizacaoId, id))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db
      .from("negocios")
      .update({ etapa_id: etapaId, ordem_kanban: ordem })
      .eq("id", id);

    if (error) return { ok: false, demo: false, erro: "Não foi possível mover." };
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível mover." };
  }
}

/** Fecha o negócio como ganho ou perdido; sai do quadro de abertos. */
export async function fecharNegocio(
  id: string,
  status: "ganho" | "perdido",
  motivo?: string,
): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, sessao.organizacaoId, id))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db
      .from("negocios")
      .update({ status, motivo_perda: status === "perdido" ? (motivo ?? null) : null })
      .eq("id", id);

    if (error) return { ok: false, demo: false, erro: "Não foi possível fechar." };
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível fechar." };
  }
}

export async function excluirNegocio(id: string): Promise<Resultado> {
  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, sessao.organizacaoId, id))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db.from("negocios").delete().eq("id", id);
    if (error) return { ok: false, demo: false, erro: "Não foi possível excluir." };
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível excluir." };
  }
}

/* ── Atividades do negócio ──────────────────────────────────────
   A tabela `atividades` já existia no schema e nenhuma tela usava. É o
   histórico de contato: nota, ligação, reunião, e-mail, WhatsApp. */

export type Atividade = {
  id: string;
  tipo: string;
  conteudo: string | null;
  criado_em: string;
  autor: string | null;
};

const TIPOS_ATIVIDADE = ["nota", "ligacao", "reuniao", "email", "whatsapp"];

/** Demonstração: dá o que ler no painel antes do banco existir. */
const ATIVIDADES_DEMO: Atividade[] = [
  {
    id: "a1",
    tipo: "reuniao",
    conteudo: "Diagnóstico feito. Conta com rastreamento quebrado e criativo parado há 3 meses.",
    criado_em: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    autor: "Mateus Rodrigues",
  },
  {
    id: "a2",
    tipo: "whatsapp",
    conteudo: "Retornou pedindo a proposta com o escopo de landing page incluso.",
    criado_em: new Date(Date.now() - 86_400_000).toISOString(),
    autor: "Mateus Rodrigues",
  },
];

export async function listarAtividades(negocioId: string): Promise<Atividade[]> {
  const ctx = await contexto();
  if (!ctx) return ATIVIDADES_DEMO;
  const { sessao, db } = ctx;

  try {
    const { data } = await db
      .from("atividades")
      .select("id, tipo, conteudo, criado_em, perfis(nome_completo)")
      .eq("negocio_id", negocioId)
      .eq("organizacao_id", sessao.organizacaoId)
      .order("criado_em", { ascending: false })
      .limit(50);

    type Linha = {
      id: string;
      tipo: string;
      conteudo: string | null;
      criado_em: string;
      perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
    };

    return ((data ?? []) as unknown as Linha[]).map((a) => {
      const p = Array.isArray(a.perfis) ? a.perfis[0] : a.perfis;
      return {
        id: a.id,
        tipo: a.tipo,
        conteudo: a.conteudo,
        criado_em: a.criado_em,
        autor: p?.nome_completo ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function registrarAtividade(
  negocioId: string,
  tipo: string,
  conteudo: string,
): Promise<Resultado> {
  if (!conteudo.trim()) return { ok: false, demo: false, erro: "Escreva algo antes de salvar." };
  if (conteudo.length > 2000) return { ok: false, demo: false, erro: "Texto longo demais." };
  if (!TIPOS_ATIVIDADE.includes(tipo)) return { ok: false, demo: false, erro: "Tipo inválido." };

  const ctx = await contexto();
  if (!ctx) return { ok: true, demo: true };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, sessao.organizacaoId, negocioId))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db.from("atividades").insert({
      organizacao_id: sessao.organizacaoId,
      negocio_id: negocioId,
      tipo,
      conteudo: conteudo.trim(),
      usuario_id: sessao.usuarioId,
    });

    if (error) return { ok: false, demo: false, erro: "Não foi possível registrar." };
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch {
    return { ok: false, demo: false, erro: "Não foi possível registrar." };
  }
}
