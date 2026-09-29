"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Check, Download, Pencil, Plus, Scale, TrendingDown, TrendingUp, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { EnvioArquivo, type ArquivoAnexado } from "@/components/painel/envio-arquivo";
import { Campo, Entrada, AreaTexto, Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { brl, cn, dataCompleta, dataCurta, numero, slugificar } from "@/lib/utils";
import { STATUS_LANCAMENTO } from "@/lib/rotulos";
import { noPeriodo as emJanela, resumirFinanceiro } from "@/lib/resumo";
import {
  BarraFiltros,
  janelaDo,
  PERIODOS,
  RECORTE_PADRAO,
  type Recorte,
} from "./filtros";
import { hoje } from "@/lib/tempo";
import {
  criarLancamento,
  atualizarLancamento,
  excluirLancamento,
  marcarPago,
  type DadosLancamento,
} from "./acoes";
import { FORMAS_PAGAMENTO, ROTULO_FORMA } from "@/lib/rotulos";
import type { Lancamento } from "@/lib/financeiro";

const BARRA: Record<string, string> = {
  pago: "bg-sucesso",
  pendente: "bg-alerta",
  previsto: "bg-mrg-500",
  atrasado: "bg-perigo",
};

/**
 * Recorte temporal do razão.
 *
 * Sem ele, "Receitas no período" somava tudo o que existia na tabela — com
 * seis meses de histórico isso vira um número de semestre com rótulo de mês.
 * O gráfico de fluxo continua olhando seis meses sempre, porque é a
 * comparação que ele existe para mostrar.
 */
/** De quantas em quantas linhas a tabela cresce. */
const PAGINA = 40;

function vazio(): DadosLancamento {
  return {
    descricao: "",
    tipo: "receita",
    status: "pendente",
    valor: 0,
    valor_pago: 0,
    vencimento: hoje(),
    /* Competência começa no primeiro dia do mês do vencimento: é o caso
       comum, e quem precisa de outro mês troca em um clique. */
    competencia: hoje().slice(0, 8) + "01",
    pago_em: null,
    forma_pagamento: "",
    categoria_id: null,
    cliente_id: null,
    comprovante: null,
    observacoes: "",
  };
}

function doLancamento(l: Lancamento): DadosLancamento {
  return {
    descricao: l.descricao,
    tipo: l.tipo,
    status: l.status,
    valor: l.valor,
    valor_pago: l.valor_pago,
    vencimento: l.vencimento,
    competencia: l.competencia,
    pago_em: l.pago_em,
    forma_pagamento: l.forma_pagamento ?? "",
    categoria_id: l.categoria_id,
    cliente_id: l.cliente_id,
    comprovante: l.comprovante,
    observacoes: l.observacoes ?? "",
  };
}

/** Chave "AAAA-MM" lida do texto, sem passar por Date e sem risco de fuso. */
function mesDe(iso: string) {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  return m ? `${m[1]}-${m[2]}` : "";
}

export type Categoria = { id: string; nome: string; tipo: string };

export function Lancamentos({
  lancamentos: iniciais,
  clientes,
  categorias,
}: {
  lancamentos: Lancamento[];
  clientes: { id: string; nome: string }[];
  categorias: Categoria[];
}) {
  const [lancamentos, setLancamentos] = useState(iniciais);
  const [doServidor, setDoServidor] = useState(iniciais);
  const [recorte, setRecorte] = useState<Recorte>(RECORTE_PADRAO);
  /* Quantas linhas a tabela mostra. Com 410 lançamentos, desenhar todos
     de uma vez custava meio segundo de travada a cada troca de filtro —
     e ninguém rola 410 linhas: procura. */
  const [mostrando, setMostrando] = useState(PAGINA);
  const [criando, setCriando] = useState(false);
  /* O financeiro é uma tela longa, e o botão de lançar mora no meio dela.
     Quem está conferindo a tabela lá embaixo teria que voltar ao topo só
     para achá-lo. O flutuante entra quando o de cima sai de vista — nunca
     os dois ao mesmo tempo, que seria a mesma ação pedida duas vezes. */
  const ancora = useRef<HTMLDivElement>(null);
  const [lancarLonge, setLancarLonge] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);

  useEffect(() => {
    const alvo = ancora.current;
    if (!alvo) return;
    const observador = new IntersectionObserver(
      ([entrada]) => setLancarLonge(!entrada.isIntersecting),
      /* A margem negativa desconta o cabeçalho fixo: sem ela o botão
         conta como visível enquanto está escondido atrás dele. */
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);
  /* Baixa é irreversível pela tela: uma vez pago, só editando o lançamento
     se volta atrás. E a linha inteira do mês vizinho fica a um pixel de
     distância, então o clique errado acontece. */
  const [baixando, setBaixando] = useState<Lancamento | null>(null);

  // Sincroniza com o que o servidor devolve depois de gravar.
  if (iniciais !== doServidor) {
    setDoServidor(iniciais);
    setLancamentos(iniciais);
  }

  /* Corte do período em texto: comparar "2026-08-26" >= "2026-06-01" resolve
     sem construir Date, e sem o risco de fuso que isso traria. Os dois
     lados são fechados — foi a falta do limite superior que fazia "este
     mês" somar outubro e novembro. */
  const janela = useMemo(() => janelaDo(recorte, hoje()), [recorte]);

  const noPeriodo = useMemo(
    () => (janela ? lancamentos.filter((l) => emJanela(l, janela.de, janela.ate)) : lancamentos),
    [lancamentos, janela],
  );

  const visiveis = useMemo(() => {
    const termo = slugificar(recorte.busca.trim());

    const filtrados = noPeriodo.filter((l) => {
      if (recorte.tipo !== "todos" && l.tipo !== recorte.tipo) return false;
      if (recorte.status !== "todos" && l.status !== recorte.status) return false;
      if (recorte.clienteId === "agencia" && l.cliente_id) return false;
      if (
        recorte.clienteId !== "todos" &&
        recorte.clienteId !== "agencia" &&
        l.cliente_id !== recorte.clienteId
      )
        return false;
      if (recorte.categoriaId === "sem" && l.categoria_id) return false;
      if (
        recorte.categoriaId !== "todos" &&
        recorte.categoriaId !== "sem" &&
        l.categoria_id !== recorte.categoriaId
      )
        return false;
      if (recorte.forma !== "todos" && l.forma_pagamento !== recorte.forma) return false;
      if (termo) {
        const alvo = slugificar(`${l.descricao} ${l.cliente ?? ""} ${l.categoria ?? ""}`);
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });

    const ordenado = [...filtrados];
    switch (recorte.ordem) {
      case "vencimento-asc":
        ordenado.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
        break;
      case "valor-desc":
        ordenado.sort((a, b) => b.valor - a.valor);
        break;
      case "valor-asc":
        ordenado.sort((a, b) => a.valor - b.valor);
        break;
      case "cliente":
        ordenado.sort((a, b) =>
          (a.cliente ?? "Agência").localeCompare(b.cliente ?? "Agência", "pt-BR"),
        );
        break;
      default:
        ordenado.sort((a, b) => b.vencimento.localeCompare(a.vencimento));
    }
    return ordenado;
  }, [noPeriodo, recorte]);

  /* Volta ao topo da paginação a cada troca de recorte: manter a página 4
     depois de filtrar mostra uma tabela vazia num recorte que tem linhas. */
  const assinatura = JSON.stringify(recorte);
  const [ultimoRecorte, setUltimoRecorte] = useState(assinatura);
  if (assinatura !== ultimoRecorte) {
    setUltimoRecorte(assinatura);
    setMostrando(PAGINA);
  }

  const naTela = visiveis.slice(0, mostrando);

  const rotuloPeriodo = (PERIODOS.find((x) => x.v === recorte.periodo)?.r ?? "").toLowerCase();

  /* Fluxo dos ultimos 6 meses somado dos proprios lancamentos. Antes era
     uma constante inventada dentro do arquivo da pagina. */
  const fluxo = useMemo(() => {
    const agora = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
      return {
        chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        data: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receitas: 0,
        despesas: 0,
      };
    });
    const porChave = new Map(meses.map((m) => [m.chave, m]));
    for (const l of lancamentos) {
      const m = porChave.get(mesDe(l.vencimento));
      if (!m || l.status === "cancelado") continue;
      if (l.tipo === "receita") m.receitas += l.valor;
      else m.despesas += l.valor;
    }
    return meses;
  }, [lancamentos]);

  /* Mesma função da visão geral e dos recebimentos. Antes cada tela tinha
     a sua conta, e "em atraso" aparecia como R$ 12.650, R$ 8.500 e
     R$ 3.500 em três lugares diferentes. */
  const kpis = useMemo(
    () =>
      resumirFinanceiro(visiveis, {
        de: janela?.de ?? "0000-01-01",
        ate: janela?.ate ?? "9999-12-31",
        hoje: hoje(),
      }),
    [visiveis, janela],
  );

  /**
   * Para onde o dinheiro sai, por categoria.
   *
   * A tela mostrava o total de despesas e parava aí. Com 76% do custo em
   * equipe e o resto espalhado por oito rubricas, o total sozinho não diz
   * onde mexer — e era justamente essa a pergunta de quem abre o
   * financeiro depois de ver o resultado no vermelho.
   */
  const porCategoria = useMemo(() => {
    const despesas = visiveis.filter((l) => l.tipo === "despesa" && l.status !== "cancelado");
    const total = despesas.reduce((s, l) => s + l.valor, 0);
    if (!total) return { total: 0, itens: [] as { nome: string; valor: number; parte: number }[] };

    const mapa = new Map<string, number>();
    for (const l of despesas) {
      const k = l.categoria ?? "Sem categoria";
      mapa.set(k, (mapa.get(k) ?? 0) + l.valor);
    }

    return {
      total,
      itens: [...mapa.entries()]
        .map(([nome, valor]) => ({ nome, valor, parte: valor / total }))
        .sort((a, b) => b.valor - a.valor),
    };
  }, [visiveis]);

  /* Recebiveis por situacao: onde o dinheiro a receber esta parado. */
  const recebiveis = useMemo(() => {
    const receita = visiveis.filter((l) => l.tipo === "receita" && l.status !== "cancelado");
    const total = receita.reduce((s, l) => s + l.valor, 0) || 1;
    return (["pago", "pendente", "previsto", "atrasado"] as const)
      .map((s) => {
        const doStatus = receita.filter((l) => l.status === s);
        const valor = doStatus.reduce((a, l) => a + l.valor, 0);
        return { status: s as string, valor, qtd: doStatus.length, parte: valor / total };
      })
      .filter((f) => f.qtd > 0);
  }, [visiveis]);

  async function baixar(l: Lancamento) {
    setBaixando(null);
    const anterior = lancamentos;
    setLancamentos((x) =>
      x.map((i) => (i.id === l.id ? { ...i, status: "pago", pago_em: hoje() } : i)),
    );
    const r = await marcarPago(l.id);
    if (!r.ok) {
      setLancamentos(anterior);
      return toast.error(r.erro ?? "Não foi possível dar baixa.");
    }
    toast.success(r.demo ? "Baixa registrada (não salva: demonstração)." : "Baixa registrada.");
  }

  /**
   * Baixa o recorte visível em CSV.
   *
   * Exporta o que está filtrado, e não a tabela inteira: quem clica aqui
   * acabou de montar um recorte e quer justamente ele — para mandar ao
   * contador, conferir na planilha ou anexar num fechamento.
   *
   * Separador ponto e vírgula e BOM no começo porque o destino quase
   * sempre é o Excel em português: com vírgula ele joga tudo numa coluna
   * só, e sem o BOM os acentos chegam quebrados.
   */
  function exportar() {
    const cabecalho = [
      "Tipo", "Descrição", "Cliente", "Categoria", "Competência",
      "Vencimento", "Status", "Valor", "Valor pago", "Forma", "Pago em",
    ];
    const campo = (v: string | number | null) => {
      const t = String(v ?? "");
      return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const linhas = visiveis.map((l) =>
      [
        l.tipo === "receita" ? "Receita" : "Despesa",
        l.descricao,
        l.cliente ?? "Agência",
        l.categoria ?? "",
        l.competencia,
        l.vencimento,
        STATUS_LANCAMENTO.rotulo(l.status),
        l.valor.toFixed(2).replace(".", ","),
        (l.valor_pago ?? 0).toFixed(2).replace(".", ","),
        l.forma_pagamento ? (ROTULO_FORMA[l.forma_pagamento] ?? l.forma_pagamento) : "",
        l.pago_em ?? "",
      ].map(campo).join(";"),
    );

    const csv = "\uFEFF" + [cabecalho.join(";"), ...linhas].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${hoje()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${visiveis.length} ${visiveis.length === 1 ? "lançamento exportado" : "lançamentos exportados"}.`);
  }

  async function remover(l: Lancamento) {
    if (!confirm(`Excluir "${l.descricao}"? Isso não pode ser desfeito.`)) return;
    const anterior = lancamentos;
    setLancamentos((x) => x.filter((i) => i.id !== l.id));
    const r = await excluirLancamento(l.id);
    if (!r.ok) {
      setLancamentos(anterior);
      return toast.error(r.erro ?? "Não foi possível excluir.");
    }
    toast.success("Lançamento excluído.");
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* O cartão mostra o recebido, com o previsto embaixo. Antes só o
            previsto aparecia, e "receitas" de um mês com inadimplência
            dizia um número que ninguém tinha em conta. */}
        <Kpi
          rotulo={`Recebido · ${rotuloPeriodo}`}
          dica="O que entrou de fato no período. O previsto, logo abaixo, é o total das cobranças — pagas ou não."
          valor={brl(kpis.recebido)}
          tom="menta"
          icone={<TrendingUp />}
          detalhe={`${brl(kpis.previsto)} previstos · ${numero(kpis.cobrancas)} ${kpis.cobrancas === 1 ? "cobrança" : "cobranças"}`}
          serie={fluxo.map((m) => m.receitas)}
        />
        <Kpi
          rotulo={`Despesas · ${rotuloPeriodo}`}
          dica="Tudo que a agência pagou ou vai pagar no período: equipe, ferramentas, escritório e impostos."
          valor={brl(kpis.despesas)}
          tom="rosa"
          icone={<TrendingDown />}
          serie={fluxo.map((m) => m.despesas)}
        />
        <Kpi
          rotulo={kpis.resultado >= 0 ? "Resultado, no azul" : "Resultado, no vermelho"}
          dica="Recebido menos despesas: dinheiro que existe, não promessa. A linha de baixo mostra o mesmo mês se todo mundo pagar."
          valor={brl(kpis.resultado)}
          tom={kpis.resultado >= 0 ? "azul" : "rosa"}
          icone={<Scale />}
          detalhe={`${brl(kpis.resultadoPrevisto)} se todos pagarem`}
          serie={fluxo.map((m) => m.receitas - m.despesas)}
        />
        <Kpi
          rotulo="A receber em atraso"
          dica="Cobranças vencidas e ainda não quitadas. Quanto mais tempo aqui, menor a chance de entrar."
          valor={brl(kpis.atrasado)}
          tom="pessego"
          icone={<AlertTriangle />}
          detalhe={`${numero(kpis.qtdAtrasada)} ${kpis.qtdAtrasada === 1 ? "cobrança" : "cobranças"} vencida${kpis.qtdAtrasada === 1 ? "" : "s"}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="cartao p-5 lg:col-span-2">
          <h2 className="font-display text-base font-bold text-tinta">Fluxo de caixa</h2>
          <p className="mt-0.5 mb-4 text-xs text-cinza">
            Entradas e saídas somadas por mês de vencimento, últimos 6 meses.
          </p>
          <GraficoArea
            dados={fluxo}
            series={[
              { chave: "receitas", rotulo: "Receitas", cor: "menta" },
              { chave: "despesas", rotulo: "Despesas", cor: "vermelho" },
            ]}
            altura={248}
            rotuloX={(v) => v}
          />
        </div>

        <div className="cartao flex flex-col p-5">
          <h2 className="font-display text-base font-bold text-tinta">Recebíveis</h2>
          <p className="mt-0.5 mb-5 text-xs text-cinza">Onde o dinheiro a receber está parado.</p>

          {recebiveis.length === 0 ? (
            <p className="my-auto text-center text-sm text-cinza-claro">
              Nenhuma receita lançada ainda.
            </p>
          ) : (
            <ul className="space-y-4">
              {recebiveis.map((f) => (
                <li key={f.status}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-grafite">{STATUS_LANCAMENTO.rotulo(f.status)}</span>
                    <span className="font-display text-sm font-bold text-tinta">{brl(f.valor)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-nevoa-2">
                    <div
                      className={`h-full rounded-full ${BARRA[f.status]}`}
                      style={{ width: `${Math.max(f.parte * 100, 2)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-cinza-claro">
                    {numero(f.qtd)} {f.qtd === 1 ? "lançamento" : "lançamentos"} ·{" "}
                    {numero(f.parte * 100, 0)}% do total
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {porCategoria.itens.length > 0 && (
        <section className="cartao p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-tinta">
                Para onde vai o dinheiro
              </h2>
              <p className="mt-0.5 text-xs text-cinza">
                Despesas do recorte, por categoria
              </p>
            </div>
            <p className="font-display text-sm font-bold tabular-nums text-perigo">
              {brl(porCategoria.total)}
            </p>
          </div>

          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {porCategoria.itens.map((c) => (
              <li key={c.nome}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] text-grafite">{c.nome}</span>
                  <span className="shrink-0 text-[13px] tabular-nums text-cinza">
                    {brl(c.valor)}
                    <span className="ml-2 inline-block w-9 text-right text-cinza-claro">
                      {Math.round(c.parte * 100)}%
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-nevoa-2">
                  <div
                    className="h-full rounded-full bg-perigo"
                    style={{ width: `${Math.max(c.parte * 100, 1)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-tinta">Lançamentos</h2>
          <div ref={ancora} className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportar}
              disabled={!visiveis.length}
              className="foco-anel inline-flex h-9 items-center gap-1.5 rounded-sm border border-borda-forte bg-nevoa px-3 text-xs font-medium text-grafite transition-colors hover:bg-nevoa-2 hover:text-tinta disabled:opacity-40"
            >
              <Download className="size-4" />
              Exportar
            </button>
            <Botao tamanho="sm" onClick={() => setCriando(true)}>
              <Plus className="size-4" />
              Novo lançamento
            </Botao>
          </div>
        </div>

        <BarraFiltros
          recorte={recorte}
          aoMudar={setRecorte}
          clientes={clientes}
          categorias={categorias}
          encontrados={visiveis.length}
        />

        {visiveis.length === 0 ? (
          <p className="cartao p-10 text-center text-sm text-cinza-claro">
            Nenhum lançamento neste recorte.
          </p>
        ) : (
          <Tabela>
            <Cabecalhos
              colunas={["Descrição", "Cliente", "Categoria", "Vencimento", "Status", "Valor", ""]}
            />
            <tbody>
              {naTela.map((l) => (
                <Linha key={l.id}>
                  <Celula>
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full ${
                          l.tipo === "receita"
                            ? "bg-chip-menta text-sucesso"
                            : "bg-chip-rosa text-perigo"
                        }`}
                      >
                        {l.tipo === "receita" ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <TrendingDown className="size-4" />
                        )}
                      </span>
                      <span className="font-medium text-tinta">{l.descricao}</span>
                    </div>
                  </Celula>
                  <Celula className="text-cinza">{l.cliente ?? "Agência"}</Celula>
                  <Celula className="text-cinza">
                    {l.categoria ? (
                      <span className="rounded-full bg-nevoa px-2 py-0.5 text-[11px]">
                        {l.categoria}
                      </span>
                    ) : (
                      <span className="text-cinza-claro">—</span>
                    )}
                  </Celula>
                  <Celula className="text-cinza">{dataCompleta(l.vencimento)}</Celula>
                  <Celula>
                    <Etiqueta tom={STATUS_LANCAMENTO.tom(l.status)}>
                      {STATUS_LANCAMENTO.rotulo(l.status)}
                    </Etiqueta>
                  </Celula>
                  <Celula
                    className={`text-right font-display font-bold whitespace-nowrap ${
                      l.tipo === "receita" ? "text-sucesso" : "text-perigo"
                    }`}
                  >
                    {l.tipo === "receita" ? "+" : "−"} {brl(l.valor)}
                  </Celula>
                  <Celula>
                    <div className="flex items-center justify-end gap-1">
                      {/* Verde e com contorno desde o repouso, não só no
                          hover: era o cinza igual ao dos outros dois, e a
                          ação mais usada da tela ficava indistinguível de
                          "editar" e "excluir" — e vizinha da lixeira. */}
                      {l.status !== "pago" && (
                        <button
                          type="button"
                          title="Dar baixa"
                          aria-label={`Dar baixa em ${l.descricao}`}
                          onClick={() => setBaixando(l)}
                          className="foco-anel flex items-center gap-1.5 rounded-full border border-sucesso/40 bg-sucesso/12 px-2.5 py-1.5 text-[12px] font-semibold text-sucesso transition-colors hover:bg-sucesso hover:text-papel"
                        >
                          <Check className="size-4" strokeWidth={2.5} />
                          <span className="hidden sm:inline">Baixa</span>
                        </button>
                      )}
                      <Acao rotulo="Editar" onClick={() => setEditando(l)}>
                        <Pencil className="size-4" />
                      </Acao>
                      <Acao
                        rotulo="Excluir"
                        onClick={() => remover(l)}
                        classe="hover:bg-chip-rosa hover:text-perigo"
                      >
                        <Trash2 className="size-4" />
                      </Acao>
                    </div>
                  </Celula>
                </Linha>
              ))}
            </tbody>
          </Tabela>
        )}

        {visiveis.length > naTela.length && (
          <button
            onClick={() => setMostrando((n) => n + PAGINA)}
            className="foco-anel w-full rounded-md border border-borda py-2.5 text-xs font-semibold text-grafite transition-colors hover:border-borda-forte hover:text-tinta"
          >
            Mostrar mais {Math.min(PAGINA, visiveis.length - naTela.length)} de{" "}
            {(visiveis.length - naTela.length).toLocaleString("pt-BR")} restantes
          </button>
        )}
      </section>

      {/* Escondido, não desmontado: assim entra e sai com transição, e o
          `aria-hidden` com `tabIndex={-1}` impede que o teclado e o leitor
          de tela alcancem um botão que ninguém está vendo. */}
      <div
        aria-hidden={!lancarLonge}
        className={cn(
          "fixed right-5 z-40 transition-all duration-200 motion-reduce:transition-none",
          lancarLonge ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <Botao
          onClick={() => setCriando(true)}
          tabIndex={lancarLonge ? undefined : -1}
          className="h-13 rounded-full px-5 shadow-[0_12px_32px_-10px_rgba(22,104,245,.8)] max-sm:w-13 max-sm:px-0"
        >
          <Plus className="size-5" />
          {/* No celular vira só o ícone: um rótulo inteiro ali cobriria a
              tabela que a pessoa está lendo. O texto continua para quem
              navega por leitor de tela. */}
          <span className="max-sm:sr-only">Novo lançamento</span>
        </Botao>
      </div>

      {baixando && (
        <ConfirmarBaixa
          lancamento={baixando}
          aoFechar={() => setBaixando(null)}
          aoConfirmar={() => baixar(baixando)}
        />
      )}

      {criando && (
        <Dialogo
          clientes={clientes}
          categorias={categorias}
          aoFechar={() => setCriando(false)}
          aoSalvar={(l) => setLancamentos((x) => [l, ...x])}
        />
      )}
      {editando && (
        <Dialogo
          clientes={clientes}
          categorias={categorias}
          lancamento={editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={(l) => setLancamentos((x) => x.map((i) => (i.id === l.id ? l : i)))}
        />
      )}
    </>
  );
}

function Acao({
  rotulo,
  onClick,
  classe = "",
  children,
}: {
  rotulo: string;
  onClick: () => void;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={`rounded-full p-2 text-cinza-claro transition-colors hover:bg-nevoa hover:text-tinta foco-anel ${classe}`}
    >
      {children}
    </button>
  );
}

function Dialogo({
  clientes,
  categorias,
  lancamento,
  aoFechar,
  aoSalvar,
}: {
  clientes: { id: string; nome: string }[];
  categorias: Categoria[];
  lancamento?: Lancamento;
  aoFechar: () => void;
  aoSalvar: (l: Lancamento) => void;
}) {
  const [d, setD] = useState<DadosLancamento>(() =>
    lancamento ? doLancamento(lancamento) : vazio(),
  );
  /* O anexo é estado à parte do formulário: o arquivo já subiu, e o que
     entra em `d.comprovante` é só o caminho. Guardar o objeto aqui é o
     que permite mostrar nome e tamanho sem ir ao banco. */
  const [anexo, setAnexo] = useState<ArquivoAnexado | null>(
    lancamento?.comprovante
      ? {
          id: null,
          nome: lancamento.comprovante_nome ?? "Comprovante",
          caminho: lancamento.comprovante,
          mime: "",
          tamanho: 0,
          url: null,
        }
      : null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const focar = useCallback((el: HTMLInputElement | null) => el?.focus(), []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = lancamento
      ? await atualizarLancamento(lancamento.id, d)
      : await criarLancamento(d);
    setEnviando(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível salvar.");

    aoSalvar({
      id: lancamento?.id ?? `local-${Date.now()}`,
      descricao: d.descricao,
      cliente: clientes.find((c) => c.id === d.cliente_id)?.nome ?? lancamento?.cliente ?? null,
      cliente_id: d.cliente_id,
      tipo: d.tipo,
      status: d.status,
      valor: d.valor,
      vencimento: d.vencimento,
      pago_em: d.status === "pago" ? d.pago_em : null,
      observacoes: d.observacoes || null,
      competencia: d.competencia,
      valor_pago: d.status === "pago" ? d.valor_pago || d.valor : 0,
      forma_pagamento: d.forma_pagamento || null,
      categoria_id: d.categoria_id,
      categoria: categorias.find((c) => c.id === d.categoria_id)?.nome ?? null,
      comprovante: d.comprovante,
      comprovante_nome: anexo?.nome ?? lancamento?.comprovante_nome ?? null,
    });
    toast.success(
      r.demo ? "Lançamento salvo (não persistido: demonstração)." : "Lançamento salvo.",
    );
    aoFechar();
  }

  return (
    <Sobreposicao
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-tinta/25 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lancamento ? "Editar lançamento" : "Novo lançamento"}
        className="my-auto w-full max-w-xl overflow-hidden rounded-xl bg-carta shadow-concha"
      >
        <div className="flex items-center justify-between border-b border-borda px-6 py-4">
          <h2 className="font-display text-lg font-bold text-tinta">
            {lancamento ? "Editar lançamento" : "Novo lançamento"}
          </h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-tinta foco-anel"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-4 p-6" noValidate>
          <Campo rotulo="Descrição">
            <Entrada
              ref={focar}
              value={d.descricao}
              onChange={(e) => setD((x) => ({ ...x, descricao: e.target.value }))}
              placeholder="Ex.: Fee mensal · Vitrine Prime"
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Tipo">
              <Selecao
                value={d.tipo}
                onChange={(e) => setD((x) => ({ ...x, tipo: e.target.value }))}
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </Selecao>
            </Campo>
            <Campo rotulo="Valor (R$)">
              <Entrada
                inputMode="decimal"
                value={String(d.valor)}
                onChange={(e) =>
                  setD((x) => ({ ...x, valor: Number(e.target.value.replace(",", ".")) || 0 }))
                }
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Vencimento">
              <Entrada
                type="date"
                value={d.vencimento}
                onChange={(e) => setD((x) => ({ ...x, vencimento: e.target.value }))}
              />
            </Campo>
            <Campo rotulo="Status">
              <Selecao
                value={d.status}
                onChange={(e) => setD((x) => ({ ...x, status: e.target.value }))}
              >
                <option value="pendente">Pendente</option>
                <option value="previsto">Previsto</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </Selecao>
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Competência decide a que mês o valor pertence no resultado;
                vencimento decide quando o dinheiro entra no caixa. Um fee
                de setembro pago em outubro conta nos dois lugares certos. */}
            <Campo rotulo="Competência" dica="Mês a que o valor se refere">
              <Entrada
                type="date"
                value={d.competencia}
                onChange={(e) => setD((x) => ({ ...x, competencia: e.target.value }))}
              />
            </Campo>
            <Campo rotulo="Forma de pagamento" dica="Opcional">
              <Selecao
                value={d.forma_pagamento}
                onChange={(e) => setD((x) => ({ ...x, forma_pagamento: e.target.value }))}
              >
                <option value="">Não informada</option>
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f} value={f}>
                    {ROTULO_FORMA[f]}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>

          {/* Só quando está pago: perguntar quando e quanto entrou num
              lançamento pendente não faz sentido e só ocupa a tela. */}
          {d.status === "pago" && (
            <div className="grid gap-4 rounded-md border border-borda bg-nevoa p-4 sm:grid-cols-2">
              <Campo rotulo="Pago em">
                <Entrada
                  type="date"
                  value={d.pago_em ?? ""}
                  onChange={(e) => setD((x) => ({ ...x, pago_em: e.target.value || null }))}
                />
              </Campo>
              <Campo rotulo="Valor pago (R$)" dica="Em branco quita o total">
                <Entrada
                  inputMode="decimal"
                  value={d.valor_pago ? String(d.valor_pago) : ""}
                  onChange={(e) =>
                    setD((x) => ({
                      ...x,
                      valor_pago: Number(e.target.value.replace(",", ".")) || 0,
                    }))
                  }
                  placeholder={String(d.valor)}
                />
              </Campo>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {clientes.length > 0 && (
              <Campo rotulo="Cliente" dica="Opcional">
                <Selecao
                  value={d.cliente_id ?? ""}
                  onChange={(e) => setD((x) => ({ ...x, cliente_id: e.target.value || null }))}
                >
                  <option value="">Sem cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            )}

            {/* A lista segue o tipo: oferecer "Impostos" numa receita só
                serviria para errar a classificação. */}
            {categorias.length > 0 && (
              <Campo rotulo="Categoria" dica="Opcional">
                <Selecao
                  value={d.categoria_id ?? ""}
                  onChange={(e) => setD((x) => ({ ...x, categoria_id: e.target.value || null }))}
                >
                  <option value="">Sem categoria</option>
                  {categorias
                    .filter((c) => c.tipo === d.tipo)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                </Selecao>
              </Campo>
            )}
          </div>

          <EnvioArquivo
            valor={anexo}
            aoMudar={(a) => {
              setAnexo(a);
              setD((x) => ({ ...x, comprovante: a?.caminho ?? null }));
            }}
            escopo="financeiro"
            recurso="financeiro"
            clienteId={d.cliente_id}
            rotulo="Comprovante de pagamento"
            dica="PDF ou imagem do comprovante, nota ou recibo — até 25 MB."
          />

          <Campo rotulo="Observações" dica="Opcional">
            <AreaTexto
              value={d.observacoes}
              onChange={(e) => setD((x) => ({ ...x, observacoes: e.target.value }))}
            />
          </Campo>

          {erro && <p className="text-xs text-perigo">{erro}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : "Salvar lançamento"}
            </Botao>
          </div>
        </form>
      </div>
    </Sobreposicao>
  );
}

/**
 * Confirmação da baixa.
 *
 * A tela não desfaz uma baixa: uma vez pago, só editando o lançamento se
 * volta atrás. E o botão fica a poucos pixels da lixeira, numa lista onde
 * as linhas de meses diferentes se parecem. Mostrar quem, quanto e quando
 * antes de gravar custa um clique e evita o telefonema para o cliente
 * errado.
 */
function ConfirmarBaixa({
  lancamento,
  aoFechar,
  aoConfirmar,
}: {
  lancamento: Lancamento;
  aoFechar: () => void;
  aoConfirmar: () => void;
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const receita = lancamento.tipo === "receita";

  return (
    <Sobreposicao
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-papel/85 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-baixa"
        className="cartao my-auto w-full max-w-md overflow-hidden rounded-xl"
      >
        <div className="flex items-start gap-3 border-b border-borda px-6 py-4">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sucesso/15 text-sucesso">
            <Check className="size-4" strokeWidth={2.5} />
          </span>
          <div>
            <h2 id="titulo-baixa" className="font-display text-lg font-bold text-tinta">
              Confirmar {receita ? "recebimento" : "pagamento"}?
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              O lançamento passa a contar como quitado no caixa.
            </p>
          </div>
        </div>

        <dl className="space-y-3 px-6 py-5 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-cinza">Descrição</dt>
            <dd className="text-right font-medium text-tinta">{lancamento.descricao}</dd>
          </div>
          {lancamento.cliente && (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-cinza">Cliente</dt>
              <dd className="text-right font-medium text-tinta">{lancamento.cliente}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-cinza">Vencimento</dt>
            <dd className="text-right font-medium text-tinta">{dataCurta(lancamento.vencimento)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-borda pt-3">
            <dt className="text-cinza">Valor</dt>
            <dd
              className={cn(
                "text-right font-display text-lg font-bold tabular-nums",
                receita ? "text-sucesso" : "text-perigo",
              )}
            >
              {receita ? "+" : "−"} {brl(lancamento.valor)}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
          <Botao variante="contorno" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao variante="sucesso" onClick={aoConfirmar}>
            Confirmar baixa
          </Botao>
        </div>
      </div>
    </Sobreposicao>
  );
}
