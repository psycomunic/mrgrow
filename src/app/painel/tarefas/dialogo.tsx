"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { PRIORIDADE, STATUS_TAREFA } from "@/lib/rotulos";
import { useTarefas } from "./contexto";
import type { DadosTarefa } from "./acoes";
import type { Tarefa } from "@/lib/tarefas";

function vazio(status: string): DadosTarefa {
  return {
    titulo: "",
    descricao: "",
    status,
    prioridade: "media",
    cliente_id: null,
    vence_em: null,
  };
}

function daTarefa(t: Tarefa): DadosTarefa {
  return {
    titulo: t.titulo,
    descricao: t.descricao ?? "",
    status: t.status,
    prioridade: t.prioridade,
    cliente_id: t.cliente_id,
    vence_em: t.vence_em,
  };
}

/**
 * Formulário de tarefa em diálogo modal. Cria e edita: com `tarefa`, salva por
 * cima; sem ela, nasce na coluna de onde o botão foi clicado.
 *
 * O componente só existe enquanto o diálogo está aberto, então o estado nasce
 * do zero a cada abertura — sem efeito para reatribuir props.
 */
export function DialogoTarefa({
  aoFechar,
  tarefa,
  statusPadrao = "backlog",
}: {
  aoFechar: () => void;
  tarefa?: Tarefa;
  statusPadrao?: string;
}) {
  const { clientes, criar, editar } = useTarefas();
  const idBase = useId();

  const [dados, setDados] = useState<DadosTarefa>(() =>
    tarefa ? daTarefa(tarefa) : vazio(statusPadrao),
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

  const focarPrimeiro = useCallback((el: HTMLInputElement | null) => el?.focus(), []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!dados.titulo.trim()) return setErro("Escreva o que precisa ser feito.");

    setEnviando(true);
    const ok = tarefa ? await editar(tarefa.id, dados) : await criar(dados);
    setEnviando(false);
    if (ok) aoFechar();
  }

  return (
    <Sobreposicao
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-papel/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idBase}-titulo`}
        className="cartao my-auto w-full max-w-xl overflow-hidden rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-borda px-6 py-4">
          <div>
            <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-tinta">
              {tarefa ? "Editar tarefa" : "Nova tarefa"}
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              {tarefa
                ? "As mudanças aparecem no quadro na hora."
                : "Ela entra no quadro já na coluna escolhida."}
            </p>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-sm p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-tinta foco-anel"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
            <Campo rotulo="O que precisa ser feito">
              <Entrada
                ref={focarPrimeiro}
                value={dados.titulo}
                onChange={(e) => {
                  setDados((d) => ({ ...d, titulo: e.target.value }));
                  setErro(null);
                }}
                placeholder="Ex.: Subir 6 criativos novos do lançamento"
              />
            </Campo>

            <Campo rotulo="Detalhes" dica="Opcional — o contexto que a pessoa vai precisar">
              <AreaTexto
                value={dados.descricao}
                onChange={(e) => setDados((d) => ({ ...d, descricao: e.target.value }))}
                placeholder="Links, referências, o que já foi tentado…"
                className="min-h-24"
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Cliente">
                <Selecao
                  value={dados.cliente_id ?? ""}
                  onChange={(e) => setDados((d) => ({ ...d, cliente_id: e.target.value || null }))}
                >
                  <option value="">Interno da agência</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>

              <Campo rotulo="Prazo">
                <Entrada
                  type="date"
                  value={dados.vence_em ?? ""}
                  onChange={(e) => setDados((d) => ({ ...d, vence_em: e.target.value || null }))}
                />
              </Campo>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Coluna">
                <Selecao
                  value={dados.status}
                  onChange={(e) => setDados((d) => ({ ...d, status: e.target.value }))}
                >
                  {STATUS_TAREFA.lista.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.rotulo}
                    </option>
                  ))}
                </Selecao>
              </Campo>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-grafite">Prioridade</span>
                <div className="flex gap-1.5">
                  {PRIORIDADE.lista.map((p) => (
                    <button
                      key={p.valor}
                      type="button"
                      onClick={() => setDados((d) => ({ ...d, prioridade: p.valor }))}
                      aria-pressed={dados.prioridade === p.valor}
                      className={[
                        "flex-1 rounded-md px-2 py-2.5 text-xs transition-colors foco-anel",
                        dados.prioridade === p.valor
                          ? "bg-mrg-500/15 text-mrg-700 ring-1 ring-inset ring-mrg-500/45"
                          : "border border-borda bg-nevoa text-cinza hover:text-grafite",
                      ].join(" ")}
                    >
                      {p.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {erro && <p className="text-xs text-perigo">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : tarefa ? "Salvar alterações" : "Criar tarefa"}
            </Botao>
          </div>
        </form>
      </div>
    </Sobreposicao>
  );
}
