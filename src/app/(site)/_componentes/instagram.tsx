import Image from "next/image";
import { Instagram } from "lucide-react";
import { Revelar } from "./revelar";
import { MARCA } from "@/lib/marca";

/** Só o arroba, para o botão. Derivado do link, para não viver em dois lugares. */
const ARROBA = MARCA.instagramAgencia.replace(/\/+$/, "").split("/").pop() ?? "mrgrow.ag";

/**
 * Números do perfil. Envelhecem junto com o mockup, que mostra os mesmos
 * valores na tela: quando um for atualizado, o outro tem que ir junto.
 */
const NUMEROS = [
  { v: "11,5 mil", r: "seguidores" },
  { v: "238", r: "publicações" },
  { v: "Toda semana", r: "conteúdo novo" },
];

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

            <dl className="insta__numeros">
              {NUMEROS.map((n) => (
                <div key={n.r}>
                  <dt>{n.v}</dt>
                  <dd>{n.r}</dd>
                </div>
              ))}
            </dl>

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
