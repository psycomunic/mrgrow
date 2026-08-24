"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Campo, Entrada, AreaTexto, Selecao } from "@/components/ui/campo";
import { capturarParametros, rastrear, idEvento } from "@/lib/rastreamento";
import { linkWhatsApp } from "@/lib/marca";
import { cn } from "@/lib/utils";

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

/** Máscara de telefone brasileira aplicada durante a digitação. */
function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
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
      <div className="cartao-vidro rounded-xl p-10 text-center">
        <CheckCircle2 className="mx-auto size-14 text-sucesso" />
        <h3 className="mt-6 font-display text-2xl font-extrabold text-white">Pedido recebido</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-300">
          Vamos analisar sua conta, sua página e seu funil. Em até 24 horas você recebe o parecer
          com os três gargalos mais caros da sua operação.
        </p>
        <BotaoLink
          href={linkWhatsApp(`Oi! Sou ${dados.nome}, acabei de pedir o diagnóstico no site.`)}
          externo
          tamanho="lg"
          className="mt-8"
        >
          Adiantar pelo WhatsApp
        </BotaoLink>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="cartao-vidro rounded-xl p-6 sm:p-8" noValidate>
      <div className="mb-7 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= passo ? "bg-mrg-500" : "bg-white/10",
            )}
          />
        ))}
      </div>

      <input
        type="text"
        name="empresa_site"
        tabIndex={-1}
        autoComplete="off"
        value={armadilha}
        onChange={(e) => setArmadilha(e.target.value)}
        className="absolute -left-[9999px] size-0 opacity-0"
        aria-hidden
      />

      {passo === 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Vamos começar pelo básico</h3>
            <p className="mt-1 text-sm text-ink-400">Leva menos de 1 minuto.</p>
          </div>
          <Campo rotulo="Nome completo" erro={erros.nome}>
            <Entrada
              value={dados.nome}
              onChange={definir("nome")}
              placeholder="Como podemos te chamar?"
              autoComplete="name"
            />
          </Campo>
          <Campo rotulo="E-mail" erro={erros.email}>
            <Entrada
              type="email"
              value={dados.email}
              onChange={definir("email")}
              placeholder="voce@empresa.com.br"
              autoComplete="email"
            />
          </Campo>
          <Campo rotulo="WhatsApp" erro={erros.telefone}>
            <Entrada
              inputMode="tel"
              value={dados.telefone}
              onChange={definir("telefone")}
              placeholder="(00) 00000-0000"
              autoComplete="tel"
            />
          </Campo>
        </div>
      )}

      {passo === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">Sobre o seu negócio</h3>
            <p className="mt-1 text-sm text-ink-400">
              Isso define o tipo de análise que vamos fazer.
            </p>
          </div>
          <Campo rotulo="Empresa ou projeto" erro={erros.empresa}>
            <Entrada
              value={dados.empresa}
              onChange={definir("empresa")}
              placeholder="Nome da empresa"
              autoComplete="organization"
            />
          </Campo>
          <Campo rotulo="Instagram (opcional)">
            <Entrada
              value={dados.instagram}
              onChange={definir("instagram")}
              placeholder="@suaempresa"
            />
          </Campo>
          <Campo rotulo="Faturamento mensal atual" erro={erros.faturamento_mensal}>
            <Selecao value={dados.faturamento_mensal} onChange={definir("faturamento_mensal")}>
              <option value="">Selecione…</option>
              {FATURAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Quanto investe em anúncios hoje">
            <Selecao value={dados.investimento_trafego} onChange={definir("investimento_trafego")}>
              <option value="">Selecione…</option>
              {INVESTIMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>
      )}

      {passo === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">O que você precisa</h3>
            <p className="mt-1 text-sm text-ink-400">Última etapa.</p>
          </div>
          <Campo rotulo="Serviço de maior interesse">
            <Selecao value={dados.servico_desejado} onChange={definir("servico_desejado")}>
              <option value="">Selecione…</option>
              {SERVICOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Conte rapidamente o seu cenário" dica="Qual é o maior gargalo hoje?">
            <AreaTexto
              value={dados.mensagem}
              onChange={definir("mensagem")}
              placeholder="Ex.: invisto R$ 8 mil/mês no Meta, chegam leads mas quase ninguém fecha…"
            />
          </Campo>
        </div>
      )}

      <div className="mt-7 flex items-center gap-3">
        {passo > 0 && (
          <Botao type="button" variante="contorno" onClick={() => setPasso((p) => p - 1)}>
            <ArrowLeft className="size-4" />
            Voltar
          </Botao>
        )}
        {passo < 2 ? (
          <Botao type="button" onClick={avancar} largura="cheia" tamanho="lg">
            Continuar
            <ArrowRight className="size-4" />
          </Botao>
        ) : (
          <Botao type="submit" largura="cheia" tamanho="lg" disabled={enviando}>
            {enviando ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                Quero meu diagnóstico
                <ArrowRight className="size-4" />
              </>
            )}
          </Botao>
        )}
      </div>
    </form>
  );
}
