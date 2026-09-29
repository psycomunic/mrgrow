import type { MetadataRoute } from "next";
import { MARCA } from "@/lib/marca";

/**
 * Manifesto do aplicativo instalável.
 *
 * É o que faz o Chrome oferecer "Instalar" e, depois de instalado, abrir
 * em janela própria — sem barra de endereço, com ícone no Dock do Mac.
 *
 * `start_url` aponta para o painel, e não para a raiz: quem instala isto
 * abre para trabalhar, e cair na página de vendas da agência a cada
 * abertura seria um passo a mais toda vez. Sem sessão o painel manda
 * para o login, que é o comportamento certo.
 *
 * `id` fixo importa: sem ele o Chrome usa a `start_url` como identidade,
 * e mudá-la um dia faria o navegador tratar como um aplicativo novo,
 * deixando o antigo instalado e órfão.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/painel",
    name: `${MARCA.nome} · Plataforma da agência`,
    short_name: MARCA.nome,
    description:
      "CRM, financeiro, projetos e métricas da agência, num lugar só.",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "pt-BR",
    dir: "ltr",
    /* Combinam com a janela do aplicativo: o `background_color` é o que
       aparece enquanto a página carrega, e o `theme_color` pinta a moldura
       da janela no macOS. Os dois no escuro porque o painel abre escuro. */
    background_color: "#080b12",
    theme_color: "#080b12",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      /* O `maskable` tem margem: o sistema recorta um círculo ou losango
         por cima, e sem a zona segura o recorte come a borda da arte. */
      { src: "/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Recebimentos", url: "/painel/recebimentos" },
      { name: "Financeiro", url: "/painel/financeiro" },
      { name: "CRM", url: "/painel/crm" },
    ],
  };
}
