import Image from "next/image";

/** Logos dos clientes em `public/clientes` (01–16), em escala de cinza sobre fundo branco. */
const CLIENTES = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, "0"));

const SEGMENTOS = [
  "E-commerce",
  "Clínicas & Estética",
  "Infoprodutos",
  "Imobiliárias",
  "Serviços locais",
  "Educação",
  "Restaurantes",
  "Advocacia",
];

export function ProvaSocial() {
  return (
    <section className="border-y border-white/8 bg-white/[0.015] py-12">
      <div className="container-mrg">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-ink-500 uppercase">
          Marcas que já passaram pela nossa operação
        </p>

        {/* Mural de logos — invert + screen tira o fundo branco dos arquivos originais */}
        <ul className="mt-8 grid grid-cols-3 items-center gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
          {CLIENTES.map((n) => (
            <li key={n} className="flex items-center justify-center">
              <Image
                src={`/clientes/${n}.webp`}
                alt=""
                aria-hidden
                width={944}
                height={432}
                sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 130px"
                className="h-12 w-auto opacity-45 mix-blend-screen invert transition-opacity duration-300 hover:opacity-80"
              />
            </li>
          ))}
        </ul>

        <div className="mt-12 grid gap-8 border-t border-white/8 pt-10 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
          <Image
            src="/marca/mapa-brasil.webp"
            alt="Mapa do Brasil com as praças onde a MR Grow opera contas"
            width={900}
            height={902}
            sizes="180px"
            className="mx-auto h-32 w-auto opacity-80 sm:mx-0 sm:h-36"
          />
          <div>
            <p className="text-center text-sm font-semibold text-ink-200 sm:text-left">
              Contas atendidas de norte a sul do país — operação 100% remota, resultado medido no
              mesmo painel.
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
              {SEGMENTOS.map((s) => (
                <li key={s} className="text-sm font-medium text-ink-400/90">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
