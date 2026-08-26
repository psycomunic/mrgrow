import "server-only";

/**
 * Limitador de taxa simples, em memória.
 *
 * Não é distribuído: cada instância serverless tem o seu contador, então um
 * atacante com sorte de roteamento consegue mais que o limite nominal. Ainda
 * assim resolve o caso real — um script apontado para /api/leads enchendo a
 * tabela, disparando automações e poluindo a otimização das campanhas com
 * eventos falsos na CAPI da Meta. Para um teto rígido, trocar por Upstash
 * Redis ou pelo rate limit da Vercel mantendo esta mesma assinatura.
 */

type Janela = { contagem: number; expiraEm: number };

const balde = new Map<string, Janela>();
const TETO_DE_CHAVES = 10_000;

export type Veredito = { permitido: boolean; restante: number; esperarSegundos: number };

export function limitar(chave: string, maximo: number, janelaMs: number): Veredito {
  const agora = Date.now();
  const atual = balde.get(chave);

  if (!atual || atual.expiraEm <= agora) {
    /* Faxina preguiçosa: sem isto o Map cresce sem limite num processo de
       vida longa. Só roda quando o mapa já está grande. */
    if (balde.size > TETO_DE_CHAVES) {
      for (const [k, v] of balde) if (v.expiraEm <= agora) balde.delete(k);
    }
    balde.set(chave, { contagem: 1, expiraEm: agora + janelaMs });
    return { permitido: true, restante: maximo - 1, esperarSegundos: 0 };
  }

  atual.contagem += 1;
  if (atual.contagem > maximo) {
    return {
      permitido: false,
      restante: 0,
      esperarSegundos: Math.ceil((atual.expiraEm - agora) / 1000),
    };
  }

  return { permitido: true, restante: maximo - atual.contagem, esperarSegundos: 0 };
}

/** IP de quem chamou, na ordem em que os proxies da Vercel preenchem. */
export function ipDaRequisicao(cabecalhos: Headers) {
  return (
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip") ||
    "desconhecido"
  );
}
