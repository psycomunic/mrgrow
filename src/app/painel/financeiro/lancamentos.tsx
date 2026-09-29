"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Check, Pencil, Plus, Scale, TrendingDown, TrendingUp, Trash2, X,
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
import { brl, cn, dataCompleta, dataCurta, numero } from "@/lib/utils";
import { STATUS_LANCAMENTO } from "@/lib/rotulos";
import { limitesDoMes, noPeriodo as emJanela, resumirFinanceiro } from "@/lib/resumo";
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
const PERIODOS = [
  { v: "mes", r: "Este mês", meses: 1 },
  { v: "trimestre", r: "Últimos 3 meses", meses: 3 },
  { v: "tudo", r: "Tudo", meses: 0 },
];

const FILTROS = [
  { v: "todos", r: "Todos" },
  { v: "receita", r: "Receitas" },
  { v: "despesa", r: "Despesas" },
  { v: "atrasado", r: "Em atraso" },
];

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
  const [filtro, setFiltro] = useState("todos");
  const [periodo, setPeriodo] = useState("mes");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
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
     sem construir Date, e sem o risco de fuso que isso traria.
     
     Os dois lados são fechados. Só com o `>=`, "este mês" somava também
     outubro e novembro e o cartão mostrava R$ 142.250 de receita num mês
     de R$ 48.450 — as cobranças futuras já lançadas entravam na conta. */
  const janela = useMemo(() => {
    const meses = PERIODOS.find((x) => x.v === periodo)?.meses ?? 0;
    if (!meses) return null;
    const mesAtual = mesDe(hoje());
    const [ano, mes] = mesAtual.split("-").map(Number);
    const total = ano * 12 + (mes - 1) - (meses - 1);
    const primeiro = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
    return { de: limitesDoMes(primeiro).de, ate: limitesDoMes(mesAtual).ate };
  }, [periodo]);

  const noPeriodo = useMemo(
    () => (janela ? lancamentos.filter((l) => emJanela(l, janela.de, janela.ate)) : lancamentos),
    [lancamentos, janela],
  );

  const visiveis = useMemo(
    () =>
      noPeriodo.filter((l) =>
        filtro === "todos" ? true : filtro === "atrasado" ? l.status === "atrasado" : l.tipo === filtro,
      ),
    [noPeriodo, filtro],
  );

  const rotuloPeriodo = (PERIODOS.find((x) => x.v === periodo)?.r ?? "").toLowerCase();

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
      resumirFinanceiro(noPeriodo, {
        de: janela?.de ?? "0000-01-01",
        ate: janela?.ate ?? "9999-12-31",
        hoje: hoje(),
      }),
    [noPeriodo, janela],
  );

  /* Recebiveis por situacao: onde o dinheiro a receber esta parado. */
  const recebiveis = useMemo(() => {
    const receita = noPeriodo.filter((l) => l.tipo === "receita" && l.status !== "cancelado");
    const total = receita.reduce((s, l) => s + l.valor, 0) || 1;
    return (["pago", "pendente", "previsto", "atrasado"] as const)
      .map((s) => {
        const doStatus = receita.filter((l) => l.status === s);
        const valor = doStatus.reduce((a, l) => a + l.valor, 0);
        return { status: s as string, valor, qtd: doStatus.length, parte: valor / total };
      })
      .filter((f) => f.qtd > 0);
  }, [noPeriodo]);

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

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-base font-bold text-tinta">Lançamentos</h2>

          <div className="flex flex-wrap gap-1 rounded-full bg-nevoa p-0.5">
            {PERIODOS.map((x) => (
              <button
                key={x.v}
                onClick={() => setPeriodo(x.v)}
                aria-pressed={periodo === x.v}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors foco-anel",
                  periodo === x.v ? "bg-carta text-tinta shadow-card" : "text-cinza hover:text-grafite",
                ].join(" ")}
              >
                {x.r}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {FILTROS.map((f) => (
              <button
                key={f.v}
                onClick={() => setFiltro(f.v)}
                aria-pressed={filtro === f.v}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors foco-anel",
                  filtro === f.v
                    ? "bg-mrg-500 text-white"
                    : "bg-carta text-cinza hover:text-grafite",
                ].join(" ")}
              >
                {f.r}
              </button>
            ))}
          </div>
          <Botao tamanho="sm" className="ml-auto" onClick={() => setCriando(true)}>
            <Plus className="size-4" />
            Novo lançamento
          </Botao>
        </div>

        {visiveis.length === 0 ? (
          <p className="cartao p-10 text-center text-sm text-cinza-claro">
            Nenhum lançamento neste recorte.
          </p>
        ) : (
          <Tabela>
            <Cabecalhos colunas={["Descrição", "Cliente", "Vencimento", "Status", "Valor", ""]} />
            <tbody>
              {visiveis.map((l) => (
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
      </section>

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
