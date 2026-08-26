import Image from "next/image";

/** Logos dos clientes em `public/clientes` (01–16), cinza sobre branco. */
const CLIENTES = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, "0"));

const SEGMENTOS = [
  "E-commerce",
  "Clínicas e estética",
  "Infoprodutos",
  "Imobiliárias",
  "Serviços locais",
  "Educação",
  "Restaurantes",
  "Advocacia",
];

export function ProvaSocial() {
  return (
    <section className="mural">
      <div className="area">
        <p className="mural__rot">Marcas que já passaram pela nossa operação</p>

        <ul className="mural__logos">
          {CLIENTES.map((n) => (
            <li key={n}>
              <Image
                src={`/clientes/${n}.webp`}
                alt=""
                aria-hidden
                width={944}
                height={432}
                sizes="(max-width: 640px) 30vw, 130px"
              />
            </li>
          ))}
        </ul>

        <div className="alcance">
          <figure className="alcance__mapa">
            <Image
              src="/marca/mapa-brasil-dark.webp"
              alt="Mapa do Brasil com as praças onde a MR Grow opera contas"
              width={900}
              height={902}
              sizes="(max-width: 832px) 80vw, 340px"
            />
          </figure>
          <div>
            <p className="alcance__texto">Contas atendidas de norte a sul do país.</p>
            <p className="alcance__apoio">
              Operação remota, resultado medido no mesmo painel, não importa onde a sua empresa
              fica.
            </p>
            <ul className="segmentos">
              {SEGMENTOS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
