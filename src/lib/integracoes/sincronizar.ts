import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { decifrar } from "@/lib/cripto";
import { buscarInsights, normalizarInsight } from "./meta";
import { buscarRelatorioGoogleAds, buscarRelatorioGA4, renovarTokenGoogle } from "./google";

type Janela = { desde: string; ate: string };

/** Relação `integracoes` que vem no join da consulta de contas externas. */
type TokensIntegracao = {
  token_acesso_cifrado: string | null;
  token_atualizacao_cifrado: string | null;
};

/** Linha já normalizada, no formato que `metricas_diarias` espera. */
type LinhaMetrica = {
  data: string;
  id_campanha?: string | null;
  nome_campanha?: string | null;
  investimento?: number;
  impressoes?: number;
  alcance?: number;
  cliques?: number;
  cliques_link?: number;
  conversas?: number;
  conversoes?: number;
  leads?: number;
  compras?: number;
  receita?: number;
  sessoes?: number;
  usuarios?: number;
};

export function janelaPadrao(dias = 7): Janela {
  const ate = new Date();
  const desde = new Date();
  desde.setDate(ate.getDate() - dias);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: iso(desde), ate: iso(ate) };
}

/**
 * Sincroniza todas as contas externas ativas de uma organização.
 * Chamado por /api/cron/sincronizar e pelo botão "Sincronizar agora".
 */
export async function sincronizarOrganizacao(organizacaoId: string, janela = janelaPadrao()) {
  const db = criarClienteAdmin();
  const inicio = Date.now();
  let total = 0;

  const { data: contas } = await db
    .from("contas_externas")
    .select("id, provedor, id_externo, cliente_id, integracao_id, integracoes(token_acesso_cifrado, token_atualizacao_cifrado)")
    .eq("organizacao_id", organizacaoId)
    .eq("ativa", true)
    .eq("sincronizar", true);

  for (const conta of contas ?? []) {
    // O stub de tipos do Supabase não conhece o join; os tipos reais vêm de `npm run db:types`.
    const integracao =
      (conta as unknown as { integracoes?: TokensIntegracao | null }).integracoes ?? null;
    if (!integracao?.token_acesso_cifrado) continue;

    try {
      let token = decifrar(integracao.token_acesso_cifrado);
      let linhas: LinhaMetrica[] = [];

      if (conta.provedor === "meta_ads") {
        const insights = await buscarInsights(token, conta.id_externo, janela.desde, janela.ate);
        linhas = insights.map(normalizarInsight);
      } else if (conta.provedor === "google_ads") {
        if (integracao.token_atualizacao_cifrado) {
          const renovado = await renovarTokenGoogle(decifrar(integracao.token_atualizacao_cifrado));
          token = renovado.access_token;
        }
        const dados = await buscarRelatorioGoogleAds(token, conta.id_externo, janela.desde, janela.ate);
        linhas = dados.map((d) => ({ ...d, leads: d.conversoes, compras: d.conversoes }));
      } else if (conta.provedor === "google_analytics") {
        if (integracao.token_atualizacao_cifrado) {
          const renovado = await renovarTokenGoogle(decifrar(integracao.token_atualizacao_cifrado));
          token = renovado.access_token;
        }
        const dados = await buscarRelatorioGA4(token, conta.id_externo, janela.desde, janela.ate);
        linhas = dados.map((d) => ({ ...d, leads: d.conversoes }));
      }

      if (linhas.length) {
        const registros = linhas.map((l) => ({
          organizacao_id: organizacaoId,
          cliente_id: conta.cliente_id,
          conta_externa_id: conta.id,
          provedor: conta.provedor,
          data: l.data,
          investimento: l.investimento ?? 0,
          impressoes: l.impressoes ?? 0,
          alcance: l.alcance ?? 0,
          cliques: l.cliques ?? 0,
          cliques_link: l.cliques_link ?? 0,
          conversas: l.conversas ?? 0,
          leads: l.leads ?? 0,
          compras: l.compras ?? 0,
          receita: l.receita ?? 0,
          sessoes: l.sessoes ?? 0,
          usuarios: l.usuarios ?? 0,
          metricas_extras: { nome_campanha: l.nome_campanha ?? null, id_campanha: l.id_campanha ?? null },
        }));

        await db.from("metricas_diarias").upsert(registros, {
          onConflict: "conta_externa_id,campanha_id,data",
          ignoreDuplicates: false,
        });
        total += registros.length;
      }

      await db
        .from("integracoes")
        .update({ ultima_sincronizacao_em: new Date().toISOString(), status: "conectada", ultimo_erro: null })
        .eq("id", conta.integracao_id);

      await db.from("sincronizacoes").insert({
        organizacao_id: organizacaoId,
        integracao_id: conta.integracao_id,
        provedor: conta.provedor,
        janela_inicio: janela.desde,
        janela_fim: janela.ate,
        registros: linhas.length,
        duracao_ms: Date.now() - inicio,
        sucesso: true,
      });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      await db
        .from("integracoes")
        .update({ status: "erro", ultimo_erro: mensagem })
        .eq("id", conta.integracao_id);
      await db.from("sincronizacoes").insert({
        organizacao_id: organizacaoId,
        integracao_id: conta.integracao_id,
        provedor: conta.provedor,
        janela_inicio: janela.desde,
        janela_fim: janela.ate,
        sucesso: false,
        erro: mensagem,
      });
    }
  }

  return { contas: contas?.length ?? 0, registros: total, ms: Date.now() - inicio };
}
