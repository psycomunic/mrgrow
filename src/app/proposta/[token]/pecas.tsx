import type { CSSProperties, ReactNode } from "react";
import { ordem } from "./slide";

/**
 * As peças animadas da proposta.
 *
 * Quase tudo aqui é CSS puro, sem JavaScript: as animações rodam no
 * compositor do navegador, não travam o deslizar e funcionam mesmo se o
 * script não carregar. Cada peça só anima quando a tela dela está ativa
 * (`section[data-ativo]` no CSS); fora da tela fica pausada.
 */

/* ── Capa: o outdoor ────────────────────────────────────────────── */

/**
 * O outdoor da capa, com o nome do cliente aplicado na placa.
 *
 * A foto tem a placa em branco. O nome é texto de verdade, posicionado
 * por porcentagem sobre a foto, e por isso a foto e a placa precisam
 * escalar juntas: as duas vivem numa caixa 16:9 que cobre a tela como um
 * `object-fit: cover` faria. As coordenadas da placa foram medidas na
 * própria foto.
 *
 * Os refletores acendem um a um quando a tela abre, com uma piscada de
 * lâmpada de vapor — e só depois o nome aparece.
 */
export function Outdoor({
  src,
  cliente,
  arroba,
}: {
  src: string;
  cliente: string;
  arroba: string;
}) {
  const refletores = [9.4, 23.6, 37.3, 50.5, 63.6, 76.9, 90.9];
  return (
    <div className="pp-outdoor">
      <div className="pp-outdoor-caixa">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" decoding="async" />

        <div className="pp-outdoor-placa">
          <div className="pp-outdoor-luzes" aria-hidden>
            {refletores.map((x, i) => (
              <span
                key={x}
                style={{ left: `${x}%`, "--i": i } as CSSProperties}
              />
            ))}
          </div>
          <span aria-hidden className="pp-outdoor-lampada">
            <svg viewBox="0 0 24 34" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.2 0 11.7c0 4.1 2.1 7.2 4.3 9.6 1.4 1.5 2.2 3.1 2.4 4.7h10.6c.2-1.6 1-3.2 2.4-4.7 2.2-2.4 4.3-5.5 4.3-9.6C24 5.2 18.6 0 12 0Z" />
            </svg>
          </span>
          <span aria-hidden className="pp-outdoor-arroba">
            {arroba}
          </span>
          <div className="pp-outdoor-texto">
            <p>Proposta comercial</p>
            <h1 style={{ "--letras": cliente.length } as CSSProperties}>
              {cliente}
            </h1>
          </div>
          {/* O cordão de lâmpadas da moldura, correndo. */}
          <span aria-hidden className="pp-outdoor-cordao" />
          <span aria-hidden className="pp-outdoor-apagado" />
        </div>

        {/* Um carro passa na pista de tempos em tempos. */}
        <span aria-hidden className="pp-outdoor-farol" />
      </div>
    </div>
  );
}

/* ── DNA: a gema ────────────────────────────────────────────────── */

/**
 * A pedra lapidada do "DNA em números", desenhada em SVG.
 *
 * Em vetor, e não foto, porque precisa brilhar: um reflexo atravessa as
 * facetas de tempos em tempos e a pedra gira devagar no próprio eixo. As
 * facetas são polígonos com degradês diferentes, o que dá o volume.
 */
export function Gema() {
  return (
    <div className="pp-gema" aria-hidden>
      <div className="pp-gema-giro">
        <svg viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gm-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#bfe9ff" />
              <stop offset="0.45" stopColor="#3aa8ff" />
              <stop offset="1" stopColor="#0b3fd1" />
            </linearGradient>
            <linearGradient id="gm-b" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7fd3ff" />
              <stop offset="1" stopColor="#0a2fa8" />
            </linearGradient>
            <linearGradient id="gm-c" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#061f7a" />
              <stop offset="1" stopColor="#2b8cff" />
            </linearGradient>
            <linearGradient id="gm-d" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0" stopColor="#e8f8ff" />
              <stop offset="1" stopColor="#1b6dff" />
            </linearGradient>
            <linearGradient id="gm-brilho" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="gm-corte">
              <polygon points="100,4 196,100 100,196 4,100" />
            </clipPath>
          </defs>

          {/* Coroa: quatro faces entre a borda e a mesa. */}
          <polygon points="100,4 196,100 158,100 100,42" fill="url(#gm-a)" />
          <polygon points="196,100 100,196 100,158 158,100" fill="url(#gm-c)" />
          <polygon points="100,196 4,100 42,100 100,158" fill="url(#gm-b)" />
          <polygon points="4,100 100,4 100,42 42,100" fill="url(#gm-d)" />
          {/* Mesa, em oito facetas estrela. */}
          <polygon points="100,42 158,100 100,100" fill="#5cc2ff" />
          <polygon points="158,100 100,158 100,100" fill="#1650e6" />
          <polygon points="100,158 42,100 100,100" fill="#0d3cc4" />
          <polygon points="42,100 100,42 100,100" fill="#9fe0ff" />
          <polygon points="100,42 129,71 100,100 71,71" fill="#d6f3ff" opacity="0.45" />
          <polygon points="100,158 129,129 100,100 71,129" fill="#062a99" opacity="0.5" />
          <g stroke="#e9f8ff" strokeOpacity="0.55" strokeWidth="0.8" fill="none">
            <polygon points="100,4 196,100 100,196 4,100" />
            <polygon points="100,42 158,100 100,158 42,100" />
            <path d="M100 4V42M196 100H158M100 196V158M4 100H42M100 42 100 158M42 100H158" />
          </g>
          <g clipPath="url(#gm-corte)">
            <rect className="pp-gema-reflexo" x="-120" y="-20" width="70" height="240" fill="url(#gm-brilho)" transform="rotate(20 100 100)" />
          </g>
        </svg>
      </div>
      <span className="pp-gema-sombra" />
      <span className="pp-gema-faisca" style={{ left: "18%", top: "20%" }} />
      <span className="pp-gema-faisca" style={{ left: "78%", top: "34%", animationDelay: "-1.4s" }} />
      <span className="pp-gema-faisca" style={{ left: "62%", top: "82%", animationDelay: "-2.6s" }} />
    </div>
  );
}

/* ── Ícones das plataformas ─────────────────────────────────────── */

export function IconeFacebook() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="pp-icone">
      <defs>
        <radialGradient id="ic-fb" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5aa2ff" />
          <stop offset="1" stopColor="#0a55d6" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#ic-fb)" />
      <path
        fill="#fff"
        d="M26.6 38V26.2h3.9l.6-4.6h-4.5v-2.9c0-1.3.4-2.2 2.3-2.2h2.4v-4.1a32 32 0 0 0-3.5-.2c-3.5 0-5.9 2.1-5.9 6v3.4h-3.9v4.6h3.9V38h4.7Z"
      />
    </svg>
  );
}

export function IconeInstagram() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="pp-icone">
      <defs>
        <radialGradient id="ic-ig" cx="0.3" cy="1.05" r="1.25">
          <stop offset="0" stopColor="#ffd776" />
          <stop offset="0.3" stopColor="#f7783c" />
          <stop offset="0.6" stopColor="#e1306c" />
          <stop offset="1" stopColor="#7a35d0" />
        </radialGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#ic-ig)" />
      <rect x="12" y="12" width="24" height="24" rx="7" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="24" cy="24" r="5.6" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="31.4" cy="16.6" r="1.8" fill="#fff" />
    </svg>
  );
}

export function IconeGoogle() {
  return (
    <svg viewBox="-3 -3 30 30" aria-hidden className="pp-icone">
      <circle cx="12" cy="12" r="14.5" fill="#fff" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

export function IconeWhatsApp() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="pp-icone">
      <defs>
        <radialGradient id="ic-wa" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#7cf29c" />
          <stop offset="1" stopColor="#1fae4b" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#ic-wa)" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
        d="M14.2 34.6l1.5-5.2a11 11 0 1 1 4 3.8l-5.5 1.4Z"
      />
      <path
        fill="#fff"
        d="M20.4 18.1c.3-.6.6-.6.9-.6h.7c.2 0 .5 0 .7.6l1 2.4c.1.3 0 .6-.1.8l-.6.8c-.2.2-.2.4 0 .7.5.9 1.2 1.7 2 2.3.6.5 1.3.8 1.7 1 .3.1.5.1.7-.1l.9-1.1c.2-.3.5-.3.8-.2l2.3 1.1c.3.2.5.3.5.5 0 .4-.1 1.3-.6 1.8-.5.6-1.5 1.2-2.6 1.1-1-.1-3.6-.9-5.6-2.9-1.9-1.8-2.9-3.7-3.1-4.6-.3-1.4.2-2.6.7-3.6Z"
      />
    </svg>
  );
}

/* ── Ponto B: a conversa no WhatsApp ────────────────────────────── */

/**
 * Um atendimento que vira venda, em loop. As mensagens entram em
 * sequência pela própria animação CSS, com o "digitando…" entre elas.
 */
export function ConversaWhats({ marca }: { marca: string }) {
  return (
    <div className="pp-chat" aria-hidden>
      <div className="pp-chat-topo">
        <span className="pp-chat-avatar">{marca.slice(0, 1)}</span>
        <span>
          <b>{marca}</b>
          <i>online</i>
        </span>
      </div>
      <div className="pp-chat-corpo">
        <p className="pp-msg" data-lado="cliente" style={ordem(0)}>
          Oi! Vi o anúncio de vocês. Ainda tem horário essa semana?
        </p>
        <p className="pp-digitando" style={ordem(1)}>
          <span />
          <span />
          <span />
        </p>
        <p className="pp-msg" data-lado="loja" style={ordem(2)}>
          Tem sim! Quinta às 15h ou sexta às 10h. Qual fica melhor?
        </p>
        <p className="pp-msg" data-lado="cliente" style={ordem(3)}>
          Quinta às 15h, pode confirmar.
        </p>
        <p className="pp-msg" data-lado="loja" style={ordem(4)}>
          Confirmado! Te mando o endereço por aqui.
        </p>
        <p className="pp-chat-selo" style={ordem(5)}>
          Venda fechada
        </p>
      </div>
    </div>
  );
}

/* ── Ponto B: a página de vendas ────────────────────────────────── */

export function PaginaVendas() {
  return (
    <div className="pp-site" aria-hidden>
      <div className="pp-site-barra">
        <span />
        <span />
        <span />
        <i>suamarca.com.br</i>
      </div>
      <div className="pp-site-corpo">
        <div className="pp-site-hero">
          <span className="pp-esq" style={{ width: "70%" }} />
          <span className="pp-esq" style={{ width: "52%" }} />
          <span className="pp-esq pp-esq-fino" style={{ width: "80%" }} />
          <span className="pp-site-cta">Quero saber mais</span>
        </div>
        <div className="pp-site-form">
          <span className="pp-site-campo">
            <i className="pp-site-digita">Mariana Souza</i>
          </span>
          <span className="pp-site-campo">
            <i className="pp-site-digita" style={{ animationDelay: "0.9s" }}>
              (47) 99999-0000
            </i>
          </span>
          <span className="pp-site-enviar">Enviar</span>
        </div>
      </div>
      <div className="pp-site-toast">
        <b>Novo lead</b>
        <span>Mariana S. pediu contato</span>
      </div>
      <div className="pp-site-contador">
        <span>leads hoje</span>
        <b className="pp-site-numero" />
      </div>
    </div>
  );
}

/* ── Segmentação ────────────────────────────────────────────────── */

export function GradeHorario() {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return (
    <div className="pp-grade-h" aria-hidden>
      <div className="pp-grade-h-horas">
        {["0h", "3h", "6h", "9h", "12h", "15h", "18h", "21h"].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {dias.map((d, l) => (
        <div key={d} className="pp-grade-h-linha">
          <span>{d}</span>
          {Array.from({ length: 8 }, (_, c) => (
            <i
              key={c}
              data-on={c >= 6 || (c === 4 && l > 4) ? "" : undefined}
              style={{ "--i": l * 0.6 + c * 0.25 } as CSSProperties}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MapaRaio() {
  return (
    <div className="pp-mapa" aria-hidden>
      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
        <rect width="300" height="200" fill="#0b1630" />
        <path
          d="M0 140 C40 120 60 150 95 128 S150 70 190 92 S250 60 300 74 V200 H0Z"
          fill="#12234a"
        />
        <g stroke="#22407e" strokeWidth="1.2" fill="none">
          <path d="M0 40 L300 120" />
          <path d="M60 0 L140 200" />
          <path d="M0 100 C80 90 160 130 300 30" />
          <path d="M220 0 L190 200" />
          <path d="M0 170 L300 160" />
        </g>
        <g stroke="#1a3266" strokeWidth="0.6" fill="none">
          <path d="M30 0 L90 200 M120 0 L60 200 M260 0 L300 90 M0 70 L300 70" />
        </g>
      </svg>
      <span className="pp-mapa-raio" />
      <span className="pp-mapa-raio" style={{ animationDelay: "-1.3s" }} />
      <span className="pp-mapa-pino" />
      <span className="pp-mapa-rotulo">raio de 10 km</span>
    </div>
  );
}

export function Interesses() {
  const chips = [
    "Compradores engajados",
    "Interessados no seu nicho",
    "Moradores da sua região",
    "Visitaram seu site",
    "Parecidos com seus clientes",
  ];
  return (
    <div className="pp-interesses" aria-hidden>
      <span className="pp-interesses-busca">
        <i>Buscar interesses e comportamentos</i>
      </span>
      <div className="pp-interesses-chips">
        {chips.map((c, i) => (
          <span key={c} style={ordem(i)}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Esteiras que correm ────────────────────────────────────────── */

/** Uma faixa infinita: o conteúdo é duplicado e corre metade do trilho. */
export function Esteira({
  children,
  sentido = "esquerda",
  segundos = 40,
  className = "",
}: {
  children: ReactNode;
  sentido?: "esquerda" | "direita";
  segundos?: number;
  className?: string;
}) {
  return (
    <div className={`pp-esteira ${className}`} aria-hidden>
      <div
        className="pp-esteira-trilho"
        data-sentido={sentido}
        style={{ animationDuration: `${segundos}s` }}
      >
        <div className="pp-esteira-grupo">{children}</div>
        <div className="pp-esteira-grupo">{children}</div>
      </div>
    </div>
  );
}

/** A palavra "Assine" escrita à mão, revelada como se fosse caneta. */
export function Assinatura() {
  return (
    <span className="pp-assina" aria-hidden>
      Assine
    </span>
  );
}
