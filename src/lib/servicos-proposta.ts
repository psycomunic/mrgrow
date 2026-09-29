/**
 * As fichas dos serviços da MR Grow.
 *
 * ============================================================
 * POR QUE UM CATÁLOGO, E NÃO TEXTO DIGITADO A CADA PROPOSTA
 * ============================================================
 * A proposta antiga tinha um campo de escopo em texto livre. O que saía
 * dali dependia da pressa de quem montou: numa proposta o tráfego vinha
 * com seis linhas de entrega, na seguinte com uma frase. O cliente que
 * recebe as duas não vê duas propostas — vê uma agência que não sabe o
 * que vende.
 *
 * Aqui cada serviço tem sempre as mesmas quatro coisas: para quem é, o
 * que promete, o que entrega e — a que mais importa — o que NÃO inclui.
 *
 * ============================================================
 * POR QUE O "NÃO INCLUI" É OBRIGATÓRIO
 * ============================================================
 * É a parte que evita a briga do segundo mês. Proposta que só lista
 * entregas deixa o resto do universo em aberto, e cada pedido que cai
 * fora do escopo vira uma conversa desconfortável sobre o que estava
 * combinado. Escrito na proposta, o limite já foi aceito junto com o
 * preço.
 *
 * Sem `import`: isto é dado puro, roda no servidor, no cliente e em
 * teste.
 */

export type Cobranca = "mensal" | "projeto";
export type Papel = "principal" | "complemento";

export type FichaServico = {
  id: string;
  nome: string;
  /** `principal` sustenta a conta; `complemento` só faz sentido junto. */
  papel: Papel;
  /** `projeto` cobra uma vez. Sem isto a tela escreveria "por mês"
      embaixo de um valor de entrega única. */
  cobranca: Cobranca;
  /** Uma linha curta, em caixa alta na tela: para quem este serviço é. */
  paraQuem: string;
  /** O que a pessoa leva. Uma frase, no que ela ganha — não no que a
      agência faz. */
  promessa: string;
  entregas: string[];
  naoInclui: string[];
};

export const SERVICOS: FichaServico[] = [
  {
    id: "estrategia",
    nome: "Planejamento estratégico",
    papel: "principal",
    cobranca: "mensal",
    paraQuem: "Para quem publica sem direção",
    promessa:
      "Todo mês começa com o que vai ao ar já decidido: tema, objetivo e calendário. Nada de post escolhido na véspera, e nada de mês que termina sem ninguém saber o que foi testado.",
    entregas: [
      "Reunião de planejamento no início de cada mês",
      "Tema e objetivo comercial definidos por semana",
      "Calendário de publicação aprovado antes de produzir",
      "Revisão de posicionamento e de oferta a cada trimestre",
    ],
    naoInclui: [
      "Consultoria de precificação ou de margem do produto",
      "Plano de negócio ou reestruturação societária",
    ],
  },
  {
    id: "social",
    nome: "Conteúdo para redes sociais",
    papel: "principal",
    cobranca: "mensal",
    paraQuem: "Para quem precisa de rede que venda",
    promessa:
      "Feed, reels e stories produzidos dentro do planejamento e com intenção comercial. Rede ativa não é a meta — é o meio de chegar a quem compra.",
    entregas: [
      "Feed, reels e stories dentro do calendário aprovado",
      "Copy escrita para cada peça, não legenda genérica",
      "Identidade visual aplicada com consistência",
      "Uma rodada de ajuste por peça antes de publicar",
    ],
    naoInclui: [
      "Resposta a comentário e direct (social listening)",
      "Produção com modelo, estúdio ou locação contratados",
    ],
  },
  {
    id: "video",
    nome: "Roteiro, captação e edição",
    papel: "principal",
    cobranca: "mensal",
    paraQuem: "Para quem precisa aparecer em vídeo",
    promessa:
      "O vídeo que converte não nasce de inspiração, nasce de roteiro. A MR Grow escreve, capta e edita, com legenda pronta para publicar.",
    entregas: [
      "Roteiro escrito antes de qualquer gravação",
      "Diária de captação por mês, na sua operação",
      "Edição com corte, legenda e trilha",
      "Versões cortadas para reels, stories e anúncio",
    ],
    naoInclui: [
      "Equipe de filmagem com diretor, áudio e iluminação dedicados",
      "Animação 3D e motion graphics de produção longa",
    ],
  },
  {
    id: "meta",
    nome: "Gestão de tráfego no Meta",
    papel: "principal",
    cobranca: "mensal",
    paraQuem: "Para quem quer demanda no Instagram e no Facebook",
    promessa:
      "O mesmo conteúdo que sustenta a rede vira anúncio, com estrutura por temperatura de público e leitura constante da conta — não ajuste no fim do mês.",
    entregas: [
      "Estrutura de campanhas por temperatura de público",
      "Matriz de criativos com teste semanal",
      "Rastreamento por Pixel e API de Conversões",
      "Ajuste de verba e de público durante o mês",
    ],
    naoInclui: [
      "A verba de mídia, que é paga por você direto à plataforma",
      "Recuperação de conta bloqueada ou de perfil banido",
    ],
  },
  {
    id: "google",
    nome: "Gestão de tráfego no Google",
    papel: "principal",
    cobranca: "mensal",
    paraQuem: "Para quem quer capturar procura ativa",
    promessa:
      "Search, Performance Max e remarketing capturando quem já está procurando o que você vende. É a demanda que existe antes de qualquer anúncio.",
    entregas: [
      "Campanhas de Search com pesquisa de termos",
      "Performance Max e remarketing configurados",
      "Rastreamento GA4 e Google Tag Manager",
      "Limpeza de termos negativos toda semana",
    ],
    naoInclui: [
      "A verba de mídia, que é paga por você direto à plataforma",
      "SEO orgânico e produção de conteúdo para blog",
    ],
  },
  {
    id: "relatorio",
    nome: "Relatório e acompanhamento",
    papel: "principal",
    cobranca: "mensal",
    paraQuem: "Para quem cansou de esperar o fim do mês",
    promessa:
      "Painel aberto com investimento e retorno, relatório mensal e grupo de WhatsApp direto com quem opera a conta. Você não descobre o resultado depois que ele já passou.",
    entregas: [
      "Acesso ao painel da MR Grow, atualizado sozinho",
      "Relatório mensal com o que funcionou e o que foi cortado",
      "Reunião de resultado por mês",
      "Grupo de WhatsApp com a equipe que opera",
    ],
    naoInclui: [
      "Plantão fora do horário comercial",
      "BI customizado fora do painel",
    ],
  },
  {
    id: "implantacao",
    nome: "Implantação e rastreamento",
    papel: "complemento",
    cobranca: "projeto",
    paraQuem: "Uma vez, no começo",
    promessa:
      "Antes de investir o primeiro real, a conta precisa saber medir. Aqui é onde o rastreamento é montado e conferido — sem isso, todo relatório depois é chute com aparência de número.",
    entregas: [
      "Auditoria da conta, da oferta e do que já foi investido",
      "GA4, Tag Manager, Pixel e API de Conversões instalados",
      "Conversões testadas uma a uma antes de subir campanha",
      "Estrutura inicial de campanhas e de públicos",
    ],
    naoInclui: [
      "Desenvolvimento no site além da instalação das tags",
      "Migração de plataforma de e-commerce",
    ],
  },
  {
    id: "landing",
    nome: "Landing page de campanha",
    papel: "complemento",
    cobranca: "projeto",
    paraQuem: "Para campanha que precisa de destino próprio",
    promessa:
      "Anúncio bom que cai numa página ruim morre na página. Uma landing escrita para a oferta da campanha, com teste A/B desde o primeiro dia.",
    entregas: [
      "Copy e estrutura escritas para a oferta anunciada",
      "Página responsiva, com carregamento medido",
      "Formulário integrado ao seu CRM ou WhatsApp",
      "Duas variantes para teste A/B",
    ],
    naoInclui: [
      "Site institucional completo com várias páginas",
      "Hospedagem e domínio, que ficam no seu nome",
    ],
  },
];

const PORID = new Map(SERVICOS.map((s) => [s.id, s]));

export function fichaDoServico(id: string): FichaServico | null {
  return PORID.get(id) ?? null;
}

export function emReais(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  });
}

/**
 * As condições que nascem dos serviços escolhidos.
 *
 * Existem em função do que foi vendido, e não numa lista fixa: prometer
 * "a verba de mídia é sua" numa proposta que não tem tráfego é responder
 * a uma pergunta que ninguém fez, e enche a tela de condição que não vale
 * para aquele cliente.
 */
export function condicoesDosServicos(ids: string[]): string[] {
  const fichas = ids
    .map(fichaDoServico)
    .filter((f): f is FichaServico => f !== null);
  const temMidia = fichas.some((f) => f.id === "meta" || f.id === "google");
  const temMensal = fichas.some((f) => f.cobranca === "mensal");

  const base: string[] = [];

  if (temMidia) {
    base.push(
      "A verba de mídia é paga por você direto ao Meta e ao Google. A MR Grow não intermedeia pagamento de plataforma, e o valor desta proposta é só o da gestão.",
    );
  }
  if (temMensal) {
    base.push(
      "As contas de anúncio, os perfis e o domínio ficam no seu nome. Se um dia a parceria acabar, nada precisa ser transferido.",
    );
  }

  base.push(
    "O primeiro mês é de implantação e leitura. Resultado de mídia se lê em ciclo, e número de semana isolada não diz o que está funcionando.",
    "Reunião de resultado por mês e grupo de WhatsApp aberto com quem opera a conta.",
  );

  return base;
}
