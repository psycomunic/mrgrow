-- ════════════════════════════════════════════════════════════════
-- MR GROW · 0010 — Seed inicial (organização, funil, catálogo)
-- Idempotente: pode rodar mais de uma vez.
-- ════════════════════════════════════════════════════════════════

do $$
declare
  org_id uuid;
  funil_id uuid;
begin
  insert into public.organizacoes (nome, slug, plano, cor_primaria)
  values ('MR Grow', 'mr-grow', 'interno', '#1668f5')
  on conflict (slug) do update set nome = excluded.nome
  returning id into org_id;

  if org_id is null then
    select id into org_id from public.organizacoes where slug = 'mr-grow';
  end if;

  -- ── Funil comercial padrão ────────────────────────────────────
  insert into public.funis (organizacao_id, nome, descricao, padrao, ordem)
  select org_id, 'Comercial', 'Funil principal de novos clientes', true, 0
  where not exists (select 1 from public.funis where organizacao_id = org_id and nome = 'Comercial')
  returning id into funil_id;

  if funil_id is null then
    select id into funil_id from public.funis where organizacao_id = org_id and nome = 'Comercial';
  end if;

  insert into public.etapas_funil (organizacao_id, funil_id, nome, ordem, probabilidade, tipo, cor)
  select org_id, funil_id, e.nome, e.ordem, e.prob, e.tipo, e.cor
  from (values
    ('Lead recebido', 0, 10, 'aberta', '#5798ff'),
    ('Qualificação', 1, 25, 'aberta', '#1668f5'),
    ('Diagnóstico agendado', 2, 45, 'aberta', '#0b4fd1'),
    ('Proposta enviada', 3, 65, 'aberta', '#103786'),
    ('Negociação', 4, 80, 'aberta', '#12316d'),
    ('Ganho', 5, 100, 'ganho', '#12b981'),
    ('Perdido', 6, 0, 'perdido', '#f43f5e')
  ) as e(nome, ordem, prob, tipo, cor)
  where not exists (
    select 1 from public.etapas_funil x where x.funil_id = funil_id and x.nome = e.nome
  );

  -- ── Catálogo de serviços ──────────────────────────────────────
  insert into public.servicos (organizacao_id, nome, descricao, preco_padrao, recorrente)
  select org_id, s.nome, s.descricao, s.preco, s.rec
  from (values
    ('Gestão de Tráfego Meta Ads', 'Estruturação, veiculação e otimização diária de campanhas no Meta Ads.', 2500, true),
    ('Gestão de Tráfego Google Ads', 'Search, Performance Max, YouTube e remarketing.', 2500, true),
    ('Gestão Full (Meta + Google)', 'Operação completa de mídia paga com relatórios semanais.', 4200, true),
    ('Criativos e Produção', 'Roteiro, edição e variações de criativos para teste.', 1800, true),
    ('Landing Page de Alta Conversão', 'Página construída para converter, com testes A/B e rastreamento.', 4900, false),
    ('Setup de Rastreamento', 'GA4, GTM, Pixel, API de Conversões e eventos de servidor.', 2400, false),
    ('Consultoria Estratégica', 'Diagnóstico, plano de mídia e acompanhamento mensal.', 3500, true)
  ) as s(nome, descricao, preco, rec)
  where not exists (select 1 from public.servicos x where x.organizacao_id = org_id and x.nome = s.nome);

  -- ── Categorias financeiras ────────────────────────────────────
  insert into public.categorias_financeiras (organizacao_id, nome, tipo, cor)
  select org_id, c.nome, c.tipo::tipo_lancamento, c.cor
  from (values
    ('Fee de gestão', 'receita', '#12b981'),
    ('Projetos pontuais', 'receita', '#1668f5'),
    ('Comissão sobre investimento', 'receita', '#5798ff'),
    ('Equipe', 'despesa', '#f43f5e'),
    ('Ferramentas e softwares', 'despesa', '#f5a524'),
    ('Impostos', 'despesa', '#8b96ad'),
    ('Marketing próprio', 'despesa', '#0b4fd1'),
    ('Terceiros e freelas', 'despesa', '#5b6780')
  ) as c(nome, tipo, cor)
  where not exists (
    select 1 from public.categorias_financeiras x
    where x.organizacao_id = org_id and x.nome = c.nome and x.tipo = c.tipo::tipo_lancamento
  );

  -- ── Automações prontas ────────────────────────────────────────
  insert into public.automacoes (organizacao_id, nome, descricao, gatilho, condicoes, acoes)
  select org_id, a.nome, a.descricao, a.gatilho::gatilho_automacao, a.cond::jsonb, a.acoes::jsonb
  from (values
    ('Lead novo → responsável no WhatsApp',
     'Assim que um lead entra pela landing page, avisa o comercial e cria a tarefa de contato em 15 minutos.',
     'lead_criado', '{"origem":"landing_page"}',
     '[{"tipo":"notificar","para":"comercial"},{"tipo":"criar_tarefa","titulo":"Ligar para o lead","prazo_minutos":15},{"tipo":"whatsapp","template":"boas_vindas_lead"}]'),
    ('Cobrança 3 dias antes do vencimento',
     'Dispara lembrete de fatura com link de pagamento.',
     'fatura_vencendo', '{"dias_antes":3}',
     '[{"tipo":"email","template":"lembrete_fatura"},{"tipo":"whatsapp","template":"lembrete_fatura"}]'),
    ('Fatura atrasada → alerta financeiro',
     'Notifica o financeiro e marca a conta do cliente como em risco.',
     'fatura_atrasada', '{"dias_apos":1}',
     '[{"tipo":"notificar","para":"financeiro"},{"tipo":"atualizar_saude_cliente","delta":-15}]'),
    ('Conta sem veiculação há 24h',
     'Se uma conta de anúncio não gastou nada nas últimas 24h, alerta o gestor.',
     'conta_sem_veiculacao', '{"horas":24}',
     '[{"tipo":"notificar","para":"gestor_trafego"},{"tipo":"criar_tarefa","titulo":"Verificar veiculação da conta"}]'),
    ('ROAS abaixo da meta',
     'Monitora o ROAS dos últimos 7 dias e alerta quando fica abaixo do alvo.',
     'metrica_fora_da_meta', '{"indicador":"roas","operador":"<","valor":2,"janela_dias":7}',
     '[{"tipo":"notificar","para":"gestor_trafego"},{"tipo":"criar_tarefa","titulo":"Plano de correção de campanha","prioridade":"alta"}]'),
    ('Negócio ganho → onboarding',
     'Cria o cliente, o contrato e o checklist de onboarding automaticamente.',
     'negocio_ganho', '{}',
     '[{"tipo":"criar_cliente"},{"tipo":"criar_projeto","modelo":"onboarding"},{"tipo":"notificar","para":"equipe"}]'),
    ('Contrato vencendo em 30 dias',
     'Aciona o gestor para conversa de renovação.',
     'contrato_vencendo', '{"dias_antes":30}',
     '[{"tipo":"criar_tarefa","titulo":"Conversa de renovação","prioridade":"alta"},{"tipo":"notificar","para":"responsavel"}]')
  ) as a(nome, descricao, gatilho, cond, acoes)
  where not exists (select 1 from public.automacoes x where x.organizacao_id = org_id and x.nome = a.nome);
end $$;
