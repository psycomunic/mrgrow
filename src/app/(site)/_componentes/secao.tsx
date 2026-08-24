import { cn } from "@/lib/utils";

export function Secao({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-20 sm:py-28", className)}>
      <div className="container-mrg">{children}</div>
    </section>
  );
}

export function TituloSecao({
  sobre,
  titulo,
  descricao,
  centralizado = true,
}: {
  sobre?: string;
  titulo: React.ReactNode;
  descricao?: string;
  centralizado?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", centralizado && "mx-auto text-center")}>
      {sobre && (
        <span
          className={cn(
            "inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-mrg-300 uppercase",
            centralizado && "justify-center",
          )}
        >
          <span className="block h-px w-4 bg-mrg-500" />
          {sobre}
        </span>
      )}
      <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
        {titulo}
      </h2>
      {descricao && (
        <p className="mt-5 text-lg leading-relaxed text-ink-300 text-pretty">{descricao}</p>
      )}
    </div>
  );
}
