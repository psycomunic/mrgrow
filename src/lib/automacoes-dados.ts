import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_AUTOMACOES, DEMO_ETAPAS } from "@/lib/demo";
import type { Acao, Gatilho } from "@/lib/automacoes-catalogo";

export type Automacao = {
  id: string;
  nome: string;
  gatilho: Gatilho;
  ativa: boolean;
  acoes: Acao[];
  execucoes: number;
  ultimaExecucao: string | null;
};

export type Automacoes = {
  automacoes: Automacao[];
  /** Sem Supabase a tela roda com regras fictícias e nada persiste. */
  demo: boolean;
};

/**
 * As fixtures de `demo.ts` guardam só nome, gatilho e contador — a régua de
 * ações fica aqui para a demonstração mostrar automações completas sem que o
 * arquivo de fixtures precise conhecer o formato do motor.
 */
const ACOES_DEMO: Record<string, Acao[]> = {
  a1: [{ tipo: "whatsapp", template: "lead_novo" }, { tipo: "notificar", titulo: "Lead novo na fila", mensagem: "Fale com o lead nos primeiros 5 minutos." }],
  a2: [{ tipo: "whatsapp", template: "cobranca_previa" }],
  a3: [{ tipo: "notificar", titulo: "Fatura atrasada", mensagem: "Cobrança vencida sem baixa. Acione o cliente hoje." }],
  a4: [
    { tipo: "notificar", titulo: "Conta sem veiculação", mensagem: "Investimento zerado há 24h." },
    { tipo: "criar_tarefa", titulo: "Investigar conta parada", prazo_minutos: 240, prioridade: "urgente" },
  ],
  a5: [{ tipo: "criar_tarefa", titulo: "Revisar campanhas fora da meta", prazo_minutos: 1440, prioridade: "alta" }],
  a6: [{ tipo: "criar_tarefa", titulo: "Abrir onboarding do cliente novo", prazo_minutos: 1440, prioridade: "alta" }],
  a7: [{ tipo: "criar_tarefa", titulo: "Preparar renovação de contrato", prazo_minutos: 10080, prioridade: "media" }],
};

function demonstracao(): Automacoes {
  return {
    automacoes: DEMO_AUTOMACOES.map((a) => ({
      id: a.id,
      nome: a.nome,
      gatilho: a.gatilho as Gatilho,
      ativa: a.ativa,
      acoes: ACOES_DEMO[a.id] ?? [],
      execucoes: a.execucoes,
      ultimaExecucao: null,
    })),
    demo: true,
  };
}

type Linha = {
  id: string;
  nome: string;
  gatilho: string;
  ativa: boolean;
  acoes: unknown;
  execucoes: number | null;
  ultima_execucao_em: string | null;
};

const VAZIO: Automacoes = { automacoes: [], demo: false };

/**
 * Automações da organização.
 *
 * Com banco ligado, erro é erro: a lista volta vazia e a falha vai para o log.
 * Cair na demonstração aqui faria a tela oferecer "Editar" em regras que não
 * existem, e a ação falharia depois no servidor.
 */
export async function carregarAutomacoes(): Promise<Automacoes> {
  if (modoDemonstracao()) return demonstracao();

  try {
    const sessao = await obterSessao();
    if (!sessao) return VAZIO;

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("automacoes")
      .select("id, nome, gatilho, ativa, acoes, execucoes, ultima_execucao_em")
      .eq("organizacao_id", sessao.organizacaoId)
      .order("ativa", { ascending: false })
      .order("criado_em", { ascending: false })
      .limit(100);

    if (error) {
      registrarFalha("carregarAutomacoes", error);
      return VAZIO;
    }

    return {
      automacoes: ((data ?? []) as unknown as Linha[]).map((a) => ({
        id: a.id,
        nome: a.nome,
        gatilho: a.gatilho as Gatilho,
        ativa: a.ativa,
        // `acoes` é jsonb: qualquer coisa pode estar lá dentro.
        acoes: Array.isArray(a.acoes) ? (a.acoes as Acao[]) : [],
        execucoes: Number(a.execucoes ?? 0),
        ultimaExecucao: a.ultima_execucao_em,
      })),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarAutomacoes", e);
    return VAZIO;
  }
}

/**
 * Etapas do funil para a ação "mover no funil".
 *
 * Consulta própria em vez de `carregarFunil()`: aquele traz os negócios todos
 * junto, e aqui só o nome de cada etapa preenche o seletor.
 */
export async function listarEtapas(): Promise<{ id: string; nome: string }[]> {
  if (modoDemonstracao()) return DEMO_ETAPAS.map((e) => ({ id: e.id, nome: e.nome }));

  try {
    const sessao = await obterSessao();
    if (!sessao) return [];

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("etapas_funil")
      .select("id, nome")
      .eq("organizacao_id", sessao.organizacaoId)
      .order("ordem");

    if (error) {
      registrarFalha("listarEtapas", error);
      return [];
    }
    return (data ?? []) as { id: string; nome: string }[];
  } catch (e) {
    registrarFalha("listarEtapas", e);
    return [];
  }
}
