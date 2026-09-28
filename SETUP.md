# Configuração passo a passo

## 1. Supabase

1. Crie um projeto em <https://supabase.com>.
2. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` *(nunca com prefixo `NEXT_PUBLIC_`)*
3. Aplique as migrations:

```bash
npx supabase login
npx supabase link --project-ref SEU_REF
npx supabase db push
```

Ou cole o conteúdo dos arquivos de `supabase/migrations/` no **SQL Editor**, na ordem numérica.

4. Gere os tipos reais (substitui o stub em `src/types/supabase.ts`):

```bash
npx supabase gen types typescript --linked > src/types/supabase.ts
```

## 2. Primeiro usuário

1. Rode `npm run dev` e acesse `/cadastro`.
2. Confirme o e-mail.
3. No SQL Editor do Supabase, vincule seu usuário à organização como proprietário:

```sql
insert into public.membros_organizacao (organizacao_id, usuario_id, papel)
select o.id, u.id, 'proprietario'
from public.organizacoes o, auth.users u
where o.slug = 'mr-grow' and u.email = 'seu@email.com';
```

## 3. Chave de criptografia

Os tokens OAuth das plataformas são cifrados antes de ir ao banco:

```bash
openssl rand -base64 32
```

Cole o resultado em `TOKEN_ENCRYPTION_KEY`.

## 4. Meta (Facebook / Instagram)

1. Crie um app em <https://developers.facebook.com> do tipo **Business**.
2. Adicione o produto **Marketing API**.
3. Em **Configurações → Básico**, copie `App ID` e `App Secret`.
4. Em **Facebook Login → Configurações**, adicione a URI de redirecionamento:
   `https://SEU_DOMINIO/api/integracoes/meta/callback`
5. Preencha `META_APP_ID`, `META_APP_SECRET` e `META_OAUTH_REDIRECT_URI`.

Permissões usadas: `ads_read`, `ads_management`, `business_management`, `read_insights`.

> Para produção o app precisa passar pela **App Review** da Meta. Em desenvolvimento, funciona com as contas de quem é admin do app.

### Pixel + Conversions API
- `NEXT_PUBLIC_META_PIXEL_ID`: id do pixel.
- `META_CAPI_ACCESS_TOKEN`: gerado em **Gerenciador de Eventos → Configurações → API de Conversões**.
- O Pixel e a CAPI enviam o mesmo `event_id`, então a Meta deduplica automaticamente.

## 5. Google (Ads + Analytics 4)

1. Crie um projeto no <https://console.cloud.google.com>.
2. Ative as APIs **Google Ads API** e **Google Analytics Data API**.
3. Em **Credenciais → Criar credencial → ID do cliente OAuth** (tipo *Aplicativo da Web*), adicione:
   `https://SEU_DOMINIO/api/integracoes/google/callback`
4. Preencha `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_OAUTH_REDIRECT_URI`.
5. Solicite o **developer token** em <https://ads.google.com> → Ferramentas → Central de API e preencha `GOOGLE_ADS_DEVELOPER_TOKEN`.
6. Se você opera pelo MCC, informe `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.

## 6. Cron e sincronização

`vercel.json` já agenda, em UTC:
- `/api/cron/sincronizar` às 09:00 UTC, 06h de Brasília — traz métricas de Meta, Google Ads e GA4, prontas antes de o time chegar.
- `/api/cron/automacoes` às 11:00 UTC, 08h de Brasília — avalia faturas, contratos e tarefas dentro do horário comercial, porque dispara cobrança e alerta.

**Por que uma vez ao dia:** o plano Hobby da Vercel só aceita cron diário e no máximo dois jobs. A cadência original era de 4 em 4 horas e de hora em hora, o que faz o deploy ser recusado. No plano Pro, volte para `0 */4 * * *` e `0 * * * *`: os dados ficam mais frescos e as automações de tempo reagem mais rápido.

Fora da Vercel não existe esse limite. Agende na cadência que quiser chamando as rotas direto.

Gere um `CRON_SECRET` (`openssl rand -hex 24`) e cadastre nas variáveis da Vercel. Fora da Vercel, agende com qualquer scheduler chamando:

```
GET /api/cron/sincronizar
Authorization: Bearer SEU_CRON_SECRET
```

## 7. Deploy na Hostinger (hospedagem Node)

O servidor da Hostinger tem glibc antiga, e isso impõe quatro coisas.
As três primeiras já estão no repositório; a quarta é do envio.

1. **`output: "standalone"`** no `next.config.mjs`. É o formato que a
   Hostinger executa, a partir de `.next/standalone/server.js`.

2. **Config em `.mjs`, não em `.ts`.** O SWC nativo não carrega lá
   (`GLIBC_2.29 not found`) e o build cai no SWC em WASM, que não
   transpila config em TypeScript. O build morre antes de começar, com
   `ERR_MODULE_NOT_FOUND` apontando para o próprio `next.config`.

3. **Build por webpack.** O Turbopack exige binários nativos, que é
   justamente o que falta. Por isso existe o script `build:webpack`. O
   `build` normal segue em Turbopack para uso local e na Vercel, que são
   mais rápidos.

4. **Node 22.** Os pacotes do Supabase declaram `node: >=22.0.0`. Em
   Node 20 o build passa, com aviso `EBADENGINE`, e o painel quebra em
   execução.

### Enviando

O pacote sai do git, que já exclui o que está no `.gitignore`. A pasta
`imagenssite/` é excluída à mão: são 120 MB de originais que o site não
usa, ele serve de `public/`.

```
git archive --format=zip -o mrgrow.zip HEAD -- . ':(exclude)imagenssite'
```

Depois, pela API: `Deploy JS application` para subir o arquivo e, em
seguida, `Start Node.js build` com `node_version: 22` e
`build_script: build:webpack`.

São dois passos de propósito. O deploy detecta as configurações a partir
do arquivo e ignora as que estão salvas, então ele sempre dispara um
build em Node 20 com Turbopack, que falha. O segundo comando substitui
esse build. Cadastrar as configurações antes não evita isso.

### Variáveis

`NEXT_PUBLIC_SITE_URL` precisa apontar para o domínio, senão os links
das propostas saem para o endereço errado. Como o Next assa as
`NEXT_PUBLIC_*` no build, mudá-las exige um build novo: reiniciar o
processo não basta.

## 8. Deploy na Vercel

```bash
npx vercel
```

Cadastre todas as variáveis do `.env.example` em **Settings → Environment Variables** e atualize `NEXT_PUBLIC_SITE_URL` e as URIs de redirecionamento OAuth para o domínio final.

## 9. Integrações opcionais

| Serviço | Variável | Para quê |
|---|---|---|
| Resend | `RESEND_API_KEY`, `RESEND_FROM` | E-mails das automações e relatórios |
| WhatsApp Cloud API | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Templates de lead e cobrança |
| Asaas | `ASAAS_API_KEY` | Cobrança, link de pagamento e baixa automática |
| Slack | `SLACK_WEBHOOK_URL` | Alertas de performance no canal da equipe |

Os pontos de conexão já existem em `src/lib/automacoes.ts` (ações `email` e `whatsapp`) e em `src/app/api/webhooks/pagamento/route.ts`.
