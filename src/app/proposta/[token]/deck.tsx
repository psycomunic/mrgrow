"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { MARCA, linkWhatsApp } from "@/lib/marca";
import { brl, dataCompleta, iniciais } from "@/lib/utils";
import { rotuloPrazo } from "@/lib/rotulos";
import { aceitarProposta } from "@/app/painel/propostas/acoes";
import type { MarcaAgencia, Proposta } from "@/lib/propostas";

/**
 * A proposta aberta pelo cliente.
 *
 * É um documento, não uma apresentação. A versão anterior era um deck
 * horizontal com scroll-snap: cada assunto tinha de caber numa tela de
 * altura fixa, e foi isso que deixou a proposta rasa — não havia onde
 * escrever. Pior, no celular quase ninguém descobria que existiam telas à
 * direita, então metade do conteúdo nunca era lido. Rolagem vertical é
 * como as pessoas leem qualquer coisa no telefone, imprime, e aceita
 * seções do tamanho que o assunto pedir.
 *
 * A capa e o aceite são escuros; o miolo é claro. É a encadernação de uma
 * proposta impressa — capa dura, miolo em papel — e serve para marcar
 * onde o documento começa e onde ele cobra uma decisão.
 */

type Secao = { id: string; n: string; titulo: string };

const SECOES: Secao[] = [
  { id: "cenario", n: "01", titulo: "O cenário" },
  { id: "escopo", n: "02", titulo: "O que está incluso" },
  { id: "metodo", n: "03", titulo: "Como funciona" },
  { id: "investimento", n: "04", titulo: "Investimento" },
  { id: "acompanhamento", n: "05", titulo: "Como você acompanha" },
  { id: "perguntas", n: "06", titulo: "Perguntas" },
];

/* As fases são as do tráfego pago, não um cronograma genérico de projeto.
   O aprendizado da campanha é um fato da plataforma: antes de acumular
   conversão suficiente, o algoritmo entrega mal e o custo por resultado
   oscila. Dizer isso na proposta evita a cobrança de resultado no dia 20
   — e é a diferença entre um cliente que renova e um que sai achando que
   foi enganado. */
const FASES = [
  {
    quando: "Semanas 1 e 2",
    titulo: "Auditoria e rastreamento",
    texto:
      "Acessos, revisão da conta, do público e da oferta. Instalação de pixel, API de conversões e GA4 — sem medir direito, o resto é chute.",
  },
  {
    quando: "Semanas 3 e 4",
    titulo: "Campanhas no ar",
    texto:
      "Estrutura por temperatura de público e a primeira leva de criativos. A partir daqui existe dado próprio, não achismo de mercado.",
  },
  {
    quando: "Mês 2 em diante",
    titulo: "Otimização com dado",
    texto:
      "A campanha sai do aprendizado e passa a render. É quando o custo por resultado cai e a verba pode crescer com segurança.",
  },
];

const PERGUNTAS = [
  {
    q: "Em quanto tempo eu vejo resultado?",
    a: "As primeiras vendas costumam aparecer nas primeiras semanas, mas o número que importa — custo por resultado estável — leva de 60 a 90 dias. É o tempo que a plataforma precisa para sair da fase de aprendizado. Quem promete menos que isso está vendendo o que não controla.",
  },
  {
    q: "De quem é a conta de anúncios?",
    a: "Sua. A conta, o pixel, o histórico e os públicos ficam no seu Business Manager, no seu CNPJ. Se um dia a gente se separar, nada disso vai embora com a agência.",
  },
  {
    q: "Vocês garantem resultado?",
    a: "Não, e ninguém honesto garante: o resultado depende também do seu preço, do seu atendimento e da sua entrega. O que a gente garante é o trabalho — o que será feito, com que frequência, e com número aberto para você conferir.",
  },
  {
    q: "E se eu quiser parar antes do fim do contrato?",
    a: "É só avisar com 30 dias. Você leva a conta, o histórico e os criativos produzidos. Não trabalhamos com multa de saída.",
  },
];

export function Deck({ proposta, marca }: { proposta: Proposta; marca: MarcaAgencia | null }) {
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aceita, setAceita] = useState(proposta.status === "aceita");
  const [ativa, setAtiva] = useState(SECOES[0].id);
  const alvo = useRef<HTMLFormElement>(null);

  const itens = useMemo(
    () =>
      (proposta.escopo ?? "")
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean),
    [proposta.escopo],
  );

  const contrato = proposta.valor_mensal * proposta.meses_contrato + proposta.valor_setup;
  const agencia = marca?.nome || MARCA.nome;
  const zap = marca?.whatsapp ? `https://wa.me/${marca.whatsapp.replace(/\D/g, "")}` : linkWhatsApp();
  const expirada = proposta.status === "expirada";

  /* Qual seção está sendo lida agora, para a trilha lateral. Observador em
     vez de ouvir `scroll`: o navegador avisa só quando muda, e não a cada
     pixel rolado. */
  useEffect(() => {
    const alvos = SECOES.map((s) => document.getElementById(s.id)).filter(Boolean) as Element[];
    if (!alvos.length) return;

    const obs = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel?.target.id) setAtiva(visivel.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const a of alvos) obs.observe(a);
    return () => obs.disconnect();
  }, []);

  async function aceitar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Escreva o seu nome para aceitar.");
    setEnviando(true);
    const r = await aceitarProposta(proposta.token, nome);
    setEnviando(false);
    if (!r.ok) return toast.error(r.erro ?? "Não foi possível registrar.");
    setAceita(true);
    toast.success("Proposta aceita. Vamos te chamar para começar.");
  }

  return (
    <div className="doc" style={marca?.cor ? ({ "--azul": marca.cor } as React.CSSProperties) : undefined}>
      {/* ── Barra fixa ────────────────────────────────────────────── */}
      <header className="barra">
        <span className="barra__num">{proposta.numero}</span>
        <span className="barra__sep" aria-hidden="true" />
        <span className="barra__cli">{proposta.cliente_nome}</span>
        {!aceita && !expirada && (
          <button
            className="barra__cta"
            onClick={() => alvo.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            Aceitar proposta
          </button>
        )}
        {aceita && <span className="barra__ok">Aceita</span>}
      </header>

      {/* ── Capa ──────────────────────────────────────────────────── */}
      <section className="capa">
        <div className="capa__conteudo">
          <div className="capa__marcas">
            {marca?.logo_url ? (
              /* Logo vinda das Configurações: origem no Storage da própria
                 conta, mas o otimizador do Next exige domínio declarado. */
              // eslint-disable-next-line @next/next/no-img-element
              <img src={marca.logo_url} alt={agencia} className="capa__logo" />
            ) : (
              <Image
                src="/marca/mr-grow-logo.webp"
                alt={agencia}
                width={1400}
                height={728}
                className="capa__logo"
                priority
              />
            )}
            <span className="capa__mais" aria-hidden="true" />
            {proposta.cliente_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proposta.cliente_logo_url}
                alt={proposta.cliente_nome ?? "Cliente"}
                className="capa__logo"
              />
            ) : (
              <span className="capa__sigla">{iniciais(proposta.cliente_nome)}</span>
            )}
          </div>

          <p className="capa__etiqueta">Proposta comercial</p>
          <h1 className="capa__titulo">{proposta.titulo}</h1>

          <dl className="capa__ficha">
            <div>
              <dt>Para</dt>
              <dd>{proposta.cliente_nome}</dd>
            </div>
            <div>
              <dt>Por</dt>
              <dd>
                {MARCA.fundador} · {agencia}
              </dd>
            </div>
            <div>
              <dt>Documento</dt>
              <dd>{proposta.numero}</dd>
            </div>
            {proposta.validade && (
              <div>
                <dt>{expirada ? "Venceu em" : "Válida até"}</dt>
                <dd className={expirada ? "venceu" : undefined}>
                  {dataCompleta(proposta.validade)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* ── Miolo ─────────────────────────────────────────────────── */}
      <div className="miolo">
        <nav className="trilha" aria-label="Seções da proposta">
          <ol>
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={ativa === s.id ? "true" : undefined}>
                  <span className="trilha__n">{s.n}</span>
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="paginas">
          <section id="cenario" className="secao">
            <Cabeca n="01" titulo="O cenário" />
            <div className="prosa">
              {(
                proposta.introducao ??
                "Conteúdo feito no improviso não constrói posicionamento, e anúncio que carrega uma marca desconhecida paga mais caro por cada venda. As duas pontas se sustentam — e é por isso que tratá-las separadamente custa mais e rende menos."
              )
                .split("\n")
                .filter((l) => l.trim())
                .map((par) => (
                  <p key={par}>{par}</p>
                ))}
            </div>
          </section>

          <section id="escopo" className="secao">
            <Cabeca n="02" titulo="O que está incluso" />
            <p className="chamada">
              A operação inteira, não um serviço solto. Tudo abaixo entra no valor mensal.
            </p>
            <ul className="escopo">
              {itens.map((item) => (
                <li key={item}>
                  <Check className="escopo__check" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="metodo" className="secao">
            <Cabeca n="03" titulo="Como funciona" />
            <p className="chamada">
              O que acontece depois do aceite, na ordem em que acontece.
            </p>
            <ol className="fases">
              {FASES.map((f) => (
                <li key={f.titulo}>
                  <span className="fases__quando">{f.quando}</span>
                  <h3>{f.titulo}</h3>
                  <p>{f.texto}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* O bloco que define este documento: o que entra na conta da
              agência e o que não entra, separados. Toda proposta de agência
              esconde a verba de mídia no meio do texto, e é sempre ali que
              o cliente descobre tarde que o custo era outro. */}
          <section id="investimento" className="secao">
            <Cabeca n="04" titulo="Investimento" />

            <div className="livro">
              <div className="livro__bloco">
                <p className="livro__titulo">Você paga à {agencia}</p>
                <dl className="livro__linhas">
                  <div>
                    <dt>Assessoria</dt>
                    <dd>
                      {brl(proposta.valor_mensal)}
                      <small>/mês</small>
                    </dd>
                  </div>
                  {proposta.valor_setup > 0 && (
                    <div>
                      <dt>Setup inicial</dt>
                      <dd>
                        {brl(proposta.valor_setup)}
                        <small>uma vez</small>
                      </dd>
                    </div>
                  )}
                  <div className="livro__soma">
                    <dt>Contrato de {rotuloPrazo(proposta.meses_contrato)}</dt>
                    <dd>{brl(contrato)}</dd>
                  </div>
                </dl>
              </div>

              <div className="livro__bloco livro__bloco--fora">
                <p className="livro__titulo">Você paga direto às plataformas</p>
                <p className="livro__nota">
                  A verba de mídia vai no seu cartão, no Meta e no Google, e{" "}
                  <strong>não passa pela agência</strong>. Você define quanto investir e vê cada
                  centavo na própria plataforma.
                </p>
                <dl className="livro__linhas">
                  <div>
                    <dt>Verba de mídia</dt>
                    <dd className="livro__aberto">definida por você</dd>
                  </div>
                </dl>
              </div>
            </div>

            <p className="condicoes">
              {proposta.condicoes ||
                "O investimento em mídia é pago diretamente por você às plataformas. O valor acima é o da assessoria."}
            </p>
          </section>

          <section id="acompanhamento" className="secao">
            <Cabeca n="05" titulo="Como você acompanha" />
            <div className="prosa">
              <p>
                Você recebe acesso ao painel da {agencia}, com investimento, retorno e custo por
                resultado atualizados — os mesmos números que a gente usa para decidir. Não é um
                relatório bonito no fim do mês: é a operação aberta, todo dia.
              </p>
              <p>
                Uma vez por mês a gente senta para ler os números juntos, decidir o que muda e
                definir a verba do mês seguinte.
              </p>
            </div>
          </section>

          <section id="perguntas" className="secao">
            <Cabeca n="06" titulo="Perguntas" />
            <dl className="faq">
              {PERGUNTAS.map((p) => (
                <div key={p.q}>
                  <dt>{p.q}</dt>
                  <dd>{p.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
      </div>

      {/* ── Aceite ────────────────────────────────────────────────── */}
      <section className="aceite">
        <div className="aceite__conteudo">
          <p className="aceite__etiqueta">Próximo passo</p>
          <h2 className="aceite__titulo">Aceite e a gente começa</h2>

          {aceita ? (
            <p className="aceite__ok">
              <Check size={20} aria-hidden="true" />
              Proposta aceita. Vamos te chamar para combinar o início.
            </p>
          ) : expirada ? (
            <div className="aceite__vencida">
              <p>
                Esta proposta venceu em {proposta.validade && dataCompleta(proposta.validade)}. Os
                valores podem ter mudado — chame no WhatsApp que a gente refaz.
              </p>
              <a href={zap} className="aceite__zap" target="_blank" rel="noreferrer">
                <MessageCircle size={18} aria-hidden="true" />
                Falar no WhatsApp
              </a>
            </div>
          ) : (
            <>
              <p className="aceite__texto">
                Ao aceitar, agendamos o início e liberamos seu acesso ao painel. Assinar aqui vale
                como aceite formal desta proposta.
              </p>
              <form ref={alvo} className="aceite__forma" onSubmit={aceitar}>
                <label htmlFor="assinatura">Seu nome completo</label>
                <div className="aceite__campo">
                  <input
                    id="assinatura"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Quem está aceitando"
                    autoComplete="name"
                    required
                  />
                  <button type="submit" disabled={enviando}>
                    {enviando ? "Registrando…" : "Aceitar proposta"}
                  </button>
                </div>
                <p className="aceite__ajuda">
                  Prefere conversar antes?{" "}
                  <a href={zap} target="_blank" rel="noreferrer">
                    Chame no WhatsApp
                  </a>
                  .
                </p>
              </form>
            </>
          )}

          <footer className="rodape">
            <span>
              {agencia}
              {marca?.documento && ` · ${marca.documento}`}
            </span>
            <span>
              {proposta.numero} · emitida em {dataCompleta(proposta.criado_em.slice(0, 10))}
            </span>
          </footer>
        </div>
      </section>
    </div>
  );
}

function Cabeca({ n, titulo }: { n: string; titulo: string }) {
  return (
    <div className="cabeca">
      <span className="cabeca__n">{n}</span>
      <h2>{titulo}</h2>
    </div>
  );
}
