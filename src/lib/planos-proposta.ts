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
  /**
   * O cartão do plano exatamente como a proposta impressa da agência:
   * os parágrafos de apresentação e os blocos de lista, palavra por
   * palavra. É o texto que o cliente compara, então não é resumido.
   */
  cartao: {
    descricao: string[];
    blocos: { titulo: string; itens: string[] }[];
  };
  recomendado?: boolean;
};

export const PLANOS: Plano[] = [
  {
    id: "basic",
    nome: "Grow Basic",
    preco: 3000,
    cartao: {
      descricao: [
        "Uma assessoria estratégica para empresas que querem organizar o marketing, sair do improviso e ter uma direção clara para crescer no digital, mas que possuem estrutura interna para executar parte da produção de conteúdo.",
        "No plano Grow Basic, a MR Grow entrega o planejamento mensal, o direcionamento estratégico dos conteúdos, um pacote base de artes para manter a rede social ativa e organizada, além da estruturação e gestão das campanhas de tráfego pago. A parte de vídeos funciona de forma direcionada: a Grow desenvolve os scripts estratégicos, apresenta para aprovação e, após aprovados, o cliente fica responsável pela gravação e envio dos materiais. Com os vídeos captados, a Grow utiliza esses conteúdos dentro da estratégia de comunicação e anúncios.",
      ],
      blocos: [
        {
          titulo: "Entregas da assessoria",
          itens: [
            "Planejamento estratégico mensal de marketing",
            "1 reunião estratégica mensal",
            "Criação do cronograma mensal de conteúdo",
            "Criação de 6 a 8 posts mensais em formato de arte",
            "Direcionamento dos temas de conteúdo para redes sociais",
            "Scripts estratégicos para gravação de vídeos",
            "Roteiro de stories para execução interna",
            "Planejamento das campanhas de tráfego pago",
            "Gestão de tráfego pago com análise de performance",
            "Relatórios mensais de resultados",
            "Grupo de WhatsApp para acompanhamento",
          ],
        },
        {
          titulo: "Funcionamento dos vídeos",
          itens: [
            "A Grow cria os scripts estratégicos",
            "O cliente avalia e aprova os roteiros",
            "O cliente realiza a captação/gravação dos vídeos",
            "O cliente envia os materiais captados para a Grow",
            "A Grow utiliza os vídeos dentro da estratégia de conteúdo e tráfego",
          ],
        },
        {
          titulo: "Responsabilidade do cliente",
          itens: [
            "Gravação dos vídeos conforme os scripts aprovados",
            "Envio dos vídeos captados para a equipe Grow",
            "Execução dos stories orientados no planejamento",
            "Aprovação dos conteúdos e materiais dentro dos prazos alinhados",
          ],
        },
      ],
    },
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
    cartao: {
      descricao: [
        "O plano mais recomendado da MR Grow para empresas que querem profissionalizar sua presença digital, gerar mais demanda e parar de depender de conteúdos feitos no improviso. O Grow Pro foi desenhado para marcas que precisam de uma operação completa de marketing, mas ainda não precisam de uma estrutura premium com múltiplas fontes de tráfego e maior volume de captação.",
        "Aqui, a MR Grow assume a estratégia, o planejamento, a criação dos conteúdos, os roteiros, a edição dos vídeos, a gestão do tráfego pago e o acompanhamento mensal da performance. É o plano ideal para empresas que querem ter uma comunicação mais forte, uma rede social mais organizada, anúncios rodando com inteligência e uma presença digital capaz de atrair, educar e converter novos clientes. Por isso, o Grow Pro é o nosso plano campeão: ele entrega o equilíbrio perfeito entre estratégia, execução e performance.",
      ],
      blocos: [
        {
          titulo: "Entregas da assessoria",
          itens: [
            "Planejamento estratégico mensal de marketing",
            "Criação de 12 posts mensais para redes sociais, entre feed e reels",
            "Scripts estratégicos para gravação de vídeos",
            "Edição e produção de vídeos e legendas",
            "Gestão de tráfego pago com análise de performance",
            "Relatórios mensais de resultados",
            "Cronograma mensal de conteúdo + roteiro de stories",
            "1 reunião estratégica mensal",
            "1 visita mensal presencial da Social Media",
            "Grupo de WhatsApp para acompanhamento",
          ],
        },
        {
          titulo: "Por que o Grow Pro é o mais recomendado?",
          itens: [
            "Une estratégia, conteúdo e tráfego em uma única assessoria",
            "Mantém a rede social ativa, profissional e bem posicionada",
            "Gera conteúdo com intenção comercial, não apenas posts bonitos",
            "Inclui captação presencial para criar conteúdos mais reais e humanizados",
            "Permite acompanhar resultados e ajustar a rota mensalmente",
            "É ideal para empresas que querem crescer com consistência, sem montar uma equipe interna de marketing",
          ],
        },
      ],
    },
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
    cartao: {
      descricao: [
        "Uma assessoria completa para empresas que querem aumentar a presença digital, acelerar a geração de demanda e trabalhar o marketing com mais frequência, profundidade e performance.",
        "O plano Grow Premium foi desenvolvido para marcas que precisam de mais volume de conteúdo, mais acompanhamento estratégico e mais fontes de tráfego para crescer com consistência no digital.",
        "Aqui, a MR Grow atua com uma operação mais intensa, unindo planejamento estratégico, produção de conteúdo, captação presencial, tráfego pago em Meta Ads e Google Ads, além de análises constantes para fortalecer o posicionamento e ampliar as oportunidades de venda.",
      ],
      blocos: [
        {
          titulo: "Entregas da assessoria",
          itens: [
            "Planejamento estratégico mensal de marketing",
            "Criação de 20 conteúdos mensais para redes sociais",
            "Frequência média de 5 conteúdos por semana",
            "Scripts estratégicos para gravação de vídeos",
            "Edição e produção de vídeos e legendas",
            "Gestão de tráfego pago no Meta Ads",
            "Gestão de tráfego pago no Google Ads",
            "Análise de performance das campanhas",
            "Relatórios mensais de resultados",
            "Cronograma mensal de conteúdo + roteiro de stories",
            "1 reunião estratégica mensal",
            "2 visitas mensais presenciais para captação de conteúdo",
            "Grupo de WhatsApp para acompanhamento",
          ],
        },
        {
          titulo: "Diferenciais do plano Premium",
          itens: [
            "Maior volume de conteúdo mensal",
            "Mais frequência de presença nas redes sociais",
            "2 fontes de tráfego: Meta Ads e Google Ads",
            "Mais captação presencial para gerar conteúdos reais",
            "Mais possibilidades de testes, campanhas e otimizações",
            "Maior estrutura para empresas que querem acelerar a demanda",
          ],
        },
      ],
    },
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
