import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { ROTULO_PAPEL, type Papel } from "@/lib/papeis";

/** 16 ou 24 bytes em hex, conforme a migração que criou a tabela. */
export const TOKEN_CONVITE = /^[0-9a-f]{32,48}$/i;

export type Convite = {
  email: string;
  papel: Papel;
  rotuloPapel: string;
  organizacao: string;
  expiraEm: string;
  expirado: boolean;
  aceito: boolean;
};

/**
 * Lê um convite pelo token.
 *
 * Service role de propósito: quem abre este link ainda não é membro de
 * organização nenhuma, então a RLS de `convites` (restrita a gestor) barraria
 * a própria pessoa convidada. O que autoriza aqui é o token, que é o segredo —
 * e nada de identificável sai desta função além do e-mail que o convite já
 * conhece.
 */
export async function carregarConvite(token: string): Promise<Convite | null> {
  if (modoDemonstracao() || !TOKEN_CONVITE.test(token)) return null;

  try {
    const db = criarClienteAdmin();
    const { data, error } = await db
      .from("convites")
      .select("email, papel, expira_em, aceito_em, organizacoes(nome)")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      registrarFalha("carregarConvite", error);
      return null;
    }
    if (!data) return null;

    const linha = data as unknown as {
      email: string;
      papel: Papel;
      expira_em: string;
      aceito_em: string | null;
      organizacoes: { nome: string } | { nome: string }[] | null;
    };
    const org = Array.isArray(linha.organizacoes) ? linha.organizacoes[0] : linha.organizacoes;

    return {
      email: linha.email,
      papel: linha.papel,
      rotuloPapel: ROTULO_PAPEL[linha.papel] ?? linha.papel,
      organizacao: org?.nome ?? "a agência",
      expiraEm: linha.expira_em,
      expirado: new Date(linha.expira_em).getTime() < Date.now(),
      aceito: !!linha.aceito_em,
    };
  } catch (e) {
    registrarFalha("carregarConvite", e);
    return null;
  }
}
