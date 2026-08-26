"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { MARCA, linkWhatsApp } from "@/lib/marca";
import { brl, dataCompleta, iniciais } from "@/lib/utils";
import { aceitarProposta } from "@/app/painel/propostas/acoes";
import type { Proposta } from "@/lib/propostas";

/**
 * Deck horizontal da proposta. A navegação é scroll-snap nativo, então o
 * gesto de arrastar no celular funciona sem biblioteca; as setas, o teclado
 * e os pontos apenas rolam o mesmo trilho.
 */
export function Deck({ proposta }: { proposta: Proposta }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aceita, setAceita] = useState(proposta.status === "aceita");

  const itens = (proposta.escopo ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  const contrato = proposta.valor_mensal * 12 + proposta.valor_setup;
  const total = 5;

  const irPara = useCallback((i: number) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  }, []);

  const aoRolar = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    setAtual(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const aoTeclar = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") irPara(Math.min(atual + 1, total - 1));
      if (e.key === "ArrowLeft") irPara(Math.max(atual - 1, 0));
    },
    [atual, irPara],
  );

  async function aceitar() {
    if (!nome.trim()) return toast.error("Escreva o seu nome para aceitar.");
    setEnviando(true);
    const r = await aceitarProposta(proposta.token, nome);
    setEnviando(false);
    if (!r.ok) return toast.error(r.erro ?? "Não foi possível registrar.");
    setAceita(true);
    toast.success("Proposta aceita. Vamos te chamar para começar.");
  }

  return (
    <div className="deck">
      <div
        ref={trilho}
        className="trilho"
        onScroll={aoRolar}
        onKeyDown={aoTeclar}
        tabIndex={0}
        role="region"
        aria-label={`Proposta ${proposta.numero}, ${total} telas`}
      >
        {/* 1 · Capa */}
        <section className="slide" aria-label="Capa">
          <div className="slide__interno">
            <div className="capa__marcas">
              <span className="capa__chapa">
                <Image
                  src="/marca/mr-grow-logo.webp"
                  alt={MARCA.nome}
                  width={1400}
                  height={728}
                  style={{ height: "2.5rem", width: "auto" }}
                  priority
                />
              </span>
              <span className="capa__mais">+</span>
              {proposta.cliente_logo_url ? (
                <span className="capa__chapa">
                  {/* Logo de terceiro: sem otimização, a origem é arbitrária. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proposta.cliente_logo_url}
                    alt={proposta.cliente_nome ?? "Cliente"}
                    className="capa__logo"
                  />
                </span>
              ) : (
                <span className="capa__sem-logo">{iniciais(proposta.cliente_nome)}</span>
              )}
            </div>

            <span className="chapeu">
              <i />
              Proposta comercial · {proposta.numero}
            </span>
            <h1>{proposta.titulo}</h1>

            <div className="capa__rodape">
              <span>
                <b>Preparada para</b>
                {proposta.cliente_nome}
              </span>
              {proposta.validade && (
                <span>
                  <b>Válida até</b>
                  {dataCompleta(proposta.validade)}
                </span>
              )}
              <span>
                <b>Por</b>
                {MARCA.fundador}, {MARCA.nome}
              </span>
            </div>
          </div>
        </section>

        {/* 2 · O cenário */}
        <section className="slide" aria-label="O cenário">
          <div className="slide__interno">
            <span className="chapeu">
              <i />O cenário
            </span>
            <h2>Onde o seu investimento está perdendo dinheiro hoje</h2>
            <p className="texto">
              {proposta.introducao ??
                "Sem rastreamento confiável e sem volume de teste, a plataforma otimiza no escuro e o custo por venda só sobe."}
            </p>
          </div>
        </section>

        {/* 3 · Escopo */}
        <section className="slide" aria-label="O que está incluso">
          <div className="slide__interno">
            <span className="chapeu">
              <i />O que está incluso
            </span>
            <h2>A operação inteira, não um serviço solto</h2>
            <ul className="escopo">
              {itens.map((item, i) => (
                <li key={item}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4 · Investimento */}
        <section className="slide" aria-label="Investimento">
          <div className="slide__interno">
            <span className="chapeu">
              <i />
              Investimento
            </span>
            <h2>O que custa e o que você recebe por isso</h2>

            <dl className="valores">
              <div className="valor-principal">
                <dt>Assessoria</dt>
                <dd>{brl(proposta.valor_mensal)}</dd>
                <small>por mês, recorrente</small>
              </div>
              <div className="valor-lado">
                {proposta.valor_setup > 0 && (
                  <div>
                    <dt>Setup inicial</dt>
                    <dd>{brl(proposta.valor_setup)}</dd>
                  </div>
                )}
                <div>
                  <dt>Contrato em 12 meses</dt>
                  <dd>{brl(contrato)}</dd>
                </div>
                {proposta.validade && (
                  <div>
                    <dt>Proposta válida até</dt>
                    <dd>{dataCompleta(proposta.validade)}</dd>
                  </div>
                )}
              </div>
            </dl>

            <p className="condicoes">
              {proposta.condicoes ||
                "O investimento em mídia é pago diretamente por você às plataformas. O valor acima é o da assessoria."}
            </p>
          </div>
        </section>

        {/* 5 · Aceite */}
        <section className="slide" aria-label="Aceite">
          <div className="slide__interno">
            <span className="chapeu">
              <i />
              Próximo passo
            </span>
            <h2>Aceite aqui e a gente começa</h2>
            <p className="texto">
              Ao aceitar, agendamos o setup e o acesso ao painel. Se quiser ajustar alguma coisa
              antes, é só chamar no WhatsApp.
            </p>

            {aceita ? (
              <p className="aceito">
                <Check size={20} />
                Proposta aceita. Vamos te chamar para começar.
              </p>
            ) : (
              <div className="aceite">
                <label htmlFor="assinatura">Seu nome completo</label>
                <input
                  id="assinatura"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Quem está aceitando"
                  autoComplete="name"
                />
                <div className="aceite__acoes">
                  <button
                    type="button"
                    className="bt bt--azul"
                    onClick={aceitar}
                    disabled={enviando}
                  >
                    <Check size={17} />
                    {enviando ? "Registrando…" : "Aceitar proposta"}
                  </button>
                  <a
                    href={linkWhatsApp(
                      `Oi! Recebi a proposta ${proposta.numero} e quero conversar.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bt bt--linha"
                  >
                    <MessageCircle size={17} />
                    Tirar uma dúvida
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <nav className="nav" aria-label="Navegação da proposta">
        <div className="nav__pontos">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              className="nav__ponto"
              aria-current={i === atual}
              aria-label={`Ir para a tela ${i + 1}`}
              onClick={() => irPara(i)}
            />
          ))}
        </div>

        <span className="nav__conta">
          {atual + 1} / {total}
        </span>

        <div className="nav__setas">
          <button
            className="nav__seta"
            onClick={() => irPara(atual - 1)}
            disabled={atual === 0}
            aria-label="Tela anterior"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="nav__seta"
            onClick={() => irPara(atual + 1)}
            disabled={atual === total - 1}
            aria-label="Próxima tela"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </nav>
    </div>
  );
}
