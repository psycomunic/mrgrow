"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, type Resultado } from "@/lib/acoes";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { apenasDigitos } from "@/lib/utils";

export type { Resultado };

export type DadosPerfil = {
  nome_completo: string;
  telefone: string;
  cargo: string;
  /** URL pública da foto — o arquivo já subiu antes de chegar aqui. */
  avatar_url: string;
};

function validar(d: DadosPerfil): string | null {
  if (!d.nome_completo.trim()) return "Informe seu nome.";
  if (d.nome_completo.trim().length > 120) return "O nome ficou longo demais.";
  if (d.cargo.length > 80) return "O cargo ficou longo demais.";

  const fone = apenasDigitos(d.telefone);
  if (fone && (fone.length < 10 || fone.length > 13)) return "Telefone inválido.";

  /* A foto entra em `<img src>`; texto livre abriria espaço para
     `javascript:` na barra lateral de todo mundo. */
  if (d.avatar_url && !/^https:\/\//i.test(d.avatar_url)) return "Endereço de foto inválido.";
  return null;
}

/**
 * Salva o próprio perfil.
 *
 * Qualquer papel pode: a permissão conferida é `visao`, que todo mundo
 * tem, porque editar o próprio nome não é privilégio administrativo. O
 * alvo é sempre `sessao.usuarioId` — não há como passar um id de outra
 * pessoa, então ninguém edita o perfil alheio por aqui.
 */
export async function salvarPerfil(d: DadosPerfil): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("visao", "ver");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { error } = await db
      .from("perfis")
      .update({
        nome_completo: d.nome_completo.trim(),
        telefone: apenasDigitos(d.telefone) || null,
        cargo: d.cargo.trim() || null,
        avatar_url: d.avatar_url.trim() || null,
      })
      .eq("id", sessao.usuarioId);

    if (error) return falha("salvarPerfil", error, "Não foi possível salvar.");

    revalidatePath("/painel", "layout");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("salvarPerfil", e, "Não foi possível salvar.");
  }
}

/**
 * Troca a própria senha.
 *
 * Passa pelo cliente de administração porque a Server Action não tem a
 * sessão do GoTrue em mãos — ela tem o cookie do Supabase, mas
 * `updateUser` exigiria o token de acesso do usuário. Como o alvo é
 * sempre o id da própria sessão, o poder do service role não vaza: não
 * existe caminho aqui para trocar a senha de outra pessoa.
 */
export async function trocarSenha(nova: string, confirmacao: string): Promise<Resultado> {
  if (nova.length < 8) return { ok: false, demo: false, erro: "A senha precisa de 8 caracteres." };
  if (nova.length > 72) {
    /* O bcrypt do Auth ignora o que passa de 72 bytes: a senha seria
       aceita e truncada em silêncio. */
    return { ok: false, demo: false, erro: "A senha passou de 72 caracteres." };
  }
  if (nova !== confirmacao) return { ok: false, demo: false, erro: "As senhas não conferem." };

  const ctx = await contextoDeAcao("visao", "ver");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao } = ctx;

  try {
    const admin = criarClienteAdmin();
    const { error } = await admin.auth.admin.updateUserById(sessao.usuarioId, { password: nova });

    if (error) return falha("trocarSenha", error, "Não foi possível trocar a senha.");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("trocarSenha", e, "Não foi possível trocar a senha.");
  }
}
