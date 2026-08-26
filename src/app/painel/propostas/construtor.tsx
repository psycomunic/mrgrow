"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Campo, Entrada, AreaTexto } from "@/components/ui/campo";
import { brl } from "@/lib/utils";
import { criarProposta, atualizarProposta, type DadosProposta } from "./acoes";
import type { Proposta } from "@/lib/propostas";

const ESCOPO_PADRAO = [
  "Auditoria de conta, oferta e margem",
  "Rastreamento GA4, GTM, Pixel e API de Conversões",
  "Estrutura de campanhas por temperatura de público",
  "Matriz de criativos com teste semanal",
  "Landing page própria com teste A/B",
  "Painel aberto com investimento e retorno em tempo real",
].join("\n");

function vazia(): DadosProposta {
  return {
    titulo: "",
    cliente_nome: "",
    cliente_logo_url: "",
    introducao: "",
    escopo: ESCOPO_PADRAO,
    condicoes:
      "O investimento em mídia é pago diretamente por você às plataformas. O valor acima é o da assessoria. Contrato de 3 meses iniciais.",
    valor_mensal: 0,
    valor_setup: 0,
    validade: null,
  };
}

function daProposta(p: Proposta): DadosProposta {
  return {
    titulo: p.titulo,
    cliente_nome: p.cliente_nome ?? "",
    cliente_logo_url: p.cliente_logo_url ?? "",
    introducao: p.introducao ?? "",
    escopo: p.escopo ?? "",
    condicoes: p.condicoes ?? "",
    valor_mensal: p.valor_mensal,
    valor_setup: p.valor_setup,
    validade: p.validade,
  };
}

/**
 * Construtor da proposta. Ao salvar, devolve o link público — que é o
 * entregável: o cliente abre esse endereço e vê o documento em slides.
 */
export function Construtor({
  aoFechar,
  proposta,
  aoGerarLink,
}: {
  aoFechar: () => void;
  proposta?: Proposta;
  aoGerarLink: (token: string) => void;
}) {
  const [d, setD] = useState<DadosProposta>(() => (proposta ? daProposta(proposta) : vazia()));
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

  const itens = d.escopo.split("\n").filter((l) => l.trim()).length;
  const contrato = d.valor_mensal * 12 + d.valor_setup;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = proposta ? await atualizarProposta(proposta.id, d) : await criarProposta(d);
    setEnviando(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível salvar.");

    toast.success(
      r.demo
        ? "Proposta criada (não salva: modo demonstração)."
        : proposta
          ? "Proposta atualizada."
          : "Proposta criada.",
    );
    if (!proposta && r.token) aoGerarLink(r.token);
    aoFechar();
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
        aria-label={proposta ? "Editar proposta" : "Nova proposta"}
        className="cartao my-auto w-full max-w-3xl overflow-hidden rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-borda px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-tinta">
              {proposta ? "Editar proposta" : "Nova proposta"}
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              Ao salvar, o link público é gerado e o cliente vê a proposta em slides.
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
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
            <Bloco rotulo="Destinatário">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Nome do cliente">
                  <Entrada
                    ref={focar}
                    value={d.cliente_nome}
                    onChange={(e) => setD((x) => ({ ...x, cliente_nome: e.target.value }))}
                    placeholder="Ex.: Móveis Duarte"
                  />
                </Campo>
                <Campo rotulo="Logo do cliente" dica="URL de imagem; aparece na capa">
                  <Entrada
                    value={d.cliente_logo_url}
                    onChange={(e) => setD((x) => ({ ...x, cliente_logo_url: e.target.value }))}
                    placeholder="https://…/logo.png"
                  />
                </Campo>
              </div>

              {d.cliente_logo_url && /^https?:\/\//i.test(d.cliente_logo_url) && (
                <div className="mt-3 flex items-center gap-3 rounded-md border border-borda bg-white p-3">
                  {/* Origem arbitrária: sem o otimizador do Next. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.cliente_logo_url}
                    alt="Prévia do logo"
                    className="max-h-10 w-auto object-contain"
                  />
                  <span className="text-xs text-cinza-claro">Prévia da capa</span>
                </div>
              )}
            </Bloco>

            <Bloco rotulo="Documento">
              <Campo rotulo="Título da proposta">
                <Entrada
                  value={d.titulo}
                  onChange={(e) => setD((x) => ({ ...x, titulo: e.target.value }))}
                  placeholder="Ex.: Operação completa de performance"
                />
              </Campo>
              <Campo
                rotulo="O cenário"
                dica="Abre o documento dizendo o que está travando o resultado"
                className="mt-4"
              >
                <AreaTexto
                  value={d.introducao}
                  onChange={(e) => setD((x) => ({ ...x, introducao: e.target.value }))}
                  placeholder="Hoje a conta investe sem enxergar o retorno…"
                />
              </Campo>
              <Campo
                rotulo="Escopo"
                dica={`Um item por linha · ${itens} ${itens === 1 ? "item" : "itens"}`}
                className="mt-4"
              >
                <AreaTexto
                  rows={7}
                  value={d.escopo}
                  onChange={(e) => setD((x) => ({ ...x, escopo: e.target.value }))}
                />
              </Campo>
            </Bloco>

            <Bloco rotulo="Investimento">
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo rotulo="Mensal (R$)">
                  <Entrada
                    inputMode="decimal"
                    value={String(d.valor_mensal)}
                    onChange={(e) =>
                      setD((x) => ({
                        ...x,
                        valor_mensal: Number(e.target.value.replace(",", ".")) || 0,
                      }))
                    }
                  />
                </Campo>
                <Campo rotulo="Setup (R$)">
                  <Entrada
                    inputMode="decimal"
                    value={String(d.valor_setup)}
                    onChange={(e) =>
                      setD((x) => ({
                        ...x,
                        valor_setup: Number(e.target.value.replace(",", ".")) || 0,
                      }))
                    }
                  />
                </Campo>
                <Campo rotulo="Válida até">
                  <Entrada
                    type="date"
                    value={d.validade ?? ""}
                    onChange={(e) => setD((x) => ({ ...x, validade: e.target.value || null }))}
                  />
                </Campo>
              </div>

              <div className="mt-3 flex items-baseline justify-between rounded-md border border-borda bg-nevoa px-4 py-3">
                <span className="text-xs text-cinza">Contrato em 12 meses</span>
                <span className="font-display text-lg font-extrabold text-tinta">
                  {brl(contrato)}
                </span>
              </div>

              <Campo rotulo="Condições" className="mt-4">
                <AreaTexto
                  value={d.condicoes}
                  onChange={(e) => setD((x) => ({ ...x, condicoes: e.target.value }))}
                />
              </Campo>
            </Bloco>

            {erro && <p className="text-xs text-perigo">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : proposta ? "Salvar" : "Criar e gerar link"}
            </Botao>
          </div>
        </form>
      </div>
    </Sobreposicao>
  );
}

function Bloco({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-bold tracking-wider text-cinza-claro uppercase">{rotulo}</h3>
      {children}
    </section>
  );
}
