import { cn } from "@/lib/utils";

export function Tabela({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="cartao overflow-x-auto rounded-lg">
      <table className={cn("w-full min-w-[40rem] text-left text-sm", className)}>{children}</table>
    </div>
  );
}

export function Cabecalhos({ colunas }: { colunas: string[] }) {
  return (
    <thead>
      <tr className="border-b border-borda">
        {colunas.map((c) => (
          <th key={c} className="px-4 py-3 text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Linha({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-borda-fraca transition-colors last:border-0 hover:bg-nevoa">{children}</tr>;
}

export function Celula({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3.5 text-grafite", className)}>{children}</td>;
}

export function Vazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="cartao grid place-items-center rounded-lg p-12 text-center">
      <p className="text-sm text-cinza">{mensagem}</p>
    </div>
  );
}
