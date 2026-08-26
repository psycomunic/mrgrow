import { Flame, Snowflake, Thermometer, type LucideIcon } from "lucide-react";

/**
 * Rótulos legíveis para os valores que o banco guarda em snake_case.
 * Ficam num lugar só para o cartão, o painel e o formulário não divergirem.
 */

export const ORIGENS: { v: string; r: string }[] = [
  { v: "meta_ads", r: "Meta Ads" },
  { v: "google_ads", r: "Google Ads" },
  { v: "indicacao", r: "Indicação" },
  { v: "organico", r: "Orgânico" },
  { v: "outbound", r: "Outbound" },
];

export function rotuloOrigem(v: string | null | undefined) {
  if (!v) return null;
  return ORIGENS.find((o) => o.v === v)?.r ?? v;
}

export const TEMPERATURAS: {
  v: string;
  r: string;
  Icone: LucideIcon;
  tom: "perigo" | "alerta" | "azul";
}[] = [
  { v: "quente", r: "Quente", Icone: Flame, tom: "perigo" },
  { v: "morno", r: "Morno", Icone: Thermometer, tom: "alerta" },
  { v: "frio", r: "Frio", Icone: Snowflake, tom: "azul" },
];

export function temperatura(v: string) {
  return TEMPERATURAS.find((t) => t.v === v) ?? TEMPERATURAS[1];
}
