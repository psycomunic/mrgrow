"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { aceitarConvite } from "./acoes";

export function BotaoAceitar({ token }: { token: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aceitar() {
    setEnviando(true);
    const r = await aceitarConvite(token);

    if (!r.ok) {
      setEnviando(false);
      setErro(r.erro ?? "Não foi possível aceitar o convite.");
      return;
    }

    toast.success("Acesso liberado. Bem-vindo!");
    /* `refresh` antes do push: o layout do painel lê a sessão no servidor, e
       sem revalidar ele ainda acharia que este usuário não tem organização. */
    router.refresh();
    router.push(r.destino ?? "/painel");
  }

  return (
    <div className="space-y-3">
      <Botao onClick={aceitar} disabled={enviando} largura="cheia" tamanho="lg">
        {enviando && <Loader2 className="size-4 animate-spin" />}
        Aceitar e entrar
      </Botao>
      {erro && <p className="text-sm text-perigo">{erro}</p>}
    </div>
  );
}
