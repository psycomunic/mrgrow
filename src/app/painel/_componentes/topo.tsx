import { Bell, Search } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";

export function Topo({ titulo, descricao, acao }: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-borda bg-concha/85 backdrop-blur-xl lg:rounded-t-xl">
      <div className="flex flex-col gap-3 px-5 py-4 pl-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:pl-8">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-tinta sm:text-2xl">
            {titulo}
          </h1>
          {descricao && <p className="mt-0.5 text-sm text-cinza">{descricao}</p>}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cinza-claro" />
            <input
              placeholder="Buscar…"
              className="h-9 w-52 rounded-full border border-borda bg-carta pr-3 pl-9 text-sm text-tinta placeholder:text-cinza-claro foco-anel"
            />
          </div>
          <BotaoLink href="/painel/notificacoes" variante="contorno" tamanho="icone" aria-label="Notificações">
            <Bell className="size-4" />
          </BotaoLink>
          {acao}
        </div>
      </div>
    </header>
  );
}
