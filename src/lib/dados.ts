import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/** True quando as variáveis do Supabase ainda não foram preenchidas. */
export function supabaseConfigurado() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    !!url &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !url.includes("xxxxxxxxxxxx") &&
    !url.includes("seu-projeto")
  );
}

/**
 * Modo demonstração: o painel abre navegável no primeiro `npm run dev`, antes
 * de existir banco. É o inverso de `supabaseConfigurado`, com nome próprio
 * porque o resto do código pergunta "estou em demonstração?", não "existe
 * variável de ambiente?".
 */
export const modoDemonstracao = () => !supabaseConfigurado();

/**
 * Registra uma falha de consulta no log do servidor.
 *
 * Antes, todo `catch` devolvia dados de demonstração em silêncio: um erro de
 * RLS ou uma constraint violada apareciam como painel funcionando com números
 * plausíveis. Isso esconde exatamente o tipo de bug que só aparece em
 * produção, então agora nada é engolido sem deixar rastro.
 */
export function registrarFalha(onde: string, erro: unknown) {
  const detalhe =
    erro && typeof erro === "object" && "message" in erro
      ? String((erro as { message: unknown }).message)
      : String(erro);
  console.error(`[mr-grow] falha em ${onde}: ${detalhe}`);
}

export type Consulta<T> = {
  dados: T;
  /** Os dados são fictícios (sem banco configurado). */
  demo: boolean;
  /** A consulta real falhou — a tela deve dizer isso, não inventar números. */
  falhou: boolean;
};

/**
 * Executa uma consulta com três desfechos honestos:
 *
 * - sem Supabase configurado → dados de demonstração, `demo: true`;
 * - Supabase configurado e consulta ok → dados reais;
 * - Supabase configurado e consulta com erro → `vazio` + `falhou: true`.
 *
 * O terceiro caso é o importante: com banco ligado, um erro nunca vira
 * demonstração disfarçada de dado real.
 */
export async function consultar<T>(
  executar: (
    db: Awaited<ReturnType<typeof criarClienteServidor>>,
  ) => Promise<{ data: T | null; error: unknown }>,
  opcoes: { demonstracao: T; vazio: T; onde: string },
): Promise<Consulta<T>> {
  if (modoDemonstracao()) {
    return { dados: opcoes.demonstracao, demo: true, falhou: false };
  }
  try {
    const db = await criarClienteServidor();
    const { data, error } = await executar(db);
    if (error) {
      registrarFalha(opcoes.onde, error);
      return { dados: opcoes.vazio, demo: false, falhou: true };
    }
    return { dados: data ?? opcoes.vazio, demo: false, falhou: false };
  } catch (erro) {
    registrarFalha(opcoes.onde, erro);
    return { dados: opcoes.vazio, demo: false, falhou: true };
  }
}
