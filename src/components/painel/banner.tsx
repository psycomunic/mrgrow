import Image from "next/image";

/**
 * Banner institucional, na faixa mais alta do painel.
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
 * As duas medidas do recorte saíram de conta, não de tentativa:
 *
 * - a altura manda na ampliação, e ampliar demais espreme a largura visível.
 *   Para a manchete caber numa tela de 320px sobrando espaço para o botão de
 *   menu, a altura precisa ficar em 82px ou menos — daí os 80.
 * - o deslocamento de 8% é o que faz o texto começar depois desse botão, que
 *   é `fixed` no canto superior esquerdo e passaria por cima de "Seja".
 */
const IMAGEM = "/banner-painel.png";
const ALTERNATIVO = "Seja bem-vindo à MR Grow — estratégia, conteúdo e tráfego";

export function Banner() {
  return (
    <div className="relative h-20 overflow-hidden sm:h-33 lg:rounded-t-xl xl:aspect-1447/193 xl:h-auto">
      <Image
        src={IMAGEM}
        alt={ALTERNATIVO}
        fill
        sizes="(max-width: 80rem) 100vw, 1280px"
        className="object-cover object-[8%_center] xl:object-center"
        priority
      />
    </div>
  );
}
