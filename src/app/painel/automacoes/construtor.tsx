"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AlertTriangle, Plus, Trash2, X } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Campo, AreaTexto, Entrada, Selecao } from "@/components/ui/campo";
import {
  acaoDoCatalogo,
  CAMPOS_DA_ACAO,
  CATALOGO_ACOES,
  CATALOGO_GATILHOS,
  gatilhoDoCatalogo,
  rotuloDaAcao,
  type Acao,
  type CampoAcao,
  type TipoAcao,
} from "@/lib/automacoes-catalogo";
import type { Automacao } from "@/lib/automacoes-dados";
import type { DadosAutomacao } from "./acoes";

const DISPONIVEIS = CATALOGO_ACOES.filter((a) => a.disponivel);

/**
 * Uma ação enquanto está sendo editada.
 *
 * `valores` é tudo texto porque é o que os campos do formulário devolvem — a
 * conversão para número acontece no envio. `extras` guarda as chaves que o
 * catálogo não descreve (a `carga` de um webhook criado fora da tela), para
 * que editar o nome da automação não apague o payload dela.
 */
type Rascunho = {
  chave: number;
  tipo: TipoAcao;
  valores: Record<string, string>;
  extras: Record<string, unknown>;
};

let sequencia = 0;
const novaChave = () => ++sequencia;

function rascunhoVazio(tipo: TipoAcao): Rascunho {
  return { chave: novaChave(), tipo, valores: {}, extras: {} };
}

function paraRascunhos(acoes: Acao[]): Rascunho[] {
  return acoes.map((acao) => {
    const cru = acao as unknown as Record<string, unknown>;
    const tipo = acao.tipo;
    const conhecidas = new Set(CAMPOS_DA_ACAO[tipo].map((c) => c.chave));
    const valores: Record<string, string> = {};
    const extras: Record<string, unknown> = {};

    for (const [chave, valor] of Object.entries(cru)) {
      if (chave === "tipo") continue;
      if (conhecidas.has(chave)) valores[chave] = valor == null ? "" : String(valor);
      else extras[chave] = valor;
    }
    return { chave: novaChave(), tipo, valores, extras };
  });
}

function paraAcoes(rascunhos: Rascunho[]): Acao[] {
  return rascunhos.map((r) => {
    const montada: Record<string, unknown> = { ...r.extras, tipo: r.tipo };
    for (const campo of CAMPOS_DA_ACAO[r.tipo]) {
      const texto = (r.valores[campo.chave] ?? "").trim();
      if (!texto) continue;
      montada[campo.chave] =
        campo.tipo === "numero" || campo.tipo === "prazo" ? Number(texto) : texto;
    }
    return montada as Acao;
  });
}

/** Primeiro problema que o servidor recusaria, dito antes de mandar. */
function primeiroProblema(nome: string, rascunhos: Rascunho[]): string | null {
  if (!nome.trim()) return "Dê um nome à automação.";
  if (rascunhos.length === 0) return "Adicione ao menos uma ação.";

  for (const r of rascunhos) {
    const rotuloAcao = rotuloDaAcao(r.tipo);
    /* O seed cria automações com ações que o motor ainda não executa. Editar
       uma delas só passa depois de trocar ou remover a ação morta. */
    if (!acaoDoCatalogo(r.tipo)?.disponivel) {
      return `${rotuloAcao}: o motor ainda não executa esta ação. Troque ou remova.`;
    }
    for (const campo of CAMPOS_DA_ACAO[r.tipo]) {
      if (!campo.obrigatorio) continue;
      const texto = (r.valores[campo.chave] ?? "").trim();
      if (!texto) return `${rotuloAcao}: preencha "${campo.rotulo}".`;
      if (campo.tipo === "url" && !texto.startsWith("https://")) {
        return `${rotuloAcao}: o webhook precisa começar com https://`;
      }
    }
  }
  return null;
}

export function Construtor({
  automacao,
  etapas,
  aoCriar,
  aoEditar,
  aoFechar,
}: {
  automacao?: Automacao;
  etapas: { id: string; nome: string }[];
  aoCriar: (d: DadosAutomacao) => Promise<boolean>;
  aoEditar: (id: string, d: DadosAutomacao) => Promise<boolean>;
  aoFechar: () => void;
}) {
  const idBase = useId();
  const [nome, setNome] = useState(automacao?.nome ?? "");
  const [gatilho, setGatilho] = useState<string>(automacao?.gatilho ?? "lead_criado");
  const [rascunhos, setRascunhos] = useState<Rascunho[]>(() =>
    automacao ? paraRascunhos(automacao.acoes) : [rascunhoVazio("notificar")],
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const focar = useCallback((el: HTMLInputElement | null) => el?.focus(), []);

  const doCatalogo = gatilhoDoCatalogo(gatilho);

  function trocarTipo(chave: number, tipo: TipoAcao) {
    // Campos de outro tipo não têm significado aqui; o rascunho recomeça.
    setRascunhos((l) => l.map((r) => (r.chave === chave ? { ...r, tipo, valores: {} } : r)));
    setErro(null);
  }

  function mudarValor(chave: number, campo: string, valor: string) {
    setRascunhos((l) =>
      l.map((r) => (r.chave === chave ? { ...r, valores: { ...r.valores, [campo]: valor } } : r)),
    );
    setErro(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const problema = primeiroProblema(nome, rascunhos);
    if (problema) return setErro(problema);

    const dados: DadosAutomacao = { nome, gatilho, acoes: paraAcoes(rascunhos) };
    setEnviando(true);
    const ok = automacao ? await aoEditar(automacao.id, dados) : await aoCriar(dados);
    setEnviando(false);
    if (ok) aoFechar();
  }

  return (
    <Sobreposicao
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-tinta/25 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idBase}-titulo`}
        className="my-auto w-full max-w-2xl overflow-hidden rounded-xl bg-carta shadow-concha"
      >
        <div className="flex items-start justify-between gap-3 border-b border-borda px-6 py-4">
          <div>
            <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-tinta">
              {automacao ? "Editar automação" : "Nova automação"}
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              Um gatilho, uma sequência de ações. Elas rodam na ordem em que estão aqui.
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-tinta foco-anel"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
            <Campo rotulo="Nome da automação">
              <Entrada
                ref={focar}
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro(null);
                }}
                placeholder="Ex.: Fatura atrasada avisa o financeiro"
              />
            </Campo>

            <Campo rotulo="Quando isso acontecer" dica={doCatalogo?.descricao}>
              <Selecao
                value={gatilho}
                onChange={(e) => {
                  setGatilho(e.target.value);
                  setErro(null);
                }}
              >
                {CATALOGO_GATILHOS.map((g) => (
                  <option key={g.valor} value={g.valor}>
                    {g.rotulo}
                  </option>
                ))}
              </Selecao>
            </Campo>

            {gatilho === "agendado" && (
              <p className="flex items-start gap-2 rounded-md border border-alerta/25 bg-alerta/10 px-3.5 py-2.5 text-xs text-tinta">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-alerta" />
                O job horário ainda não percorre automações agendadas. Ela fica salva, mas só vai
                rodar quando o disparo por horário for ligado.
              </p>
            )}

            <section>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
                  Faça isto
                </h3>
                <span className="text-xs text-cinza">
                  {rascunhos.length === 1 ? "1 ação" : `${rascunhos.length} ações`}
                </span>
              </div>

              <div className="space-y-3">
                {rascunhos.map((r, i) => (
                  <CartaoAcao
                    key={r.chave}
                    rascunho={r}
                    posicao={i + 1}
                    etapas={etapas}
                    podeRemover={rascunhos.length > 1}
                    aoTrocarTipo={(tipo) => trocarTipo(r.chave, tipo)}
                    aoMudar={(campo, valor) => mudarValor(r.chave, campo, valor)}
                    aoRemover={() =>
                      setRascunhos((l) => l.filter((outro) => outro.chave !== r.chave))
                    }
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setRascunhos((l) => [...l, rascunhoVazio("criar_tarefa")])}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-borda-forte px-3.5 py-2.5 text-xs font-medium text-grafite transition-colors hover:border-mrg-500/50 hover:text-mrg-600 foco-anel"
              >
                <Plus className="size-3.5" />
                Adicionar ação
              </button>
            </section>

            {erro && <p className="text-xs text-perigo">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando…" : automacao ? "Salvar alterações" : "Criar automação"}
            </Botao>
          </div>
        </form>
      </div>
    </Sobreposicao>
  );
}

function CartaoAcao({
  rascunho,
  posicao,
  etapas,
  podeRemover,
  aoTrocarTipo,
  aoMudar,
  aoRemover,
}: {
  rascunho: Rascunho;
  posicao: number;
  etapas: { id: string; nome: string }[];
  podeRemover: boolean;
  aoTrocarTipo: (tipo: TipoAcao) => void;
  aoMudar: (campo: string, valor: string) => void;
  aoRemover: () => void;
}) {
  const campos = CAMPOS_DA_ACAO[rascunho.tipo];
  const atual = acaoDoCatalogo(rascunho.tipo);
  /* Sem a opção atual na lista, o <select> exibiria outra ação e a troca
     aconteceria sem ninguém pedir. */
  const opcoes = atual?.disponivel
    ? DISPONIVEIS
    : [{ tipo: rascunho.tipo, rotulo: `${rotuloDaAcao(rascunho.tipo)} — sem suporte no motor` }, ...DISPONIVEIS];

  return (
    <article className="rounded-md border border-borda bg-nevoa p-3.5">
      <div className="flex items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mrg-500/15 text-[11px] font-bold text-mrg-600">
          {posicao}
        </span>
        <Selecao
          value={rascunho.tipo}
          aria-label={`Tipo da ação ${posicao}`}
          className="bg-carta"
          onChange={(e) => aoTrocarTipo(e.target.value as TipoAcao)}
        >
          {opcoes.map((a) => (
            <option key={a.tipo} value={a.tipo}>
              {a.rotulo}
            </option>
          ))}
        </Selecao>
        <button
          type="button"
          onClick={aoRemover}
          disabled={!podeRemover}
          aria-label={`Remover ação ${posicao}`}
          title={podeRemover ? "Remover ação" : "A automação precisa de ao menos uma ação"}
          className="shrink-0 rounded-full p-2 text-cinza-claro transition-colors hover:bg-chip-rosa hover:text-perigo disabled:pointer-events-none disabled:opacity-40 foco-anel"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {atual?.disponivel ? (
        <p className="mt-2 text-xs text-cinza">{atual.resumo}</p>
      ) : (
        <p className="mt-2 text-xs text-alerta">
          Esta ação está gravada, mas o motor não a executa. Escolha outra acima ou remova o passo.
        </p>
      )}

      {campos.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {campos.map((campo) => (
            <CampoDaAcao
              key={campo.chave}
              campo={campo}
              valor={rascunho.valores[campo.chave] ?? ""}
              etapas={etapas}
              aoMudar={(v) => aoMudar(campo.chave, v)}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function CampoDaAcao({
  campo,
  valor,
  etapas,
  aoMudar,
}: {
  campo: CampoAcao;
  valor: string;
  etapas: { id: string; nome: string }[];
  aoMudar: (valor: string) => void;
}) {
  const larguraCheia = campo.tipo === "linhas" || campo.tipo === "url";

  if (campo.tipo === "etapa") {
    const semFunil = etapas.length === 0;
    return (
      <Campo
        rotulo={campo.rotulo}
        dica={semFunil ? "Crie as etapas do funil no CRM para usar esta ação." : campo.dica}
      >
        <Selecao
          value={valor}
          disabled={semFunil}
          className="bg-carta"
          onChange={(e) => aoMudar(e.target.value)}
        >
          <option value="">Selecione a etapa…</option>
          {etapas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </Selecao>
      </Campo>
    );
  }

  if (campo.tipo === "prazo" || campo.tipo === "selecao") {
    return (
      <Campo rotulo={campo.rotulo} dica={campo.dica}>
        <Selecao value={valor} className="bg-carta" onChange={(e) => aoMudar(e.target.value)}>
          {campo.tipo === "selecao" && !campo.obrigatorio && <option value="">Padrão</option>}
          {campo.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </Selecao>
      </Campo>
    );
  }

  if (campo.tipo === "linhas") {
    return (
      <Campo rotulo={campo.rotulo} dica={campo.dica} className="sm:col-span-2">
        <AreaTexto
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder={campo.exemplo}
          className="min-h-20 bg-carta"
          maxLength={campo.limite}
        />
      </Campo>
    );
  }

  return (
    <Campo rotulo={campo.rotulo} dica={campo.dica} className={larguraCheia ? "sm:col-span-2" : undefined}>
      <Entrada
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={campo.exemplo}
        className="bg-carta"
        inputMode={campo.tipo === "numero" ? "numeric" : undefined}
        maxLength={campo.tipo === "numero" ? 4 : campo.limite}
      />
    </Campo>
  );
}
