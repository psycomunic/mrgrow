"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada } from "@/components/ui/campo";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

export default function PaginaRecuperar() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?proximo=/painel/configuracoes`,
    });
    setCarregando(false);
    if (error) return toast.error(error.message);
    setEnviado(true);
  }

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold text-tinta">Recuperar senha</h1>
      <p className="mt-2 text-sm text-cinza">Enviamos um link para você definir uma nova senha.</p>

      {enviado ? (
        <div className="mt-8 rounded-lg border border-sucesso/25 bg-sucesso/10 p-5 text-sm text-tinta">
          Se existir uma conta com <strong>{email}</strong>, o link já está a caminho.
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-8 space-y-4">
          <Campo rotulo="E-mail">
            <Entrada type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Campo>
          <Botao type="submit" largura="cheia" tamanho="lg" disabled={carregando}>
            {carregando && <Loader2 className="size-4 animate-spin" />}
            Enviar link
          </Botao>
        </form>
      )}

      <p className="mt-6 text-sm text-cinza">
        <Link href="/entrar" className="font-semibold text-mrg-600 hover:text-mrg-600 foco-anel">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
