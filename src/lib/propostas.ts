import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { supabaseConfigurado } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_PROPOSTAS } from "@/lib/demo";

export type Proposta = {
  id: string;
  numero: string;
  titulo: string;
  status: string;
  token: string;
  cliente_nome: string | null;
  cliente_logo_url: string | null;
  introducao: string | null;
  escopo: string | null;
  condicoes: string | null;
  valor_mensal: number;
  valor_setup: number;
  total: number;
  validade: string | null;
  criado_em: string;
};

export type Lista = { propostas: Proposta[]; demo: boolean };

/* O schema guarda um `total` só. A proposta da agência é sempre
   recorrente + setup, então os dois vivem em `condicoes` como JSON e o
   `total` fica com o recorrente, que é o que a lista ordena. */
function lerValores(condicoes: string | null) {
  try {
    const j = JSON.parse(condicoes ?? "{}");
    return {
      mensal: Number(j.mensal ?? 0),
      setup: Number(j.setup ?? 0),
      condicoes: typeof j.texto === "string" ? j.texto : null,
    };
  } catch {
    return { mensal: 0, setup: 0, condicoes: condicoes };
  }
}

export function escreverCondicoes(mensal: number, setup: number, texto: string) {
  return JSON.stringify({ mensal, setup, texto });
}

function demo(): Lista {
  return {
    propostas: DEMO_PROPOSTAS.map((p, i) => ({
      id: p.id,
      numero: p.numero,
      titulo: p.titulo,
      status: p.status,
      token: `demo-${i + 1}`,
      cliente_nome: p.titulo.split("·").pop()?.trim() ?? null,
      cliente_logo_url: null,
      introducao:
        "Sua conta hoje investe sem enxergar o retorno com clareza. Esta proposta organiza a operação inteira para que cada real investido seja rastreado até a venda.",
      escopo: [
        "Auditoria completa de conta, oferta e margem",
        "Rastreamento GA4, GTM, Pixel e API de Conversões",
        "Estrutura de campanhas por temperatura de público",
        "Matriz de criativos com teste semanal",
        "Landing page própria com teste A/B",
        "Painel aberto com investimento e retorno em tempo real",
      ].join("\n"),
      condicoes: "Contrato de 3 meses iniciais. Depois disso, mensal.",
      valor_mensal: p.total,
      valor_setup: 0,
      total: p.total,
      validade: p.validade,
      criado_em: new Date().toISOString(),
    })),
    demo: true,
  };
}

type Linha = {
  id: string;
  numero: string;
  titulo: string;
  status: string;
  token_publico: string;
  cliente_nome: string | null;
  cliente_logo_url: string | null;
  introducao: string | null;
  escopo: string | null;
  condicoes: string | null;
  total: number | string | null;
  validade: string | null;
  criado_em: string;
};

function daLinha(p: Linha): Proposta {
  const v = lerValores(p.condicoes);
  return {
    id: p.id,
    numero: p.numero,
    titulo: p.titulo,
    status: p.status,
    token: p.token_publico,
    cliente_nome: p.cliente_nome,
    cliente_logo_url: p.cliente_logo_url,
    introducao: p.introducao,
    escopo: p.escopo,
    condicoes: v.condicoes,
    valor_mensal: v.mensal || Number(p.total ?? 0),
    valor_setup: v.setup,
    total: Number(p.total ?? 0),
    validade: p.validade,
    criado_em: p.criado_em,
  };
}

const CAMPOS =
  "id, numero, titulo, status, token_publico, cliente_nome, cliente_logo_url, introducao, escopo, condicoes, total, validade, criado_em";

export async function carregarPropostas(): Promise<Lista> {
  if (!supabaseConfigurado()) return demo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return demo();

    const db = await criarClienteServidor();
    const { data } = await db
      .from("propostas")
      .select(CAMPOS)
      .eq("organizacao_id", sessao.organizacaoId)
      .order("criado_em", { ascending: false });

    if (!data) return demo();
    return { propostas: (data as unknown as Linha[]).map(daLinha), demo: false };
  } catch {
    return demo();
  }
}

/**
 * Busca a proposta pelo token público. Sem sessão: é a rota que o cliente
 * abre. O token é aleatório de 16 bytes, gerado pelo banco.
 */
export async function carregarPorToken(token: string): Promise<Proposta | null> {
  if (!supabaseConfigurado()) {
    return demo().propostas.find((p) => p.token === token) ?? null;
  }

  try {
    const db = await criarClienteServidor();
    const { data } = await db
      .from("propostas")
      .select(CAMPOS)
      .eq("token_publico", token)
      .maybeSingle();

    if (!data) return null;
    const proposta = daLinha(data as unknown as Linha);

    // Carimba a primeira abertura, sem sobrescrever depois.
    if (proposta.status === "enviada") {
      await db
        .from("propostas")
        .update({ status: "visualizada", visualizada_em: new Date().toISOString() })
        .eq("id", proposta.id)
        .is("visualizada_em", null);
    }

    return proposta;
  } catch {
    return null;
  }
}
