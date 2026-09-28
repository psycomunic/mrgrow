import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { contratado } from "@/lib/rotulos";
import { hoje } from "@/lib/tempo";

/**
 * A régua de cobrança do mês.
 *
 * Nasce da planilha que a agência usava: uma linha por cliente, com um
 * check quando o dinheiro entra. A diferença é de onde vem a linha. Na
 * planilha alguém digitava os previstos todo mês, e em mês corrido
 * ninguém digita — foi assim que meses inteiros ficaram sem registro e o
 * "Total Previsto" passou a mentir.
 *
 * Aqui o previsto sai do contrato: todo cliente contratado gera a linha
 * dele, exista ou não lançamento no banco. Marcar como recebido é que
 * grava. Enquanto ninguém marca, a linha continua aparecendo — e cobrança
 * esquecida fica visível em vez de sumir.
 */
export type Recebimento = {
  /** Nulo enquanto é só previsão: ainda não virou linha no banco. */
  id: string | null;
  clienteId: string;
  cliente: string;
  slug: string;
  valor: number;
  vencimento: string;
  /** `previsto` | `pago` | `atrasado` */
  situacao: "previsto" | "pago" | "atrasado";
  pagoEm: string | null;
  /** Dias de atraso; zero quando em dia ou já pago. */
  atraso: number;
};

export type MesResumo = { competencia: string; previsto: number; recebido: number };

export type Recebimentos = {
  competencia: string;
  linhas: Recebimento[];
  historico: MesResumo[];
  demo: boolean;
};

type LinhaCliente = { id: string; nome: string; slug: string; status: string; fee_mensal: number | string; dia_vencimento: number };
type LinhaLanc = { id: string; cliente_id: string | null; valor: number | string; valor_pago: number | string; status: string; vencimento: string; pago_em: string | null; competencia: string };

/** Primeiro dia da competência, no formato que a coluna `date` guarda. */
function primeiroDia(comp: string) {
  return `${comp}-01`;
}

/** O dia do vencimento dentro do mês pedido, sem estourar fevereiro. */
function vencimentoNoMes(comp: string, dia: number) {
  const [ano, mes] = comp.split("-").map(Number);
  const ultimo = new Date(ano, mes, 0).getDate();
  return `${comp}-${String(Math.min(dia, ultimo)).padStart(2, "0")}`;
}

function diasEntre(de: string, ate: string) {
  const ms = new Date(ate + "T00:00:00").getTime() - new Date(de + "T00:00:00").getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function vazio(comp: string, demo: boolean): Recebimentos {
  return { competencia: comp, linhas: [], historico: [], demo };
}

export async function carregarRecebimentos(comp: string): Promise<Recebimentos> {
  if (modoDemonstracao()) return vazio(comp, true);

  try {
    const sessao = await obterSessao();
    if (!sessao) return vazio(comp, false);

    const db = await criarClienteServidor();
    const org = sessao.organizacaoId;

    /* Em paralelo: são consultas independentes, e em série elas somariam a
       latência de todas — a régua abre a cada troca de mês. */
    const [clientesR, lancR, histR] = await Promise.all([
      db
        .from("clientes")
        .select("id, nome, slug, status, fee_mensal, dia_vencimento")
        .eq("organizacao_id", org)
        .order("nome"),
      db
        .from("lancamentos")
        .select("id, cliente_id, valor, valor_pago, status, vencimento, pago_em, competencia")
        .eq("organizacao_id", org)
        .eq("tipo", "receita")
        .eq("competencia", primeiroDia(comp)),
      db
        .from("lancamentos")
        .select("valor, valor_pago, status, competencia")
        .eq("organizacao_id", org)
        .eq("tipo", "receita")
        .order("competencia"),
    ]);

    if (clientesR.error) {
      registrarFalha("carregarRecebimentos", clientesR.error);
      return vazio(comp, false);
    }

    const clientes = (clientesR.data ?? []) as unknown as LinhaCliente[];
    const lancs = (lancR.data ?? []) as unknown as LinhaLanc[];
    const porCliente = new Map(lancs.filter((l) => l.cliente_id).map((l) => [l.cliente_id as string, l]));

    const dia = hoje();
    const linhas: Recebimento[] = [];

    for (const c of clientes) {
      if (!contratado(c.status)) continue;
      const fee = Number(c.fee_mensal ?? 0);
      const l = porCliente.get(c.id);
      if (!l && fee <= 0) continue;

      const venc = l?.vencimento ?? vencimentoNoMes(comp, c.dia_vencimento);
      const pago = l?.status === "pago";
      const atraso = pago ? 0 : venc < dia ? diasEntre(venc, dia) : 0;

      linhas.push({
        id: l?.id ?? null,
        clienteId: c.id,
        cliente: c.nome,
        slug: c.slug,
        valor: l ? Number(l.valor ?? 0) : fee,
        vencimento: venc,
        situacao: pago ? "pago" : atraso > 0 ? "atrasado" : "previsto",
        pagoEm: l?.pago_em ?? null,
        atraso,
      });
    }

    /* Lançamento de receita sem cliente — entrada avulsa, venda pontual —
       também é dinheiro do mês e não pode sumir da régua. */
    for (const l of lancs) {
      if (l.cliente_id) continue;
      const pago = l.status === "pago";
      const atraso = pago ? 0 : l.vencimento < dia ? diasEntre(l.vencimento, dia) : 0;
      linhas.push({
        id: l.id,
        clienteId: "",
        cliente: "Avulso",
        slug: "",
        valor: Number(l.valor ?? 0),
        vencimento: l.vencimento,
        situacao: pago ? "pago" : atraso > 0 ? "atrasado" : "previsto",
        pagoEm: l.pago_em,
        atraso,
      });
    }

    linhas.sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.cliente.localeCompare(b.cliente, "pt-BR"));

    /* Histórico por competência, para o gráfico de previsto contra recebido. */
    const mapa = new Map<string, MesResumo>();
    for (const l of (histR.data ?? []) as unknown as LinhaLanc[]) {
      const k = String(l.competencia).slice(0, 7);
      const m = mapa.get(k) ?? { competencia: k, previsto: 0, recebido: 0 };
      m.previsto += Number(l.valor ?? 0);
      if (l.status === "pago") m.recebido += Number(l.valor_pago ?? l.valor ?? 0);
      mapa.set(k, m);
    }

    return {
      competencia: comp,
      linhas,
      historico: [...mapa.values()].sort((a, b) => a.competencia.localeCompare(b.competencia)),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarRecebimentos", e);
    return vazio(comp, false);
  }
}
