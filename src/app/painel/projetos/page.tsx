import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Projetos" };

const PROJETOS = [
  { id: "p1", nome: "Onboarding · EducaMais", cliente: "EducaMais", status: "ativo", progresso: 45, prazo: "2026-09-05", responsavel: "Mateus" },
  { id: "p2", nome: "Nova landing page · Sabor & Cia", cliente: "Sabor & Cia", status: "ativo", progresso: 70, prazo: "2026-09-02", responsavel: "Equipe" },
  { id: "p3", nome: "Rastreamento server-side · Vitrine Prime", cliente: "Vitrine Prime", status: "ativo", progresso: 88, prazo: "2026-08-29", responsavel: "Mateus" },
  { id: "p4", nome: "Reestruturação de campanhas · Construtora Vértice", cliente: "Construtora Vértice", status: "pausado", progresso: 30, prazo: "2026-09-20", responsavel: "Equipe" },
  { id: "p5", nome: "Produção de criativos Q3 · Clínica Aurora", cliente: "Clínica Aurora", status: "ativo", progresso: 62, prazo: "2026-09-15", responsavel: "Equipe" },
  { id: "p6", nome: "Reativação · AutoNorte", cliente: "AutoNorte Seminovos", status: "concluido", progresso: 100, prazo: "2026-08-20", responsavel: "Mateus" },
];

export default function PaginaProjetos() {
  const demo = !supabaseConfigurado();

  return (
    <>
      <Topo
        titulo="Projetos"
        descricao="Entregas por cliente com prazo, responsável e progresso."
        acao={<BotaoLink href="/painel/projetos/novo" tamanho="sm">Novo projeto</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PROJETOS.map((p) => (
            <article key={p.id} className="cartao rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-tinta">{p.nome}</h3>
                <Etiqueta tom={p.status === "ativo" ? "azul" : p.status === "concluido" ? "sucesso" : "alerta"}>
                  {p.status}
                </Etiqueta>
              </div>
              <p className="mt-1 text-xs text-cinza">{p.cliente} · {p.responsavel}</p>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-[11px] text-cinza-claro">
                  <span>Progresso</span>
                  <span>{p.progresso}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-nevoa-2">
                  <div className="h-full bg-gradient-to-r from-mrg-600 to-mrg-400" style={{ width: `${p.progresso}%` }} />
                </div>
              </div>

              <p className="mt-4 text-xs text-cinza-claro">Prazo: {dataCompleta(p.prazo)}</p>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
