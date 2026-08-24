import Image from "next/image";
import { PROJETOS } from "./trabalho-dados";

/**
 * A assinatura da página: os sites entregues correm por baixo da promessa.
 * A lista aparece duas vezes para o laço fechar sem salto.
 */
export function Faixa() {
  const trilho = [...PROJETOS, ...PROJETOS];

  return (
    <div className="faixa">
      <div className="faixa__trilho">
        {trilho.map((p, i) => {
          const primeira = i < PROJETOS.length;
          return (
            <figure className="pagina" key={`${p.arquivo}-${i}`}>
              <Image
                src={`/portfolio/${p.arquivo}.webp`}
                alt={primeira ? `Site desenvolvido para ${p.nome}` : ""}
                aria-hidden={!primeira}
                width={768}
                height={p.altura}
                sizes="240px"
              />
              <figcaption>{p.nome}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
