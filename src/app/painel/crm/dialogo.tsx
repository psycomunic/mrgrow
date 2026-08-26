"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada, Selecao } from "@/components/ui/campo";
import { useCrm } from "./contexto";
import type { DadosNegocio } from "./acoes";
import type { NegocioQuadro } from "@/lib/crm";

const ORIGENS = ["meta_ads", "google_ads", "indicacao", "organico", "outbound"];
const TEMPERATURAS = [
  { v: "quente", r: "Quente" },
  { v: "morno", r: "Morno" },
  { v: "frio", r: "Frio" },
];

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

  const definir =
    (campo: keyof DadosNegocio, numero = false) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const bruto = e.target.value;
      setDados((d) => ({ ...d, [campo]: numero ? Number(bruto.replace(",", ".")) || 0 : bruto }));
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
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idBase}-titulo`}
        className="cartao-vidro w-full max-w-lg overflow-hidden rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-white">
            {negocio ? "Editar negócio" : "Novo negócio"}
          </h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-sm p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-white foco-anel"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-4 p-5" noValidate>
          <Campo rotulo="Nome do negócio">
            <Entrada
              ref={focarPrimeiro}
              value={dados.titulo}
              onChange={definir("titulo")}
              placeholder="Ex.: Loja Bella Fiore"
            />
          </Campo>

          <Campo rotulo="Contato">
            <Entrada
              value={dados.contato}
              onChange={definir("contato")}
              placeholder="Quem é a pessoa do outro lado"
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Valor mensal (R$)">
              <Entrada
                inputMode="decimal"
                value={String(dados.valor_mensal)}
                onChange={definir("valor_mensal", true)}
              />
            </Campo>
            <Campo rotulo="Setup (R$)">
              <Entrada
                inputMode="decimal"
                value={String(dados.valor_unico)}
                onChange={definir("valor_unico", true)}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Etapa">
              <Selecao value={dados.etapa_id} onChange={definir("etapa_id")}>
                {etapas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo rotulo="Temperatura">
              <Selecao value={dados.temperatura} onChange={definir("temperatura")}>
                {TEMPERATURAS.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.r}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Origem">
              <Selecao value={dados.origem} onChange={definir("origem")}>
                {ORIGENS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo rotulo="Previsão de fechamento">
              <Entrada
                type="date"
                value={dados.previsao ?? ""}
                onChange={(e) => setDados((d) => ({ ...d, previsao: e.target.value || null }))}
              />
            </Campo>
          </div>

          {erro && <p className="text-xs text-perigo">{erro}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : negocio ? "Salvar" : "Criar negócio"}
            </Botao>
          </div>
        </form>
      </div>
    </div>
  );
}
