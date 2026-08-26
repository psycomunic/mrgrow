import "server-only";
import { criarClienteAdmin, criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { carregarSerie } from "@/lib/metricas-servidor";
import { resumir } from "@/lib/metricas";
import { DEMO_CLIENTES, DEMO_TAREFAS, type PontoSerie } from "@/lib/demo";
import { TOKEN_VALIDO } from "@/lib/propostas";
import { CHAVES_BLOCO, periodicidadeDe } from "@/lib/blocos-relatorio";
import { emDias, inicioDoMes } from "@/lib/tempo";

/* `TOKEN_VALIDO` vem de propostas porque é o mesmo gerador no banco
   (`encode(gen_random_bytes(16),'hex')`) e o motivo de validar antes de
   consultar é o mesmo: a rota pública não deve responder a strings
   arbitrárias vindas da URL. */

export type Relatorio = {
  id: string;
  nome: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  periodicidade: string;
  formato: string;
  destinatarios: string[];
  /** Chaves de `BLOCOS`, na ordem em que foram salvas. */
  blocos: string[];
  token: string;
  ativo: boolean;
  ultimo_envio_em: string | null;
};

/**
 * Relatório com o dono explícito.
 *
 * A rota pública consulta com service role, que não passa pela RLS: sem o
 * `organizacao_id` em mãos, um relatório sem `cliente_id` somaria a mídia de
 * todas as organizações da instância. Fica num tipo separado porque o painel
 * manda `Relatorio` para o navegador e não precisa carregar isso junto.
 */
export type RelatorioComOrganizacao = Relatorio & { organizacao_id: string };

export type ListaRelatorios = { relatorios: Relatorio[]; demo: boolean };

/* ── Demonstração ───────────────────────────────────────────────── */

const [vitrine, aurora, vertice] = DEMO_CLIENTES;

function relatoriosDemo(): RelatorioComOrganizacao[] {
  return [
    {
      id: "rel-1",
      organizacao_id: "demo",
      nome: "Fechamento semanal",
      cliente_id: vitrine.id,
      cliente_nome: vitrine.nome,
      periodicidade: "semanal",
      formato: "email",
      destinatarios: ["marina@vitrineprime.com.br", "diretoria@vitrineprime.com.br"],
      blocos: [
        "resumo_executivo",
        "evolucao_diaria",
        "desempenho_campanhas",
        "criativos_vencedores",
        "comparativo_periodo",
      ],
      token: "demo-vitrine-prime",
      ativo: true,
      ultimo_envio_em: emDias(-6),
    },
    {
      id: "rel-2",
      organizacao_id: "demo",
      nome: "Relatório mensal de performance",
      cliente_id: aurora.id,
      cliente_nome: aurora.nome,
      periodicidade: "mensal",
      formato: "link",
      destinatarios: ["helena@clinicaaurora.com.br"],
      blocos: [
        "resumo_executivo",
        "evolucao_diaria",
        "leads_cpl",
        "comparativo_periodo",
        "plano_de_acao",
      ],
      token: "demo-clinica-aurora",
      ativo: true,
      ultimo_envio_em: inicioDoMes(),
    },
    {
      id: "rel-3",
      organizacao_id: "demo",
      nome: "Acompanhamento quinzenal",
      cliente_id: vertice.id,
      cliente_nome: vertice.nome,
      periodicidade: "quinzenal",
      formato: "pdf",
      destinatarios: ["rodrigo@construtoravertice.com.br", "marketing@construtoravertice.com.br"],
      blocos: [...CHAVES_BLOCO],
      token: "demo-construtora-vertice",
      /* Pausado de propósito: sem um relatório inativo na lista, ninguém
         descobre que a coluna de status e o botão de retomar existem. */
      ativo: false,
      ultimo_envio_em: emDias(-19),
    },
  ];
}

/* ── Leitura ────────────────────────────────────────────────────── */

type Linha = {
  id: string;
  organizacao_id: string;
  nome: string;
  cliente_id: string | null;
  periodicidade: string | null;
  formato: string | null;
  destinatarios: string[] | null;
  blocos: unknown;
  token_publico: string;
  ativo: boolean | null;
  ultimo_envio_em: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
};

const CAMPOS =
  "id, organizacao_id, nome, cliente_id, periodicidade, formato, destinatarios, blocos, token_publico, ativo, ultimo_envio_em, clientes:cliente_id(nome)";

/** `blocos` é jsonb livre: só entra o que a definição atual reconhece. */
function lerBlocos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((c): c is string => typeof c === "string" && CHAVES_BLOCO.includes(c as never));
}

function daLinha(r: Linha): RelatorioComOrganizacao {
  const cliente = Array.isArray(r.clientes) ? r.clientes[0] : r.clientes;
  return {
    id: r.id,
    organizacao_id: r.organizacao_id,
    nome: r.nome,
    cliente_id: r.cliente_id,
    cliente_nome: cliente?.nome ?? null,
    periodicidade: r.periodicidade ?? "mensal",
    formato: r.formato ?? "link",
    destinatarios: r.destinatarios ?? [],
    blocos: lerBlocos(r.blocos),
    token: r.token_publico,
    ativo: r.ativo ?? true,
    ultimo_envio_em: r.ultimo_envio_em,
  };
}

const VAZIA: ListaRelatorios = { relatorios: [], demo: false };

export async function carregarRelatorios(): Promise<ListaRelatorios> {
  if (modoDemonstracao()) return { relatorios: relatoriosDemo(), demo: true };

  try {
    const sessao = await obterSessao();
    if (!sessao) return VAZIA;

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("relatorios")
      .select(CAMPOS)
      .eq("organizacao_id", sessao.organizacaoId)
      .order("criado_em", { ascending: false });

    /* Com banco ligado, lista vazia é lista vazia: cair na demonstração aqui
       mostraria relatórios que não existem, e o construtor tentaria editar
       ids fictícios. */
    if (error) {
      registrarFalha("carregarRelatorios", error);
      return VAZIA;
    }
    return { relatorios: (data as unknown as Linha[]).map(daLinha), demo: false };
  } catch (e) {
    registrarFalha("carregarRelatorios", e);
    return VAZIA;
  }
}

/**
 * Busca o relatório pelo token público, para a página que o cliente abre no
 * celular. Sem sessão, então com service role: a RLS de `relatorios` só
 * libera leitura para a equipe da organização, e com o cliente anônimo todo
 * link enviado a cliente caía em 404. O token é o segredo que autoriza.
 *
 * Relatório pausado não abre — o link é o mesmo, e retomar é um clique no
 * painel.
 */
export async function carregarRelatorioPorToken(
  token: string,
): Promise<RelatorioComOrganizacao | null> {
  if (modoDemonstracao()) {
    return relatoriosDemo().find((r) => r.token === token && r.ativo) ?? null;
  }
  if (!TOKEN_VALIDO.test(token)) return null;

  try {
    const db = criarClienteAdmin();
    const { data, error } = await db
      .from("relatorios")
      .select(CAMPOS)
      .eq("token_publico", token)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      registrarFalha("carregarRelatorioPorToken", error);
      return null;
    }
    return data ? daLinha(data as unknown as Linha) : null;
  } catch (e) {
    registrarFalha("carregarRelatorioPorToken", e);
    return null;
  }
}

/* ── Dados que alimentam os blocos ──────────────────────────────── */

export type DesempenhoCampanha = {
  id: string;
  nome: string;
  investimento: number;
  receita: number;
  leads: number;
};

export type CriativoDestaque = {
  id: string;
  nome: string;
  formato: string | null;
  angulo: string | null;
};

export type Entrega = { id: string; titulo: string; status: string; vence_em: string | null };

export type DadosDoRelatorio = {
  /** Duas janelas: `comparar` precisa do período anterior de igual tamanho. */
  serie: PontoSerie[];
  campanhas: DesempenhoCampanha[];
  criativos: CriativoDestaque[];
  entregas: Entrega[];
};

const SEM_DADOS: DadosDoRelatorio = { serie: [], campanhas: [], criativos: [], entregas: [] };

/**
 * Mix de campanhas da demonstração.
 *
 * `verba` é a fatia do investimento e `forca` é o quanto aquela fatia
 * devolve acima ou abaixo da média da conta — remarketing rende mais que
 * público frio, e é isso que faz a tabela parecer uma conta de verdade em vez
 * de quatro linhas iguais.
 */
const MIX_DEMO = [
  { nome: "Conversão · público frio", verba: 0.38, forca: 0.82 },
  { nome: "Search · marca e intenção", verba: 0.24, forca: 1.31 },
  { nome: "Performance Max · catálogo", verba: 0.22, forca: 0.95 },
  { nome: "Remarketing · 7 dias", verba: 0.16, forca: 1.74 },
] as const;

function campanhasDemo(serieDoPeriodo: PontoSerie[]): DesempenhoCampanha[] {
  const total = resumir(serieDoPeriodo);
  if (!total.investimento) return [];

  const peso = MIX_DEMO.reduce((s, c) => s + c.verba * c.forca, 0);
  const linhas = MIX_DEMO.map((c, i) => ({
    id: `camp-${i + 1}`,
    nome: c.nome,
    investimento: Math.round(total.investimento * c.verba),
    receita: Math.round((total.receita * (c.verba * c.forca)) / peso),
    leads: Math.round(total.leads * c.verba),
  }));

  /* A última linha absorve a sobra do arredondamento. O cliente soma a coluna
     e compara com o resumo executivo — se sobrar diferença, ele para de
     confiar nos dois números. */
  const sobra = (chave: "investimento" | "receita" | "leads") =>
    total[chave] - linhas.reduce((s, l) => s + l[chave], 0);
  const ultima = linhas[linhas.length - 1];
  ultima.investimento += sobra("investimento");
  ultima.receita += sobra("receita");
  ultima.leads += sobra("leads");

  return linhas.sort((a, b) => b.investimento - a.investimento);
}

const CRIATIVOS_DEMO: CriativoDestaque[] = [
  { id: "cri-1", nome: "Reels · depoimento de cliente (22s)", formato: "reels", angulo: "Prova social" },
  { id: "cri-2", nome: "Carrossel · antes e depois", formato: "carrossel", angulo: "Prova social" },
  { id: "cri-3", nome: "Estático · oferta com prazo", formato: "estatico", angulo: "Oferta" },
];

const EM_ABERTO = ["backlog", "fazendo", "revisao"];

function entregasDemo(clienteNome: string | null): Entrega[] {
  return DEMO_TAREFAS.filter(
    (t) => t.cliente === clienteNome && EM_ABERTO.includes(t.status),
  ).map((t) => ({ id: t.id, titulo: t.titulo, status: t.status, vence_em: t.vence_em }));
}

type LinhaMetrica = {
  data: string;
  investimento: number | string | null;
  receita: number | string | null;
  leads: number | string | null;
  cliques: number | string | null;
  impressoes: number | string | null;
  compras: number | string | null;
  campanha_id: string | null;
};

function pontoVazio(data: string): PontoSerie {
  return { data, investimento: 0, receita: 0, leads: 0, cliques: 0, impressoes: 0, compras: 0 };
}

/**
 * Números do relatório, prontos para `resumir` e `comparar`.
 *
 * A consulta é feita com service role e filtrada pelo cliente do relatório,
 * porque `carregarSerie` depende da sessão da equipe — na rota pública não
 * existe sessão, e a série voltaria vazia com o banco ligado. Em
 * demonstração o caminho é o mesmo do painel, para os dois baterem.
 */
export async function carregarDadosDoRelatorio(
  relatorio: RelatorioComOrganizacao,
): Promise<DadosDoRelatorio> {
  const { dias } = periodicidadeDe(relatorio.periodicidade);
  const janela = dias * 2;

  if (modoDemonstracao()) {
    const { serie } = await carregarSerie(janela);
    return {
      serie,
      campanhas: campanhasDemo(serie.slice(-dias)),
      criativos: CRIATIVOS_DEMO,
      entregas: entregasDemo(relatorio.cliente_nome),
    };
  }

  try {
    const db = criarClienteAdmin();
    const desde = emDias(-janela);

    let metricas = db
      .from("metricas_diarias")
      .select("data, investimento, receita, leads, cliques, impressoes, compras, campanha_id")
      .eq("organizacao_id", relatorio.organizacao_id)
      .gte("data", desde)
      .order("data", { ascending: true })
      .limit(20_000);

    let criativos = db
      .from("criativos")
      .select("id, nome, formato, angulo")
      .eq("organizacao_id", relatorio.organizacao_id)
      .eq("status", "vencedor")
      .order("atualizado_em", { ascending: false })
      .limit(6);

    let tarefas = db
      .from("tarefas")
      .select("id, titulo, status, vence_em")
      .eq("organizacao_id", relatorio.organizacao_id)
      .in("status", EM_ABERTO)
      .order("vence_em", { ascending: true, nullsFirst: false })
      .limit(6);

    /* Sem `cliente_id` o relatório é da conta inteira; com ele, cada consulta
       precisa do filtro — o service role ignora a RLS, então é aqui que o
       recorte por cliente acontece. */
    if (relatorio.cliente_id) {
      metricas = metricas.eq("cliente_id", relatorio.cliente_id);
      criativos = criativos.eq("cliente_id", relatorio.cliente_id);
      tarefas = tarefas.eq("cliente_id", relatorio.cliente_id);
    }

    const [rMetricas, rCriativos, rTarefas] = await Promise.all([metricas, criativos, tarefas]);

    if (rMetricas.error) registrarFalha("carregarDadosDoRelatorio/metricas", rMetricas.error);
    if (rCriativos.error) registrarFalha("carregarDadosDoRelatorio/criativos", rCriativos.error);
    if (rTarefas.error) registrarFalha("carregarDadosDoRelatorio/tarefas", rTarefas.error);

    const linhas = (rMetricas.data ?? []) as unknown as LinhaMetrica[];

    const porDia = new Map<string, PontoSerie>();
    for (const l of linhas) {
      const ponto = porDia.get(l.data) ?? pontoVazio(l.data);
      ponto.investimento += Number(l.investimento ?? 0);
      ponto.receita += Number(l.receita ?? 0);
      ponto.leads += Number(l.leads ?? 0);
      ponto.cliques += Number(l.cliques ?? 0);
      ponto.impressoes += Number(l.impressoes ?? 0);
      ponto.compras += Number(l.compras ?? 0);
      porDia.set(l.data, ponto);
    }

    return {
      serie: [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)),
      campanhas: await campanhasDoPeriodo(db, relatorio, linhas, emDias(-dias)),
      criativos: (rCriativos.data ?? []) as unknown as CriativoDestaque[],
      entregas: (rTarefas.data ?? []) as unknown as Entrega[],
    };
  } catch (e) {
    registrarFalha("carregarDadosDoRelatorio", e);
    return SEM_DADOS;
  }
}

/**
 * Agrupa as linhas de métricas por campanha dentro da janela atual.
 *
 * `metricas_diarias` guarda uma linha por conta+campanha+dia, e a linha com
 * `campanha_id` nulo é o agregado da conta: somá-la aqui contaria o mesmo
 * investimento duas vezes.
 */
async function campanhasDoPeriodo(
  db: ReturnType<typeof criarClienteAdmin>,
  relatorio: RelatorioComOrganizacao,
  linhas: LinhaMetrica[],
  desde: string,
): Promise<DesempenhoCampanha[]> {
  const porCampanha = new Map<string, DesempenhoCampanha>();

  for (const l of linhas) {
    if (!l.campanha_id || l.data < desde) continue;
    const atual =
      porCampanha.get(l.campanha_id) ??
      { id: l.campanha_id, nome: "", investimento: 0, receita: 0, leads: 0 };
    atual.investimento += Number(l.investimento ?? 0);
    atual.receita += Number(l.receita ?? 0);
    atual.leads += Number(l.leads ?? 0);
    porCampanha.set(l.campanha_id, atual);
  }

  if (!porCampanha.size) return [];

  const { data, error } = await db
    .from("campanhas")
    .select("id, nome")
    .eq("organizacao_id", relatorio.organizacao_id)
    .in("id", [...porCampanha.keys()]);

  if (error) registrarFalha("campanhasDoPeriodo", error);
  for (const c of (data ?? []) as unknown as Array<{ id: string; nome: string }>) {
    const linha = porCampanha.get(c.id);
    if (linha) linha.nome = c.nome;
  }

  /* Campanha sem nome resolvido fica fora: imprimir o uuid na frente do
     cliente é pior do que uma linha a menos na tabela. */
  return [...porCampanha.values()]
    .filter((c) => c.nome)
    .sort((a, b) => b.investimento - a.investimento)
    .slice(0, 8);
}
