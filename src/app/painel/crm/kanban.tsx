"use client";

import { useMemo, useRef, useState } from "react";
import { AlarmClock, Clock, Plus, Search, TriangleAlert, X } from "lucide-react";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Avatar } from "@/components/painel/avatares";
import { brl, cn, dataCurta, numero } from "@/lib/utils";
import { hoje } from "@/lib/tempo";
import { useCrm } from "./contexto";
import { DialogoNegocio } from "./dialogo";
import { DetalheNegocio, diasDesde } from "./detalhe";
import { ORIGENS, TEMPERATURAS, rotuloOrigem, temperatura } from "./rotulos";
import type { NegocioQuadro } from "@/lib/crm";

/** Dias parados a partir dos quais o negócio pede atenção. */
const PARADO = 7;

/** Acentos fora, minúscula: buscar "otica" acha "Ótica". */
function dobrar(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

type Filtros = {
  busca: string;
  responsavel: string | null;
  temperatura: string | null;
  origem: string | null;
  semProximoPasso: boolean;
  parados: boolean;
};

const VAZIO: Filtros = {
  busca: "",
  responsavel: null,
  temperatura: null,
  origem: null,
  semProximoPasso: false,
  parados: false,
};

/**
 * Quadro do funil com arrastar-e-soltar nativo (HTML5).
 * Toda mudança passa pelo contexto, que aplica na tela na hora e chama a
 * Server Action; o trigger `ao_mover_negocio` grava o histórico no banco.
 */
export function Kanban({ aberturaInicial = null }: { aberturaInicial?: string | null }) {
  const { etapas, negocios, mover } = useCrm();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  /* `?negocio=<id>` abre o card direto: é o que torna o link de um negócio
     compartilhável por WhatsApp ou e-mail, sem mandar a pessoa caçar o
     cartão no quadro. Depois disso o estado é só do cliente. */
  const [aberto, setAberto] = useState<string | null>(aberturaInicial);
  const [criandoEm, setCriandoEm] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(VAZIO);

  // O clique dispara logo depois de um arrasto em alguns navegadores; a marca
  // evita que soltar o cartão numa coluna também abra o painel.
  const houveArrasto = useRef(false);

  // Ler do estado vivo, e não da cópia guardada, mantém o painel em dia
  // depois de mover ou editar.
  const emFoco = negocios.find((n) => n.id === aberto) ?? null;

  const responsaveis = useMemo(
    () => [...new Set(negocios.map((n) => n.responsavel).filter(Boolean))] as string[],
    [negocios],
  );

  const filtrados = useMemo(() => {
    const busca = dobrar(filtros.busca.trim());
    return negocios.filter((n) => {
      if (filtros.responsavel && n.responsavel !== filtros.responsavel) return false;
      if (filtros.temperatura && n.temperatura !== filtros.temperatura) return false;
      if (filtros.origem && n.origem !== filtros.origem) return false;
      if (filtros.semProximoPasso && n.proxima) return false;
      if (filtros.parados && diasDesde(n.etapa_desde) < PARADO) return false;
      if (busca) {
        const alvo = dobrar(
          [n.titulo, n.contato, n.dados?.empresa, n.responsavel].filter(Boolean).join(" "),
        );
        if (!alvo.includes(busca)) return false;
      }
      return true;
    });
  }, [negocios, filtros]);

  const filtrando = JSON.stringify(filtros) !== JSON.stringify(VAZIO);

  return (
    <>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cinza-claro" />
            <input
              type="search"
              value={filtros.busca}
              onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
              placeholder="Buscar por negócio, contato ou responsável…"
              aria-label="Buscar negócios"
              className="foco-anel w-full rounded-full border border-borda bg-carta py-2 pr-4 pl-9 text-[13px] text-tinta placeholder:text-cinza-claro"
            />
          </div>

          {responsaveis.length > 1 && (
            <Menu
              rotulo="Filtrar por responsável"
              valor={filtros.responsavel ?? ""}
              aoMudar={(v) => setFiltros((f) => ({ ...f, responsavel: v || null }))}
            >
              <option value="">Todos os responsáveis</option>
              {responsaveis.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Menu>
          )}

          <Menu
            rotulo="Filtrar por temperatura"
            valor={filtros.temperatura ?? ""}
            aoMudar={(v) => setFiltros((f) => ({ ...f, temperatura: v || null }))}
          >
            <option value="">Toda temperatura</option>
            {TEMPERATURAS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.r}
              </option>
            ))}
          </Menu>

          <Menu
            rotulo="Filtrar por origem"
            valor={filtros.origem ?? ""}
            aoMudar={(v) => setFiltros((f) => ({ ...f, origem: v || null }))}
          >
            <option value="">Toda origem</option>
            {ORIGENS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.r}
              </option>
            ))}
          </Menu>

          <Pilula
            ativo={filtros.semProximoPasso}
            aoClicar={() => setFiltros((f) => ({ ...f, semProximoPasso: !f.semProximoPasso }))}
            titulo="Negócios sem nada combinado para depois"
          >
            <TriangleAlert className="size-3.5" />
            Sem próximo passo
          </Pilula>

          <Pilula
            ativo={filtros.parados}
            aoClicar={() => setFiltros((f) => ({ ...f, parados: !f.parados }))}
            titulo={`Há ${PARADO} dias ou mais na mesma etapa`}
          >
            <Clock className="size-3.5" />
            Parados
          </Pilula>

          {filtrando && (
            <button
              type="button"
              onClick={() => setFiltros(VAZIO)}
              className="foco-anel inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-cinza hover:text-tinta"
            >
              <X className="size-3.5" />
              Limpar
            </button>
          )}
        </div>

        {filtrando && (
          <p className="text-xs text-cinza">
            Mostrando <strong className="font-semibold text-tinta">{filtrados.length}</strong> de{" "}
            {negocios.length} negócios.
          </p>
        )}
      </section>

      <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
        <div className="flex min-w-max gap-4">
          {etapas.map((etapa) => {
            const daEtapa = filtrados.filter((n) => n.etapa_id === etapa.id);
            const soma = daEtapa.reduce((s, n) => s + n.valor_mensal, 0);
            const semPasso = daEtapa.filter((n) => !n.proxima).length;

            return (
              <div
                key={etapa.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSobre(etapa.id);
                }}
                onDragLeave={() => setSobre(null)}
                onDrop={() => {
                  if (arrastando) mover(arrastando, etapa.id);
                  setArrastando(null);
                  setSobre(null);
                }}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-lg border p-3 transition-colors",
                  sobre === etapa.id ? "border-mrg-500/50 bg-mrg-500/5" : "border-borda bg-nevoa",
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: etapa.cor ?? "#5798ff" }}
                    />
                    <h3 className="text-sm font-semibold text-tinta">{etapa.nome}</h3>
                    <span className="rounded-full bg-nevoa-2 px-1.5 text-[11px] text-grafite">
                      {daEtapa.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-cinza-claro">{etapa.probabilidade}%</span>
                </div>

                <p className="mb-2 px-1 text-xs text-cinza">{brl(soma)} /mês</p>

                {semPasso > 0 && (
                  <p className="mb-3 flex items-center gap-1.5 px-1 text-[11px] text-alerta">
                    <TriangleAlert className="size-3.5" />
                    {semPasso} sem próximo passo
                  </p>
                )}

                <div className="flex-1 space-y-2">
                  {daEtapa.map((n) => (
                    <Cartao
                      key={n.id}
                      n={n}
                      arrastando={arrastando === n.id}
                      aoArrastar={() => {
                        houveArrasto.current = true;
                        setArrastando(n.id);
                      }}
                      aoSoltar={() => setArrastando(null)}
                      aoAbrir={() => {
                        if (houveArrasto.current) {
                          houveArrasto.current = false;
                          return;
                        }
                        setAberto(n.id);
                      }}
                    />
                  ))}

                  <button
                    onClick={() => setCriandoEm(etapa.id)}
                    className="foco-anel flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-borda py-2.5 text-xs text-cinza-claro transition-colors hover:border-mrg-500/40 hover:text-acento"
                  >
                    <Plus className="size-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {criandoEm && <DialogoNegocio etapaPadrao={criandoEm} aoFechar={() => setCriandoEm(null)} />}
      {emFoco && <DetalheNegocio negocio={emFoco} aoFechar={() => setAberto(null)} />}
    </>
  );
}

/**
 * Cartão do negócio.
 *
 * A linha de baixo é a que importa no dia a dia: quem responde pelo negócio e
 * o que ficou combinado. Sem passo combinado, o cartão diz isso em amarelo —
 * é a única forma de um negócio sumir do radar sem ninguém perceber.
 */
function Cartao({
  n,
  arrastando,
  aoArrastar,
  aoSoltar,
  aoAbrir,
}: {
  n: NegocioQuadro;
  arrastando: boolean;
  aoArrastar: () => void;
  aoSoltar: () => void;
  aoAbrir: () => void;
}) {
  const temp = temperatura(n.temperatura);
  const parado = diasDesde(n.etapa_desde);
  const atrasada = !!n.proxima && n.proxima.vence_em.slice(0, 10) < hoje();

  return (
    <button
      type="button"
      draggable
      onDragStart={aoArrastar}
      onDragEnd={aoSoltar}
      onClick={aoAbrir}
      className={cn(
        "cartao foco-anel w-full cursor-pointer rounded-md p-3.5 text-left transition-colors hover:border-mrg-500/40 active:cursor-grabbing",
        arrastando && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-tinta">{n.titulo}</h4>
        <temp.Icone className="size-3.5 shrink-0 text-cinza" />
      </div>
      {n.contato && <p className="mt-1 truncate text-xs text-cinza">{n.contato}</p>}

      <p className="font-display mt-3 text-base font-bold tabular-nums text-tinta">
        {brl(n.valor_mensal)}
        <span className="text-xs font-normal text-cinza">/mês</span>
      </p>
      {n.valor_unico > 0 && (
        <p className="text-[11px] text-cinza-claro">+ {brl(n.valor_unico)} de setup</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Etiqueta tom={temp.tom}>{temp.r}</Etiqueta>
        {n.origem && <Etiqueta>{rotuloOrigem(n.origem)}</Etiqueta>}
        {parado >= PARADO && (
          <Etiqueta tom={parado >= 14 ? "perigo" : "alerta"}>
            <Clock className="mr-1 inline size-3" />
            {numero(parado)} d parado
          </Etiqueta>
        )}
      </div>

      {/* Próximo passo */}
      <div className="mt-3 border-t border-borda-fraca pt-2.5">
        {n.proxima ? (
          <p
            className={cn(
              "flex items-center gap-1.5 text-[11px]",
              atrasada ? "font-semibold text-perigo" : "text-grafite",
            )}
          >
            <AlarmClock className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {n.proxima.titulo ?? "Próximo passo"}
            </span>
            <span className="shrink-0 tabular-nums">
              {dataCurta(n.proxima.vence_em.slice(0, 10))}
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-alerta">
            <TriangleAlert className="size-3.5 shrink-0" />
            Sem próximo passo
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          {n.responsavel ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <Avatar nome={n.responsavel} medida="sm" />
              <span className="truncate text-[11px] text-cinza">{n.responsavel}</span>
            </span>
          ) : (
            <span className="text-[11px] text-cinza-claro">Sem responsável</span>
          )}
          {n.previsao && (
            <span className="shrink-0 text-[11px] tabular-nums text-cinza-claro">
              prev. {dataCurta(n.previsao)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/** Pílula de alternância: acende quando o filtro está valendo. */
function Pilula({
  ativo,
  aoClicar,
  children,
  titulo,
}: {
  ativo: boolean;
  aoClicar: () => void;
  children: React.ReactNode;
  titulo?: string;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativo}
      title={titulo}
      className={cn(
        "foco-anel inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
        ativo
          ? "border-mrg-500/50 bg-mrg-500/15 text-acento-forte"
          : "border-borda bg-carta text-cinza hover:border-borda-forte hover:text-tinta",
      )}
    >
      {children}
    </button>
  );
}

/* Um `select` nativo estilizado como pílula: já vem com teclado, busca por
   digitação e o comportamento certo no celular. */
function Menu({
  valor,
  aoMudar,
  children,
  rotulo,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  children: React.ReactNode;
  rotulo: string;
}) {
  return (
    <select
      aria-label={rotulo}
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className={cn(
        "foco-anel cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
        valor
          ? "border-mrg-500/50 bg-mrg-500/15 text-acento-forte"
          : "border-borda bg-carta text-cinza hover:border-borda-forte hover:text-tinta",
      )}
    >
      {children}
    </select>
  );
}
