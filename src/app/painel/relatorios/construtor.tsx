"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Campo, Entrada, Selecao } from "@/components/ui/campo";
import { dataCompleta } from "@/lib/utils";
import {
  BLOCOS,
  CHAVES_BLOCO,
  FORMATOS,
  PERIODICIDADES,
  formatoDe,
  periodicidadeDe,
  proximoEnvio,
} from "@/lib/blocos-relatorio";
import {
  criarRelatorio,
  atualizarRelatorio,
  type DadosRelatorio,
  type ResultadoCriacao,
} from "./acoes";
import type { Relatorio } from "@/lib/relatorios";

export type ClienteOpcao = { id: string; nome: string };

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;
const MAX_DESTINATARIOS = 10;

/** Um relatório novo já nasce com o recorte que a agência manda em 90% dos casos. */
function vazio(): DadosRelatorio {
  return {
    nome: "",
    cliente_id: null,
    periodicidade: "mensal",
    formato: "email",
    destinatarios: [],
    blocos: ["resumo_executivo", "evolucao_diaria", "leads_cpl", "comparativo_periodo"],
  };
}

function doRelatorio(r: Relatorio): DadosRelatorio {
  return {
    nome: r.nome,
    cliente_id: r.cliente_id,
    periodicidade: r.periodicidade,
    formato: r.formato,
    destinatarios: r.destinatarios,
    blocos: r.blocos,
  };
}

export function Construtor({
  clientes,
  relatorio,
  aoFechar,
  aoGerarLink,
  aoSalvar,
}: {
  clientes: ClienteOpcao[];
  relatorio?: Relatorio;
  aoFechar: () => void;
  aoGerarLink: (token: string) => void;
  /** A lista guarda o próprio estado: sem isto, a linha salva só apareceria
   *  atualizada depois de um recarregamento completo. */
  aoSalvar: (salvo: Relatorio) => void;
}) {
  const [d, setD] = useState<DadosRelatorio>(() => (relatorio ? doRelatorio(relatorio) : vazio()));
  const [rascunhoEmail, setRascunhoEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const focar = useCallback((el: HTMLInputElement | null) => el?.focus(), []);

  const periodo = periodicidadeDe(d.periodicidade);
  const formato = formatoDe(d.formato);

  /* Aceita colar uma lista inteira: "a@x.com, b@x.com" vira dois chips em vez
     de um endereço inválido com vírgula no meio. */
  function adicionarEmails(texto: string) {
    const novos = texto
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!novos.length) return;

    const invalido = novos.find((e) => !EMAIL.test(e));
    if (invalido) {
      setErro(`"${invalido}" não parece um e-mail.`);
      return;
    }

    const juntos = [...new Set([...d.destinatarios, ...novos])];
    if (juntos.length > MAX_DESTINATARIOS) {
      setErro(`São no máximo ${MAX_DESTINATARIOS} destinatários.`);
      return;
    }

    setErro(null);
    setD((x) => ({ ...x, destinatarios: juntos }));
    setRascunhoEmail("");
  }

  function alternarBloco(chave: string) {
    setD((x) => ({
      ...x,
      blocos: x.blocos.includes(chave)
        ? x.blocos.filter((b) => b !== chave)
        : CHAVES_BLOCO.filter((c) => c === chave || x.blocos.includes(c)),
    }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    // Endereço digitado e não confirmado com Enter seria perdido em silêncio.
    if (rascunhoEmail.trim()) return adicionarEmails(rascunhoEmail);

    setSalvando(true);
    /* A edição devolve `Resultado` e a criação `ResultadoCriacao`; o tipo mais
       largo evita testar a presença de `token` a cada uso. */
    const r: ResultadoCriacao = relatorio
      ? await atualizarRelatorio(relatorio.id, d)
      : await criarRelatorio(d);
    setSalvando(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível salvar.");

    toast.success(
      r.demo
        ? "Relatório montado (não salvo: modo demonstração)."
        : relatorio
          ? "Relatório atualizado."
          : "Relatório criado.",
    );
    if (!relatorio && r.token) aoGerarLink(r.token);

    /* Em demonstração nada foi gravado — devolver uma linha aqui colocaria na
       tabela um relatório com token que não abre. */
    if (!r.demo) {
      const id = relatorio?.id ?? r.id;
      if (id) {
        aoSalvar({
          ...d,
          id,
          token: r.token ?? relatorio?.token ?? "",
          cliente_nome: clientes.find((c) => c.id === d.cliente_id)?.nome ?? null,
          ativo: relatorio?.ativo ?? true,
          ultimo_envio_em: relatorio?.ultimo_envio_em ?? null,
        });
      }
    }

    aoFechar();
  }

  return (
    <Sobreposicao
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-papel/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={relatorio ? "Editar relatório" : "Novo relatório"}
        className="cartao my-auto w-full max-w-3xl overflow-hidden rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-borda px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-tinta">
              {relatorio ? "Editar relatório" : "Novo relatório"}
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              O link público é gerado no ato; o cliente abre no celular sem senha.
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-sm p-1.5 text-cinza transition-colors hover:bg-nevoa hover:text-tinta foco-anel"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
            <Secao rotulo="Identificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Nome do relatório">
                  <Entrada
                    ref={focar}
                    value={d.nome}
                    onChange={(e) => setD((x) => ({ ...x, nome: e.target.value }))}
                    placeholder="Ex.: Fechamento mensal de performance"
                  />
                </Campo>
                <Campo
                  rotulo="Cliente"
                  dica={
                    clientes.length
                      ? "Define de quais contas vêm os números."
                      : "Nenhum cliente na carteira ainda — o relatório sai com a soma da operação."
                  }
                >
                  <Selecao
                    value={d.cliente_id ?? ""}
                    onChange={(e) => setD((x) => ({ ...x, cliente_id: e.target.value || null }))}
                  >
                    <option value="">Toda a operação</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              </div>
            </Secao>

            <Secao rotulo="Entrega">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Periodicidade" dica={`Fecha ${periodo.cadencia}.`}>
                  <Selecao
                    value={d.periodicidade}
                    onChange={(e) => setD((x) => ({ ...x, periodicidade: e.target.value }))}
                  >
                    {PERIODICIDADES.map((p) => (
                      <option key={p.valor} value={p.valor}>
                        {p.rotulo} · últimos {p.dias} dias
                      </option>
                    ))}
                  </Selecao>
                </Campo>
                <Campo rotulo="Como o cliente recebe" dica={formato.detalhe}>
                  <Selecao
                    value={d.formato}
                    onChange={(e) => setD((x) => ({ ...x, formato: e.target.value }))}
                  >
                    {FORMATOS.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              </div>

              <Campo
                rotulo="Destinatários"
                dica="Digite o e-mail e aperte Enter. Vale colar a lista separada por vírgula."
                className="mt-4"
              >
                <Entrada
                  type="email"
                  value={rascunhoEmail}
                  onChange={(e) => setRascunhoEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "," || e.key === ";") {
                      e.preventDefault();
                      adicionarEmails(rascunhoEmail);
                    }
                  }}
                  onBlur={() => rascunhoEmail.trim() && adicionarEmails(rascunhoEmail)}
                  placeholder="contato@cliente.com.br"
                />
              </Campo>

              {d.destinatarios.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {d.destinatarios.map((email) => (
                    <li
                      key={email}
                      className="inline-flex items-center gap-1.5 rounded-full border border-borda bg-nevoa py-1 pr-1.5 pl-3 text-xs text-grafite"
                    >
                      {email}
                      <button
                        type="button"
                        aria-label={`Remover ${email}`}
                        onClick={() =>
                          setD((x) => ({
                            ...x,
                            destinatarios: x.destinatarios.filter((e) => e !== email),
                          }))
                        }
                        className="rounded-full p-0.5 text-cinza transition-colors hover:bg-perigo/15 hover:text-perigo foco-anel"
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 rounded-md border border-borda bg-nevoa px-4 py-2.5 text-xs text-grafite">
                Próximo fechamento:{" "}
                <strong className="text-tinta">{dataCompleta(proximoEnvio(d.periodicidade))}</strong>
                {" · "}
                cobre os últimos {periodo.dias} dias
              </p>
            </Secao>

            <Secao rotulo={`Blocos do relatório · ${d.blocos.length} de ${BLOCOS.length}`}>
              <ul className="grid gap-2 sm:grid-cols-2">
                {BLOCOS.map((b) => {
                  const marcado = d.blocos.includes(b.chave);
                  return (
                    <li key={b.chave}>
                      <label
                        className={`flex h-full cursor-pointer gap-3 rounded-md border p-3 transition-colors ${
                          marcado
                            ? "border-mrg-500/45 bg-mrg-500/8"
                            : "border-borda bg-nevoa hover:border-borda-forte"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternarBloco(b.chave)}
                          className="mt-0.5 size-4 shrink-0 accent-mrg-500 foco-anel"
                        />
                        <span>
                          <span className="block text-sm font-medium text-tinta">{b.rotulo}</span>
                          <span className="mt-0.5 block text-xs text-cinza">{b.resumo}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Secao>

            {erro && <p className="text-xs text-perigo">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-borda px-6 py-4">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : relatorio ? "Salvar" : "Criar e gerar link"}
            </Botao>
          </div>
        </form>
      </div>
    </Sobreposicao>
  );
}

function Secao({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-bold tracking-wider text-cinza-claro uppercase">
        {rotulo}
      </h3>
      {children}
    </section>
  );
}
