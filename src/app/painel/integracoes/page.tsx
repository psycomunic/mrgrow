import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert, KeyRound, Plug, TriangleAlert } from "lucide-react";
import { Topo } from "../_componentes/topo";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { BotaoSincronizar } from "../metricas/botao-sincronizar";
import { STATUS_INTEGRACAO } from "@/lib/rotulos";
import { carregarIntegracoes, credenciaisConfiguradas, type Integracao } from "@/lib/integracoes";
import { dataCompleta, numero } from "@/lib/utils";

export const metadata: Metadata = { title: "Integrações" };

type Item = {
  provedor: string;
  nome: string;
  descricao: string;
  escopos: string[];
  rota: string;
  /** Qual credencial do servidor esta plataforma precisa. */
  exige: "meta" | "google" | "googleAds" | "manual";
  /** O que a pessoa precisa obter, quando falta credencial. */
  comoObter?: string;
};

const CATALOGO: Item[] = [
  {
    provedor: "meta_ads",
    nome: "Meta Ads",
    descricao: "Contas de anúncio, campanhas, criativos e insights do Facebook e Instagram.",
    escopos: ["ads_read", "ads_management", "business_management"],
    rota: "/api/integracoes/meta/conectar",
    exige: "meta",
    comoObter:
      "Crie um app em developers.facebook.com, adicione o produto Marketing API e peça revisão para ads_read. Depois traga o ID e a chave secreta do app.",
  },
  {
    provedor: "google_ads",
    nome: "Google Ads",
    descricao: "Search, Performance Max e YouTube — custo, conversões e valor de conversão.",
    escopos: ["adwords"],
    rota: "/api/integracoes/google/conectar",
    exige: "googleAds",
    comoObter:
      "Crie credenciais OAuth no Google Cloud Console e peça um token de desenvolvedor no Google Ads API Center. O token leva alguns dias para ser liberado.",
  },
  {
    provedor: "google_analytics",
    nome: "Google Analytics 4",
    descricao: "Sessões, usuários, conversões e receita da propriedade do cliente.",
    escopos: ["analytics.readonly"],
    rota: "/api/integracoes/google/conectar",
    exige: "google",
    comoObter:
      "Crie credenciais OAuth no Google Cloud Console com a API do Analytics habilitada. Não precisa de revisão para leitura.",
  },
  {
    provedor: "whatsapp",
    nome: "WhatsApp Business",
    descricao: "Disparo de templates para leads e cobranças automatizadas.",
    escopos: ["whatsapp_business_messaging"],
    rota: "/painel/configuracoes",
    exige: "manual",
  },
  {
    provedor: "asaas",
    nome: "Asaas",
    descricao: "Emissão de cobrança, link de pagamento e baixa automática de faturas.",
    escopos: ["cobrancas"],
    rota: "/painel/configuracoes",
    exige: "manual",
  },
  {
    provedor: "slack",
    nome: "Slack",
    descricao: "Alertas de performance e novos leads direto no canal da equipe.",
    escopos: ["incoming-webhook"],
    rota: "/painel/configuracoes",
    exige: "manual",
  },
];

export default async function PaginaIntegracoes() {
  const [{ integracoes, demo }, cred] = await Promise.all([
    carregarIntegracoes(),
    Promise.resolve(credenciaisConfiguradas()),
  ]);

  const porProvedor = new Map(integracoes.map((i) => [i.provedor, i]));
  const conectadas = integracoes.filter((i) => i.status === "conectada").length;

  /* Uma plataforma só pode ser conectada quando a credencial dela existe
     no servidor. Sem isso, o botão manda a pessoa para uma tela de erro
     do próprio Meta ou do Google, que não explica nada. */
  const pronta = (item: Item) => {
    if (!cred.cifra) return false;
    if (item.exige === "manual") return true;
    if (item.exige === "meta") return cred.meta;
    if (item.exige === "google") return cred.google;
    return cred.google && cred.googleAdsToken;
  };

  const faltando = CATALOGO.filter((i) => i.exige !== "manual" && !pronta(i));

  return (
    <>
      <Topo
        titulo="Central de integrações"
        descricao="Conecte as contas dos clientes uma vez — os dados chegam sozinhos todo dia."
        acao={<BotaoSincronizar />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {demo && <AvisoDemo />}

        {/* O aviso vem antes dos cartões: sem credencial, nenhum botão
            funciona, e descobrir isso depois de clicar é pior. */}
        {faltando.length > 0 && (
          <div className="rounded-lg border border-alerta/40 bg-alerta/8 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-alerta" />
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-tinta">
                  Falta cadastrar as credenciais das plataformas
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-grafite">
                  {cred.cifra
                    ? "As conexões usam OAuth: cada plataforma exige um app registrado em nome da agência, e é a chave desse app que vai no servidor. Enquanto ela não existir, o botão de conectar leva a uma tela de erro da própria plataforma."
                    : "A chave de cifra dos tokens (TOKEN_ENCRYPTION_KEY) não está configurada. Sem ela nenhum token pode ser guardado com segurança, e nenhuma conexão se completa."}
                </p>

                <ul className="mt-4 space-y-3">
                  {faltando.map((i) => (
                    <li key={i.provedor} className="rounded-md border border-borda bg-carta p-3.5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
                        <KeyRound className="size-4 text-alerta" />
                        {i.nome}
                      </p>
                      {i.comoObter && (
                        <p className="mt-1 text-[13px] leading-relaxed text-grafite">
                          {i.comoObter}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="cartao flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Plug className="mt-0.5 size-5 text-acento" />
            <div>
              <h2 className="font-display text-base font-bold text-tinta">Como funciona</h2>
              <p className="mt-1 max-w-2xl text-sm text-grafite">
                Cada conexão usa OAuth oficial da plataforma. Os tokens são cifrados com AES-256
                antes de ir para o banco e um job diário traz investimento, impressões, cliques,
                leads e receita para o painel — por cliente e por campanha.
              </p>
              <p className="mt-2 text-xs text-cinza">
                {conectadas === 0
                  ? "Nenhuma plataforma conectada ainda."
                  : `${numero(conectadas)} ${conectadas === 1 ? "plataforma conectada" : "plataformas conectadas"}.`}
              </p>
            </div>
          </div>
          <BotaoLink href="/painel/configuracoes" variante="contorno" tamanho="sm">
            Ver credenciais
          </BotaoLink>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CATALOGO.map((item) => (
            <Cartao
              key={item.provedor}
              item={item}
              integracao={porProvedor.get(item.provedor) ?? null}
              pronta={pronta(item)}
            />
          ))}
        </section>
      </div>
    </>
  );
}

function Cartao({
  item,
  integracao,
  pronta,
}: {
  item: Item;
  integracao: Integracao | null;
  pronta: boolean;
}) {
  const status = integracao?.status ?? "desconectada";
  const conectada = status === "conectada";
  const comErro = Boolean(integracao?.ultimoErro);

  return (
    <article className="cartao flex flex-col rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-bold text-tinta">{item.nome}</h3>
        <Etiqueta tom={comErro ? "perigo" : STATUS_INTEGRACAO.tom(status)}>
          {conectada && !comErro ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <CircleAlert className="size-3" />
          )}
          {comErro ? "Com erro" : STATUS_INTEGRACAO.rotulo(status)}
        </Etiqueta>
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-grafite">{item.descricao}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.escopos.map((e) => (
          <span
            key={e}
            className="rounded bg-nevoa px-1.5 py-0.5 font-mono text-[10px] text-cinza"
          >
            {e}
          </span>
        ))}
      </div>

      {comErro && (
        <p className="mt-4 rounded-md border border-perigo/30 bg-perigo/8 p-2.5 text-[12px] leading-snug text-perigo">
          {integracao?.ultimoErro}
        </p>
      )}

      {conectada && (
        <div className="mt-4 space-y-1 text-xs text-cinza-claro">
          {integracao?.contaNome && (
            <p className="truncate text-cinza">Conta: {integracao.contaNome}</p>
          )}
          <p>
            {/* "1 conta vinculada", não "1 conta(s) vinculada(s)": o
                parêntese de plural denuncia texto não escrito para ser lido. */}
            {integracao?.contas.length
              ? `${numero(integracao.contas.length)} ${integracao.contas.length === 1 ? "conta vinculada" : "contas vinculadas"}`
              : "Nenhuma conta vinculada ainda"}
          </p>
          <p>
            {integracao?.ultimaSincronizacao
              ? `Sincronizado em ${dataCompleta(integracao.ultimaSincronizacao.slice(0, 10))}`
              : "Ainda não sincronizou"}
          </p>
        </div>
      )}

      {/* Sem credencial no servidor, o botão vira aviso: mandar para o
          OAuth de um app que não existe só produz erro da plataforma. */}
      {pronta ? (
        <BotaoLink
          href={item.rota}
          variante={conectada ? "contorno" : "primario"}
          largura="cheia"
          className="mt-5"
        >
          {conectada ? "Gerenciar contas" : "Conectar"}
        </BotaoLink>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-borda px-3 py-2.5 text-center">
          <p className="text-xs font-medium text-cinza">Credencial não configurada</p>
          <Link
            href="/painel/configuracoes"
            className="foco-anel mt-0.5 inline-block text-[11px] text-acento hover:underline"
          >
            Ver o que falta
          </Link>
        </div>
      )}
    </article>
  );
}
