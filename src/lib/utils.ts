import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const brl = (valor: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));

export const numero = (valor: number | null | undefined, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(
    Number(valor ?? 0),
  );

export const percentual = (valor: number | null | undefined, casas = 1) =>
  `${numero(Number(valor ?? 0), casas)}%`;

export const compacto = (valor: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(valor ?? 0));

export const dataCurta = (valor: string | Date | null | undefined) =>
  valor ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(valor)) : "—";

export const dataCompleta = (valor: string | Date | null | undefined) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(valor))
    : "—";

export function iniciais(nome?: string | null) {
  if (!nome) return "MR";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugificar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function apenasDigitos(valor: string) {
  return valor.replace(/\D+/g, "");
}

export function telefoneBR(valor?: string | null) {
  const d = apenasDigitos(valor ?? "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor ?? "";
}

/** Divisão segura para métricas (evita NaN/Infinity nos dashboards). */
export function divisao(a: number, b: number) {
  return b > 0 ? a / b : 0;
}

export function variacao(atual: number, anterior: number) {
  if (!anterior) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
}
