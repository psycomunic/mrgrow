import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import type { Acao, Gatilho } from "@/lib/automacoes-catalogo";

/**
 * Motor de automações.
 *
 * Fluxo: um gatilho é disparado (por evento ou pelo cron) → as automações
 * ativas com aquele gatilho são avaliadas contra `condicoes` → as `acoes`
 * são executadas em sequência e o resultado é registrado.
 */

/* Os catálogos e os tipos de gatilho/ação moram em `automacoes-catalogo.ts`:
   o construtor da tela roda no navegador e não pode importar este arquivo,
   que é server-only. Reexportados aqui para não mexer em quem já importa o
   motor. */
export type { Acao, Gatilho, TipoAcao } from "@/lib/automacoes-catalogo";
export { CATALOGO_ACOES, CATALOGO_GATILHOS } from "@/lib/automacoes-catalogo";

export type Contexto = Record<string, unknown>;

/**
 * Guarda de SSRF para a ação `webhook`.
 *
 * A URL vem do JSON de `automacoes.acoes`, que qualquer membro da equipe
 * consegue escrever, e o `fetch` roda com service role dentro da rede da
 * função. Sem esta checagem, apontar a automação para
 * `http://169.254.169.254/latest/meta-data/` devolve credenciais de
 * infraestrutura dentro de `execucoes_automacao.resultado`.
 *
 * Defina WEBHOOK_HOSTS_PERMITIDOS ("hooks.slack.com,api.exemplo.com") para
 * restringir ainda mais; sem a variável, vale a regra de bloqueio abaixo.
 */
export function webhookPermitido(url: string): boolean {
  let alvo: URL;
  try {
    alvo = new URL(url);
  } catch {
    return false;
  }

  if (alvo.protocol !== "https:") return false;

  const host = alvo.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return false;
  // Literal IPv6 (inclui ::1 e fc00::/7) — nada de endereço cru.
  if (host.includes(":")) return false;

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    const privado =
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      (a === 100 && b >= 64 && b <= 127);
    if (privado) return false;
  }

  const permitidos = (process.env.WEBHOOK_HOSTS_PERMITIDOS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  if (permitidos.length) return permitidos.some((p) => host === p || host.endsWith(`.${p}`));
  return true;
}

function condicoesAtendidas(condicoes: Contexto, contexto: Contexto) {
  return Object.entries(condicoes ?? {}).every(([chave, esperado]) => {
    if (["dias_antes", "dias_apos", "horas", "janela_dias", "operador", "valor", "indicador"].includes(chave)) {
      return true; // avaliadas pelo job que dispara o gatilho
    }
    return contexto[chave] === undefined || contexto[chave] === esperado;
  });
}

async function executarAcao(
  db: ReturnType<typeof criarClienteAdmin>,
  organizacaoId: string,
  acao: Acao,
  contexto: Contexto,
) {
  switch (acao.tipo) {
    case "notificar":
      await db.from("notificacoes").insert({
        organizacao_id: organizacaoId,
        usuario_id: contexto.responsavel_id ?? null,
        titulo: acao.titulo ?? "Automação disparada",
        mensagem: acao.mensagem ?? JSON.stringify(contexto).slice(0, 400),
        tipo: "info",
        url: contexto.url ?? null,
      });
      return { ok: true };

    case "criar_tarefa": {
      const vence = acao.prazo_minutos
        ? new Date(Date.now() + acao.prazo_minutos * 60_000).toISOString().slice(0, 10)
        : null;
      await db.from("tarefas").insert({
        organizacao_id: organizacaoId,
        cliente_id: contexto.cliente_id ?? null,
        titulo: acao.titulo,
        prioridade: (acao.prioridade as string) ?? "media",
        responsavel_id: contexto.responsavel_id ?? null,
        vence_em: vence,
        status: "backlog",
      });
      return { ok: true };
    }

    case "atualizar_saude_cliente": {
      if (!contexto.cliente_id) return { ok: false, motivo: "sem cliente no contexto" };
      const { data } = await db.from("clientes").select("saude").eq("id", contexto.cliente_id).single();
      const nova = Math.max(0, Math.min(100, Number(data?.saude ?? 80) + acao.delta));
      await db.from("clientes").update({ saude: nova }).eq("id", contexto.cliente_id);
      return { ok: true, saude: nova };
    }

    case "mover_etapa":
      if (!contexto.negocio_id) return { ok: false, motivo: "sem negócio no contexto" };
      await db.from("negocios").update({ etapa_id: acao.etapa_id }).eq("id", contexto.negocio_id);
      return { ok: true };

    case "webhook": {
      if (!webhookPermitido(acao.url)) {
        return { ok: false, motivo: "URL de webhook bloqueada (use https e um host público)" };
      }
      const r = await fetch(acao.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...acao.carga, contexto }),
        // Redirect manual: um 302 para um host interno burlaria a guarda acima.
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
      return { ok: r.ok, status: r.status };
    }

    case "email":
    case "whatsapp":
      // Conecte aqui o Resend / WhatsApp Cloud API.
      // Mantido como fila para não travar o motor sem credenciais.
      await db.from("eventos_webhook").insert({
        organizacao_id: organizacaoId,
        evento: `fila.${acao.tipo}`,
        carga: { template: acao.template, contexto },
      });
      return { ok: true, enfileirado: true };

    default:
      return { ok: false, motivo: "ação não implementada" };
  }
}

/**
 * Dispara todas as automações ativas de um gatilho.
 *
 * `chaveDedupe` é o que impede o cron horário de reprocessar o mesmo fato 24
 * vezes por dia: passe algo estável e único por fato+dia (por exemplo
 * `fatura_atrasada:<id>:2026-08-26`) e a reentrada é descartada pelo índice
 * único de `execucoes_automacao`. Eventos que devem disparar sempre — um lead
 * novo, uma baixa de fatura — simplesmente não passam a chave.
 */
export async function dispararGatilho(
  organizacaoId: string,
  gatilho: Gatilho,
  contexto: Contexto = {},
  opcoes: { chaveDedupe?: string } = {},
) {
  const db = criarClienteAdmin();
  const { data: automacoes } = await db
    .from("automacoes")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .eq("gatilho", gatilho)
    .eq("ativa", true);

  const resultados: Array<Record<string, unknown>> = [];

  for (const automacao of automacoes ?? []) {
    const inicio = Date.now();
    const chave = opcoes.chaveDedupe ? `${opcoes.chaveDedupe}:${automacao.id}` : null;

    /* Reserva antes de executar: se a chave já existe, este fato já foi
       tratado e não há nada a fazer. O índice único é a barreira, então duas
       execuções concorrentes também não passam as duas. */
    if (chave) {
      const { error: erroReserva } = await db
        .from("execucoes_automacao")
        .insert({
          organizacao_id: organizacaoId,
          automacao_id: automacao.id,
          status: "ignorada",
          contexto,
          chave_dedupe: chave,
        });
      if (erroReserva) {
        if ((erroReserva as { code?: string }).code === "23505") {
          resultados.push({ automacao: automacao.nome, ok: true, repetido: true });
          continue;
        }
        console.error("[automacoes] falha ao reservar execução", erroReserva);
      }
    }

    if (!condicoesAtendidas(automacao.condicoes ?? {}, contexto)) {
      await db.from("execucoes_automacao").insert({
        organizacao_id: organizacaoId,
        automacao_id: automacao.id,
        status: "ignorada",
        contexto,
      });
      continue;
    }

    try {
      const saidas: unknown[] = [];
      for (const acao of (automacao.acoes ?? []) as Acao[]) {
        saidas.push(await executarAcao(db, organizacaoId, acao, contexto));
      }
      if (chave) {
        await db
          .from("execucoes_automacao")
          .update({ status: "sucesso", resultado: { saidas }, duracao_ms: Date.now() - inicio })
          .eq("chave_dedupe", chave);
      } else {
        await db.from("execucoes_automacao").insert({
          organizacao_id: organizacaoId,
          automacao_id: automacao.id,
          status: "sucesso",
          contexto,
          resultado: { saidas },
          duracao_ms: Date.now() - inicio,
        });
      }
      await db
        .from("automacoes")
        .update({ execucoes: (automacao.execucoes ?? 0) + 1, ultima_execucao_em: new Date().toISOString() })
        .eq("id", automacao.id);
      resultados.push({ automacao: automacao.nome, ok: true });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      if (chave) {
        await db
          .from("execucoes_automacao")
          .update({ status: "falha", erro: mensagem, duracao_ms: Date.now() - inicio })
          .eq("chave_dedupe", chave);
      } else {
        await db.from("execucoes_automacao").insert({
          organizacao_id: organizacaoId,
          automacao_id: automacao.id,
          status: "falha",
          contexto,
          erro: mensagem,
          duracao_ms: Date.now() - inicio,
        });
      }
      resultados.push({ automacao: automacao.nome, ok: false, erro: mensagem });
    }
  }

  return resultados;
}
