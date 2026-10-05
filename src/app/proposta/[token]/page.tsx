import type { CSSProperties } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { Deck } from "./deck";
import { Tela, Camada, Foto, Linha, ordem } from "./slide";
import {
  Outdoor,
  Gema,
  IconeFacebook,
  IconeInstagram,
  IconeGoogle,
  IconeWhatsApp,
  ConversaWhats,
  PaginaVendas,
  GradeHorario,
  MapaRaio,
  Interesses,
  Esteira,
  Assinatura,
} from "./pecas";
import { Contador, Regressiva } from "./movimento";
import { carregarMarcaPublica, carregarPorToken } from "@/lib/propostas";
import { emReais, fichaDoServico } from "@/lib/servicos-proposta";
import { PLANOS, plano as nivel } from "@/lib/planos-proposta";
import { MARCA } from "@/lib/marca";
import "./deck.css";

/* Fontes no próprio repositório, e não do Google: a proposta é o
   documento que o cliente abre, e ela não pode depender de um terceiro
   responder para ficar com a cara certa. Anton é o grotesco condensado do
   deck impresso da MR Grow; Inter carrega o texto corrido; Great Vibes é
   só a assinatura do fecho. */
const titulo = localFont({
  src: "./fontes/anton.woff2",
  variable: "--f-titulo",
  display: "swap",
});

const texto = localFont({
  src: "./fontes/inter.woff2",
  variable: "--f-texto",
  weight: "100 900",
  display: "swap",
});

const assina = localFont({
  src: "./fontes/great-vibes.woff2",
  variable: "--f-assina",
  display: "swap",
});

/* Documento de um cliente só. Estático, o build geraria e guardaria o
   HTML de todas as propostas da agência. */
export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: "#050608",
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
    /* O layout raiz já aplica o template "%s · MR Grow". */
    title: proposta ? proposta.titulo : "Proposta",
    /* Documento comercial de terceiro: fora do índice, e o preço fora de
       qualquer prévia de link. */
    robots: { index: false, follow: false, nocache: true },
  };
}

const FOTO = (nome: string) => `/proposta2/${nome}`;

const dataCurta = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

const dataLonga = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });

/** O @ do Instagram, tirado do endereço cadastrado. */
function arrobaDe(url: string) {
  const m = url.match(/instagram\.com\/([^/?#]+)/i);
  return m ? `@${m[1]}`.toUpperCase() : "";
}

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
  const arroba =
    nomeAgencia === MARCA.nome
      ? arrobaDe(MARCA.instagramAgencia) || "@MRGROW.AG"
      : nomeAgencia.toUpperCase();
  const zap = marca?.whatsapp || MARCA.whatsapp;
  const cliente = p.cliente_nome ?? p.titulo;
  const linkZap = `https://wa.me/${zap.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Olá! Recebi a proposta ${p.numero} da ${nomeAgencia} e quero assinar.`,
  )}`;

  const n = p.narrativa;
  const vencida = p.status === "expirada";
  /* O plano escolhido. Sem plano, a proposta é de serviços soltos: a tela
     de planos sai, e a de investimento lista os serviços marcados. */
  const escolhido = n.plano ? nivel(n.plano) : null;
  const itensDaConta = escolhido
    ? escolhido.entregas
    : n.servicos
        .map((x) => fichaDoServico(x.id)?.nome)
        .filter((x): x is string => Boolean(x));
  const mensal = p.valor_mensal;
  const desconto = p.valor_cheio > mensal && mensal > 0;
  const pct = desconto ? Math.round((1 - mensal / p.valor_cheio) * 100) : 0;
  const nomeOferta = escolhido?.nome ?? "plano";

  return (
    <div className={`pp ${titulo.variable} ${texto.variable} ${assina.variable}`}>
      <Deck marca={nomeAgencia} logo={marca?.logo_url ?? null} arroba={arroba}>
        {/* ── 1. Capa: o nome do cliente num outdoor ──────────────── */}
        <Tela rotulo="Capa" className="pp-t-capa">
          <Outdoor src={FOTO("outdoor.webp")} cliente={cliente} arroba={arroba} />
          {p.validade ? (
            <p className="pp-capa-validade" data-revela="" style={ordem(8)}>
              {vencida ? "Proposta vencida em " : "Proposta válida até "}
              {dataCurta(p.validade)}.
            </p>
          ) : null}
          <p className="pp-capa-numero" data-revela="" style={ordem(8)}>
            {p.numero}
          </p>
        </Tela>

        {/* ── 2. Seja visto ou seja esquecido ─────────────────────── */}
        <Tela rotulo="Seja visto ou seja esquecido" className="pp-t-visto">
          <Foto src={FOTO("rainha.webp")} posicao="70% center" prof={-3} />
          <div className="pp-veu pp-veu-esq" />
          <div className="pp-conteudo pp-meio">
            <h2 className="pp-gigante">
              <Linha i={0}>Seja visto</Linha>
              <Linha i={1}>ou seja</Linha>
              <Linha i={2} className="pp-esquecido">
                esquecido
              </Linha>
            </h2>
            <span className="pp-traco" data-revela="" style={ordem(4)} />
            <p className="pp-apoio" data-revela="" style={ordem(5)}>
              No digital, quem não aparece não existe para o cliente. E quem
              aparece sem estratégia vira só mais um no feed.
            </p>
          </div>
        </Tela>

        {/* ── 3. Posicionamento (tela branca) ─────────────────────── */}
        <Tela tom="claro" rotulo="Posicionamento" className="pp-t-posiciona">
          <div className="pp-conteudo pp-meio pp-centro">
            <p className="pp-frase">
              <Linha i={0}>Hoje o marketing não premia</Linha>
              <Linha i={1}>quem grita mais alto.</Linha>
            </p>
            <p className="pp-frase pp-frase-forte">
              <Linha i={2}>
                <em>Premia quem</em> se posiciona melhor.
              </Linha>
            </p>
            <div className="pp-versus">
              <p data-revela="" style={ordem(4)}>
                <span>Ser bom é o</span>
                <strong>básico</strong>
              </p>
              <span className="pp-versus-linha" />
              <p data-revela="" style={ordem(6)}>
                <span>Ser visto é</span>
                <strong className="pp-azul">estratégia</strong>
              </p>
            </div>
          </div>
        </Tela>

        {/* ── 4. MR Grow ───────────────────────────────────────────── */}
        <Tela rotulo={nomeAgencia} className="pp-t-marca">
          <Camada prof={2} className="pp-oculos">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FOTO("oculos.webp")} alt="" decoding="async" />
          </Camada>
          <div className="pp-conteudo pp-baixo pp-centro">
            <h2 className="pp-nome-agencia">
              <Linha i={0}>{nomeAgencia}</Linha>
            </h2>
            <p className="pp-slogan" data-revela="" style={ordem(2)}>
              Posicionamos marcas. Transformamos atenção em venda.
            </p>
          </div>
          <div className="pp-logos" data-revela="" style={ordem(4)}>
            <p>Marcas que já cresceram com a gente</p>
            <Esteira segundos={50}>
              {Array.from({ length: 16 }, (_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`/clientes/branco/${String(i + 1).padStart(2, "0")}.webp`}
                  alt=""
                  loading="lazy"
                />
              ))}
            </Esteira>
          </div>
        </Tela>

        {/* ── 5. Não vendemos likes (tela branca) ─────────────────── */}
        <Tela tom="claro" rotulo="O que vendemos" className="pp-t-likes">
          <div className="pp-coracoes" aria-hidden>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} style={{ "--i": i } as CSSProperties}>
                ♥
              </span>
            ))}
          </div>
          <div className="pp-conteudo pp-meio pp-centro">
            <p className="pp-frase">
              <Linha i={0}>Na {nomeAgencia}, não vendemos posts.</Linha>
            </p>
            <p className="pp-frase pp-frase-gigante">
              <Linha i={1}>
                Não vendemos <em className="pp-riscado">likes.</em>
              </Linha>
            </p>
            <p className="pp-frase pp-frase-media" data-revela="" style={ordem(4)}>
              Vendemos posicionamento, percepção e{" "}
              <span className="pp-azul">crescimento.</span>
            </p>
            <p className="pp-frase pp-frase-media" data-revela="" style={ordem(6)}>
              E é aqui que a sua virada de jogo começa.
            </p>
          </div>
        </Tela>

        {/* ── 6. DNA em números ───────────────────────────────────── */}
        <Tela rotulo="Nosso DNA em números" className="pp-t-dna">
          <div className="pp-conteudo pp-dna">
            <h2 className="pp-titulo-tela pp-centro">
              <Linha i={0}>Nosso DNA em números</Linha>
            </h2>
            <div className="pp-dna-grade">
              <div className="pp-dna-num" data-revela="" style={ordem(2)}>
                <b>
                  <i>+</i>
                  <Contador valor={583} />
                </b>
                <span>empresas posicionadas</span>
              </div>
              <Camada prof={1.5} className="pp-dna-gema">
                <Gema />
              </Camada>
              <div className="pp-dna-num" data-revela="" style={ordem(3)}>
                <b>
                  <i>+</i>
                  <Contador valor={9} duracao={1200} /> mi
                </b>
                <span>em verba administrada em anúncios</span>
              </div>
            </div>
            <div className="pp-dna-num pp-dna-largo" data-revela="" style={ordem(4)}>
              <b>
                <i>+</i>
                <Contador valor={2326} duracao={2000} /> campanhas otimizadas
              </b>
            </div>
            <div className="pp-dna-num pp-dna-anos" data-revela="" style={ordem(5)}>
              <b>
                <i>+</i>
                <Contador valor={10} duracao={1000} /> anos de mercado
              </b>
              <span>Especialistas em transformar atenção em venda.</span>
            </div>
          </div>
        </Tela>

        {/* ── 7. Método G.R.O.W. ──────────────────────────────────── */}
        <Tela rotulo="Método G.R.O.W." className="pp-t-grow">
          <Foto src={FOTO("carro.webp")} posicao="center" prof={-2.5} className="pp-grow-foto" />
          <div className="pp-veu pp-veu-esq" />
          <div className="pp-conteudo pp-meio">
            <p className="pp-sobretitulo" data-revela="" style={ordem(0)}>
              Nosso diferencial
            </p>
            <h2 className="pp-titulo-tela">
              <Linha i={1}>Método G.R.O.W.</Linha>
            </h2>
            <p className="pp-apoio" data-revela="" style={ordem(2)}>
              Toda estratégia da {nomeAgencia} passa pelas mesmas quatro
              etapas. É o que faz o resultado ser repetível, e não sorte.
            </p>
            <ol className="pp-grow">
              {[
                ["G", "Goals", "Metas", "Metas reais de faturamento e autoridade. Nada de número de vaidade."],
                ["R", "Results", "Resultados", "Medimos o que paga as contas: leads, vendas e mercado conquistado. Curtida não paga boleto."],
                ["O", "Optimization", "Otimização", "Todo mês a estratégia é revisada para escalar o que funciona e cortar o que não funciona."],
                ["W", "Winner Mind", "Mente campeã", "Lado a lado com você: constância, estratégia e visão de futuro."],
              ].map(([letra, en, pt, txt], i) => (
                <li
                  key={letra}
                  data-revela=""
                  style={{ ...ordem(3 + i), "--k": i } as CSSProperties}
                >
                  <span className="pp-grow-letra">{letra}</span>
                  <span>
                    <b>
                      {en} <small>({pt})</small>
                    </b>
                    <span>{txt}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Tela>

        {/* ── Diagnóstico, quando a proposta tiver ────────────────── */}
        {n.diagnostico.length > 0 ? (
          <Tela tom="claro" rotulo="Diagnóstico" className="pp-t-diag">
            <div className="pp-conteudo pp-meio">
              <p className="pp-sobretitulo pp-escuro" data-revela="" style={ordem(0)}>
                Diagnóstico · {cliente}
              </p>
              <h2 className="pp-titulo-tela">
                <Linha i={1}>O que encontramos</Linha>
                <Linha i={2}>no seu negócio.</Linha>
              </h2>
              <ol className="pp-diag">
                {n.diagnostico.map((d, i) => (
                  <li key={d} data-revela="" style={ordem(3 + i)}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <p>{d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Tela>
        ) : null}

        {/* ── 8. Ponto A ──────────────────────────────────────────── */}
        <Tela rotulo="Ponto A" className="pp-t-ponto">
          <span className="pp-letra-fundo" aria-hidden>
            A
          </span>
          <div className="pp-conteudo pp-meio">
            <h2 className="pp-titulo-tela">
              <Linha i={0}>Pegamos seus futuros clientes</Linha>
              <Linha i={1}>
                no <span className="pp-azul">ponto A.</span>
              </Linha>
            </h2>
            <ul className="pp-canais">
              <li data-revela="" style={ordem(2)}>
                <span className="pp-canal-icone" style={{ "--k": 0 } as CSSProperties}>
                  <IconeFacebook />
                </span>
                <span>
                  <b>Facebook</b>
                  Campanhas pensadas para cada nível de consciência de compra.
                  Despertamos o desejo em quem ainda nem sabe que precisa de você.
                </span>
              </li>
              <li data-revela="" style={ordem(3)}>
                <span className="pp-canal-icone" style={{ "--k": 1 } as CSSProperties}>
                  <IconeInstagram />
                </span>
                <span>
                  <b>Instagram</b>
                  Feed, Stories e Reels, com criativos próprios para cada
                  posicionamento. Os números dizem onde escalar: numa
                  plataforma ou nas duas.
                </span>
              </li>
              <li data-revela="" style={ordem(4)}>
                <span className="pp-canal-icone" style={{ "--k": 2 } as CSSProperties}>
                  <IconeGoogle />
                </span>
                <span>
                  <b>Google Ads</b>
                  Quem pesquisa já quer comprar. Colocamos sua marca nas
                  primeiras posições, na hora exata da decisão.
                </span>
              </li>
            </ul>
          </div>
          <div className="pp-rota" aria-hidden>
            <span className="pp-rota-a">A</span>
            <span className="pp-rota-linha" />
            <span className="pp-rota-b">B</span>
          </div>
        </Tela>

        {/* ── 9. Ponto B ──────────────────────────────────────────── */}
        <Tela rotulo="Ponto B" className="pp-t-ponto pp-t-pontob">
          <span className="pp-letra-fundo" aria-hidden>
            B
          </span>
          <div className="pp-conteudo pp-pontob">
            <h2 className="pp-titulo-tela">
              <Linha i={0}>
                E levamos até o <span className="pp-azul">ponto B:</span>
              </Linha>
              <Linha i={1}>a venda.</Linha>
            </h2>
            <div className="pp-pontob-grade">
              <div className="pp-pontob-item" data-revela="" style={ordem(2)}>
                <ConversaWhats marca={cliente} />
                <div>
                  <b>
                    <IconeWhatsApp /> WhatsApp
                  </b>
                  <p>
                    O lead chega pronto para conversar. Com um atendimento
                    afiado, a conversa vira venda, e quem não comprou entra
                    na lista de remarketing.
                  </p>
                </div>
              </div>
              <div className="pp-pontob-item" data-revela="" style={ordem(3)}>
                <PaginaVendas />
                <div>
                  <b>Página de vendas</b>
                  <p>
                    Site ou página de captura com domínio próprio, rápida e
                    medida. Cada visita vira dado, e cada dado vira
                    faturamento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Tela>

        {/* ── 10. Segmentação ─────────────────────────────────────── */}
        <Tela rotulo="Segmentação" className="pp-t-seg">
          <div className="pp-conteudo pp-seg">
            <h2 className="pp-titulo-tela">
              <Linha i={0}>Segmentação</Linha>
            </h2>
            <p className="pp-apoio" data-revela="" style={ordem(1)}>
              Seu anúncio na hora certa, no lugar certo, para a pessoa certa.
              Sem desperdiçar verba com quem nunca vai comprar.
            </p>
            <div className="pp-seg-grade">
              <figure data-revela="" style={ordem(2)}>
                <figcaption>Horário programado</figcaption>
                <GradeHorario />
                <p>Anúncios no ar nos horários em que seu público compra.</p>
              </figure>
              <figure data-revela="" style={ordem(3)}>
                <figcaption>Localização exata</figcaption>
                <MapaRaio />
                <p>Só quem está no raio que você atende vê o anúncio.</p>
              </figure>
              <figure data-revela="" style={ordem(4)}>
                <figcaption>Interesses do seu nicho</figcaption>
                <Interesses />
                <p>Comportamento de compra e interesses do seu cliente ideal.</p>
              </figure>
            </div>
          </div>
        </Tela>

        {/* ── 11. Conteúdo ────────────────────────────────────────── */}
        <Tela rotulo="Criação de conteúdo" className="pp-t-conteudo">
          <div className="pp-conteudo pp-conteudo-topo">
            <h2 className="pp-titulo-tela">
              <Linha i={0}>Criação de conteúdo</Linha>
            </h2>
            <p className="pp-apoio pp-apoio-largo" data-revela="" style={ordem(1)}>
              Conteúdo com intenção comercial: posts, reels e stories que
              constroem autoridade e trazem cliente. Antes de criar, a gente
              mergulha na sua marca, na sua mensagem e nos seus objetivos.
            </p>
          </div>
          <div className="pp-portfolio" data-revela="" style={ordem(2)}>
            <Esteira segundos={46}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={FOTO(`post-${i}.webp`)} alt="" loading="lazy" />
              ))}
            </Esteira>
            <Esteira segundos={52} sentido="direita">
              {[4, 6, 1, 5, 3, 2].map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={FOTO(`post-${i}.webp`)} alt="" loading="lazy" />
              ))}
            </Esteira>
          </div>
        </Tela>

        {/* ── 12. Planos ──────────────────────────────────────────── */}
        {escolhido ? (
        <Tela rotulo="Planos" className="pp-t-planos">
          <div className="pp-conteudo pp-planos-topo pp-centro">
            <h2 className="pp-titulo-tela">
              <Linha i={0}>Escolha o nível de crescimento</Linha>
            </h2>
            <p className="pp-apoio" data-revela="" style={ordem(1)}>
              Estratégia, conteúdo e tráfego para sua marca sair do improviso e
              crescer com direção.
            </p>
          </div>
          <div className="pp-planos">
            {PLANOS.map((pl, i) => (
              <article
                key={pl.id}
                className="pp-plano"
                data-recomendado={pl.recomendado ? "" : undefined}
                data-escolhido={pl.id === escolhido.id ? "" : undefined}
                data-revela=""
                style={ordem(2 + i)}
              >
                {pl.recomendado ? (
                  <span className="pp-plano-selo">★ Mais recomendado</span>
                ) : null}
                <h3>Plano {pl.nome}</h3>
                <p className="pp-plano-formula">{pl.tagline}</p>
                <ul>
                  {pl.entregas.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                {pl.id === escolhido.id ? (
                  <p className="pp-plano-seu">✓ O plano desta proposta</p>
                ) : null}
                <div className="pp-plano-preco">
                  <span>Investimento mensal</span>
                  <b>{emReais(pl.preco)}</b>
                </div>
              </article>
            ))}
          </div>
        </Tela>
        ) : null}

        {/* ── 13. Plano selecionado ───────────────────────────────── */}
        <Tela rotulo="Plano selecionado" className="pp-t-escolhido">
          <div className="pp-escolhido-foto">
            <Foto src={FOTO("notebook.webp")} posicao="center 70%" prof={-2} />
            <div className="pp-escolhido-titulo">
              <Linha i={0}>Entrega da</Linha>
              <Linha i={1}>assessoria</Linha>
              <Linha i={2} className="pp-completa">
                completa
              </Linha>
            </div>
          </div>
          <div className="pp-escolhido-texto">
            <p className="pp-sobretitulo pp-escuro" data-revela="" style={ordem(0)}>
              {escolhido ? "Plano selecionado" : "Sua assessoria"}
            </p>
            <h2 className="pp-escolhido-nome" data-revela="" style={ordem(1)}>
              {escolhido?.nome ?? cliente}
            </h2>
            <ul className="pp-escolhido-lista">
              {itensDaConta.map((e, i) => (
                <li key={e} data-revela="" style={ordem(2 + i * 0.4)}>
                  {e}
                </li>
              ))}
            </ul>

            <div className="pp-investimento" data-revela="" style={ordem(7)}>
              <p className="pp-investimento-rotulo">Investimento</p>
              {desconto && p.validade && !vencida ? (
                <p className="pp-oferta">
                  {pct}% off no {nomeOferta} até {dataLonga(p.validade)}.
                </p>
              ) : null}
              {desconto ? (
                <p className="pp-de">
                  De <s>{emReais(p.valor_cheio)}</s> / mês
                </p>
              ) : null}
              <p className="pp-por">
                {desconto ? <span>por</span> : null}
                <Contador valor={mensal} moeda duracao={1400} />
                <small>/ mês</small>
              </p>
              <p className="pp-condicao">
                Contrato de {p.meses_contrato} meses
                {p.valor_setup > 0
                  ? ` + implantação de ${emReais(p.valor_setup)}, cobrada uma vez`
                  : ""}
                . A verba de anúncios é paga direto às plataformas.
              </p>
              {p.validade && !vencida ? (
                <div className="pp-prazo">
                  <span>A oferta acaba em</span>
                  <Regressiva ate={p.validade} />
                </div>
              ) : null}
            </div>
          </div>
        </Tela>

        {/* ── Próximos passos, quando a proposta tiver ────────────── */}
        {n.proximosPassos.length > 0 ? (
          <Tela rotulo="Próximos passos" className="pp-t-passos">
            <Foto src={FOTO("cidade.webp")} posicao="center" prof={-2} />
            <div className="pp-veu pp-veu-total" />
            <div className="pp-conteudo pp-meio">
              <p className="pp-sobretitulo" data-revela="" style={ordem(0)}>
                A partir do sim
              </p>
              <h2 className="pp-titulo-tela">
                <Linha i={1}>Próximos passos</Linha>
              </h2>
              <ol className="pp-passos">
                {n.proximosPassos.map((s, i) => (
                  <li key={s} data-revela="" style={ordem(2 + i)}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <p>{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Tela>
        ) : null}

        {/* ── 14. Compromisso (tela branca) ───────────────────────── */}
        <Tela tom="claro" rotulo="Nosso compromisso" className="pp-t-fim">
          <div className="pp-conteudo pp-meio pp-centro">
            <h2 className="pp-compromisso">
              <Linha i={0}>Nosso compromisso</Linha>
            </h2>
            <p className="pp-frase pp-frase-media" data-revela="" style={ordem(2)}>
              Sua marca pode ser só mais uma.
              <br />
              <small>Ou pode ser a marca que ninguém ignora.</small>
            </p>
            <p className="pp-proximo">
              <Linha i={3}>O próximo movimento é seu</Linha>
            </p>
            <div className="pp-assinar" data-revela="" style={ordem(5)}>
              <Assinatura />
              <span>agora essa transformação.</span>
            </div>
            <a
              href={linkZap}
              target="_blank"
              rel="noopener noreferrer"
              className="pp-cta"
              data-revela=""
              style={ordem(6)}
            >
              <span>Quero assinar pelo WhatsApp</span>
              <span aria-hidden className="pp-cta-seta">
                →
              </span>
            </a>
            <p className="pp-rodape" data-revela="" style={ordem(7)}>
              Documento confidencial, preparado para {cliente}.
              {p.validade ? ` Valores válidos até ${dataCurta(p.validade)}.` : ""}{" "}
              © {new Date().getFullYear()} {nomeAgencia}
              {marca?.documento ? ` · CNPJ ${marca.documento}` : ""}.
            </p>
          </div>
        </Tela>
      </Deck>
    </div>
  );
}
