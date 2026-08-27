import Image from "next/image";

/**
 * Logos dos clientes, em duas esteiras que correm em sentidos opostos.
 *
 * Os arquivos em `clientes/branco` são brancos sobre transparente. Os
 * originais são marca escura sobre branco chapado, e a versão parada
 * usava `filter: invert(1)` mais `mix-blend-mode: screen` para apagar
 * esse fundo. Isso não sobrevive à animação: `transform` cria contexto
 * de empilhamento, que isola a mesclagem, e os logos voltariam a
 * aparecer como caixas escuras.
 */
const CLIENTES = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, "0"));

/** Cada esteira leva metade, duplicada: é a cópia que fecha o laço. */
const LINHAS = [CLIENTES.slice(0, 8), CLIENTES.slice(8)];

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
      </div>

      {/* Fora da `área`: a esteira corre de borda a borda, senão o corte
          aconteceria no meio da tela e denunciaria o truque. */}
      <div className="esteiras">
        {LINHAS.map((linha, i) => (
          <div className={`esteira${i === 1 ? " esteira--volta" : ""}`} key={i}>
            <ul className="esteira__trilho" aria-hidden>
              {[...linha, ...linha].map((n, j) => (
                <li key={`${n}-${j}`}>
                  <Image
                    src={`/clientes/branco/${n}.webp`}
                    alt=""
                    width={472}
                    height={216}
                    sizes="120px"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="area">
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
