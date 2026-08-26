"use server";

import { revalidatePath } from "next/cache";
import { contextoDeAcao, falha, fkDaOrganizacao, pertence, type Resultado } from "@/lib/acoes";
import { webhookPermitido } from "@/lib/automacoes";
import {
  acaoDoCatalogo,
  CAMPOS_DA_ACAO,
  gatilhoDoCatalogo,
  type Acao,
  type TipoAcao,
} from "@/lib/automacoes-catalogo";

export type { Resultado };

export type DadosAutomacao = {
  nome: string;
  gatilho: string;
  acoes: Acao[];
};

const MAX_ACOES = 10;

type Saneadas = { acoes: Acao[]; etapas: string[] };

/**
 * Reconstrói cada ação a partir dos campos que o catálogo declara.
 *
 * Não é só validação: o objeto gravado é montado de novo, campo por campo. O
 * conteúdo vem do navegador e vai para uma coluna jsonb que o motor executa
 * com service role — sem reconstruir, qualquer chave extra enviada na
 * requisição fica guardada e viaja junto no payload do webhook.
 */
function sanear(bruto: unknown): Saneadas | { erro: string } {
  if (!Array.isArray(bruto) || bruto.length === 0) {
    return { erro: "Adicione ao menos uma ação — sem isso a automação não faz nada." };
  }
  if (bruto.length > MAX_ACOES) {
    return { erro: `Máximo de ${MAX_ACOES} ações por automação.` };
  }

  const acoes: Acao[] = [];
  const etapas: string[] = [];

  for (const item of bruto) {
    const cru = (item ?? {}) as Record<string, unknown>;
    const catalogo = acaoDoCatalogo(typeof cru.tipo === "string" ? cru.tipo : null);
    if (!catalogo) return { erro: "Há uma ação de tipo desconhecido na lista." };
    if (!catalogo.disponivel) {
      return { erro: `A ação "${catalogo.rotulo}" ainda não é executada pelo motor.` };
    }

    const tipo = catalogo.tipo as TipoAcao;
    const limpa: Record<string, unknown> = { tipo };

    for (const campo of CAMPOS_DA_ACAO[tipo]) {
      const valor = cru[campo.chave];

      if (campo.tipo === "numero" || campo.tipo === "prazo") {
        if (valor === undefined || valor === null || valor === "") {
          if (campo.obrigatorio) return { erro: `${campo.rotulo}: informe um valor em "${catalogo.rotulo}".` };
          continue;
        }
        const n = Number(valor);
        if (!Number.isFinite(n)) return { erro: `${campo.rotulo}: valor numérico inválido.` };
        const min = campo.minimo ?? 0;
        const max = campo.maximo ?? 525_600;
        if (n < min || n > max) return { erro: `${campo.rotulo}: use um valor entre ${min} e ${max}.` };
        limpa[campo.chave] = campo.tipo === "prazo" ? Math.round(n) : n;
        continue;
      }

      const texto = typeof valor === "string" ? valor.trim() : "";
      if (!texto) {
        if (campo.obrigatorio) return { erro: `${campo.rotulo}: preencha em "${catalogo.rotulo}".` };
        continue;
      }
      if (texto.length > (campo.limite ?? 200)) {
        return { erro: `${campo.rotulo}: texto longo demais.` };
      }
      if (campo.tipo === "url" && !webhookPermitido(texto)) {
        return { erro: "Webhook recusado: use https e um endereço público." };
      }
      if (campo.tipo === "selecao" && !campo.opcoes?.some((o) => o.valor === texto)) {
        return { erro: `${campo.rotulo}: opção inválida.` };
      }
      if (campo.tipo === "etapa") etapas.push(texto);

      limpa[campo.chave] = texto;
    }

    /* `carga` não é editável na tela, mas automações vindas do seed ou de um
       import podem ter uma. Salvar sem ela apagaria o payload em silêncio. */
    if (tipo === "webhook" && cru.carga && typeof cru.carga === "object" && !Array.isArray(cru.carga)) {
      limpa.carga = cru.carga;
    }

    acoes.push(limpa as Acao);
  }

  return { acoes, etapas };
}

function validarNome(nome: string): string | null {
  const limpo = nome.trim();
  if (!limpo) return "Dê um nome à automação — é assim que a equipe a encontra.";
  if (limpo.length > 120) return "O nome ficou longo demais.";
  return null;
}

type Preparada = { nome: string; gatilho: string; acoes: Acao[]; etapas: string[] };

function preparar(d: DadosAutomacao): Preparada | { erro: string } {
  const erroNome = validarNome(d.nome);
  if (erroNome) return { erro: erroNome };
  if (!gatilhoDoCatalogo(d.gatilho)) return { erro: "Escolha um gatilho válido." };

  const saneadas = sanear(d.acoes);
  if ("erro" in saneadas) return saneadas;

  return { nome: d.nome.trim(), gatilho: d.gatilho, ...saneadas };
}

export async function criarAutomacao(d: DadosAutomacao): Promise<Resultado> {
  const pronta = preparar(d);
  if ("erro" in pronta) return { ok: false, demo: false, erro: pronta.erro };

  const ctx = await contextoDeAcao("automacoes", "criar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    for (const etapaId of pronta.etapas) {
      if (!(await fkDaOrganizacao(db, "etapas_funil", etapaId, sessao.organizacaoId))) {
        return { ok: false, demo: false, erro: "A etapa escolhida não é do seu funil." };
      }
    }

    const { error } = await db.from("automacoes").insert({
      organizacao_id: sessao.organizacaoId,
      nome: pronta.nome,
      gatilho: pronta.gatilho,
      acoes: pronta.acoes,
      ativa: true,
      criado_por: sessao.usuarioId,
    });

    if (error) return falha("criarAutomacao", error, "Não foi possível criar a automação.");
    revalidatePath("/painel/automacoes");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("criarAutomacao", e, "Não foi possível criar a automação.");
  }
}

/**
 * Salva nome, gatilho e ações. `condicoes` e `agendamento` ficam de fora de
 * propósito: o construtor não edita esses campos e um update com o objeto
 * inteiro zeraria as condições de automações criadas pelo seed.
 */
export async function atualizarAutomacao(id: string, d: DadosAutomacao): Promise<Resultado> {
  const pronta = preparar(d);
  if ("erro" in pronta) return { ok: false, demo: false, erro: pronta.erro };

  const ctx = await contextoDeAcao("automacoes", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "automacoes", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Automação não encontrada." };
    }
    for (const etapaId of pronta.etapas) {
      if (!(await fkDaOrganizacao(db, "etapas_funil", etapaId, sessao.organizacaoId))) {
        return { ok: false, demo: false, erro: "A etapa escolhida não é do seu funil." };
      }
    }

    const { error } = await db
      .from("automacoes")
      .update({ nome: pronta.nome, gatilho: pronta.gatilho, acoes: pronta.acoes })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("atualizarAutomacao", error, "Não foi possível salvar a automação.");
    revalidatePath("/painel/automacoes");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("atualizarAutomacao", e, "Não foi possível salvar a automação.");
  }
}

export async function alternarAtiva(id: string, ativa: boolean): Promise<Resultado> {
  const ctx = await contextoDeAcao("automacoes", "editar");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "automacoes", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Automação não encontrada." };
    }

    const { error } = await db
      .from("automacoes")
      .update({ ativa })
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) {
      return falha("alternarAtiva", error, ativa ? "Não foi possível ativar." : "Não foi possível pausar.");
    }
    revalidatePath("/painel/automacoes");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("alternarAtiva", e, "Não foi possível mudar o estado da automação.");
  }
}

export async function excluirAutomacao(id: string): Promise<Resultado> {
  const ctx = await contextoDeAcao("automacoes", "excluir");
  if (ctx.estado === "demo") return { ok: true, demo: true };
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao, db } = ctx;

  try {
    if (!(await pertence(db, "automacoes", id, sessao.organizacaoId))) {
      return { ok: false, demo: false, erro: "Automação não encontrada." };
    }

    const { error } = await db
      .from("automacoes")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", sessao.organizacaoId);

    if (error) return falha("excluirAutomacao", error, "Não foi possível excluir.");
    revalidatePath("/painel/automacoes");
    return { ok: true, demo: false };
  } catch (e) {
    return falha("excluirAutomacao", e, "Não foi possível excluir.");
  }
}
