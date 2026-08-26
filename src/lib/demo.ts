/**
 * Dados de demonstração.
 *
 * Servem para o painel abrir navegável antes de existir banco — e para a
 * agência poder mostrar a plataforma a um cliente sem expor números reais.
 * Por isso não são números soltos: tudo aqui é coerente entre si. O MRR é a
 * soma dos fees dos clientes ativos, o ROAS sai da série de métricas, a
 * inadimplência sai dos lançamentos atrasados. Se um número da tela não
 * fecha com outro, é bug — não é "dado de exemplo".
 *
 * Duas regras que valem para tudo neste arquivo:
 *
 * 1. Nada de datas fixas. Uma demonstração com "vence em 25/08/2026" está
 *    correta hoje e mentindo no mês que vem — e nada denuncia mais uma tela
 *    de exemplo do que um prazo vencido há três meses.
 * 2. Nada de `Math.random()` nem de seno puro. Aleatório de verdade quebra a
 *    hidratação do React (servidor e cliente sorteiam valores diferentes) e
 *    um seno perfeito produz aquela ondinha simétrica que grita "gerado". O
 *    gerador abaixo é determinístico e imita o que uma conta de mídia faz de
 *    verdade: cai no fim de semana, sobe na semana, tem pico de campanha e
 *    tem dia ruim.
 */

import { emDias, hoje } from "@/lib/tempo";

/* ── Gerador determinístico ─────────────────────────────────────── */

/** Congruência linear: mesma semente, mesma sequência, em qualquer ambiente. */
function sorteio(semente: number) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado * 1_664_525 + 1_013_904_223) >>> 0;
    return estado / 0x1_0000_0000;
  };
}

export type PontoSerie = {
  data: string;
  investimento: number;
  receita: number;
  leads: number;
  cliques: number;
  impressoes: number;
  compras: number;
};

/**
 * Série diária de 90 dias. Noventa e não trinta de propósito: com um mês só,
 * qualquer comparação com "período anterior" fica sem base e os minigráficos
 * viram uma linha reta com um pico no fim.
 */
function gerarSerie(dias = 90): PontoSerie[] {
  const aleatorio = sorteio(20_260_826);
  const pontos: PontoSerie[] = [];

  /* Campanhas fortes em janelas específicas, como acontece de verdade:
     entrada de verba nova, promoção, fim de mês. */
  const picos = [dias - 12, dias - 13, dias - 14, dias - 41, dias - 42];
  const quedas = [dias - 27, dias - 55];

  for (let i = 0; i < dias; i++) {
    const data = emDias(-(dias - 1 - i));
    const diaSemana = new Date(`${data}T12:00:00`).getDay();

    // Crescimento suave da conta ao longo do trimestre.
    const tendencia = 1 + (i / dias) * 0.42;
    // Sábado e domingo rendem menos em quase toda conta B2C brasileira.
    const semana = diaSemana === 0 ? 0.62 : diaSemana === 6 ? 0.71 : 1;
    const ruido = 0.86 + aleatorio() * 0.28;
    const evento = picos.includes(i) ? 1.55 : quedas.includes(i) ? 0.48 : 1;

    /* A escala inteira sai daqui, e ela importa: uma agência com seis contas
       ativas e fee médio de R$ 3,5 mil não gere meio milhão de mídia por mês.
       Com ~R$ 215 mil no período, o fee fica em torno de 10% da verba gerida,
       que é a proporção que se vê na prática. */
    const investimento = Math.round(6_400 * tendencia * semana * ruido * evento);
    // O ROAS oscila em torno de 4,2 — e num dia ruim ele cai junto com o gasto.
    const roas = 3.1 + aleatorio() * 1.9 + (evento > 1 ? 0.7 : 0) - (evento < 1 ? 0.9 : 0);
    // CPC de R$ 2,20 a R$ 3,10 e CTR perto de 1,4%: faixa de leilão brasileiro.
    const cliques = Math.round(investimento / (2.2 + aleatorio() * 0.9));
    const leads = Math.round(cliques * (0.024 + aleatorio() * 0.014));

    pontos.push({
      data,
      investimento,
      receita: Math.round(investimento * roas),
      leads,
      cliques,
      impressoes: Math.round(cliques * (64 + aleatorio() * 22)),
      /* Compra não é subconjunto de lead: conta de e-commerce vende sem passar
         por formulário, e conta de geração de lead não vende no site. Somadas,
         as duas grandezas ficam na mesma ordem — é isso que mantém o ticket
         médio num valor de varejo em vez de estourar. */
      compras: Math.round(leads * (0.9 + aleatorio() * 0.5)),
    });
  }

  return pontos;
}

export const DEMO_SERIE = gerarSerie(90);

/** Os últimos 30 dias — o recorte que a maioria das telas mostra. */
export const DEMO_SERIE_30 = DEMO_SERIE.slice(-30);

/* ── Carteira de clientes ───────────────────────────────────────── */

export const DEMO_CLIENTES = [
  { id: "c1", nome: "Vitrine Prime", slug: "vitrine-prime", segmento: "E-commerce de moda", status: "ativo", fee_mensal: 4200, investimento_previsto: 68000, saude: 92, roas: 6.2, nps: 9 },
  { id: "c2", nome: "Clínica Aurora", slug: "clinica-aurora", segmento: "Estética e saúde", status: "ativo", fee_mensal: 3500, investimento_previsto: 24000, saude: 88, roas: 5.1, nps: 10 },
  { id: "c3", nome: "Construtora Vértice", slug: "construtora-vertice", segmento: "Imobiliário", status: "ativo", fee_mensal: 5200, investimento_previsto: 92000, saude: 74, roas: 3.4, nps: 8 },
  { id: "c4", nome: "Sabor & Cia", slug: "sabor-e-cia", segmento: "Alimentação", status: "ativo", fee_mensal: 2500, investimento_previsto: 18000, saude: 61, roas: 2.7, nps: 7 },
  { id: "c5", nome: "Odonto Sorriso", slug: "odonto-sorriso", segmento: "Odontologia", status: "ativo", fee_mensal: 2800, investimento_previsto: 21000, saude: 85, roas: 4.6, nps: 9 },
  { id: "c6", nome: "Academia Pulse", slug: "academia-pulse", segmento: "Fitness", status: "ativo", fee_mensal: 3200, investimento_previsto: 26000, saude: 79, roas: 4.1, nps: 8 },
  { id: "c7", nome: "EducaMais", slug: "educamais", segmento: "Educação", status: "onboarding", fee_mensal: 2500, investimento_previsto: 15000, saude: 80, roas: 0, nps: null },
  { id: "c8", nome: "AutoNorte Seminovos", slug: "autonorte", segmento: "Automotivo", status: "pausado", fee_mensal: 3200, investimento_previsto: 0, saude: 45, roas: 1.9, nps: 6 },
];

export const DEMO_ETAPAS = [
  { id: "e1", nome: "Lead recebido", ordem: 0, probabilidade: 10, cor: "#5798ff", tipo: "aberta" },
  { id: "e2", nome: "Qualificação", ordem: 1, probabilidade: 25, cor: "#1668f5", tipo: "aberta" },
  { id: "e3", nome: "Diagnóstico agendado", ordem: 2, probabilidade: 45, cor: "#0b4fd1", tipo: "aberta" },
  { id: "e4", nome: "Proposta enviada", ordem: 3, probabilidade: 65, cor: "#103786", tipo: "aberta" },
  { id: "e5", nome: "Negociação", ordem: 4, probabilidade: 80, cor: "#12316d", tipo: "aberta" },
];

export const DEMO_NEGOCIOS = [
  { id: "n1", titulo: "Loja Bella Fiore", etapa_id: "e1", valor_mensal: 3500, valor_unico: 0, temperatura: "quente", origem: "meta_ads", contato: "Renata Alves", previsao: emDias(17) },
  { id: "n2", titulo: "Padaria do Largo", etapa_id: "e1", valor_mensal: 2200, valor_unico: 2400, temperatura: "frio", origem: "organico", contato: "Wilson Prado", previsao: emDias(38) },
  { id: "n3", titulo: "Studio Nova Pele", etapa_id: "e2", valor_mensal: 3500, valor_unico: 2400, temperatura: "quente", origem: "meta_ads", contato: "Camila Reis", previsao: emDias(9) },
  { id: "n4", titulo: "Pet House", etapa_id: "e2", valor_mensal: 2500, valor_unico: 0, temperatura: "morno", origem: "indicacao", contato: "Igor Souza", previsao: emDias(24) },
  { id: "n5", titulo: "Móveis Duarte", etapa_id: "e3", valor_mensal: 4200, valor_unico: 4900, temperatura: "quente", origem: "outbound", contato: "Sandra Duarte", previsao: emDias(6) },
  { id: "n6", titulo: "Advocacia Terra Nova", etapa_id: "e3", valor_mensal: 3800, valor_unico: 0, temperatura: "morno", origem: "indicacao", contato: "Dra. Helena Terra", previsao: emDias(15) },
  { id: "n7", titulo: "TechParts Distribuidora", etapa_id: "e4", valor_mensal: 5200, valor_unico: 0, temperatura: "quente", origem: "google_ads", contato: "Marcelo Tan", previsao: emDias(4) },
  { id: "n8", titulo: "Colégio Horizonte", etapa_id: "e4", valor_mensal: 4600, valor_unico: 3200, temperatura: "morno", origem: "outbound", contato: "Paulo Andrade", previsao: emDias(11) },
  { id: "n9", titulo: "Ótica Visão Clara", etapa_id: "e5", valor_mensal: 2800, valor_unico: 1900, temperatura: "quente", origem: "meta_ads", contato: "Bianca Prado", previsao: emDias(2) },
];

/* ── Operação ───────────────────────────────────────────────────── */

export const DEMO_TAREFAS = [
  { id: "t1", titulo: "Subir 6 criativos novos do lançamento", status: "fazendo", prioridade: "alta", responsavel: "Mateus", cliente: "Vitrine Prime", vence_em: emDias(0) },
  { id: "t2", titulo: "Corrigir rastreamento do GA4 (evento de compra duplicado)", status: "fazendo", prioridade: "urgente", responsavel: "Equipe", cliente: "Clínica Aurora", vence_em: emDias(-1) },
  { id: "t3", titulo: "Reestruturar campanhas de Search por intenção", status: "backlog", prioridade: "alta", responsavel: "Mateus", cliente: "Construtora Vértice", vence_em: emDias(3) },
  { id: "t4", titulo: "Onboarding: liberar acesso ao Business Manager", status: "fazendo", prioridade: "alta", responsavel: "Equipe", cliente: "EducaMais", vence_em: emDias(1) },
  { id: "t5", titulo: "Teste A/B da nova landing (headline e prova social)", status: "backlog", prioridade: "media", responsavel: "Equipe", cliente: "Sabor & Cia", vence_em: emDias(7) },
  { id: "t6", titulo: "Relatório quinzenal para aprovação", status: "revisao", prioridade: "media", responsavel: "Mateus", cliente: "Construtora Vértice", vence_em: emDias(2) },
  { id: "t7", titulo: "Revisar público de remarketing de 7 dias", status: "revisao", prioridade: "baixa", responsavel: "Equipe", cliente: "Academia Pulse", vence_em: emDias(5) },
  { id: "t8", titulo: "Reativar campanhas pausadas e refazer orçamento", status: "concluida", prioridade: "baixa", responsavel: "Mateus", cliente: "AutoNorte Seminovos", vence_em: emDias(-6) },
  { id: "t9", titulo: "Ajustar lances do Performance Max", status: "concluida", prioridade: "media", responsavel: "Equipe", cliente: "Odonto Sorriso", vence_em: emDias(-3) },
];

export const DEMO_PROJETOS = [
  { id: "p1", nome: "Onboarding completo", cliente: "EducaMais", status: "ativo", progresso: 45, prazo: emDias(10), responsavel: "Mateus" },
  { id: "p2", nome: "Nova landing page de captação", cliente: "Sabor & Cia", status: "ativo", progresso: 70, prazo: emDias(7), responsavel: "Equipe" },
  { id: "p3", nome: "Rastreamento server-side (CAPI + GTM)", cliente: "Vitrine Prime", status: "ativo", progresso: 88, prazo: emDias(3), responsavel: "Mateus" },
  { id: "p4", nome: "Reestruturação de campanhas", cliente: "Construtora Vértice", status: "pausado", progresso: 30, prazo: emDias(25), responsavel: "Equipe" },
  { id: "p5", nome: "Produção de criativos do trimestre", cliente: "Clínica Aurora", status: "ativo", progresso: 62, prazo: emDias(20), responsavel: "Equipe" },
  { id: "p6", nome: "Reativação da conta", cliente: "AutoNorte Seminovos", status: "concluido", progresso: 100, prazo: emDias(-6), responsavel: "Mateus" },
];

/* ── Financeiro ─────────────────────────────────────────────────── */

/**
 * Data no mês corrente menos `mesesAtras`, no dia informado.
 *
 * Construída por componente em vez de `setMonth`, que estoura em dia 31:
 * `new Date(2026,2,31).setMonth(1)` cai em 3 de março, não em fevereiro.
 */
function noMes(mesesAtras: number, dia: number) {
  const [ano, mes] = hoje().split("-").map(Number);
  const total = (ano * 12 + (mes - 1)) - mesesAtras;
  const a = Math.floor(total / 12);
  const m = (total % 12) + 1;
  const ultimoDia = new Date(a, m, 0).getDate();
  const d = Math.min(dia, ultimoDia);
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export type LancamentoDemo = {
  id: string;
  descricao: string;
  tipo: string;
  status: string;
  valor: number;
  vencimento: string;
  cliente: string | null;
};

/**
 * Seis meses de razão financeira, não um mês só.
 *
 * O gráfico de fluxo de caixa da tela soma por mês de vencimento nos últimos
 * seis meses. Com lançamentos apenas do mês corrente, cinco colunas ficavam em
 * zero e a sexta virava um bico — o gráfico parecia quebrado, e era só falta de
 * histórico. Aqui cada mês fechado tem os fees recebidos e os custos pagos; o
 * mês corrente é o único com pendência, atraso e previsão, que é como um mês em
 * andamento realmente se parece.
 */
function gerarLancamentos(): LancamentoDemo[] {
  const lista: LancamentoDemo[] = [];
  const ativos = DEMO_CLIENTES.filter((c) => c.status === "ativo");

  /* Meses fechados: tudo recebido e tudo pago. O fator faz a agência crescer
     ao longo do semestre em vez de repetir o mesmo valor seis vezes. */
  /* Fator por mês em vez de rampa: uma agência ganha e perde conta, cobra um
     setup num mês e não no outro. A rampa linear que estava aqui produzia
     minigráficos em linha reta perfeita — o desenho mais artificial possível. */
  const FATOR = { 5: 0.78, 4: 0.86, 3: 0.83, 2: 0.94, 1: 0.97 } as const;
  const AVULSOS: Record<number, { descricao: string; valor: number; cliente: string } | undefined> = {
    4: { descricao: "Setup de rastreamento · Odonto Sorriso", valor: 2_900, cliente: "Odonto Sorriso" },
    2: { descricao: "Landing page · Academia Pulse", valor: 4_400, cliente: "Academia Pulse" },
  };

  for (let atras = 5; atras >= 1; atras--) {
    const fator = FATOR[atras as keyof typeof FATOR];

    ativos.forEach((c, i) => {
      lista.push({
        id: `r${atras}-${c.id}`,
        descricao: `Fee mensal · ${c.nome}`,
        tipo: "receita",
        status: "pago",
        valor: Math.round((c.fee_mensal * fator) / 10) * 10,
        vencimento: noMes(atras, i % 2 === 0 ? 10 : 5),
        cliente: c.nome,
      });
    });

    const avulso = AVULSOS[atras];
    if (avulso) {
      lista.push({
        id: `a${atras}`,
        descricao: avulso.descricao,
        tipo: "receita",
        status: "pago",
        valor: avulso.valor,
        vencimento: noMes(atras, 15),
        cliente: avulso.cliente,
      });
    }

    lista.push(
      {
        id: `d${atras}-equipe`,
        descricao: "Equipe · pró-labore e freelas",
        tipo: "despesa",
        status: "pago",
        valor: Math.round((12_400 * fator) / 10) * 10,
        vencimento: noMes(atras, 5),
        cliente: null,
      },
      {
        id: `d${atras}-ferramentas`,
        descricao: "Ferramentas (Meta, Adobe, Supabase, Vercel)",
        tipo: "despesa",
        status: "pago",
        valor: 1180,
        vencimento: noMes(atras, 3),
        cliente: null,
      },
      {
        id: `d${atras}-impostos`,
        descricao: "Impostos · Simples Nacional",
        tipo: "despesa",
        status: "pago",
        valor: Math.round((3_260 * fator) / 10) * 10,
        vencimento: noMes(atras, 20),
        cliente: null,
      },
      {
        id: `d${atras}-midia`,
        descricao: "Tráfego pago da própria agência",
        tipo: "despesa",
        status: "pago",
        valor: 2400,
        vencimento: noMes(atras, 8),
        cliente: null,
      },
    );
  }

  // Mês corrente: o único com dinheiro em aberto.
  lista.push(
    { id: "l1", descricao: "Fee mensal · Vitrine Prime", tipo: "receita", status: "pago", valor: 4200, vencimento: noMes(0, 10), cliente: "Vitrine Prime" },
    { id: "l2", descricao: "Fee mensal · Clínica Aurora", tipo: "receita", status: "pago", valor: 3500, vencimento: noMes(0, 10), cliente: "Clínica Aurora" },
    { id: "l3", descricao: "Fee mensal · Odonto Sorriso", tipo: "receita", status: "pago", valor: 2800, vencimento: noMes(0, 5), cliente: "Odonto Sorriso" },
    { id: "l4", descricao: "Fee mensal · Academia Pulse", tipo: "receita", status: "pago", valor: 3200, vencimento: noMes(0, 5), cliente: "Academia Pulse" },
    { id: "l5", descricao: "Fee mensal · Construtora Vértice", tipo: "receita", status: "pendente", valor: 5200, vencimento: emDias(4), cliente: "Construtora Vértice" },
    { id: "l6", descricao: "Fee mensal · Sabor & Cia", tipo: "receita", status: "atrasado", valor: 2500, vencimento: emDias(-9), cliente: "Sabor & Cia" },
    { id: "l7", descricao: "Setup + landing page · EducaMais", tipo: "receita", status: "previsto", valor: 4900, vencimento: emDias(12), cliente: "EducaMais" },
    { id: "l8", descricao: "Equipe · pró-labore e freelas", tipo: "despesa", status: "pago", valor: 12_400, vencimento: noMes(0, 5), cliente: null },
    { id: "l9", descricao: "Ferramentas (Meta, Adobe, Supabase, Vercel)", tipo: "despesa", status: "pago", valor: 1180, vencimento: noMes(0, 3), cliente: null },
    { id: "l10", descricao: "Impostos · Simples Nacional", tipo: "despesa", status: "pendente", valor: 3260, vencimento: noMes(0, 20), cliente: null },
    { id: "l11", descricao: "Tráfego pago da própria agência", tipo: "despesa", status: "pago", valor: 2400, vencimento: noMes(0, 8), cliente: null },
  );

  return lista;
}

export const DEMO_LANCAMENTOS = gerarLancamentos();

/* ── Integrações e automações ───────────────────────────────────── */

export const DEMO_INTEGRACOES = [
  { id: "i1", provedor: "meta_ads", rotulo: "Meta Ads", status: "conectada", contas: 6, ultima: "há 8 minutos" },
  { id: "i2", provedor: "google_ads", rotulo: "Google Ads", status: "conectada", contas: 4, ultima: "há 8 minutos" },
  { id: "i3", provedor: "google_analytics", rotulo: "Google Analytics 4", status: "conectada", contas: 5, ultima: "há 26 minutos" },
  { id: "i4", provedor: "whatsapp", rotulo: "WhatsApp Business", status: "desconectada", contas: 0, ultima: "—" },
  { id: "i5", provedor: "asaas", rotulo: "Asaas (cobrança)", status: "desconectada", contas: 0, ultima: "—" },
  { id: "i6", provedor: "slack", rotulo: "Slack", status: "desconectada", contas: 0, ultima: "—" },
];

export const DEMO_AUTOMACOES = [
  { id: "a1", nome: "Lead novo avisa o responsável no WhatsApp", gatilho: "lead_criado", ativa: true, execucoes: 412 },
  { id: "a2", nome: "Cobrança 3 dias antes do vencimento", gatilho: "fatura_vencendo", ativa: true, execucoes: 96 },
  { id: "a3", nome: "Fatura atrasada abre alerta no financeiro", gatilho: "fatura_atrasada", ativa: true, execucoes: 14 },
  { id: "a4", nome: "Conta sem veiculação há 24h", gatilho: "conta_sem_veiculacao", ativa: true, execucoes: 7 },
  { id: "a5", nome: "ROAS abaixo da meta cria tarefa de revisão", gatilho: "metrica_fora_da_meta", ativa: true, execucoes: 23 },
  { id: "a6", nome: "Negócio ganho inicia o onboarding", gatilho: "negocio_ganho", ativa: true, execucoes: 11 },
  { id: "a7", nome: "Contrato vencendo em 30 dias", gatilho: "contrato_vencendo", ativa: false, execucoes: 3 },
];

/* ── Propostas ──────────────────────────────────────────────────── */

const ano = hoje().slice(0, 4);

/* Os valores batem com os negócios do funil: uma proposta de "Operação
   completa · Móveis Duarte" tem que ter o mesmo recorrente e o mesmo setup do
   cartão do CRM, senão as duas telas se contradizem. */
export const DEMO_PROPOSTAS = [
  { id: "p1", numero: `PRP-${ano}-041`, titulo: "Operação completa · Móveis Duarte", cliente: "Móveis Duarte", status: "enviada", mensal: 4200, setup: 4900, validade: emDias(9) },
  { id: "p2", numero: `PRP-${ano}-040`, titulo: "Gestão Meta + landing · Studio Nova Pele", cliente: "Studio Nova Pele", status: "visualizada", mensal: 3500, setup: 2400, validade: emDias(4) },
  { id: "p3", numero: `PRP-${ano}-039`, titulo: "Google Ads · TechParts Distribuidora", cliente: "TechParts Distribuidora", status: "aceita", mensal: 5200, setup: 0, validade: emDias(-2) },
  { id: "p4", numero: `PRP-${ano}-038`, titulo: "Diagnóstico + setup · Pet House", cliente: "Pet House", status: "rascunho", mensal: 2500, setup: 0, validade: emDias(14) },
  { id: "p5", numero: `PRP-${ano}-037`, titulo: "Operação completa · Colégio Horizonte", cliente: "Colégio Horizonte", status: "recusada", mensal: 4600, setup: 3200, validade: emDias(-12) },
];
