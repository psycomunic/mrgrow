import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao, type Sessao } from "@/lib/sessao";
import { pode, type Acao, type Recurso } from "@/lib/papeis";

/**
 * Contexto compartilhado das server actions.
 *
 * Antes, cada arquivo de ações tinha o seu `contexto()` que devolvia `null`
 * tanto em modo demonstração quanto quando não havia sessão — e as ações
 * respondiam `{ ok: true }` nos dois casos. Ou seja: um chamador anônimo
 * recebia sucesso. Aqui os três estados são distintos e a permissão do papel
 * é verificada antes de qualquer escrita, porque a URL de uma server action é
 * trivial de descobrir no DevTools: a matriz de papéis precisa valer no
 * servidor, não só no menu lateral.
 */

export type Banco = Awaited<ReturnType<typeof criarClienteServidor>>;

export type Resultado = { ok: boolean; demo: boolean; erro?: string };

export type Contexto =
  | { estado: "demo" }
  | { estado: "negado"; erro: string }
  | { estado: "ok"; sessao: Sessao; db: Banco };

export async function contextoDeAcao(recurso: Recurso, acao: Acao): Promise<Contexto> {
  if (modoDemonstracao()) return { estado: "demo" };

  const sessao = await obterSessao();
  if (!sessao) return { estado: "negado", erro: "Sua sessão expirou. Entre novamente." };

  if (!pode(sessao.papel, recurso, acao)) {
    return { estado: "negado", erro: "Seu perfil não tem permissão para esta ação." };
  }

  return { estado: "ok", sessao, db: await criarClienteServidor() };
}

/** Falha padronizada, já registrada no log do servidor. */
export function falha(onde: string, erro: unknown, mensagem: string): Resultado {
  registrarFalha(onde, erro);
  return { ok: false, demo: false, erro: mensagem };
}

/**
 * Confere que a linha existe e é da organização de quem está editando.
 *
 * A RLS já barra o acesso de outra organização, mas sem esta checagem um id
 * inexistente ou alheio produz "0 linhas afetadas" sem erro — e a ação
 * responderia sucesso para uma escrita que não aconteceu.
 */
export async function pertence(
  db: Banco,
  tabela: string,
  id: string,
  organizacaoId: string,
): Promise<boolean> {
  const { data } = await db
    .from(tabela)
    .select("id")
    .eq("id", id)
    .eq("organizacao_id", organizacaoId)
    .maybeSingle();
  return !!data;
}

/**
 * Confere que uma chave estrangeira aponta para a própria organização.
 *
 * A RLS valida o `organizacao_id` da linha que está sendo gravada, não o das
 * FKs dela. Sem isto, um membro consegue mover um negócio para a etapa de
 * outra organização: o cartão desaparece do quadro e o histórico registra uma
 * etapa alheia.
 */
export async function fkDaOrganizacao(
  db: Banco,
  tabela: string,
  id: string | null | undefined,
  organizacaoId: string,
): Promise<boolean> {
  if (!id) return true;
  return pertence(db, tabela, id, organizacaoId);
}
