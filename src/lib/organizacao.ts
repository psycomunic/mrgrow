import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { MARCA } from "@/lib/marca";

export type DadosAgencia = {
  nome: string;
  documento: string;
  email_contato: string;
  whatsapp: string;
  cor_primaria: string;
  fuso_horario: string;
};

export const AGENCIA_PADRAO: DadosAgencia = {
  nome: MARCA.nome,
  documento: "",
  email_contato: MARCA.email,
  whatsapp: "",
  cor_primaria: "#1668f5",
  fuso_horario: "America/Sao_Paulo",
};

/**
 * Dados da agência para a tela de configurações.
 *
 * `email_contato` e `whatsapp` não têm coluna própria: vivem em
 * `organizacoes.configuracoes` (jsonb), que existe justamente para os campos
 * que variam por agência sem exigir migração.
 */
export async function carregarAgencia(): Promise<{ dados: DadosAgencia; demo: boolean }> {
  if (modoDemonstracao()) return { dados: AGENCIA_PADRAO, demo: true };

  try {
    const sessao = await obterSessao();
    if (!sessao) return { dados: AGENCIA_PADRAO, demo: false };

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("organizacoes")
      .select("nome, documento, cor_primaria, fuso_horario, configuracoes")
      .eq("id", sessao.organizacaoId)
      .maybeSingle();

    if (error || !data) {
      if (error) registrarFalha("carregarAgencia", error);
      return { dados: AGENCIA_PADRAO, demo: false };
    }

    const linha = data as unknown as {
      nome: string;
      documento: string | null;
      cor_primaria: string | null;
      fuso_horario: string | null;
      configuracoes: Record<string, unknown> | null;
    };
    const extras = linha.configuracoes ?? {};

    return {
      dados: {
        nome: linha.nome,
        documento: linha.documento ?? "",
        email_contato: String(extras.email_contato ?? ""),
        whatsapp: String(extras.whatsapp ?? ""),
        cor_primaria: linha.cor_primaria ?? AGENCIA_PADRAO.cor_primaria,
        fuso_horario: linha.fuso_horario ?? AGENCIA_PADRAO.fuso_horario,
      },
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarAgencia", e);
    return { dados: AGENCIA_PADRAO, demo: false };
  }
}
