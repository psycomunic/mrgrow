import type { Metadata } from "next";
import { exigirEquipe } from "@/lib/sessao";
import { BarraLateral } from "./_componentes/barra-lateral";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel MR Grow" } };

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const sessao = await exigirEquipe();

  return (
    <div className="min-h-dvh bg-papel">
      <BarraLateral
        papel={sessao.papel}
        nome={sessao.nome}
        organizacao={sessao.organizacaoNome}
      />

      {/* A concha separa o app do fundo lavanda. No celular ela sangra
          até a borda, porque margem ali só rouba largura útil. */}
      <div className="lg:pl-[16.5rem]">
        <main className="min-h-dvh bg-concha lg:my-3 lg:mr-3 lg:min-h-[calc(100dvh-1.5rem)] lg:rounded-xl lg:shadow-concha">
          {children}
        </main>
      </div>
    </div>
  );
}
