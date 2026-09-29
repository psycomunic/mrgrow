import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { hoje } from "@/lib/tempo";
import {
  atrasado,
  limitesDoMes,
  porMes,
  resumirFinanceiro,
  type MesResumo,
  type Movimento,
  type ResumoFinanceiro,
} from "@/lib/resumo";

/**
 * A régua de cobrança do mês.
 *
 * Lê os lançamentos de receita, e não os contratos. A primeira versão
 * gerava a linha a partir do fee de cada cliente contratado, e isso
 * produzia três erros que só apareceram com dado real: cobrava Repro
 * Premium em setembro, sendo que o contrato dela começa em outubro;
 * perdia as cobranças avulsas e as segundas parcelas do mesmo cliente no
 * mês; e ignorava quem está como prospecto mas já pagou. Além de discordar
 * do Financeiro, que lia a tabela certa.
 *
 * O preço de ler o lançamento é que alguém precisa criá-lo. Em troca, o
 * que a tela mostra é o que existe — e é o mesmo número em toda parte.
 */
export type Recebimento = {
  id: string;
  clienteId: string | null;
  cliente: string;
  slug: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  situacao: "previsto" | "pago" | "atrasado";
  pagoEm: string | null;
  /** Dias de atraso; zero quando em dia ou já pago. */
  atraso: number;
};

export type Recebimentos = {
  competencia: string;
  linhas: Recebimento[];
  resumo: ResumoFinanceiro;
  historico: MesResumo[];
  demo: boolean;
};

type Linha = {
  id: string;
  tipo: string;
  cliente_id: string | null;
  descricao: string;
  valor: number | string;
  valor_pago: number | string | null;
  status: string;
  vencimento: string;
  clientes: { nome: string; slug: string } | { nome: string; slug: string }[] | null;
};

function diasEntre(de: string, ate: string) {
  const ms = new Date(`${ate}T00:00:00Z`).getTime() - new Date(`${de}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function vazio(comp: string, demo: boolean): Recebimentos {
  return {
    competencia: comp,
    linhas: [],
    resumo: {
      previsto: 0, recebido: 0, aReceber: 0, atrasado: 0, qtdAtrasada: 0,
      despesas: 0, resultado: 0, resultadoPrevisto: 0, cobrancas: 0,
    },
    historico: [],
    demo,
  };
}

export async function carregarRecebimentos(comp: string): Promise<Recebimentos> {
  if (modoDemonstracao()) return vazio(comp, true);

  try {
    const sessao = await obterSessao();
    if (!sessao) return vazio(comp, false);

    const db = await criarClienteServidor();
    const org = sessao.organizacaoId;
    const { de, ate } = limitesDoMes(comp);
    const dia = hoje();

    /* Duas consultas em paralelo: a do mês, que vira a lista, e a série
       inteira de receitas, que vira o gráfico. São independentes e em
       série somariam a latência das duas. */
    const [doMes, serie] = await Promise.all([
      db
        .from("lancamentos")
        .select("id, tipo, cliente_id, descricao, valor, valor_pago, status, vencimento, clientes:cliente_id(nome, slug)")
        .eq("organizacao_id", org)
        .gte("vencimento", de)
        .lte("vencimento", ate)
        .order("vencimento"),
      db
        .from("lancamentos")
        .select("tipo, status, valor, valor_pago, vencimento")
        .eq("organizacao_id", org)
        .eq("tipo", "receita"),
    ]);

    if (doMes.error) {
      registrarFalha("carregarRecebimentos", doMes.error);
      return vazio(comp, false);
    }

    const linhasMes = (doMes.data ?? []) as unknown as Linha[];

    /* O resumo precisa das despesas do mês também, então recebe tudo o que
       venceu no período — é ele quem separa receita de despesa. */
    const movimentos: Movimento[] = linhasMes.map((l) => ({
      tipo: l.tipo,
      status: l.status,
      valor: Number(l.valor ?? 0),
      valor_pago: l.valor_pago === null ? null : Number(l.valor_pago),
      vencimento: l.vencimento,
    }));

    const linhas: Recebimento[] = linhasMes
      .filter((l) => l.tipo === "receita" && l.status !== "cancelado")
      .map((l) => {
        const c = Array.isArray(l.clientes) ? l.clientes[0] : l.clientes;
        const valor = Number(l.valor ?? 0);
        const m: Movimento = { tipo: "receita", status: l.status, valor, vencimento: l.vencimento };
        const pago = l.status === "pago";
        const vencida = atrasado(m, dia);

        return {
          id: l.id,
          clienteId: l.cliente_id,
          cliente: c?.nome ?? "Avulso",
          slug: c?.slug ?? null,
          descricao: l.descricao,
          valor,
          vencimento: l.vencimento,
          situacao: pago ? "pago" : vencida ? "atrasado" : "previsto",
          pagoEm: pago ? l.vencimento : null,
          atraso: vencida ? diasEntre(l.vencimento, dia) : 0,
        } satisfies Recebimento;
      })
      .sort(
        (a, b) =>
          a.vencimento.localeCompare(b.vencimento) || a.cliente.localeCompare(b.cliente, "pt-BR"),
      );

    const historico = porMes(
      ((serie.data ?? []) as unknown as Movimento[]).map((l) => ({
        tipo: "receita",
        status: l.status,
        valor: Number(l.valor ?? 0),
        valor_pago: l.valor_pago === null ? null : Number(l.valor_pago),
        vencimento: l.vencimento,
      })),
    );

    return {
      competencia: comp,
      linhas,
      resumo: resumirFinanceiro(movimentos, { de, ate, hoje: dia }),
      historico,
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarRecebimentos", e);
    return vazio(comp, false);
  }
}
