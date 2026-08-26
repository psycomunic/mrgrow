"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Kpi } from "@/components/painel/kpi";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { brl, dataCompleta, numero } from "@/lib/utils";
import { Construtor } from "./construtor";
import { excluirProposta } from "./acoes";
import type { Proposta } from "@/lib/propostas";

const TOM: Record<string, "azul" | "alerta" | "sucesso" | "perigo" | "neutro"> = {
  rascunho: "neutro",
  enviada: "azul",
  visualizada: "alerta",
  aceita: "sucesso",
  recusada: "perigo",
  expirada: "neutro",
};

const ROTULO: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
};

export function ListaPropostas({ propostas: iniciais }: { propostas: Proposta[] }) {
  const [propostas, setPropostas] = useState(iniciais);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Proposta | null>(null);
  const [linkNovo, setLinkNovo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const kpis = useMemo(() => {
    const abertas = propostas.filter((p) => ["enviada", "visualizada"].includes(p.status));
    const respondidas = propostas.filter((p) => ["aceita", "recusada"].includes(p.status));
    const aceitas = propostas.filter((p) => p.status === "aceita");
    return {
      abertas: abertas.length,
      valorAberto: abertas.reduce((s, p) => s + p.valor_mensal, 0),
      taxa: respondidas.length ? (aceitas.length / respondidas.length) * 100 : 0,
      ganho: aceitas.reduce((s, p) => s + p.valor_mensal, 0),
    };
  }, [propostas]);

  function endereco(token: string) {
    return typeof window === "undefined" ? "" : `${window.location.origin}/proposta/${token}`;
  }

  async function copiar(token: string) {
    try {
      await navigator.clipboard.writeText(endereco(token));
      setCopiado(token);
      toast.success("Link copiado.");
      window.setTimeout(() => setCopiado(null), 2000);
    } catch {
      toast.error("O navegador bloqueou a cópia. Abra o link e copie da barra.");
    }
  }

  async function remover(p: Proposta) {
    if (!confirm(`Excluir a proposta ${p.numero}? Isso não pode ser desfeito.`)) return;
    const anterior = propostas;
    setPropostas((l) => l.filter((x) => x.id !== p.id));
    const r = await excluirProposta(p.id);
    if (!r.ok) {
      setPropostas(anterior);
      toast.error(r.erro ?? "Não foi possível excluir.");
      return;
    }
    toast.success("Proposta excluída.");
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi rotulo="Em aberto" valor={numero(kpis.abertas)} detalhe="aguardando resposta" />
        <Kpi rotulo="Valor em negociação" valor={brl(kpis.valorAberto)} detalhe="recorrente mensal" />
        <Kpi
          rotulo="Taxa de aceite"
          valor={`${kpis.taxa.toFixed(0)}%`}
          detalhe="sobre as respondidas"
        />
        <Kpi rotulo="Ganho fechado" valor={brl(kpis.ganho)} detalhe="propostas aceitas" />
      </section>

      <div className="flex justify-end">
        <Botao tamanho="sm" onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Nova proposta
        </Botao>
      </div>

      {/* O link é o entregável: fica visível até ser copiado. */}
      {linkNovo && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-mrg-500/40 bg-mrg-500/10 p-4">
          <Check className="size-5 shrink-0 text-mrg-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Proposta criada. O link é este:</p>
            <p className="mt-0.5 truncate font-mono text-xs text-mrg-200">{endereco(linkNovo)}</p>
          </div>
          <Botao tamanho="sm" variante="contorno" onClick={() => copiar(linkNovo)}>
            <Copy className="size-4" /> Copiar
          </Botao>
          <Botao tamanho="sm" onClick={() => window.open(endereco(linkNovo), "_blank")}>
            <ExternalLink className="size-4" /> Abrir
          </Botao>
          <button
            onClick={() => setLinkNovo(null)}
            className="text-xs text-ink-400 hover:text-white foco-anel"
          >
            Dispensar
          </button>
        </div>
      )}

      {propostas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-ink-500">
          Nenhuma proposta ainda. Crie a primeira e envie o link para o cliente.
        </p>
      ) : (
        <Tabela>
          <Cabecalhos colunas={["Número", "Título", "Valor", "Validade", "Status", ""]} />
          <tbody>
            {propostas.map((p) => (
              <Linha key={p.id}>
                <Celula className="font-mono text-xs text-ink-400">{p.numero}</Celula>
                <Celula className="text-white">
                  <span className="block font-medium">{p.titulo}</span>
                  {p.cliente_nome && (
                    <span className="text-xs text-ink-400">{p.cliente_nome}</span>
                  )}
                </Celula>
                <Celula className="font-medium text-white">
                  {brl(p.valor_mensal)}
                  <span className="text-xs font-normal text-ink-500">/mês</span>
                </Celula>
                <Celula className="text-ink-400">
                  {p.validade ? dataCompleta(p.validade) : "—"}
                </Celula>
                <Celula>
                  <Etiqueta tom={TOM[p.status] ?? "neutro"}>{ROTULO[p.status] ?? p.status}</Etiqueta>
                </Celula>
                <Celula>
                  <div className="flex items-center justify-end gap-1">
                    <Acao rotulo="Copiar link" onClick={() => copiar(p.token)}>
                      {copiado === p.token ? (
                        <Check className="size-4 text-sucesso" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Acao>
                    <Acao
                      rotulo="Abrir proposta"
                      onClick={() => window.open(endereco(p.token), "_blank")}
                    >
                      <ExternalLink className="size-4" />
                    </Acao>
                    <Acao rotulo="Editar" onClick={() => setEditando(p)}>
                      <Pencil className="size-4" />
                    </Acao>
                    <Acao
                      rotulo="Excluir"
                      onClick={() => remover(p)}
                      classe="hover:bg-perigo/15 hover:text-perigo"
                    >
                      <Trash2 className="size-4" />
                    </Acao>
                  </div>
                </Celula>
              </Linha>
            ))}
          </tbody>
        </Tabela>
      )}

      {criando && (
        <Construtor aoFechar={() => setCriando(false)} aoGerarLink={(t) => setLinkNovo(t)} />
      )}
      {editando && (
        <Construtor
          proposta={editando}
          aoFechar={() => setEditando(null)}
          aoGerarLink={() => {}}
        />
      )}
    </>
  );
}

function Acao({
  rotulo,
  onClick,
  classe = "",
  children,
}: {
  rotulo: string;
  onClick: () => void;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={`rounded-sm p-2 text-ink-400 transition-colors hover:bg-white/5 hover:text-white foco-anel ${classe}`}
    >
      {children}
    </button>
  );
}
