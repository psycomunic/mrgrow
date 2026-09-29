"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, fkDaOrganizacao, pertence, type Resultado } from "@/lib/acoes";

export type { Resultado };

export type MembroProjeto = {
  id: string;
  perfilId: string;
  nome: string;
  frente: string | null;
};

export type PassoProjeto = {
  id: string;
  titulo: string;
  concluida: boolean;
  venceEm: string | null;
  responsavel: string | null;
  responsavelId: string | null;
  ordem: number;
};

/**
 * Quem responde pelo projeto e por qual parte.
 *
 * O projeto já tinha um `responsavel_id`, que continua sendo o
 * responsável principal — quem responde pelo todo. Esta lista é o resto
 * da equipe, cada um com a frente que toca.
 */
export async function listarEquipe(projetoId: string): Promise<MembroProjeto[]> {
  const ctx = await contextoDeAcao("projetos", "ver");
  if (ctx.estado !== "ok") return [];
  const { sessao, db } = ctx;

  const { data } = await db
    .from("equipe_projeto")
    .select("id, perfil_id, frente, perfis:perfil_id(nome_completo)")
    .eq("organizacao_id", sessao.organizacaoId)
    .eq("projeto_id", projetoId)
    .order("criado_em");

  type Linha = {
    id: string;
    perfil_id: string;
    frente: string | null;
    perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
  };

  return ((data ?? []) as unknown as Linha[]).map((l) => {
    const p = Array.isArray(l.perfis) ? l.perfis[0] : l.perfis;
    return {
      id: l.id,
      perfilId: l.perfil_id,
      nome: p?.nome_completo ?? "Sem nome",
      frente: l.frente,
    };
  });
}

export async function adicionarAoProjeto(
  projetoId: string,
  perfilId: string,
  frente: string,
): Promise<Resultado> {
  if (frente.trim().length > 80) return { ok: false, demo: false, erro: "A frente ficou longa demais." };

  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "projetos", projetoId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Projeto não encontrado." };
    }

    const { error } = await db.from("equipe_projeto").insert({
      organizacao_id: sessao.organizacaoId,
      projeto_id: projetoId,
      perfil_id: perfilId,
      frente: frente.trim() || null,
    });

    if (error) {
      // 23505: a pessoa já está no projeto — o índice único é quem barra.
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, demo: false, erro: "Essa pessoa já está neste projeto." };
      }
      return falha("adicionarAoProjeto", error, "Não foi possível adicionar.");
    }

    revalidatePath("/painel/projetos");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("adicionarAoProjeto", e, "Não foi possível adicionar.");
  }
}

export async function removerDoProjeto(vinculoId: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("equipe_projeto")
      .delete()
      .eq("id", vinculoId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("removerDoProjeto", error, "Não foi possível remover.");
    revalidatePath("/painel/projetos");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("removerDoProjeto", e, "Não foi possível remover.");
  }
}

/** Define quem responde pelo projeto inteiro. */
export async function definirResponsavel(
  projetoId: string,
  perfilId: string | null,
): Promise<Resultado> {
  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "projetos", projetoId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Projeto não encontrado." };
    }

    const { error } = await db
      .from("projetos")
      .update({ responsavel_id: perfilId })
      .eq("id", projetoId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("definirResponsavel", error, "Não foi possível salvar.");
    revalidatePath("/painel/projetos");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("definirResponsavel", e, "Não foi possível salvar.");
  }
}

/* ── Próximos passos ──────────────────────────────────────────────
   São tarefas com `projeto_id`, e não uma lista à parte. Uma segunda
   caixa de afazeres dentro do projeto daria à mesma pessoa dois lugares
   para olhar — e o que não aparece no quadro de tarefas é o que ninguém
   olha. */

export async function listarPassos(projetoId: string): Promise<PassoProjeto[]> {
  const ctx = await contextoDeAcao("projetos", "ver");
  if (ctx.estado !== "ok") return [];
  const { sessao, db } = ctx;

  const { data } = await db
    .from("tarefas")
    .select("id, titulo, status, vence_em, ordem_projeto, responsavel_id, perfis:responsavel_id(nome_completo)")
    .eq("organizacao_id", sessao.organizacaoId)
    .eq("projeto_id", projetoId)
    .order("ordem_projeto")
    .order("criado_em");

  type Linha = {
    id: string;
    titulo: string;
    status: string;
    vence_em: string | null;
    ordem_projeto: number;
    responsavel_id: string | null;
    perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
  };

  return ((data ?? []) as unknown as Linha[]).map((l) => {
    const p = Array.isArray(l.perfis) ? l.perfis[0] : l.perfis;
    return {
      id: l.id,
      titulo: l.titulo,
      concluida: l.status === "concluida",
      venceEm: l.vence_em,
      responsavel: p?.nome_completo ?? null,
      responsavelId: l.responsavel_id,
      ordem: l.ordem_projeto ?? 0,
    };
  });
}

export async function adicionarPasso(
  projetoId: string,
  titulo: string,
  responsavelId: string | null,
  venceEm: string | null,
): Promise<Resultado> {
  if (!titulo.trim()) return { ok: false, demo: false, erro: "Escreva o passo." };
  if (titulo.trim().length > 200) return { ok: false, demo: false, erro: "O passo ficou longo demais." };
  if (venceEm && !/^\d{4}-\d{2}-\d{2}$/.test(venceEm)) {
    return { ok: false, demo: false, erro: "Data inválida." };
  }

  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data: projeto } = await db
      .from("projetos")
      .select("cliente_id")
      .eq("id", projetoId)
      .eq("organizacao_id", sessao.organizacaoId)
      .maybeSingle();

    if (!projeto) return { ok: false, demo: false, erro: "Projeto não encontrado." };

    if (responsavelId && !(await fkDaOrganizacao(db, "perfis", responsavelId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Responsável não encontrado." };
    }

    /* Entra no fim da lista. Um `count` resolveria, mas a ordem precisa
       sobreviver a exclusões — e a contagem repete número depois delas. */
    const { data: ultimo } = await db
      .from("tarefas")
      .select("ordem_projeto")
      .eq("projeto_id", projetoId)
      .eq("organizacao_id", sessao.organizacaoId)
      .order("ordem_projeto", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await db.from("tarefas").insert({
      organizacao_id: sessao.organizacaoId,
      projeto_id: projetoId,
      cliente_id: (projeto as { cliente_id: string | null }).cliente_id,
      titulo: titulo.trim(),
      status: "backlog",
      responsavel_id: responsavelId,
      vence_em: venceEm,
      ordem_projeto: ((ultimo as { ordem_projeto: number } | null)?.ordem_projeto ?? -1) + 1,
    });

    if (error) return falha("adicionarPasso", error, "Não foi possível adicionar o passo.");

    revalidatePath("/painel/projetos");
    revalidatePath("/painel/tarefas");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("adicionarPasso", e, "Não foi possível adicionar o passo.");
  }
}

/** O check: marca e desmarca o passo como concluído. */
export async function alternarPasso(tarefaId: string, concluida: boolean): Promise<Resultado> {
  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("tarefas")
      /* Só o status: `concluida_em` é preenchido por gatilho no banco, e
         escrever os dois daqui produziria duas versões da mesma verdade. */
      .update({ status: concluida ? "concluida" : "backlog" })
      .eq("id", tarefaId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("alternarPasso", error, "Não foi possível salvar.");

    revalidatePath("/painel/projetos");
    revalidatePath("/painel/tarefas");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("alternarPasso", e, "Não foi possível salvar.");
  }
}

export async function removerPasso(tarefaId: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("projetos", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("tarefas")
      .delete()
      .eq("id", tarefaId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("removerPasso", error, "Não foi possível remover.");

    revalidatePath("/painel/projetos");
    revalidatePath("/painel/tarefas");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("removerPasso", e, "Não foi possível remover.");
  }
}
