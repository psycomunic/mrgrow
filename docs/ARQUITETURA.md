# Arquitetura

## Multi-tenant

Tudo pende de `organizacoes`. Cada tabela de negócio carrega `organizacao_id`, e a RLS filtra por `public.orgs_do_usuario()`. Hoje existe uma organização (MR Grow); amanhã, se a plataforma virar produto white-label para outras agências, basta criar novas linhas — o schema não muda.

## Papéis

`proprietario`, `administrador`, `gestor`, `operador`, `financeiro` e `cliente`.

Duas camadas independentes:
- **Banco (obrigatória):** funções `e_membro`, `e_equipe`, `e_gestor` e `pode_ver_cliente` alimentam as policies.
- **Interface (conveniência):** `src/lib/papeis.ts` esconde o que o papel não pode usar.

O papel `cliente` só enxerga as contas listadas em `membros_organizacao.clientes_permitidos`.

## Fluxo de um lead

```
Landing page
  → POST /api/leads          (valida com Zod, pontua, grava)
  → dispararGatilho("lead_criado")
       ├── notifica o comercial
       ├── cria tarefa com prazo de 15 min
       └── enfileira WhatsApp de boas-vindas
  → enviarEventoCapi("Lead")  (Conversions API, dedup por event_id)
```

## Fluxo de métricas

```
/api/cron/sincronizar (diario, 09:00 UTC)
  → para cada organização
      → para cada conta_externa ativa
          → decifra o token (AES-256-GCM)
          → Meta Insights / Google Ads GAQL / GA4 runReport
          → normaliza para o formato comum
          → upsert em metricas_diarias (conta + campanha + dia)
          → registra em sincronizacoes
```

Como `metricas_diarias` é a única fonte, painel, portal do cliente e relatórios leem sempre o mesmo número.

## Motor de automações

Uma automação é `gatilho + condicoes + acoes[]`.

- **Gatilhos de evento** (`lead_criado`, `negocio_ganho`, `fatura_paga`) são chamados no ponto do código onde o evento acontece.
- **Gatilhos de tempo** (`fatura_vencendo`, `contrato_vencendo`, `tarefa_atrasada`, `conta_sem_veiculacao`) são avaliados uma vez ao dia por `/api/cron/automacoes`, às 11:00 UTC.

Cada execução vira uma linha em `execucoes_automacao` com contexto, resultado e duração — dá para auditar por que algo disparou (ou não).

## Views prontas

| View | Serve para |
|---|---|
| `vw_mrr` | MRR, clientes ativos e ticket médio |
| `vw_funil_resumo` | Valor e contagem por etapa do funil |
| `vw_desempenho_cliente` | ROAS, CPL, CPC e CTR por cliente/dia |
| `vw_fluxo_caixa` | Receitas, despesas, resultado e inadimplência por mês |

## Decisões que valem explicar

**Por que Server Components por padrão?** Métricas e listas não precisam de interatividade; renderizar no servidor evita mandar dados sensíveis e bibliotecas para o navegador. Só viram `"use client"` o kanban, o formulário, os gráficos e os menus.

**Por que os tokens não ficam em texto puro?** Um vazamento de dump do banco daria acesso às contas de anúncio de todos os clientes. Cifrados com AES-256-GCM, o dump sozinho não serve.

**Por que dados de demonstração?** Para o projeto abrir e ser navegável antes de qualquer credencial existir — o que torna o ajuste de layout independente do backend. `supabaseConfigurado()` decide qual caminho seguir.
