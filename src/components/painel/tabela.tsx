import { cn } from "@/lib/utils";

/**
 * `larguraMinima` é opcional de propósito.
 *
 * Antes toda tabela nascia com `min-w-[40rem]` fixo. Dentro de um grid de
 * duas colunas a coluna tem ~35rem, então a tabela estourava e as últimas
 * colunas — justamente as de status e de valor — ficavam cortadas fora da
 * área visível. Quem precisa de largura mínima pede; o resto se ajusta.
 */
export function Tabela({
  children,
  className,
  larguraMinima,
}: {
  children: React.ReactNode;
  className?: string;
  larguraMinima?: string;
}) {
  return (
    <div className="cartao overflow-x-auto rounded-lg">
      <table
        className={cn("w-full text-left text-sm", className)}
        style={larguraMinima ? { minWidth: larguraMinima } : undefined}
      >
        {children}
      </table>
    </div>
  );
}

export function Cabecalhos({ colunas }: { colunas: string[] }) {
  return (
    <thead>
      <tr className="border-b border-borda">
        {colunas.map((c, i) => (
          <th
            key={`${c}-${i}`}
            className="px-4 py-3 text-[11px] font-semibold tracking-wider whitespace-nowrap text-cinza-claro uppercase"
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Linha({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-borda-fraca transition-colors last:border-0 hover:bg-nevoa">
      {children}
    </tr>
  );
}

export function Celula({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3.5 align-middle text-grafite", className)}>{children}</td>;
}

/**
 * Célula que corta o texto com reticências.
 *
 * `truncate` direto num `<td>` não funciona: célula de tabela não respeita
 * `max-width` como bloco. Quem corta é a `<div>` interna, e o `title` deixa o
 * texto completo acessível ao passar o mouse.
 */
export function CelulaTexto({
  children,
  largura = "22rem",
  titulo,
  className,
}: {
  children: React.ReactNode;
  largura?: string;
  titulo?: string;
  className?: string;
}) {
  return (
    <td className={cn("px-4 py-3.5 align-middle text-grafite", className)}>
      <div className="truncate" style={{ maxWidth: largura }} title={titulo}>
        {children}
      </div>
    </td>
  );
}

export function Vazio({ mensagem, acao }: { mensagem: string; acao?: React.ReactNode }) {
  return (
    <div className="cartao grid place-items-center gap-3 rounded-lg p-12 text-center">
      <p className="max-w-sm text-sm text-cinza">{mensagem}</p>
      {acao}
    </div>
  );
}
