import { cn } from "@/lib/utils";

export function Tabela({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="cartao-vidro overflow-x-auto rounded-lg">
      <table className={cn("w-full min-w-[40rem] text-left text-sm", className)}>{children}</table>
    </div>
  );
}

export function Cabecalhos({ colunas }: { colunas: string[] }) {
  return (
    <thead>
      <tr className="border-b border-white/8">
        {colunas.map((c) => (
          <th key={c} className="px-4 py-3 text-[11px] font-bold tracking-wider text-ink-500 uppercase">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Linha({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]">{children}</tr>;
}

export function Celula({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3.5 text-ink-200", className)}>{children}</td>;
}

export function Vazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="cartao-vidro grid place-items-center rounded-lg p-12 text-center">
      <p className="text-sm text-ink-400">{mensagem}</p>
    </div>
  );
}
