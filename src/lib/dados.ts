import { criarClienteServidor } from "@/lib/supabase/servidor";

/** True quando as variáveis do Supabase ainda não foram preenchidas. */
export function supabaseConfigurado() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxxxxxxxxxx")
  );
}

/**
 * Executa uma consulta e cai para dados de demonstração se o Supabase ainda
 * não estiver conectado — assim o painel abre e é navegável desde o primeiro
 * `npm run dev`.
 */
export async function consultar<T>(
  executar: (db: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<{ data: T | null; error: unknown }>,
  demonstracao: T,
): Promise<{ dados: T; demo: boolean }> {
  if (!supabaseConfigurado()) return { dados: demonstracao, demo: true };
  try {
    const db = await criarClienteServidor();
    const { data, error } = await executar(db);
    if (error || !data) return { dados: demonstracao, demo: true };
    return { dados: data, demo: false };
  } catch {
    return { dados: demonstracao, demo: true };
  }
}
