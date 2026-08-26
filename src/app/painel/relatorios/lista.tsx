"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Tabela, Cabecalhos, Linha, Celula } from "@/components/painel/tabela";
import { dataCompleta } from "@/lib/utils";
import { formatoDe, periodicidadeDe, proximoEnvio } from "@/lib/blocos-relatorio";
import { Construtor, type ClienteOpcao } from "./construtor";
import { alternarAtivo, excluirRelatorio } from "./acoes";
import type { Relatorio } from "@/lib/relatorios";

export function ListaRelatorios({
  relatorios: iniciais,
  clientes,
}: {
  relatorios: Relatorio[];
  clientes: ClienteOpcao[];
}) {
  const [relatorios, setRelatorios] = useState(iniciais);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Relatorio | null>(null);
  const [linkNovo, setLinkNovo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  function endereco(token: string) {
    return typeof window === "undefined" ? "" : `${window.location.origin}/relatorio/${token}`;
  }

  async function copiar(token: string) {
    const url = endereco(token);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        /* `navigator.clipboard` não existe fora de HTTPS — e a agência abre o
           painel em rede local para mostrar a tela ao cliente. */
        const campo = document.createElement("textarea");
        campo.value = url;
        campo.setAttribute("readonly", "");
        campo.style.position = "fixed";
        campo.style.opacity = "0";
        document.body.appendChild(campo);
        campo.select();
        const copiou = document.execCommand("copy");
        document.body.removeChild(campo);
        if (!copiou) throw new Error("execCommand recusou");
      }
      setCopiado(token);
      toast.success("Link copiado.");
      window.setTimeout(() => setCopiado(null), 2000);
    } catch {
      toast.error("O navegador bloqueou a cópia. Abra o link e copie da barra de endereço.");
    }
  }

  async function alternar(r: Relatorio) {
    const desejado = !r.ativo;
    setRelatorios((l) => l.map((x) => (x.id === r.id ? { ...x, ativo: desejado } : x)));

    const resposta = await alternarAtivo(r.id, desejado);
    if (!resposta.ok) {
      setRelatorios((l) => l.map((x) => (x.id === r.id ? { ...x, ativo: r.ativo } : x)));
      toast.error(resposta.erro ?? "Não foi possível mudar o status.");
      return;
    }
    if (resposta.demo) return toast.success("Status alterado (não salvo: modo demonstração).");
    toast.success(desejado ? "Relatório retomado." : "Relatório pausado. O link parou de abrir.");
  }

  async function remover(r: Relatorio) {
    if (!confirm(`Excluir "${r.nome}"? O link público deixa de funcionar.`)) return;

    const anterior = relatorios;
    setRelatorios((l) => l.filter((x) => x.id !== r.id));

    const resposta = await excluirRelatorio(r.id);
    if (!resposta.ok) {
      setRelatorios(anterior);
      toast.error(resposta.erro ?? "Não foi possível excluir.");
      return;
    }
    toast.success(
      resposta.demo ? "Relatório removido da lista (modo demonstração)." : "Relatório excluído.",
    );
  }

  function aplicar(salvo: Relatorio) {
    setRelatorios((l) =>
      l.some((x) => x.id === salvo.id)
        ? l.map((x) => (x.id === salvo.id ? salvo : x))
        : [salvo, ...l],
    );
  }

  return (
    <>
      {relatorios.length > 0 && (
        <div className="flex justify-end">
          <Botao tamanho="sm" onClick={() => setCriando(true)}>
            <Plus className="size-4" />
            Novo relatório
          </Botao>
        </div>
      )}

      {/* O link é o entregável: fica visível até ser copiado. */}
      {linkNovo && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-mrg-500/40 bg-mrg-500/10 p-4">
          <Check className="size-5 shrink-0 text-mrg-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-tinta">Relatório criado. O link é este:</p>
            <p className="mt-0.5 truncate font-mono text-xs text-mrg-700">{endereco(linkNovo)}</p>
          </div>
          <Botao tamanho="sm" variante="contorno" onClick={() => copiar(linkNovo)}>
            <Copy className="size-4" /> Copiar
          </Botao>
          <Botao tamanho="sm" onClick={() => window.open(endereco(linkNovo), "_blank")}>
            <ExternalLink className="size-4" /> Abrir
          </Botao>
          <button
            type="button"
            onClick={() => setLinkNovo(null)}
            className="text-xs text-cinza hover:text-tinta foco-anel"
          >
            Dispensar
          </button>
        </div>
      )}

      {relatorios.length === 0 ? (
        <div className="cartao grid place-items-center gap-4 rounded-lg p-12 text-center">
          <div>
            <p className="font-display text-base font-bold text-tinta">
              Nenhum relatório configurado
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-cinza">
              Monte o primeiro para um cliente: você escolhe os blocos, a plataforma gera o link
              público e o cliente acompanha o resultado sem pedir print no WhatsApp.
            </p>
          </div>
          <Botao onClick={() => setCriando(true)}>
            <Plus className="size-4" />
            Montar relatório
          </Botao>
        </div>
      ) : (
        <Tabela larguraMinima="58rem">
          <Cabecalhos
            colunas={["Relatório", "Periodicidade", "Entrega", "Último envio", "Próximo", "Status", ""]}
          />
          <tbody>
            {relatorios.map((r) => {
              const periodo = periodicidadeDe(r.periodicidade);
              const formato = formatoDe(r.formato);
              return (
                <Linha key={r.id}>
                  <Celula className="text-tinta">
                    <span className="block font-medium">{r.nome}</span>
                    <span className="text-xs text-cinza">
                      {r.cliente_nome ?? "Toda a operação"} · {r.blocos.length}{" "}
                      {r.blocos.length === 1 ? "bloco" : "blocos"}
                    </span>
                  </Celula>
                  <Celula className="text-grafite">
                    {periodo.rotulo}
                    <span className="block text-xs text-cinza-claro">últimos {periodo.dias} dias</span>
                  </Celula>
                  <Celula className="text-grafite">
                    {formato.rotulo}
                    {r.destinatarios.length > 0 && (
                      <span
                        className="block text-xs text-cinza-claro"
                        title={r.destinatarios.join(", ")}
                      >
                        {r.destinatarios.length}{" "}
                        {r.destinatarios.length === 1 ? "destinatário" : "destinatários"}
                      </span>
                    )}
                  </Celula>
                  <Celula className="text-cinza">
                    {r.ultimo_envio_em ? dataCompleta(r.ultimo_envio_em) : "ainda não enviado"}
                  </Celula>
                  <Celula className="text-cinza">
                    {r.ativo ? dataCompleta(proximoEnvio(r.periodicidade)) : "—"}
                  </Celula>
                  <Celula>
                    <Etiqueta tom={r.ativo ? "sucesso" : "neutro"}>
                      {r.ativo ? "Ativo" : "Pausado"}
                    </Etiqueta>
                  </Celula>
                  <Celula>
                    <div className="flex items-center justify-end gap-1">
                      <Acao rotulo="Copiar link público" onClick={() => copiar(r.token)}>
                        {copiado === r.token ? (
                          <Check className="size-4 text-sucesso" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Acao>
                      <Acao
                        rotulo="Abrir relatório"
                        onClick={() => window.open(endereco(r.token), "_blank")}
                      >
                        <ExternalLink className="size-4" />
                      </Acao>
                      <Acao
                        rotulo={r.ativo ? "Pausar envios" : "Retomar envios"}
                        onClick={() => alternar(r)}
                      >
                        {r.ativo ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </Acao>
                      <Acao rotulo="Editar" onClick={() => setEditando(r)}>
                        <Pencil className="size-4" />
                      </Acao>
                      <Acao
                        rotulo="Excluir"
                        onClick={() => remover(r)}
                        classe="hover:bg-perigo/15 hover:text-perigo"
                      >
                        <Trash2 className="size-4" />
                      </Acao>
                    </div>
                  </Celula>
                </Linha>
              );
            })}
          </tbody>
        </Tabela>
      )}

      {criando && (
        <Construtor
          clientes={clientes}
          aoFechar={() => setCriando(false)}
          aoGerarLink={(token) => setLinkNovo(token)}
          aoSalvar={aplicar}
        />
      )}

      {editando && (
        <Construtor
          clientes={clientes}
          relatorio={editando}
          aoFechar={() => setEditando(null)}
          aoGerarLink={() => {}}
          aoSalvar={aplicar}
        />
      )}
    </>
  );
}

function Acao({
  rotulo,
  onClick,
  classe = "",
  children,
}: {
  rotulo: string;
  onClick: () => void;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={`rounded-sm p-2 text-cinza transition-colors hover:bg-nevoa hover:text-tinta foco-anel ${classe}`}
    >
      {children}
    </button>
  );
}
