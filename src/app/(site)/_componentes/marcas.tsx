import Image from "next/image";

/**
 * Marcas das plataformas que a agência opera, nas cores próprias.
 *
 * Os arquivos em `public/marca/` são recortes dos lockups oficiais: só
 * o símbolo, sem a palavra ao lado. A pastilha do cartão tem 2,6rem e a
 * palavra sairia ilegível, além de repetir o título, que já diz "Meta
 * Ads" e "Google Ads".
 *
 * O PNG da Meta vinha com fundo opaco, que dentro da pastilha viraria um
 * retângulo; a transparência foi reconstruída por distância de cor.
 *
 * A assinatura repete a do lucide (`size`) para o cartão poder trocar um
 * ícone pelo outro sem saber a diferença. Uso nominativo: Meta e Google
 * Ads são marcas de seus donos.
 */

type Props = { size?: number; className?: string };

/* Compensação óptica. `size` no lucide é uma caixa quadrada que o traço
   preenche quase toda; estas marcas são cheias e mais largas que altas,
   então na mesma medida nominal parecem menores que os ícones vizinhos.
   Os fatores igualam a massa visual, não a caixa. */
const META = 1.35;
const ADS = 1.15;

export function MetaIcone({ size = 24, className }: Props) {
  return (
    <Image
      src="/marca/meta.webp"
      alt="Meta"
      width={256}
      height={172}
      style={{ width: size * META, height: "auto" }}
      className={className}
    />
  );
}

export function GoogleAdsIcone({ size = 24, className }: Props) {
  return (
    <Image
      src="/marca/google-ads.webp"
      alt="Google Ads"
      width={256}
      height={233}
      style={{ width: "auto", height: size * ADS }}
      className={className}
    />
  );
}
