"use client";

import { AlarmClock, EyeOff, Search, X } from "lucide-react";
import { PRIORIDADE } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { useTarefas } from "./contexto";

/** Pílula de alternância: acende quando o filtro está valendo. */
function Pilula({
  ativo,
  aoClicar,
  children,
  titulo,
}: {
  ativo: boolean;
  aoClicar: () => void;
  children: React.ReactNode;
  titulo?: string;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativo}
      title={titulo}
      className={cn(
        "foco-anel inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
        ativo
          ? "border-mrg-500/50 bg-mrg-500/15 text-acento-forte"
          : "border-borda bg-carta text-cinza hover:border-borda-forte hover:text-tinta",
      )}
    >
      {children}
    </button>
  );
}

/* Um `select` nativo estilizado como pílula. Menu próprio seria mais bonito,
   mas o nativo já vem com teclado, busca por digitação e o comportamento certo
   no celular — não vale reescrever isso para ganhar uma borda. */
function Menu({
  valor,
  aoMudar,
  children,
  rotulo,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  children: React.ReactNode;
  rotulo: string;
}) {
  const ativo = valor !== "";
  return (
    <select
      aria-label={rotulo}
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className={cn(
        "foco-anel cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
        ativo
          ? "border-mrg-500/50 bg-mrg-500/15 text-acento-forte"
          : "border-borda bg-carta text-cinza hover:border-borda-forte hover:text-tinta",
      )}
    >
      {children}
    </select>
  );
}

export function Filtros() {
  const {
    clientes,
    equipe,
    etiquetas,
    filtros,
    filtrando,
    definirFiltros,
    limparFiltros,
    todas,
    tarefas,
  } = useTarefas();

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cinza-claro" />
          <input
            type="search"
            value={filtros.busca}
            onChange={(e) => definirFiltros({ busca: e.target.value })}
            placeholder="Buscar por título, cliente, pessoa ou etiqueta…"
            aria-label="Buscar tarefas"
            className="foco-anel w-full rounded-full border border-borda bg-carta py-2 pr-4 pl-9 text-[13px] text-tinta placeholder:text-cinza-claro"
          />
        </div>

        <Menu
          rotulo="Filtrar por responsável"
          valor={filtros.responsavel ?? ""}
          aoMudar={(v) => definirFiltros({ responsavel: v || null })}
        >
          <option value="">Toda a equipe</option>
          <option value="sem">Sem responsável</option>
          {equipe.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Menu>

        <Menu
          rotulo="Filtrar por cliente"
          valor={filtros.cliente ?? ""}
          aoMudar={(v) => definirFiltros({ cliente: v || null })}
        >
          <option value="">Todos os clientes</option>
          <option value="interno">Interno da agência</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Menu>

        <Menu
          rotulo="Filtrar por prioridade"
          valor={filtros.prioridade ?? ""}
          aoMudar={(v) => definirFiltros({ prioridade: v || null })}
        >
          <option value="">Toda prioridade</option>
          {PRIORIDADE.lista.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </Menu>

        {!!etiquetas.length && (
          <Menu
            rotulo="Filtrar por etiqueta"
            valor={filtros.etiqueta ?? ""}
            aoMudar={(v) => definirFiltros({ etiqueta: v || null })}
          >
            <option value="">Todas as etiquetas</option>
            {etiquetas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Menu>
        )}

        <Pilula
          ativo={filtros.soAtrasadas}
          aoClicar={() => definirFiltros({ soAtrasadas: !filtros.soAtrasadas })}
          titulo="Mostrar apenas o que passou do prazo"
        >
          <AlarmClock className="size-3.5" />
          Atrasadas
        </Pilula>

        <Pilula
          ativo={filtros.ocultarConcluidas}
          aoClicar={() => definirFiltros({ ocultarConcluidas: !filtros.ocultarConcluidas })}
          titulo="Esconder a coluna de concluídas"
        >
          <EyeOff className="size-3.5" />
          Ocultar concluídas
        </Pilula>

        {filtrando && (
          <button
            type="button"
            onClick={limparFiltros}
            className="foco-anel inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-cinza hover:text-tinta"
          >
            <X className="size-3.5" />
            Limpar
          </button>
        )}
      </div>

      {filtrando && (
        <p className="text-xs text-cinza">
          Mostrando <strong className="font-semibold text-tinta">{tarefas.length}</strong> de{" "}
          {todas.length} tarefas.
        </p>
      )}
    </section>
  );
}
