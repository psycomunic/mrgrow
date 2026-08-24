"use client";

/** Camada única de tracking: dataLayer (GTM/GA4) + Meta Pixel. */

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function idEvento() {
  return `mrg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function rastrear(evento: string, dados: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === "undefined") return;
  const id = eventId ?? idEvento();

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: evento, ...dados, event_id: id });

  if (typeof window.fbq === "function") {
    const padrao = ["Lead", "Contact", "CompleteRegistration", "ViewContent", "InitiateCheckout", "Purchase"];
    if (padrao.includes(evento)) window.fbq("track", evento, dados, { eventID: id });
    else window.fbq("trackCustom", evento, dados, { eventID: id });
  }

  return id;
}

/** Captura e persiste UTMs + click ids na primeira visita (atribuição). */
export function capturarParametros() {
  if (typeof window === "undefined") return {};
  const url = new URL(window.location.href);
  const chaves = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
  const atual: Record<string, string> = {};

  chaves.forEach((k) => {
    const v = url.searchParams.get(k);
    if (v) atual[k] = v;
  });

  try {
    const salvo = JSON.parse(localStorage.getItem("mrg_atribuicao") ?? "{}");
    const mesclado = { ...salvo, ...atual };
    if (Object.keys(atual).length) localStorage.setItem("mrg_atribuicao", JSON.stringify(mesclado));
    return mesclado as Record<string, string>;
  } catch {
    return atual;
  }
}
