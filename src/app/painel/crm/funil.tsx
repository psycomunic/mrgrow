"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Settings2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Campo, Entrada, Selecao } from "@/components/ui/campo";
import {
  atualizarEtapa,
  criarEtapa,
  contarPorEtapa,
  excluirEtapa,
  reordenarEtapas,
  type DadosEtapa,
} from "./acoes";
import type { EtapaFunil } from "@/types/dominio";

const TIPOS = [
  { v: "aberta", r: "Em negociação" },
  { v: "ganho", r: "Fechou" },
  { v: "perdido", r: "Perdeu" },
];

const COR_PADRAO = "#1668f5";

/* A probabilidade da etapa multiplica o valor dos negócios parados nela
   para formar o previsto ponderado da visão geral. Por isso ela é um
   campo e não um enfeite: quem vende sabe que "proposta enviada" fecha
   mais que "primeiro contato", e é esse número que faz a projeção
   parecer com a realidade. */

function vazia(): DadosEtapa {
  return { nome: "", probabilidade: 10, cor: COR_PADRAO, tipo: "aberta" };
}

function daEtapa(e: EtapaFunil): DadosEtapa {
  return {
    nome: e.nome,
    probabilidade: e.probabilidade,
    cor: e.cor ?? COR_PADRAO,
    tipo: e.tipo,
  };
}

export function BotaoEditarFunil({
  etapas,
  funilId,
}: {
  etapas: EtapaFunil[];
  funilId: string | null;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Botao variante="contorno" tamanho="sm" onClick={() => setAberto(true)}>
        <Settings2 className="size-4" />
        Editar funil
      </Botao>
      {aberto && (
        <DialogoFunil etapas={etapas} funilId={funilId} aoFechar={() => setAberto(false)} />
      )}
    </>
  );
}

function DialogoFunil({
  etapas,
  funilId,
  aoFechar,
}: {
  etapas: EtapaFunil[];
  funilId: string | null;
  aoFechar: () => void;
}) {
  const router = useRouter();
  const idBase = useId();

  /* A ordem vive aqui enquanto o diálogo está aberto: subir uma coluna
     precisa aparecer na hora, e esperar o servidor a cada clique faria a
     lista pular. O servidor recebe a lista inteira quando a pessoa sai. */
  const [lista, setLista] = useState(() => [...etapas].sort((a, b) => a.ordem - b.ordem));
  const [contagem, setContagem] = useState<Record<string, number>>({});
  const [novo, setNovo] = useState<DadosEtapa | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<DadosEtapa>(vazia);
  const [apagando, setApagando] = useState<string | null>(null);
  const [destino, setDestino] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    contarPorEtapa().then(setContagem);
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  function recarregar() {
    router.refresh();
    contarPorEtapa().then(setContagem);
  }

  async function mover(i: number, passo: -1 | 1) {
    const j = i + passo;
    if (j < 0 || j >= lista.length) return;

    const nova = [...lista];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setLista(nova);

    setOcupado(true);
    const r = await reordenarEtapas(nova.map((e) => e.id));
    setOcupado(false);

    if (!r.ok) {
      setLista(lista); // volta ao que estava: o servidor recusou
      return setErro(r.erro ?? "Não foi possível reordenar.");
    }
    router.refresh();
  }

  async function salvarEdicao(id: string) {
    setErro(null);
    setOcupado(true);
    const r = await atualizarEtapa(id, rascunho);
    setOcupado(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível salvar.");

    setLista((l) =>
      l.map((e) =>
        e.id === id
          ? {
              ...e,
              nome: rascunho.nome.trim(),
              probabilidade: rascunho.probabilidade,
              cor: rascunho.cor,
              tipo: rascunho.tipo,
            }
          : e,
      ),
    );
    setEditando(null);
    toast.success(r.demo ? "Alterado na tela (demonstração)." : "Etapa salva.");
    recarregar();
  }

  async function criar() {
    if (!novo) return;
    setErro(null);

    if (!funilId) return setErro("Nenhum funil ativo para receber a etapa.");

    setOcupado(true);
    const r = await criarEtapa(funilId, novo);
    setOcupado(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível criar a etapa.");

    setNovo(null);
    toast.success(r.demo ? "Criada na tela (demonstração)." : "Etapa criada.");
    recarregar();
  }

  async function apagar(id: string) {
    setErro(null);
    setOcupado(true);
    const r = await excluirEtapa(id, destino || null);
    setOcupado(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível excluir.");

    setLista((l) => l.filter((e) => e.id !== id));
    setApagando(null);
    setDestino("");
    toast.success(r.demo ? "Excluída na tela (demonstração)." : "Etapa excluída.");
    recarregar();
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
        className="cartao my-auto w-full max-w-2xl overflow-hidden rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-borda px-6 py-4">
          <div>
            <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-tinta">
              Etapas do funil
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              A ordem aqui é a ordem das colunas no quadro.
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

        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-5">
          {lista.map((etapa, i) => {
            const quantos = contagem[etapa.id] ?? 0;

            if (editando === etapa.id) {
              return (
                <div key={etapa.id} className="rounded-md border border-acento/40 bg-nevoa p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo rotulo="Nome">
                      <Entrada
                        value={rascunho.nome}
                        onChange={(e) => setRascunho((d) => ({ ...d, nome: e.target.value }))}
                        autoFocus
                      />
                    </Campo>
                    <Campo rotulo="Chance de fechar (%)" dica="Pondera a projeção">
                      <Entrada
                        type="number"
                        min={0}
                        max={100}
                        value={String(rascunho.probabilidade)}
                        onChange={(e) =>
                          setRascunho((d) => ({
                            ...d,
                            probabilidade: Math.trunc(Number(e.target.value) || 0),
                          }))
                        }
                      />
                    </Campo>
                    <Campo rotulo="Tipo">
                      <Selecao
                        value={rascunho.tipo}
                        onChange={(e) => setRascunho((d) => ({ ...d, tipo: e.target.value }))}
                      >
                        {TIPOS.map((t) => (
                          <option key={t.v} value={t.v}>
                            {t.r}
                          </option>
                        ))}
                      </Selecao>
                    </Campo>
                    <Campo rotulo="Cor">
                      <input
                        type="color"
                        value={rascunho.cor}
                        onChange={(e) => setRascunho((d) => ({ ...d, cor: e.target.value }))}
                        className="h-9 w-full cursor-pointer rounded-md border border-borda bg-concha p-1"
                      />
                    </Campo>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Botao tamanho="sm" onClick={() => salvarEdicao(etapa.id)} disabled={ocupado}>
                      Salvar
                    </Botao>
                    <Botao variante="contorno" tamanho="sm" onClick={() => setEditando(null)}>
                      Cancelar
                    </Botao>
                  </div>
                </div>
              );
            }

            if (apagando === etapa.id) {
              const outras = lista.filter((e) => e.id !== etapa.id);
              return (
                <div key={etapa.id} className="rounded-md border border-perigo/40 bg-perigo/8 p-4">
                  <p className="text-sm font-semibold text-tinta">Excluir &ldquo;{etapa.nome}&rdquo;?</p>
                  {quantos > 0 ? (
                    <>
                      <p className="mt-1 text-xs text-grafite">
                        {quantos} {quantos === 1 ? "negócio está" : "negócios estão"} nesta etapa.
                        Escolha para onde {quantos === 1 ? "ele vai" : "eles vão"}.
                      </p>
                      <Campo rotulo="Mover para" className="mt-3">
                        <Selecao value={destino} onChange={(e) => setDestino(e.target.value)}>
                          <option value="">Selecione…</option>
                          {outras.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.nome}
                            </option>
                          ))}
                        </Selecao>
                      </Campo>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-grafite">Não há negócios nesta etapa.</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Botao
                      variante="perigo"
                      tamanho="sm"
                      onClick={() => apagar(etapa.id)}
                      disabled={ocupado || (quantos > 0 && !destino)}
                    >
                      Excluir
                    </Botao>
                    <Botao
                      variante="contorno"
                      tamanho="sm"
                      onClick={() => {
                        setApagando(null);
                        setDestino("");
                        setErro(null);
                      }}
                    >
                      Cancelar
                    </Botao>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={etapa.id}
                className="flex items-center gap-3 rounded-md border border-borda bg-nevoa px-3 py-2.5"
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: etapa.cor ?? COR_PADRAO }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-tinta">{etapa.nome}</p>
                  <p className="text-xs text-cinza">
                    {etapa.probabilidade}% de chance ·{" "}
                    {TIPOS.find((t) => t.v === etapa.tipo)?.r ?? etapa.tipo}
                    {quantos > 0 && ` · ${quantos} ${quantos === 1 ? "negócio" : "negócios"}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => mover(i, -1)}
                    disabled={i === 0 || ocupado}
                    aria-label={`Subir ${etapa.nome}`}
                    className="foco-anel rounded-sm p-1.5 text-cinza transition-colors hover:bg-concha hover:text-tinta disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    onClick={() => mover(i, 1)}
                    disabled={i === lista.length - 1 || ocupado}
                    aria-label={`Descer ${etapa.nome}`}
                    className="foco-anel rounded-sm p-1.5 text-cinza transition-colors hover:bg-concha hover:text-tinta disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <Botao
                    variante="fantasma"
                    tamanho="sm"
                    onClick={() => {
                      setRascunho(daEtapa(etapa));
                      setEditando(etapa.id);
                      setApagando(null);
                      setErro(null);
                    }}
                  >
                    Editar
                  </Botao>
                  <button
                    onClick={() => {
                      setApagando(etapa.id);
                      setEditando(null);
                      setDestino("");
                      setErro(null);
                    }}
                    aria-label={`Excluir ${etapa.nome}`}
                    className="foco-anel rounded-sm p-1.5 text-cinza transition-colors hover:bg-perigo/10 hover:text-perigo"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {novo ? (
            <div className="rounded-md border border-acento/40 bg-nevoa p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Nome da etapa">
                  <Entrada
                    value={novo.nome}
                    onChange={(e) => setNovo((d) => d && { ...d, nome: e.target.value })}
                    placeholder="Ex.: Reunião marcada"
                    autoFocus
                  />
                </Campo>
                <Campo rotulo="Chance de fechar (%)" dica="Pondera a projeção">
                  <Entrada
                    type="number"
                    min={0}
                    max={100}
                    value={String(novo.probabilidade)}
                    onChange={(e) =>
                      setNovo(
                        (d) =>
                          d && { ...d, probabilidade: Math.trunc(Number(e.target.value) || 0) },
                      )
                    }
                  />
                </Campo>
                <Campo rotulo="Tipo">
                  <Selecao
                    value={novo.tipo}
                    onChange={(e) => setNovo((d) => d && { ...d, tipo: e.target.value })}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.v} value={t.v}>
                        {t.r}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
                <Campo rotulo="Cor">
                  <input
                    type="color"
                    value={novo.cor}
                    onChange={(e) => setNovo((d) => d && { ...d, cor: e.target.value })}
                    className="h-9 w-full cursor-pointer rounded-md border border-borda bg-concha p-1"
                  />
                </Campo>
              </div>
              <div className="mt-3 flex gap-2">
                <Botao tamanho="sm" onClick={criar} disabled={ocupado}>
                  Adicionar
                </Botao>
                <Botao variante="contorno" tamanho="sm" onClick={() => setNovo(null)}>
                  Cancelar
                </Botao>
              </div>
            </div>
          ) : (
            <Botao
              variante="contorno"
              tamanho="sm"
              className="w-full"
              onClick={() => {
                setNovo(vazia());
                setEditando(null);
                setApagando(null);
                setErro(null);
              }}
            >
              <Plus className="size-4" />
              Nova etapa
            </Botao>
          )}

          {erro && <p className="text-xs text-perigo">{erro}</p>}
        </div>

        <div className="flex justify-end border-t border-borda px-6 py-4">
          <Botao onClick={aoFechar}>Concluído</Botao>
        </div>
      </div>
    </Sobreposicao>
  );
}
