import Image from "next/image";
import { Instagram } from "lucide-react";
import { Revelar } from "./revelar";
import { MARCA } from "@/lib/marca";

/** O que a pessoa encontra lá, tirado dos destaques do próprio perfil. */
const CONTEUDO = [
  "Diagnósticos de conta reais, com o erro apontado",
  "Resultado de cliente com número, não com print de saldo",
  "O método G.R.O.W explicado etapa por etapa",
  "Bastidor da operação e do time",
];

/** Só o arroba, para o botão e para o rótulo abaixo dele. */
const ARROBA = MARCA.instagramAgencia.replace(/\/+$/, "").split("/").pop() ?? "mrgrow.ag";

export function InstagramConvite() {
  return (
    <Revelar como="section" id="instagram" className="insta">
      <div className="area insta__grade">
        <div>
          <span className="chapeu">
            <i />
            No Instagram
          </span>
          <h2>O que a gente aprende nas contas, a gente publica</h2>

          <p className="insta__texto">
            Nada de post motivacional nem promessa de enriquecer dormindo. É o que funcionou, o
            que não funcionou e por quê, com a conta aberta na tela.
          </p>

          <ul className="insta__lista">
            {CONTEUDO.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          <div className="insta__acoes">
            <a
              href={MARCA.instagramAgencia}
              target="_blank"
              rel="noopener noreferrer"
              className="insta__bt"
            >
              <Instagram size={18} />
              Seguir @{ARROBA}
            </a>
            <p>Publicação nova toda semana. Se não agregar, você deixa de seguir.</p>
          </div>
        </div>

        {/* O mockup sangra um pouco para fora da coluna: recorte em fundo
            transparente pede respiro, e a moldura reta cortaria a sombra
            dos aparelhos. */}
        <figure className="insta__mockup">
          <Image
            src="/marca/instagram-celular.webp"
            alt={`Perfil da ${MARCA.nome} no Instagram, @${ARROBA}`}
            width={900}
            height={840}
            sizes="(max-width: 62rem) 90vw, 30rem"
          />
        </figure>
      </div>
    </Revelar>
  );
}
