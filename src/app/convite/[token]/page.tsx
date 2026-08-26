import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, UserPlus } from "lucide-react";
import { BotaoAceitar } from "./botao";
import { BotaoLink } from "@/components/ui/botao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao } from "@/lib/dados";
import { carregarConvite } from "@/lib/convites";
import { dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Convite" };

export default async function PaginaConvite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  /* Em demonstração não existe cliente Supabase: instanciá-lo aqui lançava
     erro de servidor e a página inteira quebrava, em vez de explicar que
     convite depende de banco conectado. */
  if (modoDemonstracao()) {
    return (
      <main className="grid min-h-dvh place-items-center bg-papel p-6">
        <div className="cartao w-full max-w-md rounded-xl p-7">
          <Aviso
            titulo="Convites precisam do banco conectado"
            texto="A plataforma está em modo demonstração. Configure o Supabase no .env.local para convidar pessoas para a equipe."
          />
        </div>
      </main>
    );
  }

  /* Sem sessão, o convite não pode ser aceito — mas o link também não deve
     morrer: manda para o login e volta para cá depois de entrar. */
  const auth = await criarClienteServidor();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect(`/entrar?proximo=${encodeURIComponent(`/convite/${token}`)}`);

  const convite = await carregarConvite(token);

  return (
    <main className="grid min-h-dvh place-items-center bg-papel p-6">
      <div className="cartao w-full max-w-md rounded-xl p-7">
        {!convite ? (
          <Aviso
            titulo="Convite não encontrado"
            texto="O link pode ter sido revogado ou digitado incompleto. Peça um novo à agência."
          />
        ) : convite.aceito ? (
          <Aviso
            titulo="Convite já usado"
            texto="Este convite foi aceito. Se o acesso é seu, basta entrar normalmente."
          />
        ) : convite.expirado ? (
          <Aviso
            titulo="Convite expirado"
            texto={`Ele valia até ${dataCompleta(convite.expiraEm)}. Peça um novo à agência.`}
          />
        ) : (
          <>
            <span className="grid size-11 place-items-center rounded-full bg-mrg-500/12 text-mrg-600">
              <UserPlus className="size-5" />
            </span>

            <h1 className="mt-4 font-display text-xl font-bold text-tinta">
              Convite para {convite.organizacao}
            </h1>
            <p className="mt-2 text-sm text-grafite">
              Você entra como <strong className="text-tinta">{convite.rotuloPapel}</strong>. O
              convite foi enviado para {convite.email} e vale até{" "}
              {dataCompleta(convite.expiraEm)}.
            </p>

            <div className="mt-6">
              <BotaoAceitar token={token} />
            </div>

            <p className="mt-4 text-xs text-cinza">
              Está logado com outra conta?{" "}
              <Link href="/entrar" className="font-semibold text-mrg-600 foco-anel">
                Trocar de conta
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <>
      <span className="grid size-11 place-items-center rounded-full bg-alerta/12 text-alerta">
        <CircleAlert className="size-5" />
      </span>
      <h1 className="mt-4 font-display text-xl font-bold text-tinta">{titulo}</h1>
      <p className="mt-2 text-sm text-grafite">{texto}</p>
      <BotaoLink href="/painel" variante="contorno" largura="cheia" className="mt-6">
        Ir para o painel
      </BotaoLink>
    </>
  );
}
