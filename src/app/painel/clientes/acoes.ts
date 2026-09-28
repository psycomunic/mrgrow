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

/**
 * Slug a partir do nome: é ele que forma o endereço da ficha.
 *
 * Mesma regra da função `gerar_slug` do banco, refeita aqui porque o
 * slug precisa existir antes do insert — e porque conferir a
 * disponibilidade no cliente dá erro melhor que uma violação de índice
 * único chegando crua do Postgres.
 */
function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function criarCliente(d: DadosCliente): Promise<Resultado & { slug?: string }> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("clientes", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  const base = gerarSlug(d.nome);
  if (!base) return { ok: false, demo: false, erro: "O nome precisa ter letras ou números." };

  try {
    /* O índice é único por organização, então dois clientes de nome
       parecido colidiriam. Um sufixo numérico resolve sem pedir nada a
       quem cadastra. */
    const { data: usados } = await db
      .from("clientes")
      .select("slug")
      .eq("organizacao_id", sessao.organizacaoId)
      .like("slug", `${base}%`);

    const ocupados = new Set(((usados ?? []) as { slug: string }[]).map((x) => x.slug));
    let slug = base;
    for (let i = 2; ocupados.has(slug); i++) slug = `${base}-${i}`;

    const { data, error } = await db
      .from("clientes")
      .insert({
        organizacao_id: sessao.organizacaoId,
        slug,
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
        responsavel_id: sessao.usuarioId,
      })
      .select("slug")
      .single();

    if (error) return falha("criarCliente", error, "Não foi possível criar o cliente.");

    revalidatePath("/painel/clientes");
    revalidatePath("/painel");
    return { ok: true, demo: false, slug: (data as { slug: string }).slug };
  } catch (e) {
    return falha("criarCliente", e, "Não foi possível criar o cliente.");
  }
}

export type Vinculos = {
  metricas: number;
  tarefas: number;
  projetos: number;
  contratos: number;
  faturas: number;
  arquivos: number;
  lancamentos: number;
};

/**
 * O que existe pendurado no cliente.
 *
 * Serve para a confirmação dizer o que se perde, em número, em vez de um
 * "tem certeza?" genérico. Quem apaga uma conta com dois anos de métrica
 * merece ver os dois anos antes de clicar.
 */
export async function contarVinculos(id: string): Promise<Vinculos | null> {
  const ctx = await contextoDeAcao("clientes", "excluir");
  if (ctx.estado !== "ok") return null;
  const { sessao, db } = ctx;

  const contar = async (tabela: string) => {
    const { count } = await db
      .from(tabela)
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", sessao.organizacaoId)
      .eq("cliente_id", id);
    return count ?? 0;
  };

  const [metricas, tarefas, projetos, contratos, faturas, arquivos, lancamentos] =
    await Promise.all([
      contar("metricas_diarias"),
      contar("tarefas"),
      contar("projetos"),
      contar("contratos"),
      contar("faturas"),
      contar("arquivos"),
      contar("lancamentos"),
    ]);

  return { metricas, tarefas, projetos, contratos, faturas, arquivos, lancamentos };
}

/**
 * Apaga o cliente e tudo que depende dele.
 *
 * O banco cascateia: métricas, tarefas, projetos, contratos, faturas,
 * criativos, campanhas e arquivos somem junto. Lançamentos financeiros
 * sobrevivem — a coluna vira nula — porque o dinheiro que entrou continua
 * sendo verdade do caixa mesmo sem a conta.
 *
 * Exige digitar o nome porque não há desfazer e porque a lista de
 * clientes tem linhas parecidas: um clique errado numa carteira de vinte
 * contas apaga a conta vizinha. Só quem tem `excluir` em clientes chega
 * aqui — pela matriz, proprietário e administrador.
 */
export async function excluirCliente(id: string, confirmacao: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("clientes", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data: cliente } = await db
      .from("clientes")
      .select("nome")
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .maybeSingle();

    const nome = (cliente as { nome: string } | null)?.nome;
    if (!nome) return { ok: false, demo: false, erro: "Cliente não encontrado." };

    if (confirmacao.trim().toLowerCase() !== nome.trim().toLowerCase()) {
      return { ok: false, demo: false, erro: "O nome digitado não confere." };
    }

    const { error } = await db
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("excluirCliente", error, "Não foi possível excluir.");

    revalidatePath("/painel/clientes");
    revalidatePath("/painel");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirCliente", e, "Não foi possível excluir.");
  }
}
