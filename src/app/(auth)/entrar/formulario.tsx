"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada } from "@/components/ui/campo";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

/**
 * Destino pós-login, sempre interno.
 *
 * `router.push(params.get("proximo"))` aceitava URL absoluta: um link
 * `/entrar?proximo=https://site-falso.com` levava a pessoa para fora do
 * domínio logo depois de ela digitar a senha — com a aparência de que o
 * próprio sistema a mandou para lá.
 */
function destinoSeguro(proximo: string | null, convite: string | null) {
  if (convite && /^[0-9a-f]{32,48}$/i.test(convite)) return `/convite/${convite}`;
  if (!proximo) return "/painel";
  if (!proximo.startsWith("/") || proximo.startsWith("//")) return "/painel";
  const permitidas = ["/painel", "/portal", "/convite"];
  return permitidas.some((r) => proximo.startsWith(r)) ? proximo : "/painel";
}

export function FormularioEntrar() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);

    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    router.push(destinoSeguro(params.get("proximo"), params.get("convite")));
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-4">
      <Campo rotulo="E-mail">
        <Entrada
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@mrgrow.com.br"
          autoComplete="email"
          required
        />
      </Campo>
      <Campo rotulo="Senha">
        <Entrada
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </Campo>

      <div className="flex justify-end">
        <Link href="/recuperar-senha" className="text-xs text-cinza hover:text-grafite foco-anel">
          Esqueci minha senha
        </Link>
      </div>

      <Botao type="submit" largura="cheia" tamanho="lg" disabled={carregando}>
        {carregando && <Loader2 className="size-4 animate-spin" />}
        Entrar
      </Botao>
    </form>
  );
}
