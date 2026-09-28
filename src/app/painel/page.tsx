import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Megaphone,
  Plug,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Topo } from "./_componentes/topo";
import { Kpi } from "@/components/painel/kpi";
import { FiltroPeriodo } from "@/components/painel/filtro-periodo";
import { Anel, Rosca, type FatiaRosca } from "@/components/painel/rosca";
import { Faixa } from "@/components/painel/faixa";
import { Avatar, Avatares } from "@/components/painel/avatares";
import { GraficoArea, LegendaGrafico, type SerieGrafico } from "@/components/painel/grafico-area";
import { AvisoDemo, AvisoFalha } from "@/components/painel/aviso-demo";
import { Banner } from "@/components/painel/banner";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { exigirEquipe } from "@/lib/sessao";
import { pode } from "@/lib/papeis";
import { carregarDiagnostico, diasNoIntervalo } from "@/lib/diagnostico";
import { tracado } from "@/lib/metricas";
import { carregarCarteira, listarClientesParaSelecao } from "@/lib/clientes";
import { carregarFunil } from "@/lib/crm";
import { carregarFinanceiro } from "@/lib/financeiro";
import { carregarTarefas } from "@/lib/tarefas";
import { PRIORIDADE, STATUS_TAREFA } from "@/lib/rotulos";
import { competencia, hoje } from "@/lib/tempo";
import { brl, cn, dataCurta, divisao, multiplo, numero, percentual } from "@/lib/utils";

const SERIES: SerieGrafico[] = [
  { chave: "investimento", rotulo: "Investimento", cor: "azul" },
  { chave: "receita", rotulo: "Receita atribuída", cor: "menta" },
];


/* Paleta da rosca. As etapas do funil guardam a cor delas, mas aquela
   escala desce até #12316d — azul quase preto, que sobre a superfície
   escura do painel desaparece, e no claro fica indistinguível do vizinho.
   Aqui a ordem da etapa escolhe um token, que muda junto com o tema. */
const TONS_ROSCA = [
  "var(--color-grafico-1)",
  "var(--color-grafico-2)",
  "var(--color-grafico-3)",
  "var(--color-grafico-4)",
  "var(--color-grafico-5)",
  "var(--color-grafico-6)",
];

/** `YYYY-MM-DD` válido, senão o recorte cai no padrão. */
function data(v: string | undefined, padrao: string) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : padrao;
}

function recuar(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - (dias - 1));
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default async function PaginaVisao({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; cliente?: string }>;
}) {
  const sessao = await exigirEquipe();
  const verFinanceiro = pode(sessao.papel, "financeiro");

  const p = await searchParams;
  const de = data(p.de, recuar(30));
  const ate = data(p.ate, hoje());
  const clienteId = p.cliente || null;

  /* Tudo em paralelo: são consultas independentes e em série elas somariam
     a latência de todas. */
  const [metricas, carteira, funil, financeiro, quadro, opcoes] = await Promise.all([
    carregarDiagnostico({ de, ate, clienteId, provedor: null }),
    carregarCarteira(),
    carregarFunil(),
    verFinanceiro ? carregarFinanceiro() : Promise.resolve({ lancamentos: [], demo: false }),
    carregarTarefas(),
    listarClientesParaSelecao(),
  ]);

  const dias = diasNoIntervalo(de, ate);
  const clienteEscolhido = opcoes.find((c) => c.id === clienteId) ?? null;

  const demo = metricas.demo || carteira.demo;

  /* A visão geral compara com o período anterior de igual tamanho, que o
     diagnóstico já traz pronto. `undefined` quando não há base — é o que
     evita o "+100%" numa conta que começou ontem. */
  const t = metricas.totais;
  const delta = (chave: keyof typeof t) => {
    const base = metricas.anterior[chave];
    if (!base) return undefined;
    return ((t[chave] - base) / base) * 100;
  };

  /* Com um cliente escolhido, tudo o que tem dono passa a olhar só para
     ele: carteira, tarefas e financeiro. O funil fica de fora de propósito
     — negócio aberto ainda não é cliente, então não há a quem filtrar. */
  const daCarteira = clienteId
    ? carteira.clientes.filter((cl) => cl.id === clienteId)
    : carteira.clientes;
  const lancamentos = clienteId
    ? financeiro.lancamentos.filter((l) => l.cliente_id === clienteId)
    : financeiro.lancamentos;
  const tarefas = clienteId
    ? quadro.tarefas.filter((tf) => tf.cliente_id === clienteId)
    : quadro.tarefas;

  /* ── Carteira ─────────────────────────────────────────────────── */
  const ativos = daCarteira.filter((cl) => cl.status === "ativo");
  const mrr = ativos.reduce((s, cl) => s + cl.fee_mensal, 0);

  /* ── Funil ────────────────────────────────────────────────────── */
  const pipeline = funil.negocios.reduce((s, n) => s + n.valor_mensal + n.valor_unico, 0);
  // Ponderado pela probabilidade da etapa: o que a agência pode de fato esperar.
  const ponderado = funil.negocios.reduce((s, n) => {
    const etapa = funil.etapas.find((e) => e.id === n.etapa_id);
    return s + (n.valor_mensal + n.valor_unico) * ((etapa?.probabilidade ?? 0) / 100);
  }, 0);

  /* Valor parado em cada etapa, na ordem do funil: é o que a rosca desenha. */
  const porEtapa: FatiaRosca[] = [...funil.etapas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((e, i) => {
      const total = funil.negocios
        .filter((n) => n.etapa_id === e.id)
        .reduce((s, n) => s + n.valor_mensal + n.valor_unico, 0);
      return {
        rotulo: e.nome,
        valor: total,
        cor: TONS_ROSCA[i % TONS_ROSCA.length],
        formatado: brl(total),
      };
    });

  /* ── Caixa ────────────────────────────────────────────────────── */
  const mesAtual = competencia();
  const receitas = lancamentos.filter((l) => l.tipo === "receita");
  const aReceber = receitas
    .filter((l) => ["pendente", "previsto"].includes(l.status) && l.vencimento.startsWith(mesAtual))
    .reduce((s, l) => s + l.valor, 0);
  const emAtraso = receitas
    .filter((l) => l.status === "atrasado")
    .reduce((s, l) => s + l.valor, 0);
  const cobranca = aReceber + emAtraso;

  /* ── Operação ─────────────────────────────────────────────────── */
  const dia = hoje();
  const abertas = tarefas
    .filter((tf) => tf.status !== "concluida")
    .sort((a, b) => (a.vence_em ?? "9999").localeCompare(b.vence_em ?? "9999"))
    .slice(0, 6);

  /* Quem está com trabalho em aberto agora — a pilha de avatares da coluna.
     `Set` porque a mesma pessoa responde por várias tarefas. */
  const responsaveis = [
    ...new Set(
      tarefas
        .filter((tf) => tf.status !== "concluida" && tf.responsavel)
        .map((tf) => tf.responsavel as string),
    ),
  ];

  /* Pior saúde primeiro: a lista existe para mostrar onde agir, não para
     exibir os melhores. */
  const contas = [...daCarteira]
    .filter((cl) => cl.status !== "encerrado")
    .sort((a, b) => a.saude - b.saude)
    .slice(0, 6);

  const fechamento = divisao(ponderado, pipeline) * 100;

  return (
    <>
      {/* Sem `descricao`: com banner, o bloco do título dá lugar à arte e a
          descrição não teria onde aparecer. */}
      <Topo
        titulo="Visão geral"
        banner={<Banner />}
        acao={
          <BotaoLink href="/painel/crm" tamanho="sm">
            Abrir CRM
          </BotaoLink>
        }
      />

      <div className="space-y-4 p-5 sm:p-8">
        {demo && <AvisoDemo />}
        {metricas.falhou && <AvisoFalha o_que="as métricas das contas conectadas" />}

        <FiltroPeriodo
          caminho="/painel"
          clientes={opcoes}
          de={de}
          ate={ate}
          clienteId={clienteId}
        />

        <p className="text-[13px] text-cinza">
          <strong className="font-semibold text-tinta">
            {clienteEscolhido ? clienteEscolhido.nome : "Todos os clientes"}
          </strong>{" "}
          · {numero(dias)} {dias === 1 ? "dia" : "dias"}, comparado com os {numero(dias)}{" "}
          anteriores.
        </p>


        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            rotulo="Receita recorrente (MRR)"
            valor={brl(mrr)}
            tom="menta"
            icone={<CircleDollarSign />}
            detalhe={
              ativos.length
                ? `${numero(ativos.length)} ativos · ticket ${brl(divisao(mrr, ativos.length))}`
                : "nenhum cliente ativo"
            }
            dica="Soma dos fees mensais dos clientes com status ativo."
          />
          <Kpi
            rotulo="Investimento gerido"
            valor={brl(t.investimento)}
            icone={<Megaphone />}
            variacao={delta("investimento")}
            detalhe={`${numero(dias)} ${dias === 1 ? "dia" : "dias"}`}
            serie={tracado(metricas.serie, "investimento")}
          />
          <Kpi
            rotulo="Receita atribuída"
            valor={brl(t.receita)}
            variacao={delta("receita")}
            tom="menta"
            icone={<TrendingUp />}
            serie={tracado(metricas.serie, "receita")}
          />
          <Kpi
            rotulo="ROAS médio"
            valor={multiplo(t.roas)}
            tom="pessego"
            icone={<Target />}
            variacao={delta("roas")}
            detalhe="receita ÷ investimento"
            dica="Consolidado de todas as contas conectadas."
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="cartao flex flex-col rounded-lg p-5 xl:col-span-8">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[15px] font-bold text-tinta">
                  Investimento × receita atribuída
                </h2>
                <p className="mt-0.5 text-xs text-cinza">
                  Consolidado das contas conectadas · {numero(dias)} dias
                </p>
                <div className="mt-3">
                  <LegendaGrafico series={SERIES} />
                </div>
              </div>
              <Link
                href="/painel/metricas"
                className="foco-anel inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-acento hover:text-acento-forte"
              >
                Detalhar <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <GraficoArea
              dados={metricas.serie}
              series={SERIES}
              altura={286}
              vazio="Nenhuma métrica sincronizada ainda."
            />
          </div>

          {/* O único cartão de cor cheia da tela, e de propósito: ele existe
              para carregar o número que manda no mês. Dois cartões assim e
              nenhum dos dois se destaca. */}
          <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-lg bg-gradient-to-br from-mrg-500 to-mrg-800 p-5 text-white shadow-[0_24px_48px_-24px_color-mix(in_oklab,var(--color-mrg-700)_90%,transparent)] xl:col-span-4">
            <div
              className="pointer-events-none absolute -top-16 -right-14 size-52 rounded-full bg-white/12 blur-2xl"
              aria-hidden
            />

            <div className="relative">
              <p className="text-[11px] font-bold tracking-[0.14em] text-white/70 uppercase">
                Previsão do funil
              </p>
              <p className="font-display mt-2 text-[1.75rem] leading-none font-extrabold tracking-[-0.02em] tabular-nums">
                {brl(ponderado)}
              </p>
              <p className="mt-2 max-w-[24ch] text-[13px] leading-snug text-white/75">
                Pipeline de {brl(pipeline)} ponderado pela probabilidade de cada etapa.
                {/* O funil não segue o filtro de cliente: negócio aberto
                    ainda não é cliente. Dizer isso evita ler o número como
                    se fosse da conta escolhida. */}
                {clienteEscolhido && " Toda a agência."}
              </p>
            </div>

            <div className="relative flex items-center gap-4">
              <Anel
                percentual={fechamento}
                centro={percentual(fechamento, 0)}
                rotuloCentro="do total"
                tamanho={104}
                espessura={11}
                cor="#ffffff"
              />
              <div className="min-w-0 space-y-1.5 text-[13px] text-white/80">
                <p className="tabular-nums">
                  <strong className="font-semibold text-white">
                    {numero(funil.negocios.length)}
                  </strong>{" "}
                  negócios abertos
                </p>
                <p className="tabular-nums">
                  em <strong className="font-semibold text-white">{funil.etapas.length}</strong>{" "}
                  etapas
                </p>
              </div>
            </div>

            <Link
              href="/painel/crm"
              className="foco-anel relative inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-mrg-700 transition hover:bg-white/90"
            >
              Trabalhar o funil <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="cartao rounded-lg p-5 xl:col-span-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[15px] font-bold text-tinta">
                Onde está o pipeline
                {clienteEscolhido && (
                  <span className="ml-1.5 text-[11px] font-normal text-cinza-claro">
                    toda a agência
                  </span>
                )}
              </h2>
              <Link
                href="/painel/crm"
                className="foco-anel shrink-0 text-xs font-semibold text-acento hover:text-acento-forte"
              >
                Ver funil
              </Link>
            </div>
            <Rosca
              fatias={porEtapa}
              centro={brl(pipeline)}
              rotuloCentro="em negociação"
              vazio="Nenhum negócio no funil ainda."
            />
          </div>

          <div className="cartao rounded-lg p-5 xl:col-span-7">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[15px] font-bold text-tinta">Demanda e caixa</h2>
              <span className="shrink-0 text-xs text-cinza-claro">{numero(dias)} dias</span>
            </div>

            <div className="divide-y divide-borda-fraca">
              <Faixa
                rotulo="Leads no período"
                valor={numero(t.leads)}
                detalhe={`CPL ${brl(t.cpl)}`}
                variacao={delta("leads")}
                icone={<Users />}
              />
              <Faixa
                rotulo="Compras atribuídas"
                valor={numero(t.compras)}
                detalhe={`CPA ${brl(t.cpa)}`}
                variacao={delta("compras")}
                cor="var(--color-sucesso)"
                icone={<Target />}
              />
              {verFinanceiro ? (
                <>
                  <Faixa
                    rotulo="A receber neste mês"
                    valor={brl(aReceber)}
                    detalhe="faturas em aberto e previstas"
                    proporcao={cobranca ? divisao(aReceber, cobranca) : undefined}
                    cor="var(--color-sucesso)"
                    icone={<Wallet />}
                  />
                  <Faixa
                    rotulo="Em atraso"
                    valor={brl(emAtraso)}
                    detalhe={
                      emAtraso
                        ? `${percentual(divisao(emAtraso, cobranca) * 100, 0)} da cobrança do mês`
                        : "nada vencido"
                    }
                    proporcao={cobranca ? divisao(emAtraso, cobranca) : undefined}
                    cor={emAtraso ? "var(--color-perigo)" : "var(--color-sucesso)"}
                    icone={<CalendarClock />}
                  />
                </>
              ) : (
                <Faixa
                  rotulo="Cliques"
                  valor={numero(t.cliques)}
                  detalhe={`CPC ${brl(t.cpc)} · CTR ${percentual(t.ctr, 2)}`}
                  variacao={delta("cliques")}
                  icone={<Megaphone />}
                />
              )}
            </div>
          </div>
        </section>

        {!metricas.serie.length && !demo && !metricas.falhou && (
          <div className="cartao flex flex-col gap-4 rounded-lg p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Plug className="mt-0.5 size-5 shrink-0 text-acento" />
              <div>
                <h2 className="font-display text-base font-bold text-tinta">
                  Nenhuma conta de mídia conectada
                </h2>
                <p className="mt-1 max-w-xl text-sm text-grafite">
                  Investimento, receita, leads e ROAS chegam sozinhos depois que as contas do Meta
                  Ads e do Google Ads são conectadas uma única vez.
                </p>
              </div>
            </div>
            <BotaoLink href="/painel/integracoes" tamanho="sm" className="shrink-0">
              Conectar contas
            </BotaoLink>
          </div>
        )}

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="cartao rounded-lg p-5 xl:col-span-7">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[15px] font-bold text-tinta">Contas em atenção</h2>
              <Link
                href="/painel/clientes"
                className="foco-anel shrink-0 text-xs font-semibold text-acento hover:text-acento-forte"
              >
                Ver carteira
              </Link>
            </div>

            <ul className="divide-y divide-borda-fraca">
              {contas.map((cl) => (
                <li key={cl.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar nome={cl.nome} medida="lg" />

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/painel/clientes/${cl.slug}`}
                      className="foco-anel block truncate text-[13px] font-semibold text-tinta hover:text-acento"
                    >
                      {cl.nome}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-cinza">
                      {cl.segmento ?? "Sem segmento"} · fee {brl(cl.fee_mensal)}
                    </p>
                  </div>

                  <span className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-grafite">
                    {cl.roas ? multiplo(cl.roas, 1) : "—"}
                    <span className="block text-[10px] font-normal text-cinza-claro">ROAS</span>
                  </span>

                  {/* A barra de saúde fica por último e com largura fixa: é a
                      coluna que o olho percorre de cima a baixo comparando. */}
                  <div className="w-24 shrink-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] text-cinza-claro">saúde</span>
                      <span className="text-[11px] font-semibold tabular-nums text-grafite">
                        {cl.saude}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-nevoa-2">
                      <div
                        className={
                          cl.saude >= 80
                            ? "h-full rounded-full bg-sucesso"
                            : cl.saude >= 60
                              ? "h-full rounded-full bg-alerta"
                              : "h-full rounded-full bg-perigo"
                        }
                        style={{ width: `${cl.saude}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
              {!contas.length && (
                <li className="py-8 text-center text-[13px] text-cinza">
                  Nenhum cliente cadastrado ainda.
                </li>
              )}
            </ul>
          </div>

          {/* Coluna de atividade: linha do tempo, não tabela. A tabela alinhava
              em colunas coisas que não se comparam entre si — aqui o que
              importa é a ordem dos prazos e quem responde por cada um. */}
          <div className="cartao rounded-lg p-5 xl:col-span-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[15px] font-bold text-tinta">Próximos prazos</h2>
                {!!responsaveis.length && (
                  <p className="mt-0.5 text-[11px] text-cinza">
                    {numero(responsaveis.length)}{" "}
                    {responsaveis.length === 1 ? "pessoa" : "pessoas"} com tarefa em aberto
                  </p>
                )}
              </div>
              {responsaveis.length ? (
                <Avatares nomes={responsaveis} medida="sm" limite={4} />
              ) : (
                <Link
                  href="/painel/tarefas"
                  className="foco-anel shrink-0 text-xs font-semibold text-acento hover:text-acento-forte"
                >
                  Ver quadro
                </Link>
              )}
            </div>

            <ol className="space-y-0.5">
              {abertas.map((t) => {
                const atrasada = !!t.vence_em && t.vence_em < dia;
                return (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 rounded-sm px-2 py-2.5 transition-colors hover:bg-nevoa"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        atrasada ? "bg-perigo" : "bg-acento",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-tinta">{t.titulo}</p>
                      <p className="mt-0.5 truncate text-[11px] text-cinza">
                        {t.cliente ?? "Interno"}
                        {t.responsavel ? ` · ${t.responsavel}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 space-y-1 text-right">
                      <p
                        className={cn(
                          "text-[12px] font-semibold tabular-nums",
                          atrasada ? "text-perigo" : "text-grafite",
                        )}
                      >
                        {t.vence_em ? dataCurta(t.vence_em) : "—"}
                      </p>
                      <Etiqueta
                        tom={atrasada ? "perigo" : STATUS_TAREFA.tom(t.status)}
                        title={`Prioridade ${PRIORIDADE.rotulo(t.prioridade).toLowerCase()}`}
                      >
                        {atrasada ? "Atrasada" : STATUS_TAREFA.rotulo(t.status)}
                      </Etiqueta>
                    </div>
                  </li>
                );
              })}
              {!abertas.length && (
                <li className="py-8 text-center text-[13px] text-cinza">
                  Nada em aberto. Bom sinal.
                </li>
              )}
            </ol>

            {!!abertas.length && (
              <Link
                href="/painel/tarefas"
                className="foco-anel mt-4 flex items-center justify-center gap-1 rounded-full border border-borda py-2 text-xs font-semibold text-grafite hover:border-borda-forte hover:text-tinta"
              >
                Abrir o quadro de tarefas <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
