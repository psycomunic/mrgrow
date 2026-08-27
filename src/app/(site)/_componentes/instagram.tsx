import Image from "next/image";
import { Instagram } from "lucide-react";
import { Revelar } from "./revelar";
import { MARCA } from "@/lib/marca";

/** Só o arroba, para o botão. Derivado do link, para não viver em dois lugares. */
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
          <h2>O que não cabe no site, está lá</h2>

          <a
            href={MARCA.instagramAgencia}
            target="_blank"
            rel="noopener noreferrer"
            className="insta__bt"
          >
            <Instagram size={18} />
            Seguir @{ARROBA}
          </a>
        </div>

        {/* O mockup já vem cortado na base, e a base reta lia como falha de
            recorte. A dissolução resolve sem precisar de outra foto. */}
        <figure className="insta__mockup">
          <Image
            src="/marca/instagram-celular.webp"
            alt={`Perfil da ${MARCA.nome} no Instagram, @${ARROBA}`}
            width={900}
            height={840}
            sizes="(max-width: 62rem) 88vw, 28rem"
          />
        </figure>
      </div>
    </Revelar>
  );
}
