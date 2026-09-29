/**
 * Service worker mínimo.
 *
 * Existe por dois motivos, e só por eles. O primeiro: o Chrome não
 * oferece "Instalar" sem um service worker registrado que responda a
 * `fetch`. O segundo: instalado, o aplicativo precisa de algo para
 * mostrar quando o Mac está sem rede — sem isso a janela abre no dinossauro
 * do Chrome, que não parece a plataforma da agência.
 *
 * Ele não guarda página nenhuma em cache de propósito. Este painel recebe
 * várias publicações por dia, e cache de HTML faz a pessoa continuar vendo
 * a versão de ontem sem entender por quê — inclusive depois de uma correção
 * urgente. Os números vêm do banco a cada carregamento; servir qualquer um
 * deles de cache seria pior que a página não abrir.
 */

const CACHE = "mrgrow-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)));
  // Assume o controle na primeira visita, sem esperar a aba fechar.
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;

  /* Só navegação. Requisição de dado que falha precisa falhar de verdade,
     para a tela mostrar o próprio aviso em vez de uma página de offline no
     meio do painel. */
  if (req.mode !== "navigate") return;

  evento.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
});
