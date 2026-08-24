import type { Metadata } from "next";
import { exigirEquipe } from "@/lib/sessao";
import { BarraLateral } from "./_componentes/barra-lateral";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel MR Grow" } };

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const sessao = await exigirEquipe();

  return (
    <div className="min-h-dvh bg-ink-950">
      <BarraLateral
        papel={sessao.papel}
        nome={sessao.nome}
        organizacao={sessao.organizacaoNome}
      />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
