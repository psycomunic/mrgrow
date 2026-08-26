"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  MessageCircle,
  Phone,
  Mail,
  Users,
  StickyNote,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { brl, dataCompleta } from "@/lib/utils";
import { listarAtividades, registrarAtividade, type Atividade } from "./acoes";
import { useCrm } from "./contexto";
import { DialogoNegocio } from "./dialogo";
import { rotuloOrigem, temperatura } from "./rotulos";
import type { NegocioQuadro } from "@/lib/crm";

const TIPOS = [
  { v: "nota", r: "Nota", Icone: StickyNote },
  { v: "ligacao", r: "Ligação", Icone: Phone },
  { v: "reuniao", r: "Reunião", Icone: Users },
  { v: "whatsapp", r: "WhatsApp", Icone: MessageCircle },
  { v: "email", r: "E-mail", Icone: Mail },
];

function quando(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return `há ${dias}d`;
  return dataCompleta(iso);
}

/**
 * Painel lateral do negócio: valores, andamento pelo funil e histórico de
 * contato. Substitui o antigo clique-para-editar, que só abria um formulário.
 */
export function DetalheNegocio({
  negocio,
  aoFechar,
}: {
  negocio: NegocioQuadro;
  aoFechar: () => void;
}) {
  const { etapas, mover, fechar, excluir } = useCrm();
  const [atividades, setAtividades] = useState<Atividade[] | null>(null);
  const [tipo, setTipo] = useState("nota");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(false);

  const carregar = useCallback(() => {
    listarAtividades(negocio.id).then(setAtividades);
  }, [negocio.id]);

  useEffect(carregar, [carregar]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editando) aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar, editando]);

  const etapa = etapas.find((e) => e.id === negocio.etapa_id);
  const indiceAtual = etapas.findIndex((e) => e.id === negocio.etapa_id);
  const temp = temperatura(negocio.temperatura);
  const anual = negocio.valor_mensal * 12 + negocio.valor_unico;

  async function enviarAtividade(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;

    setEnviando(true);
    const r = await registrarAtividade(negocio.id, tipo, texto);
    setEnviando(false);

    if (!r.ok) return toast.error(r.erro ?? "Não foi possível registrar.");

    // Entra na lista na hora; sem banco é só aqui que ela existe.
    setAtividades((l) => [
      {
        id: `local-${Date.now()}`,
        tipo,
        conteudo: texto.trim(),
        criado_em: new Date().toISOString(),
        autor: "Você",
      },
      ...(l ?? []),
    ]);
    setTexto("");
    toast.success(r.demo ? "Registrado (não salvo: modo demonstração)." : "Atividade registrada.");
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-papel/70 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) aoFechar();
        }}
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={negocio.titulo}
          className="flex h-full w-full max-w-xl flex-col border-l border-borda bg-papel shadow-2xl"
        >
          {/* Cabeçalho */}
          <header className="border-b border-borda px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-cinza uppercase">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: etapa?.cor ?? "#1668f5" }}
                  />
                  {etapa?.nome ?? "Sem etapa"}
                  <span className="text-cinza-claro">·</span>
                  {etapa?.probabilidade ?? 0}% de chance
                </span>
                <h2 className="mt-2 truncate font-display text-2xl font-extrabold text-tinta">
                  {negocio.titulo}
                </h2>
                {negocio.contato && (
                  <p className="mt-1 text-sm text-grafite">{negocio.contato}</p>
                )}
              </div>
              <button
                onClick={aoFechar}
                aria-label="Fechar"
                className="shrink-0 rounded-sm p-2 text-cinza transition-colors hover:bg-nevoa hover:text-tinta foco-anel"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <Etiqueta tom={temp.tom}>
                <temp.Icone className="mr-1 inline size-3" />
                {temp.r}
              </Etiqueta>
              {negocio.origem && <Etiqueta>{rotuloOrigem(negocio.origem)}</Etiqueta>}
              {negocio.previsao && (
                <Etiqueta>Previsão: {dataCompleta(negocio.previsao)}</Etiqueta>
              )}
            </div>
          </header>

          <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
            {/* Valores */}
            <section className="grid grid-cols-3 gap-3">
              <Valor rotulo="Recorrente" valor={brl(negocio.valor_mensal)} sufixo="/mês" destaque />
              <Valor rotulo="Setup" valor={brl(negocio.valor_unico)} sufixo="única vez" />
              <Valor rotulo="12 meses" valor={brl(anual)} sufixo="valor do contrato" />
            </section>

            {/* Andamento no funil, clicável */}
            <section>
              <h3 className="text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
                Andamento
              </h3>
              <ol className="mt-3 flex items-stretch gap-1">
                {etapas.map((e, i) => {
                  const passada = i <= indiceAtual;
                  return (
                    <li key={e.id} className="flex-1">
                      <button
                        onClick={() => mover(negocio.id, e.id)}
                        title={`Mover para ${e.nome}`}
                        className="group w-full text-left foco-anel"
                      >
                        <span
                          className={[
                            "block h-1.5 rounded-full transition-colors",
                            passada ? "bg-mrg-500" : "bg-nevoa-2 group-hover:bg-borda-forte",
                          ].join(" ")}
                        />
                        <span
                          className={[
                            "mt-2 block text-[10px] leading-tight transition-colors",
                            i === indiceAtual
                              ? "font-semibold text-tinta"
                              : "text-cinza-claro group-hover:text-grafite",
                          ].join(" ")}
                        >
                          {e.nome}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Histórico */}
            <section>
              <h3 className="text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
                Histórico de contato
              </h3>

              <form onSubmit={enviarAtividade} className="mt-3">
                <div className="mb-2 flex flex-wrap gap-1">
                  {TIPOS.map(({ v, r, Icone }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTipo(v)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs transition-colors foco-anel",
                        tipo === v
                          ? "bg-mrg-500/15 text-mrg-600 ring-1 ring-inset ring-mrg-500/40"
                          : "text-cinza hover:bg-nevoa hover:text-grafite",
                      ].join(" ")}
                    >
                      <Icone className="size-3.5" />
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="O que aconteceu nesse contato?"
                  rows={3}
                  className="w-full resize-y rounded-md border border-borda bg-nevoa px-3.5 py-2.5 text-sm text-tinta placeholder:text-cinza-claro transition-colors focus:border-mrg-500/60 foco-anel"
                />
                <div className="mt-2 flex justify-end">
                  <Botao type="submit" tamanho="sm" disabled={enviando || !texto.trim()}>
                    {enviando ? "Salvando…" : "Registrar"}
                  </Botao>
                </div>
              </form>

              <ul className="mt-5 space-y-4">
                {atividades === null && (
                  <li className="text-sm text-cinza-claro">Carregando…</li>
                )}
                {atividades?.length === 0 && (
                  <li className="rounded-md border border-dashed border-borda p-4 text-sm text-cinza-claro">
                    Nenhum contato registrado ainda. O primeiro fica aqui.
                  </li>
                )}
                {atividades?.map((a) => {
                  const meta = TIPOS.find((t) => t.v === a.tipo) ?? TIPOS[0];
                  return (
                    <li key={a.id} className="flex gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-mrg-500/12 text-mrg-600 ring-1 ring-inset ring-mrg-500/25">
                        <meta.Icone className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-xs text-cinza">
                          <span className="font-semibold text-grafite">{meta.r}</span>
                          {a.autor && <span>· {a.autor}</span>}
                          <span>· {quando(a.criado_em)}</span>
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-grafite">{a.conteudo}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* Ações */}
          <footer className="flex flex-wrap items-center gap-2 border-t border-borda px-6 py-4">
            <Botao variante="sucesso" tamanho="sm" onClick={() => { fechar(negocio.id, "ganho"); aoFechar(); }}>
              <Check className="size-4" />
              Ganho
            </Botao>
            <Botao variante="contorno" tamanho="sm" onClick={() => { fechar(negocio.id, "perdido"); aoFechar(); }}>
              <X className="size-4" />
              Perdido
            </Botao>
            <Botao variante="contorno" tamanho="sm" onClick={() => setEditando(true)}>
              <Pencil className="size-4" />
              Editar
            </Botao>
            <Botao
              variante="fantasma"
              tamanho="sm"
              className="ml-auto text-perigo hover:bg-perigo/10"
              onClick={() => {
                if (confirm(`Excluir "${negocio.titulo}"? Isso não pode ser desfeito.`)) {
                  excluir(negocio.id);
                  aoFechar();
                }
              }}
            >
              <Trash2 className="size-4" />
              Excluir
            </Botao>
          </footer>
        </aside>
      </div>

      {editando && <DialogoNegocio negocio={negocio} aoFechar={() => setEditando(false)} />}
    </>
  );
}

function Valor({
  rotulo,
  valor,
  sufixo,
  destaque,
}: {
  rotulo: string;
  valor: string;
  sufixo: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-md border border-borda bg-nevoa p-3.5">
      <p className="text-[11px] tracking-wider text-cinza-claro uppercase">{rotulo}</p>
      <p
        className={[
          "mt-1.5 font-display font-extrabold text-tinta",
          destaque ? "text-xl" : "text-base",
        ].join(" ")}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-[11px] text-cinza-claro">{sufixo}</p>
    </div>
  );
}
