"use client";

import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Vazio } from "@/components/painel/tabela";
import { acaoDoCatalogo, rotuloDaAcao, rotuloDoGatilho } from "@/lib/automacoes-catalogo";
import { dataCompleta, numero } from "@/lib/utils";
import { useAutomacoes } from "./contexto";
import type { Automacao } from "@/lib/automacoes-dados";

export function Lista() {
  const { automacoes, abrirNova } = useAutomacoes();

  if (automacoes.length === 0) {
    return (
      <Vazio
        mensagem="Nenhuma regra criada ainda. A que costuma render mais rápido: fatura vencendo em 3 dias dispara a cobrança e abre a tarefa no financeiro."
        acao={
          <Botao tamanho="sm" onClick={abrirNova}>
            <Plus className="size-4" />
            Criar a primeira automação
          </Botao>
        }
      />
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {automacoes.map((a) => (
        <Cartao key={a.id} automacao={a} />
      ))}
    </section>
  );
}

function Cartao({ automacao: a }: { automacao: Automacao }) {
  const { abrirEdicao, alternar, excluir, salvando } = useAutomacoes();
  // O seed traz ações que o motor ainda não executa; dizer isso é melhor que
  // deixar a regra parecendo completa.
  const semSuporte = a.acoes.filter((x) => !acaoDoCatalogo(x.tipo)?.disponivel).length;

  return (
    <article className="cartao flex flex-col rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={[
              "grid size-9 shrink-0 place-items-center rounded-md ring-1 ring-inset transition-colors",
              a.ativa
                ? "bg-mrg-500/12 text-mrg-600 ring-mrg-500/25"
                : "bg-nevoa text-cinza-claro ring-borda",
            ].join(" ")}
          >
            <Zap className="size-4" />
          </span>
          <div>
            <h3 className="font-semibold text-tinta">{a.nome}</h3>
            <p className="mt-0.5 text-xs text-cinza">Quando: {rotuloDoGatilho(a.gatilho)}</p>
          </div>
        </div>

        <Interruptor
          ativa={a.ativa}
          nome={a.nome}
          ocupado={salvando}
          aoAlternar={() => alternar(a)}
        />
      </div>

      {a.acoes.length > 0 ? (
        <>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {a.acoes.map((acao, i) => {
              const suportada = acaoDoCatalogo(acao.tipo)?.disponivel ?? false;
              return (
                <li
                  key={`${acao.tipo}-${i}`}
                  title={suportada ? undefined : "O motor ainda não executa esta ação"}
                  className={[
                    "rounded px-2 py-0.5 text-[11px] ring-1 ring-inset",
                    suportada
                      ? "bg-nevoa text-grafite ring-borda"
                      : "bg-alerta/10 text-alerta ring-alerta/30",
                  ].join(" ")}
                >
                  {rotuloDaAcao(acao.tipo)}
                </li>
              );
            })}
          </ul>
          {semSuporte > 0 && (
            <p className="mt-2 text-xs text-alerta">
              {semSuporte === 1 ? "1 ação em destaque não roda" : `${semSuporte} ações em destaque não rodam`}
              : o motor ainda não as executa. Abra em Editar para trocar.
            </p>
          )}
        </>
      ) : (
        <p className="mt-4 text-xs text-alerta">
          Sem nenhuma ação configurada — ela dispara e não faz nada. Abra em Editar.
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-borda pt-4 text-xs text-cinza">
        <span>
          {numero(a.execucoes)} {a.execucoes === 1 ? "execução" : "execuções"}
          {a.ultimaExecucao && ` · última em ${dataCompleta(a.ultimaExecucao)}`}
        </span>
        <div className="flex items-center gap-1">
          <Botao variante="fantasma" tamanho="sm" onClick={() => abrirEdicao(a)}>
            <Pencil className="size-3.5" />
            Editar
          </Botao>
          <button
            type="button"
            onClick={() => excluir(a)}
            aria-label={`Excluir ${a.nome}`}
            title="Excluir"
            className="rounded-full p-2 text-cinza-claro transition-colors hover:bg-chip-rosa hover:text-perigo foco-anel"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

/** Liga e desliga a regra na hora; o estado volta atrás se o servidor recusar. */
function Interruptor({
  ativa,
  nome,
  ocupado,
  aoAlternar,
}: {
  ativa: boolean;
  nome: string;
  ocupado: boolean;
  aoAlternar: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className={`text-xs font-medium ${ativa ? "text-sucesso" : "text-cinza"}`}>
        {ativa ? "Ativa" : "Pausada"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={ativa}
        aria-label={ativa ? `Pausar ${nome}` : `Ativar ${nome}`}
        onClick={aoAlternar}
        disabled={ocupado}
        className={[
          "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60 foco-anel",
          ativa ? "bg-sucesso" : "bg-nevoa-2",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            ativa ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

/** Botão do topo da página; mora aqui para compartilhar o construtor. */
export function AcaoNovaAutomacao() {
  const { abrirNova } = useAutomacoes();

  return (
    <Botao tamanho="sm" onClick={abrirNova}>
      <Plus className="size-4" />
      Nova automação
    </Botao>
  );
}
