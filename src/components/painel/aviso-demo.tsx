import { Info } from "lucide-react";
import Link from "next/link";

export function AvisoDemo() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-alerta/25 bg-alerta/10 px-4 py-3 text-sm text-ink-100">
      <Info className="mt-0.5 size-4 shrink-0 text-alerta" />
      <p>
        Exibindo <strong>dados de demonstração</strong>. Conecte o Supabase no <code>.env.local</code> e rode
        as migrations para ver os números reais.{" "}
        <Link href="/painel/configuracoes" className="font-semibold text-alerta underline-offset-2 hover:underline">
          Como configurar
        </Link>
      </p>
    </div>
  );
}
