"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PearlButton } from "@/components/ui/pearl-button";
import { capturarParametros, rastrear, idEvento } from "@/lib/rastreamento";
import { linkWhatsApp } from "@/lib/marca";

type Dados = {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  instagram: string;
  faturamento_mensal: string;
  investimento_trafego: string;
  servico_desejado: string;
  mensagem: string;
};

const VAZIO: Dados = {
  nome: "", email: "", telefone: "", empresa: "", instagram: "",
  faturamento_mensal: "", investimento_trafego: "", servico_desejado: "", mensagem: "",
};

const FATURAMENTO = [
  "Até R$ 20 mil/mês",
  "R$ 20 mil a R$ 50 mil/mês",
  "R$ 50 mil a R$ 100 mil/mês",
  "R$ 100 mil a R$ 300 mil/mês",
  "Acima de R$ 300 mil/mês",
];

const INVESTIMENTO = [
  "Ainda não invisto",
  "Até R$ 3 mil/mês",
  "R$ 3 mil a R$ 10 mil/mês",
  "R$ 10 mil a R$ 30 mil/mês",
  "Acima de R$ 30 mil/mês",
];

const SERVICOS = [
  "Gestão de tráfego (Meta e/ou Google)",
  "Landing page de alta conversão",
  "Criativos e produção",
  "Rastreamento e dados",
  "Operação completa",
];

const PASSOS = ["Contato", "Negócio", "Necessidade"];

/** Máscara de telefone brasileira aplicada durante a digitação. */
function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Campo({
  rotulo,
  erro,
  dica,
  children,
}: {
  rotulo: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={erro ? "campo campo--erro" : "campo"}>
      <span className="campo__rotulo">{rotulo}</span>
      {children}
      {erro ? (
        <span className="campo__erro">{erro}</span>
      ) : (
        dica && <span className="campo__dica">{dica}</span>
      )}
    </label>
  );
}

export function FormularioDiagnostico() {
  const [passo, setPasso] = useState(0);
  const [dados, setDados] = useState<Dados>(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erros, setErros] = useState<Partial<Record<keyof Dados, string>>>({});
  const [armadilha, setArmadilha] = useState(""); // honeypot anti-spam

  useEffect(() => {
    capturarParametros();
  }, []);

  const definir =
    (campo: keyof Dados) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const valor = campo === "telefone" ? mascararTelefone(e.target.value) : e.target.value;
      setDados((d) => ({ ...d, [campo]: valor }));
      setErros((x) => ({ ...x, [campo]: undefined }));
    };

  function validarPasso(indice: number) {
    const novos: Partial<Record<keyof Dados, string>> = {};
    if (indice === 0) {
      if (dados.nome.trim().length < 3) novos.nome = "Informe seu nome completo.";
      if (!/^\S+@\S+\.\S+$/.test(dados.email)) novos.email = "E-mail inválido.";
      if (dados.telefone.replace(/\D/g, "").length < 10) novos.telefone = "WhatsApp com DDD.";
    }
    if (indice === 1) {
      if (!dados.empresa.trim()) novos.empresa = "Nome da empresa ou projeto.";
      if (!dados.faturamento_mensal) novos.faturamento_mensal = "Selecione uma faixa.";
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  function avancar() {
    if (!validarPasso(passo)) return;
    rastrear("diagnostico_passo", { passo: passo + 1 });
    setPasso((p) => Math.min(p + 1, 2));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (armadilha) return; // bot
    if (!validarPasso(1)) return setPasso(1);

    setEnviando(true);
    const eventId = idEvento();

    try {
      const resposta = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dados,
          origem: "landing_page",
          pagina: window.location.pathname,
          referrer: document.referrer,
          utm: capturarParametros(),
          event_id: eventId,
        }),
      });

      if (!resposta.ok) throw new Error("Falha no envio");

      rastrear("Lead", { content_name: "Diagnóstico gratuito", value: 1, currency: "BRL" }, eventId);
      setEnviado(true);
      toast.success("Recebemos seus dados. Retornamos em até 24h.");
    } catch {
      toast.error("Não conseguimos enviar agora. Chame no WhatsApp que resolvemos na hora.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="ficha-form vidro">
        <div className="ficha-form__cabeca">
          <span>Pedido registrado</span>
        </div>
        <div className="recebido">
          <span className="recebido__selo">Protocolo aberto</span>
          <h3>Recebemos o seu pedido</h3>
          <p>
            Vamos analisar sua conta, sua página e seu funil. Em até 24 horas úteis você recebe o
            parecer com os três gargalos mais caros da sua operação.
          </p>
          <a
            href={linkWhatsApp(`Oi! Sou ${dados.nome}, acabei de pedir o diagnóstico no site.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="acao acao--azul"
          >
            Adiantar pelo WhatsApp
            <ArrowRight size={17} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="ficha-form vidro" noValidate>
      <div className="ficha-form__cabeca">
        <span>Pedido de diagnóstico</span>
        <span className="ficha-form__passo">
          {passo + 1}/3 · {PASSOS[passo]}
        </span>
      </div>

      <div className="ficha-form__corpo">
        <div className="progresso" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} data-feito={i <= passo ? "sim" : "nao"} />
          ))}
        </div>

        <input
          type="text"
          name="empresa_site"
          tabIndex={-1}
          autoComplete="off"
          value={armadilha}
          onChange={(e) => setArmadilha(e.target.value)}
          className="armadilha"
          aria-hidden
        />

        {passo === 0 && (
          <>
            <p className="form__titulo">Vamos começar pelo básico</p>
            <p className="form__sub">Leva menos de um minuto.</p>

            <Campo rotulo="Nome completo" erro={erros.nome}>
              <input
                value={dados.nome}
                onChange={definir("nome")}
                placeholder="Como podemos te chamar?"
                autoComplete="name"
              />
            </Campo>
            <Campo rotulo="E-mail" erro={erros.email}>
              <input
                type="email"
                value={dados.email}
                onChange={definir("email")}
                placeholder="voce@empresa.com.br"
                autoComplete="email"
              />
            </Campo>
            <Campo rotulo="WhatsApp" erro={erros.telefone}>
              <input
                inputMode="tel"
                value={dados.telefone}
                onChange={definir("telefone")}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
            </Campo>
          </>
        )}

        {passo === 1 && (
          <>
            <p className="form__titulo">Sobre o seu negócio</p>
            <p className="form__sub">Isso define o tipo de análise que vamos fazer.</p>

            <Campo rotulo="Empresa ou projeto" erro={erros.empresa}>
              <input
                value={dados.empresa}
                onChange={definir("empresa")}
                placeholder="Nome da empresa"
                autoComplete="organization"
              />
            </Campo>
            <Campo rotulo="Instagram (opcional)">
              <input
                value={dados.instagram}
                onChange={definir("instagram")}
                placeholder="@suaempresa"
              />
            </Campo>
            <Campo rotulo="Faturamento mensal atual" erro={erros.faturamento_mensal}>
              <select value={dados.faturamento_mensal} onChange={definir("faturamento_mensal")}>
                <option value="">Selecione…</option>
                {FATURAMENTO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Quanto investe em anúncios hoje">
              <select value={dados.investimento_trafego} onChange={definir("investimento_trafego")}>
                <option value="">Selecione…</option>
                {INVESTIMENTO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Campo>
          </>
        )}

        {passo === 2 && (
          <>
            <p className="form__titulo">O que você precisa</p>
            <p className="form__sub">Última etapa.</p>

            <Campo rotulo="Serviço de maior interesse">
              <select value={dados.servico_desejado} onChange={definir("servico_desejado")}>
                <option value="">Selecione…</option>
                {SERVICOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Conte rapidamente o seu cenário" dica="Qual é o maior gargalo hoje?">
              <textarea
                value={dados.mensagem}
                onChange={definir("mensagem")}
                placeholder="Ex.: invisto R$ 8 mil/mês no Meta, chegam leads mas quase ninguém fecha…"
              />
            </Campo>
          </>
        )}

        <div className="form__acoes">
          {passo > 0 && (
            <button
              type="button"
              className="acao acao--linha acao--voltar"
              onClick={() => setPasso((p) => p - 1)}
            >
              Voltar
            </button>
          )}
          {passo < 2 ? (
            <PearlButton type="button" onClick={avancar} label="Continuar" />
          ) : (
            <PearlButton
              type="submit"
              disabled={enviando}
              label={enviando ? "Enviando…" : "Pedir diagnóstico"}
            />
          )}
        </div>
      </div>
    </form>
  );
}
