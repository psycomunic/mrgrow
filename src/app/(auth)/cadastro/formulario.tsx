"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada } from "@/components/ui/campo";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

export function FormularioCadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return toast.error("A senha precisa de pelo menos 8 caracteres.");

    setCarregando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome_completo: nome },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    setCarregando(false);

    if (error) return toast.error(error.message);
    setPronto(true);
  }

  if (pronto) {
    return (
      <div className="mt-8 rounded-lg border border-sucesso/25 bg-sucesso/10 p-5 text-sm text-ink-100">
        Enviamos um link de confirmação para <strong>{email}</strong>. Abra o e-mail para ativar a conta.
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-4">
      <Campo rotulo="Nome completo">
        <Entrada value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required />
      </Campo>
      <Campo rotulo="E-mail">
        <Entrada type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </Campo>
      <Campo rotulo="Senha" dica="Mínimo de 8 caracteres.">
        <Entrada
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          required
        />
      </Campo>
      <Botao type="submit" largura="cheia" tamanho="lg" disabled={carregando}>
        {carregando && <Loader2 className="size-4 animate-spin" />}
        Criar conta
      </Botao>
    </form>
  );
}
