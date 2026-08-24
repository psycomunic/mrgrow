import { cifrar, decifrar } from "@/lib/cripto";

const VERSAO = process.env.META_API_VERSION ?? "v21.0";
const BASE = `https://graph.facebook.com/${VERSAO}`;

export const ESCOPOS_META = [
  "ads_read",
  "ads_management",
  "business_management",
  "pages_read_engagement",
  "instagram_basic",
  "read_insights",
];

export function urlAutorizacaoMeta(estado: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    redirect_uri: process.env.META_OAUTH_REDIRECT_URI ?? "",
    state: estado,
    scope: ESCOPOS_META.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${VERSAO}/dialog/oauth?${params}`;
}

export async function trocarCodigoPorToken(codigo: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    client_secret: process.env.META_APP_SECRET ?? "",
    redirect_uri: process.env.META_OAUTH_REDIRECT_URI ?? "",
    code: codigo,
  });
  const r = await fetch(`${BASE}/oauth/access_token?${params}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Meta OAuth falhou: ${await r.text()}`);
  return (await r.json()) as { access_token: string; token_type: string; expires_in?: number };
}

/** Troca o token curto por um de longa duração (~60 dias). */
export async function tokenLongaDuracao(tokenCurto: string) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID ?? "",
    client_secret: process.env.META_APP_SECRET ?? "",
    fb_exchange_token: tokenCurto,
  });
  const r = await fetch(`${BASE}/oauth/access_token?${params}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Troca de token Meta falhou: ${await r.text()}`);
  return (await r.json()) as { access_token: string; expires_in?: number };
}

export async function listarContasDeAnuncio(token: string) {
  const campos = "id,account_id,name,currency,timezone_name,account_status,business_name";
  const r = await fetch(`${BASE}/me/adaccounts?fields=${campos}&limit=200&access_token=${token}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Meta adaccounts: ${await r.text()}`);
  const json = (await r.json()) as { data: Array<Record<string, unknown>> };
  return json.data ?? [];
}

export type InsightMeta = {
  date_start: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  inline_link_clicks?: string;
  campaign_id?: string;
  campaign_name?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
};

/** Insights diários por campanha, prontos para gravar em metricas_diarias. */
export async function buscarInsights(
  token: string,
  contaId: string,
  desde: string,
  ate: string,
): Promise<InsightMeta[]> {
  const params = new URLSearchParams({
    access_token: token,
    level: "campaign",
    time_increment: "1",
    limit: "500",
    fields: "campaign_id,campaign_name,spend,impressions,reach,clicks,inline_link_clicks,actions,action_values",
    time_range: JSON.stringify({ since: desde, until: ate }),
  });
  const conta = contaId.startsWith("act_") ? contaId : `act_${contaId}`;
  const r = await fetch(`${BASE}/${conta}/insights?${params}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Meta insights: ${await r.text()}`);
  const json = (await r.json()) as { data: InsightMeta[] };
  return json.data ?? [];
}

export function extrairAcao(insight: InsightMeta, tipos: string[]) {
  const encontrado = insight.actions?.find((a) => tipos.includes(a.action_type));
  return encontrado ? Number(encontrado.value) : 0;
}

export function extrairValor(insight: InsightMeta, tipos: string[]) {
  const encontrado = insight.action_values?.find((a) => tipos.includes(a.action_type));
  return encontrado ? Number(encontrado.value) : 0;
}

export function normalizarInsight(insight: InsightMeta) {
  return {
    data: insight.date_start,
    id_campanha: insight.campaign_id ?? null,
    nome_campanha: insight.campaign_name ?? null,
    investimento: Number(insight.spend ?? 0),
    impressoes: Number(insight.impressions ?? 0),
    alcance: Number(insight.reach ?? 0),
    cliques: Number(insight.clicks ?? 0),
    cliques_link: Number(insight.inline_link_clicks ?? 0),
    leads: extrairAcao(insight, ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"]),
    conversas: extrairAcao(insight, ["onsite_conversion.messaging_conversation_started_7d"]),
    compras: extrairAcao(insight, ["purchase", "offsite_conversion.fb_pixel_purchase"]),
    receita: extrairValor(insight, ["purchase", "offsite_conversion.fb_pixel_purchase"]),
  };
}

export const cofre = { cifrar, decifrar };
