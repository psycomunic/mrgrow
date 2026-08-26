"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, fkDaOrganizacao, pertence, type Resultado } from "@/lib/acoes";
import { STATUS_PROJETO } from "@/lib/rotulos";

export type { Resultado };

export type DadosProjeto = {
  nome: string;
  descricao: string;
  status: string;
  progresso: number;
  prazo: string | null;
  cliente_id: string | null;
};

const STATUS = STATUS_PROJETO.lista.map((s) => s.valor);

function validar(d: DadosProjeto): string | null {
  if (!d.nome.trim()) return "Dê um nome ao projeto.";
  if (d.nome.trim().length > 200) return "O nome ficou longo demais.";
  if (d.descricao.length > 4000) return "A descrição ficou longa demais.";
  if (!STATUS.includes(d.status)) return "Status inválido.";
  if (!Number.isInteger(d.progresso) || d.progresso < 0 || d.progresso > 100) {
    return "O progresso vai de 0 a 100.";
  }
  if (d.prazo && !/^\d{4}-\d{2}-\d{2}$/.test(d.prazo)) return "Prazo inválido.";
  return null;
}

function paraBanco(d: DadosProjeto) {
  return {
    nome: d.nome.trim(),
    descricao: d.descricao.trim() || null,
    status: d.status,
    /* Concluído com 80% na barra é o tipo de incoerência que faz o painel
       perder credibilidade — o status manda no número. */
    progresso: d.status === "concluido" ? 100 : d.progresso,
    prazo: d.prazo || null,
    cliente_id: d.cliente_id || null,
  };
}

export async function criarProjeto(d: DadosProjeto): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("projetos", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    const { error } = await db.from("projetos").insert({
      organizacao_id: sessao.organizacaoId,
      responsavel_id: sessao.usuarioId,
      ...paraBanco(d),
    });

    if (error) return falha("criarProjeto", error, "Não foi possível criar o projeto.");
    revalidatePath("/painel/projetos");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("criarProjeto", e, "Não foi possível criar o projeto.");
  }
}

export async function atualizarProjeto(id: string, d: DadosProjeto): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    const { data, error } = await db
      .from("projetos")
      .update(paraBanco(d))
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("atualizarProjeto", error, "Não foi possível salvar.");
    if (!data?.length) return { ok: false, demo: false, erro: "Projeto não encontrado." };
    revalidatePath("/painel/projetos");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarProjeto", e, "Não foi possível salvar.");
  }
}

/** Ajuste rápido da barra, sem abrir o formulário. */
export async function ajustarProgresso(id: string, progresso: number): Promise<Resultado> {
  if (!Number.isInteger(progresso) || progresso < 0 || progresso > 100) {
    return { ok: false, demo: false, erro: "O progresso vai de 0 a 100." };
  }

  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "projetos", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Projeto não encontrado." };
    }

    const { error } = await db
      .from("projetos")
      .update({
        progresso,
        // Bater 100% na barra fecha o projeto; sair de 100% o reabre.
        status: progresso === 100 ? "concluido" : "ativo",
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("ajustarProgresso", error, "Não foi possível atualizar.");
    revalidatePath("/painel/projetos");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("ajustarProgresso", e, "Não foi possível atualizar.");
  }
}

export async function excluirProjeto(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("projetos", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("projetos")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("excluirProjeto", error, "Não foi possível excluir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Projeto não encontrado." };
    revalidatePath("/painel/projetos");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirProjeto", e, "Não foi possível excluir.");
  }
}
