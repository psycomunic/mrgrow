import { criarClienteAdmin } from "@/lib/supabase/servidor";

/**
 * Motor de automações.
 *
 * Fluxo: um gatilho é disparado (por evento ou pelo cron) → as automações
 * ativas com aquele gatilho são avaliadas contra `condicoes` → as `acoes`
 * são executadas em sequência e o resultado é registrado.
 */

export type Gatilho =
  | "lead_criado"
  | "negocio_mudou_etapa"
  | "negocio_ganho"
  | "negocio_perdido"
  | "fatura_vencendo"
  | "fatura_atrasada"
  | "fatura_paga"
  | "metrica_fora_da_meta"
  | "conta_sem_veiculacao"
  | "orcamento_estourado"
  | "tarefa_atrasada"
  | "contrato_vencendo"
  | "agendado";

export type Acao =
  | { tipo: "notificar"; para: string; titulo?: string; mensagem?: string }
  | { tipo: "email"; template: string; para?: string }
  | { tipo: "whatsapp"; template: string; para?: string }
  | { tipo: "criar_tarefa"; titulo: string; prazo_minutos?: number; prioridade?: string }
  | { tipo: "criar_cliente" }
  | { tipo: "criar_projeto"; modelo?: string }
  | { tipo: "mover_etapa"; etapa_id: string }
  | { tipo: "atualizar_saude_cliente"; delta: number }
  | { tipo: "webhook"; url: string; carga?: Record<string, unknown> };

export type Contexto = Record<string, unknown>;

export const CATALOGO_GATILHOS: Array<{ valor: Gatilho; rotulo: string; descricao: string }> = [
  { valor: "lead_criado", rotulo: "Lead recebido", descricao: "Quando um lead entra pelo site, formulário ou integração." },
  { valor: "negocio_mudou_etapa", rotulo: "Negócio mudou de etapa", descricao: "Ao arrastar um card no funil." },
  { valor: "negocio_ganho", rotulo: "Negócio ganho", descricao: "Ao marcar um negócio como ganho." },
  { valor: "negocio_perdido", rotulo: "Negócio perdido", descricao: "Ao marcar um negócio como perdido." },
  { valor: "fatura_vencendo", rotulo: "Fatura vencendo", descricao: "N dias antes do vencimento." },
  { valor: "fatura_atrasada", rotulo: "Fatura atrasada", descricao: "N dias após o vencimento sem pagamento." },
  { valor: "fatura_paga", rotulo: "Fatura paga", descricao: "Baixa confirmada, manual ou pelo gateway." },
  { valor: "metrica_fora_da_meta", rotulo: "Métrica fora da meta", descricao: "ROAS, CPL, CPA ou CTR fora do alvo." },
  { valor: "conta_sem_veiculacao", rotulo: "Conta sem veiculação", descricao: "Investimento zerado por N horas." },
  { valor: "orcamento_estourado", rotulo: "Orçamento estourado", descricao: "Gasto acima do previsto no mês." },
  { valor: "tarefa_atrasada", rotulo: "Tarefa atrasada", descricao: "Prazo vencido sem conclusão." },
  { valor: "contrato_vencendo", rotulo: "Contrato vencendo", descricao: "N dias antes do fim do contrato." },
  { valor: "agendado", rotulo: "Agendado", descricao: "Execução por horário (cron)." },
];

export const CATALOGO_ACOES = [
  { tipo: "notificar", rotulo: "Notificar na plataforma" },
  { tipo: "email", rotulo: "Enviar e-mail" },
  { tipo: "whatsapp", rotulo: "Enviar WhatsApp" },
  { tipo: "criar_tarefa", rotulo: "Criar tarefa" },
  { tipo: "criar_cliente", rotulo: "Criar cliente" },
  { tipo: "criar_projeto", rotulo: "Criar projeto a partir de modelo" },
  { tipo: "mover_etapa", rotulo: "Mover no funil" },
  { tipo: "atualizar_saude_cliente", rotulo: "Ajustar saúde do cliente" },
  { tipo: "webhook", rotulo: "Chamar webhook" },
] as const;

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
      const r = await fetch(acao.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...acao.carga, contexto }),
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

/** Dispara todas as automações ativas de um gatilho. */
export async function dispararGatilho(
  organizacaoId: string,
  gatilho: Gatilho,
  contexto: Contexto = {},
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
      await db.from("execucoes_automacao").insert({
        organizacao_id: organizacaoId,
        automacao_id: automacao.id,
        status: "sucesso",
        contexto,
        resultado: { saidas },
        duracao_ms: Date.now() - inicio,
      });
      await db
        .from("automacoes")
        .update({ execucoes: (automacao.execucoes ?? 0) + 1, ultima_execucao_em: new Date().toISOString() })
        .eq("id", automacao.id);
      resultados.push({ automacao: automacao.nome, ok: true });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      await db.from("execucoes_automacao").insert({
        organizacao_id: organizacaoId,
        automacao_id: automacao.id,
        status: "falha",
        contexto,
        erro: mensagem,
        duracao_ms: Date.now() - inicio,
      });
      resultados.push({ automacao: automacao.nome, ok: false, erro: mensagem });
    }
  }

  return resultados;
}
