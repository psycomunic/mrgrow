import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";
import { DEMO_SERIE, type PontoSerie } from "@/lib/demo";
import { emDias } from "@/lib/tempo";

export type Serie = { serie: PontoSerie[]; demo: boolean; falhou: boolean };

/**
 * Série diária consolidada da organização.
 *
 * A tabela `metricas_diarias` tem uma linha por conta+campanha+dia; aqui as
 * linhas do mesmo dia são somadas para virar a série que os gráficos e os
 * indicadores consomem. Agregar no cliente Postgres seria melhor (uma view
 * `metricas_por_dia` resolveria), mas exige `db:types` atualizado — e com a
 * janela de 90 dias o volume é pequeno o bastante para somar aqui.
 *
 * Para o papel `cliente`, só entram os clientes que ele tem permissão de ver:
 * o portal não pode mostrar a soma da agência.
 */
export async function carregarSerie(dias = 90): Promise<Serie> {
  if (modoDemonstracao()) {
    return { serie: DEMO_SERIE.slice(-dias), demo: true, falhou: false };
  }

  try {
    const sessao = await obterSessao();
    if (!sessao) return { serie: [], demo: false, falhou: false };

    const db = await criarClienteServidor();
    let consulta = db
      .from("metricas_diarias")
      .select("data, investimento, receita, leads, cliques, impressoes, compras")
      .eq("organizacao_id", sessao.organizacaoId)
      .gte("data", emDias(-dias))
      .order("data", { ascending: true })
      .limit(20_000);

    if (sessao.papel === "cliente") {
      if (!sessao.clientesPermitidos.length) return { serie: [], demo: false, falhou: false };
      consulta = consulta.in("cliente_id", sessao.clientesPermitidos);
    }

    const { data, error } = await consulta;
    if (error) {
      registrarFalha("carregarSerie", error);
      return { serie: [], demo: false, falhou: true };
    }

    type Linha = {
      data: string;
      investimento: number | string | null;
      receita: number | string | null;
      leads: number | string | null;
      cliques: number | string | null;
      impressoes: number | string | null;
      compras: number | string | null;
    };

    const porDia = new Map<string, PontoSerie>();
    for (const l of (data ?? []) as unknown as Linha[]) {
      const atual =
        porDia.get(l.data) ??
        { data: l.data, investimento: 0, receita: 0, leads: 0, cliques: 0, impressoes: 0, compras: 0 };
      atual.investimento += Number(l.investimento ?? 0);
      atual.receita += Number(l.receita ?? 0);
      atual.leads += Number(l.leads ?? 0);
      atual.cliques += Number(l.cliques ?? 0);
      atual.impressoes += Number(l.impressoes ?? 0);
      atual.compras += Number(l.compras ?? 0);
      porDia.set(l.data, atual);
    }

    return {
      serie: [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)),
      demo: false,
      falhou: false,
    };
  } catch (e) {
    registrarFalha("carregarSerie", e);
    return { serie: [], demo: false, falhou: true };
  }
}

/* ── Desempenho por conta ───────────────────────────────────────── */

export type DesempenhoConta = {
  id: string;
  nome: string;
  investimento: number;
  receita: number;
  leads: number;
  compras: number;
  roas: number;
};

export type PorConta = { contas: DesempenhoConta[]; demo: boolean; falhou: boolean };

/**
 * Métricas do período agrupadas por cliente.
 *
 * Em demonstração os valores são DERIVADOS da mesma série que alimenta os
 * cartões do topo: o investimento é distribuído entre as contas na proporção
 * da verba prevista de cada uma, e a receita é reescalada para fechar com o
 * total. Sem isso, a tabela somaria um número diferente do cartão logo acima
 * dela — que é o tipo de incoerência que faz alguém desconfiar de todo o
 * resto da tela.
 */
/**
 * Como a série consolidada da demonstração se divide entre as contas.
 *
 * A fatia de cada cliente é a proporção da verba prevista dele, e a receita é
 * reescalada para a soma fechar com o consolidado. É isto que faz a tabela por
 * conta somar exatamente o número do cartão logo acima dela — e a página de um
 * cliente bater com a linha dele na tabela.
 */
async function fatiasDemo() {
  const { DEMO_CLIENTES } = await import("@/lib/demo");
  const { resumir } = await import("@/lib/metricas");

  const total = resumir(DEMO_SERIE.slice(-30));
  const ativas = DEMO_CLIENTES.filter((c) => c.investimento_previsto > 0 && c.roas > 0);
  const pesoTotal = ativas.reduce((s, c) => s + c.investimento_previsto, 0) || 1;
  const somaBruta =
    ativas.reduce((s, c) => s + (c.investimento_previsto / pesoTotal) * c.roas, 0) || 1;
  const escalaRoas = total.receita / (total.investimento * somaBruta || 1);

  const fatias = new Map<string, { fatia: number; roas: number }>();
  for (const c of ativas) {
    fatias.set(c.id, {
      fatia: c.investimento_previsto / pesoTotal,
      roas: c.roas * escalaRoas,
    });
  }
  return { fatias, ativas };
}

export async function carregarPorConta(dias = 30): Promise<PorConta> {
  if (modoDemonstracao()) {
    const { resumir } = await import("@/lib/metricas");
    const total = resumir(DEMO_SERIE.slice(-dias));
    const { fatias, ativas } = await fatiasDemo();

    return {
      contas: ativas.map((c) => {
        const f = fatias.get(c.id)!;
        const investimento = Math.round(total.investimento * f.fatia);
        const receita = Math.round(investimento * f.roas);
        return {
          id: c.id,
          nome: c.nome,
          investimento,
          receita,
          leads: Math.round(total.leads * f.fatia),
          compras: Math.round(total.compras * f.fatia),
          roas: investimento ? receita / investimento : 0,
        };
      }),
      demo: true,
      falhou: false,
    };
  }

  try {
    const sessao = await obterSessao();
    if (!sessao) return { contas: [], demo: false, falhou: false };

    const db = await criarClienteServidor();
    let consulta = db
      .from("metricas_diarias")
      .select("cliente_id, investimento, receita, leads, compras, clientes(nome)")
      .eq("organizacao_id", sessao.organizacaoId)
      .gte("data", emDias(-dias))
      .not("cliente_id", "is", null)
      .limit(20_000);

    if (sessao.papel === "cliente") {
      if (!sessao.clientesPermitidos.length) return { contas: [], demo: false, falhou: false };
      consulta = consulta.in("cliente_id", sessao.clientesPermitidos);
    }

    const { data, error } = await consulta;
    if (error) {
      registrarFalha("carregarPorConta", error);
      return { contas: [], demo: false, falhou: true };
    }

    type Linha = {
      cliente_id: string;
      investimento: number | string | null;
      receita: number | string | null;
      leads: number | string | null;
      compras: number | string | null;
      clientes: { nome: string } | { nome: string }[] | null;
    };

    const mapa = new Map<string, DesempenhoConta>();
    for (const l of (data ?? []) as unknown as Linha[]) {
      const nome = (Array.isArray(l.clientes) ? l.clientes[0] : l.clientes)?.nome ?? "Sem nome";
      const atual =
        mapa.get(l.cliente_id) ??
        { id: l.cliente_id, nome, investimento: 0, receita: 0, leads: 0, compras: 0, roas: 0 };
      atual.investimento += Number(l.investimento ?? 0);
      atual.receita += Number(l.receita ?? 0);
      atual.leads += Number(l.leads ?? 0);
      atual.compras += Number(l.compras ?? 0);
      mapa.set(l.cliente_id, atual);
    }

    const contas = [...mapa.values()]
      .map((c) => ({ ...c, roas: c.investimento ? c.receita / c.investimento : 0 }))
      .sort((a, b) => b.investimento - a.investimento);

    return { contas, demo: false, falhou: false };
  } catch (e) {
    registrarFalha("carregarPorConta", e);
    return { contas: [], demo: false, falhou: true };
  }
}


/**
 * Série diária de um cliente só — a base da página de detalhe da conta.
 *
 * Em demonstração ela é a série consolidada multiplicada pela fatia do
 * cliente, com o ROAS dele: assim a página do cliente fecha com a linha dele
 * na tabela de desempenho por conta, em vez de repetir o número da agência
 * inteira como se fosse dele (era o que a tela fazia).
 */
export async function carregarSerieDoCliente(clienteId: string, dias = 60): Promise<Serie> {
  if (modoDemonstracao()) {
    const { fatias } = await fatiasDemo();
    const f = fatias.get(clienteId);
    if (!f) return { serie: [], demo: true, falhou: false };

    return {
      /* O ROAS do cliente oscila dia a dia em torno da média dele. Com um
         múltiplo fixo, receita seria investimento vezes uma constante: as duas
         linhas do gráfico se sobrepunham exatamente e a variação do ROAS ficava
         cravada em 0,0%. A oscilação vem do próprio ROAS do dia na série
         consolidada, então continua determinística. */
      serie: DEMO_SERIE.slice(-dias).map((p) => {
        const investimento = Math.round(p.investimento * f.fatia);
        const roasDoDia = p.investimento ? p.receita / p.investimento : 1;
        const roasMedio = 4.2;
        const oscilacao = 0.72 + (roasDoDia / roasMedio) * 0.28;
        return {
          data: p.data,
          investimento,
          receita: Math.round(investimento * f.roas * oscilacao),
          leads: Math.round(p.leads * f.fatia),
          cliques: Math.round(p.cliques * f.fatia),
          impressoes: Math.round(p.impressoes * f.fatia),
          compras: Math.round(p.compras * f.fatia),
        };
      }),
      demo: true,
      falhou: false,
    };
  }

  try {
    const sessao = await obterSessao();
    if (!sessao) return { serie: [], demo: false, falhou: false };
    if (sessao.papel === "cliente" && !sessao.clientesPermitidos.includes(clienteId)) {
      return { serie: [], demo: false, falhou: false };
    }

    const db = await criarClienteServidor();
    const { data, error } = await db
      .from("metricas_diarias")
      .select("data, investimento, receita, leads, cliques, impressoes, compras")
      .eq("organizacao_id", sessao.organizacaoId)
      .eq("cliente_id", clienteId)
      .gte("data", emDias(-dias))
      .order("data", { ascending: true })
      .limit(20_000);

    if (error) {
      registrarFalha("carregarSerieDoCliente", error);
      return { serie: [], demo: false, falhou: true };
    }

    const porDia = new Map<string, PontoSerie>();
    for (const l of (data ?? []) as unknown as Array<Record<string, string | number | null>>) {
      const dia = String(l.data);
      const atual =
        porDia.get(dia) ??
        { data: dia, investimento: 0, receita: 0, leads: 0, cliques: 0, impressoes: 0, compras: 0 };
      atual.investimento += Number(l.investimento ?? 0);
      atual.receita += Number(l.receita ?? 0);
      atual.leads += Number(l.leads ?? 0);
      atual.cliques += Number(l.cliques ?? 0);
      atual.impressoes += Number(l.impressoes ?? 0);
      atual.compras += Number(l.compras ?? 0);
      porDia.set(dia, atual);
    }

    return {
      serie: [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)),
      demo: false,
      falhou: false,
    };
  } catch (e) {
    registrarFalha("carregarSerieDoCliente", e);
    return { serie: [], demo: false, falhou: true };
  }
}
