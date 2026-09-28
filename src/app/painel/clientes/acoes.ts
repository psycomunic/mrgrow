"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, pertence, type Resultado } from "@/lib/acoes";

export type { Resultado };

/** Campos que a ficha do cliente edita. */
export type DadosCliente = {
  nome: string;
  segmento: string;
  status: string;
  documento: string;
  site: string;
  instagram: string;
  fee_mensal: number;
  investimento_previsto: number;
  percentual_sobre_investimento: number;
  dia_vencimento: number;
  inicio_contrato: string | null;
  fim_contrato: string | null;
  saude: number;
  nps: number | null;
  observacoes: string;
};

const STATUS = ["prospecto", "onboarding", "ativo", "pausado", "encerrado"];

function validar(d: DadosCliente): string | null {
  if (!d.nome.trim()) return "Informe o nome do cliente.";
  if (d.nome.trim().length > 120) return "O nome ficou longo demais.";
  if (!STATUS.includes(d.status)) return "Status inválido.";

  for (const [valor, nome] of [
    [d.fee_mensal, "O fee mensal"],
    [d.investimento_previsto, "O investimento previsto"],
  ] as const) {
    if (!Number.isFinite(valor) || valor < 0) return `${nome} precisa ser um número positivo.`;
    if (valor > 10_000_000) return `${nome} está fora da faixa.`;
  }

  const p = d.percentual_sobre_investimento;
  if (!Number.isFinite(p) || p < 0 || p > 100) return "O percentual vai de 0 a 100.";

  /* O `check` da tabela só aceita de 1 a 28: fevereiro não tem dia 30, e um
     vencimento que não existe em todo mês quebraria a régua de cobrança. */
  if (!Number.isInteger(d.dia_vencimento) || d.dia_vencimento < 1 || d.dia_vencimento > 28) {
    return "O dia de vencimento vai de 1 a 28.";
  }

  if (!Number.isInteger(d.saude) || d.saude < 0 || d.saude > 100) return "A saúde vai de 0 a 100.";
  if (d.nps !== null && (!Number.isInteger(d.nps) || d.nps < 0 || d.nps > 10)) {
    return "O NPS vai de 0 a 10.";
  }

  for (const [data, nome] of [
    [d.inicio_contrato, "início"],
    [d.fim_contrato, "término"],
  ] as const) {
    if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) return `Data de ${nome} inválida.`;
  }
  if (d.inicio_contrato && d.fim_contrato && d.fim_contrato < d.inicio_contrato) {
    return "O término não pode ser antes do início.";
  }

  if (d.observacoes.length > 4000) return "As observações ficaram longas demais.";
  return null;
}

/** Tira o `@` e a URL: o banco guarda só o usuário. */
function usuarioInstagram(v: string) {
  const limpo = v
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  return limpo || null;
}

/** Garante o esquema no site, senão o link do card abre relativo ao painel. */
function endereco(v: string) {
  const limpo = v.trim();
  if (!limpo) return null;
  return /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;
}

export async function atualizarCliente(id: string, d: DadosCliente): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  /* A permissão é conferida aqui, no servidor, e não só escondendo o botão:
     quem não pode editar não passa nem chamando a action direto. */
  const ctx = await contextoDeAcao("clientes", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "clientes", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    const { error } = await db
      .from("clientes")
      .update({
        nome: d.nome.trim(),
        segmento: d.segmento.trim() || null,
        status: d.status,
        documento: d.documento.trim() || null,
        site: endereco(d.site),
        instagram: usuarioInstagram(d.instagram),
        fee_mensal: d.fee_mensal,
        investimento_previsto: d.investimento_previsto,
        percentual_sobre_investimento: d.percentual_sobre_investimento,
        dia_vencimento: d.dia_vencimento,
        inicio_contrato: d.inicio_contrato || null,
        fim_contrato: d.fim_contrato || null,
        saude: d.saude,
        nps: d.nps,
        observacoes: d.observacoes.trim() || null,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("atualizarCliente", error, "Não foi possível salvar.");

    revalidatePath("/painel/clientes");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarCliente", e, "Não foi possível salvar.");
  }
}
