"use client";

import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Selecao } from "@/components/ui/campo";
import { cn } from "@/lib/utils";
import { FORMAS_PAGAMENTO, ROTULO_FORMA, STATUS_LANCAMENTO } from "@/lib/rotulos";
import { limitesDoMes } from "@/lib/resumo";
import type { Categoria } from "./lancamentos";

/**
 * O recorte que a tela do financeiro está mostrando.
 *
 * Vive como um objeto só, e não como oito estados soltos, porque quase
 * toda ação mexe em mais de um campo: escolher "mês passado" precisa
 * limpar as datas soltas, e digitar uma data precisa marcar o período
 * como personalizado. Com estados separados, cada combinação virava um
 * `setX` esquecido em algum lugar.
 */
export type Recorte = {
  periodo: string;
  de: string;
  ate: string;
  tipo: string;
  status: string;
  clienteId: string;
  categoriaId: string;
  forma: string;
  busca: string;
  ordem: string;
};

export const RECORTE_PADRAO: Recorte = {
  periodo: "mes",
  de: "",
  ate: "",
  tipo: "todos",
  status: "todos",
  clienteId: "todos",
  categoriaId: "todos",
  forma: "todos",
  busca: "",
  ordem: "vencimento-desc",
};

export const PERIODOS = [
  { v: "mes", r: "Este mês" },
  { v: "passado", r: "Mês passado" },
  { v: "trimestre", r: "3 meses" },
  { v: "semestre", r: "6 meses" },
  { v: "ano", r: "Este ano" },
  { v: "tudo", r: "Tudo" },
  { v: "livre", r: "Escolher datas" },
];

export const ORDENS = [
  { v: "vencimento-desc", r: "Vencimento, do mais novo" },
  { v: "vencimento-asc", r: "Vencimento, do mais antigo" },
  { v: "valor-desc", r: "Maior valor" },
  { v: "valor-asc", r: "Menor valor" },
  { v: "cliente", r: "Cliente, A a Z" },
];

const TIPOS = [
  { v: "todos", r: "Tudo" },
  { v: "receita", r: "Receitas" },
  { v: "despesa", r: "Despesas" },
];

const STATUS = ["todos", "pago", "pendente", "previsto", "atrasado", "cancelado"];

/** Mês a partir de hoje, recuando `n` meses. */
function mesRecuado(hoje: string, n: number) {
  const [ano, mes] = hoje.slice(0, 7).split("-").map(Number);
  const total = ano * 12 + (mes - 1) - n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/**
 * As datas do recorte, resolvidas.
 *
 * Um só lugar traduz "3 meses" em primeiro e último dia, e é ele que
 * garante os dois lados fechados — era a falta do limite superior que
 * fazia "este mês" somar outubro e novembro.
 */
export function janelaDo(recorte: Recorte, hoje: string): { de: string; ate: string } | null {
  const mesAtual = hoje.slice(0, 7);

  switch (recorte.periodo) {
    case "tudo":
      return null;
    case "livre":
      return recorte.de && recorte.ate
        ? { de: recorte.de, ate: recorte.ate }
        : recorte.de
          ? { de: recorte.de, ate: "9999-12-31" }
          : recorte.ate
            ? { de: "0000-01-01", ate: recorte.ate }
            : null;
    case "mes":
      return limitesDoMes(mesAtual);
    case "passado": {
      const m = mesRecuado(hoje, 1);
      return limitesDoMes(m);
    }
    case "ano":
      return { de: `${hoje.slice(0, 4)}-01-01`, ate: `${hoje.slice(0, 4)}-12-31` };
    case "trimestre":
      return { de: limitesDoMes(mesRecuado(hoje, 2)).de, ate: limitesDoMes(mesAtual).ate };
    case "semestre":
      return { de: limitesDoMes(mesRecuado(hoje, 5)).de, ate: limitesDoMes(mesAtual).ate };
    default:
      return limitesDoMes(mesAtual);
  }
}

/** Quantos filtros estão fora do padrão — vira o contador do botão de limpar. */
export function quantosAtivos(r: Recorte) {
  return (
    Number(r.tipo !== "todos") +
    Number(r.status !== "todos") +
    Number(r.clienteId !== "todos") +
    Number(r.categoriaId !== "todos") +
    Number(r.forma !== "todos") +
    Number(r.busca.trim() !== "") +
    Number(r.periodo !== RECORTE_PADRAO.periodo)
  );
}

export function BarraFiltros({
  recorte,
  aoMudar,
  clientes,
  categorias,
  encontrados,
  acao,
}: {
  recorte: Recorte;
  aoMudar: (r: Recorte) => void;
  clientes: { id: string; nome: string }[];
  categorias: Categoria[];
  encontrados: number;
  acao?: React.ReactNode;
}) {
  const ativos = quantosAtivos(recorte);

  /* As categorias seguem o tipo escolhido: com "Receitas" na tela, oferecer
     "Aluguel do escritório" só gera recorte vazio. */
  const categoriasVisiveis = useMemo(
    () =>
      recorte.tipo === "todos" ? categorias : categorias.filter((c) => c.tipo === recorte.tipo),
    [categorias, recorte.tipo],
  );

  const mudar = (campo: keyof Recorte, valor: string) => {
    const novo = { ...recorte, [campo]: valor };
    /* Digitar data sozinha não ligava o período livre, e o recorte ficava
       preso no mês corrente ignorando o que a pessoa acabou de escrever. */
    if (campo === "de" || campo === "ate") novo.periodo = "livre";
    if (campo === "periodo" && valor !== "livre") {
      novo.de = "";
      novo.ate = "";
    }
    if (campo === "tipo" && valor !== "todos") {
      const cat = categorias.find((c) => c.id === novo.categoriaId);
      if (cat && cat.tipo !== valor) novo.categoriaId = "todos";
    }
    aoMudar(novo);
  };

  return (
    <div className="cartao space-y-3 rounded-lg p-4">
      {/* Linha 1: período, que é o filtro que todo mundo mexe primeiro. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-0.5 rounded-full bg-nevoa p-0.5">
          {PERIODOS.map((p) => (
            <button
              key={p.v}
              onClick={() => mudar("periodo", p.v)}
              aria-pressed={recorte.periodo === p.v}
              className={cn(
                "foco-anel rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                recorte.periodo === p.v
                  ? "bg-carta text-tinta shadow-card"
                  : "text-cinza hover:text-grafite",
              )}
            >
              {p.r}
            </button>
          ))}
        </div>

        {recorte.periodo === "livre" && (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={recorte.de}
              onChange={(e) => mudar("de", e.target.value)}
              aria-label="Data inicial"
              className="foco-anel h-9 rounded-sm border border-borda bg-concha px-2.5 text-xs text-tinta"
            />
            <span className="text-xs text-cinza">até</span>
            <input
              type="date"
              value={recorte.ate}
              onChange={(e) => mudar("ate", e.target.value)}
              aria-label="Data final"
              className="foco-anel h-9 rounded-sm border border-borda bg-concha px-2.5 text-xs text-tinta"
            />
          </div>
        )}

        {acao && <div className="ml-auto">{acao}</div>}
      </div>

      {/* Linha 2: os cortes que dependem do que se está procurando. */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        <label className="relative sm:col-span-2 xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinza-claro" />
          <input
            value={recorte.busca}
            onChange={(e) => mudar("busca", e.target.value)}
            placeholder="Buscar descrição ou cliente…"
            aria-label="Buscar lançamento"
            className="foco-anel h-9 w-full rounded-sm border border-borda bg-concha pl-9 pr-3 text-sm text-tinta placeholder:text-cinza-claro"
          />
        </label>

        <Selecao
          value={recorte.tipo}
          onChange={(e) => mudar("tipo", e.target.value)}
          aria-label="Tipo"
          className="h-9 text-xs"
        >
          {TIPOS.map((t) => (
            <option key={t.v} value={t.v}>
              {t.r}
            </option>
          ))}
        </Selecao>

        <Selecao
          value={recorte.status}
          onChange={(e) => mudar("status", e.target.value)}
          aria-label="Situação"
          className="h-9 text-xs"
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s === "todos" ? "Qualquer situação" : STATUS_LANCAMENTO.rotulo(s)}
            </option>
          ))}
        </Selecao>

        <Selecao
          value={recorte.clienteId}
          onChange={(e) => mudar("clienteId", e.target.value)}
          aria-label="Cliente"
          className="h-9 text-xs"
        >
          <option value="todos">Todos os clientes</option>
          <option value="agencia">Sem cliente (agência)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Selecao>

        <Selecao
          value={recorte.categoriaId}
          onChange={(e) => mudar("categoriaId", e.target.value)}
          aria-label="Categoria"
          className="h-9 text-xs"
        >
          <option value="todos">Todas as categorias</option>
          <option value="sem">Sem categoria</option>
          {categoriasVisiveis.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Selecao>
      </div>

      {/* Linha 3: o que quase ninguém mexe, mais o estado do recorte. */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <Selecao
          value={recorte.forma}
          onChange={(e) => mudar("forma", e.target.value)}
          aria-label="Forma de pagamento"
          className="h-9 w-auto text-xs"
        >
          <option value="todos">Qualquer forma</option>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMA[f]}
            </option>
          ))}
        </Selecao>

        <Selecao
          value={recorte.ordem}
          onChange={(e) => mudar("ordem", e.target.value)}
          aria-label="Ordenação"
          className="h-9 w-auto text-xs"
        >
          {ORDENS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.r}
            </option>
          ))}
        </Selecao>

        <span className="text-xs text-cinza">
          {encontrados === 1 ? "1 lançamento" : `${encontrados.toLocaleString("pt-BR")} lançamentos`}
        </span>

        {ativos > 0 && (
          <button
            onClick={() => aoMudar(RECORTE_PADRAO)}
            className="foco-anel ml-auto inline-flex items-center gap-1.5 rounded-full border border-borda px-3 py-1 text-xs font-medium text-cinza transition-colors hover:border-borda-forte hover:text-tinta"
          >
            <X className="size-3.5" />
            Limpar {ativos} {ativos === 1 ? "filtro" : "filtros"}
          </button>
        )}
      </div>
    </div>
  );
}
