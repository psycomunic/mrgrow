import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Newsreader,
} from "next/font/google";
import { Deck } from "./deck";
import { Slide, Bloco, eco } from "./slide";
import { carregarMarcaPublica, carregarPorToken } from "@/lib/propostas";
import {
  condicoesDosServicos,
  emReais,
  fichaDoServico,
} from "@/lib/servicos-proposta";
import { MARCA } from "@/lib/marca";
import "./deck.css";

/* Três papéis, três vozes.

   O grotesco da Bricolage tem largura levemente comprimida e desenho
   "engenheirado" — serve ao que este documento é: um instrumento, não um
   anúncio. A Newsreader carrega a prosa: quem está decidindo gastar
   milhares por mês lê os parágrafos inteiros, e serifa com itálico de
   verdade sustenta leitura longa melhor que qualquer sans.

   A mono não é enfeite de código: ela dá algarismo tabular, e é isso que
   alinha a coluna de valores. Números que não se alinham parecem
   números que não batem. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-display",
});

const prosa = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fonte-prosa",
});

const dado = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fonte-dado",
});

/* Documento de um cliente só. Estático, o build geraria e guardaria o
   HTML de todas as propostas da agência. */
export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: "#04060b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const proposta = await carregarPorToken(token);

  return {
    /* O layout raiz já aplica o template "%s · MR Grow"; repetir a marca
       aqui produzia "… · MR Grow · MR Grow" na aba. */
    title: proposta ? proposta.titulo : "Proposta",
    /* Documento comercial de terceiro: fora do índice. A proteção é o
       link, que ninguém adivinha — e o preço não entra em prévia
       nenhuma, porque prévia aparece em lista de conversa e em
       encaminhamento para grupo. */
    robots: { index: false, follow: false, nocache: true },
  };
}

const dataBR = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default async function PaginaProposta({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const p = await carregarPorToken(token);
  if (!p) notFound();

  const marca = await carregarMarcaPublica(p.organizacao_id);
  const nomeAgencia = marca?.nome ?? MARCA.nome;
  const zap = marca?.whatsapp || MARCA.whatsapp;
  const linkZap = `https://wa.me/${zap.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Olá! Recebi a proposta ${p.numero} da ${nomeAgencia} e quero seguir.`,
  )}`;

  const n = p.narrativa;
  const vencida = p.status === "expirada";

  const fichas = n.servicos
    .map((s) => ({ escolhido: s, ficha: fichaDoServico(s.id) }))
    .filter(
      (
        x,
      ): x is {
        escolhido: typeof x.escolhido;
        ficha: NonNullable<typeof x.ficha>;
      } => Boolean(x.ficha),
    );

  /* Preço por serviço só quando ele foi mesmo negociado item a item. Com
     todos em zero, mostrar "R$ 0" em cada tela seria mentir sobre a
     forma de cobrar — a conta é fechada, e ela aparece inteira na tela
     do investimento. */
  const detalhaPreco = fichas.some((f) => f.escolhido.fee > 0);

  /* O escopo antigo era um campo de texto com uma linha por entrega.
     Proposta gravada antes do catálogo continua abrindo por aqui. */
  const escopoAntigo = (p.escopo ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const condicoesDeSempre = condicoesDosServicos(fichas.map((f) => f.ficha.id));
  const totalContrato = p.valor_mensal * p.meses_contrato + p.valor_setup;

  return (
    <div
      className={`pp ${display.variable} ${prosa.variable} ${dado.variable}`}
    >
      <Deck marca={nomeAgencia}>
        {/* ── Capa ────────────────────────────────────────────────── */}
        <Slide centrado>
          <div>
            <p className="pp-rotulo">Proposta comercial · {p.numero}</p>

            <h1 className="pp-mostro">{p.cliente_nome ?? p.titulo}</h1>

            {p.introducao ? <p className="pp-apoio">{p.introducao}</p> : null}

            <dl
              style={{
                marginTop: "2.5rem",
                paddingTop: "1.75rem",
                borderTop: "1px solid var(--fio)",
                display: "flex",
                flexWrap: "wrap",
                gap: "1.25rem 3rem",
              }}
            >
              <div>
                <dt className="pp-mono">Emitida em</dt>
                <dd style={{ margin: "0.375rem 0 0", color: "var(--neve)" }}>
                  {dataBR(p.criado_em.slice(0, 10))}
                </dd>
              </div>
              {p.validade ? (
                <div>
                  <dt className="pp-mono">
                    {vencida ? "Venceu em" : "Válida até"}
                  </dt>
                  <dd
                    style={{
                      margin: "0.375rem 0 0",
                      color: vencida ? "var(--azul-claro)" : "var(--neve)",
                    }}
                  >
                    {dataBR(p.validade)}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="pp-mono">Por</dt>
                <dd style={{ margin: "0.375rem 0 0", color: "var(--neve)" }}>
                  {nomeAgencia}
                </dd>
              </div>
            </dl>

            {vencida ? (
              <p
                style={{
                  marginTop: "2rem",
                  maxWidth: "54ch",
                  borderRadius: "1rem",
                  border: "1px solid var(--fio-forte)",
                  background: "rgba(22,104,245,0.1)",
                  padding: "1rem",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: "var(--azul-claro)",
                }}
              >
                Esta proposta passou da validade. Fale com a {nomeAgencia} para
                receber uma versão atualizada, com os valores conferidos.
              </p>
            ) : null}
          </div>
        </Slide>

        {/* ── Diagnóstico ─────────────────────────────────────────── */}
        {/* Abre a argumentação de propósito. Sem ele a proposta começa
            falando de preço, e quem lê conclui que recebeu tabela. */}
        {n.diagnostico.length > 0 ? (
          <Slide
            rotulo="Diagnóstico"
            titulo={eco("O que encontramos")}
            apoio="O ponto de partida desta proposta. Se algo aqui estiver errado, o escopo muda junto."
          >
            <ol
              style={{
                display: "grid",
                gap: "0.75rem",
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {n.diagnostico.map((d, i) => (
                <li key={d}>
                  <Bloco className="pp-linha">
                    <span className="pp-marcador">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        minWidth: 0,
                        alignSelf: "center",
                        lineHeight: 1.65,
                        color: "var(--neve)",
                      }}
                    >
                      {d}
                    </span>
                  </Bloco>
                </li>
              ))}
            </ol>
          </Slide>
        ) : null}

        {/* ── Escopo em frentes, ou o texto antigo ────────────────── */}
        {n.frentes.length > 0 ? (
          <Slide rotulo="Escopo" titulo={eco("O que vamos fazer")}>
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))",
              }}
            >
              {n.frentes.map((b) => (
                <Bloco key={b.frente}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--fonte-display), system-ui, sans-serif",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {b.frente}
                  </h3>
                  <ul className="pp-itens">
                    {b.itens.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </Bloco>
              ))}
            </div>
          </Slide>
        ) : escopoAntigo.length > 0 && fichas.length === 0 ? (
          <Slide rotulo="Escopo" titulo={eco("O que vamos fazer")}>
            <ul className="pp-itens" style={{ marginTop: 0 }}>
              {escopoAntigo.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </Slide>
        ) : null}

        {/* ── Um slide por serviço ────────────────────────────────── */}
        {/* Array, e não fragmento: o Deck fatia pelos filhos diretos, e um
            fragmento com seis slides dentro vira UMA tela de três mil
            pixels. `Children.toArray` achata array aninhado. */}
        {fichas.map(({ ficha: f, escolhido }) => (
          <Slide
            key={f.id}
            rotulo={
              f.papel === "complemento"
                ? "Complemento"
                : f.cobranca === "projeto"
                  ? "O projeto"
                  : "O serviço"
            }
            titulo={eco(f.nome)}
          >
            <div className="pp-duas">
              <div>
                <p className="pp-mono" style={{ margin: 0 }}>
                  {f.paraQuem}
                </p>
                <p
                  style={{
                    margin: "0.875rem 0 0",
                    maxWidth: "54ch",
                    fontSize: "var(--guia)",
                    lineHeight: 1.65,
                    color: "var(--neve)",
                  }}
                >
                  {f.promessa}
                </p>

                {detalhaPreco && escolhido.fee > 0 ? (
                  <p
                    className="pp-num"
                    style={{ margin: "1.5rem 0 0", fontSize: "2rem" }}
                  >
                    {emReais(escolhido.fee)}
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontFamily: "var(--fonte-prosa), Georgia, serif",
                        fontSize: "0.95rem",
                        fontWeight: 400,
                        letterSpacing: 0,
                        color: "var(--cinza)",
                      }}
                    >
                      {f.cobranca === "mensal" ? "por mês" : "valor do projeto"}
                    </span>
                  </p>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: "0.75rem" }}>
                <Bloco>
                  <p className="pp-mono" style={{ margin: 0 }}>
                    O que entra
                  </p>
                  <ul className="pp-itens">
                    {f.entregas.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </Bloco>

                {/* O que NÃO entra tem tela igual à do que entra, e não uma
                    nota de rodapé. É a parte que evita a conversa
                    desconfortável do segundo mês. */}
                <Bloco>
                  <p className="pp-mono" style={{ margin: 0 }}>
                    O que não entra
                  </p>
                  <ul className="pp-itens" data-fora="">
                    {f.naoInclui.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </Bloco>
              </div>
            </div>
          </Slide>
        ))}

        {/* ── A conta ─────────────────────────────────────────────── */}
        {/* Depois dos serviços e antes das condições: a pessoa acabou de
            ver o que recebe, e a pergunta imediata é "quanto sai por
            mês, tudo somado?". Deixar ela somar sozinha é deixar que
            erre — e o erro é sempre para mais. */}
        <Slide
          rotulo="Investimento"
          titulo={eco("Quanto custa")}
          apoio={
            p.valor_setup > 0
              ? "A implantação é cobrada uma vez, no começo. O mensal recomeça a cada ciclo."
              : undefined
          }
        >
          <div className="pp-conta">
            <Bloco destaque>
              <p className="pp-mono" style={{ margin: 0 }}>
                Mensal
              </p>
              <p
                className="pp-num"
                style={{ margin: "0.625rem 0 0", fontSize: "2.4rem" }}
              >
                {emReais(p.valor_mensal)}
              </p>
              <p
                style={{
                  margin: "0.75rem 0 0",
                  fontSize: "0.85rem",
                  color: "var(--cinza)",
                }}
              >
                Contrato de {p.meses_contrato} meses. Depois disso, renovação
                mensal.
              </p>
            </Bloco>

            {p.valor_setup > 0 ? (
              <Bloco>
                <p className="pp-mono" style={{ margin: 0 }}>
                  Implantação, uma vez
                </p>
                <p
                  className="pp-num"
                  style={{ margin: "0.625rem 0 0", fontSize: "2.4rem" }}
                >
                  {emReais(p.valor_setup)}
                </p>
                <p
                  style={{
                    margin: "0.75rem 0 0",
                    fontSize: "0.85rem",
                    color: "var(--cinza)",
                  }}
                >
                  Auditoria, rastreamento e estrutura inicial, antes da primeira
                  campanha.
                </p>
              </Bloco>
            ) : null}

            <Bloco>
              <p className="pp-mono" style={{ margin: 0 }}>
                Total do contrato
              </p>
              <p
                className="pp-num"
                style={{ margin: "0.625rem 0 0", fontSize: "2.4rem" }}
              >
                {emReais(totalContrato)}
              </p>
              <p
                style={{
                  margin: "0.75rem 0 0",
                  fontSize: "0.85rem",
                  color: "var(--cinza)",
                }}
              >
                {p.meses_contrato} × {emReais(p.valor_mensal)}
                {p.valor_setup > 0
                  ? ` + ${emReais(p.valor_setup)} de implantação`
                  : ""}
                .
              </p>
            </Bloco>
          </div>

          {/* A verba de mídia fora da soma, e dito antes de perguntarem.
              É o mal-entendido mais caro que uma proposta de tráfego
              produz: o cliente soma a gestão com o que vai gastar em
              anúncio e acha que está tudo ali. */}
          {fichas.some(
            (f) => f.ficha.id === "meta" || f.ficha.id === "google",
          ) ? (
            <p
              style={{
                marginTop: "1rem",
                maxWidth: "62ch",
                fontSize: "0.85rem",
                lineHeight: 1.65,
                color: "var(--cinza)",
              }}
            >
              A verba de mídia não está aqui. Ela é paga por você direto ao Meta
              e ao Google, no valor que você definir — a {nomeAgencia} não
              intermedeia pagamento de plataforma, e este documento cobra só a
              gestão.
            </p>
          ) : null}
        </Slide>

        {/* ── Condições ───────────────────────────────────────────── */}
        <Slide rotulo="Condições" titulo={eco("Como funciona")}>
          <ul
            style={{
              display: "grid",
              gap: "0.75rem",
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {/* As negociadas primeiro, e destacadas: é o que a pessoa
                abriu esta tela para conferir. As de sempre ela já leu em
                qualquer proposta. */}
            {n.condicoesExtras.map((c) => (
              <li key={c}>
                <Bloco destaque className="pp-linha">
                  <span
                    aria-hidden
                    style={{ flex: "none", color: "var(--azul-claro)" }}
                  >
                    →
                  </span>
                  <span style={{ lineHeight: 1.65, color: "var(--neve)" }}>
                    {c}
                  </span>
                </Bloco>
              </li>
            ))}
            {p.condicoes
              ? p.condicoes
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .map((c) => (
                    <li key={c}>
                      <Bloco className="pp-linha">
                        <span
                          aria-hidden
                          style={{ flex: "none", color: "var(--azul-claro)" }}
                        >
                          →
                        </span>
                        <span
                          style={{ lineHeight: 1.65, color: "var(--neve)" }}
                        >
                          {c}
                        </span>
                      </Bloco>
                    </li>
                  ))
              : null}
            {condicoesDeSempre.map((c) => (
              <li key={c}>
                <Bloco className="pp-linha">
                  <span
                    aria-hidden
                    style={{ flex: "none", color: "var(--azul-claro)" }}
                  >
                    →
                  </span>
                  <span style={{ lineHeight: 1.65, color: "var(--neve)" }}>
                    {c}
                  </span>
                </Bloco>
              </li>
            ))}
          </ul>
        </Slide>

        {/* ── Próximos passos ─────────────────────────────────────── */}
        {n.proximosPassos.length > 0 ? (
          <Slide rotulo="A partir do sim" titulo={eco("Próximos passos")}>
            <ol
              style={{
                display: "grid",
                gap: "0.75rem",
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {n.proximosPassos.map((s, i) => (
                <li key={s}>
                  <Bloco className="pp-linha">
                    <span className="pp-marcador">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        minWidth: 0,
                        alignSelf: "center",
                        lineHeight: 1.65,
                        color: "var(--neve)",
                      }}
                    >
                      {s}
                    </span>
                  </Bloco>
                </li>
              ))}
            </ol>
          </Slide>
        ) : null}

        {/* ── Aceite ──────────────────────────────────────────────── */}
        <Slide centrado>
          <div>
            <p className="pp-rotulo">Aceite</p>

            <h2 className="pp-mostro">{eco("Pronto para começar")}</h2>

            <p className="pp-apoio">
              Responda por aqui que a {nomeAgencia} começa o kick off e o
              primeiro calendário na mesma semana.
            </p>

            <div style={{ marginTop: "2.25rem" }}>
              <a
                href={linkZap}
                target="_blank"
                rel="noopener noreferrer"
                className="pp-cta"
              >
                Aceitar e falar no WhatsApp
              </a>
            </div>

            <p
              style={{
                marginTop: "3rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--fio)",
                fontSize: "0.78rem",
                lineHeight: 1.7,
                color: "var(--cinza)",
              }}
            >
              Documento confidencial, preparado para{" "}
              {p.cliente_nome ?? p.titulo}.
              {p.validade ? ` Os valores valem até ${dataBR(p.validade)}.` : ""}
              <br />© {new Date().getFullYear()} {nomeAgencia}
              {marca?.documento ? ` · CNPJ ${marca.documento}` : ""}.
            </p>
          </div>
        </Slide>
      </Deck>
    </div>
  );
}
