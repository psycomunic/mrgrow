import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { pode, type Acao, type Papel, type Recurso } from "@/lib/papeis";

/** Sessão fictícia usada enquanto o Supabase não está conectado. */
const SESSAO_DEMO: Sessao = {
  usuarioId: "demo",
  email: "demo@mrgrow.com.br",
  nome: "Mateus Rodrigues",
  avatarUrl: null,
  organizacaoId: "demo",
  organizacaoNome: "MR Grow",
  papel: "proprietario",
  clientesPermitidos: [],
};

export type Sessao = {
  usuarioId: string;
  email: string | null;
  nome: string | null;
  avatarUrl: string | null;
  organizacaoId: string;
  organizacaoNome: string;
  papel: Papel;
  clientesPermitidos: string[];
};

/**
 * Sessão completa (usuário + organização ativa + papel).
 * Memoizada por request via React cache.
 */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  if (modoDemonstracao()) return SESSAO_DEMO;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vinculo, error } = await supabase
    .from("membros_organizacao")
    .select(
      "papel, clientes_permitidos, organizacao_id, organizacoes(nome), perfis(nome_completo, avatar_url)",
    )
    .eq("usuario_id", user.id)
    .eq("ativo", true)
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) registrarFalha("obterSessao/membros_organizacao", error);
  if (!vinculo) return null;

  const org = vinculo.organizacoes as unknown as { nome: string } | null;
  const perfil = vinculo.perfis as unknown as
    | { nome_completo: string | null; avatar_url: string | null }
    | null;

  return {
    usuarioId: user.id,
    email: user.email ?? null,
    nome: perfil?.nome_completo ?? user.email?.split("@")[0] ?? null,
    avatarUrl: perfil?.avatar_url ?? null,
    organizacaoId: vinculo.organizacao_id,
    organizacaoNome: org?.nome ?? "MR Grow",
    papel: vinculo.papel as Papel,
    clientesPermitidos: vinculo.clientes_permitidos ?? [],
  };
});

/** Exige sessão; redireciona para o login quando não houver. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

/** Exige que o usuário seja da equipe (bloqueia papel "cliente" no painel). */
export async function exigirEquipe(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (sessao.papel === "cliente") redirect("/portal");
  return sessao;
}

/**
 * Exige que o papel do usuário permita a ação no recurso.
 *
 * Usada nas páginas do painel: o filtro do menu lateral esconde o item, mas
 * quem digita a URL na barra de endereço passa por cima dele. Sem isto um
 * operador abre /painel/financeiro e lê o contas-a-receber da agência.
 */
export async function exigirPermissao(recurso: Recurso, acao: Acao = "ver"): Promise<Sessao> {
  const sessao = await exigirEquipe();
  if (!pode(sessao.papel, recurso, acao)) redirect("/painel");
  return sessao;
}
