"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* Border Beam Panel — do Motiq (https://motiq.dev/components/border-beam-panel).
   Licença MIT. Sem dependências de runtime.

   Desvios do original, todos sem efeito no comportamento:
   · usa o `cn` de @/lib/utils em vez de redeclarar clsx + tailwind-merge;
   · media queries via useSyncExternalStore, e o ref de velocidades escrito
     em efeito — as regras do React 19 deste projeto barram setState síncrono
     dentro de efeito e escrita de ref durante o render. */

/* -------------------------------------------------------------------------- */
/* Tokens do Motiq                                                            */
/* -------------------------------------------------------------------------- */
/* Renderizados junto do componente, numa camada baixa, para que um
   `:root { --motiq-*: … }` seu sempre vença. */
const MOTIQ_TOKENS = "@layer motiq{:root{--motiq-accent:#315fea;--motiq-accent-text:#244fd1;--motiq-bg:#f7f9fc;--motiq-border:#dce4ef;--motiq-border-strong:#c5d1e1;--motiq-fg:#101828;--motiq-fg-secondary:#344054;--motiq-muted:#667085;--motiq-secondary-accent:#009fb3;--motiq-signature:#e9564a;--motiq-surface:#ffffff;--motiq-surface-2:#f8fafd}}@layer motiq{.dark,[data-theme=\"dark\"]{--motiq-accent:#4f7cff;--motiq-accent-text:#7f9fff;--motiq-bg:#080c14;--motiq-border:#263449;--motiq-border-strong:#354863;--motiq-fg:#f8fafc;--motiq-fg-secondary:#cbd5e1;--motiq-muted:#9caabd;--motiq-secondary-accent:#22c7d9;--motiq-signature:#ff6b5e;--motiq-surface:#111827;--motiq-surface-2:#192337}}";

/* ---- primitivas de movimento (inlined de @motiq/primitives) ---- */

/**
 * `prefers-reduced-motion` seguro em SSR. Lê de forma síncrona no cliente para
 * que quem pediu movimento reduzido não veja um só quadro de animação; o valor
 * nunca vai para o markup, então não há risco de divergência na hidratação.
 */
function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (aoMudar) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", aoMudar);
      return () => mq.removeEventListener("change", aoMudar);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false, // No servidor, assume movimento normal.
  );
}

/**
 * Diz se vale animar o elemento — ou seja, se está na tela E a aba está
 * visível. Serve para parar trabalho por quadro quando o componente sai de
 * vista ou a aba vai para segundo plano.
 */
function useVisibilityPause<T extends Element>(
  ref: React.RefObject<T | null>,
  { threshold = 0.1 }: { threshold?: number } = {},
): boolean {
  const [onScreen, setOnScreen] = React.useState(true);
  const tabVisible = React.useSyncExternalStore(
    (aoMudar) => {
      document.addEventListener("visibilitychange", aoMudar);
      return () => document.removeEventListener("visibilitychange", aoMudar);
    },
    () => document.visibilityState !== "hidden",
    () => true,
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  return onScreen && tabVisible;
}

/* -------------------------------------------------------------------------- */
/* Tipos                                                                      */
/* -------------------------------------------------------------------------- */

export interface BorderBeamPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Conteúdo do painel — semântica e layout são inteiramente seus. */
  children?: React.ReactNode;
  /** Um cometa, ou dois opostos a 180°. */
  beams?: 1 | 2;
  /** Cores dos cometas. A segunda cai no coral de assinatura por padrão. */
  colors?: [string, string?];
  /** Espessura do anel em px. */
  thickness?: number;
  /** Velocidade angular em repouso, em graus/s (~8,5s por volta a 42). */
  idleSpeed?: number;
  /** Velocidade angular no hover/foco — as molas aceleram até ela. */
  hoverSpeed?: number;
  /** Cópia borrada do anel atrás do painel, lida como luz projetada. */
  glow?: boolean;
  /** Raio dos cantos em px. */
  radius?: number;
  /** Mola de velocidade — a VELOCIDADE é que é elástica, então os cometas
      desaceleram por inércia em vez de cortar seco. */
  spring?: { stiffness?: number; damping?: number };
  /** Ângulo inicial determinístico (estável em SSR; sem Math.random). */
  seed?: number;
  /** Congela o laço enquanto fora da tela ou com a aba escondida. */
  pauseWhenHidden?: boolean;
  /** Força o estado estático, sem movimento, independente da preferência do sistema. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Física + gradiente                                                         */
/* -------------------------------------------------------------------------- */

/** Mola por delta-time feita à mão — mantém o componente sem dependências. */
class Spring {
  x: number;
  v = 0;
  target: number;
  k: number;
  d: number;
  constructor(value: number, k: number, d: number) {
    this.x = value;
    this.target = value;
    this.k = k;
    this.d = d;
  }
  step(dt: number): number {
    const a = this.k * (this.target - this.x) - this.d * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Ângulo parado sob movimento reduzido — os dois cometas ficam em bordas visíveis. */
const PARKED_ANGLE = 40;

/**
 * Um cometa: cauda de ~45° suavizando até uma cabeça brilhante de 4°. A ponta
 * usa 4% da cor do cometa em vez de `transparent`, porque `transparent` é
 * rgba(0,0,0,0) e uma rampa cônica passando por ele acinzenta visivelmente.
 */
function comet(
  tail: string,
  head: string,
  tip: string,
  midAlpha: number,
  start: number,
): string {
  return [
    `color-mix(in srgb, ${tail} 4%, transparent) ${start + 18}deg`,
    `color-mix(in srgb, ${tail} ${midAlpha}%, transparent) ${start + 46}deg`,
    `${head} ${start + 56}deg`,
    `${tip} ${start + 60}deg`,
    `transparent ${start + 63}deg`,
  ].join(", ");
}

function ringGradient(beams: 1 | 2, colors: [string, string?] | undefined): string {
  const tail0 = colors?.[0] ?? "var(--motiq-accent, #4f7cff)";
  // O cometa padrão vai de azul a ciano ao longo do corpo; cor customizada fica ela mesma.
  const head0 = colors?.[0] ?? "var(--motiq-secondary-accent, #22c7d9)";
  const stops = [
    "transparent 0deg",
    comet(tail0, head0, `color-mix(in srgb, ${head0} 22%, #ffffff)`, 55, 0),
  ];
  // O único momento coral da superfície — a cabeça do segundo cometa.
  if (beams === 2) {
    const c1 = colors?.[1] ?? "var(--motiq-signature, #ff6b5e)";
    stops.push(
      "transparent 198deg",
      comet(c1, c1, `color-mix(in srgb, ${c1} 26%, #ffffff)`, 50, 198),
    );
  }
  stops.push("transparent 360deg");
  return `conic-gradient(from var(--mk-beam-a, 0deg), ${stops.join(", ")})`;
}

/* -------------------------------------------------------------------------- */
/* Componente                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * BorderBeamPanel — cometas gêmeos orbitando um anel de borda de 2px. O anel é
 * um gradiente cônico girando, recortado por uma máscara ALPHA de duas camadas
 * (`mask-composite: exclude`); máscaras de luminância em SVG foram evitadas de
 * propósito porque falham silenciosamente no Chromium. A VELOCIDADE angular é
 * que tem mola (k=30, d=11) rumo a 240°/s no hover e de volta a 42°/s ao sair,
 * então os feixes aceleram e desaceleram por inércia. Só uma custom property
 * muda por quadro — o conteúdo do painel nunca repinta.
 */
function BorderBeamPanelBase({
  children,
  beams = 2,
  colors,
  thickness = 2,
  idleSpeed = 42,
  hoverSpeed = 240,
  glow = true,
  radius = 16,
  spring,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: BorderBeamPanelProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-beam-${uid}`;
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const systemReduced = useReducedMotion();
  const staticMode = reducedMotion === true || systemReduced;
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const stiffness = spring?.stiffness ?? 30;
  const damping = spring?.damping ?? 11;

  // Ângulo inicial determinístico — uma fase da volta, nunca Math.random.
  const startAngle = React.useMemo(() => (((seed * 137.508) % 360) + 360) % 360, [seed]);

  const speedRef = React.useRef(new Spring(idleSpeed, stiffness, damping));
  const angleRef = React.useRef(startAngle);
  const liveRef = React.useRef({ idleSpeed, hoverSpeed });

  React.useEffect(() => {
    liveRef.current = { idleSpeed, hoverSpeed };
  }, [idleSpeed, hoverSpeed]);

  React.useEffect(() => {
    speedRef.current.k = stiffness;
    speedRef.current.d = damping;
  }, [stiffness, damping]);

  const paint = React.useCallback((angle: number) => {
    rootRef.current?.style.setProperty(
      "--mk-beam-a",
      `${(((angle % 360) + 360) % 360).toFixed(2)}deg`,
    );
  }, []);

  React.useEffect(() => {
    if (!animate) return;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      if (!last) last = now;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      angleRef.current += speedRef.current.step(dt) * dt;
      paint(angleRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, paint]);

  React.useEffect(() => {
    if (!staticMode) return;
    angleRef.current = PARKED_ANGLE;
    speedRef.current.x = speedRef.current.target = liveRef.current.idleSpeed;
    speedRef.current.v = 0;
    paint(PARKED_ANGLE);
  }, [staticMode, paint]);

  const surge = React.useCallback(() => {
    speedRef.current.target = liveRef.current.hoverSpeed;
  }, []);
  const settle = React.useCallback(() => {
    speedRef.current.target = liveRef.current.idleSpeed;
  }, []);

  const gradient = React.useMemo(() => ringGradient(beams, colors), [beams, colors]);

  const css = `
.${cls} .mk-beam-ring, .${cls} .mk-beam-glow {
  position: absolute;
  inset: -1px;
  border-radius: ${radius}px;
  pointer-events: none;
  background: ${gradient};
}
.${cls} .mk-beam-ring {
  padding: ${Math.max(1, thickness)}px;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
.${cls} .mk-beam-glow { filter: blur(14px); opacity: 0.35; z-index: -1; }
@media (forced-colors: active) {
  .${cls} .mk-beam-ring, .${cls} .mk-beam-glow { display: none; }
  .${cls} { border-color: CanvasText; }
}`.trim();

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      onPointerEnter={surge}
      onPointerLeave={settle}
      onFocus={surge}
      onBlur={settle}
      className={cn(
        "relative w-full border border-[var(--motiq-border,#263449)] bg-[var(--motiq-surface,#111827)] p-7",
        cls,
        className,
      )}
      style={{
        borderRadius: `${radius}px`,
        isolation: "isolate",
        ["--mk-beam-a" as string]: `${startAngle.toFixed(2)}deg`,
        ...style,
      }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {glow ? <div aria-hidden="true" className="mk-beam-glow" /> : null}
      <div aria-hidden="true" className="mk-beam-ring" />
      {children}
    </div>
  );
}

export function BorderBeamPanel(props: BorderBeamPanelProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MOTIQ_TOKENS }} />
      <BorderBeamPanelBase {...props} />
    </>
  );
}

export default BorderBeamPanel;
