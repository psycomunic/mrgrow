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

export type { Resultado };

/** Campos que o formulário do quadro edita. */
export type DadosNegocio = {
  titulo: string;
  contato: string;
  email: string;
  telefone: string;
  valor_mensal: number;
  valor_unico: number;
  temperatura: string;
  origem: string;
  previsao: string | null;
  etapa_id: string;
};

const TEMPERATURAS = ["quente", "morno", "frio"];
const ORIGENS = ["meta_ads", "google_ads", "indicacao", "organico", "outbound"];

function validar(d: DadosNegocio): string | null {
  if (!d.titulo.trim()) return "Informe o nome do negócio.";
  if (d.titulo.trim().length > 120) return "O nome ficou longo demais.";
  if (d.contato.trim().length > 120) return "O nome do contato ficou longo demais.";
  if (d.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) return "E-mail inválido.";
  if (d.telefone.trim().length > 40) return "Telefone longo demais.";
  if (!d.etapa_id) return "Selecione a etapa.";
  if (!TEMPERATURAS.includes(d.temperatura)) return "Temperatura inválida.";
  if (d.origem && !ORIGENS.includes(d.origem)) return "Origem inválida.";
  if (!Number.isFinite(d.valor_mensal) || d.valor_mensal < 0) return "Valor mensal inválido.";
  if (!Number.isFinite(d.valor_unico) || d.valor_unico < 0) return "Valor de setup inválido.";
  if (d.valor_mensal > 10_000_000 || d.valor_unico > 10_000_000) return "Valor fora da faixa.";
  if (d.previsao && !/^\d{4}-\d{2}-\d{2}$/.test(d.previsao)) return "Data de previsão inválida.";
  return null;
}

export async function criarNegocio(funilId: string | null, d: DadosNegocio): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("crm", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  if (!funilId) return { ok: false, demo: false, erro: "Nenhum funil configurado." };

  try {
    if (!(await fkDaOrganizacao(db, "funis", funilId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Funil não encontrado." };
    }
    if (!(await fkDaOrganizacao(db, "etapas_funil", d.etapa_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Etapa não encontrada." };
    }

    let contatoId: string | null = null;
    if (d.contato.trim()) {
      const { data: contato, error: erroContato } = await db
        .from("contatos")
        .insert({
          organizacao_id: sessao.organizacaoId,
          nome: d.contato.trim(),
          email: d.email.trim() || null,
          telefone: d.telefone.trim() || null,
        })
        .select("id")
        .single();
      if (erroContato) return falha("criarNegocio/contato", erroContato, "Não foi possível salvar o contato.");
      contatoId = (contato as { id: string } | null)?.id ?? null;
    }

    const { error } = await db.from("negocios").insert({
      organizacao_id: sessao.organizacaoId,
      funil_id: funilId,
      etapa_id: d.etapa_id,
      contato_id: contatoId,
      responsavel_id: sessao.usuarioId,
      titulo: d.titulo.trim(),
      valor_mensal: d.valor_mensal,
      valor_unico: d.valor_unico,
      temperatura: d.temperatura,
      origem: d.origem || null,
      previsao_fechamento: d.previsao || null,
    });

    if (error) return falha("criarNegocio", error, "Não foi possível criar o negócio.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("criarNegocio", e, "Não foi possível criar o negócio.");
  }
}

export async function atualizarNegocio(id: string, d: DadosNegocio): Promise<Resultado> {
  const erro = validar(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "negocios", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }
    if (!(await fkDaOrganizacao(db, "etapas_funil", d.etapa_id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Etapa não encontrada." };
    }

    /* A ficha do contato vive noutra tabela, então editar o negócio precisa
       alcançá-la: sem isto, trocar o telefone no formulário não mudava nada.
       Negócio que ainda não tem contato ganha um agora. */
    const contatoId = await manterContato(db, id, d, sessao.organizacaoId);
    if (contatoId === false) {
      return { ok: false, demo: false, erro: "Não foi possível salvar o contato." };
    }

    const { error } = await db
      .from("negocios")
      .update({
        contato_id: contatoId,
        etapa_id: d.etapa_id,
        titulo: d.titulo.trim(),
        valor_mensal: d.valor_mensal,
        valor_unico: d.valor_unico,
        temperatura: d.temperatura,
        origem: d.origem || null,
        previsao_fechamento: d.previsao || null,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("atualizarNegocio", error, "Não foi possível salvar.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarNegocio", e, "Não foi possível salvar.");
  }
}

/**
 * Cria ou atualiza o contato do negócio e devolve o id.
 *
 * Devolve `false` quando a gravação falha — `null` já significa "este negócio
 * não tem contato", que é um estado válido.
 */
async function manterContato(
  db: Banco,
  negocioId: string,
  d: DadosNegocio,
  organizacaoId: string,
): Promise<string | null | false> {
  const nome = d.contato.trim();
  const campos = {
    nome,
    email: d.email.trim() || null,
    telefone: d.telefone.trim() || null,
  };

  const { data: atual } = await db
    .from("negocios")
    .select("contato_id")
    .eq("id", negocioId)
    .eq("organizacao_id", organizacaoId)
    .maybeSingle();

  const contatoId = (atual as { contato_id: string | null } | null)?.contato_id ?? null;

  if (!nome) return contatoId;

  if (contatoId) {
    const { error } = await db
      .from("contatos")
      .update(campos)
      .eq("id", contatoId)
      .eq("organizacao_id", organizacaoId);
    if (error) {
      falha("manterContato", error, "");
      return false;
    }
    return contatoId;
  }

  const { data, error } = await db
    .from("contatos")
    .insert({ organizacao_id: organizacaoId, ...campos })
    .select("id")
    .single();
  if (error) {
    falha("manterContato", error, "");
    return false;
  }
  return (data as { id: string }).id;
}

/**
 * Move o negócio de etapa. O trigger `ao_mover_negocio` grava o histórico
 * sozinho, então aqui só o `etapa_id` e a ordem mudam.
 */
export async function moverNegocio(id: string, etapaId: string, ordem: number): Promise<Resultado> {
  if (!Number.isInteger(ordem) || ordem < 0) return { ok: false, demo: false, erro: "Ordem inválida." };

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "negocios", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }
    if (!(await fkDaOrganizacao(db, "etapas_funil", etapaId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Etapa não encontrada." };
    }

    const { error } = await db
      .from("negocios")
      .update({ etapa_id: etapaId, ordem_kanban: ordem })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("moverNegocio", error, "Não foi possível mover.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("moverNegocio", e, "Não foi possível mover.");
  }
}

/** Fecha o negócio como ganho ou perdido; sai do quadro de abertos. */
export async function fecharNegocio(
  id: string,
  status: "ganho" | "perdido",
  motivo?: string,
): Promise<Resultado> {
  if (status !== "ganho" && status !== "perdido") {
    return { ok: false, demo: false, erro: "Status inválido." };
  }

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "negocios", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db
      .from("negocios")
      .update({
        status,
        motivo_perda: status === "perdido" ? (motivo?.slice(0, 500) ?? null) : null,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("fecharNegocio", error, "Não foi possível fechar.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("fecharNegocio", e, "Não foi possível fechar.");
  }
}

export async function excluirNegocio(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("crm", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "negocios", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db
      .from("negocios")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("excluirNegocio", error, "Não foi possível excluir.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirNegocio", e, "Não foi possível excluir.");
  }
}

/* ── Atividades do negócio ──────────────────────────────────────
   A tabela `atividades` já existia no schema e nenhuma tela usava. É o
   histórico de contato: nota, ligação, reunião, e-mail, WhatsApp. */

export type Atividade = {
  id: string;
  tipo: string;
  titulo: string | null;
  conteudo: string | null;
  criado_em: string;
  /** Preenchido só nas atividades agendadas — as combinadas para depois. */
  vence_em: string | null;
  concluida: boolean;
  autor: string | null;
};

const TIPOS_ATIVIDADE = ["nota", "ligacao", "reuniao", "email", "whatsapp", "tarefa"];

/** Demonstração: dá o que ler no painel antes do banco existir. */
const ATIVIDADES_DEMO: Atividade[] = [
  {
    id: "a1",
    tipo: "reuniao",
    titulo: null,
    conteudo: "Diagnóstico feito. Conta com rastreamento quebrado e criativo parado há 3 meses.",
    criado_em: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    vence_em: null,
    concluida: true,
    autor: "Mateus Rodrigues",
  },
  {
    id: "a2",
    tipo: "whatsapp",
    titulo: null,
    conteudo: "Retornou pedindo a proposta com o escopo de landing page incluso.",
    criado_em: new Date(Date.now() - 86_400_000).toISOString(),
    vence_em: null,
    concluida: true,
    autor: "Mateus Rodrigues",
  },
];

export async function listarAtividades(negocioId: string): Promise<Atividade[]> {
  const ctx = await contextoDeAcao("crm", "ver");
  if (ctx.estado === "demo") return ATIVIDADES_DEMO;
  if (ctx.estado === "negado") return [];
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("atividades")
      .select("id, tipo, titulo, conteudo, criado_em, vence_em, concluida, perfis(nome_completo)")
      .eq("negocio_id", negocioId)
      .eq("organizacao_id", sessao.organizacaoId)
      .order("criado_em", { ascending: false })
      .limit(50);

    if (error) {
      falha("listarAtividades", error, "");
      return [];
    }

    type Linha = {
      id: string;
      tipo: string;
      titulo: string | null;
      conteudo: string | null;
      criado_em: string;
      vence_em: string | null;
      concluida: boolean;
      perfis: { nome_completo: string | null } | { nome_completo: string | null }[] | null;
    };

    return ((data ?? []) as unknown as Linha[]).map((a) => {
      const p = Array.isArray(a.perfis) ? a.perfis[0] : a.perfis;
      return {
        id: a.id,
        tipo: a.tipo,
        titulo: a.titulo,
        conteudo: a.conteudo,
        criado_em: a.criado_em,
        vence_em: a.vence_em,
        concluida: a.concluida,
        autor: p?.nome_completo ?? null,
      };
    });
  } catch (e) {
    falha("listarAtividades", e, "");
    return [];
  }
}

export async function registrarAtividade(
  negocioId: string,
  tipo: string,
  conteudo: string,
): Promise<Resultado> {
  if (!conteudo.trim()) return { ok: false, demo: false, erro: "Escreva algo antes de salvar." };
  if (conteudo.length > 2000) return { ok: false, demo: false, erro: "Texto longo demais." };
  if (!TIPOS_ATIVIDADE.includes(tipo)) return { ok: false, demo: false, erro: "Tipo inválido." };

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "negocios", negocioId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db.from("atividades").insert({
      organizacao_id: sessao.organizacaoId,
      negocio_id: negocioId,
      tipo,
      conteudo: conteudo.trim(),
      usuario_id: sessao.usuarioId,
    });

    if (error) return falha("registrarAtividade", error, "Não foi possível registrar.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("registrarAtividade", e, "Não foi possível registrar.");
  }
}

/**
 * Agenda o próximo passo do negócio.
 *
 * É a mesma tabela do histórico, separada pelo `vence_em`: com data, é
 * compromisso futuro; sem data, é registro do que já aconteceu. Guardar as
 * duas coisas junto é o que deixa a linha do tempo do negócio contínua, do
 * que foi feito ao que ainda falta.
 */
export async function agendarAtividade(
  negocioId: string,
  tipo: string,
  titulo: string,
  venceEm: string,
): Promise<Resultado> {
  if (!titulo.trim()) return { ok: false, demo: false, erro: "Descreva o próximo passo." };
  if (titulo.length > 200) return { ok: false, demo: false, erro: "Título longo demais." };
  if (!TIPOS_ATIVIDADE.includes(tipo)) return { ok: false, demo: false, erro: "Tipo inválido." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(venceEm)) return { ok: false, demo: false, erro: "Data inválida." };

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "negocios", negocioId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Negócio não encontrado." };
    }

    const { error } = await db.from("atividades").insert({
      organizacao_id: sessao.organizacaoId,
      negocio_id: negocioId,
      tipo,
      titulo: titulo.trim(),
      /* Meio-dia, e não meia-noite: `vence_em` é timestamptz, e meia-noite
         em UTC cai no dia anterior no fuso de Brasília. */
      vence_em: `${venceEm}T12:00:00`,
      concluida: false,
      usuario_id: sessao.usuarioId,
    });

    if (error) return falha("agendarAtividade", error, "Não foi possível agendar.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("agendarAtividade", e, "Não foi possível agendar.");
  }
}

/** Marca o próximo passo como feito — ele sai da agenda e vira histórico. */
export async function concluirAtividade(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data, error } = await db
      .from("atividades")
      .update({ concluida: true })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .select("id");

    if (error) return falha("concluirAtividade", error, "Não foi possível concluir.");
    if (!data?.length) return { ok: false, demo: false, erro: "Atividade não encontrada." };
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("concluirAtividade", e, "Não foi possível concluir.");
  }
}

/* ── Etapas do funil ──────────────────────────────────────────────
   O desenho do funil é do comercial, não do desenvolvedor: cada
   agência vende num número diferente de passos, e quem fecha negócio
   precisa poder mudar isso sem abrir um chamado. */

export type DadosEtapa = {
  nome: string;
  probabilidade: number;
  cor: string;
  tipo: string;
};

const TIPOS_ETAPA = ["aberta", "ganho", "perdido"];

function validarEtapa(d: DadosEtapa): string | null {
  if (!d.nome.trim()) return "Dê um nome à etapa.";
  if (d.nome.trim().length > 60) return "O nome da etapa ficou longo demais.";
  if (!Number.isInteger(d.probabilidade) || d.probabilidade < 0 || d.probabilidade > 100) {
    return "A probabilidade vai de 0 a 100.";
  }
  if (!TIPOS_ETAPA.includes(d.tipo)) return "Tipo de etapa inválido.";
  /* Cor entra em `style` no quadro: sem conferir o formato, qualquer
     string vira valor de CSS. */
  if (d.cor && !/^#[0-9a-f]{6}$/i.test(d.cor)) return "Cor inválida.";
  return null;
}

export async function criarEtapa(funilId: string, d: DadosEtapa): Promise<Resultado> {
  const erro = validarEtapa(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await fkDaOrganizacao(db, "funis", funilId, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Funil não encontrado." };
    }

    /* Entra no fim do funil. `ordem` é um inteiro sem unicidade no banco,
       então basta passar do maior que existe. */
    const { data: ultima } = await db
      .from("etapas_funil")
      .select("ordem")
      .eq("funil_id", funilId)
      .eq("organizacao_id", sessao.organizacaoId)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await db.from("etapas_funil").insert({
      organizacao_id: sessao.organizacaoId,
      funil_id: funilId,
      nome: d.nome.trim(),
      probabilidade: d.probabilidade,
      cor: d.cor || null,
      tipo: d.tipo,
      ordem: ((ultima as { ordem: number } | null)?.ordem ?? -1) + 1,
    });

    if (error) return falha("criarEtapa", error, "Não foi possível criar a etapa.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("criarEtapa", e, "Não foi possível criar a etapa.");
  }
}

export async function atualizarEtapa(id: string, d: DadosEtapa): Promise<Resultado> {
  const erro = validarEtapa(d);
  if (erro) return { ok: false, demo: false, erro };

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "etapas_funil", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Etapa não encontrada." };
    }

    const { error } = await db
      .from("etapas_funil")
      .update({
        nome: d.nome.trim(),
        probabilidade: d.probabilidade,
        cor: d.cor || null,
        tipo: d.tipo,
      })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("atualizarEtapa", error, "Não foi possível salvar a etapa.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarEtapa", e, "Não foi possível salvar a etapa.");
  }
}

/** Quantos negócios estão parados em cada etapa do funil. */
export async function contarPorEtapa(): Promise<Record<string, number>> {
  const ctx = await contextoDeAcao("crm", "ver");
  if (ctx.estado !== "ok") return {};
  const { sessao, db } = ctx;

  const { data } = await db
    .from("negocios")
    .select("etapa_id")
    .eq("organizacao_id", sessao.organizacaoId)
    .eq("status", "aberto");

  const contagem: Record<string, number> = {};
  for (const n of (data ?? []) as { etapa_id: string }[]) {
    contagem[n.etapa_id] = (contagem[n.etapa_id] ?? 0) + 1;
  }
  return contagem;
}

/**
 * Apaga uma etapa, levando os negócios dela para outra.
 *
 * A chave estrangeira é `on delete restrict`, então o banco já recusaria
 * apagar uma etapa cheia — mas o erro cru não diz quantos negócios estão
 * lá nem para onde poderiam ir. Pedir o destino antes transforma isso numa
 * escolha: nenhum lead do comercial some porque alguém arrumou o funil.
 */
export async function excluirEtapa(id: string, destinoId: string | null): Promise<Resultado> {
  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    const { data: etapa } = await db
      .from("etapas_funil")
      .select("funil_id")
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId)
      .maybeSingle();

    const funilId = (etapa as { funil_id: string } | null)?.funil_id;
    if (!funilId) return { ok: false, demo: false, erro: "Etapa não encontrada." };

    /* Um funil sem etapa nenhuma não tem como receber negócio: o quadro
       fica vazio e o botão de novo negócio não sabe onde colocá-lo. */
    const { count: quantas } = await db
      .from("etapas_funil")
      .select("id", { count: "exact", head: true })
      .eq("funil_id", funilId)
      .eq("organizacao_id", sessao.organizacaoId);

    if ((quantas ?? 0) <= 1) {
      return { ok: false, demo: false, erro: "O funil precisa de pelo menos uma etapa." };
    }

    const { count: negocios } = await db
      .from("negocios")
      .select("id", { count: "exact", head: true })
      .eq("etapa_id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (negocios) {
      if (!destinoId) {
        return {
          ok: false,
          demo: false,
          erro: `Esta etapa tem ${negocios} ${negocios === 1 ? "negócio" : "negócios"}. Escolha para onde eles vão.`,
        };
      }
      if (destinoId === id) {
        return { ok: false, demo: false, erro: "Escolha uma etapa diferente." };
      }
      if (!(await fkDaOrganizacao(db, "etapas_funil", destinoId, sessao.organizacaoId))) {
        return { ok: false, demo: false, erro: "Etapa de destino não encontrada." };
      }

      const { error: erroMover } = await db
        .from("negocios")
        .update({ etapa_id: destinoId })
        .eq("etapa_id", id)
        .eq("organizacao_id", sessao.organizacaoId);

      if (erroMover) return falha("excluirEtapa", erroMover, "Não foi possível mover os negócios.");
    }

    const { error } = await db
      .from("etapas_funil")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("excluirEtapa", error, "Não foi possível excluir a etapa.");
    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirEtapa", e, "Não foi possível excluir a etapa.");
  }
}

/** Grava a nova ordem das colunas; recebe os ids na ordem em que ficam. */
export async function reordenarEtapas(ids: string[]): Promise<Resultado> {
  if (!Array.isArray(ids) || !ids.length) {
    return { ok: false, demo: false, erro: "Nada para reordenar." };
  }

  const ctx = await contextoDeAcao("crm", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    /* Confere a posse de todas antes de gravar qualquer uma: senão um id
       de fora no meio da lista deixaria o funil meio reordenado. */
    const { data: minhas } = await db
      .from("etapas_funil")
      .select("id")
      .eq("organizacao_id", sessao.organizacaoId)
      .in("id", ids);

    if ((minhas ?? []).length !== ids.length) {
      return { ok: false, demo: false, erro: "Etapa não encontrada." };
    }

    await Promise.all(
      ids.map((id, i) =>
        db
          .from("etapas_funil")
          .update({ ordem: i })
          .eq("id", id)
          .eq("organizacao_id", sessao.organizacaoId),
      ),
    );

    revalidatePath("/painel/crm");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("reordenarEtapas", e, "Não foi possível reordenar.");
  }
}
