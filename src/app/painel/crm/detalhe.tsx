"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlarmClock,
  AtSign,
  Building2,
  CalendarPlus,
  Check,
  Clock,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Avatar } from "@/components/painel/avatares";
import { brl, cn, dataCompleta, numero } from "@/lib/utils";
import { hoje } from "@/lib/tempo";
import {
  agendarAtividade,
  concluirAtividade,
  listarAtividades,
  registrarAtividade,
  type Atividade,
} from "./acoes";
import { useCrm } from "./contexto";
import { DialogoNegocio } from "./dialogo";
import { DialogoPerda } from "./perda";
import { rotuloOrigem, temperatura } from "./rotulos";
import type { NegocioQuadro } from "@/lib/crm";

const TIPOS = [
  { v: "nota", r: "Nota", Icone: StickyNote },
  { v: "ligacao", r: "Ligação", Icone: Phone },
  { v: "reuniao", r: "Reunião", Icone: Users },
  { v: "whatsapp", r: "WhatsApp", Icone: MessageCircle },
  { v: "email", r: "E-mail", Icone: Mail },
];

function tipoDe(v: string) {
  return TIPOS.find((t) => t.v === v) ?? TIPOS[0];
}

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

/** Dias inteiros entre uma data e agora. Negativo quando está no futuro. */
export function diasDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Só dígitos, para montar o link do WhatsApp. */
function soDigitos(t: string) {
  return t.replace(/\D/g, "");
}

/**
 * Card do lead: tudo o que se sabe do negócio numa tela só.
 *
 * É modal centralizado, e não gaveta lateral: o conteúdo é largo — ficha do
 * contato de um lado, andamento e histórico do outro — e numa gaveta as duas
 * colunas não caberiam lado a lado.
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
  const [perdendo, setPerdendo] = useState(false);
  const [agendando, setAgendando] = useState(false);

  const carregar = useCallback(() => {
    listarAtividades(negocio.id).then(setAtividades);
  }, [negocio.id]);

  useEffect(carregar, [carregar]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editando && !perdendo) aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar, editando, perdendo]);

  const etapa = etapas.find((e) => e.id === negocio.etapa_id);
  const indiceAtual = etapas.findIndex((e) => e.id === negocio.etapa_id);
  const temp = temperatura(negocio.temperatura);
  const anual = negocio.valor_mensal * 12 + negocio.valor_unico;
  const ponderado = ((negocio.valor_mensal + negocio.valor_unico) * (etapa?.probabilidade ?? 0)) / 100;

  const c = negocio.dados;
  const paradoHa = diasDesde(negocio.etapa_desde);
  const semContatoHa = negocio.ultimo_contato ? diasDesde(negocio.ultimo_contato) : null;
  const atrasada = !!negocio.proxima && negocio.proxima.vence_em.slice(0, 10) < hoje();

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
        titulo: null,
        conteudo: texto.trim(),
        criado_em: new Date().toISOString(),
        vence_em: null,
        concluida: true,
        autor: "Você",
      },
      ...(l ?? []),
    ]);
    setTexto("");
    toast.success(r.demo ? "Registrado (não salvo: modo demonstração)." : "Atividade registrada.");
  }

  return (
    <>
      <Sobreposicao
        className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-papel/80 p-4 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) aoFechar();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={negocio.titulo}
          className="cartao my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-xl"
        >
          {/* ── Cabeçalho ─────────────────────────────────────────── */}
          <header className="border-b border-borda px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-wider text-cinza uppercase">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: etapa?.cor ?? "#5798ff" }}
                  />
                  {etapa?.nome ?? "Sem etapa"}
                  <span className="text-cinza-claro">·</span>
                  {etapa?.probabilidade ?? 0}% de chance
                </span>
                <h2 className="font-display mt-2 truncate text-2xl font-extrabold text-tinta">
                  {negocio.titulo}
                </h2>
                {c && (
                  <p className="mt-1 text-sm text-grafite">
                    {c.nome}
                    {c.cargo && <span className="text-cinza"> · {c.cargo}</span>}
                    {c.empresa && c.empresa !== negocio.titulo && (
                      <span className="text-cinza"> · {c.empresa}</span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {negocio.responsavel && (
                  <span className="flex items-center gap-2" title={`Responsável: ${negocio.responsavel}`}>
                    <Avatar nome={negocio.responsavel} medida="md" />
                    <span className="hidden text-xs text-cinza sm:block">
                      {negocio.responsavel}
                    </span>
                  </span>
                )}
                <button
                  onClick={aoFechar}
                  aria-label="Fechar"
                  className="foco-anel rounded-sm p-2 text-cinza transition-colors hover:bg-nevoa hover:text-tinta"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <Etiqueta tom={temp.tom}>
                <temp.Icone className="mr-1 inline size-3" />
                {temp.r}
              </Etiqueta>
              {negocio.origem && <Etiqueta>{rotuloOrigem(negocio.origem)}</Etiqueta>}
              {negocio.previsao && <Etiqueta>Previsão: {dataCompleta(negocio.previsao)}</Etiqueta>}
              <Etiqueta tom={paradoHa >= 14 ? "perigo" : paradoHa >= 7 ? "alerta" : "neutro"}>
                <Clock className="mr-1 inline size-3" />
                {paradoHa === 0 ? "entrou hoje na etapa" : `${numero(paradoHa)} d nesta etapa`}
              </Etiqueta>
            </div>
          </header>

          <div className="grid max-h-[68vh] gap-0 overflow-y-auto lg:grid-cols-5">
            {/* ── Coluna da esquerda: quem é e quanto vale ────────── */}
            <div className="space-y-6 border-borda p-6 lg:col-span-2 lg:border-r">
              <section>
                <Titulo>Contato</Titulo>
                {c ? (
                  <ul className="mt-3 space-y-1">
                    {c.telefone && (
                      <>
                        <Linha
                          Icone={Phone}
                          rotulo={c.telefone}
                          href={`tel:${soDigitos(c.telefone)}`}
                        />
                        <Linha
                          Icone={MessageCircle}
                          rotulo="Abrir no WhatsApp"
                          href={`https://wa.me/${soDigitos(c.telefone)}`}
                          externo
                        />
                      </>
                    )}
                    {c.email && <Linha Icone={Mail} rotulo={c.email} href={`mailto:${c.email}`} />}
                    {c.instagram && (
                      <Linha
                        Icone={Instagram}
                        rotulo={`@${c.instagram}`}
                        href={`https://instagram.com/${c.instagram}`}
                        externo
                      />
                    )}
                    {c.site && (
                      <Linha
                        Icone={Globe}
                        rotulo={c.site}
                        href={`https://${c.site.replace(/^https?:\/\//, "")}`}
                        externo
                      />
                    )}
                    {c.empresa && <Linha Icone={Building2} rotulo={c.empresa} />}
                    {c.cargo && <Linha Icone={AtSign} rotulo={c.cargo} />}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-md border border-dashed border-borda p-4 text-sm text-cinza-claro">
                    Sem contato cadastrado. Use &ldquo;Editar&rdquo; para incluir telefone e e-mail.
                  </p>
                )}
              </section>

              <section>
                <Titulo>Valores</Titulo>
                <div className="mt-3 space-y-2">
                  <Valor rotulo="Recorrente" valor={brl(negocio.valor_mensal)} sufixo="/mês" destaque />
                  <div className="grid grid-cols-2 gap-2">
                    <Valor rotulo="Setup" valor={brl(negocio.valor_unico)} sufixo="única vez" />
                    <Valor rotulo="12 meses" valor={brl(anual)} sufixo="contrato" />
                  </div>
                  <Valor
                    rotulo="Ponderado pela etapa"
                    valor={brl(ponderado)}
                    sufixo={`${etapa?.probabilidade ?? 0}% do primeiro ciclo`}
                  />
                </div>
              </section>

              <section>
                <Titulo>Histórico do negócio</Titulo>
                <ul className="mt-3 space-y-1.5 text-[13px] text-grafite">
                  <li className="flex justify-between gap-3">
                    <span className="text-cinza">Criado</span>
                    <span className="tabular-nums">{quando(negocio.criado_em)}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-cinza">Nesta etapa desde</span>
                    <span className="tabular-nums">{quando(negocio.etapa_desde)}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-cinza">Último contato</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        semContatoHa !== null && semContatoHa >= 10 && "font-semibold text-alerta",
                      )}
                    >
                      {negocio.ultimo_contato ? quando(negocio.ultimo_contato) : "nunca"}
                    </span>
                  </li>
                </ul>
              </section>
            </div>

            {/* ── Coluna da direita: o que fazer e o que já foi feito ── */}
            <div className="space-y-6 p-6 lg:col-span-3">
              {/* O próximo passo vem antes de tudo: é a única informação da
                  tela sobre a qual ainda dá para agir. */}
              <section>
                <Titulo>Próximo passo</Titulo>
                {negocio.proxima ? (
                  <div
                    className={cn(
                      "mt-3 flex items-start gap-3 rounded-md border p-4",
                      atrasada ? "border-perigo/40 bg-perigo/8" : "border-borda bg-nevoa",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full",
                        atrasada ? "bg-perigo/15 text-perigo" : "bg-mrg-500/15 text-acento",
                      )}
                    >
                      {(() => {
                        const I = tipoDe(negocio.proxima.tipo).Icone;
                        return <I className="size-4" />;
                      })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-tinta">
                        {negocio.proxima.titulo ?? tipoDe(negocio.proxima.tipo).r}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs tabular-nums",
                          atrasada ? "font-semibold text-perigo" : "text-cinza",
                        )}
                      >
                        {tipoDe(negocio.proxima.tipo).r} ·{" "}
                        {dataCompleta(negocio.proxima.vence_em.slice(0, 10))}
                        {atrasada && " · atrasado"}
                      </p>
                    </div>
                    <Botao
                      tamanho="sm"
                      variante="contorno"
                      onClick={async () => {
                        const r = await concluirAtividade(negocio.proxima!.id);
                        if (!r.ok) return toast.error(r.erro ?? "Não foi possível concluir.");
                        toast.success(
                          r.demo ? "Concluído (não salvo: demonstração)." : "Passo concluído.",
                        );
                      }}
                    >
                      <Check className="size-4" />
                      Feito
                    </Botao>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-alerta/40 bg-alerta/8 p-4">
                    <p className="flex items-center gap-2 text-sm text-alerta">
                      <TriangleAlert className="size-4 shrink-0" />
                      Nenhum próximo passo combinado.
                    </p>
                    <Botao tamanho="sm" onClick={() => setAgendando(true)}>
                      <CalendarPlus className="size-4" />
                      Agendar
                    </Botao>
                  </div>
                )}

                {agendando && (
                  <FormularioAgenda
                    negocioId={negocio.id}
                    aoFechar={() => setAgendando(false)}
                  />
                )}
                {!agendando && negocio.proxima && (
                  <button
                    type="button"
                    onClick={() => setAgendando(true)}
                    className="foco-anel mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-acento hover:text-acento-forte"
                  >
                    <CalendarPlus className="size-3.5" />
                    Agendar outro passo
                  </button>
                )}
              </section>

              {/* Andamento no funil, clicável */}
              <section>
                <Titulo>Andamento</Titulo>
                <ol className="mt-3 flex items-stretch gap-1">
                  {etapas.map((e, i) => {
                    const passada = i <= indiceAtual;
                    return (
                      <li key={e.id} className="flex-1">
                        <button
                          onClick={() => mover(negocio.id, e.id)}
                          title={`Mover para ${e.nome}`}
                          className="foco-anel group w-full text-left"
                        >
                          <span
                            className={cn(
                              "block h-1.5 rounded-full transition-colors",
                              passada ? "bg-mrg-500" : "bg-nevoa-2 group-hover:bg-borda-forte",
                            )}
                          />
                          <span
                            className={cn(
                              "mt-2 block text-[10px] leading-tight transition-colors",
                              i === indiceAtual
                                ? "font-semibold text-tinta"
                                : "text-cinza-claro group-hover:text-grafite",
                            )}
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
                <Titulo>Histórico de contato</Titulo>

                <form onSubmit={enviarAtividade} className="mt-3">
                  <div className="mb-2 flex flex-wrap gap-1">
                    {TIPOS.map(({ v, r, Icone }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setTipo(v)}
                        className={cn(
                          "foco-anel inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs transition-colors",
                          tipo === v
                            ? "bg-mrg-500/15 text-acento ring-1 ring-mrg-500/40 ring-inset"
                            : "text-cinza hover:bg-nevoa hover:text-grafite",
                        )}
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
                    className="foco-anel w-full resize-y rounded-md border border-borda bg-nevoa px-3.5 py-2.5 text-sm text-tinta transition-colors placeholder:text-cinza-claro focus:border-mrg-500/60"
                  />
                  <div className="mt-2 flex justify-end">
                    <Botao type="submit" tamanho="sm" disabled={enviando || !texto.trim()}>
                      {enviando ? "Salvando…" : "Registrar"}
                    </Botao>
                  </div>
                </form>

                <ul className="mt-5 space-y-4">
                  {atividades === null && <li className="text-sm text-cinza-claro">Carregando…</li>}
                  {atividades?.length === 0 && (
                    <li className="rounded-md border border-dashed border-borda p-4 text-sm text-cinza-claro">
                      Nenhum contato registrado ainda. O primeiro fica aqui.
                    </li>
                  )}
                  {atividades?.map((a) => {
                    const meta = tipoDe(a.tipo);
                    return (
                      <li key={a.id} className="flex gap-3">
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-mrg-500/12 text-acento ring-1 ring-mrg-500/25 ring-inset">
                          <meta.Icone className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 text-xs text-cinza">
                            <span className="font-semibold text-grafite">{meta.r}</span>
                            {a.autor && <span>· {a.autor}</span>}
                            <span>· {quando(a.criado_em)}</span>
                            {a.vence_em && !a.concluida && (
                              <Etiqueta tom="alerta">
                                <AlarmClock className="mr-1 inline size-3" />
                                agendado
                              </Etiqueta>
                            )}
                          </p>
                          {a.titulo && (
                            <p className="mt-1 text-sm font-medium text-tinta">{a.titulo}</p>
                          )}
                          {a.conteudo && (
                            <p className="mt-1 text-sm leading-relaxed text-grafite">{a.conteudo}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>

          {/* ── Ações ─────────────────────────────────────────────── */}
          <footer className="flex flex-wrap items-center gap-2 border-t border-borda px-6 py-4">
            <Botao
              variante="sucesso"
              tamanho="sm"
              onClick={() => {
                fechar(negocio.id, "ganho");
                aoFechar();
              }}
            >
              <Check className="size-4" />
              Ganho
            </Botao>
            <Botao variante="contorno" tamanho="sm" onClick={() => setPerdendo(true)}>
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
        </div>
      </Sobreposicao>

      {editando && <DialogoNegocio negocio={negocio} aoFechar={() => setEditando(false)} />}
      {perdendo && (
        <DialogoPerda
          negocio={negocio}
          aoFechar={() => setPerdendo(false)}
          aoConfirmar={(motivo) => {
            fechar(negocio.id, "perdido", motivo);
            setPerdendo(false);
            aoFechar();
          }}
        />
      )}
    </>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold tracking-wider text-cinza-claro uppercase">{children}</h3>
  );
}

/** Linha da ficha de contato. Com `href`, vira ação; sem, é só informação. */
function Linha({
  Icone,
  rotulo,
  href,
  externo,
}: {
  Icone: typeof Phone;
  rotulo: string;
  href?: string;
  externo?: boolean;
}) {
  const miolo = (
    <>
      <Icone className="size-3.5 shrink-0 text-cinza-claro" />
      <span className="min-w-0 truncate">{rotulo}</span>
    </>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          target={externo ? "_blank" : undefined}
          rel={externo ? "noreferrer" : undefined}
          className="foco-anel -mx-2 flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] text-grafite transition-colors hover:bg-nevoa hover:text-acento"
        >
          {miolo}
        </a>
      ) : (
        <span className="-mx-2 flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-cinza">
          {miolo}
        </span>
      )}
    </li>
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
        className={cn(
          "font-display mt-1.5 font-extrabold tabular-nums text-tinta",
          destaque ? "text-xl" : "text-base",
        )}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-[11px] text-cinza-claro">{sufixo}</p>
    </div>
  );
}

/** Formulário curto para combinar o próximo passo. */
function FormularioAgenda({ negocioId, aoFechar }: { negocioId: string; aoFechar: () => void }) {
  const [tipo, setTipo] = useState("ligacao");
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(hoje());
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;

    setEnviando(true);
    const r = await agendarAtividade(negocioId, tipo, titulo, data);
    setEnviando(false);

    if (!r.ok) return toast.error(r.erro ?? "Não foi possível agendar.");
    toast.success(r.demo ? "Agendado (não salvo: demonstração)." : "Próximo passo agendado.");
    aoFechar();
  }

  return (
    <form onSubmit={enviar} className="mt-3 space-y-2 rounded-md border border-borda bg-nevoa p-4">
      <div className="flex flex-wrap gap-1">
        {TIPOS.filter((t) => t.v !== "nota").map(({ v, r, Icone }) => (
          <button
            key={v}
            type="button"
            onClick={() => setTipo(v)}
            className={cn(
              "foco-anel inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs transition-colors",
              tipo === v
                ? "bg-mrg-500/15 text-acento ring-1 ring-mrg-500/40 ring-inset"
                : "text-cinza hover:bg-carta hover:text-grafite",
            )}
          >
            <Icone className="size-3.5" />
            {r}
          </button>
        ))}
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ex.: Ligar para apresentar a proposta"
        className="foco-anel w-full rounded-md border border-borda bg-carta px-3.5 py-2.5 text-sm text-tinta placeholder:text-cinza-claro"
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="foco-anel rounded-md border border-borda bg-carta px-3 py-2 text-sm text-tinta"
        />
        <Botao type="submit" tamanho="sm" disabled={enviando || !titulo.trim()}>
          {enviando ? "Salvando…" : "Agendar"}
        </Botao>
        <Botao type="button" variante="fantasma" tamanho="sm" onClick={aoFechar}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
