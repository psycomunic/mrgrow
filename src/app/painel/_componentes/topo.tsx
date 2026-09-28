import { Bell } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";
import { Busca } from "./busca";
import { BotaoTema } from "@/components/painel/tema";

export function Topo({
  titulo,
  descricao,
  acao,
  banner,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  /** Arte que ocupa o lugar do título na barra, quando a página tem uma. */
  banner?: React.ReactNode;
}) {
  return (
    <>
      {/* Fundo quase opaco de propósito: a 85% de opacidade, as linhas do
          gráfico do conteúdo atravessavam o cabeçalho e o título ficava
          ilegível conforme a página rolava. */}
      <header className="sticky top-0 z-30 border-b border-borda bg-concha/97 backdrop-blur-xl lg:rounded-t-xl">
        <div className="flex flex-col gap-3 px-5 py-4 pl-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:pl-8">
          {/* Com banner, ele toma o lugar do título: a arte já diz o que o
              título diria, e as duas coisas juntas na mesma faixa brigariam.
              O `h1` continua no documento, só que invisível — é ele que dá o
              cabeçalho da página para leitor de tela e para o índice. */}
          {banner ? (
            <>
              <h1 className="sr-only">{titulo}</h1>
              {banner}
            </>
          ) : (
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight text-tinta sm:text-2xl">
                {titulo}
              </h1>
              {descricao && <p className="mt-0.5 text-sm text-cinza">{descricao}</p>}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Busca />
            <BotaoTema />
            <BotaoLink
              href="/painel/notificacoes"
              variante="contorno"
              tamanho="icone"
              aria-label="Notificações"
            >
              <Bell className="size-4" />
            </BotaoLink>
            {acao}
          </div>
        </div>
      </header>
    </>
  );
}
