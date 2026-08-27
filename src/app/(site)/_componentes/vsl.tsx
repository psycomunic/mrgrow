"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Revelar } from "./revelar";

/* ══════════════════════════════════════════════════════════════
   O VÍDEO.

   `arquivo` aponta para dentro de public/. Trocar o vídeo é trocar o
   arquivo e ajustar `duracao`.

   Para hospedar fora, preencha `youtube` (só o id, o trecho depois de
   "v=") ou `vimeo` (só o número) e deixe `arquivo` vazio. Aí `capa`
   vira obrigatória: não dá para ler o primeiro quadro de um vídeo que
   está no servidor de outra pessoa.

   `capa` vazia usa o primeiro quadro do próprio arquivo, então ela
   nunca envelhece fora de sincronia com o conteúdo.

   `duracao` é honestidade sobre o compromisso pedido: quem sabe que
   são 55 segundos aperta play mais do que quem não faz ideia.
   ══════════════════════════════════════════════════════════════ */
const VIDEO = {
  arquivo: "/vsl.mp4",
  youtube: "",
  vimeo: "",
  capa: "",
  duracao: "55s",
  /* Segundo do vídeo usado como capa. 0 pega o primeiro quadro, que
     costuma ser transição ou borrão: aqui era a porta do elevador.
     Aos 9s o Mateus está enquadrado e olhando para a câmera. */
  capaSegundo: 9,
};

function fonteDoQuadro() {
  if (VIDEO.youtube) {
    // nocookie: não planta rastreador de terceiro em quem só assistiu.
    return `https://www.youtube-nocookie.com/embed/${VIDEO.youtube}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (VIDEO.vimeo) return `https://player.vimeo.com/video/${VIDEO.vimeo}?autoplay=1&title=0&byline=0`;
  return "";
}

export function Vsl() {
  const video = useRef<HTMLVideoElement>(null);
  const [tocando, setTocando] = useState(false);

  const temVideo = Boolean(VIDEO.arquivo || VIDEO.youtube || VIDEO.vimeo);

  // Sem vídeo configurado o público não vê nada; você continua vendo.
  if (!temVideo && process.env.NODE_ENV === "production") return null;

  const quadro = fonteDoQuadro();

  function assistir() {
    setTocando(true);
    video.current?.play();
  }

  return (
    <Revelar como="section" id="video" className="vsl">
      <div className="area">
        <div className="vsl__cabeca">
          <span className="chapeu">
            <i />
            Comece por aqui
          </span>
          <h2>Veja a operação por dentro</h2>
          <p className="vsl__apoio">
            Não é apresentação institucional genérica. Mostro como a estratégia, o conteúdo e a
            mídia se encaixam, e o que você recebe todo mês. Se no fim não fizer sentido para o
            seu momento, você economizou uma reunião.
          </p>
        </div>

        {/* Em repouso o palco é largo, que é o que preenche o desktop. Ao
            dar play ele vira retrato, que é a proporção real do vídeo, e
            aí ninguém assiste com a imagem cortada. No celular já nasce
            retrato: lá não existe largura sobrando para preencher. */}
        <div className={`vsl__palco vidro${tocando ? " vsl__palco--retrato" : ""}`}>
          {VIDEO.arquivo ? (
            <>
              {/* O fragmento `#t=` faz o navegador pintar aquele segundo como
                  capa, sem baixar o vídeo inteiro nem exigir um jpg à parte
                  que poderia envelhecer fora de sincronia com o conteúdo. */}
              {/* Cópia desfocada preenchendo a moldura larga. Sem ela, ou
                  o retrato aparece ampliado 2,4x e decepado, ou sobram duas
                  tarjas pretas. É o mesmo tratamento que o Reels e o Shorts
                  usam para vídeo vertical em tela larga. Mesmo endereço do
                  vídeo principal, então o navegador reaproveita o cache e
                  não há segunda transferência. */}
              {!tocando && (
                <video
                  className="vsl__fundo"
                  src={`${VIDEO.arquivo}#t=${VIDEO.capaSegundo}`}
                  preload="metadata"
                  playsInline
                  muted
                  tabIndex={-1}
                  aria-hidden
                />
              )}
              <video
                ref={video}
                className="vsl__midia"
                src={`${VIDEO.arquivo}#t=${VIDEO.capaSegundo}`}
                preload="metadata"
                playsInline
                controls={tocando}
                onPlay={() => setTocando(true)}
                onEnded={() => setTocando(false)}
              />
              {!tocando && (
                <button
                  type="button"
                  className="vsl__capa"
                  onClick={assistir}
                  aria-label="Assistir ao vídeo"
                >
                  <span className="vsl__veu" aria-hidden />
                  <span className="vsl__play" aria-hidden>
                    <Play />
                  </span>
                  <span className="vsl__selo" aria-hidden>
                    {VIDEO.duracao}
                  </span>
                </button>
              )}
            </>
          ) : tocando && quadro ? (
            <iframe
              className="vsl__midia"
              src={quadro}
              title="Vídeo institucional da MR Grow"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className="vsl__capa"
              onClick={() => setTocando(true)}
              disabled={!temVideo}
              aria-label={temVideo ? "Assistir ao vídeo" : "Vídeo ainda não publicado"}
            >
              {VIDEO.capa && (
                <Image
                  src={VIDEO.capa}
                  alt=""
                  aria-hidden
                  fill
                  loading="eager"
                  sizes="(max-width: 60rem) 100vw, 23rem"
                  className="vsl__quadro"
                />
              )}
              <span className="vsl__veu" aria-hidden />
              <span className="vsl__play" aria-hidden>
                <Play />
              </span>
              <span className="vsl__selo" aria-hidden>
                {temVideo ? VIDEO.duracao : "sem vídeo"}
              </span>
            </button>
          )}
        </div>

        {/* Todo VSL existe pelo que vem depois do play. Se a pessoa
            assistiu e se convenceu, o próximo passo não pode estar a uma
            rolagem de distância. */}
        <div className="vsl__fecho">
          <a href="#diagnostico" className="vsl__cta">
            Quero o diagnóstico gratuito
          </a>
          <p>Resposta em 24 horas úteis. Sem compromisso e sem script de vendas.</p>
        </div>
      </div>
    </Revelar>
  );
}
