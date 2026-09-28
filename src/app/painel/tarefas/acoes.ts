"use server";

import { revalidatePath } from "next/cache";
import {
  contextoDeAcao,
  falha,
  fkDaOrganizacao,
  pertence,
  type Banco,
  type Resultado,
} from "@/lib/acoes";
import { STATUS_TAREFA, PRIORIDADE, RECORRENCIAS } from "@/lib/rotulos";

export type { Resultado };

export type DadosTarefa = {
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  cliente_id: string | null;
  projeto_id: string | null;
  responsavel_id: string | null;
  vence_em: string | null;
  etiquetas: string[];
  estimativa_horas: number | null;
  horas_gastas: number;
  recorrente: boolean;
  recorrencia: string | null;
};

const STATUS = STATUS_TAREFA.lista.map((s) => s.valor);
const PRIORIDADES = PRIORIDADE.lista.map((p) => p.valor);

/** Teto de horas por tarefa. Acima disso é projeto, não tarefa. */
const MAX_HORAS = 999;

function validar(d: DadosTarefa): string | null {
  if (!d.titulo.trim()) return "Escreva o que precisa ser feito.";
  if (d.titulo.trim().length > 200) return "O título ficou longo demais.";
  if (d.descricao.length > 4000) return "A descrição ficou longa demais.";
  if (!STATUS.includes(d.status)) return "Status inválido.";
  if (!PRIORIDADES.includes(d.prioridade)) return "Prioridade inválida.";
  if (d.vence_em && !/^\d{4}-\d{2}-\d{2}$/.test(d.vence_em)) return "Prazo inválido.";

  if (d.etiquetas.length > 8) return "No máximo 8 etiquetas por tarefa.";
  if (d.etiquetas.some((e) => e.length > 24)) return "Etiqueta longa demais (máx. 24 caracteres).";

  for (const [valor, nome] of [
    [d.estimativa_horas, "A estimativa"],
    [d.horas_gastas, "As horas gastas"],
  ] as const) {
    if (valor === null) continue;
    if (!Number.isFinite(valor) || valor < 0) return `${nome} precisa ser um número positivo.`;
    if (valor > MAX_HORAS) return `${nome} passou do limite de ${MAX_HORAS} horas.`;
  }

  /* Recorrência sem período é uma tarefa que se repete sem dizer quando —
     o quadro não teria como gerar a próxima. */
  if (d.recorrente && !RECORRENCIAS.includes(d.recorrencia as (typeof RECORRENCIAS)[number])) {
    return "Escolha de quanto em quanto tempo a tarefa se repete.";
  }
  return null;
}

/** Normaliza etiqueta: minúscula, sem espaço sobrando e sem repetida. */
function limparEtiquetas(lista: string[]): string[] {
  const vistas = new Set<string>();
  const saida: string[] = [];
  for (const bruta of lista) {
    const e = bruta.trim().toLowerCase().replace(/\s+/g, " ");
    if (!e || vistas.has(e)) continue;
    vistas.add(e);
    saida.push(e);
  }
  return saida;
}

function paraBanco(d: DadosTarefa) {
  return {
    titulo: d.titulo.trim(),
    descricao: d.descricao.trim() || null,
    status: d.status,
    prioridade: d.prioridade,
    cliente_id: d.cliente_id || null,
    projeto_id: d.projeto_id || null,
    responsavel_id: d.responsavel_id || null,
    vence_em: d.vence_em || null,
    etiquetas: limparEtiquetas(d.etiquetas),
    estimativa_horas: d.estimativa_horas,
    horas_gastas: d.horas_gastas,
    recorrente: d.recorrente,
    recorrencia: d.recorrente ? d.recorrencia : null,
    /* Concluída sem data de conclusão deixa o relatório de produtividade sem
       base, e reabrir uma tarefa precisa limpar a data — daí os dois lados. */
    concluida_em: d.status === "concluida" ? new Date().toISOString() : null,
  };
}

/**
 * Confere se o responsável é gente desta organização.
 *
 * Não dá para usar `fkDaOrganizacao` aqui: ela procura por `id`, e o que a
 * tarefa guarda é o `usuario_id` do vínculo. Sem esta checagem, um id de
 * perfil de outra organização passaria direto pela Server Action.
 */
async function ehDaEquipe(db: Banco, usuarioId: string | null, organizacaoId: string) {
  if (!usuarioId) return true;
  const { data } = await db
    .from("membros_organizacao")
    .select("usuario_id")
    .eq("usuario_id", usuarioId)
    .eq("organizacao_id", organizacaoId)
    .eq("ativo", true)
    .maybeSingle();
  return !!data;
}

/** Os três vínculos que toda gravação precisa conferir antes de salvar. */
async function vinculosValidos(
  db: Banco,
  d: Pick<DadosTarefa, "cliente_id" | "projeto_id" | "responsavel_id">,
  organizacaoId: string,
): Promise<string | null> {
  if (!(await fkDaOrganizacao(db, "clientes", d.cliente_id, organizacaoId))) {
    return "Cliente não encontrado.";
  }
  if (!(await fkDaOrganizacao(db, "projetos", d.projeto_id, organizacaoId))) {
    return "Projeto não encontrado.";
  }
  if (!(await ehDaEquipe(db, d.responsavel_id, organizacaoId))) {
    return "Essa pessoa não está na equipe.";
  }
  return null;
}

function revalidar() {
  revalidatePath("/painel/tarefas");
  revalidatePath("/painel");
}

export async function criarTarefa(d: DadosTarefa): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("tarefas", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const invalido = await vinculosValidos(db, d, sessao.organizacaoId);
    if (invalido) return { ok: false, demo: false, erro: invalido };

    const dados = paraBanco(d);
    const { error } = await db.from("tarefas").insert({
      organizacao_id: sessao.organizacaoId,
      criado_por: sessao.usuarioId,
      ...dados,
      /* Sem responsável escolhido, a tarefa fica com quem a criou: tarefa sem
         dono some do radar de todo mundo. */
      responsavel_id: dados.responsavel_id ?? sessao.usuarioId,
    });

    if (error) return falha("criarTarefa", error, "Não foi possível criar a tarefa.");
    revalidar();
    return { ok: true, demo: false };
  } catch (e) {
    return falha("criarTarefa", e, "Não foi possível criar a tarefa.");
  }
}

export async function atualizarTarefa(id: string, d: DadosTarefa): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("tarefas", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const invalido = await vinculosValidos(db, d, sessao.organizacaoId);
    if (invalido) return { ok: false, demo: false, erro: invalido };

    const { data, error } = await db
      .from("tarefas")
      .update(paraBanco(d))
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("atualizarTarefa", error, "Não foi possível salvar.");
    if (!data?.length) return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    revalidar();
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarTarefa", e, "Não foi possível salvar.");
  }
}

/** Arrastar de coluna: muda só o status e a posição na coluna de destino. */
export async function moverTarefa(id: string, status: string, ordem: number): Promise<Resultado> {
  if (!STATUS.includes(status)) return { ok: false, demo: false, erro: "Status inválido." };
  if (!Number.isInteger(ordem) || ordem < 0)
    return { ok: false, demo: false, erro: "Ordem inválida." };

  const ctx = await contextoDeAcao("tarefas", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "tarefas", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    }

    const { error } = await db
      .from("tarefas")
      .update({
        status,
        ordem,
        concluida_em: status === "concluida" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("moverTarefa", error, "Não foi possível mover a tarefa.");
    revalidar();
    return { ok: true, demo: false };
  } catch (e) {
    return falha("moverTarefa", e, "Não foi possível mover a tarefa.");
  }
}

/**
 * Troca o responsável sem abrir o formulário inteiro.
 *
 * Existe separada de `atualizarTarefa` porque redistribuir trabalho é o que
 * mais se faz no quadro, e passar o objeto completo só para mudar uma pessoa
 * arriscaria sobrescrever o que outra pessoa editou no meio tempo.
 */
export async function atribuirTarefa(
  id: string,
  responsavelId: string | null,
): Promise<Resultado> {
  const ctx = await contextoDeAcao("tarefas", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await ehDaEquipe(db, responsavelId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Essa pessoa não está na equipe." };
    }

    const { data, error } = await db
      .from("tarefas")
      .update({ responsavel_id: responsavelId })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("atribuirTarefa", error, "Não foi possível atribuir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    revalidar();
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atribuirTarefa", e, "Não foi possível atribuir.");
  }
}

/** Marcar e desmarcar como concluída direto no cartão. */
export async function alternarConclusao(id: string, concluida: boolean): Promise<Resultado> {
  const ctx = await contextoDeAcao("tarefas", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("tarefas")
      .update({
        /* Reabrir devolve para "em andamento", e não para o backlog: se a
           tarefa chegou a ser concluída, alguém já pôs a mão nela. */
        status: concluida ? "concluida" : "fazendo",
        concluida_em: concluida ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("alternarConclusao", error, "Não foi possível mudar a tarefa.");
    if (!data?.length) return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    revalidar();
    return { ok: true, demo: false };
  } catch (e) {
    return falha("alternarConclusao", e, "Não foi possível mudar a tarefa.");
  }
}

/**
 * Duplica a tarefa no backlog.
 *
 * A cópia nasce zerada em horas gastas e sem data de conclusão: o que se quer
 * repetir é o combinado, não o esforço que já foi gasto na original.
 */
export async function duplicarTarefa(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("tarefas", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data: original, error: erroLeitura } = await db
      .from("tarefas")
      .select(
        "titulo, descricao, prioridade, cliente_id, projeto_id, responsavel_id, vence_em, etiquetas, estimativa_horas, recorrente, recorrencia",
      )
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .maybeSingle();

    if (erroLeitura) return falha("duplicarTarefa", erroLeitura, "Não foi possível duplicar.");
    if (!original) return { ok: false, demo: false, erro: "Tarefa não encontrada." };

    const { titulo, ...resto } = original as { titulo: string } & Record<string, unknown>;
    const { error } = await db.from("tarefas").insert({
      organizacao_id: sessao.organizacaoId,
      criado_por: sessao.usuarioId,
      ...resto,
      titulo: `${titulo} (cópia)`.slice(0, 200),
      status: "backlog",
      horas_gastas: 0,
      concluida_em: null,
    });

    if (error) return falha("duplicarTarefa", error, "Não foi possível duplicar.");
    revalidar();
    return { ok: true, demo: false };
  } catch (e) {
    return falha("duplicarTarefa", e, "Não foi possível duplicar.");
  }
}

export async function excluirTarefa(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("tarefas", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("tarefas")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("excluirTarefa", error, "Não foi possível excluir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Tarefa não encontrada." };
    revalidar();
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirTarefa", e, "Não foi possível excluir.");
  }
}
