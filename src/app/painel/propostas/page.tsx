import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_PROPOSTAS } from "@/lib/demo";
import { brl, dataCompleta, numero } from "@/lib/utils";

export const metadata: Metadata = { title: "Propostas" };

const TOM: Record<string, "neutro" | "azul" | "sucesso" | "perigo" | "alerta"> = {
  rascunho: "neutro", enviada: "azul", visualizada: "alerta", aceita: "sucesso", recusada: "perigo", expirada: "neutro",
};

export default function PaginaPropostas() {
  const demo = !supabaseConfigurado();
  const emAberto = DEMO_PROPOSTAS.filter((p) => ["enviada", "visualizada"].includes(p.status));
  const valorAberto = emAberto.reduce((s, p) => s + p.total, 0);

  return (
    <>
      <Topo
        titulo="Propostas"
        descricao="Documentos comerciais com link público e aceite registrado."
        acao={<BotaoLink href="/painel/propostas/nova" tamanho="sm">Nova proposta</BotaoLink>}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi rotulo="Em aberto" valor={numero(emAberto.length)} detalhe="aguardando resposta" />
          <Kpi rotulo="Valor em negociação" valor={brl(valorAberto)} />
          <Kpi rotulo="Taxa de aceite" valor="41%" variacao={6.2} detalhe="últimos 90 dias" />
          <Kpi rotulo="Tempo médio de resposta" valor="3,4 dias" variacao={-12.5} invertido />
        </section>

        <Tabela>
          <Cabecalhos colunas={["Número", "Título", "Valor", "Validade", "Status", ""]} />
          <tbody>
            {DEMO_PROPOSTAS.map((p) => (
              <Linha key={p.id}>
                <Celula className="font-mono text-xs text-ink-400">{p.numero}</Celula>
                <Celula className="text-white">{p.titulo}</Celula>
                <Celula className="font-semibold text-white">{brl(p.total)}</Celula>
                <Celula className="text-ink-400">{dataCompleta(p.validade)}</Celula>
                <Celula><Etiqueta tom={TOM[p.status]}>{p.status}</Etiqueta></Celula>
                <Celula>
                  <BotaoLink href={`/painel/propostas/${p.id}`} variante="fantasma" tamanho="sm">Abrir</BotaoLink>
                </Celula>
              </Linha>
            ))}
          </tbody>
        </Tabela>
      </div>
    </>
  );
}
