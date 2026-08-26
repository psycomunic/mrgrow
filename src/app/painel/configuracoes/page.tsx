import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { Campo, Entrada } from "@/components/ui/campo";
import { Botao } from "@/components/ui/botao";

export const metadata: Metadata = { title: "Configurações" };

const VARIAVEIS = [
  { chave: "NEXT_PUBLIC_SUPABASE_URL", nota: "URL do projeto no Supabase" },
  { chave: "NEXT_PUBLIC_SUPABASE_ANON_KEY", nota: "Chave pública (anon)" },
  { chave: "SUPABASE_SERVICE_ROLE_KEY", nota: "Somente server-side — nunca exponha" },
  { chave: "TOKEN_ENCRYPTION_KEY", nota: "openssl rand -base64 32" },
  { chave: "META_APP_ID / META_APP_SECRET", nota: "App da Meta com Marketing API" },
  { chave: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET", nota: "Projeto no Google Cloud" },
  { chave: "GOOGLE_ADS_DEVELOPER_TOKEN", nota: "Token de desenvolvedor do Google Ads" },
  { chave: "NEXT_PUBLIC_META_PIXEL_ID / META_CAPI_ACCESS_TOKEN", nota: "Pixel + API de Conversões" },
  { chave: "CRON_SECRET", nota: "Protege as rotas /api/cron/*" },
];

export default function PaginaConfiguracoes() {
  return (
    <>
      <Topo titulo="Configurações" descricao="Dados da agência, marca e credenciais das integrações." />

      <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-2">
        <section className="cartao rounded-lg p-6">
          <h2 className="font-display text-base font-bold text-tinta">Dados da agência</h2>
          <p className="mt-1 text-sm text-cinza">Aparecem em propostas, relatórios e no portal do cliente.</p>

          <form className="mt-6 space-y-4">
            <Campo rotulo="Nome"><Entrada defaultValue="MR Grow" /></Campo>
            <Campo rotulo="CNPJ"><Entrada placeholder="00.000.000/0001-00" /></Campo>
            <Campo rotulo="E-mail de contato"><Entrada type="email" defaultValue="contato@mrgrow.com.br" /></Campo>
            <Campo rotulo="WhatsApp comercial"><Entrada placeholder="(00) 00000-0000" /></Campo>
            <Campo rotulo="Cor primária" dica="Usada no painel, nas propostas e nos relatórios.">
              <Entrada defaultValue="#1668f5" />
            </Campo>
            <Botao type="button">Salvar alterações</Botao>
          </form>
        </section>

        <section className="cartao rounded-lg p-6">
          <h2 className="font-display text-base font-bold text-tinta">Credenciais e ambiente</h2>
          <p className="mt-1 text-sm text-cinza">
            Por segurança, chaves ficam no arquivo <code className="text-grafite">.env.local</code> (e nas
            variáveis de ambiente da Vercel) — nunca no banco.
          </p>

          <ul className="mt-6 space-y-2">
            {VARIAVEIS.map((v) => (
              <li key={v.chave} className="rounded-md border border-borda bg-nevoa p-3">
                <p className="font-mono text-xs break-all text-mrg-600">{v.chave}</p>
                <p className="mt-1 text-xs text-cinza">{v.nota}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-md border border-mrg-500/25 bg-mrg-500/8 p-4 text-sm text-grafite">
            <p className="font-semibold text-tinta">Primeiros passos</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-grafite">
              <li>Crie o projeto no Supabase e copie URL e chaves.</li>
              <li>Rode <code className="text-tinta">npx supabase db push</code> para aplicar as migrations.</li>
              <li>Crie seu usuário em <code className="text-tinta">/cadastro</code>.</li>
              <li>Insira seu vínculo em <code className="text-tinta">membros_organizacao</code> como proprietário.</li>
              <li>Conecte Meta e Google na central de integrações.</li>
            </ol>
          </div>
        </section>
      </div>
    </>
  );
}
