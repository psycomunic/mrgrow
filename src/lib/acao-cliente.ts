/**
 * Executa uma ação de servidor sem deixar o botão preso em "Salvando…".
 *
 * ============================================================
 * O QUE ISTO CONSERTA
 * ============================================================
 * Os formulários faziam `setEnviando(true)`, `await acao()`,
 * `setEnviando(false)`. Se o `await` lança, a terceira linha nunca roda:
 * o botão fica girando para sempre, sem mensagem, e quem preencheu não
 * tem ideia do que aconteceu nem do que fazer.
 *
 * Aconteceu de verdade no construtor de propostas, e por um motivo que
 * vai se repetir: toda publicação troca o identificador das ações de
 * servidor. Quem estava com a tela aberta na hora manda um pedido que já
 * não existe do outro lado, o Next recusa, e o `await` lança.
 *
 * Fora esse, há os de sempre: internet que cai no meio, o aplicativo
 * reiniciando, a sessão expirando.
 *
 * ============================================================
 * POR QUE NÃO BASTA UM `try` SOLTO EM CADA TELA
 * ============================================================
 * Porque o caso da publicação precisa de uma mensagem que diga o que
 * fazer — recarregar — e ninguém vai lembrar disso em dezesseis
 * formulários. Aqui a tradução mora num lugar só.
 */

/** O que o Next lança quando a tela é de uma versão que já saiu do ar. */
const DESATUALIZADA = /failed to find server action|invalid server actions request/i;

export type Resultado = { ok: boolean; erro?: string };

export function mensagemDeFalha(erro: unknown): string {
  const texto = erro instanceof Error ? erro.message : String(erro);

  if (DESATUALIZADA.test(texto)) {
    return "A plataforma foi atualizada enquanto esta tela estava aberta. Recarregue a página e envie de novo.";
  }
  /* `fetch` que não completa vira TypeError com mensagem genérica. Dizer
     "falha de rede" é mais útil que repetir "Failed to fetch". */
  if (/failed to fetch|networkerror|load failed/i.test(texto)) {
    return "Não deu para falar com o servidor. Confira a conexão e tente de novo.";
  }
  return "Não foi possível salvar. Tente de novo em instantes.";
}

/**
 * Roda a ação e devolve sempre um resultado — nunca lança.
 *
 * Quem chama fica com um caminho só para tratar: olhar `ok`. O estado de
 * "enviando" pode ser desligado com segurança logo depois.
 */
export async function semTravar<T extends Resultado>(
  acao: () => Promise<T>,
): Promise<T | { ok: false; erro: string }> {
  try {
    return await acao();
  } catch (e) {
    return { ok: false, erro: mensagemDeFalha(e) };
  }
}
