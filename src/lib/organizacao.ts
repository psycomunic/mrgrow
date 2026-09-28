import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { MARCA } from "@/lib/marca";

export type DadosAgencia = {
  nome: string;
  /** Nome jurídico, quando difere do comercial. Vai no contrato e na nota. */
  razao_social: string;
  documento: string;
  inscricao_municipal: string;
  email_contato: string;
  whatsapp: string;
  telefone: string;
  site: string;
  instagram: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cor_primaria: string;
  fuso_horario: string;
  /** Marca — a logo aparece em proposta e relatório abertos por link. */
  logo_url: string;
  /* Cobrança: o que a proposta e a fatura precisam dizer a quem paga. */
  pix_chave: string;
  banco: string;
  agencia_bancaria: string;
  conta_bancaria: string;
  /* Padrões que a proposta assume ao nascer, para não redigitar sempre. */
  proposta_validade_dias: number;
  proposta_condicoes: string;
  assinatura_email: string;
  /** Meta de ROAS da agência, usada para classificar contas em Métricas. */
  meta_roas: number;
};

export const AGENCIA_PADRAO: DadosAgencia = {
  nome: MARCA.nome,
  razao_social: "",
  documento: "",
  inscricao_municipal: "",
  email_contato: MARCA.email,
  whatsapp: "",
  telefone: "",
  site: "",
  instagram: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  cor_primaria: "#1668f5",
  fuso_horario: "America/Sao_Paulo",
  logo_url: "",
  pix_chave: "",
  banco: "",
  agencia_bancaria: "",
  conta_bancaria: "",
  proposta_validade_dias: 15,
  proposta_condicoes: "",
  assinatura_email: "",
  meta_roas: 3.5,
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
      .select("nome, documento, cor_primaria, fuso_horario, logo_url, configuracoes")
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
      logo_url: string | null;
      configuracoes: Record<string, unknown> | null;
    };
    const extras = linha.configuracoes ?? {};

    /* Tudo o que não tem coluna própria vive no jsonb. Ler com `texto`
       evita que um valor gravado como número vire "undefined" na tela. */
    const texto = (chave: string) => {
      const v = extras[chave];
      return v === null || v === undefined ? "" : String(v);
    };

    return {
      dados: {
        nome: linha.nome,
        razao_social: texto("razao_social"),
        documento: linha.documento ?? "",
        inscricao_municipal: texto("inscricao_municipal"),
        email_contato: texto("email_contato"),
        whatsapp: texto("whatsapp"),
        telefone: texto("telefone"),
        site: texto("site"),
        instagram: texto("instagram"),
        endereco: texto("endereco"),
        cidade: texto("cidade"),
        estado: texto("estado"),
        cep: texto("cep"),
        cor_primaria: linha.cor_primaria ?? AGENCIA_PADRAO.cor_primaria,
        fuso_horario: linha.fuso_horario ?? AGENCIA_PADRAO.fuso_horario,
        logo_url: linha.logo_url ?? "",
        pix_chave: texto("pix_chave"),
        banco: texto("banco"),
        agencia_bancaria: texto("agencia_bancaria"),
        conta_bancaria: texto("conta_bancaria"),
        proposta_validade_dias:
          Number(extras.proposta_validade_dias) || AGENCIA_PADRAO.proposta_validade_dias,
        proposta_condicoes: texto("proposta_condicoes"),
        assinatura_email: texto("assinatura_email"),
        meta_roas: Number(extras.meta_roas) || AGENCIA_PADRAO.meta_roas,
      },
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarAgencia", e);
    return { dados: AGENCIA_PADRAO, demo: false };
  }
}
