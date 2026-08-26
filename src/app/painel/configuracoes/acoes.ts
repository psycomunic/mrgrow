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
  return null;
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
      email_contato: d.email_contato.trim() || null,
      whatsapp: apenasDigitos(d.whatsapp) || null,
    };

    const { data, error } = await db
      .from("organizacoes")
      .update({
        nome: d.nome.trim(),
        documento: apenasDigitos(d.documento) || null,
        cor_primaria: d.cor_primaria.trim().toLowerCase(),
        fuso_horario: d.fuso_horario,
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
