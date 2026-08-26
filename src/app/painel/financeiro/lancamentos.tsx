"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada, AreaTexto, Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Kpi } from "@/components/painel/kpi";
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

const TOM: Record<string, "sucesso" | "alerta" | "perigo" | "neutro"> = {
  pago: "sucesso",
  pendente: "alerta",
  atrasado: "perigo",
  cancelado: "neutro",
};

const ROTULO: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
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

  const kpis = useMemo(() => {
    const receita = lancamentos.filter((l) => l.tipo === "receita");
    const despesa = lancamentos.filter((l) => l.tipo === "despesa");
    const totalR = receita.reduce((s, l) => s + l.valor, 0);
    const totalD = despesa.reduce((s, l) => s + l.valor, 0);
    return {
      receita: totalR,
      despesa: totalD,
      resultado: totalR - totalD,
      atrasado: receita.filter((l) => l.status === "atrasado").reduce((s, l) => s + l.valor, 0),
      qtdAtrasada: receita.filter((l) => l.status === "atrasado").length,
    };
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
        <Kpi rotulo="Receitas" valor={brl(kpis.receita)} detalhe="lançadas no período" />
        <Kpi rotulo="Despesas" valor={brl(kpis.despesa)} detalhe="lançadas no período" />
        <Kpi
          rotulo="Resultado"
          valor={brl(kpis.resultado)}
          detalhe={kpis.resultado >= 0 ? "no azul" : "no vermelho"}
        />
        <Kpi
          rotulo="Em atraso"
          valor={brl(kpis.atrasado)}
          detalhe={`${numero(kpis.qtdAtrasada)} a receber`}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltro(f.v)}
              aria-pressed={filtro === f.v}
              className={[
                "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors foco-anel",
                filtro === f.v
                  ? "bg-mrg-500/15 text-mrg-200 ring-1 ring-inset ring-mrg-500/40"
                  : "text-ink-400 hover:bg-white/5 hover:text-ink-200",
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
        <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-ink-500">
          Nenhum lançamento neste recorte.
        </p>
      ) : (
        <Tabela>
          <Cabecalhos colunas={["Descrição", "Cliente", "Tipo", "Vencimento", "Valor", "Status", ""]} />
          <tbody>
            {visiveis.map((l) => (
              <Linha key={l.id}>
                <Celula className="text-white">{l.descricao}</Celula>
                <Celula className="text-ink-400">{l.cliente ?? "—"}</Celula>
                <Celula>
                  <Etiqueta tom={l.tipo === "receita" ? "sucesso" : "perigo"}>
                    {l.tipo === "receita" ? "Receita" : "Despesa"}
                  </Etiqueta>
                </Celula>
                <Celula className="text-ink-400">{dataCompleta(l.vencimento)}</Celula>
                <Celula className="font-medium text-white">{brl(l.valor)}</Celula>
                <Celula>
                  <Etiqueta tom={TOM[l.status] ?? "neutro"}>{ROTULO[l.status] ?? l.status}</Etiqueta>
                </Celula>
                <Celula>
                  <div className="flex items-center justify-end gap-1">
                    {l.status !== "pago" && (
                      <Acao
                        rotulo="Dar baixa"
                        onClick={() => baixar(l)}
                        classe="hover:bg-sucesso/15 hover:text-sucesso"
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
                      classe="hover:bg-perigo/15 hover:text-perigo"
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
      className={`rounded-sm p-2 text-ink-400 transition-colors hover:bg-white/5 hover:text-white foco-anel ${classe}`}
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
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lancamento ? "Editar lançamento" : "Novo lançamento"}
        className="cartao-vidro my-auto w-full max-w-xl overflow-hidden rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-white">
            {lancamento ? "Editar lançamento" : "Novo lançamento"}
          </h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-sm p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-white foco-anel"
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
