import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import { registrarFalha } from "@/lib/dados";

/**
 * Envio e leitura de arquivos.
 *
 * São dois baldes, e a diferença importa:
 *
 * - `publico`  — logo da agência e dos clientes. Aparecem em proposta e
 *   relatório, que são páginas abertas por link, sem login. Precisam de
 *   URL estável: link assinado venceria e a proposta enviada ontem
 *   amanheceria sem logo.
 * - `arquivos` — contrato, nota, briefing, criativo. Privado. Sai só por
 *   link assinado de curta duração, gerado no servidor a cada leitura.
 *
 * Nos dois casos quem escreve é o service role, e nunca o navegador. O
 * cliente manda o arquivo para uma Server Action, ela confere a permissão
 * e só então grava. Assim o balde não precisa de política de RLS própria
 * — que exigiria rodar SQL — e o navegador nunca vê a chave.
 */

export const BALDE_PUBLICO = "publico";
export const BALDE_PRIVADO = "arquivos";

/** Tetos por balde, em bytes. Os mesmos declarados na criação. */
const TETO_PUBLICO = 10 * 1024 * 1024;
const TETO_PRIVADO = 25 * 1024 * 1024;

export const TIPOS_IMAGEM = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

export const TIPOS_DOCUMENTO = [
  ...TIPOS_IMAGEM,
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
];

/** O que o `accept` do input de arquivo recebe. */
export const ACEITA_IMAGEM = TIPOS_IMAGEM.join(",");
export const ACEITA_DOCUMENTO = `${TIPOS_DOCUMENTO.join(",")},.pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.docx,.pptx,.mp4`;

export type ArquivoSalvo = {
  id: string | null;
  nome: string;
  caminho: string;
  mime: string;
  tamanho: number;
  /** Preenchida só no balde público; no privado sai por link assinado. */
  url: string | null;
};

/**
 * Nome de arquivo seguro para usar como chave no Storage.
 *
 * Acento, espaço e barra quebram a chave ou criam pasta sem querer. O
 * nome original continua guardado na tabela `arquivos`, que é o que a
 * tela mostra — isto aqui é só o endereço.
 */
function chaveSegura(nome: string) {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return limpo || "arquivo";
}

export type DestinoArquivo = {
  organizacaoId: string;
  /** Pasta lógica: "marca", "clientes", "propostas", "criativos"… */
  escopo: string;
  publico?: boolean;
  /** Vínculos opcionais, para o arquivo aparecer na tela certa. */
  clienteId?: string | null;
  projetoId?: string | null;
  tarefaId?: string | null;
  usuarioId?: string | null;
  visivelAoCliente?: boolean;
};

/**
 * Grava o arquivo e registra a linha em `arquivos`.
 *
 * A linha na tabela é o que torna o arquivo encontrável: o Storage sozinho
 * é um balde de chaves, sem nome original, sem dono e sem a que cliente
 * pertence. Se a gravação da linha falhar, o binário é removido — melhor
 * não ter o arquivo do que ter um órfão que ninguém acha nem apaga.
 */
export async function guardarArquivo(
  arquivo: File,
  destino: DestinoArquivo,
): Promise<{ ok: true; arquivo: ArquivoSalvo } | { ok: false; erro: string }> {
  const publico = !!destino.publico;
  const balde = publico ? BALDE_PUBLICO : BALDE_PRIVADO;
  const permitidos = publico ? TIPOS_IMAGEM : TIPOS_DOCUMENTO;
  const teto = publico ? TETO_PUBLICO : TETO_PRIVADO;

  if (!arquivo || arquivo.size === 0) return { ok: false, erro: "Arquivo vazio." };
  if (arquivo.size > teto) {
    return { ok: false, erro: `O arquivo passa de ${Math.round(teto / 1048576)} MB.` };
  }
  if (!permitidos.includes(arquivo.type)) {
    return {
      ok: false,
      erro: publico
        ? "Envie uma imagem (PNG, JPEG, WEBP, SVG ou GIF)."
        : "Formato não aceito. Use PDF, imagem, planilha, documento ou MP4.",
    };
  }

  const admin = criarClienteAdmin();
  /* A organização abre o caminho para que um dia dê para apagar tudo de
     uma organização com um prefixo só. */
  const caminho = `${destino.organizacaoId}/${destino.escopo}/${crypto.randomUUID()}-${chaveSegura(arquivo.name)}`;

  try {
    const { error } = await admin.storage
      .from(balde)
      .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });

    if (error) {
      registrarFalha("guardarArquivo/upload", error);
      return { ok: false, erro: "Não foi possível enviar o arquivo." };
    }

    const { data: linha, error: erroLinha } = await admin
      .from("arquivos")
      .insert({
        organizacao_id: destino.organizacaoId,
        cliente_id: destino.clienteId ?? null,
        projeto_id: destino.projetoId ?? null,
        tarefa_id: destino.tarefaId ?? null,
        nome: arquivo.name,
        caminho: `${balde}/${caminho}`,
        mime: arquivo.type,
        tamanho_bytes: arquivo.size,
        visivel_ao_cliente: destino.visivelAoCliente ?? publico,
        enviado_por: destino.usuarioId ?? null,
      })
      .select("id")
      .single();

    if (erroLinha) {
      registrarFalha("guardarArquivo/registro", erroLinha);
      await admin.storage.from(balde).remove([caminho]);
      return { ok: false, erro: "Não foi possível registrar o arquivo." };
    }

    return {
      ok: true,
      arquivo: {
        id: (linha as { id: string }).id,
        nome: arquivo.name,
        caminho: `${balde}/${caminho}`,
        mime: arquivo.type,
        tamanho: arquivo.size,
        url: publico
          ? admin.storage.from(balde).getPublicUrl(caminho).data.publicUrl
          : null,
      },
    };
  } catch (e) {
    registrarFalha("guardarArquivo", e);
    return { ok: false, erro: "Não foi possível enviar o arquivo." };
  }
}

/** Separa "balde/pasta/arquivo" nas duas partes que o SDK espera. */
function partir(caminho: string) {
  const corte = caminho.indexOf("/");
  if (corte < 1) return null;
  return { balde: caminho.slice(0, corte), chave: caminho.slice(corte + 1) };
}

/**
 * Endereço para abrir o arquivo.
 *
 * Público sai direto; privado sai assinado, com validade curta. Uma hora
 * é o bastante para clicar e baixar, e curto o bastante para o link não
 * virar uma porta permanente se alguém o encaminhar.
 */
export async function enderecoDoArquivo(caminho: string, segundos = 3600) {
  const p = partir(caminho);
  if (!p) return null;

  const admin = criarClienteAdmin();
  if (p.balde === BALDE_PUBLICO) {
    return admin.storage.from(p.balde).getPublicUrl(p.chave).data.publicUrl;
  }

  const { data, error } = await admin.storage.from(p.balde).createSignedUrl(p.chave, segundos);
  if (error) {
    registrarFalha("enderecoDoArquivo", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Apaga o binário e a linha. A ordem evita deixar registro apontando para o vazio. */
export async function apagarArquivo(id: string, organizacaoId: string) {
  const admin = criarClienteAdmin();

  const { data } = await admin
    .from("arquivos")
    .select("caminho")
    .eq("id", id)
    .eq("organizacao_id", organizacaoId)
    .maybeSingle();

  const caminho = (data as { caminho: string } | null)?.caminho;
  if (caminho) {
    const p = partir(caminho);
    if (p) await admin.storage.from(p.balde).remove([p.chave]);
  }

  const { error } = await admin
    .from("arquivos")
    .delete()
    .eq("id", id)
    .eq("organizacao_id", organizacaoId);

  if (error) {
    registrarFalha("apagarArquivo", error);
    return false;
  }
  return true;
}
