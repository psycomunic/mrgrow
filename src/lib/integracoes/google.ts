/**
 * Google Ads (v18) + Google Analytics 4 (Data API).
 * OAuth 2.0 com refresh token de longa duração.
 */

const OAUTH = "https://oauth2.googleapis.com/token";

export const ESCOPOS_GOOGLE = [
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "openid",
  "email",
];

export function urlAutorizacaoGoogle(estado: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
    response_type: "code",
    scope: ESCOPOS_GOOGLE.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: estado,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function trocarCodigoPorTokenGoogle(codigo: string) {
  const r = await fetch(OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: codigo,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Google OAuth: ${await r.text()}`);
  return (await r.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
}

export async function renovarTokenGoogle(refreshToken: string) {
  const r = await fetch(OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Renovação Google: ${await r.text()}`);
  return (await r.json()) as { access_token: string; expires_in: number };
}

// ── Google Ads ────────────────────────────────────────────────────

const ADS_BASE = "https://googleads.googleapis.com/v18";

function cabecalhosAds(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
    ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
      ? { "login-customer-id": process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "") }
      : {}),
    "Content-Type": "application/json",
  };
}

export async function listarContasGoogleAds(token: string) {
  const r = await fetch(`${ADS_BASE}/customers:listAccessibleCustomers`, {
    headers: cabecalhosAds(token),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Google Ads contas: ${await r.text()}`);
  const json = (await r.json()) as { resourceNames?: string[] };
  return (json.resourceNames ?? []).map((rn) => rn.split("/")[1]);
}

const GAQL_DIARIO = `
  SELECT
    segments.date,
    campaign.id,
    campaign.name,
    campaign.status,
    metrics.cost_micros,
    metrics.impressions,
    metrics.clicks,
    metrics.conversions,
    metrics.conversions_value
  FROM campaign
  WHERE segments.date BETWEEN '{desde}' AND '{ate}'
`;

/** Linha de resultado do GAQL — a API devolve as métricas como string ou número. */
type LinhaGaql = {
  segments?: { date?: string };
  campaign?: { id?: string | number; name?: string; status?: string };
  metrics?: Record<string, string | number | undefined>;
};

export async function buscarRelatorioGoogleAds(
  token: string,
  customerId: string,
  desde: string,
  ate: string,
) {
  const id = customerId.replace(/-/g, "");
  const r = await fetch(`${ADS_BASE}/customers/${id}/googleAds:searchStream`, {
    method: "POST",
    headers: cabecalhosAds(token),
    body: JSON.stringify({ query: GAQL_DIARIO.replace("{desde}", desde).replace("{ate}", ate) }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Google Ads relatório: ${await r.text()}`);

  const blocos = (await r.json()) as Array<{ results?: LinhaGaql[] }>;
  return blocos.flatMap((b) => b.results ?? []).map((linha) => ({
    data: linha.segments?.date ?? "",
    id_campanha: String(linha.campaign?.id ?? ""),
    nome_campanha: linha.campaign?.name ?? "",
    investimento: Number(linha.metrics?.costMicros ?? 0) / 1_000_000,
    impressoes: Number(linha.metrics?.impressions ?? 0),
    cliques: Number(linha.metrics?.clicks ?? 0),
    conversoes: Number(linha.metrics?.conversions ?? 0),
    receita: Number(linha.metrics?.conversionsValue ?? 0),
  }));
}

// ── Google Analytics 4 ────────────────────────────────────────────

export async function buscarRelatorioGA4(
  token: string,
  propriedadeId: string,
  desde: string,
  ate: string,
) {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propriedadeId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: desde, endDate: ate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "conversions" },
          { name: "purchaseRevenue" },
        ],
      }),
      cache: "no-store",
    },
  );
  if (!r.ok) throw new Error(`GA4: ${await r.text()}`);

  type ValorGA4 = { value?: string };
  const json = (await r.json()) as {
    rows?: Array<{ dimensionValues: ValorGA4[]; metricValues: ValorGA4[] }>;
  };
  return (json.rows ?? []).map((linha) => {
    const d = linha.dimensionValues[0].value ?? ""; // YYYYMMDD
    return {
      data: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      sessoes: Number(linha.metricValues[0].value ?? 0),
      usuarios: Number(linha.metricValues[1].value ?? 0),
      conversoes: Number(linha.metricValues[2].value ?? 0),
      receita: Number(linha.metricValues[3].value ?? 0),
    };
  });
}
