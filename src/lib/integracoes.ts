import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao, registrarFalha } from "@/lib/dados";
import { obterSessao } from "@/lib/sessao";

/**
 * Estado real das integrações.
 *
 * A tela lia uma constante de demonstração e mostrava "Conectada · 6
 * contas vinculadas · sincronizado há 8 minutos" com o banco vazio e sem
 * nenhuma credencial configurada. Painel que inventa conexão é pior que
 * painel vazio: quem confia nele deixa de conferir a conta de anúncio, e
 * descobre semanas depois que nunca houve sincronização nenhuma.
 */
export type ContaVinculada = {
  id: string;
  nome: string;
  idExterno: string;
  tipo: string;
  moeda: string | null;
  sincronizar: boolean;
  cliente: string | null;
  clienteId: string | null;
};

export type Integracao = {
  id: string;
  provedor: string;
  status: string;
  rotulo: string | null;
  contaNome: string | null;
  escopos: string[];
  expiraEm: string | null;
  ultimoErro: string | null;
  ultimaSincronizacao: string | null;
  contas: ContaVinculada[];
};

/**
 * Se o servidor tem a credencial daquela plataforma.
 *
 * Sem ela o botão "Conectar" leva a uma tela de erro do próprio Meta ou
 * do Google, que não explica nada a quem clicou. Saber disso aqui deixa a
 * tela dizer o que falta antes de a pessoa sair do painel.
 */
export type Credenciais = {
  meta: boolean;
  google: boolean;
  /** O Google Ads precisa de um token de desenvolvedor além do OAuth. */
  googleAdsToken: boolean;
  /** Sem ele os tokens não podem ser cifrados, e nada pode ser guardado. */
  cifra: boolean;
};

export function credenciaisConfiguradas(): Credenciais {
  const tem = (v: string | undefined) => Boolean(v && v.trim());
  return {
    meta: tem(process.env.META_APP_ID) && tem(process.env.META_APP_SECRET),
    google: tem(process.env.GOOGLE_CLIENT_ID) && tem(process.env.GOOGLE_CLIENT_SECRET),
    googleAdsToken: tem(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
    cifra: tem(process.env.TOKEN_ENCRYPTION_KEY),
  };
}

type LinhaIntegracao = {
  id: string;
  provedor: string;
  status: string;
  rotulo: string | null;
  conta_externa_nome: string | null;
  escopos: string[] | null;
  expira_em: string | null;
  ultimo_erro: string | null;
  ultima_sincronizacao_em: string | null;
};

type LinhaConta = {
  id: string;
  integracao_id: string;
  provedor: string;
  tipo: string;
  id_externo: string;
  nome: string;
  moeda: string | null;
  sincronizar: boolean;
  cliente_id: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
};

export async function carregarIntegracoes(): Promise<{
  integracoes: Integracao[];
  demo: boolean;
}> {
  if (modoDemonstracao()) return { integracoes: [], demo: true };

  try {
    const sessao = await obterSessao();
    if (!sessao) return { integracoes: [], demo: false };

    const db = await criarClienteServidor();
    const org = sessao.organizacaoId;

    const [ints, contas] = await Promise.all([
      db
        .from("integracoes")
        .select(
          "id, provedor, status, rotulo, conta_externa_nome, escopos, expira_em, ultimo_erro, ultima_sincronizacao_em",
        )
        .eq("organizacao_id", org),
      db
        .from("contas_externas")
        .select(
          "id, integracao_id, provedor, tipo, id_externo, nome, moeda, sincronizar, cliente_id, clientes:cliente_id(nome)",
        )
        .eq("organizacao_id", org)
        .eq("ativa", true)
        .order("nome"),
    ]);

    if (ints.error) {
      registrarFalha("carregarIntegracoes", ints.error);
      return { integracoes: [], demo: false };
    }

    const porIntegracao = new Map<string, ContaVinculada[]>();
    for (const c of (contas.data ?? []) as unknown as LinhaConta[]) {
      const cl = Array.isArray(c.clientes) ? c.clientes[0] : c.clientes;
      const lista = porIntegracao.get(c.integracao_id) ?? [];
      lista.push({
        id: c.id,
        nome: c.nome,
        idExterno: c.id_externo,
        tipo: c.tipo,
        moeda: c.moeda,
        sincronizar: c.sincronizar,
        cliente: cl?.nome ?? null,
        clienteId: c.cliente_id,
      });
      porIntegracao.set(c.integracao_id, lista);
    }

    return {
      integracoes: ((ints.data ?? []) as unknown as LinhaIntegracao[]).map((i) => ({
        id: i.id,
        provedor: i.provedor,
        status: i.status,
        rotulo: i.rotulo,
        contaNome: i.conta_externa_nome,
        escopos: i.escopos ?? [],
        expiraEm: i.expira_em,
        ultimoErro: i.ultimo_erro,
        ultimaSincronizacao: i.ultima_sincronizacao_em,
        contas: porIntegracao.get(i.id) ?? [],
      })),
      demo: false,
    };
  } catch (e) {
    registrarFalha("carregarIntegracoes", e);
    return { integracoes: [], demo: false };
  }
}
