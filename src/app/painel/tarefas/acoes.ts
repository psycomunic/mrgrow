"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, fkDaOrganizacao, pertence, type Resultado } from "@/lib/acoes";
import { STATUS_TAREFA, PRIORIDADE } from "@/lib/rotulos";

export type { Resultado };

export type DadosTarefa = {
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  cliente_id: string | null;
  vence_em: string | null;
};

const STATUS = STATUS_TAREFA.lista.map((s) => s.valor);
const PRIORIDADES = PRIORIDADE.lista.map((p) => p.valor);

function validar(d: DadosTarefa): string | null {
  if (!d.titulo.trim()) return "Escreva o que precisa ser feito.";
  if (d.titulo.trim().length > 200) return "O título ficou longo demais.";
  if (d.descricao.length > 4000) return "A descrição ficou longa demais.";
  if (!STATUS.includes(d.status)) return "Status inválido.";
  if (!PRIORIDADES.includes(d.prioridade)) return "Prioridade inválida.";
  if (d.vence_em && !/^\d{4}-\d{2}-\d{2}$/.test(d.vence_em)) return "Prazo inválido.";
  return null;
}

function paraBanco(d: DadosTarefa) {
  return {
    titulo: d.titulo.trim(),
    descricao: d.descricao.trim() || null,
    status: d.status,
    prioridade: d.prioridade,
    cliente_id: d.cliente_id || null,
    vence_em: d.vence_em || null,
    /* Concluída sem data de conclusão deixa o relatório de produtividade sem
       base, e reabrir uma tarefa precisa limpar a data — daí os dois lados. */
    concluida_em: d.status === "concluida" ? new Date().toISOString() : null,
  };
}

export async function criarTarefa(d: DadosTarefa): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("tarefas", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    const { error } = await db.from("tarefas").insert({
      organizacao_id: sessao.organizacaoId,
      responsavel_id: sessao.usuarioId,
      criado_por: sessao.usuarioId,
      ...paraBanco(d),
    });

    if (error) return falha("criarTarefa", error, "Não foi possível criar a tarefa.");
    revalidatePath("/painel/tarefas");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("criarTarefa", e, "Não foi possível criar a tarefa.");
  }
}

export async function atualizarTarefa(id: string, d: DadosTarefa): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("tarefas", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    const { data, error } = await db
      .from("tarefas")
      .update(paraBanco(d))
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("atualizarTarefa", error, "Não foi possível salvar.");
    if (!data?.length) return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    revalidatePath("/painel/tarefas");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarTarefa", e, "Não foi possível salvar.");
  }
}

/** Arrastar de coluna: muda só o status e a posição na coluna de destino. */
export async function moverTarefa(id: string, status: string, ordem: number): Promise<Resultado> {
  if (!STATUS.includes(status)) return { ok: false, demo: false, erro: "Status inválido." };
  if (!Number.isInteger(ordem) || ordem < 0) return { ok: false, demo: false, erro: "Ordem inválida." };

  const ctx = await contextoDeAcao("tarefas", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "tarefas", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    }

    const { error } = await db
      .from("tarefas")
      .update({
        status,
        ordem,
        concluida_em: status === "concluida" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("moverTarefa", error, "Não foi possível mover a tarefa.");
    revalidatePath("/painel/tarefas");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("moverTarefa", e, "Não foi possível mover a tarefa.");
  }
}

export async function excluirTarefa(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("tarefas", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("tarefas")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("excluirTarefa", error, "Não foi possível excluir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    revalidatePath("/painel/tarefas");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirTarefa", e, "Não foi possível excluir.");
  }
}
