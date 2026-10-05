"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { mensagemDeFalha } from "@/lib/acao-cliente";

/**
 * Avisa quando uma ação de servidor falha calada.
 *
 * ============================================================
 * O SILÊNCIO ERA O PROBLEMA
 * ============================================================
 * Os formulários do painel fazem `setEnviando(true)`, `await acao()`,
 * `setEnviando(false)`. Quando o `await` lança, a terceira linha não
 * roda: o botão fica girando em "Salvando…" para sempre, sem mensagem.
 * Quem preencheu fica olhando, sem saber se esperou pouco, se a internet
 * caiu, ou se perdeu o que digitou.
 *
 * Aconteceu de verdade ao salvar uma proposta, e o motivo vai se
 * repetir: toda publicação troca o identificador das ações de servidor,
 * e quem estava com a tela aberta na hora manda um pedido que já não
 * existe do outro lado.
 *
 * ============================================================
 * POR QUE AQUI, E NÃO NOS DEZESSEIS FORMULÁRIOS
 * ============================================================
 * `enviar` é uma função assíncrona chamada pelo onSubmit: o React não
 * espera a promessa dela, então a rejeição vira um `unhandledrejection`
 * da janela. Um ouvinte só alcança todos os formulários do painel, sem
 * reescrever nenhum — e sem o risco de quebrar quinze telas de uma vez.
 *
 * Isto NÃO destrava o botão: ele continua girando. Mas o caminho que a
 * mensagem indica é justamente recarregar, que destrava. Consertar o
 * estado preso em cada tela continua valendo, e é outro trabalho.
 */
export function RedeDeSeguranca() {
  useEffect(() => {
    const aoFalhar = (e: PromiseRejectionEvent) => {
      const texto = mensagemDeFalha(e.reason);
      /* Um id fixo: numa falha de rede o navegador costuma disparar
         várias rejeições seguidas, e três avisos iguais empilhados
         assustam mais que informam. */
      toast.error(texto, {
        id: "falha-de-acao",
        duration: 12000,
        action: {
          label: "Recarregar",
          onClick: () => window.location.reload(),
        },
      });
    };

    window.addEventListener("unhandledrejection", aoFalhar);
    return () => window.removeEventListener("unhandledrejection", aoFalhar);
  }, []);

  return null;
}
