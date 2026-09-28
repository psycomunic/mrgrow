"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, type Resultado } from "@/lib/acoes";
import type { DadosAgencia } from "@/lib/organizacao";
import { apenasDigitos } from "@/lib/utils";

export type { Resultado };

const FUSOS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Cuiaba",
  "America/Rio_Branco",
  "America/Noronha",
];

function validar(d: DadosAgencia): string | null {
  if (!d.nome.trim()) return "Informe o nome da agência.";
  if (d.nome.trim().length > 120) return "O nome ficou longo demais.";

  const cnpj = apenasDigitos(d.documento);
  if (cnpj && cnpj.length !== 14) return "O CNPJ precisa ter 14 dígitos.";

  if (d.email_contato && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email_contato.trim())) {
    return "E-mail de contato inválido.";
  }

  const fone = apenasDigitos(d.whatsapp);
  if (fone && (fone.length < 10 || fone.length > 13)) return "WhatsApp inválido.";

  /* A cor entra em CSS inline nas propostas e nos relatórios. Aceitar texto
     livre aqui seria abrir uma porta para injeção de estilo em página pública. */
  if (!/^#[0-9a-f]{6}$/i.test(d.cor_primaria.trim())) {
    return "A cor precisa estar no formato #1668f5.";
  }

  if (!FUSOS.includes(d.fuso_horario)) return "Fuso horário inválido.";

  const fixo = apenasDigitos(d.telefone);
  if (fixo && (fixo.length < 10 || fixo.length > 13)) return "Telefone inválido.";

  const cep = apenasDigitos(d.cep);
  if (cep && cep.length !== 8) return "O CEP precisa ter 8 dígitos.";
  if (d.estado && d.estado.length !== 2) return "Estado inválido.";

  if (!Number.isInteger(d.proposta_validade_dias) || d.proposta_validade_dias < 1 || d.proposta_validade_dias > 365) {
    return "A validade da proposta vai de 1 a 365 dias.";
  }
  if (!Number.isFinite(d.meta_roas) || d.meta_roas <= 0 || d.meta_roas > 100) {
    return "A meta de ROAS precisa ficar entre 0 e 100.";
  }

  for (const [texto, rotulo, teto] of [
    [d.proposta_condicoes, "As condições da proposta", 4000],
    [d.assinatura_email, "A assinatura de e-mail", 1000],
  ] as const) {
    if (texto.length > teto) return `${rotulo} passou de ${teto} caracteres.`;
  }

  /* A logo entra em `<img src>` de página pública. Aceitar texto livre
     abriria espaço para `javascript:` numa tela que o cliente abre. */
  if (d.logo_url && !/^https:\/\//i.test(d.logo_url)) return "Endereço de logo inválido.";

  return null;
}

/** Tira o `@` e a URL: guardamos só o usuário. */
function usuarioInstagram(v: string) {
  const limpo = v
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  return limpo || null;
}

export async function salvarAgencia(d: DadosAgencia): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("configuracoes", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    /* Merge no jsonb em vez de sobrescrever: `configuracoes` guarda outras
       preferências da organização, e um update cru apagaria todas elas. */
    const { data: atual } = await db
      .from("organizacoes")
      .select("configuracoes")
      .eq("id", sessao.organizacaoId)
      .maybeSingle();

    const extras = {
      ...(((atual as { configuracoes?: Record<string, unknown> } | null)?.configuracoes) ?? {}),
      razao_social: d.razao_social.trim() || null,
      inscricao_municipal: d.inscricao_municipal.trim() || null,
      email_contato: d.email_contato.trim() || null,
      whatsapp: apenasDigitos(d.whatsapp) || null,
      telefone: apenasDigitos(d.telefone) || null,
      site: d.site.trim() || null,
      instagram: usuarioInstagram(d.instagram),
      endereco: d.endereco.trim() || null,
      cidade: d.cidade.trim() || null,
      estado: d.estado.trim().toUpperCase() || null,
      cep: apenasDigitos(d.cep) || null,
      pix_chave: d.pix_chave.trim() || null,
      banco: d.banco.trim() || null,
      agencia_bancaria: d.agencia_bancaria.trim() || null,
      conta_bancaria: d.conta_bancaria.trim() || null,
      proposta_validade_dias: d.proposta_validade_dias,
      proposta_condicoes: d.proposta_condicoes.trim() || null,
      assinatura_email: d.assinatura_email.trim() || null,
      meta_roas: d.meta_roas,
    };

    const { data, error } = await db
      .from("organizacoes")
      .update({
        nome: d.nome.trim(),
        documento: apenasDigitos(d.documento) || null,
        cor_primaria: d.cor_primaria.trim().toLowerCase(),
        fuso_horario: d.fuso_horario,
        logo_url: d.logo_url.trim() || null,
        configuracoes: extras,
      })
      .eq("id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("salvarAgencia", error, "Não foi possível salvar.");
    if (!data?.length) {
      return { ok: false, demo: false, erro: "Só um gestor pode alterar os dados da agência." };
    }

    revalidatePath("/painel", "layout");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("salvarAgencia", e, "Não foi possível salvar.");
  }
}
