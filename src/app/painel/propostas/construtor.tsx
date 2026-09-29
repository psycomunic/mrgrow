"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Campo, Entrada, AreaTexto, Selecao } from "@/components/ui/campo";
import { SERVICOS } from "@/lib/servicos-proposta";
import { brl } from "@/lib/utils";
import { PRAZOS_CONTRATO, PRAZO_PADRAO, rotuloPrazo } from "@/lib/rotulos";
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

/* Os passos são quase sempre os mesmos, e quem monta a proposta com
   pressa deixaria a tela vazia. Vêm preenchidos para serem editados. */
const PASSOS_PADRAO = [
  "Você responde no WhatsApp e a MR Grow envia o contrato para assinatura digital.",
  "Kick off na mesma semana: acessos, tom de voz e as metas do primeiro trimestre.",
  "Implantação do rastreamento e auditoria da conta, antes de subir campanha.",
  "Primeiro calendário aprovado e campanhas no ar em até 15 dias do aceite.",
].join("\n");

function vazia(): DadosProposta {
  return {
    titulo: "",
    cliente_nome: "",
    cliente_logo_url: "",
    introducao: "",
    escopo: ESCOPO_PADRAO,
    condicoes:
      "O investimento em mídia é pago diretamente por você às plataformas. O valor acima é o da assessoria.",
    valor_mensal: 0,
    valor_setup: 0,
    meses_contrato: PRAZO_PADRAO,
    validade: null,
    diagnostico: "",
    proximos_passos: PASSOS_PADRAO,
    condicoes_extras: "",
    /* Os cinco de sempre já vêm marcados: é o pacote que a agência vende
       na maioria das contas, e começar com a lista vazia fazia a proposta
       nascer sem nenhuma tela de serviço. */
    servicos: ["estrategia", "social", "meta", "google", "relatorio"].map(
      (id) => ({
        id,
        fee: 0,
      }),
    ),
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
    meses_contrato: p.meses_contrato,
    validade: p.validade,
    diagnostico: p.narrativa.diagnostico.join("\n"),
    proximos_passos: p.narrativa.proximosPassos.join("\n"),
    condicoes_extras: p.narrativa.condicoesExtras.join("\n"),
    servicos: p.narrativa.servicos,
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
  const [d, setD] = useState<DadosProposta>(() =>
    proposta ? daProposta(proposta) : vazia(),
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

  const focar = useCallback((el: HTMLInputElement | null) => el?.focus(), []);

  const itens = d.escopo.split("\n").filter((l) => l.trim()).length;
  const contrato = d.valor_mensal * d.meses_contrato + d.valor_setup;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = proposta
      ? await atualizarProposta(proposta.id, d)
      : await criarProposta(d);
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
              Ao salvar, o link público é gerado e o cliente vê a proposta em
              slides.
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
                    onChange={(e) =>
                      setD((x) => ({ ...x, cliente_nome: e.target.value }))
                    }
                    placeholder="Ex.: Móveis Duarte"
                  />
                </Campo>
                <Campo
                  rotulo="Logo do cliente"
                  dica="URL de imagem; aparece na capa"
                >
                  <Entrada
                    value={d.cliente_logo_url}
                    onChange={(e) =>
                      setD((x) => ({ ...x, cliente_logo_url: e.target.value }))
                    }
                    placeholder="https://…/logo.png"
                  />
                </Campo>
              </div>

              {d.cliente_logo_url &&
                /^https?:\/\//i.test(d.cliente_logo_url) && (
                  <div className="mt-3 flex items-center gap-3 rounded-md border border-borda bg-white p-3">
                    {/* Origem arbitrária: sem o otimizador do Next. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.cliente_logo_url}
                      alt="Prévia do logo"
                      className="max-h-10 w-auto object-contain"
                    />
                    <span className="text-xs text-cinza-claro">
                      Prévia da capa
                    </span>
                  </div>
                )}
            </Bloco>

            <Bloco rotulo="Documento">
              <Campo rotulo="Título da proposta">
                <Entrada
                  value={d.titulo}
                  onChange={(e) =>
                    setD((x) => ({ ...x, titulo: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setD((x) => ({ ...x, introducao: e.target.value }))
                  }
                  placeholder="Hoje a conta investe sem enxergar o retorno…"
                />
              </Campo>
              <Campo
                rotulo="Diagnóstico"
                dica="Um achado por linha. Abre a argumentação antes de qualquer preço."
                className="mt-4"
              >
                <AreaTexto
                  rows={5}
                  value={d.diagnostico}
                  onChange={(e) =>
                    setD((x) => ({ ...x, diagnostico: e.target.value }))
                  }
                  placeholder={
                    "A conta investe sem rastreamento de conversão instalado.\nNão existe calendário: o post do dia é escolhido na véspera."
                  }
                />
              </Campo>
              <Campo
                rotulo="Escopo livre"
                dica={`Um item por linha · ${itens} ${itens === 1 ? "item" : "itens"} · usado quando nenhum serviço do catálogo é marcado`}
                className="mt-4"
              >
                <AreaTexto
                  rows={5}
                  value={d.escopo}
                  onChange={(e) =>
                    setD((x) => ({ ...x, escopo: e.target.value }))
                  }
                />
              </Campo>
            </Bloco>

            {/* Cada serviço marcado vira uma tela do deck, com o que entra
                e o que não entra escritos no catálogo. É o que impede a
                proposta de sair com seis linhas num mês e uma frase no
                seguinte. */}
            <Bloco rotulo="Serviços">
              <p className="text-xs text-cinza">
                Cada um vira uma tela da proposta. O valor por serviço é
                opcional — em branco, o cliente vê só o total do investimento.
              </p>
              <ul className="mt-3 grid gap-2">
                {SERVICOS.map((f) => {
                  const marcado = d.servicos.find((x) => x.id === f.id);
                  return (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center gap-3 rounded-sm border border-borda bg-nevoa px-3 py-2"
                    >
                      <label className="flex min-w-0 flex-1 items-center gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(marcado)}
                          onChange={(e) =>
                            setD((x) => ({
                              ...x,
                              servicos: e.target.checked
                                ? [...x.servicos, { id: f.id, fee: 0 }]
                                : x.servicos.filter((y) => y.id !== f.id),
                            }))
                          }
                          className="size-4 shrink-0 accent-mrg-500"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-tinta">
                            {f.nome}
                          </span>
                          <span className="block text-[11px] text-cinza">
                            {f.cobranca === "mensal" ? "Mensal" : "Projeto"} ·{" "}
                            {f.paraQuem}
                          </span>
                        </span>
                      </label>
                      {marcado ? (
                        <Entrada
                          inputMode="decimal"
                          aria-label={`Valor de ${f.nome}`}
                          placeholder="R$"
                          value={marcado.fee || ""}
                          onChange={(e) =>
                            setD((x) => ({
                              ...x,
                              servicos: x.servicos.map((y) =>
                                y.id === f.id
                                  ? { ...y, fee: Number(e.target.value) || 0 }
                                  : y,
                              ),
                            }))
                          }
                          className="w-28 shrink-0"
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
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
                        valor_mensal:
                          Number(e.target.value.replace(",", ".")) || 0,
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
                        valor_setup:
                          Number(e.target.value.replace(",", ".")) || 0,
                      }))
                    }
                  />
                </Campo>
                <Campo rotulo="Prazo do contrato">
                  <Selecao
                    value={String(d.meses_contrato)}
                    onChange={(e) =>
                      setD((x) => ({
                        ...x,
                        meses_contrato: Number(e.target.value),
                      }))
                    }
                  >
                    {PRAZOS_CONTRATO.map((m) => (
                      <option key={m} value={m}>
                        {rotuloPrazo(m)}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              </div>

              <Campo rotulo="Válida até" className="mt-4">
                <Entrada
                  type="date"
                  value={d.validade ?? ""}
                  onChange={(e) =>
                    setD((x) => ({ ...x, validade: e.target.value || null }))
                  }
                />
              </Campo>

              <div className="mt-3 flex items-baseline justify-between rounded-md border border-borda bg-nevoa px-4 py-3">
                <span className="text-xs text-cinza">
                  Contrato em {rotuloPrazo(d.meses_contrato)}
                </span>
                <span className="font-display text-lg font-extrabold text-tinta">
                  {brl(contrato)}
                </span>
              </div>

              <Campo
                rotulo="Condições negociadas"
                dica="Uma por linha. Aparecem em destaque, antes das de sempre."
                className="mt-4"
              >
                <AreaTexto
                  rows={3}
                  value={d.condicoes_extras}
                  onChange={(e) =>
                    setD((x) => ({ ...x, condicoes_extras: e.target.value }))
                  }
                  placeholder="Primeiro mês com 50% de desconto na implantação."
                />
              </Campo>
              <Campo
                rotulo="Próximos passos"
                dica="Um por linha. É a última tela antes do aceite."
                className="mt-4"
              >
                <AreaTexto
                  rows={5}
                  value={d.proximos_passos}
                  onChange={(e) =>
                    setD((x) => ({ ...x, proximos_passos: e.target.value }))
                  }
                />
              </Campo>
              <Campo rotulo="Condições" className="mt-4">
                <AreaTexto
                  value={d.condicoes}
                  onChange={(e) =>
                    setD((x) => ({ ...x, condicoes: e.target.value }))
                  }
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
              {enviando
                ? "Salvando…"
                : proposta
                  ? "Salvar"
                  : "Criar e gerar link"}
            </Botao>
          </div>
        </form>
      </div>
    </Sobreposicao>
  );
}

function Bloco({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
        {rotulo}
      </h3>
      {children}
    </section>
  );
}
