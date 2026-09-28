import { cn } from "@/lib/utils";

/* Seis tons da família da marca. A cor sai do nome, então a mesma conta
   aparece sempre com a mesma cor em qualquer tela do painel — sem precisar
   guardar isso no banco. */
const TONS = [
  "bg-mrg-500 text-white",
  "bg-sucesso/22 text-sucesso",
  "bg-alerta/22 text-alerta",
  "bg-perigo/22 text-perigo",
  "bg-mrg-400/22 text-acento",
  "bg-nevoa-2 text-grafite",
] as const;

function tom(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % 997;
  return TONS[h % TONS.length];
}

/** Iniciais: duas letras quando há duas palavras úteis, uma quando não há. */
export function iniciais(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-Z]/.test(p));
  if (!partes.length) return nome.slice(0, 1).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const MEDIDA = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-[11px]",
  lg: "size-10 text-[13px]",
} as const;

export function Avatar({
  nome,
  medida = "md",
  className,
}: {
  nome: string;
  medida?: keyof typeof MEDIDA;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-display font-bold select-none",
        MEDIDA[medida],
        tom(nome),
        className,
      )}
      title={nome}
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  );
}

/**
 * Pilha de avatares sobrepostos, com "+N" quando a lista passa do limite.
 *
 * O anel de cada peça é da cor do cartão, não branco: é ele que separa um
 * avatar do vizinho, e branco sobre a superfície escura desenharia um
 * contorno claro em volta de cada bolinha.
 */
export function Avatares({
  nomes,
  limite = 4,
  medida = "md",
  className,
}: {
  nomes: string[];
  limite?: number;
  medida?: keyof typeof MEDIDA;
  className?: string;
}) {
  const visiveis = nomes.slice(0, limite);
  const resto = nomes.length - visiveis.length;

  return (
    <div className={cn("flex items-center", className)}>
      {visiveis.map((n) => (
        <Avatar key={n} nome={n} medida={medida} className="-ml-2 ring-2 ring-carta first:ml-0" />
      ))}
      {resto > 0 && (
        <span
          className={cn(
            "-ml-2 grid shrink-0 place-items-center rounded-full bg-nevoa-2 font-display font-bold text-cinza ring-2 ring-carta",
            MEDIDA[medida],
          )}
          title={nomes.slice(limite).join(", ")}
        >
          +{resto}
        </span>
      )}
      {/* A lista existe para quem lê a tela; para quem ouve, os nomes. */}
      <span className="sr-only">{nomes.join(", ")}</span>
    </div>
  );
}
