import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { decifrar } from "@/lib/cripto";
import { emDias, hoje } from "@/lib/tempo";
import { buscarInsights, normalizarInsight } from "./meta";
import { buscarRelatorioGoogleAds, buscarRelatorioGA4, renovarTokenGoogle } from "./google";

type Janela = { desde: string; ate: string };

/** Relação `integracoes` que vem no join da consulta de contas externas. */
type TokensIntegracao = {
  token_acesso_cifrado: string | null;
  token_atualizacao_cifrado: string | null;
  expira_em: string | null;
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

/* A janela é calculada no fuso da agência. Em UTC, uma sincronização rodando
   às 22h de Brasília pedia "até amanhã" às plataformas e perdia o dia atual. */
export function janelaPadrao(dias = 7): Janela {
  return { desde: emDias(-dias), ate: hoje() };
}

/**
 * Sincroniza todas as contas externas ativas de uma organização.
 * Chamado por /api/cron/sincronizar e pelo botão "Sincronizar agora".
 */
export async function sincronizarOrganizacao(organizacaoId: string, janela = janelaPadrao()) {
  const db = criarClienteAdmin();
  const inicioGeral = Date.now();
  let total = 0;

  const { data: contas } = await db
    .from("contas_externas")
    .select("id, provedor, id_externo, cliente_id, integracao_id, integracoes(token_acesso_cifrado, token_atualizacao_cifrado, expira_em)")
    .eq("organizacao_id", organizacaoId)
    .eq("ativa", true)
    .eq("sincronizar", true);

  for (const conta of contas ?? []) {
    // O stub de tipos do Supabase não conhece o join; os tipos reais vêm de `npm run db:types`.
    const integracao =
      (conta as unknown as { integracoes?: TokensIntegracao | null }).integracoes ?? null;
    if (!integracao?.token_acesso_cifrado) continue;

    /* Antes, `duracao_ms` usava o instante inicial do loop inteiro, então o
       log mostrava o tempo acumulado — a última conta parecia lentíssima. */
    const inicioConta = Date.now();

    try {
      let token = decifrar(integracao.token_acesso_cifrado);
      let linhas: LinhaMetrica[] = [];

      if (conta.provedor === "meta_ads") {
        /* O token de longa duração da Meta vale ~60 dias e nada o renova.
           Sem esta checagem a sincronização passava a falhar em silêncio com
           um erro genérico da API. */
        if (integracao.expira_em && new Date(integracao.expira_em).getTime() < Date.now()) {
          throw new Error("Token da Meta expirado — reconecte a conta em Integrações.");
        }
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
        /* As campanhas precisam existir antes das métricas: `campanha_id` é
           FK para `campanhas`, e sem resolvê-la todas as campanhas de um dia
           colapsavam na mesma linha (conta, null, data), sobrescrevendo umas
           às outras. O id da plataforma continua guardado em `id_externo`. */
        const idPorExterno = await resolverCampanhas(db, organizacaoId, conta, linhas);

        const registros = linhas.map((l) => ({
          organizacao_id: organizacaoId,
          cliente_id: conta.cliente_id,
          conta_externa_id: conta.id,
          provedor: conta.provedor,
          campanha_id: l.id_campanha ? (idPorExterno.get(String(l.id_campanha)) ?? null) : null,
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

        /* O índice único correspondente é criado na migração 0012 com
           `nulls not distinct` — sem isso, linhas com campanha nula (o
           agregado da conta) nunca conflitariam entre si e duplicariam a cada
           execução. Antes desta correção o `onConflict` não batia com índice
           nenhum e o Postgres respondia 42P10: a sincronização inteira
           falhava sem gravar uma única linha. */
        const { error: erroUpsert } = await db.from("metricas_diarias").upsert(registros, {
          onConflict: "conta_externa_id,campanha_id,data",
          ignoreDuplicates: false,
        });
        if (erroUpsert) throw erroUpsert;
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
        duracao_ms: Date.now() - inicioConta,
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
        duracao_ms: Date.now() - inicioConta,
      });
    }
  }

  return { contas: contas?.length ?? 0, registros: total, ms: Date.now() - inicioGeral };
}

/**
 * Garante que cada campanha vista nas métricas exista em `campanhas` e
 * devolve o mapa id_externo → uuid.
 */
async function resolverCampanhas(
  db: ReturnType<typeof criarClienteAdmin>,
  organizacaoId: string,
  conta: { id: string; provedor: string; cliente_id: string | null },
  linhas: LinhaMetrica[],
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();

  const vistas = new Map<string, string>();
  for (const l of linhas) {
    if (l.id_campanha) vistas.set(String(l.id_campanha), String(l.nome_campanha ?? l.id_campanha));
  }
  if (!vistas.size) return mapa;

  const { data, error } = await db
    .from("campanhas")
    .upsert(
      [...vistas].map(([idExterno, nome]) => ({
        organizacao_id: organizacaoId,
        conta_externa_id: conta.id,
        cliente_id: conta.cliente_id,
        provedor: conta.provedor,
        id_externo: idExterno,
        nome,
      })),
      { onConflict: "conta_externa_id,id_externo" },
    )
    .select("id, id_externo");

  if (error) {
    console.error("[sincronizar] falha ao resolver campanhas", error);
    return mapa;
  }

  for (const c of (data ?? []) as Array<{ id: string; id_externo: string }>) {
    mapa.set(c.id_externo, c.id);
  }
  return mapa;
}
