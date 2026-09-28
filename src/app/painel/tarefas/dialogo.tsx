"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Repeat, X } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Avatar } from "@/components/painel/avatares";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { PRIORIDADE, STATUS_TAREFA } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { useTarefas } from "./contexto";
import { type DadosTarefa } from "./acoes";
import { RECORRENCIAS, ROTULO_RECORRENCIA } from "@/lib/rotulos";
import type { Tarefa } from "@/lib/tarefas";


function vazio(status: string, responsavelPadrao: string | null): DadosTarefa {
  return {
    titulo: "",
    descricao: "",
    status,
    prioridade: "media",
    cliente_id: null,
    projeto_id: null,
    responsavel_id: responsavelPadrao,
    vence_em: null,
    etiquetas: [],
    estimativa_horas: null,
    horas_gastas: 0,
    recorrente: false,
    recorrencia: null,
  };
}

function daTarefa(t: Tarefa): DadosTarefa {
  return {
    titulo: t.titulo,
    descricao: t.descricao ?? "",
    status: t.status,
    prioridade: t.prioridade,
    cliente_id: t.cliente_id,
    projeto_id: t.projeto_id,
    responsavel_id: t.responsavel_id,
    vence_em: t.vence_em,
    etiquetas: t.etiquetas,
    estimativa_horas: t.estimativa_horas,
    horas_gastas: t.horas_gastas,
    recorrente: t.recorrente,
    recorrencia: t.recorrencia,
  };
}

/** Campo numérico que devolve `null` quando apagado, e não `0`. */
function numeroOuNulo(valor: string): number | null {
  const t = valor.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
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
  responsavelPadrao = null,
}: {
  aoFechar: () => void;
  tarefa?: Tarefa;
  statusPadrao?: string;
  /** Quando a tarefa nasce da coluna de uma pessoa, já vai com o nome dela. */
  responsavelPadrao?: string | null;
}) {
  const { clientes, projetos, equipe, etiquetas: sugeridas, criar, editar } = useTarefas();
  const idBase = useId();

  const [dados, setDados] = useState<DadosTarefa>(() =>
    tarefa ? daTarefa(tarefa) : vazio(statusPadrao, responsavelPadrao),
  );
  const [rascunhoEtiqueta, setRascunho] = useState("");
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

  function adicionarEtiqueta(bruta: string) {
    const e = bruta.trim().toLowerCase();
    if (!e) return;
    setRascunho("");
    setDados((d) =>
      d.etiquetas.includes(e) || d.etiquetas.length >= 8
        ? d
        : { ...d, etiquetas: [...d.etiquetas, e] },
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!dados.titulo.trim()) return setErro("Escreva o que precisa ser feito.");

    setEnviando(true);
    const ok = tarefa ? await editar(tarefa.id, dados) : await criar(dados);
    setEnviando(false);
    if (ok) aoFechar();
  }

  /* Só oferece como sugestão a etiqueta que esta tarefa ainda não tem. */
  const naoUsadas = sugeridas.filter((e) => !dados.etiquetas.includes(e)).slice(0, 8);
  const responsavel = equipe.find((p) => p.id === dados.responsavel_id) ?? null;

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
        className="cartao my-auto w-full max-w-2xl overflow-hidden rounded-xl"
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
            className="foco-anel rounded-sm p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-tinta"
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

            <Campo rotulo="Responsável" dica="Quem toca a tarefa e responde por ela">
              <div className="flex items-center gap-3">
                {responsavel ? (
                  <Avatar nome={responsavel.nome} medida="lg" />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-borda-forte text-[11px] text-cinza-claro">
                    ?
                  </span>
                )}
                <Selecao
                  value={dados.responsavel_id ?? ""}
                  onChange={(e) =>
                    setDados((d) => ({ ...d, responsavel_id: e.target.value || null }))
                  }
                >
                  <option value="">Sem responsável definido</option>
                  {equipe.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </Selecao>
              </div>
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

              <Campo rotulo="Projeto">
                <Selecao
                  value={dados.projeto_id ?? ""}
                  onChange={(e) => setDados((d) => ({ ...d, projeto_id: e.target.value || null }))}
                >
                  <option value="">Fora de projeto</option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </Selecao>
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

              <Campo rotulo="Prazo">
                <Entrada
                  type="date"
                  value={dados.vence_em ?? ""}
                  onChange={(e) => setDados((d) => ({ ...d, vence_em: e.target.value || null }))}
                />
              </Campo>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-grafite">Prioridade</span>
              <div className="flex gap-1.5">
                {PRIORIDADE.lista.map((p) => (
                  <button
                    key={p.valor}
                    type="button"
                    onClick={() => setDados((d) => ({ ...d, prioridade: p.valor }))}
                    aria-pressed={dados.prioridade === p.valor}
                    className={cn(
                      "foco-anel flex-1 rounded-md px-2 py-2.5 text-xs transition-colors",
                      dados.prioridade === p.valor
                        ? "bg-mrg-500/15 text-acento-forte ring-1 ring-mrg-500/45 ring-inset"
                        : "border border-borda bg-nevoa text-cinza hover:text-grafite",
                    )}
                  >
                    {p.rotulo}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Estimativa (horas)" dica="Quanto se espera gastar">
                <Entrada
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={dados.estimativa_horas ?? ""}
                  onChange={(e) =>
                    setDados((d) => ({ ...d, estimativa_horas: numeroOuNulo(e.target.value) }))
                  }
                  placeholder="—"
                />
              </Campo>

              <Campo rotulo="Horas gastas" dica="O que já foi consumido até agora">
                <Entrada
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={dados.horas_gastas || ""}
                  onChange={(e) =>
                    setDados((d) => ({ ...d, horas_gastas: numeroOuNulo(e.target.value) ?? 0 }))
                  }
                  placeholder="0"
                />
              </Campo>
            </div>

            <Campo rotulo="Etiquetas" dica="Enter para adicionar — no máximo 8">
              <div className="space-y-2">
                {!!dados.etiquetas.length && (
                  <ul className="flex flex-wrap gap-1.5">
                    {dados.etiquetas.map((e) => (
                      <li key={e}>
                        <button
                          type="button"
                          onClick={() =>
                            setDados((d) => ({
                              ...d,
                              etiquetas: d.etiquetas.filter((x) => x !== e),
                            }))
                          }
                          className="foco-anel inline-flex items-center gap-1 rounded-full bg-mrg-500/15 px-2.5 py-1 text-[11px] font-semibold text-acento-forte hover:bg-mrg-500/25"
                          aria-label={`Remover etiqueta ${e}`}
                        >
                          {e}
                          <X className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <Entrada
                  value={rascunhoEtiqueta}
                  onChange={(e) => setRascunho(e.target.value)}
                  onKeyDown={(e) => {
                    /* Enter aqui adiciona a etiqueta; sem o `preventDefault`
                       ele enviaria o formulário inteiro. */
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      adicionarEtiqueta(rascunhoEtiqueta);
                    }
                    if (e.key === "Backspace" && !rascunhoEtiqueta) {
                      setDados((d) => ({ ...d, etiquetas: d.etiquetas.slice(0, -1) }));
                    }
                  }}
                  placeholder="criativo, tracking, relatório…"
                  disabled={dados.etiquetas.length >= 8}
                />

                {!!naoUsadas.length && (
                  <ul className="flex flex-wrap gap-1.5">
                    {naoUsadas.map((e) => (
                      <li key={e}>
                        <button
                          type="button"
                          onClick={() => adicionarEtiqueta(e)}
                          className="foco-anel rounded-full border border-borda px-2.5 py-1 text-[11px] text-cinza hover:border-borda-forte hover:text-tinta"
                        >
                          + {e}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Campo>

            <div className="rounded-md border border-borda bg-nevoa p-3.5">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={dados.recorrente}
                  onChange={(e) =>
                    setDados((d) => ({
                      ...d,
                      recorrente: e.target.checked,
                      /* Marcar já escolhe um período, senão o formulário
                         reprovaria por um campo que ainda nem apareceu. */
                      recorrencia: e.target.checked ? (d.recorrencia ?? "semanal") : null,
                    }))
                  }
                  className="foco-anel size-4 accent-mrg-500"
                />
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-grafite">
                  <Repeat className="size-3.5 text-cinza" />
                  Tarefa recorrente
                </span>
              </label>

              {dados.recorrente && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {RECORRENCIAS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDados((d) => ({ ...d, recorrencia: r }))}
                      aria-pressed={dados.recorrencia === r}
                      className={cn(
                        "foco-anel rounded-full px-3 py-1.5 text-xs transition-colors",
                        dados.recorrencia === r
                          ? "bg-mrg-500/15 text-acento-forte ring-1 ring-mrg-500/45 ring-inset"
                          : "border border-borda bg-carta text-cinza hover:text-grafite",
                      )}
                    >
                      {ROTULO_RECORRENCIA[r]}
                    </button>
                  ))}
                </div>
              )}
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
