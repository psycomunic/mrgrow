"use server";

import { contextoDeAcao } from "@/lib/acoes";
import {
  apagarArquivo,
  enderecoDoArquivo,
  guardarArquivo,
  type ArquivoSalvo,
} from "@/lib/arquivos";

export type ResultadoEnvio =
  | { ok: true; demo: boolean; arquivo: ArquivoSalvo }
  | { ok: false; demo: boolean; erro: string };

/**
 * Recebe o arquivo do navegador e grava.
 *
 * Vai por `FormData`, e não por base64 num JSON: base64 incha o corpo em
 * um terço e um PDF de 20 MB estouraria o limite da Server Action antes
 * de chegar aqui.
 *
 * O recurso a conferir vem de quem chama, porque o mesmo envio serve
 * telas com permissões diferentes: comprovante é `financeiro`, logo é
 * `configuracoes`, briefing é `projetos`.
 */
export async function enviarArquivo(dados: FormData): Promise<ResultadoEnvio> {
  const arquivo = dados.get("arquivo");
  const escopo = String(dados.get("escopo") ?? "geral");
  const recurso = String(dados.get("recurso") ?? "configuracoes");
  const publico = dados.get("publico") === "1";
  const clienteId = (dados.get("cliente_id") as string) || null;

  if (!(arquivo instanceof File)) {
    return { ok: false, demo: false, erro: "Nenhum arquivo recebido." };
  }

  const ctx = await contextoDeAcao(recurso as never, "editar");
  if (ctx.estado === "demo") {
    /* Sem banco não há onde guardar. Devolve o arquivo como se tivesse
       ido, para a tela poder ser percorrida, e avisa que não persistiu. */
    return {
      ok: true,
      demo: true,
      arquivo: {
        id: null,
        nome: arquivo.name,
        caminho: `demonstracao/${arquivo.name}`,
        mime: arquivo.type,
        tamanho: arquivo.size,
        url: null,
      },
    };
  }
  if (ctx.estado === "negado") return { ok: false, demo: false, erro: ctx.erro };
  const { sessao } = ctx;

  const r = await guardarArquivo(arquivo, {
    organizacaoId: sessao.organizacaoId,
    escopo: escopo.replace(/[^a-z0-9-]/gi, "") || "geral",
    publico,
    clienteId,
    usuarioId: sessao.usuarioId,
  });

  if (!r.ok) return { ok: false, demo: false, erro: r.erro };
  return { ok: true, demo: false, arquivo: r.arquivo };
}

/** Endereço para abrir o arquivo — assinado quando o balde é privado. */
export async function abrirArquivo(caminho: string): Promise<string | null> {
  const ctx = await contextoDeAcao("configuracoes", "ver");
  if (ctx.estado === "demo") return null;
  if (ctx.estado === "negado") return null;

  /* O caminho começa pelo id da organização logo após o balde. Conferir
     isso impede que um caminho digitado à mão leia arquivo de outra. */
  const dentro = caminho.split("/")[1];
  if (dentro !== ctx.sessao.organizacaoId) return null;

  return enderecoDoArquivo(caminho);
}

export async function removerArquivo(id: string): Promise<{ ok: boolean; erro?: string }> {
  const ctx = await contextoDeAcao("configuracoes", "editar");
  if (ctx.estado === "demo") return { ok: true };
  if (ctx.estado === "negado") return { ok: false, erro: ctx.erro };

  const ok = await apagarArquivo(id, ctx.sessao.organizacaoId);
  return ok ? { ok: true } : { ok: false, erro: "Não foi possível remover." };
}
