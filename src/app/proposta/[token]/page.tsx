import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Newsreader,
} from "next/font/google";
import { Deck } from "./deck";
import { Slide, Bloco, Janela, eco, ordem } from "./slide";
import { Contador } from "./movimento";
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

/* As fotos da proposta. Uma por tela de argumento e uma por serviço do
   catálogo: quando a agência cadastrar um serviço novo sem foto, ele cai
   na foto do escopo em vez de abrir com moldura vazia. */
const FOTO = (nome: string) => `/proposta/${nome}.webp`;
const FOTOS_DE_SERVICO = new Set([
  "estrategia",
  "social",
  "video",
  "meta",
  "google",
  "relatorio",
  "implantacao",
  "landing",
]);
const fotoDoServico = (id: string) =>
  FOTO(FOTOS_DE_SERVICO.has(id) ? id : "escopo");

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

  const principais = fichas.filter((f) => f.ficha.papel === "principal").length;

  return (
    <div
      className={`pp ${display.variable} ${prosa.variable} ${dado.variable}`}
    >
      <Deck marca={nomeAgencia} logo={marca?.logo_url ?? null}>
        {/* ── Capa ────────────────────────────────────────────────── */}
        <Slide centrado fundo={FOTO("capa")} veu="esquerda">
          <div className="pp-capa">
            {/* A logo do cliente na capa: a primeira coisa que ele vê é
                o próprio nome, e não o da agência. */}
            {p.cliente_logo_url && /^https?:\/\//i.test(p.cliente_logo_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.cliente_logo_url}
                alt={p.cliente_nome ?? ""}
                className="pp-capa-logo"
                data-revela=""
                style={ordem(0)}
              />
            ) : null}
            <p className="pp-rotulo" data-revela="" style={ordem(0)}>
              Proposta comercial · {p.numero}
            </p>

            <h1 className="pp-mostro">
              <span className="pp-mascara">
                <span>{p.cliente_nome ?? p.titulo}</span>
              </span>
            </h1>

            {p.introducao ? (
              <p className="pp-apoio" data-revela="" style={ordem(2)}>
                {p.introducao}
              </p>
            ) : null}

            <dl className="pp-ficha" data-revela="" style={ordem(3)}>
              <div>
                <dt className="pp-mono">Emitida em</dt>
                <dd>{dataBR(p.criado_em.slice(0, 10))}</dd>
              </div>
              {p.validade ? (
                <div>
                  <dt className="pp-mono">
                    {vencida ? "Venceu em" : "Válida até"}
                  </dt>
                  <dd data-alerta={vencida ? "" : undefined}>
                    {dataBR(p.validade)}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="pp-mono">Por</dt>
                <dd>{nomeAgencia}</dd>
              </div>
            </dl>

            {vencida ? (
              <p className="pp-vencida" data-revela="" style={ordem(4)}>
                Esta proposta passou da validade. Fale com a {nomeAgencia} para
                receber uma versão atualizada, com os valores conferidos.
              </p>
            ) : (
              <p
                className="pp-mono pp-dica"
                data-revela=""
                style={ordem(4)}
              >
                <span>Deslize para começar</span>
                <span aria-hidden className="pp-dica-seta">
                  →
                </span>
              </p>
            )}
          </div>

          {/* A faixa de serviços correndo no pé da capa: antes de ler uma
              linha, a pessoa já viu tudo o que está sendo oferecido. */}
          {fichas.length > 0 ? (
            <div aria-hidden className="pp-faixa">
              <div className="pp-faixa-trilho">
                {[0, 1].map((volta) => (
                  <span key={volta} className="pp-faixa-grupo">
                    {fichas.map(({ ficha }) => (
                      <span key={ficha.id}>
                        {ficha.nome}
                        <i>✦</i>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Slide>

        {/* ── Diagnóstico ─────────────────────────────────────────── */}
        {/* Abre a argumentação de propósito. Sem ele a proposta começa
            falando de preço, e quem lê conclui que recebeu tabela. */}
        {n.diagnostico.length > 0 ? (
          <Slide
            rotulo="Diagnóstico"
            titulo={eco("O que encontramos")}
            apoio="O ponto de partida desta proposta. Se algo aqui estiver errado, o escopo muda junto."
            visual={
              <Janela
                src={FOTO("diagnostico")}
                alt="Lupa sobre gráficos de desempenho"
                legenda="Leitura da operação atual"
                selo={
                  <>
                    <span className="pp-selo-pulso" />
                    <span>
                      <strong>{n.diagnostico.length}</strong> pontos de atenção
                    </span>
                  </>
                }
              />
            }
          >
            <ol className="pp-lista">
              {n.diagnostico.map((d, i) => (
                <li key={d}>
                  <Bloco className="pp-linha" indice={3 + i}>
                    <span className="pp-marcador">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="pp-texto-linha">{d}</span>
                  </Bloco>
                </li>
              ))}
            </ol>
          </Slide>
        ) : null}

        {/* ── Escopo em frentes, ou o texto antigo ────────────────── */}
        {n.frentes.length > 0 ? (
          <Slide
            rotulo="Escopo"
            titulo={eco("O que vamos fazer")}
            fundo={FOTO("escopo")}
            veu="total"
          >
            <div className="pp-frentes">
              {n.frentes.map((b, i) => (
                <Bloco key={b.frente} indice={3 + i}>
                  <h3 className="pp-sub">{b.frente}</h3>
                  <ul className="pp-itens">
                    {b.itens.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </Bloco>
              ))}
            </div>
          </Slide>
        ) : escopoAntigo.length > 0 && fichas.length === 0 ? (
          <Slide
            rotulo="Escopo"
            titulo={eco("O que vamos fazer")}
            fundo={FOTO("escopo")}
            veu="total"
          >
            <Bloco>
              <ul className="pp-itens" style={{ marginTop: 0 }}>
                {escopoAntigo.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </Bloco>
          </Slide>
        ) : null}

        {/* ── Um slide por serviço ────────────────────────────────── */}
        {/* Array, e não fragmento: o Deck fatia pelos filhos diretos, e um
            fragmento com seis slides dentro vira UMA tela de três mil
            pixels. `Children.toArray` achata array aninhado. */}
        {fichas.map(({ ficha: f, escolhido }, i) => (
          <Slide
            key={f.id}
            numeral={String(i + 1).padStart(2, "0")}
            rotulo={
              f.papel === "complemento"
                ? "Complemento"
                : f.cobranca === "projeto"
                  ? "O projeto"
                  : "O serviço"
            }
            titulo={eco(f.nome)}
            visual={
              <Janela
                src={fotoDoServico(f.id)}
                alt={f.nome}
                legenda={`${String(i + 1).padStart(2, "0")} / ${String(fichas.length).padStart(2, "0")}`}
                selo={
                  <>
                    <span className="pp-selo-pulso" />
                    <span>
                      {f.cobranca === "mensal"
                        ? "Recorrente, todo mês"
                        : "Projeto, entrega única"}
                    </span>
                  </>
                }
              />
            }
          >
            <div className="pp-servico">
              <div data-revela="" style={ordem(3)}>
                <p className="pp-mono" style={{ margin: 0 }}>
                  {f.paraQuem}
                </p>
                <p className="pp-promessa">{f.promessa}</p>

                {detalhaPreco && escolhido.fee > 0 ? (
                  <p className="pp-num pp-preco">
                    {emReais(escolhido.fee)}
                    <span>
                      {f.cobranca === "mensal" ? "por mês" : "valor do projeto"}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="pp-entra-sai">
                <Bloco indice={4}>
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
                <Bloco indice={5}>
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
          fundo={FOTO("investimento")}
          veu="esquerda"
          apoio={
            p.valor_setup > 0
              ? "A implantação é cobrada uma vez, no começo. O mensal recomeça a cada ciclo."
              : principais > 0
                ? `${principais} ${principais === 1 ? "frente" : "frentes"} de trabalho numa conta só, fechada.`
                : undefined
          }
        >
          <div className="pp-conta">
            <Bloco destaque indice={3}>
              <p className="pp-mono" style={{ margin: 0 }}>
                Mensal
              </p>
              <p className="pp-num pp-valor">
                <Contador valor={p.valor_mensal} />
              </p>
              <p className="pp-nota">
                Contrato de {p.meses_contrato} meses. Depois disso, renovação
                mensal.
              </p>
            </Bloco>

            {p.valor_setup > 0 ? (
              <Bloco indice={4}>
                <p className="pp-mono" style={{ margin: 0 }}>
                  Implantação, uma vez
                </p>
                <p className="pp-num pp-valor">
                  <Contador valor={p.valor_setup} />
                </p>
                <p className="pp-nota">
                  Auditoria, rastreamento e estrutura inicial, antes da primeira
                  campanha.
                </p>
              </Bloco>
            ) : null}

            <Bloco indice={5}>
              <p className="pp-mono" style={{ margin: 0 }}>
                Total do contrato
              </p>
              <p className="pp-num pp-valor">
                <Contador valor={totalContrato} duracao={2000} />
              </p>
              <p className="pp-nota">
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
            <p className="pp-nota pp-nota-midia" data-revela="" style={ordem(6)}>
              A verba de mídia não está aqui. Ela é paga por você direto ao Meta
              e ao Google, no valor que você definir — a {nomeAgencia} não
              intermedeia pagamento de plataforma, e este documento cobra só a
              gestão.
            </p>
          ) : null}
        </Slide>

        {/* ── Condições ───────────────────────────────────────────── */}
        <Slide
          rotulo="Condições"
          titulo={eco("Como funciona")}
          fundo={FOTO("condicoes")}
          veu="total"
        >
          <ul className="pp-lista">
            {/* As negociadas primeiro, e destacadas: é o que a pessoa
                abriu esta tela para conferir. As de sempre ela já leu em
                qualquer proposta. */}
            {[
              ...n.condicoesExtras.map((c) => ({ c, destaque: true })),
              ...(p.condicoes ?? "")
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .map((c) => ({ c, destaque: false })),
              ...condicoesDeSempre.map((c) => ({ c, destaque: false })),
            ].map(({ c, destaque }, i) => (
              <li key={c}>
                <Bloco destaque={destaque} className="pp-linha" indice={3 + i}>
                  <span aria-hidden className="pp-seta">
                    →
                  </span>
                  <span className="pp-texto-linha">{c}</span>
                </Bloco>
              </li>
            ))}
          </ul>
        </Slide>

        {/* ── Próximos passos ─────────────────────────────────────── */}
        {n.proximosPassos.length > 0 ? (
          <Slide
            rotulo="A partir do sim"
            titulo={eco("Próximos passos")}
            fundo={FOTO("passos")}
            veu="esquerda"
          >
            {/* Linha do tempo: o fio azul se desenha de cima para baixo
                quando a tela entra, ligando um passo ao outro. */}
            <ol className="pp-passos">
              {n.proximosPassos.map((s, i) => (
                <li key={s} data-revela="" style={ordem(3 + i)}>
                  <span className="pp-passo-marca">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="pp-texto-linha">{s}</span>
                </li>
              ))}
            </ol>
          </Slide>
        ) : null}

        {/* ── Aceite ──────────────────────────────────────────────── */}
        <Slide centrado fundo={FOTO("aceite")} veu="centro">
          <div className="pp-aceite">
            <p className="pp-rotulo" data-revela="" style={ordem(0)}>
              Aceite
            </p>

            <h2 className="pp-mostro">
              <span className="pp-mascara">
                <span>{eco("Pronto para começar")}</span>
              </span>
            </h2>

            <p className="pp-apoio" data-revela="" style={ordem(2)}>
              Responda por aqui que a {nomeAgencia} começa o kick off e o
              primeiro calendário na mesma semana.
            </p>

            <div data-revela="" style={{ ...ordem(3), marginTop: "2.25rem" }}>
              <a
                href={linkZap}
                target="_blank"
                rel="noopener noreferrer"
                className="pp-cta"
              >
                <span>Aceitar e falar no WhatsApp</span>
                <span aria-hidden className="pp-cta-seta">
                  →
                </span>
              </a>
            </div>

            <p className="pp-rodape" data-revela="" style={ordem(4)}>
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
