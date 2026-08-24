"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils";

export function BotaoSincronizar() {
  const [carregando, setCarregando] = useState(false);

  async function sincronizar() {
    setCarregando(true);
    try {
      const r = await fetch("/api/integracoes/sincronizar", { method: "POST" });
      const json = await r.json();
      if (!r.ok) throw new Error(json?.erro ?? "falha");
      toast.success(`Sincronizado: ${json.registros ?? 0} registros de ${json.contas ?? 0} contas.`);
    } catch {
      toast.error("Não foi possível sincronizar. Confira as integrações conectadas.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Botao onClick={sincronizar} tamanho="sm" disabled={carregando}>
      <RefreshCw className={cn("size-4", carregando && "animate-spin")} />
      Sincronizar agora
    </Botao>
  );
}
