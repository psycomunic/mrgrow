"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Check, Pencil, Plus, Scale, TrendingDown, TrendingUp, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada, AreaTexto, Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Kpi } from "@/components/painel/kpi";
import { GraficoArea } from "@/components/painel/grafico-area";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { brl, dataCompleta, numero } from "@/lib/utils";
import {
  criarLancamento,
  atualizarLancamento,
  excluirLancamento,
  marcarPago,
  type DadosLancamento,
} from "./acoes";
import type { Lancamento } from "@/lib/financeiro";

const TOM: Record<string, "sucesso" | "alerta" | "perigo" | "neutro" | "azul"> = {
  pago: "sucesso",
  pendente: "alerta",
  atrasado: "perigo",
  previsto: "azul",
  cancelado: "neutro",
};

const ROTULO: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  previsto: "Previsto",
  cancelado: "Cancelado",
};

const BARRA: Record<string, string> = {
  pago: "bg-sucesso",
  pendente: "bg-alerta",
  previsto: "bg-mrg-500",
  atrasado: "bg-perigo",
};

const FILTROS = [
  { v: "todos", r: "Todos" },
  { v: "receita", r: "Receitas" },
  { v: "despesa", r: "Despesas" },
  { v: "atrasado", r: "Em atraso" },
];

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function vazio(): DadosLancamento {
  return {
    descricao: "",
    tipo: "receita",
    status: "pendente",
    valor: 0,
    vencimento: hoje(),
    cliente_id: null,
    observacoes: "",
  };
}

function doLancamento(l: Lancamento): DadosLancamento {
  return {
    descricao: l.descricao,
    tipo: l.tipo,
    status: l.status,
    valor: l.valor,
    vencimento: l.vencimento,
    cliente_id: l.cliente_id,
    observacoes: l.observacoes ?? "",
  };
}

/** Chave "AAAA-MM" lida do texto, sem passar por Date e sem risco de fuso. */
function mesDe(iso: string) {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  return m ? `${m[1]}-${m[2]}` : "";
}

export function Lancamentos({
  lancamentos: iniciais,
  clientes,
}: {
  lancamentos: Lancamento[];
  clientes: { id: string; nome: string }[];
}) {
  const [lancamentos, setLancamentos] = useState(iniciais);
  const [doServidor, setDoServidor] = useState(iniciais);
  const [filtro, setFiltro] = useState("todos");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);

  // Sincroniza com o que o servidor devolve depois de gravar.
  if (iniciais !== doServidor) {
    setDoServidor(iniciais);
    setLancamentos(iniciais);
  }

  const visiveis = useMemo(
    () =>
      lancamentos.filter((l) =>
        filtro === "todos" ? true : filtro === "atrasado" ? l.status === "atrasado" : l.tipo === filtro,
      ),
    [lancamentos, filtro],
  );

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

  const kpis = useMemo(() => {
    const vivos = lancamentos.filter((l) => l.status !== "cancelado");
    const soma = (xs: Lancamento[]) => xs.reduce((s, l) => s + l.valor, 0);
    const receita = vivos.filter((l) => l.tipo === "receita");
    const despesa = vivos.filter((l) => l.tipo === "despesa");
    const atrasadas = receita.filter((l) => l.status === "atrasado");
    return {
      receita: soma(receita),
      despesa: soma(despesa),
      resultado: soma(receita) - soma(despesa),
      atrasado: soma(atrasadas),
      qtdAtrasada: atrasadas.length,
    };
  }, [lancamentos]);

  /* Recebiveis por situacao: onde o dinheiro a receber esta parado. */
  const recebiveis = useMemo(() => {
    const receita = lancamentos.filter((l) => l.tipo === "receita" && l.status !== "cancelado");
    const total = receita.reduce((s, l) => s + l.valor, 0) || 1;
    return (["pago", "pendente", "previsto", "atrasado"] as const)
      .map((s) => {
        const doStatus = receita.filter((l) => l.status === s);
        const valor = doStatus.reduce((a, l) => a + l.valor, 0);
        return { status: s as string, valor, qtd: doStatus.length, parte: valor / total };
      })
      .filter((f) => f.qtd > 0);
  }, [lancamentos]);

  async function baixar(l: Lancamento) {
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
        <Kpi
          rotulo="Receitas no período"
          valor={brl(kpis.receita)}
          tom="menta"
          icone={<TrendingUp />}
          serie={fluxo.map((m) => m.receitas)}
        />
        <Kpi
          rotulo="Despesas no período"
          valor={brl(kpis.despesa)}
          tom="rosa"
          icone={<TrendingDown />}
          serie={fluxo.map((m) => m.despesas)}
        />
        <Kpi
          rotulo={kpis.resultado >= 0 ? "Resultado, no azul" : "Resultado, no vermelho"}
          valor={brl(kpis.resultado)}
          tom="azul"
          icone={<Scale />}
          serie={fluxo.map((m) => m.receitas - m.despesas)}
        />
        <Kpi
          rotulo="A receber em atraso"
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
              { chave: "receitas", rotulo: "Receitas", cor: "#067a55" },
              { chave: "despesas", rotulo: "Despesas", cor: "#d92d3f" },
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
                    <span className="text-sm font-medium text-grafite">{ROTULO[f.status]}</span>
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
                    {(f.parte * 100).toFixed(0)}% do total
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
                  <Celula className="text-cinza">{l.cliente ?? "sem cliente"}</Celula>
                  <Celula className="text-cinza">{dataCompleta(l.vencimento)}</Celula>
                  <Celula>
                    <Etiqueta tom={TOM[l.status] ?? "neutro"}>
                      {ROTULO[l.status] ?? l.status}
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
                      {l.status !== "pago" && (
                        <Acao
                          rotulo="Dar baixa"
                          onClick={() => baixar(l)}
                          classe="hover:bg-chip-menta hover:text-sucesso"
                        >
                          <Check className="size-4" />
                        </Acao>
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

      {criando && (
        <Dialogo
          clientes={clientes}
          aoFechar={() => setCriando(false)}
          aoSalvar={(l) => setLancamentos((x) => [l, ...x])}
        />
      )}
      {editando && (
        <Dialogo
          clientes={clientes}
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
  lancamento,
  aoFechar,
  aoSalvar,
}: {
  clientes: { id: string; nome: string }[];
  lancamento?: Lancamento;
  aoFechar: () => void;
  aoSalvar: (l: Lancamento) => void;
}) {
  const [d, setD] = useState<DadosLancamento>(() =>
    lancamento ? doLancamento(lancamento) : vazio(),
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
      pago_em: d.status === "pago" ? d.vencimento : null,
      observacoes: d.observacoes || null,
    });
    toast.success(
      r.demo ? "Lançamento salvo (não persistido: demonstração)." : "Lançamento salvo.",
    );
    aoFechar();
  }

  return (
    <div
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
    </div>
  );
}
