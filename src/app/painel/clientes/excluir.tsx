"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Entrada } from "@/components/ui/campo";
import { numero } from "@/lib/utils";
import { contarVinculos, excluirCliente, type Vinculos } from "./acoes";
import type { ClienteCarteira } from "@/lib/clientes";

const ROTULOS: { chave: keyof Vinculos; um: string; varios: string }[] = [
  { chave: "metricas", um: "dia de métrica", varios: "dias de métrica" },
  { chave: "tarefas", um: "tarefa", varios: "tarefas" },
  { chave: "projetos", um: "projeto", varios: "projetos" },
  { chave: "contratos", um: "contrato", varios: "contratos" },
  { chave: "faturas", um: "fatura", varios: "faturas" },
  { chave: "arquivos", um: "arquivo", varios: "arquivos" },
];

/**
 * Confirmação de exclusão de cliente.
 *
 * Não é um `confirm()` do navegador porque a pergunta genérica não ajuda
 * a decidir: o que pesa aqui é quanto histórico vai junto. O diálogo
 * conta antes de perguntar, e pede o nome digitado — numa carteira com
 * vinte linhas parecidas, o clique errado apaga a conta vizinha, e não
 * há desfazer.
 *
 * "Encerrar" aparece ao lado porque quase sempre é o que a pessoa quer:
 * o cliente saiu, mas o histórico dele ainda responde perguntas.
 */
export function DialogoExcluirCliente({
  cliente,
  aoFechar,
  aoEncerrar,
}: {
  cliente: ClienteCarteira;
  aoFechar: () => void;
  aoEncerrar: () => void;
}) {
  const router = useRouter();
  const idBase = useId();
  const [vinculos, setVinculos] = useState<Vinculos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    contarVinculos(cliente.id).then((v) => {
      if (!vivo) return;
      setVinculos(v);
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, [cliente.id]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const confere = texto.trim().toLowerCase() === cliente.nome.trim().toLowerCase();

  const perdas = vinculos
    ? ROTULOS.filter((r) => vinculos[r.chave] > 0).map(
        (r) => `${numero(vinculos[r.chave])} ${vinculos[r.chave] === 1 ? r.um : r.varios}`,
      )
    : [];

  async function confirmar() {
    setEnviando(true);
    const r = await excluirCliente(cliente.id, texto);
    setEnviando(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível excluir.");

    toast.success(r.demo ? "Excluído na tela (demonstração)." : `${cliente.nome} foi excluído.`);
    aoFechar();
    router.push("/painel/clientes");
    router.refresh();
  }

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
        aria-labelledby={`${idBase}-titulo`}
        className="cartao my-auto w-full max-w-lg overflow-hidden rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-borda px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-perigo/15 text-perigo">
              <TriangleAlert className="size-4" />
            </span>
            <div>
              <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-tinta">
                Excluir {cliente.nome}?
              </h2>
              <p className="mt-0.5 text-xs text-cinza">Isto não pode ser desfeito.</p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="foco-anel rounded-sm p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-tinta"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {carregando ? (
            <p className="flex items-center gap-2 text-sm text-cinza">
              <Loader2 className="size-4 animate-spin" />
              Vendo o que está ligado a esta conta…
            </p>
          ) : perdas.length ? (
            <div className="rounded-md border border-perigo/30 bg-perigo/8 p-4">
              <p className="text-sm font-semibold text-tinta">Some junto com o cliente:</p>
              <ul className="mt-2 space-y-1 text-[13px] text-grafite">
                {perdas.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-md border border-borda bg-nevoa p-4 text-sm text-grafite">
              Esta conta ainda não tem histórico ligado a ela.
            </p>
          )}

          {!!vinculos?.lancamentos && (
            <p className="text-xs text-cinza">
              {/* O dinheiro que entrou continua valendo no caixa mesmo sem a
                  conta, então o lançamento sobrevive — só perde o vínculo. */}
              {numero(vinculos.lancamentos)}{" "}
              {vinculos.lancamentos === 1 ? "lançamento financeiro continua" : "lançamentos financeiros continuam"}{" "}
              no caixa, sem o vínculo com o cliente.
            </p>
          )}

          <div className="rounded-md border border-borda bg-nevoa p-4">
            <p className="text-[13px] text-grafite">
              Se o cliente apenas saiu, <strong className="text-tinta">encerrar</strong> guarda todo
              o histórico e tira a conta da operação.
            </p>
            <Botao
              variante="contorno"
              tamanho="sm"
              className="mt-3"
              onClick={() => {
                aoFechar();
                aoEncerrar();
              }}
            >
              Encerrar em vez de excluir
            </Botao>
          </div>

          <div>
            <label
              htmlFor={`${idBase}-nome`}
              className="mb-1.5 block text-xs font-medium text-grafite"
            >
              Para confirmar, digite <strong className="text-tinta">{cliente.nome}</strong>
            </label>
            <Entrada
              id={`${idBase}-nome`}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setErro(null);
              }}
              placeholder={cliente.nome}
              autoComplete="off"
            />
          </div>

          {erro && <p className="text-xs text-perigo">{erro}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
          <Botao variante="contorno" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao variante="perigo" onClick={confirmar} disabled={!confere || enviando}>
            {enviando ? "Excluindo…" : "Excluir para sempre"}
          </Botao>
        </div>
      </div>
    </Sobreposicao>
  );
}
