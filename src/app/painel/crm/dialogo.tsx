"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada, Selecao } from "@/components/ui/campo";
import { brl } from "@/lib/utils";
import { useCrm } from "./contexto";
import { ORIGENS, TEMPERATURAS } from "./rotulos";
import type { DadosNegocio } from "./acoes";
import type { NegocioQuadro } from "@/lib/crm";

function vazio(etapaId: string): DadosNegocio {
  return {
    titulo: "",
    contato: "",
    valor_mensal: 0,
    valor_unico: 0,
    temperatura: "morno",
    origem: "meta_ads",
    previsao: null,
    etapa_id: etapaId,
  };
}

function deNegocio(n: NegocioQuadro): DadosNegocio {
  return {
    titulo: n.titulo,
    contato: n.contato ?? "",
    valor_mensal: n.valor_mensal,
    valor_unico: n.valor_unico,
    temperatura: n.temperatura,
    origem: n.origem ?? "",
    previsao: n.previsao,
    etapa_id: n.etapa_id,
  };
}

/**
 * Formulário de negócio em diálogo modal. Serve para criar e para editar:
 * quando recebe `negocio`, salva por cima; sem ele, cria na etapa indicada.
 *
 * O componente só é montado enquanto o diálogo está aberto. Abrir com outro
 * alvo remonta e o estado nasce do zero, sem precisar reatribuí-lo num efeito.
 */
export function DialogoNegocio({
  aoFechar,
  negocio,
  etapaPadrao,
}: {
  aoFechar: () => void;
  negocio?: NegocioQuadro;
  etapaPadrao?: string;
}) {
  const { etapas, criar, editar } = useCrm();
  const idBase = useId();

  const [dados, setDados] = useState<DadosNegocio>(() =>
    negocio ? deNegocio(negocio) : vazio(etapaPadrao ?? etapas[0]?.id ?? ""),
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

  // Foco no primeiro campo assim que o nó existe, sem efeito nem setState.
  const focarPrimeiro = useCallback((el: HTMLInputElement | null) => el?.focus(), []);

  const etapa = etapas.find((e) => e.id === dados.etapa_id);
  const contrato = dados.valor_mensal * 12 + dados.valor_unico;

  const texto =
    (campo: "titulo" | "contato" | "etapa_id" | "origem") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDados((d) => ({ ...d, [campo]: e.target.value }));
      setErro(null);
    };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!dados.titulo.trim()) return setErro("Informe o nome do negócio.");

    setEnviando(true);
    const ok = negocio ? await editar(negocio.id, dados) : await criar(dados);
    setEnviando(false);
    if (ok) aoFechar();
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
        aria-labelledby={`${idBase}-titulo`}
        className="cartao-vidro my-auto w-full max-w-2xl overflow-hidden rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-white">
              {negocio ? "Editar negócio" : "Novo negócio"}
            </h2>
            <p className="mt-0.5 text-xs text-ink-400">
              {negocio ? "As mudanças aparecem no quadro na hora." : "Ele entra no funil já na etapa escolhida."}
            </p>
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-sm p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-white foco-anel"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
            <Secao rotulo="Identificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Nome do negócio">
                  <Entrada
                    ref={focarPrimeiro}
                    value={dados.titulo}
                    onChange={texto("titulo")}
                    placeholder="Ex.: Loja Bella Fiore"
                  />
                </Campo>
                <Campo rotulo="Contato" dica="Quem decide do outro lado">
                  <Entrada
                    value={dados.contato}
                    onChange={texto("contato")}
                    placeholder="Nome da pessoa"
                  />
                </Campo>
              </div>
            </Secao>

            <Secao rotulo="Valores">
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoMoeda
                  rotulo="Recorrente mensal"
                  valor={dados.valor_mensal}
                  aoMudar={(v) => setDados((d) => ({ ...d, valor_mensal: v }))}
                />
                <CampoMoeda
                  rotulo="Setup"
                  dica="Cobrado uma vez"
                  valor={dados.valor_unico}
                  aoMudar={(v) => setDados((d) => ({ ...d, valor_unico: v }))}
                />
              </div>

              {/* O número que decide onde vale gastar esforço comercial. */}
              <div className="mt-3 flex items-baseline justify-between rounded-md border border-white/8 bg-white/[0.03] px-4 py-3">
                <span className="text-xs text-ink-400">Contrato em 12 meses</span>
                <span className="font-display text-lg font-extrabold text-white">
                  {brl(contrato)}
                </span>
              </div>
            </Secao>

            <Secao rotulo="Funil">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  rotulo="Etapa"
                  dica={etapa ? `${etapa.probabilidade}% de chance de fechar` : undefined}
                >
                  <div className="relative">
                    {etapa && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-3 z-10 size-2 -translate-y-1/2 rounded-full"
                        style={{ background: etapa.cor ?? "#1668f5" }}
                      />
                    )}
                    <Selecao
                      value={dados.etapa_id}
                      onChange={texto("etapa_id")}
                      className={etapa ? "pl-7" : undefined}
                    >
                      {etapas.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                    </Selecao>
                  </div>
                </Campo>

                <Campo rotulo="Origem">
                  <Selecao value={dados.origem} onChange={texto("origem")}>
                    {ORIGENS.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.r}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-ink-200">Temperatura</span>
                  <div className="flex gap-1.5">
                    {TEMPERATURAS.map(({ v, r, Icone }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDados((d) => ({ ...d, temperatura: v }))}
                        aria-pressed={dados.temperatura === v}
                        className={[
                          "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2.5 text-xs transition-colors foco-anel",
                          dados.temperatura === v
                            ? "bg-mrg-500/15 text-mrg-200 ring-1 ring-inset ring-mrg-500/45"
                            : "border border-white/10 bg-white/[0.03] text-ink-400 hover:text-ink-200",
                        ].join(" ")}
                      >
                        <Icone className="size-3.5" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <Campo rotulo="Previsão de fechamento">
                  <Entrada
                    type="date"
                    value={dados.previsao ?? ""}
                    onChange={(e) =>
                      setDados((d) => ({ ...d, previsao: e.target.value || null }))
                    }
                  />
                </Campo>
              </div>
            </Secao>

            {erro && <p className="text-xs text-perigo">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-white/8 px-6 py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : negocio ? "Salvar alterações" : "Criar negócio"}
            </Botao>
          </div>
        </form>
      </div>
    </div>
  );
}

function Secao({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-bold tracking-wider text-ink-500 uppercase">{rotulo}</h3>
      {children}
    </section>
  );
}

/**
 * Campo de dinheiro. Guarda número, mostra texto: enquanto o cursor está
 * dentro deixa digitar cru, e ao sair formata em pt-BR. Formatar durante a
 * digitação atrapalha porque o separador se move sob o cursor.
 */
function CampoMoeda({
  rotulo,
  dica,
  valor,
  aoMudar,
}: {
  rotulo: string;
  dica?: string;
  valor: number;
  aoMudar: (v: number) => void;
}) {
  const [bruto, setBruto] = useState<string | null>(null);

  const formatado = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);

  return (
    <Campo rotulo={rotulo} dica={dica}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-400">
          R$
        </span>
        <Entrada
          inputMode="decimal"
          className="pl-10 text-right"
          value={bruto ?? formatado}
          onFocus={() => setBruto(valor ? String(valor) : "")}
          onBlur={() => setBruto(null)}
          onChange={(e) => {
            const t = e.target.value;
            setBruto(t);
            aoMudar(Number(t.replace(/\./g, "").replace(",", ".")) || 0);
          }}
        />
      </div>
    </Campo>
  );
}
