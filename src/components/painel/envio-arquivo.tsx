"use client";

import { useId, useRef, useState } from "react";
import { FileText, ImageIcon, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { abrirArquivo, enviarArquivo } from "@/app/painel/_acoes/arquivos";

export type ArquivoAnexado = {
  id: string | null;
  nome: string;
  caminho: string;
  mime: string;
  tamanho: number;
  url: string | null;
};

const ACEITA_IMAGEM = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";
const ACEITA_TUDO =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/csv," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.openxmlformats-officedocument.presentationml.presentation,video/mp4";

function tamanhoLegivel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Campo de envio de arquivo.
 *
 * O arquivo sobe assim que é escolhido, e não junto do formulário: um
 * comprovante de 20 MB dentro do `submit` deixaria o botão "Salvar"
 * travado por segundos sem nada na tela, e um erro de upload derrubaria
 * o preenchimento inteiro. Subindo antes, o formulário guarda só o
 * caminho — um texto curto — e salvar volta a ser instantâneo.
 *
 * Aceita arrastar e soltar porque comprovante quase sempre vem de outra
 * janela já aberta, e arrastar poupa a caixa de diálogo do sistema.
 */
export function EnvioArquivo({
  valor,
  aoMudar,
  escopo,
  recurso,
  rotulo = "Anexar arquivo",
  dica,
  imagem = false,
  publico = false,
  clienteId = null,
}: {
  valor: ArquivoAnexado | null;
  aoMudar: (a: ArquivoAnexado | null) => void;
  /** Pasta lógica no balde: "financeiro", "marca", "propostas"… */
  escopo: string;
  /** Recurso conferido na permissão — o mesmo nome da matriz de papéis. */
  recurso: string;
  rotulo?: string;
  dica?: string;
  /** Só imagens, e vai para o balde público (logo, marca). */
  imagem?: boolean;
  publico?: boolean;
  clienteId?: string | null;
}) {
  const idBase = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [sobre, setSobre] = useState(false);

  async function subir(arquivo: File | undefined) {
    if (!arquivo) return;

    setEnviando(true);
    const dados = new FormData();
    dados.set("arquivo", arquivo);
    dados.set("escopo", escopo);
    dados.set("recurso", recurso);
    dados.set("publico", imagem || publico ? "1" : "0");
    if (clienteId) dados.set("cliente_id", clienteId);

    const r = await enviarArquivo(dados);
    setEnviando(false);

    if (!r.ok) return toast.error(r.erro);
    aoMudar(r.arquivo);
    toast.success(r.demo ? "Enviado (não salvo: modo demonstração)." : "Arquivo enviado.");
  }

  async function abrir() {
    if (!valor) return;
    if (valor.url) return window.open(valor.url, "_blank", "noopener");

    /* Balde privado: o endereço é assinado na hora e vale por uma hora.
       Guardar o link no estado não adiantaria — ele venceria. */
    const url = await abrirArquivo(valor.caminho);
    if (!url) return toast.error("Não foi possível abrir o arquivo.");
    window.open(url, "_blank", "noopener");
  }

  const ehImagem = valor?.mime?.startsWith("image/");

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-grafite">{rotulo}</span>

      {valor ? (
        <div className="flex items-center gap-3 rounded-md border border-borda bg-nevoa p-3">
          {ehImagem && valor.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={valor.url}
              alt=""
              className="size-12 shrink-0 rounded-sm object-contain"
            />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-nevoa-2 text-cinza">
              {ehImagem ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={abrir}
              className="foco-anel block max-w-full truncate text-[13px] font-medium text-tinta hover:text-acento"
              title={valor.nome}
            >
              {valor.nome}
            </button>
            <p className="mt-0.5 text-[11px] text-cinza-claro">{tamanhoLegivel(valor.tamanho)}</p>
          </div>

          <button
            type="button"
            onClick={() => aoMudar(null)}
            aria-label="Remover arquivo"
            className="foco-anel rounded-sm p-1.5 text-cinza-claro hover:text-perigo"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={idBase}
          onDragOver={(e) => {
            e.preventDefault();
            setSobre(true);
          }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSobre(false);
            void subir(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-5 text-[13px] transition-colors",
            sobre
              ? "border-mrg-500/60 bg-mrg-500/8 text-acento"
              : "border-borda text-cinza hover:border-borda-forte hover:text-tinta",
            enviando && "pointer-events-none opacity-60",
          )}
        >
          {enviando ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              {imagem ? <Upload className="size-4" /> : <Paperclip className="size-4" />}
              Escolher do computador ou arrastar aqui
            </>
          )}
        </label>
      )}

      <input
        id={idBase}
        ref={entrada}
        type="file"
        accept={imagem ? ACEITA_IMAGEM : ACEITA_TUDO}
        className="sr-only"
        onChange={(e) => {
          void subir(e.target.files?.[0]);
          /* Zera para que escolher o mesmo arquivo de novo dispare o
             `change` — sem isto, remover e reenviar o mesmo PDF não faz
             nada. */
          e.target.value = "";
        }}
      />

      {dica && !valor && <p className="mt-1 text-xs text-cinza">{dica}</p>}
    </div>
  );
}
