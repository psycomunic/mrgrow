/**
 * Dados de demonstração.
 * Servem para o painel abrir antes de conectar o Supabase — e como referência
 * do formato que cada tela espera. Apague quando os dados reais entrarem.
 */

export const DEMO_KPIS = {
  mrr: 38400,
  clientesAtivos: 11,
  ticketMedio: 3490,
  investimentoGerido: 412800,
  receitaAtribuida: 1934500,
  roasMedio: 4.69,
  leadsMes: 843,
  cplMedio: 11.4,
  negociosAbertos: 17,
  valorPipeline: 62700,
  taxaConversao: 27.4,
  inadimplencia: 2850,
};

export const DEMO_SERIE = Array.from({ length: 30 }, (_, i) => {
  const base = 9000 + i * 320;
  const ruido = Math.sin(i / 2.4) * 2400;
  const investimento = Math.round(base + ruido);
  return {
    data: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
    investimento,
    receita: Math.round(investimento * (3.6 + Math.sin(i / 3) * 1.1)),
    leads: Math.round(18 + Math.cos(i / 2) * 7 + i * 0.4),
    cliques: Math.round(620 + Math.sin(i / 1.8) * 180 + i * 9),
    impressoes: Math.round(48000 + Math.cos(i / 2.2) * 9000 + i * 500),
    compras: Math.round(6 + Math.sin(i / 3) * 3 + i * 0.2),
  };
});

export const DEMO_CLIENTES = [
  { id: "c1", nome: "Vitrine Prime", slug: "vitrine-prime", segmento: "E-commerce de moda", status: "ativo", fee_mensal: 4200, investimento_previsto: 68000, saude: 92, roas: 6.2, nps: 9 },
  { id: "c2", nome: "Clínica Aurora", slug: "clinica-aurora", segmento: "Estética", status: "ativo", fee_mensal: 3500, investimento_previsto: 24000, saude: 88, roas: 5.1, nps: 10 },
  { id: "c3", nome: "Construtora Vértice", slug: "construtora-vertice", segmento: "Imobiliário", status: "ativo", fee_mensal: 5200, investimento_previsto: 92000, saude: 74, roas: 3.4, nps: 8 },
  { id: "c4", nome: "EducaMais", slug: "educamais", segmento: "Educação", status: "onboarding", fee_mensal: 2500, investimento_previsto: 15000, saude: 80, roas: 0, nps: null },
  { id: "c5", nome: "Sabor & Cia", slug: "sabor-e-cia", segmento: "Alimentação", status: "ativo", fee_mensal: 2500, investimento_previsto: 18000, saude: 61, roas: 2.7, nps: 7 },
  { id: "c6", nome: "AutoNorte Seminovos", slug: "autonorte", segmento: "Automotivo", status: "pausado", fee_mensal: 3200, investimento_previsto: 0, saude: 45, roas: 1.9, nps: 6 },
];

export const DEMO_ETAPAS = [
  { id: "e1", nome: "Lead recebido", ordem: 0, probabilidade: 10, cor: "#5798ff", tipo: "aberta" },
  { id: "e2", nome: "Qualificação", ordem: 1, probabilidade: 25, cor: "#1668f5", tipo: "aberta" },
  { id: "e3", nome: "Diagnóstico agendado", ordem: 2, probabilidade: 45, cor: "#0b4fd1", tipo: "aberta" },
  { id: "e4", nome: "Proposta enviada", ordem: 3, probabilidade: 65, cor: "#103786", tipo: "aberta" },
  { id: "e5", nome: "Negociação", ordem: 4, probabilidade: 80, cor: "#12316d", tipo: "aberta" },
];

export const DEMO_NEGOCIOS = [
  { id: "n1", titulo: "Loja Bella Fiore", etapa_id: "e1", valor_mensal: 3500, valor_unico: 0, temperatura: "quente", origem: "meta_ads", contato: "Renata Alves", previsao: "2026-09-12" },
  { id: "n2", titulo: "Odonto Sorriso", etapa_id: "e1", valor_mensal: 2500, valor_unico: 4900, temperatura: "morno", origem: "indicacao", contato: "Dr. Paulo", previsao: "2026-09-20" },
  { id: "n3", titulo: "Academia Pulse", etapa_id: "e2", valor_mensal: 3200, valor_unico: 0, temperatura: "quente", origem: "google_ads", contato: "Bruno Lima", previsao: "2026-09-08" },
  { id: "n4", titulo: "Móveis Duarte", etapa_id: "e3", valor_mensal: 4200, valor_unico: 4900, temperatura: "quente", origem: "outbound", contato: "Sandra Duarte", previsao: "2026-09-05" },
  { id: "n5", titulo: "Pet House", etapa_id: "e3", valor_mensal: 2500, valor_unico: 0, temperatura: "frio", origem: "organico", contato: "Igor Souza", previsao: "2026-10-01" },
  { id: "n6", titulo: "Studio Nova Pele", etapa_id: "e4", valor_mensal: 3500, valor_unico: 2400, temperatura: "quente", origem: "meta_ads", contato: "Camila Reis", previsao: "2026-08-30" },
  { id: "n7", titulo: "TechParts Distribuidora", etapa_id: "e5", valor_mensal: 5200, valor_unico: 0, temperatura: "quente", origem: "indicacao", contato: "Marcelo Tan", previsao: "2026-08-28" },
];

export const DEMO_TAREFAS = [
  { id: "t1", titulo: "Subir 6 criativos novos — Vitrine Prime", status: "fazendo", prioridade: "alta", responsavel: "Mateus", cliente: "Vitrine Prime", vence_em: "2026-08-26" },
  { id: "t2", titulo: "Revisar rastreamento GA4 — Clínica Aurora", status: "backlog", prioridade: "urgente", responsavel: "Equipe", cliente: "Clínica Aurora", vence_em: "2026-08-25" },
  { id: "t3", titulo: "Relatório quinzenal — Construtora Vértice", status: "revisao", prioridade: "media", responsavel: "Mateus", cliente: "Construtora Vértice", vence_em: "2026-08-27" },
  { id: "t4", titulo: "Onboarding EducaMais — acesso ao BM", status: "fazendo", prioridade: "alta", responsavel: "Equipe", cliente: "EducaMais", vence_em: "2026-08-25" },
  { id: "t5", titulo: "Teste A/B da nova LP — Sabor & Cia", status: "backlog", prioridade: "media", responsavel: "Equipe", cliente: "Sabor & Cia", vence_em: "2026-09-02" },
  { id: "t6", titulo: "Reativar campanhas — AutoNorte", status: "concluida", prioridade: "baixa", responsavel: "Mateus", cliente: "AutoNorte Seminovos", vence_em: "2026-08-20" },
];

export const DEMO_LANCAMENTOS = [
  { id: "l1", descricao: "Fee mensal · Vitrine Prime", tipo: "receita", status: "pago", valor: 4200, vencimento: "2026-08-10", cliente: "Vitrine Prime" },
  { id: "l2", descricao: "Fee mensal · Clínica Aurora", tipo: "receita", status: "pago", valor: 3500, vencimento: "2026-08-10", cliente: "Clínica Aurora" },
  { id: "l3", descricao: "Fee mensal · Construtora Vértice", tipo: "receita", status: "pendente", valor: 5200, vencimento: "2026-08-28", cliente: "Construtora Vértice" },
  { id: "l4", descricao: "Fee mensal · Sabor & Cia", tipo: "receita", status: "atrasado", valor: 2500, vencimento: "2026-08-10", cliente: "Sabor & Cia" },
  { id: "l5", descricao: "Landing page · EducaMais", tipo: "receita", status: "previsto", valor: 4900, vencimento: "2026-09-05", cliente: "EducaMais" },
  { id: "l6", descricao: "Equipe · pró-labore e freelas", tipo: "despesa", status: "pago", valor: 12400, vencimento: "2026-08-05", cliente: null },
  { id: "l7", descricao: "Ferramentas (Meta, Adobe, Supabase)", tipo: "despesa", status: "pago", valor: 1180, vencimento: "2026-08-03", cliente: null },
  { id: "l8", descricao: "Impostos · Simples Nacional", tipo: "despesa", status: "pendente", valor: 3260, vencimento: "2026-08-20", cliente: null },
];

export const DEMO_INTEGRACOES = [
  { id: "i1", provedor: "meta_ads", rotulo: "Meta Ads", status: "conectada", contas: 6, ultima: "há 4 minutos" },
  { id: "i2", provedor: "google_ads", rotulo: "Google Ads", status: "conectada", contas: 4, ultima: "há 4 minutos" },
  { id: "i3", provedor: "google_analytics", rotulo: "Google Analytics 4", status: "conectada", contas: 5, ultima: "há 12 minutos" },
  { id: "i4", provedor: "whatsapp", rotulo: "WhatsApp Business", status: "desconectada", contas: 0, ultima: "—" },
  { id: "i5", provedor: "asaas", rotulo: "Asaas (cobrança)", status: "desconectada", contas: 0, ultima: "—" },
  { id: "i6", provedor: "slack", rotulo: "Slack", status: "desconectada", contas: 0, ultima: "—" },
];

export const DEMO_AUTOMACOES = [
  { id: "a1", nome: "Lead novo → responsável no WhatsApp", gatilho: "lead_criado", ativa: true, execucoes: 412 },
  { id: "a2", nome: "Cobrança 3 dias antes do vencimento", gatilho: "fatura_vencendo", ativa: true, execucoes: 96 },
  { id: "a3", nome: "Fatura atrasada → alerta financeiro", gatilho: "fatura_atrasada", ativa: true, execucoes: 14 },
  { id: "a4", nome: "Conta sem veiculação há 24h", gatilho: "conta_sem_veiculacao", ativa: true, execucoes: 7 },
  { id: "a5", nome: "ROAS abaixo da meta", gatilho: "metrica_fora_da_meta", ativa: true, execucoes: 23 },
  { id: "a6", nome: "Negócio ganho → onboarding", gatilho: "negocio_ganho", ativa: true, execucoes: 11 },
  { id: "a7", nome: "Contrato vencendo em 30 dias", gatilho: "contrato_vencendo", ativa: false, execucoes: 3 },
];

export const DEMO_PROPOSTAS = [
  { id: "p1", numero: "PRP-2026-041", titulo: "Operação completa · Móveis Duarte", status: "enviada", total: 9100, validade: "2026-09-05" },
  { id: "p2", numero: "PRP-2026-040", titulo: "Gestão Meta + LP · Studio Nova Pele", status: "visualizada", total: 5900, validade: "2026-08-30" },
  { id: "p3", numero: "PRP-2026-039", titulo: "Google Ads · TechParts", status: "aceita", total: 5200, validade: "2026-08-25" },
  { id: "p4", numero: "PRP-2026-038", titulo: "Diagnóstico + setup · Pet House", status: "rascunho", total: 2400, validade: "2026-09-10" },
];
