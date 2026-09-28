import Image from "next/image";

/**
 * Banner institucional do topo do painel.
 *
 * Para trocar a arte, basta substituir o arquivo em `public/` e ajustar
 * `IMAGEM` e a proporção da classe `xl:aspect-…` — nada mais no componente
 * depende da peça atual.
 *
 * A arte é larguíssima (1447×193, quase 7,5:1) e já traz o texto embutido. Na
 * largura cheia do desktop ela aparece inteira, na proporção original. Abaixo
 * disso, manter a proporção encolheria o banner a uma tira de 50px e a
 * manchete viraria um borrão — então em tela estreita o banner ganha altura
 * fixa e a arte é recortada. O recorte puxa para a esquerda porque é lá que
 * está o texto (medido: de 15% a 56% da largura); quem sai de cena é a pessoa
 * à direita, que é o que a peça tem de mais dispensável.
 *
 * A altura do recorte é baixa de propósito: quanto mais alto o quadro, mais
 * a arte é ampliada e menos largura dela cabe. A 104px a manchete já não
 * cabia inteira numa tela de 320px — saía "Seja Bem-Vin…".
 */
const IMAGEM = "/banner-painel.png";
const ALTERNATIVO = "Seja bem-vindo à MR Grow — estratégia, conteúdo e tráfego";

export function Banner() {
  return (
    <div className="relative h-22 overflow-hidden rounded-lg sm:h-33 xl:h-auto xl:aspect-1447/193">
      <Image
        src={IMAGEM}
        alt={ALTERNATIVO}
        fill
        sizes="(max-width: 80rem) 100vw, 1280px"
        className="object-cover object-[24%_center] xl:object-center"
        priority
      />
    </div>
  );
}
