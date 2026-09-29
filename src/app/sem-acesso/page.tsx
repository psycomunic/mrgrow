import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, LogOut, MailCheck } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { modoDemonstracao } from "@/lib/dados";
import { obterSessao, obterUsuario } from "@/lib/sessao";
import { ROTULO_PAPEL, type Papel } from "@/lib/papeis";
import { dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Acesso pendente" };

/**
 * Quem entrou mas ainda não pertence a nenhuma organização.
 *
 * Antes esta pessoa caía num laço: o middleware via a sessão e mandava do
 * login para o painel, o painel não via vínculo e mandava de volta para o
 * login, até o navegador desistir com "redirecionamento em excesso".
 *
 * A página existe para cortar o laço e, quando dá, resolver: se houver um
 * convite em aberto para o e-mail da conta, ele aparece aqui com o botão
 * de abrir. É o caso comum — a pessoa foi convidada, criou a conta pelo
 * e-mail de confirmação e nunca voltou ao link do convite.
 */
export default async function PaginaSemAcesso() {
  if (modoDemonstracao()) redirect("/painel");

  const usuario = await obterUsuario();
  if (!usuario) redirect("/entrar");

  /* Já tem vínculo? Então não é esta página — pode ter sido convidada e
     aceita em outra aba enquanto esta estava aberta. */
  const sessao = await obterSessao();
  if (sessao) redirect("/painel");

  const convite = usuario.email ? await conviteEmAberto(usuario.email) : null;

  return (
    <main className="grid min-h-dvh place-items-center bg-papel p-6">
      <div className="cartao w-full max-w-md rounded-xl p-7">
        {convite ? (
          <>
            <span className="grid size-11 place-items-center rounded-full bg-sucesso/15 text-sucesso">
              <MailCheck className="size-5" />
            </span>
            <h1 className="mt-4 font-display text-xl font-bold text-tinta">
              Você tem um convite esperando
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-grafite">
              Sua conta está criada. Falta só aceitar o convite para entrar como{" "}
              <strong className="text-tinta">
                {ROTULO_PAPEL[convite.papel as Papel] ?? convite.papel}
              </strong>
              .
            </p>
            <p className="mt-1 text-xs text-cinza">
              O convite vale até {dataCompleta(convite.expira_em.slice(0, 10))}.
            </p>

            <BotaoLink href={`/convite/${convite.token}`} largura="cheia" className="mt-6">
              Aceitar convite e entrar
            </BotaoLink>
          </>
        ) : (
          <>
            <span className="grid size-11 place-items-center rounded-full bg-alerta/15 text-alerta">
              <CircleAlert className="size-5" />
            </span>
            <h1 className="mt-4 font-display text-xl font-bold text-tinta">
              Sua conta ainda não tem acesso
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-grafite">
              Você entrou como <strong className="text-tinta">{usuario.email}</strong>, mas essa
              conta não está ligada a nenhuma equipe. Peça a quem administra a plataforma para
              enviar um convite para este mesmo e-mail.
            </p>
          </>
        )}

        <form action="/api/auth/sair" method="post" className="mt-4">
          <button
            type="submit"
            className="foco-anel flex w-full items-center justify-center gap-2 rounded-md border border-borda py-2.5 text-sm font-medium text-grafite transition-colors hover:border-borda-forte hover:text-tinta"
          >
            <LogOut className="size-4" />
            Sair desta conta
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-cinza">
          Entrou com o e-mail errado?{" "}
          <Link href="/api/auth/sair" className="text-acento hover:underline">
            Trocar de conta
          </Link>
        </p>
      </div>
    </main>
  );
}

/**
 * Convite em aberto para este e-mail.
 *
 * Usa a chave de serviço porque quem chega aqui não tem organização, e a
 * RLS de `convites` filtra justamente por organização — com o cliente
 * comum, a pessoa nunca enxergaria o próprio convite. O filtro por e-mail
 * exato é o que autoriza: só mostra o convite de quem está logado.
 */
async function conviteEmAberto(email: string) {
  try {
    const db = criarClienteAdmin();
    const { data } = await db
      .from("convites")
      .select("token, papel, expira_em")
      .eq("email", email.toLowerCase())
      .is("aceito_em", null)
      .gt("expira_em", new Date().toISOString())
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data as { token: string; papel: string; expira_em: string } | null) ?? null;
  } catch {
    /* Sem convite a página ainda serve: ela corta o laço e explica o que
       fazer. Falhar aqui não pode derrubá-la. */
    return null;
  }
}
