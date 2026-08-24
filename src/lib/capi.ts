import { sha256 } from "@/lib/cripto";

/**
 * Conversions API da Meta (server-side).
 * Enviado em paralelo ao Pixel, com o mesmo event_id — a Meta deduplica.
 */
export async function enviarEventoCapi(params: {
  evento: string;
  eventId?: string;
  email?: string;
  telefone?: string;
  ip?: string;
  userAgent?: string;
  urlOrigem?: string;
  fbclid?: string;
  valor?: number;
  moeda?: string;
}) {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixel || !token) return { ignorado: true };

  const versao = process.env.META_API_VERSION ?? "v21.0";
  const telefoneLimpo = params.telefone?.replace(/\D/g, "");

  const corpo = {
    data: [
      {
        event_name: params.evento,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.urlOrigem,
        action_source: "website",
        user_data: {
          ...(params.email ? { em: [sha256(params.email)] } : {}),
          ...(telefoneLimpo ? { ph: [sha256(`55${telefoneLimpo}`.slice(-13))] } : {}),
          ...(params.ip ? { client_ip_address: params.ip } : {}),
          ...(params.userAgent ? { client_user_agent: params.userAgent } : {}),
          ...(params.fbclid ? { fbc: `fb.1.${Date.now()}.${params.fbclid}` } : {}),
        },
        ...(params.valor
          ? { custom_data: { value: params.valor, currency: params.moeda ?? "BRL" } }
          : {}),
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const r = await fetch(`https://graph.facebook.com/${versao}/${pixel}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    return { ok: r.ok };
  } catch (erro) {
    console.error("[capi] falha", erro);
    return { ok: false };
  }
}
