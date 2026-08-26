"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, pertence, type Banco, type Resultado } from "@/lib/acoes";
import { ROTULO_PAPEL, type Papel } from "@/lib/papeis";

export type { Resultado };

/** O convite não é enviado por e-mail: quem convida copia o link e manda. */
export type ResultadoConvite = Resultado & { link?: string };

const PAPEIS = Object.keys(ROTULO_PAPEL) as Papel[];
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

type Vinculo = { id: string; usuario_id: string; papel: Papel; ativo: boolean };

async function buscarMembro(db: Banco, membroId: string, organizacaoId: string) {
  const { data } = await db
    .from("membros_organizacao")
    .select("id, usuario_id, papel, ativo")
    .eq("id", membroId)
    .eq("organizacao_id", organizacaoId)
    .maybeSingle();
  return (data ?? null) as Vinculo | null;
}

/**
 * Quantos proprietários ativos a organização tem.
 *
 * É a conta que impede o cenário sem volta: rebaixar ou desativar o último
 * proprietário deixa a organização sem ninguém que possa mexer em equipe,
 * cobrança e integrações — e a correção passaria pelo SQL do Supabase.
 */
async function proprietariosAtivos(db: Banco, organizacaoId: string) {
  const { count, error } = await db
    .from("membros_organizacao")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("papel", "proprietario")
    .eq("ativo", true);
  return { total: count ?? 0, error };
}

const SEM_PROPRIETARIO =
  "A organização precisa de pelo menos um proprietário ativo. Promova outra pessoa antes.";

export async function alterarPapel(membroId: string, papel: string): Promise<Resultado> {
  if (!PAPEIS.includes(papel as Papel)) return { ok: false, demo: false, erro: "Papel inválido." };

  const ctx = await contextoDeAcao("equipe", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const membro = await buscarMembro(db, membroId, sessao.organizacaoId);
    if (!membro) return { ok: false, demo: false, erro: "Membro não encontrado." };
    if (membro.papel === papel) return { ok: true, demo: false };

    if (membro.usuario_id === sessao.usuarioId) {
      return {
        ok: false,
        demo: false,
        erro: "Você não pode alterar o seu próprio papel. Peça a outro proprietário.",
      };
    }
    if (papel === "proprietario" && sessao.papel !== "proprietario") {
      return { ok: false, demo: false, erro: "Só um proprietário promove alguém a proprietário." };
    }

    // Rebaixar proprietário: confere se ainda sobra algum depois da mudança.
    if (membro.papel === "proprietario" && membro.ativo) {
      const { total, error } = await proprietariosAtivos(db, sessao.organizacaoId);
      if (error) return falha("alterarPapel/contagem", error, "Não foi possível conferir a equipe.");
      if (total <= 1) return { ok: false, demo: false, erro: SEM_PROPRIETARIO };
    }

    const { error } = await db
      .from("membros_organizacao")
      .update({ papel })
      .eq("id", membroId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("alterarPapel", error, "Não foi possível alterar o papel.");
    revalidatePath("/painel/equipe");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("alterarPapel", e, "Não foi possível alterar o papel.");
  }
}

export async function desativarMembro(membroId: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("equipe", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const membro = await buscarMembro(db, membroId, sessao.organizacaoId);
    if (!membro) return { ok: false, demo: false, erro: "Membro não encontrado." };
    if (!membro.ativo) return { ok: true, demo: false };

    if (membro.usuario_id === sessao.usuarioId) {
      return { ok: false, demo: false, erro: "Você não pode desativar o seu próprio acesso." };
    }

    if (membro.papel === "proprietario") {
      const { total, error } = await proprietariosAtivos(db, sessao.organizacaoId);
      if (error) return falha("desativarMembro/contagem", error, "Não foi possível conferir a equipe.");
      if (total <= 1) return { ok: false, demo: false, erro: SEM_PROPRIETARIO };
    }

    const { error } = await db
      .from("membros_organizacao")
      .update({ ativo: false })
      .eq("id", membroId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("desativarMembro", error, "Não foi possível desativar o acesso.");
    revalidatePath("/painel/equipe");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("desativarMembro", e, "Não foi possível desativar o acesso.");
  }
}

export async function reativarMembro(membroId: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("equipe", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const membro = await buscarMembro(db, membroId, sessao.organizacaoId);
    if (!membro) return { ok: false, demo: false, erro: "Membro não encontrado." };
    if (membro.ativo) return { ok: true, demo: false };

    if (membro.papel === "proprietario" && sessao.papel !== "proprietario") {
      return {
        ok: false,
        demo: false,
        erro: "Esse acesso é de proprietário; só outro proprietário pode reativá-lo.",
      };
    }

    const { error } = await db
      .from("membros_organizacao")
      .update({ ativo: true })
      .eq("id", membroId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("reativarMembro", error, "Não foi possível reativar o acesso.");
    revalidatePath("/painel/equipe");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("reativarMembro", e, "Não foi possível reativar o acesso.");
  }
}

/**
 * Cria o convite e devolve o link de entrada.
 *
 * Não há disparo de e-mail nem uso da Admin API: o convite é uma linha na
 * própria organização e o link vai por onde a agência já fala com a pessoa.
 * O token é a credencial, então ele só aparece para quem administra a equipe
 * (a RLS de `convites` exige `e_gestor`).
 */
export async function convidarMembro(email: string, papel: string): Promise<ResultadoConvite> {
  const alvo = email.trim().toLowerCase();
  if (!EMAIL.test(alvo) || alvo.length > 160) {
    return { ok: false, demo: false, erro: "Informe um e-mail válido." };
  }
  if (!PAPEIS.includes(papel as Papel)) return { ok: false, demo: false, erro: "Papel inválido." };

  const ctx = await contextoDeAcao("equipe", "criar");
  if (ctx.estado === "demo") {
    return { ok: true, demo: true, link: "/entrar?convite=demonstracao" };
  }
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  if (papel === "proprietario" && sessao.papel !== "proprietario") {
    return { ok: false, demo: false, erro: "Só um proprietário convida outro proprietário." };
  }

  try {
    /* A RLS de `perfis` só expõe perfis da própria organização, então achar
       este e-mail aqui já significa que a pessoa é (ou foi) da casa. */
    const { data: perfil } = await db
      .from("perfis")
      .select("id")
      .eq("email", alvo)
      .maybeSingle();

    if (perfil) {
      const { data: vinculo } = await db
        .from("membros_organizacao")
        .select("ativo")
        .eq("organizacao_id", sessao.organizacaoId)
        .eq("usuario_id", (perfil as { id: string }).id)
        .maybeSingle();

      if (vinculo) {
        return {
          ok: false,
          demo: false,
          erro: (vinculo as { ativo: boolean }).ativo
            ? "Essa pessoa já está na equipe."
            : "Esse acesso existe e está desativado — reative na tabela em vez de convidar.",
        };
      }
    }

    const { data, error } = await db
      .from("convites")
      .insert({
        organizacao_id: sessao.organizacaoId,
        email: alvo,
        papel,
        criado_por: sessao.usuarioId,
      })
      .select("token")
      .single();

    if (error) {
      // 23505: o índice parcial já guarda um convite em aberto para o e-mail.
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, demo: false, erro: "Já existe um convite em aberto para esse e-mail." };
      }
      return falha("convidarMembro", error, "Não foi possível gerar o convite.");
    }

    revalidatePath("/painel/equipe");
    return { ok: true, demo: false, link: `/entrar?convite=${(data as { token: string }).token}` };
  } catch (e) {
    return falha("convidarMembro", e, "Não foi possível gerar o convite.");
  }
}

export async function revogarConvite(conviteId: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("equipe", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "convites", conviteId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Convite não encontrado." };
    }

    const { error } = await db
      .from("convites")
      .delete()
      .eq("id", conviteId)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("revogarConvite", error, "Não foi possível revogar o convite.");
    revalidatePath("/painel/equipe");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("revogarConvite", e, "Não foi possível revogar o convite.");
  }
}
