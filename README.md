# MR Grow · Plataforma

Landing page de alta conversão + sistema completo de gestão da agência (CRM, clientes, financeiro, projetos, integrações Meta/Google e automações), em um único projeto Next.js.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth + RLS + Storage) · Recharts · Zod.

---

## Direção visual da landing: "Operação"

A landing tem sistema visual próprio, sem Tailwind, em
`src/app/(site)/sitio.css` (tokens e base) e `secoes.css` (seções), escopado sob
a classe `.sitio`. O painel e o portal continuam no Tailwind com os tokens
`ink-*` / `mrg-*` de `globals.css` — os dois sistemas convivem sem colidir.

Agência escura e editorial, com o trabalho entregue como material. A direção foge
de dois lugares comuns: o preto neutro com um neon ácido (o escuro padrão de IA) e
o azul elétrico com vidro fosco (o SaaS genérico do site antigo). O chão é petróleo,
cromático, derivado do próprio logotipo, e quem grita é a tipografia.

| Token | Valor | Papel |
|---|---|---|
| `--breu` | `#05121A` | Chão da página |
| `--carvao` | `#0A1F2A` | Superfícies erguidas |
| `--fio` | `#16323F` | Fios de 1px — a estrutura inteira |
| `--osso` | `#F2EDE6` | Texto, quente, não branco puro |
| `--nevoa` | `#93A9B5` | Texto secundário |
| `--azul` | `#3E9BD6` | Marca, clareada para o escuro |
| `--brasa` | `#E4633A` | Só o que sangra dinheiro |

**Tipografia:** Bricolage Grotesque (títulos, com eixo de largura) e Schibsted
Grotesk (texto). Sem monoespaçada.

**Assinatura:** a faixa do hero (`_componentes/faixa.tsx`), onde os 12 sites
entregues correm em movimento lento e param no hover.

**Três armadilhas de CSS já corrigidas — não reintroduza:**
1. O reset usa `:where()`. Sem isso, `.sitio p` vence qualquer classe de uma só
   e todo `margin-top` de parágrafo da página some.
2. Os logos dos clientes vêm em cinza sobre branco: `invert(1)` mais
   `mix-blend-mode: screen` clareia a marca e dissolve o fundo.
3. O mapa do Brasil **não** aceita esse tratamento — invertê-lo escurece o país
   inteiro. Ele fica numa chapa clara, lido como encarte.

---|---|---|
| `--tinta` | `#04202F` | Texto e faixas escuras |
| `--azul` | `#005080` | Marca — amostrado do logotipo real |
| `--papel` | `#E9EDEF` | Fundo |
| `--ficha` | `#FFFFFF` | Cartões e linhas |
| `--caneta` | `#A32C21` | O dinheiro que sai e o lado da agência comum |
| `--regua` | `#C4CFD6` | Fios e divisórias |

**Tipografia:** Archivo (com eixo de largura, para os títulos) e Martian Mono
(rótulos, unidades e valores). O contraste vem de peso, largura e caixa.

**Assinatura:** o extrato do hero (`_componentes/extrato.tsx`). É deliberadamente
um server component sem animação — o número é o argumento e não pode depender de
JavaScript para existir.

**Duas armadilhas de CSS que já foram corrigidas — não reintroduza:**
1. O reset usa `:where()`. Sem isso, `.sitio p` vence qualquer classe de uma só e
   todo `margin-top` de parágrafo da página some.
2. Os overrides do plano destacado usam `.plano.plano--destaque` (classe dobrada),
   porque as regras base declaradas depois empatariam em especificidade e venceriam
   — deixando texto escuro sobre fundo escuro.

---

## O que já está pronto

### Site público (`/`)
Landing page completa, escrita para converter:

| Seção | Papel na conversão |
|---|---|
| Hero | Promessa + prova numérica + CTA duplo (formulário e WhatsApp) |
| Prova social | Segmentos atendidos, reduz o "será que serve pra mim?" |
| Dores | Espelho do problema — qualifica e cria urgência |
| Método G.R.O.W | Transforma serviço em processo, justifica preço |
| Serviços | O escopo real, com tags de plataforma |
| Resultados | Cases com antes/depois + depoimentos |
| Trabalho | 12 sites e landing pages reais, com a captura completa rolando no hover |
| Processo | Numerado — aqui a ordem é informação, cada etapa tem prazo |
| Comparativo | Agência comum × MR Grow — quebra objeção de "já tenho agência" |
| Processo | Prazos explícitos, reduz medo de contratar |
| Planos | Ancoragem de preço com plano do meio destacado |
| Sobre o Mateus | Autoridade e rosto por trás da marca |
| FAQ | 8 objeções tratadas + `FAQPage` schema.org |
| CTA final | Formulário em 3 passos com validação e rastreamento |

Extras de performance de campanha:
- **Formulário multi-passo** (menos atrito, mais conclusão) com honeypot anti-spam e máscara de telefone.
- **Lead scoring automático** (0–100) por faturamento, investimento e engajamento — o comercial ataca o melhor primeiro.
- **Rastreamento duplo**: Meta Pixel no navegador + **Conversions API** no servidor, deduplicados pelo mesmo `event_id`.
- **Atribuição persistente**: UTMs, `fbclid` e `gclid` capturados na primeira visita e enviados junto do lead.
- CTA fixo no mobile, botão flutuante de WhatsApp, JSON-LD, `sitemap.xml` e `robots.txt`.

### Painel da agência (`/painel`)
| Rota | O que faz |
|---|---|
| `/painel` | Visão geral: MRR, clientes, mídia sob gestão, ROAS, pipeline, saúde das contas |
| `/painel/metricas` | Consolidado de Meta + Google + GA4 com CPL, CPC, CTR, ROAS e desempenho por conta |
| `/painel/crm` | Funil kanban com arrastar-e-soltar, temperatura, origem e previsão |
| `/painel/clientes` | Carteira com saúde da conta, fee, ROAS e NPS · página individual por cliente |
| `/painel/propostas` | Propostas com link público, token de aceite e taxa de conversão |
| `/painel/financeiro` | Receitas, despesas, fluxo de caixa, inadimplência |
| `/painel/projetos` · `/painel/tarefas` | Operação por cliente, kanban de tarefas |
| `/painel/integracoes` | Central OAuth de Meta Ads, Google Ads, GA4, WhatsApp, Asaas, Slack |
| `/painel/automacoes` | 13 gatilhos × 9 ações, com histórico de execução |
| `/painel/relatorios` | Relatório recorrente por cliente com link público |
| `/painel/equipe` | Membros, papéis e matriz de permissões |
| `/painel/configuracoes` | Dados da agência e checklist de credenciais |

### Portal do cliente (`/portal`)
O cliente entra com o mesmo login e vê **apenas as contas liberadas para ele**: desempenho, relatórios, faturas e entregas em andamento. A restrição é garantida por RLS no banco, não só pela interface.

---

## Rodando o projeto

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre em <http://localhost:3000>. **Sem o Supabase configurado o projeto roda em modo demonstração** — todas as telas abrem com dados fictícios, para você ver e ajustar o visual antes de conectar o banco.

Para conectar de verdade, siga o `SETUP.md`.

---

## Estrutura

```
src/
├── app/
│   ├── (site)/            Landing page e seus componentes
│   ├── (auth)/            Entrar, cadastro, recuperar senha
│   ├── painel/            Sistema da agência
│   ├── portal/            Área do cliente
│   └── api/               Leads, OAuth, sincronização, cron, webhooks
├── components/
│   ├── ui/                Botão, cartão, campo, etiqueta
│   ├── painel/            KPI, gráfico, tabela
│   └── site/              Rastreadores (Pixel/GA4/GTM)
├── lib/
│   ├── supabase/          Clientes (navegador, servidor, admin) + middleware
│   ├── integracoes/       Meta, Google e motor de sincronização
│   ├── automacoes.ts      Motor de gatilhos e ações
│   ├── cripto.ts          AES-256-GCM para tokens OAuth
│   ├── capi.ts            Conversions API da Meta
│   ├── papeis.ts          Matriz de permissões
│   ├── sessao.ts          Sessão + organização ativa
│   └── demo.ts            Dados de demonstração (apagar depois)
└── types/                 Tipos do banco e do domínio

public/
├── marca/                 Logo, lâmpada, roda G.R.O.W, mapa, foto do Mateus, og
├── clientes/              16 logos de clientes (mural de prova social)
└── portfolio/             12 capturas de sites entregues

imagenssite/               Arquivos originais baixados do site atual (fonte, não é servido)

supabase/migrations/       10 migrations: schema completo + RLS + seed
```

---

## Segurança

- **RLS em todas as tabelas.** Nenhuma consulta cruza a fronteira da organização.
- **Tokens OAuth cifrados** com AES-256-GCM antes de entrar no banco (`TOKEN_ENCRYPTION_KEY`).
- `SUPABASE_SERVICE_ROLE_KEY` só existe no servidor, em rotas de webhook, cron e sincronização.
- Rotas de cron protegidas por `CRON_SECRET`.
- Cliente com papel `cliente` nunca enxerga despesas da agência — política dedicada em `lancamentos`.
- Headers de segurança configurados em `next.config.ts`.

---

## Próximos passos sugeridos

1. Trocar os **números** dos cases e os depoimentos da landing pelos reais (`_componentes/resultados.tsx`) — o texto ainda é de exemplo. O extrato do hero também usa números de exemplo, e está rotulado como conta demonstrativa.
2. Conferir nome, segmento e tipo de cada projeto do portfólio em `_componentes/portfolio.tsx`.
3. Preencher WhatsApp e domínio no `.env.local`.
4. Rodar as migrations e criar o primeiro usuário (ver `SETUP.md`).
5. Conectar Meta e Google na central de integrações.
6. Publicar na Vercel — os crons de `vercel.json` já estão configurados.

### Selos de parceiro
Os arquivos `Google Partner` e `Meta Business Partner` que vieram na pasta `imagenssite/`
pertencem a outra agência (o nome do arquivo é `...GOAT-digital...`). Eles **não** foram
colocados no site. Se a MR Grow tiver os selos próprios, é só jogar em `public/marca/` e
pedir a inclusão.
