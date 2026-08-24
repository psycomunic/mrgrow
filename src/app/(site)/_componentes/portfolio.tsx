import Image from "next/image";
import { Secao, CabecaSecao } from "./secao";
import { PROJETOS } from "./trabalho-dados";

export function Portfolio() {
  return (
    <Secao id="portfolio">
      <CabecaSecao
        etiqueta="Trabalho"
        titulo="Páginas feitas para vender, não para enfeitar."
        apoio="Todo site que entregamos nasce com rastreamento, velocidade e um caminho claro até a compra ou o contato. Passe o mouse para percorrer a página inteira."
      />

      <div className="obras espaco">
        {PROJETOS.map((p) => (
          <figure className="obra" key={p.arquivo}>
            <div className="obra__quadro">
              <Image
                src={`/portfolio/${p.arquivo}.webp`}
                alt={`Site desenvolvido para ${p.nome}`}
                width={768}
                height={p.altura}
                sizes="(max-width: 768px) 100vw, (max-width: 1216px) 50vw, 420px"
              />
            </div>
            <figcaption className="obra__pe">
              <span className="obra__nome">{p.nome}</span>
              <span className="obra__tipo">{p.tipo}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Secao>
  );
}
