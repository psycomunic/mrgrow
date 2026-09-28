/**
 * Rótulos legíveis para os valores que o banco guarda em snake_case.
 *
 * O banco fala "em_revisao"; a tela fala "Em revisão". Sem um lugar único
 * para essa tradução, cada página inventa o seu — e é assim que "revisao"
 * sem acento acaba impresso na frente de um cliente.
 *
 * `rotulo()` nunca devolve vazio: valor desconhecido volta humanizado
 * (underscore por espaço, primeira letra maiúscula), então uma coluna nova
 * no banco aparece apresentável antes de alguém traduzi-la aqui.
 */

export type Tom = "neutro" | "azul" | "sucesso" | "alerta" | "perigo";

type Entrada = { rotulo: string; tom: Tom };

function humanizar(valor: string) {
  const limpo = valor.replace(/[_-]+/g, " ").trim();
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

function tabela<T extends Record<string, Entrada>>(mapa: T) {
  return {
    rotulo: (v: string | null | undefined) => (v ? (mapa[v]?.rotulo ?? humanizar(v)) : "—"),
    tom: (v: string | null | undefined): Tom => (v ? (mapa[v]?.tom ?? "neutro") : "neutro"),
    lista: Object.entries(mapa).map(([valor, e]) => ({ valor, ...e })),
  };
}

/* ── Tarefas ────────────────────────────────────────────────────── */

export const STATUS_TAREFA = tabela({
  backlog: { rotulo: "Backlog", tom: "neutro" },
  fazendo: { rotulo: "Em andamento", tom: "azul" },
  revisao: { rotulo: "Em revisão", tom: "alerta" },
  concluida: { rotulo: "Concluída", tom: "sucesso" },
});

export const PRIORIDADE = tabela({
  urgente: { rotulo: "Urgente", tom: "perigo" },
  alta: { rotulo: "Alta", tom: "alerta" },
  media: { rotulo: "Média", tom: "azul" },
  baixa: { rotulo: "Baixa", tom: "neutro" },
});

/* ── Projetos ───────────────────────────────────────────────────── */

export const STATUS_PROJETO = tabela({
  planejado: { rotulo: "Planejado", tom: "neutro" },
  ativo: { rotulo: "Em execução", tom: "azul" },
  pausado: { rotulo: "Pausado", tom: "alerta" },
  concluido: { rotulo: "Concluído", tom: "sucesso" },
  cancelado: { rotulo: "Cancelado", tom: "perigo" },
});

/* ── Clientes ───────────────────────────────────────────────────── */

export const STATUS_CLIENTE = tabela({
  prospecto: { rotulo: "Prospecto", tom: "neutro" },
  onboarding: { rotulo: "Onboarding", tom: "alerta" },
  ativo: { rotulo: "Ativo", tom: "sucesso" },
  pausado: { rotulo: "Pausado", tom: "alerta" },
  encerrado: { rotulo: "Encerrado", tom: "perigo" },
});

/**
 * Status em que o contrato já vale dinheiro.
 *
 * `onboarding` conta porque o contrato foi assinado e o fee, acordado: a
 * conta ainda está sendo instalada, mas a receita já é compromisso dos
 * dois lados. Fora dessa lista, um cliente recém-cadastrado não aparecia
 * em número nenhum — e quem acabou de fechar abre o painel justamente
 * para ver o valor subir.
 *
 * `pausado` fica de fora porque a cobrança parou, `prospecto` porque
 * ainda não há contrato, e `encerrado` porque acabou.
 */
export const STATUS_CONTRATADO = ["ativo", "onboarding"] as const;

export function contratado(status: string) {
  return (STATUS_CONTRATADO as readonly string[]).includes(status);
}

/**
 * MRR de uma lista de clientes.
 *
 * Existe como função porque a mesma soma aparece na visão geral e na
 * carteira. Enquanto era uma linha copiada nos dois lugares, mudar a
 * regra num arquivo e esquecer o outro deixava as duas telas discordando
 * sobre quanto a agência fatura.
 */
export function somarMrr(clientes: readonly { status: string; fee_mensal: number }[]) {
  return clientes.reduce((s, c) => (contratado(c.status) ? s + c.fee_mensal : s), 0);
}

/* ── Financeiro ─────────────────────────────────────────────────── */

export const STATUS_LANCAMENTO = tabela({
  previsto: { rotulo: "Previsto", tom: "neutro" },
  pendente: { rotulo: "A receber", tom: "azul" },
  pago: { rotulo: "Pago", tom: "sucesso" },
  atrasado: { rotulo: "Atrasado", tom: "perigo" },
  cancelado: { rotulo: "Cancelado", tom: "neutro" },
});

export const TIPO_LANCAMENTO = tabela({
  receita: { rotulo: "Receita", tom: "sucesso" },
  despesa: { rotulo: "Despesa", tom: "perigo" },
});

/* ── Propostas ──────────────────────────────────────────────────── */

export const STATUS_PROPOSTA = tabela({
  rascunho: { rotulo: "Rascunho", tom: "neutro" },
  enviada: { rotulo: "Enviada", tom: "azul" },
  visualizada: { rotulo: "Visualizada", tom: "alerta" },
  aceita: { rotulo: "Aceita", tom: "sucesso" },
  recusada: { rotulo: "Recusada", tom: "perigo" },
  expirada: { rotulo: "Expirada", tom: "neutro" },
});

/* ── Integrações e automações ───────────────────────────────────── */

export const STATUS_INTEGRACAO = tabela({
  conectada: { rotulo: "Conectada", tom: "sucesso" },
  desconectada: { rotulo: "Desconectada", tom: "neutro" },
  expirada: { rotulo: "Token expirado", tom: "alerta" },
  erro: { rotulo: "Com erro", tom: "perigo" },
});

/* ── Permissões (usado na matriz da tela de equipe) ─────────────── */

export const RECURSO = tabela({
  visao: { rotulo: "Visão geral", tom: "neutro" },
  metricas: { rotulo: "Métricas", tom: "neutro" },
  projetos: { rotulo: "Projetos", tom: "neutro" },
  tarefas: { rotulo: "Tarefas", tom: "neutro" },
  crm: { rotulo: "CRM", tom: "neutro" },
  clientes: { rotulo: "Clientes", tom: "neutro" },
  propostas: { rotulo: "Propostas", tom: "neutro" },
  financeiro: { rotulo: "Financeiro", tom: "neutro" },
  integracoes: { rotulo: "Integrações", tom: "neutro" },
  automacoes: { rotulo: "Automações", tom: "neutro" },
  relatorios: { rotulo: "Relatórios", tom: "neutro" },
  equipe: { rotulo: "Equipe", tom: "neutro" },
  configuracoes: { rotulo: "Configurações", tom: "neutro" },
});

export const ACAO = tabela({
  ver: { rotulo: "Ver", tom: "neutro" },
  criar: { rotulo: "Criar", tom: "neutro" },
  editar: { rotulo: "Editar", tom: "neutro" },
  excluir: { rotulo: "Excluir", tom: "neutro" },
});

/** "ver, criar, editar, excluir" → "Acesso total"; menos que isso, o que é. */
export function nivelDeAcesso(acoes: readonly string[] | undefined) {
  if (!acoes?.length) return "Sem acesso";
  if (acoes.length >= 4) return "Total";
  if (acoes.includes("editar") || acoes.includes("criar")) return "Edição";
  return "Leitura";
}

/* ── Atividades do CRM ──────────────────────────────────────────── */

export const TIPO_ATIVIDADE = tabela({
  nota: { rotulo: "Nota", tom: "neutro" },
  ligacao: { rotulo: "Ligação", tom: "azul" },
  reuniao: { rotulo: "Reunião", tom: "azul" },
  email: { rotulo: "E-mail", tom: "neutro" },
  whatsapp: { rotulo: "WhatsApp", tom: "sucesso" },
});

/* ── Tarefas: recorrência ────────────────────────────────────────

   Estas listas moram aqui, e não junto das Server Actions que as usam:
   um arquivo `"use server"` só pode exportar função assíncrona, e
   exportar uma constante dele derruba o módulo inteiro em produção —
   com a tela caindo em "A server error occurred". O `tsc` e o ESLint
   não pegam isso; só o build de produção. */

export const RECORRENCIAS = ["diaria", "semanal", "quinzenal", "mensal"] as const;

export const ROTULO_RECORRENCIA: Record<string, string> = {
  diaria: "Todo dia",
  semanal: "Toda semana",
  quinzenal: "A cada 15 dias",
  mensal: "Todo mês",
};

/* ── Propostas: duração do contrato ──────────────────────────── */

/**
 * Prazos que a agência oferece, em meses.
 *
 * O semestral é o padrão: tráfego pago leva de 60 a 90 dias só para sair
 * da fase de aprendizado, então um contrato de 3 meses termina quando a
 * operação mal começou a render — e o cliente vai embora achando que não
 * funcionou.
 */
export const PRAZOS_CONTRATO = [3, 6, 12, 24] as const;

export const PRAZO_PADRAO = 6;

export function rotuloPrazo(meses: number) {
  if (meses === 1) return "1 mês";
  if (meses === 12) return "12 meses (1 ano)";
  if (meses === 24) return "24 meses (2 anos)";
  return `${meses} meses`;
}

/** Aceita só os prazos oferecidos; qualquer outro vira o padrão. */
export function prazoValido(meses: unknown) {
  const n = Number(meses);
  return (PRAZOS_CONTRATO as readonly number[]).includes(n) ? n : PRAZO_PADRAO;
}

/* ── Financeiro: forma de pagamento ──────────────────────────── */

export const FORMAS_PAGAMENTO = ["pix", "boleto", "cartao", "transferencia", "dinheiro"] as const;

export const ROTULO_FORMA: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  cartao: "Cartão",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};
