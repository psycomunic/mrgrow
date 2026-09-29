import "server-only";
import {
  criarClienteAdmin,
  criarClienteServidor,
} from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_PROPOSTAS } from "@/lib/demo";
import { hoje } from "@/lib/tempo";
import { prazoValido, PRAZO_PADRAO } from "@/lib/rotulos";

/**
 * O token público tem 16 bytes em hex (`encode(gen_random_bytes(16),'hex')`).
 * Validar o formato antes de consultar evita transformar a rota pública em
 * um oráculo para strings arbitrárias vindas da URL.
 */
export const TOKEN_VALIDO = /^[0-9a-f]{32}$/i;

/** Um serviço escolhido para esta proposta, com o preço negociado. */
export type ServicoEscolhido = { id: string; fee: number };

/** Um bloco de escopo escrito à mão, quando o catálogo não cobre. */
export type Frente = { frente: string; itens: string[] };

/**
 * O conteúdo narrativo da proposta.
 *
 * Mora no mesmo JSON de `condicoes` que já guardava os valores. É o
 * caminho sem migração, e a coluna já era um saco de campos por decisão
 * anterior — abrir uma tabela nova para texto que só esta tela lê seria
 * cerimônia sem ganho.
 *
 * Tudo é opcional e tudo tem lista vazia como padrão: proposta gravada
 * antes destes campos existirem continua abrindo, só com menos telas.
 */
export type Narrativa = {
  /** O que foi encontrado na conta do cliente. Abre a argumentação. */
  diagnostico: string[];
  /** Serviços do catálogo, com o fee de cada um. */
  servicos: ServicoEscolhido[];
  /** Escopo em blocos, para o que o catálogo não cobre. */
  frentes: Frente[];
  /** Condições negociadas nesta proposta, acima das de sempre. */
  condicoesExtras: string[];
  /** O que acontece depois do sim. */
  proximosPassos: string[];
};

export const NARRATIVA_VAZIA: Narrativa = {
  diagnostico: [],
  servicos: [],
  frentes: [],
  condicoesExtras: [],
  proximosPassos: [],
};

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
  /** Duração do contrato em meses; é ela que multiplica o valor mensal. */
  meses_contrato: number;
  total: number;
  validade: string | null;
  criado_em: string;
  organizacao_id: string;
  narrativa: Narrativa;
};

export type Lista = { propostas: Proposta[]; demo: boolean };

/* O schema guarda um `total` só. A proposta da agência é sempre
   recorrente + setup, então os dois vivem em `condicoes` como JSON e o
   `total` fica com o recorrente, que é o que a lista ordena. */
/** Aceita só string não vazia, e joga fora o resto do que vier no JSON. */
function listaDeTexto(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
}

function lerNarrativa(j: Record<string, unknown>): Narrativa {
  const servicos = Array.isArray(j.servicos)
    ? j.servicos
        .filter(
          (s): s is Record<string, unknown> =>
            typeof s === "object" && s !== null,
        )
        .map((s) => ({ id: String(s.id ?? ""), fee: Number(s.fee ?? 0) }))
        .filter((s) => s.id.length > 0)
    : [];

  const frentes = Array.isArray(j.frentes)
    ? j.frentes
        .filter(
          (f): f is Record<string, unknown> =>
            typeof f === "object" && f !== null,
        )
        .map((f) => ({
          frente: String(f.frente ?? ""),
          itens: listaDeTexto(f.itens),
        }))
        .filter((f) => f.frente.length > 0 && f.itens.length > 0)
    : [];

  return {
    diagnostico: listaDeTexto(j.diagnostico),
    servicos,
    frentes,
    condicoesExtras: listaDeTexto(j.condicoesExtras),
    proximosPassos: listaDeTexto(j.proximosPassos),
  };
}

function lerValores(condicoes: string | null) {
  try {
    const j = JSON.parse(condicoes ?? "{}");
    return {
      narrativa: lerNarrativa(j),
      mensal: Number(j.mensal ?? 0),
      setup: Number(j.setup ?? 0),
      /* Proposta salva antes deste campo existir não tem `meses`, e cai no
         padrão — não em zero, que zeraria o total do contrato na tela. */
      meses: prazoValido(j.meses),
      condicoes: typeof j.texto === "string" ? j.texto : null,
    };
  } catch {
    /* Condição antiga, gravada como texto puro antes do JSON existir.
       O texto continua valendo; a narrativa nasce vazia. */
    return {
      narrativa: NARRATIVA_VAZIA,
      mensal: 0,
      setup: 0,
      meses: PRAZO_PADRAO,
      condicoes: condicoes,
    };
  }
}

export function escreverCondicoes(
  mensal: number,
  setup: number,
  texto: string,
  meses: number,
  narrativa: Narrativa = NARRATIVA_VAZIA,
) {
  return JSON.stringify({
    mensal,
    setup,
    meses: prazoValido(meses),
    texto,
    ...narrativa,
  });
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
      condicoes: "Contrato semestral. Depois disso, renovação mensal.",
      valor_mensal: p.mensal,
      valor_setup: p.setup,
      meses_contrato: PRAZO_PADRAO,
      organizacao_id: "demo",
      total: p.mensal + p.setup,
      validade: p.validade,
      criado_em: new Date().toISOString(),
      /* A demonstração carrega a proposta inteira, e não um esqueleto:
         é por estes links que a agência confere o documento antes de
         mandar o primeiro de verdade. Uma demo pela metade faria a
         conferência passar por cima justamente das telas novas. */
      narrativa: {
        diagnostico: [
          "A conta investe todo mês, mas ninguém sabe dizer quanto voltou. Não há rastreamento de conversão instalado — o que existe é o número que a própria plataforma declara.",
          "O conteúdo da rede e o que vai para o anúncio são decididos em lugares diferentes, por pessoas diferentes. A marca fala uma coisa no feed e outra no criativo.",
          "Não existe calendário. O post do dia é escolhido na véspera, e o mês termina sem ninguém saber o que foi testado.",
          "A verba está concentrada em público frio. Quem já visitou o site e quem já comprou não recebem nada depois.",
        ],
        servicos: [
          { id: "estrategia", fee: 0 },
          { id: "social", fee: 0 },
          { id: "meta", fee: 0 },
          { id: "google", fee: 0 },
          { id: "relatorio", fee: 0 },
          { id: "implantacao", fee: p.setup },
        ],
        frentes: [],
        condicoesExtras: [
          `Contrato de ${PRAZO_PADRAO} meses. Depois disso, renovação mensal, sem multa para sair.`,
        ],
        proximosPassos: [
          "Você responde no WhatsApp e a MR Grow envia o contrato para assinatura digital.",
          "Kick off na mesma semana: acessos, tom de voz e as metas do primeiro trimestre.",
          "Implantação do rastreamento e auditoria da conta, antes de subir campanha.",
          "Primeiro calendário aprovado e campanhas no ar em até 15 dias do aceite.",
          "Painel liberado no seu nome, com investimento e retorno atualizados sozinhos.",
        ],
      },
    })),
    demo: true,
  };
}

type Linha = {
  id: string;
  organizacao_id: string;
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
    meses_contrato: v.meses,
    /* Primeiro ciclo do contrato: o recorrente mais o setup. É esse o número
       que o cliente vê no aceite e o que o financeiro precisa projetar. */
    total: mensal + v.setup,
    validade: p.validade,
    criado_em: p.criado_em,
    organizacao_id: p.organizacao_id,
    narrativa: v.narrativa,
  };
}

const CAMPOS =
  "id, organizacao_id, numero, titulo, status, token_publico, cliente_nome, cliente_logo_url, introducao, escopo, condicoes, total, validade, criado_em";

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
    return {
      propostas: (data as unknown as Linha[]).map(daLinha),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarPropostas", e);
    return { propostas: [], demo: false };
  }
}

/**
 * Busca a proposta pelo token público. Sem sessão: é a rota que o cliente
 * abre. O token é aleatório de 16 bytes, gerado pelo banco.
 */
export async function carregarPorToken(
  token: string,
): Promise<Proposta | null> {
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
        .update({
          status: "visualizada",
          visualizada_em: new Date().toISOString(),
        })
        .eq("id", proposta.id)
        .is("visualizada_em", null);
    }

    return proposta;
  } catch (e) {
    registrarFalha("carregarPorToken", e);
    return null;
  }
}

/** Identidade da agência para a proposta aberta por link. */
export type MarcaAgencia = {
  nome: string;
  logo_url: string | null;
  cor: string;
  whatsapp: string;
  email: string;
  site: string;
  documento: string | null;
};

/**
 * A marca de quem assina, carregada sem sessão.
 *
 * `carregarAgencia()` não serve aqui: ela lê a organização da sessão, e
 * quem abre uma proposta por link não tem nenhuma. A autorização é a
 * mesma da proposta — o token já provou que a pessoa pode ver este
 * documento, e daí sai a organização. Só campos que a proposta exibe.
 */
export async function carregarMarcaPublica(
  organizacaoId: string,
): Promise<MarcaAgencia | null> {
  if (modoDemonstracao() || organizacaoId === "demo") return null;

  try {
    const db = criarClienteAdmin();
    const { data, error } = await db
      .from("organizacoes")
      .select("nome, documento, cor_primaria, logo_url, configuracoes")
      .eq("id", organizacaoId)
      .maybeSingle();

    if (error || !data) {
      if (error) registrarFalha("carregarMarcaPublica", error);
      return null;
    }

    const l = data as unknown as {
      nome: string;
      documento: string | null;
      cor_primaria: string | null;
      logo_url: string | null;
      configuracoes: Record<string, unknown> | null;
    };
    const extras = l.configuracoes ?? {};
    const texto = (chave: string) =>
      typeof extras[chave] === "string" ? (extras[chave] as string) : "";

    return {
      nome: l.nome,
      logo_url: l.logo_url,
      /* A cor entra em `style`; sem conferir o formato, o que estiver
         gravado vira valor de CSS na página aberta pelo cliente. */
      cor: /^#[0-9a-f]{6}$/i.test(l.cor_primaria ?? "")
        ? (l.cor_primaria as string)
        : "#1668f5",
      whatsapp: texto("whatsapp"),
      email: texto("email_contato"),
      site: texto("site"),
      documento: l.documento,
    };
  } catch (e) {
    registrarFalha("carregarMarcaPublica", e);
    return null;
  }
}
