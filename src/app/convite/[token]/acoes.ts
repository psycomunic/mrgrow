"use server";

import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { TOKEN_CONVITE } from "@/lib/convites";

export type ResultadoConvite = { ok: boolean; erro?: string; destino?: string };

/**
 * Aceita o convite e cria o vínculo com a organização.
 *
 * Três verificações antes de gravar, e cada uma existe por um motivo:
 *
 * - o e-mail do convite tem que ser o e-mail de quem está logado. Sem isso, o
 *   link vazado num grupo de WhatsApp dá acesso a quem o abrir primeiro;
 * - o convite não pode estar expirado nem já aceito, e a atualização do
 *   `aceito_em` é condicional (`is null`), então dois cliques simultâneos não
 *   criam dois vínculos;
 * - `papel` e `clientes_permitidos` vêm do convite gravado, nunca do cliente.
 *
 * Service role porque o convidado ainda não é membro de organização alguma: a
 * RLS de `membros_organizacao` exige ser gestor para inserir, e ele não é.
 */
export async function aceitarConvite(token: string): Promise<ResultadoConvite> {
  if (modoDemonstracao()) {
    return { ok: false, erro: "Convites exigem o Supabase conectado." };
  }
  if (!TOKEN_CONVITE.test(token)) return { ok: false, erro: "Link de convite inválido." };

  const sessao = await obterSessao();
  const auth = await criarClienteServidor();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) return { ok: false, erro: "Entre na sua conta para aceitar o convite." };

  try {
    const db = criarClienteAdmin();

    const { data: convite, error } = await db
      .from("convites")
      .select("id, organizacao_id, email, papel, clientes_permitidos, expira_em, aceito_em")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      registrarFalha("aceitarConvite/leitura", error);
      return { ok: false, erro: "Não foi possível ler o convite." };
    }
    if (!convite) return { ok: false, erro: "Este convite não existe mais." };

    const c = convite as unknown as {
      id: string;
      organizacao_id: string;
      email: string;
      papel: string;
      clientes_permitidos: string[] | null;
      expira_em: string;
      aceito_em: string | null;
    };

    if (c.aceito_em) return { ok: false, erro: "Este convite já foi usado." };
    if (new Date(c.expira_em).getTime() < Date.now()) {
      return { ok: false, erro: "Este convite expirou. Peça um novo à agência." };
    }

    const emailLogado = (user.email ?? "").trim().toLowerCase();
    if (emailLogado !== c.email.trim().toLowerCase()) {
      return {
        ok: false,
        erro: `Este convite é para ${c.email}. Entre com essa conta para aceitá-lo.`,
      };
    }

    if (sessao?.organizacaoId === c.organizacao_id) {
      return { ok: false, erro: "Você já faz parte desta organização." };
    }

    /* Fecha o convite primeiro, e só se ele ainda estiver aberto. Se duas abas
       clicarem ao mesmo tempo, a segunda não afeta linha nenhuma e para aqui —
       em vez de criar um vínculo duplicado. */
    const { data: fechado, error: erroFechar } = await db
      .from("convites")
      .update({ aceito_em: new Date().toISOString() })
      .eq("id", c.id)
      .is("aceito_em", null)
      .select("id");

    if (erroFechar) {
      registrarFalha("aceitarConvite/fechar", erroFechar);
      return { ok: false, erro: "Não foi possível aceitar o convite." };
    }
    if (!fechado?.length) return { ok: false, erro: "Este convite já foi usado." };

    const { error: erroVinculo } = await db.from("membros_organizacao").insert({
      organizacao_id: c.organizacao_id,
      usuario_id: user.id,
      papel: c.papel,
      clientes_permitidos: c.clientes_permitidos ?? [],
      ativo: true,
    });

    if (erroVinculo) {
      // Devolve o convite ao estado anterior: sem vínculo, ele precisa continuar válido.
      await db.from("convites").update({ aceito_em: null }).eq("id", c.id);
      registrarFalha("aceitarConvite/vinculo", erroVinculo);
      return { ok: false, erro: "Não foi possível criar seu acesso. Fale com a agência." };
    }

    return { ok: true, destino: c.papel === "cliente" ? "/portal" : "/painel" };
  } catch (e) {
    registrarFalha("aceitarConvite", e);
    return { ok: false, erro: "Não foi possível aceitar o convite." };
  }
}
