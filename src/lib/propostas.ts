import "server-only";
import { criarClienteAdmin, criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_PROPOSTAS } from "@/lib/demo";
import { hoje } from "@/lib/tempo";

/**
 * O token público tem 16 bytes em hex (`encode(gen_random_bytes(16),'hex')`).
 * Validar o formato antes de consultar evita transformar a rota pública em
 * um oráculo para strings arbitrárias vindas da URL.
 */
export const TOKEN_VALIDO = /^[0-9a-f]{32}$/i;

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
      cliente_nome: p.cliente,
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
      valor_mensal: p.mensal,
      valor_setup: p.setup,
      total: p.mensal + p.setup,
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

/**
 * Uma proposta com validade no passado não é mais "enviada": mostrar o status
 * antigo faz a agência cobrar em cima de um preço que já venceu, e deixa o
 * botão de aceite vivo numa proposta que não vale mais.
 */
function statusEfetivo(status: string, validade: string | null) {
  if (!validade) return status;
  if (status !== "enviada" && status !== "visualizada") return status;
  return validade < hoje() ? "expirada" : status;
}

function daLinha(p: Linha): Proposta {
  const v = lerValores(p.condicoes);
  const mensal = v.mensal || Number(p.total ?? 0);
  return {
    id: p.id,
    numero: p.numero,
    titulo: p.titulo,
    status: statusEfetivo(p.status, p.validade),
    token: p.token_publico,
    cliente_nome: p.cliente_nome,
    cliente_logo_url: p.cliente_logo_url,
    introducao: p.introducao,
    escopo: p.escopo,
    condicoes: v.condicoes,
    valor_mensal: mensal,
    valor_setup: v.setup,
    /* Primeiro ciclo do contrato: o recorrente mais o setup. É esse o número
       que o cliente vê no aceite e o que o financeiro precisa projetar. */
    total: mensal + v.setup,
    validade: p.validade,
    criado_em: p.criado_em,
  };
}

const CAMPOS =
  "id, numero, titulo, status, token_publico, cliente_nome, cliente_logo_url, introducao, escopo, condicoes, total, validade, criado_em";

export async function carregarPropostas(): Promise<Lista> {
  if (modoDemonstracao()) return demo();

  try {
    const sessao = await obterSessao();
    if (!sessao) return { propostas: [], demo: false };

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("propostas")
      .select(CAMPOS)
      .eq("organizacao_id", sessao.organizacaoId)
      .order("criado_em", { ascending: false });

    /* Com banco ligado, lista vazia é lista vazia. Cair na demonstração aqui
       mostraria propostas que não existem — e o construtor tentaria editar
       ids fictícios. */
    if (error) {
      registrarFalha("carregarPropostas", error);
      return { propostas: [], demo: false };
    }
    return { propostas: (data as unknown as Linha[]).map(daLinha), demo: false };
  } catch (e) {
    registrarFalha("carregarPropostas", e);
    return { propostas: [], demo: false };
  }
}

/**
 * Busca a proposta pelo token público. Sem sessão: é a rota que o cliente
 * abre. O token é aleatório de 16 bytes, gerado pelo banco.
 */
export async function carregarPorToken(token: string): Promise<Proposta | null> {
  if (modoDemonstracao()) {
    return demo().propostas.find((p) => p.token === token) ?? null;
  }
  if (!TOKEN_VALIDO.test(token)) return null;

  /* Service role de propósito: quem abre este link não tem sessão, e a RLS
     de `propostas` só libera leitura para a equipe da organização. Com o
     cliente anônimo, todo link enviado a prospect caía em 404 — e o `catch`
     engolia o motivo. O filtro pelo token, que é o segredo, é o que autoriza. */
  try {
    const db = criarClienteAdmin();
    const { data, error } = await db
      .from("propostas")
      .select(CAMPOS)
      .eq("token_publico", token)
      .maybeSingle();

    if (error) {
      registrarFalha("carregarPorToken", error);
      return null;
    }
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
  } catch (e) {
    registrarFalha("carregarPorToken", e);
    return null;
  }
}
