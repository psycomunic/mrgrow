import Image from "next/image";

/**
 * Banner institucional, no lugar do título da página.
 *
 * Para trocar a arte, basta substituir o arquivo em `public/` e ajustar
 * `IMAGEM` e a proporção da classe `sm:aspect-…` — nada mais no componente
 * depende da peça atual.
 *
 * Ele vive dentro da barra do cabeçalho, então a altura é a da própria barra
 * e é ela que manda: a largura sai da proporção da arte (1447×193), e aí a
 * peça aparece inteira, sem recorte nenhum, à esquerda da busca.
 *
 * O `self-start` do `sm` existe porque, enquanto a barra empilha, o item de
 * flex estica na largura por padrão: a arte ia a 740px de largura por 80px de
 * altura e perdia uma tira em cima e embaixo, cortando o logo.
 *
 * No celular a barra empilha e sobra pouca largura — na proporção original a
 * arte viraria uma tira de 37px. Ali ela ganha altura fixa e é recortada pela
 * esquerda, que é onde está o texto (medido nos pixels da peça: de 15% a 56%
 * da largura). Quem sai de cena é a pessoa à direita, que é o que a arte tem
 * de mais dispensável.
 */
const IMAGEM = "/banner-painel.png";
const ALTERNATIVO = "Seja bem-vindo à MR Grow — estratégia, conteúdo e tráfego";

export function Banner() {
  return (
    <div className="relative h-14 w-full overflow-hidden rounded-md sm:aspect-1447/193 sm:h-20 sm:w-auto sm:self-start lg:self-center">
      <Image
        src={IMAGEM}
        alt={ALTERNATIVO}
        fill
        sizes="(max-width: 40rem) 100vw, 600px"
        className="object-cover object-[10%_center] sm:object-center"
        priority
      />
    </div>
  );
}
