import { Info, TriangleAlert } from "lucide-react";
import Link from "next/link";

export function AvisoDemo() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-alerta/25 bg-alerta/8 px-4 py-3 text-sm text-tinta">
      <Info className="mt-0.5 size-4 shrink-0 text-alerta" />
      <p className="leading-relaxed">
        Estes são <strong>dados de demonstração</strong> — coerentes entre si, mas fictícios. Conecte
        o Supabase no <code className="text-[13px] text-grafite">.env.local</code> e rode as
        migrations para ver a operação real.{" "}
        <Link
          href="/painel/configuracoes"
          className="font-semibold text-alerta underline-offset-2 hover:underline"
        >
          Como configurar
        </Link>
      </p>
    </div>
  );
}

/**
 * Estado de falha, distinto do de demonstração.
 *
 * Com o banco ligado, uma consulta que quebra não pode virar dado fictício na
 * tela: quem está olhando toma decisão com base no número. Este aviso é o que
 * substitui aquele silêncio — o motivo detalhado fica no log do servidor.
 */
export function AvisoFalha({ o_que }: { o_que: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-perigo/25 bg-perigo/8 px-4 py-3 text-sm text-tinta">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-perigo" />
      <p className="leading-relaxed">
        Não foi possível carregar {o_que}. Os números abaixo estão incompletos — o erro está no log
        do servidor.
      </p>
    </div>
  );
}
