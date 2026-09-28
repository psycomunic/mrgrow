/**
 * Gera os modelos de e-mail do Supabase Auth.
 *
 * Os seis e-mails compartilham a mesma moldura, então eles saem de uma
 * base só: mudar a cor da marca ou o rodapé é uma edição, não seis.
 *
 * O HTML é em tabela e com estilo em linha de propósito. Cliente de
 * e-mail não é navegador: Outlook ignora `flex`, `grid` e boa parte de
 * `<style>` no `<head>`, e Gmail remove folha de estilo externa. Tabela
 * aninhada com `style=""` é o que renderiza igual em todos.
 *
 * Uso: node supabase/emails/gerar.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));

const SITE = "https://darksalmon-badger-833323.hostingersite.com";
const LOGO = `${SITE}/marca/mr-grow-logo-email.png`;

const AZUL = "#1668f5";
const ESCURO = "#0c0e13";
const TINTA = "#0f172a";
const CINZA = "#64748b";
const BORDA = "#e8edf4";
const FUNDO = "#f4f6f9";

/**
 * Moldura comum.
 *
 * O bloco do cabeçalho é escuro porque a logo da MR Grow é clara e
 * sumiria no branco — e porque a identidade da marca é azul sobre preto.
 * O corpo volta ao branco, que é onde texto longo se lê melhor.
 */
function moldura({ titulo, texto, botao, url, rodape, alerta, codigo }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:${FUNDO};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${FUNDO};padding:32px 16px;">
<tr><td align="center">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDA};border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <tr>
    <td align="center" style="background:${ESCURO};padding:28px 24px;">
      <!-- O estilo no <img> é herdado pelo texto alternativo quando a
           imagem não carrega. Muito cliente de e-mail bloqueia imagem
           remota por padrão, e sem isto o cabeçalho vira um ícone
           quebrado; com isto, vira "MR Grow" em branco sobre o escuro,
           que é uma falha que não parece falha. -->
      <img src="${LOGO}" alt="MR Grow" width="128" height="66"
           style="display:block;border:0;width:128px;height:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;line-height:66px;text-decoration:none;">
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 8px;">
      <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;color:${TINTA};">${titulo}</h1>
    </td>
  </tr>

  <tr>
    <td style="padding:0 32px 24px;">
      <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#334155;">${texto}</p>
    </td>
  </tr>
${
  codigo
    ? `
  <tr>
    <td align="center" style="padding:0 32px 8px;">
      <div style="display:inline-block;background:${FUNDO};border:1px solid ${BORDA};border-radius:12px;padding:16px 28px;font-size:30px;letter-spacing:8px;font-weight:700;color:${TINTA};">{{ .Token }}</div>
    </td>
  </tr>`
    : `
  <tr>
    <td align="center" style="padding:0 32px 8px;">
      <a href="${url}" style="display:inline-block;background:${AZUL};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:999px;">${botao}</a>
    </td>
  </tr>

  <tr>
    <td style="padding:16px 32px 0;">
      <p style="margin:0;font-size:12px;line-height:1.6;color:${CINZA};">
        Se o botão não funcionar, copie e cole este endereço no navegador:<br>
        <span style="color:${AZUL};word-break:break-all;">${url}</span>
      </p>
    </td>
  </tr>`
}
${
  alerta
    ? `
  <tr>
    <td style="padding:20px 32px 0;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:${CINZA};background:${FUNDO};border-radius:10px;padding:14px 16px;">${alerta}</p>
    </td>
  </tr>`
    : ""
}

  <tr>
    <td style="padding:28px 32px 32px;">
      <hr style="border:0;border-top:1px solid ${BORDA};margin:0 0 16px;">
      <p style="margin:0;font-size:12px;line-height:1.6;color:${CINZA};">
        ${rodape}
      </p>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
        <strong style="color:${TINTA};">MR Grow</strong> · Estratégia, conteúdo e tráfego<br>
        <a href="${SITE}" style="color:${AZUL};text-decoration:none;">${SITE.replace("https://", "")}</a>
      </p>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

const NAO_PEDIU =
  "Se você não pediu isso, pode ignorar este e-mail — nada acontece sem a confirmação acima.";

const MODELOS = [
  {
    arquivo: "1-confirmar-cadastro.html",
    assunto: "Confirme seu e-mail · MR Grow",
    titulo: "Confirme seu e-mail",
    texto:
      "Falta um passo para o seu acesso ao painel da MR Grow ficar pronto. Toque no botão abaixo para confirmar que este e-mail é seu.",
    botao: "Confirmar e-mail",
    url: "{{ .ConfirmationURL }}",
    rodape: NAO_PEDIU,
  },
  {
    arquivo: "2-convite.html",
    assunto: "Você foi convidado para o painel da MR Grow",
    titulo: "Seu acesso ao painel está pronto",
    texto:
      "Você foi convidado para a plataforma da MR Grow — onde ficam o funil comercial, a operação das contas e os relatórios de mídia. Crie sua senha para entrar.",
    botao: "Criar minha senha",
    url: "{{ .ConfirmationURL }}",
    rodape:
      "O convite vale por 7 dias. Depois disso, peça um novo a quem administra a conta.",
  },
  {
    arquivo: "3-link-magico.html",
    assunto: "Seu link de acesso · MR Grow",
    titulo: "Entre sem senha",
    texto:
      "Use o botão abaixo para entrar no painel da MR Grow. O link vale uma única vez e expira em poucos minutos.",
    botao: "Entrar no painel",
    url: "{{ .ConfirmationURL }}",
    rodape: NAO_PEDIU,
  },
  {
    arquivo: "4-trocar-email.html",
    assunto: "Confirme seu novo e-mail · MR Grow",
    titulo: "Confirme seu novo e-mail",
    texto:
      "Recebemos um pedido para trocar o e-mail da sua conta de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>. Confirme para concluir.",
    botao: "Confirmar troca",
    url: "{{ .ConfirmationURL }}",
    alerta:
      "Até confirmar, o acesso continua pelo e-mail antigo. Se não foi você quem pediu, ignore e avise quem administra a conta.",
    rodape: "O endereço de entrada só muda depois desta confirmação.",
  },
  {
    arquivo: "5-redefinir-senha.html",
    assunto: "Redefinir sua senha · MR Grow",
    titulo: "Redefinir sua senha",
    texto:
      "Recebemos um pedido para criar uma senha nova para <strong>{{ .Email }}</strong>. Toque no botão abaixo para escolher a nova.",
    botao: "Criar nova senha",
    url: "{{ .ConfirmationURL }}",
    alerta:
      "Se não foi você, ignore este e-mail: sua senha atual continua valendo e ninguém entra sem abrir o link acima.",
    rodape: "Por segurança, o link vale por 1 hora e só pode ser usado uma vez.",
  },
  {
    arquivo: "6-reautenticacao.html",
    assunto: "Seu código de confirmação · MR Grow",
    titulo: "Seu código de confirmação",
    texto:
      "Para concluir esta operação no painel, informe o código abaixo. Ele vale por poucos minutos.",
    codigo: true,
    alerta:
      "Ninguém da MR Grow vai pedir este código por WhatsApp, telefone ou e-mail. Se pedirem, não passe.",
    rodape: "Se você não estava fazendo nada agora, troque sua senha por precaução.",
  },
];

mkdirSync(AQUI, { recursive: true });

const indice = ["# Modelos de e-mail do Supabase Auth", "", "| Arquivo | Assunto |", "|---|---|"];

for (const m of MODELOS) {
  writeFileSync(join(AQUI, m.arquivo), moldura(m), "utf8");
  indice.push(`| \`${m.arquivo}\` | ${m.assunto} |`);
  console.log(`  ${m.arquivo}`);
}

writeFileSync(join(AQUI, "ASSUNTOS.md"), indice.join("\n") + "\n", "utf8");
console.log("\n  ASSUNTOS.md");
