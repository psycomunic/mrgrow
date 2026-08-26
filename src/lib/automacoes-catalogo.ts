/**
 * Catálogo de gatilhos e ações das automações.
 *
 * Vive separado do motor (`automacoes.ts` é server-only) porque o construtor
 * roda no navegador e precisa das mesmas listas. E precisa da mesma tabela de
 * campos que o servidor usa para validar: com duas listas paralelas, o
 * formulário deixa salvar o que a validação recusa.
 */

import { PRIORIDADE } from "@/lib/rotulos";

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

/**
 * Os campos opcionais aqui são os que o motor preenche com um padrão quando
 * faltam. O construtor exige mais do que o tipo (ver `CAMPOS_DA_ACAO`): uma
 * notificação sem título salva, mas chega ao time como "Automação disparada".
 */
export type Acao =
  | { tipo: "notificar"; titulo?: string; mensagem?: string; para?: string }
  | { tipo: "email"; template: string; para?: string }
  | { tipo: "whatsapp"; template: string; para?: string }
  | { tipo: "criar_tarefa"; titulo: string; prazo_minutos?: number; prioridade?: string }
  | { tipo: "criar_cliente" }
  | { tipo: "criar_projeto"; modelo?: string }
  | { tipo: "mover_etapa"; etapa_id: string }
  | { tipo: "atualizar_saude_cliente"; delta: number }
  | { tipo: "webhook"; url: string; carga?: Record<string, unknown> };

export type TipoAcao = Acao["tipo"];

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

/**
 * `disponivel: false` marca a ação que o motor ainda não executa — ela cai no
 * `default` de `executarAcao` e devolve "ação não implementada". O construtor
 * não oferece essas, e o servidor recusa quem tentar salvar uma: automação
 * que grava e não roda é pior que automação que não existe.
 */
export const CATALOGO_ACOES: Array<{
  tipo: TipoAcao;
  rotulo: string;
  resumo: string;
  disponivel: boolean;
}> = [
  { tipo: "notificar", rotulo: "Notificar na plataforma", resumo: "Alerta no sininho de quem responde pela conta.", disponivel: true },
  { tipo: "criar_tarefa", rotulo: "Criar tarefa", resumo: "Abre a tarefa no quadro da operação.", disponivel: true },
  { tipo: "mover_etapa", rotulo: "Mover no funil", resumo: "Leva o negócio do disparo para outra etapa.", disponivel: true },
  { tipo: "atualizar_saude_cliente", rotulo: "Ajustar saúde do cliente", resumo: "Soma ou subtrai pontos do termômetro da conta.", disponivel: true },
  { tipo: "webhook", rotulo: "Chamar webhook", resumo: "POST com o contexto do disparo em JSON.", disponivel: true },
  { tipo: "email", rotulo: "Enviar e-mail", resumo: "Entra na fila de envio até o provedor estar conectado.", disponivel: true },
  { tipo: "whatsapp", rotulo: "Enviar WhatsApp", resumo: "Entra na fila de envio até a API estar conectada.", disponivel: true },
  { tipo: "criar_cliente", rotulo: "Criar cliente", resumo: "Ainda não implementada no motor.", disponivel: false },
  { tipo: "criar_projeto", rotulo: "Criar projeto a partir de modelo", resumo: "Ainda não implementada no motor.", disponivel: false },
];

/** Prazos em minutos, que é a unidade que o motor grava em `prazo_minutos`. */
export const PRAZOS_TAREFA = [
  { valor: "", rotulo: "Sem prazo" },
  { valor: "60", rotulo: "1 hora" },
  { valor: "240", rotulo: "4 horas" },
  { valor: "1440", rotulo: "1 dia" },
  { valor: "4320", rotulo: "3 dias" },
  { valor: "10080", rotulo: "7 dias" },
] as const;

export type CampoAcao = {
  chave: string;
  rotulo: string;
  /** Como o construtor desenha o campo e como o servidor confere o valor. */
  tipo: "texto" | "linhas" | "numero" | "url" | "etapa" | "prazo" | "selecao";
  obrigatorio: boolean;
  dica?: string;
  exemplo?: string;
  opcoes?: ReadonlyArray<{ valor: string; rotulo: string }>;
  limite?: number;
  minimo?: number;
  maximo?: number;
};

export const CAMPOS_DA_ACAO: Record<TipoAcao, CampoAcao[]> = {
  notificar: [
    { chave: "titulo", rotulo: "Título do alerta", tipo: "texto", obrigatorio: true, limite: 120, exemplo: "Conta parada há 24h" },
    { chave: "mensagem", rotulo: "Mensagem", tipo: "linhas", obrigatorio: true, limite: 500, exemplo: "Confira o orçamento e o status das campanhas antes do fim do dia." },
  ],
  criar_tarefa: [
    { chave: "titulo", rotulo: "Título da tarefa", tipo: "texto", obrigatorio: true, limite: 160, exemplo: "Revisar criativos da conta" },
    { chave: "prazo_minutos", rotulo: "Prazo", tipo: "prazo", obrigatorio: false, dica: "Contado a partir do disparo.", opcoes: PRAZOS_TAREFA },
    { chave: "prioridade", rotulo: "Prioridade", tipo: "selecao", obrigatorio: false, opcoes: PRIORIDADE.lista.map((p) => ({ valor: p.valor, rotulo: p.rotulo })) },
  ],
  mover_etapa: [
    { chave: "etapa_id", rotulo: "Etapa de destino", tipo: "etapa", obrigatorio: true },
  ],
  atualizar_saude_cliente: [
    { chave: "delta", rotulo: "Pontos de saúde", tipo: "numero", obrigatorio: true, minimo: -100, maximo: 100, dica: "Use negativo para penalizar a conta." },
  ],
  webhook: [
    { chave: "url", rotulo: "URL do webhook", tipo: "url", obrigatorio: true, limite: 500, exemplo: "https://hooks.slack.com/services/…", dica: "Só https e host público." },
  ],
  email: [
    { chave: "template", rotulo: "Modelo de e-mail", tipo: "texto", obrigatorio: true, limite: 80, exemplo: "cobranca_previa" },
    { chave: "para", rotulo: "Destinatário", tipo: "texto", obrigatorio: false, limite: 160, dica: "Em branco, vai para o responsável da conta." },
  ],
  whatsapp: [
    { chave: "template", rotulo: "Modelo de mensagem", tipo: "texto", obrigatorio: true, limite: 80, exemplo: "lead_novo" },
    { chave: "para", rotulo: "Destinatário", tipo: "texto", obrigatorio: false, limite: 160, dica: "Em branco, vai para o responsável da conta." },
  ],
  criar_cliente: [],
  criar_projeto: [
    { chave: "modelo", rotulo: "Modelo de projeto", tipo: "texto", obrigatorio: false, limite: 80 },
  ],
};

const GATILHO_POR_VALOR = new Map(CATALOGO_GATILHOS.map((g) => [g.valor, g]));
const ACAO_POR_TIPO = new Map(CATALOGO_ACOES.map((a) => [a.tipo, a]));

export const gatilhoDoCatalogo = (valor: string | null | undefined) =>
  valor ? GATILHO_POR_VALOR.get(valor as Gatilho) : undefined;

export const acaoDoCatalogo = (tipo: string | null | undefined) =>
  tipo ? ACAO_POR_TIPO.get(tipo as TipoAcao) : undefined;

/** "Lead recebido" para a tela; o valor cru só aparece se o banco mudar antes daqui. */
export const rotuloDoGatilho = (valor: string | null | undefined) =>
  gatilhoDoCatalogo(valor)?.rotulo ?? (valor ?? "—");

export const rotuloDaAcao = (tipo: string | null | undefined) =>
  acaoDoCatalogo(tipo)?.rotulo ?? (tipo ?? "—");
