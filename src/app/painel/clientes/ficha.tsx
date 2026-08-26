"use client";

import { useEffect } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  FileText,
  Instagram,
  Plug,
  User,
  X,
} from "lucide-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { brl, dataCompleta, iniciais } from "@/lib/utils";
import type { ClienteCarteira } from "@/lib/clientes";

const TOM: Record<string, "sucesso" | "azul" | "alerta" | "neutro"> = {
  ativo: "sucesso",
  onboarding: "azul",
  pausado: "alerta",
  encerrado: "neutro",
  prospecto: "neutro",
};

const ROTULO_STATUS: Record<string, string> = {
  ativo: "Ativo",
  onboarding: "Onboarding",
  pausado: "Pausado",
  encerrado: "Encerrado",
  prospecto: "Prospecto",
};

function corSaude(v: number) {
  if (v >= 80) return "bg-sucesso";
  if (v >= 60) return "bg-alerta";
  return "bg-perigo";
}

function leituraSaude(v: number) {
  if (v >= 80) return "Conta saudável";
  if (v >= 60) return "Merece atenção";
  return "Risco de saída";
}

/**
 * Ficha do cliente em painel lateral: o suficiente para decidir sem sair da
 * carteira. A análise a fundo (gráfico, tarefas, financeiro) segue na página
 * própria, ligada aqui pelo botão de abrir.
 */
export function FichaCliente({
  cliente,
  aoFechar,
}: {
  cliente: ClienteCarteira;
  aoFechar: () => void;
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const anual = cliente.fee_mensal * 12;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-papel/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={cliente.nome}
        className="flex h-full w-full max-w-xl flex-col border-l border-borda bg-papel shadow-2xl"
      >
        <header className="border-b border-borda px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-mrg-500/30 to-mrg-800/30 font-display text-base font-bold text-mrg-700 ring-1 ring-borda">
                {iniciais(cliente.nome)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl font-extrabold text-tinta">
                  {cliente.nome}
                </h2>
                <p className="mt-0.5 text-sm text-cinza">{cliente.segmento ?? "Sem segmento"}</p>
              </div>
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
            <Etiqueta tom={TOM[cliente.status] ?? "neutro"}>
              {ROTULO_STATUS[cliente.status] ?? cliente.status}
            </Etiqueta>
            {cliente.responsavel && (
              <Etiqueta>
                <User className="mr-1 inline size-3" />
                {cliente.responsavel}
              </Etiqueta>
            )}
            <Etiqueta>Vence dia {cliente.dia_vencimento}</Etiqueta>
          </div>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {/* Saúde primeiro: é o que decide se a conta precisa de atenção. */}
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
                Saúde da conta
              </h3>
              <span className="text-sm text-grafite">
                <strong className="font-display text-lg font-extrabold text-tinta">
                  {cliente.saude}
                </strong>
                <span className="text-cinza-claro">/100</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-nevoa-2">
              <div
                className={`h-full ${corSaude(cliente.saude)}`}
                style={{ width: `${cliente.saude}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-cinza">{leituraSaude(cliente.saude)}</p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Bloco rotulo="Fee mensal" valor={brl(cliente.fee_mensal)} nota="recorrente" destaque />
            <Bloco rotulo="Fee em 12 meses" valor={brl(anual)} nota="valor do contrato" />
            <Bloco
              rotulo="Mídia prevista"
              valor={brl(cliente.investimento_previsto)}
              nota="no mês, pago às plataformas"
            />
            <Bloco
              rotulo="ROAS"
              valor={cliente.roas ? `${cliente.roas.toFixed(1)}x` : "—"}
              nota={cliente.roas ? "retorno sobre a mídia" : "sem dado sincronizado"}
            />
          </section>

          <section>
            <h3 className="mb-3 text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
              Contrato
            </h3>
            <dl className="divide-y divide-borda rounded-lg border border-borda">
              <Linha
                rotulo="Início"
                valor={cliente.inicio_contrato ? dataCompleta(cliente.inicio_contrato) : "—"}
                Icone={CalendarDays}
              />
              <Linha
                rotulo="Término"
                valor={cliente.fim_contrato ? dataCompleta(cliente.fim_contrato) : "Sem data final"}
                Icone={CalendarDays}
              />
              <Linha
                rotulo="NPS"
                valor={cliente.nps !== null ? `${cliente.nps} de 10` : "Ainda não medido"}
                Icone={ArrowUpRight}
              />
            </dl>
          </section>

          {(cliente.site || cliente.instagram) && (
            <section>
              <h3 className="mb-3 text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
                Links
              </h3>
              <div className="flex flex-wrap gap-2">
                {cliente.site && (
                  <a
                    href={cliente.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-borda bg-nevoa px-3 py-2 text-sm text-grafite transition-colors hover:bg-nevoa-2 foco-anel"
                  >
                    <ExternalLink className="size-3.5" /> Site
                  </a>
                )}
                {cliente.instagram && (
                  <a
                    href={`https://instagram.com/${cliente.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-borda bg-nevoa px-3 py-2 text-sm text-grafite transition-colors hover:bg-nevoa-2 foco-anel"
                  >
                    <Instagram className="size-3.5" /> {cliente.instagram}
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-borda px-6 py-4">
          <BotaoLink href={`/painel/clientes/${cliente.slug}`} tamanho="sm">
            Abrir ficha completa
            <ArrowUpRight className="size-4" />
          </BotaoLink>
          <BotaoLink
            href={`/painel/relatorios?cliente=${cliente.slug}`}
            variante="contorno"
            tamanho="sm"
          >
            <FileText className="size-4" />
            Relatório
          </BotaoLink>
          <BotaoLink href="/painel/integracoes" variante="contorno" tamanho="sm">
            <Plug className="size-4" />
            Contas
          </BotaoLink>
          <Botao variante="fantasma" tamanho="sm" className="ml-auto" onClick={aoFechar}>
            Fechar
          </Botao>
        </footer>
      </aside>
    </div>
  );
}

function Bloco({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-md border border-borda bg-nevoa p-3.5">
      <p className="text-[11px] tracking-wider text-cinza-claro uppercase">{rotulo}</p>
      <p
        className={`mt-1.5 font-display font-extrabold text-tinta ${destaque ? "text-xl" : "text-base"}`}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-[11px] text-cinza-claro">{nota}</p>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  Icone,
}: {
  rotulo: string;
  valor: string;
  Icone: typeof CalendarDays;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-cinza">
        <Icone className="size-3.5 text-cinza-claro" />
        {rotulo}
      </dt>
      <dd className="text-sm font-medium text-tinta">{valor}</dd>
    </div>
  );
}

export { TOM, ROTULO_STATUS, corSaude };
