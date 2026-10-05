/**
 * Os três planos da MR Grow, como a proposta real os apresenta.
 *
 * Vieram da proposta que a agência já manda hoje — Basic, Pro e Premium —
 * com as entregas palavra por palavra. O que mudou aqui foi só a forma:
 * lá eram cartões de texto corrido, difíceis de comparar; aqui cada plano
 * tem os mesmos campos, na mesma ordem, e a diferença entre eles fica
 * visível em vez de ter que ser garimpada.
 *
 * O Pro é marcado como recomendado porque é o que a agência chama de
 * "plano campeão". Isso não é enfeite: proposta que mostra três preços
 * sem dizer qual serve convida o cliente a comprar para baixo.
 *
 * Sem `import`: dado puro, roda no servidor, no cliente e em teste.
 */

export type Nivel = "basic" | "pro" | "premium";

export type Plano = {
  id: Nivel;
  nome: string;
  tagline: string;
  /** Para quem o plano foi desenhado. Dois parágrafos, no máximo. */
  resumo: string;
  entregas: string[];
  /** O que este plano tem e o anterior não. Vazio no primeiro. */
  diferenciais: string[];
  /** Quem grava os vídeos. É a dúvida que mais volta na negociação. */
  videos: string;
  /** Preço de tabela, mostrado na tela que compara os três planos. */
  preco: number;
  recomendado?: boolean;
};

export const PLANOS: Plano[] = [
  {
    id: "basic",
    nome: "Grow Basic",
    preco: 3000,
    tagline: "Estratégia + conteúdo base + tráfego",
    resumo:
      "Para quem quer organizar o marketing e sair do improviso, mas tem estrutura interna para executar parte da produção. A MR Grow entrega o planejamento, a direção dos conteúdos, um pacote base de artes e a gestão do tráfego.",
    entregas: [
      "Planejamento estratégico mensal de marketing",
      "Cronograma mensal de conteúdo + roteiro de stories",
      "6 a 8 posts mensais em formato de arte",
      "Direcionamento dos temas para redes sociais",
      "Scripts estratégicos para gravação de vídeos",
      "Planejamento e gestão das campanhas de tráfego pago",
      "Relatórios mensais de resultados",
      "1 reunião estratégica mensal",
      "Grupo de WhatsApp para acompanhamento",
    ],
    diferenciais: [],
    videos:
      "A Grow escreve os scripts e você grava. Com os vídeos em mãos, a Grow usa o material dentro da estratégia de conteúdo e de anúncio.",
  },
  {
    id: "pro",
    nome: "Grow Pro",
    preco: 4000,
    tagline: "Conteúdo + tráfego + posicionamento",
    resumo:
      "O equilíbrio entre estratégia, execução e performance — e o plano que a MR Grow mais recomenda. Aqui a agência assume a estratégia, a criação dos conteúdos, os roteiros, a edição dos vídeos, o tráfego e o acompanhamento. Para marcas que querem uma operação completa sem montar equipe interna.",
    entregas: [
      "Planejamento estratégico mensal de marketing",
      "12 posts mensais entre feed e reels",
      "Scripts estratégicos para gravação de vídeos",
      "Edição e produção de vídeos, com legenda",
      "Gestão de tráfego pago com análise de performance",
      "Relatórios mensais de resultados",
      "Cronograma mensal de conteúdo + roteiro de stories",
      "1 reunião estratégica mensal",
      "1 visita mensal presencial da social media",
      "Grupo de WhatsApp para acompanhamento",
    ],
    diferenciais: [
      "A Grow grava e edita: você não precisa produzir vídeo",
      "Visita presencial por mês, para conteúdo real em vez de genérico",
      "Conteúdo com intenção comercial, não só post bonito",
      "Rota ajustada a cada mês, com resultado na mesa",
    ],
    videos:
      "A Grow escreve, capta e edita. A visita presencial mensal existe para isso: o conteúdo sai da sua operação, não de banco de imagem.",
    recomendado: true,
  },
  {
    id: "premium",
    nome: "Grow Premium",
    preco: 7000,
    tagline: "Conteúdo + tráfego multicanal + posicionamento avançado",
    resumo:
      "Para marcas que precisam de mais volume, mais acompanhamento e mais fontes de tráfego. Operação intensa: planejamento, produção, captação presencial, Meta e Google rodando juntos, e análise constante para ampliar as oportunidades de venda.",
    entregas: [
      "Planejamento estratégico mensal de marketing",
      "20 conteúdos mensais, média de 5 por semana",
      "Scripts estratégicos para gravação de vídeos",
      "Edição e produção de vídeos, com legenda",
      "Gestão de tráfego pago no Meta Ads",
      "Gestão de tráfego pago no Google Ads",
      "Análise de performance das campanhas",
      "Relatórios mensais de resultados",
      "Cronograma mensal de conteúdo + roteiro de stories",
      "1 reunião estratégica mensal",
      "2 visitas mensais presenciais para captação",
      "Grupo de WhatsApp para acompanhamento",
    ],
    diferenciais: [
      "Volume quase dobrado: 20 conteúdos por mês",
      "Duas fontes de tráfego, Meta e Google, lendo uma a outra",
      "Duas captações presenciais por mês",
      "Mais espaço para teste, campanha e otimização",
    ],
    videos:
      "A Grow escreve, capta e edita, em duas visitas por mês. É o volume que sustenta cinco conteúdos por semana.",
  },
];

export function plano(id: string): Plano | null {
  return PLANOS.find((p) => p.id === id) ?? null;
}

/**
 * Os números da agência.
 *
 * Entram antes de qualquer preço, e por um motivo: o cliente que abre uma
 * proposta não sabe se está falando com alguém que já fez isso centenas
 * de vezes ou com alguém no segundo mês. Dez anos e nove milhões de verba
 * respondem isso em quatro segundos.
 */
export const NUMEROS = [
  { valor: 2326, rotulo: "campanhas otimizadas", prefixo: "+" },
  { valor: 583, rotulo: "empresas posicionadas", prefixo: "+" },
  { valor: 9, rotulo: "milhões de verba em anúncios", prefixo: "+R$ " },
  { valor: 10, rotulo: "anos de mercado", prefixo: "+" },
];

/** De onde vem o clique. */
export const PONTO_A = [
  {
    canal: "Facebook",
    texto:
      "Campanhas estruturadas por consciência de compra: cada público recebe o anúncio que faz sentido para o momento dele, e não o mesmo criativo para todo mundo.",
  },
  {
    canal: "Instagram",
    texto:
      "A mesma estrutura, com criativo e posicionamento próprios — feed, stories, reels. Os números de cada plataforma decidem onde a verba cresce.",
  },
  {
    canal: "Google Ads",
    texto:
      "Onde a procura já existe. Quem pesquisa o que você vende está mais perto da decisão do que qualquer público frio — e é ali que a MR Grow coloca sua marca nas primeiras posições.",
  },
];

/** Para onde ele vai. */
export const PONTO_B = [
  {
    canal: "WhatsApp",
    texto:
      "A conversa é onde a venda acontece. O lead chega com contexto, o atendimento continua de onde o anúncio parou, e quem não fecha agora entra numa lista de remarketing em vez de virar número perdido.",
  },
  {
    canal: "Página de vendas",
    texto:
      "Seja loja ou página de captura: domínio próprio, estrutura pensada para converter e os dados de quem visitou. É o que transforma tráfego em inteligência, e não só em visita.",
  },
];
