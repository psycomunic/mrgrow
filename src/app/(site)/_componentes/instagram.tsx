import Image from "next/image";
import { Instagram } from "lucide-react";
import { Revelar } from "./revelar";
import { MARCA } from "@/lib/marca";

/** Só o arroba, para o botão. Derivado do link, para não viver em dois lugares. */
const ARROBA = MARCA.instagramAgencia.replace(/\/+$/, "").split("/").pop() ?? "mrgrow.ag";

export function InstagramConvite() {
  return (
    <Revelar como="section" id="instagram" className="insta">
      <div className="area">
        <div className="insta__painel vidro">
          <div className="insta__texto">
            <span className="chapeu">
              <i />
              No Instagram
            </span>
            <h2>O que não cabe no site, está lá</h2>

            <p className="insta__apoio">
              Publicação nova toda semana: bastidor da operação, diagnóstico de conta e o método
              aberto.
            </p>

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

          {/* Ancorado no canto do painel e transbordando: o mockup já vem
              cortado na base, e sair pela borda com dissolução é o que
              torna esse corte intencional. */}
          <figure className="insta__mockup">
            <Image
              src="/marca/instagram-celular.webp"
              alt={`Perfil da ${MARCA.nome} no Instagram, @${ARROBA}`}
              width={900}
              height={840}
              sizes="(max-width: 62rem) 88vw, 26rem"
            />
          </figure>
        </div>
      </div>
    </Revelar>
  );
}
