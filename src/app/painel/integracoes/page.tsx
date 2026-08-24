import type { Metadata } from "next";
import { CheckCircle2, CircleAlert, Plug } from "lucide-react";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { BotaoSincronizar } from "../metricas/botao-sincronizar";
import { supabaseConfigurado } from "@/lib/dados";
import { DEMO_INTEGRACOES } from "@/lib/demo";

export const metadata: Metadata = { title: "Integrações" };

const CATALOGO = [
  {
    provedor: "meta_ads",
    nome: "Meta Ads",
    descricao: "Contas de anúncio, campanhas, criativos e insights do Facebook e Instagram.",
    escopos: ["ads_read", "ads_management", "business_management"],
    rota: "/api/integracoes/meta/conectar",
  },
  {
    provedor: "google_ads",
    nome: "Google Ads",
    descricao: "Search, Performance Max e YouTube — custo, conversões e valor de conversão.",
    escopos: ["adwords"],
    rota: "/api/integracoes/google/conectar",
  },
  {
    provedor: "google_analytics",
    nome: "Google Analytics 4",
    descricao: "Sessões, usuários, conversões e receita da propriedade do cliente.",
    escopos: ["analytics.readonly"],
    rota: "/api/integracoes/google/conectar",
  },
  {
    provedor: "whatsapp",
    nome: "WhatsApp Business",
    descricao: "Disparo de templates para leads e cobranças automatizadas.",
    escopos: ["whatsapp_business_messaging"],
    rota: "/painel/configuracoes",
  },
  {
    provedor: "asaas",
    nome: "Asaas",
    descricao: "Emissão de cobrança, link de pagamento e baixa automática de faturas.",
    escopos: ["cobrancas"],
    rota: "/painel/configuracoes",
  },
  {
    provedor: "slack",
    nome: "Slack",
    descricao: "Alertas de performance e novos leads direto no canal da equipe.",
    escopos: ["incoming-webhook"],
    rota: "/painel/configuracoes",
  },
];

export default function PaginaIntegracoes() {
  const demo = !supabaseConfigurado();
  const estado = new Map(DEMO_INTEGRACOES.map((i) => [i.provedor, i]));

  return (
    <>
      <Topo
        titulo="Central de integrações"
        descricao="Conecte as contas dos clientes uma vez — os dados chegam sozinhos todo dia."
        acao={<BotaoSincronizar />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        <div className="cartao-vidro flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Plug className="mt-0.5 size-5 text-mrg-400" />
            <div>
              <h2 className="font-display text-base font-bold text-white">Como funciona</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-300">
                Cada conexão usa OAuth oficial da plataforma. Os tokens são cifrados com AES-256 antes de
                ir para o banco e um job diário traz investimento, impressões, cliques, leads e receita
                para o painel — por cliente e por campanha.
              </p>
            </div>
          </div>
          <BotaoLink href="/painel/configuracoes" variante="contorno" tamanho="sm">
            Ver credenciais
          </BotaoLink>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CATALOGO.map((item) => {
            const atual = estado.get(item.provedor);
            const conectada = atual?.status === "conectada";
            return (
              <article key={item.provedor} className="cartao-vidro flex flex-col rounded-lg p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-bold text-white">{item.nome}</h3>
                  <Etiqueta tom={conectada ? "sucesso" : "neutro"}>
                    {conectada ? <CheckCircle2 className="size-3" /> : <CircleAlert className="size-3" />}
                    {conectada ? "conectada" : "desconectada"}
                  </Etiqueta>
                </div>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-300">{item.descricao}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.escopos.map((e) => (
                    <span key={e} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-400">
                      {e}
                    </span>
                  ))}
                </div>

                {conectada && (
                  <p className="mt-4 text-xs text-ink-500">
                    {atual?.contas} conta(s) vinculada(s) · sincronizado {atual?.ultima}
                  </p>
                )}

                <BotaoLink
                  href={item.rota}
                  variante={conectada ? "contorno" : "primario"}
                  largura="cheia"
                  className="mt-5"
                >
                  {conectada ? "Gerenciar contas" : "Conectar"}
                </BotaoLink>
              </article>
            );
          })}
        </section>
      </div>
    </>
  );
}
