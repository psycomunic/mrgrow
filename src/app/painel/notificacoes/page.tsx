import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Etiqueta } from "@/components/ui/etiqueta";

export const metadata: Metadata = { title: "Notificações" };

const NOTIFICACOES = [
  { id: "n1", titulo: "Novo lead quente", texto: "Loja Bella Fiore preencheu o diagnóstico · pontuação 78", tempo: "há 6 min", tom: "azul" as const },
  { id: "n2", titulo: "ROAS abaixo da meta", texto: "Sabor & Cia · ROAS 2,7x nos últimos 7 dias (meta 3,5x)", tempo: "há 2 h", tom: "alerta" as const },
  { id: "n3", titulo: "Fatura atrasada", texto: "Sabor & Cia · R$ 2.500 vencidos em 10/08", tempo: "ontem", tom: "perigo" as const },
  { id: "n4", titulo: "Proposta visualizada", texto: "Studio Nova Pele abriu a PRP-2026-040", tempo: "ontem", tom: "sucesso" as const },
];

export default function PaginaNotificacoes() {
  return (
    <>
      <Topo titulo="Notificações" descricao="Alertas das automações e da operação." />
      <div className="space-y-3 p-5 sm:p-8">
        {NOTIFICACOES.map((n) => (
          <article key={n.id} className="cartao flex items-start justify-between gap-4 rounded-lg p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-tinta">{n.titulo}</h2>
                <Etiqueta tom={n.tom}>novo</Etiqueta>
              </div>
              <p className="mt-1 text-sm text-grafite">{n.texto}</p>
            </div>
            <span className="shrink-0 text-xs text-cinza-claro">{n.tempo}</span>
          </article>
        ))}
      </div>
    </>
  );
}
