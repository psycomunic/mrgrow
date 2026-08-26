"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, fkDaOrganizacao, type Resultado } from "@/lib/acoes";
import { CHAVES_BLOCO, FORMATOS, PERIODICIDADES } from "@/lib/blocos-relatorio";

export type { Resultado };

/** A criação devolve id e token: o link é o entregável, e o id deixa a lista
 *  mostrar a linha nova sem recarregar a página. */
export type ResultadoCriacao = Resultado & { id?: string; token?: string };

export type DadosRelatorio = {
  nome: string;
  cliente_id: string | null;
  periodicidade: string;
  formato: string;
  destinatarios: string[];
  blocos: string[];
};

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;
const MAX_DESTINATARIOS = 10;

function validar(d: DadosRelatorio): string | null {
  if (!d.nome.trim()) return "Dê um nome ao relatório.";
  if (d.nome.trim().length > 120) return "O nome ficou longo demais.";

  if (!PERIODICIDADES.some((p) => p.valor === d.periodicidade)) return "Periodicidade inválida.";
  if (!FORMATOS.some((f) => f.valor === d.formato)) return "Formato de entrega inválido.";

  if (d.destinatarios.length > MAX_DESTINATARIOS) {
    return `São no máximo ${MAX_DESTINATARIOS} destinatários por relatório.`;
  }
  const invalido = d.destinatarios.find((e) => !EMAIL.test(e.trim()));
  if (invalido) return `"${invalido}" não é um e-mail válido.`;

  /* Formato por e-mail sem destinatário não entrega nada — e a agência só
     descobriria no fechamento, quando o cliente cobrasse o relatório. */
  if (d.formato !== "link" && !d.destinatarios.length) {
    return "Envio por e-mail precisa de pelo menos um destinatário.";
  }

  if (!d.blocos.length) return "Escolha ao menos um bloco para o relatório.";
  if (d.blocos.some((b) => !CHAVES_BLOCO.includes(b as never))) return "Bloco desconhecido.";

  return null;
}

function paraBanco(d: DadosRelatorio) {
  return {
    nome: d.nome.trim(),
    cliente_id: d.cliente_id || null,
    periodicidade: d.periodicidade,
    formato: d.formato,
    // Minúsculas e sem repetição: o mesmo e-mail em dois casings viraria dois envios.
    destinatarios: [...new Set(d.destinatarios.map((e) => e.trim().toLowerCase()))],
    // Ordem canônica, para o relatório salvo não depender da ordem do clique.
    blocos: CHAVES_BLOCO.filter((c) => d.blocos.includes(c)),
  };
}

export async function criarRelatorio(d: DadosRelatorio): Promise<ResultadoCriacao> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("relatorios", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    const { data, error } = await db
      .from("relatorios")
      .insert({ organizacao_id: sessao.organizacaoId, ...paraBanco(d) })
      .select("id, token_publico")
      .single();

    if (error) return falha("criarRelatorio", error, "Não foi possível criar o relatório.");

    const criado = data as { id: string; token_publico: string };
    revalidatePath("/painel/relatorios");
    return { ok: true, demo: false, id: criado.id, token: criado.token_publico };
  } catch (e) {
    return falha("criarRelatorio", e, "Não foi possível criar o relatório.");
  }
}

export async function atualizarRelatorio(id: string, d: DadosRelatorio): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("relatorios", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Cliente não encontrado." };
    }

    /* `.select("id")` confere que a linha existe: sem ele, um id de outra
       organização devolve zero linhas afetadas sem erro, e a tela mostraria
       "salvo" para uma escrita que não aconteceu. */
    const { data, error } = await db
      .from("relatorios")
      .update(paraBanco(d))
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("atualizarRelatorio", error, "Não foi possível salvar.");
    if (!data?.length) return { ok: false, demo: false, erro: "Relatório não encontrado." };

    revalidatePath("/painel/relatorios");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarRelatorio", e, "Não foi possível salvar.");
  }
}

/** Pausar derruba o link público; retomar devolve o mesmo endereço. */
export async function alternarAtivo(id: string, ativo: boolean): Promise<Resultado> {
  const ctx = await contextoDeAcao("relatorios", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("relatorios")
      .update({ ativo })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("alternarAtivo", error, "Não foi possível mudar o status.");
    if (!data?.length) return { ok: false, demo: false, erro: "Relatório não encontrado." };

    revalidatePath("/painel/relatorios");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("alternarAtivo", e, "Não foi possível mudar o status.");
  }
}

export async function excluirRelatorio(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("relatorios", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("relatorios")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("excluirRelatorio", error, "Não foi possível excluir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Relatório não encontrado." };

    revalidatePath("/painel/relatorios");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirRelatorio", e, "Não foi possível excluir.");
  }
}
