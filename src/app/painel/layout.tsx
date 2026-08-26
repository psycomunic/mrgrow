import type { Metadata } from "next";
import { exigirEquipe } from "@/lib/sessao";
import { BarraLateral } from "./_componentes/barra-lateral";
import { SessaoPainel } from "./_componentes/sessao-cliente";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel MR Grow" } };
/**
 * Sempre renderizado por requisição.
 *
 * Sem isto, o build de produção pré-renderiza o painel como estático — foi o
 * que o `next build` mostrou. Em modo demonstração nada aqui toca cookie, então
 * o Next conclui que a página é estática e a congela no instante do deploy:
 * "vence hoje" passa a significar o dia do deploy, e o prazo que aparece
 * vermelho hoje continua vermelho no mês que vem. Um app atrás de login não
 * tem o que ganhar sendo estático.
 */
export const dynamic = "force-dynamic";


export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const sessao = await exigirEquipe();

  return (
    <SessaoPainel
      valor={{
        papel: sessao.papel,
        nome: sessao.nome,
        organizacao: sessao.organizacaoNome,
      }}
    >
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
    </SessaoPainel>
  );
}
