import { Bell } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";
import { Busca } from "./busca";

export function Topo({
  titulo,
  descricao,
  acao,
  banner,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  /** Faixa que sangra até as bordas, acima da linha do título. */
  banner?: React.ReactNode;
}) {
  /* O banner fica fora do `header`, e não dentro: dentro, ele ficaria grudado
     no topo junto com a barra e comeria a altura dele em toda a rolagem. Fora,
     ele rola embora e só a linha do título permanece. Como passa a ser o
     primeiro elemento da concha, o arredondamento do canto passa a ser dele. */
  return (
    <>
      {banner}

      {/* Fundo quase opaco de propósito: a 85% de opacidade, as linhas do
          gráfico do conteúdo atravessavam o cabeçalho e o título ficava
          ilegível conforme a página rolava. */}
      <header
        className={[
          "sticky top-0 z-30 border-b border-borda bg-concha/97 backdrop-blur-xl",
          banner ? "" : "lg:rounded-t-xl",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 px-5 py-4 pl-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:pl-8">
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-tinta sm:text-2xl">
              {titulo}
            </h1>
            {descricao && <p className="mt-0.5 text-sm text-cinza">{descricao}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Busca />
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
