"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { STATUS_PROJETO } from "@/lib/rotulos";
import { useProjetos } from "./contexto";
import type { DadosProjeto } from "./acoes";
import type { Projeto } from "@/lib/projetos";

const VAZIO: DadosProjeto = {
  nome: "",
  descricao: "",
  status: "ativo",
  progresso: 0,
  prazo: null,
  cliente_id: null,
};

function doProjeto(p: Projeto): DadosProjeto {
  return {
    nome: p.nome,
    descricao: p.descricao ?? "",
    status: p.status,
    progresso: p.progresso,
    prazo: p.prazo,
    cliente_id: p.cliente_id,
  };
}

export function DialogoProjeto({
  aoFechar,
  projeto,
}: {
  aoFechar: () => void;
  projeto?: Projeto;
}) {
  const { clientes, criar, editar } = useProjetos();
  const idBase = useId();

  const [dados, setDados] = useState<DadosProjeto>(() => (projeto ? doProjeto(projeto) : VAZIO));
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
  const concluido = dados.status === "concluido";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!dados.nome.trim()) return setErro("Dê um nome ao projeto.");

    setEnviando(true);
    const ok = projeto ? await editar(projeto.id, dados) : await criar(dados);
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
              {projeto ? "Editar projeto" : "Novo projeto"}
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              Entregas com começo, meio e fim — o que é rotina vira tarefa.
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
            <Campo rotulo="Nome do projeto">
              <Entrada
                ref={focarPrimeiro}
                value={dados.nome}
                onChange={(e) => {
                  setDados((d) => ({ ...d, nome: e.target.value }));
                  setErro(null);
                }}
                placeholder="Ex.: Rastreamento server-side (CAPI + GTM)"
              />
            </Campo>

            <Campo rotulo="Escopo" dica="Opcional — o que entra e o que não entra">
              <AreaTexto
                value={dados.descricao}
                onChange={(e) => setDados((d) => ({ ...d, descricao: e.target.value }))}
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

              <Campo rotulo="Prazo de entrega">
                <Entrada
                  type="date"
                  value={dados.prazo ?? ""}
                  onChange={(e) => setDados((d) => ({ ...d, prazo: e.target.value || null }))}
                />
              </Campo>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Situação">
                <Selecao
                  value={dados.status}
                  onChange={(e) => setDados((d) => ({ ...d, status: e.target.value }))}
                >
                  {STATUS_PROJETO.lista.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.rotulo}
                    </option>
                  ))}
                </Selecao>
              </Campo>

              <Campo
                rotulo="Progresso"
                dica={concluido ? "Concluído fecha em 100%." : `${dados.progresso}% entregue`}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={concluido}
                  value={concluido ? 100 : dados.progresso}
                  onChange={(e) => setDados((d) => ({ ...d, progresso: Number(e.target.value) }))}
                  className="h-9 w-full accent-mrg-500 disabled:opacity-50 foco-anel"
                  aria-label="Progresso do projeto"
                />
              </Campo>
            </div>

            {erro && <p className="text-xs text-perigo">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : projeto ? "Salvar alterações" : "Criar projeto"}
            </Botao>
          </div>
        </form>
      </div>
    </Sobreposicao>
  );
}
