import Image from "next/image";
import { Secao, TituloSecao } from "./secao";

type Projeto = {
  arquivo: string;
  nome: string;
  segmento: string;
  tipo: string;
  /** Altura real da captura (largura é sempre 768) — evita salto de layout. */
  altura: number;
};

/** Sites e páginas entregues pela MR Grow. Capturas em `public/portfolio`. */
const PROJETOS: Projeto[] = [
  { arquivo: "manalinda-fitness", nome: "Mana Linda Fitness", segmento: "Moda fitness", tipo: "E-commerce", altura: 3045 },
  { arquivo: "casalinda", nome: "Casa Linda", segmento: "Casa e decoração", tipo: "E-commerce", altura: 3526 },
  { arquivo: "doris-kids", nome: "Doris Kids", segmento: "Moda infantil", tipo: "E-commerce", altura: 2467 },
  { arquivo: "sneakpeak", nome: "SneakPeak", segmento: "Sneakers", tipo: "E-commerce", altura: 1350 },
  { arquivo: "criativae", nome: "Criativa E", segmento: "Comunicação visual", tipo: "Site institucional", altura: 6337 },
  { arquivo: "md-print-solutions", nome: "MD Print Solutions", segmento: "Equipamentos gráficos", tipo: "Site institucional", altura: 4029 },
  { arquivo: "md-print-gtx-pro", nome: "MD Print · GTX Pro", segmento: "Equipamentos gráficos", tipo: "Landing de produto", altura: 2292 },
  { arquivo: "pro-pay", nome: "Pro Pay", segmento: "Meios de pagamento", tipo: "Site institucional", altura: 5049 },
  { arquivo: "guardpay", nome: "GuardPay", segmento: "Meios de pagamento", tipo: "Landing page", altura: 2173 },
  { arquivo: "soluth-contabilidade", nome: "Soluth Contabilidade", segmento: "Contabilidade", tipo: "Site institucional", altura: 3701 },
  { arquivo: "nutricionista-gabriel-oliani", nome: "Gabriel Oliani", segmento: "Nutrição", tipo: "Landing de captação", altura: 3249 },
  { arquivo: "chale-vale-das-aguas", nome: "Chalé Vale das Águas", segmento: "Hospedagem", tipo: "Site com reservas", altura: 4483 },
];

export function Portfolio() {
  return (
    <Secao id="portfolio" className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(45rem_18rem_at_50%_0%,rgba(11,79,209,.14),transparent_70%)]"
      />

      <TituloSecao
        sobre="Portfólio"
        titulo={
          <>
            Páginas feitas para <span className="texto-gradiente">vender</span>, não para enfeitar
          </>
        }
        descricao="Todo site que entregamos nasce com rastreamento, velocidade e um caminho claro até a compra ou o contato. Passe o mouse para percorrer a página inteira."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJETOS.map((p) => (
          <figure
            key={p.arquivo}
            className="cartao-vidro group overflow-hidden rounded-xl p-3 transition-colors hover:border-mrg-500/40"
          >
            {/* Janela de navegador — a captura inteira percorre no hover */}
            <div className="overflow-hidden rounded-lg bg-ink-900 ring-1 ring-white/10">
              <span
                aria-hidden
                className="flex h-6 items-center gap-1.5 border-b border-white/10 bg-ink-950 px-3"
              >
                <span className="size-1.5 rounded-full bg-white/25" />
                <span className="size-1.5 rounded-full bg-white/25" />
                <span className="size-1.5 rounded-full bg-white/25" />
              </span>

              <div className="h-58 overflow-hidden sm:h-66">
                <Image
                  src={`/portfolio/${p.arquivo}.webp`}
                  alt={`Site desenvolvido para ${p.nome}`}
                  width={768}
                  height={p.altura}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  className="h-auto w-full transition-transform duration-[7000ms] ease-linear group-hover:[transform:translateY(calc(232px-100%))] motion-reduce:transition-none sm:group-hover:[transform:translateY(calc(264px-100%))]"
                />
              </div>
            </div>

            <figcaption className="flex items-start justify-between gap-3 px-2 pt-4 pb-2">
              <div>
                <p className="font-display text-base font-bold text-white">{p.nome}</p>
                <p className="text-xs text-ink-400">{p.segmento}</p>
              </div>
              <span className="shrink-0 rounded-sm bg-mrg-500/12 px-2.5 py-1 text-[11px] font-semibold text-mrg-300">
                {p.tipo}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Secao>
  );
}
