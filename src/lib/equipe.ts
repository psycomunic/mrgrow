import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { emDias } from "@/lib/tempo";
import type { Papel } from "@/lib/papeis";

export type Membro = {
  /** Id do vínculo em `membros_organizacao`, que é o que as ações recebem. */
  id: string;
  usuarioId: string;
  nome: string;
  email: string | null;
  avatarUrl: string | null;
  papel: Papel;
  ativo: boolean;
  desde: string | null;
};

export type Convite = {
  id: string;
  email: string;
  papel: Papel;
  token: string;
  expiraEm: string;
  criadoEm: string;
};

export type Equipe = { membros: Membro[]; convites: Convite[]; demo: boolean };

const MEMBROS_DEMO: Membro[] = [
  { id: "m1", usuarioId: "demo", nome: "Mateus Rodrigues", email: "mateus@mrgrow.com.br", avatarUrl: null, papel: "proprietario", ativo: true, desde: "2024-02-12" },
  { id: "m2", usuarioId: "u2", nome: "Gestor de Tráfego", email: "trafego@mrgrow.com.br", avatarUrl: null, papel: "gestor", ativo: true, desde: "2024-06-03" },
  { id: "m3", usuarioId: "u3", nome: "Analista de Criativos", email: "criativos@mrgrow.com.br", avatarUrl: null, papel: "operador", ativo: true, desde: "2025-01-20" },
  { id: "m4", usuarioId: "u4", nome: "Financeiro", email: "financeiro@mrgrow.com.br", avatarUrl: null, papel: "financeiro", ativo: true, desde: "2025-03-11" },
  { id: "m5", usuarioId: "u5", nome: "Vitrine Prime", email: "contato@vitrineprime.com.br", avatarUrl: null, papel: "cliente", ativo: true, desde: "2025-09-01" },
  { id: "m6", usuarioId: "u6", nome: "Editor de Vídeo", email: "video@mrgrow.com.br", avatarUrl: null, papel: "operador", ativo: false, desde: "2024-08-14" },
];

const CONVITES_DEMO: Convite[] = [
  {
    id: "c1",
    email: "designer@mrgrow.com.br",
    papel: "operador",
    token: "demonstracao",
    expiraEm: emDias(5),
    criadoEm: emDias(-2),
  },
];

type LinhaMembro = {
  id: string;
  usuario_id: string;
  papel: string;
  ativo: boolean;
  criado_em: string | null;
  perfis:
    | { nome_completo: string | null; email: string | null; avatar_url: string | null }
    | { nome_completo: string | null; email: string | null; avatar_url: string | null }[]
    | null;
};

type LinhaConvite = {
  id: string;
  email: string;
  papel: string;
  token: string;
  expira_em: string;
  criado_em: string;
};

/** O join do Supabase devolve objeto ou array conforme a cardinalidade. */
function perfilDe(p: LinhaMembro["perfis"]) {
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

const VAZIO: Equipe = { membros: [], convites: [], demo: false };

/**
 * Membros da organização e convites ainda em aberto.
 *
 * O nome vem de `perfis`; quando o perfil ainda não foi completado, o e-mail
 * antes do @ serve de nome — melhor que uma linha em branco na tabela de
 * acessos. Com banco ligado, erro é erro: a lista volta vazia e a falha vai
 * para o log, em vez de a tela mostrar a equipe fictícia.
 */
export async function carregarEquipe(): Promise<Equipe> {
  if (modoDemonstracao()) return { membros: MEMBROS_DEMO, convites: CONVITES_DEMO, demo: true };

  try {
    const sessao = await obterSessao();
    if (!sessao) return VAZIO;

    const db = await criarClienteServidor();
    const [{ data: linhas, error: erroMembros }, { data: pendentes, error: erroConvites }] =
      await Promise.all([
        db
          .from("membros_organizacao")
          .select("id, usuario_id, papel, ativo, criado_em, perfis(nome_completo, email, avatar_url)")
          .eq("organizacao_id", sessao.organizacaoId)
          .order("ativo", { ascending: false })
          .order("criado_em", { ascending: true }),
        db
          .from("convites")
          .select("id, email, papel, token, expira_em, criado_em")
          .eq("organizacao_id", sessao.organizacaoId)
          .is("aceito_em", null)
          .order("criado_em", { ascending: false }),
      ]);

    if (erroMembros) {
      registrarFalha("carregarEquipe/membros", erroMembros);
      return VAZIO;
    }
    /* Convite é acessório: a RLS só libera para gestor, então um gestor de
       leitura vê a equipe sem ver convites em vez de ver a tela vazia. */
    if (erroConvites) registrarFalha("carregarEquipe/convites", erroConvites);

    return {
      membros: ((linhas ?? []) as unknown as LinhaMembro[]).map((m) => {
        const perfil = perfilDe(m.perfis);
        return {
          id: m.id,
          usuarioId: m.usuario_id,
          nome: perfil?.nome_completo ?? perfil?.email?.split("@")[0] ?? "Sem nome",
          email: perfil?.email ?? null,
          avatarUrl: perfil?.avatar_url ?? null,
          papel: m.papel as Papel,
          ativo: m.ativo,
          desde: m.criado_em,
        };
      }),
      convites: ((pendentes ?? []) as unknown as LinhaConvite[]).map((c) => ({
        id: c.id,
        email: c.email,
        papel: c.papel as Papel,
        token: c.token,
        expiraEm: c.expira_em,
        criadoEm: c.criado_em,
      })),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarEquipe", e);
    return VAZIO;
  }
}
