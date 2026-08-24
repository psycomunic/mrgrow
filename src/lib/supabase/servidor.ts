import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/** Cliente Supabase para Server Components, Server Actions e Route Handlers. */
export async function criarClienteServidor() {
  const armazem = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return armazem.getAll();
        },
        setAll(cookiesParaDefinir) {
          try {
            cookiesParaDefinir.forEach(({ name, value, options }) =>
              armazem.set(name, value, options),
            );
          } catch {
            // Server Component não pode escrever cookies — o middleware renova a sessão.
          }
        },
      },
    },
  );
}

/**
 * Cliente com service role. Ignora RLS.
 * Usar SOMENTE em rotas server-side confiáveis (webhooks, cron, sincronizações).
 */
export function criarClienteAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
