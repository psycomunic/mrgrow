"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Copy, Link2, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Campo, Entrada, Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { hoje } from "@/lib/tempo";
import { Tabela, Cabecalhos, Linha, Celula, Vazio } from "@/components/painel/tabela";
import { ROTULO_PAPEL, type Papel } from "@/lib/papeis";
import { dataCompleta, iniciais } from "@/lib/utils";
import { useEquipe } from "./contexto";

const PAPEIS = Object.keys(ROTULO_PAPEL) as Papel[];

/** O link é relativo até aqui; quem recebe precisa do endereço completo. */
async function copiarLink(caminho: string) {
  const url = `${window.location.origin}${caminho}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado. Mande por WhatsApp ou e-mail.");
  } catch {
    toast.error(`Não foi possível copiar. O link é ${url}`);
  }
}

export function Membros() {
  const { membros, usuarioId, meuPapel, ocupado, mudarPapel, alternarAcesso } = useEquipe();

  if (membros.length === 0) {
    return (
      <Vazio mensagem="Nenhum acesso listado. Se a sua equipe já existe, recarregue a página: a consulta pode ter falhado." />
    );
  }

  return (
    <section className="space-y-2">
      <Tabela larguraMinima="46rem">
        <Cabecalhos colunas={["Pessoa", "E-mail", "Papel", "Na equipe desde", "Acesso", ""]} />
        <tbody>
          {membros.map((m) => {
            const souEu = m.usuarioId === usuarioId;
            /* Papel de proprietário só é oferecido a quem pode concedê-lo. Se
               a pessoa já é, a opção fica na lista para o select ter o valor
               atual. */
            const opcoes = PAPEIS.filter(
              (p) => p !== "proprietario" || meuPapel === "proprietario" || m.papel === "proprietario",
            );

            return (
              <Linha key={m.id}>
                <Celula>
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mrg-500/20 text-[11px] font-bold text-mrg-600">
                      {iniciais(m.nome)}
                    </span>
                    <span className={`font-medium ${m.ativo ? "text-tinta" : "text-cinza"}`}>
                      {m.nome}
                      {souEu && <span className="ml-1.5 text-xs font-normal text-cinza">(você)</span>}
                    </span>
                  </div>
                </Celula>

                <Celula className="text-cinza">{m.email ?? "—"}</Celula>

                <Celula>
                  {souEu ? (
                    <span
                      className="text-sm text-grafite"
                      title="Ninguém altera o próprio papel: peça a outro proprietário."
                    >
                      {ROTULO_PAPEL[m.papel]}
                    </span>
                  ) : (
                    <Selecao
                      value={m.papel}
                      disabled={ocupado}
                      aria-label={`Papel de ${m.nome}`}
                      className="h-9 w-40 py-0 text-xs"
                      onChange={(e) => mudarPapel(m, e.target.value as Papel)}
                    >
                      {opcoes.map((p) => (
                        <option key={p} value={p}>
                          {ROTULO_PAPEL[p]}
                        </option>
                      ))}
                    </Selecao>
                  )}
                </Celula>

                <Celula className="whitespace-nowrap text-cinza">{dataCompleta(m.desde)}</Celula>

                <Celula>
                  <Etiqueta tom={m.ativo ? "sucesso" : "neutro"}>
                    {m.ativo ? "Ativo" : "Desativado"}
                  </Etiqueta>
                </Celula>

                <Celula className="text-right">
                  {souEu ? (
                    <span className="text-xs text-cinza-claro">—</span>
                  ) : (
                    <Botao
                      variante="fantasma"
                      tamanho="sm"
                      onClick={() => alternarAcesso(m)}
                      disabled={ocupado}
                      className={m.ativo ? "hover:text-perigo" : "hover:text-sucesso"}
                    >
                      {m.ativo ? "Desativar" : "Reativar"}
                    </Botao>
                  )}
                </Celula>
              </Linha>
            );
          })}
        </tbody>
      </Tabela>

      <p className="px-1 text-xs text-cinza">
        Acesso de cliente entra pelo portal, não pelo painel, e vê apenas as contas liberadas para
        ele.
      </p>
    </section>
  );
}

export function Convites() {
  const { convites, revogar } = useEquipe();

  /* `Date.now()` no corpo do componente é função impura durante o render: o
     resultado muda a cada re-render sem que nada de fato tenha mudado. A
     comparação de texto "2026-08-31" >= "2026-08-26" resolve o mesmo, é
     estável e usa o dia no fuso da agência em vez do fuso do navegador. */
  const dia = hoje();

  return (
    <section>
      <h2 className="mb-3 font-display text-base font-bold text-tinta">Convites pendentes</h2>

      {convites.length === 0 ? (
        <p className="cartao rounded-lg p-8 text-center text-sm text-cinza">
          Nenhum convite em aberto. Use <strong className="text-grafite">Convidar</strong> no topo
          para gerar um link de entrada e mandar para a pessoa.
        </p>
      ) : (
        <Tabela larguraMinima="40rem">
          <Cabecalhos colunas={["E-mail", "Papel", "Validade", ""]} />
          <tbody>
            {convites.map((c) => {
              const expirado = c.expiraEm.slice(0, 10) < dia;
              return (
                <Linha key={c.id}>
                  <Celula className="font-medium text-tinta">{c.email}</Celula>
                  <Celula>
                    <Etiqueta tom="azul">{ROTULO_PAPEL[c.papel]}</Etiqueta>
                  </Celula>
                  <Celula className="whitespace-nowrap">
                    {expirado ? (
                      <Etiqueta tom="perigo">Expirado</Etiqueta>
                    ) : (
                      <span className="text-cinza">até {dataCompleta(c.expiraEm)}</span>
                    )}
                  </Celula>
                  <Celula>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => copiarLink(`/entrar?convite=${c.token}`)}
                        disabled={expirado}
                        aria-label={`Copiar link do convite de ${c.email}`}
                        title={expirado ? "Convite expirado: revogue e gere outro" : "Copiar link"}
                        className="rounded-full p-2 text-cinza-claro transition-colors hover:bg-nevoa hover:text-tinta disabled:pointer-events-none disabled:opacity-40 foco-anel"
                      >
                        <Link2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => revogar(c)}
                        aria-label={`Revogar convite de ${c.email}`}
                        title="Revogar convite"
                        className="rounded-full p-2 text-cinza-claro transition-colors hover:bg-chip-rosa hover:text-perigo foco-anel"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Celula>
                </Linha>
              );
            })}
          </tbody>
        </Tabela>
      )}
    </section>
  );
}

/** Botão do topo da página. */
export function AcaoConvidar() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Botao tamanho="sm" onClick={() => setAberto(true)}>
        <UserPlus className="size-4" />
        Convidar
      </Botao>
      {aberto && <DialogoConvite aoFechar={() => setAberto(false)} />}
    </>
  );
}

function DialogoConvite({ aoFechar }: { aoFechar: () => void }) {
  const { convidar, meuPapel } = useEquipe();
  const idBase = useId();
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("operador");
  const [link, setLink] = useState<string | null>(null);
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

  const opcoes = PAPEIS.filter((p) => p !== "proprietario" || meuPapel === "proprietario");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return setErro("Informe o e-mail de quem vai receber o acesso.");

    setEnviando(true);
    const gerado = await convidar(email, papel);
    setEnviando(false);
    if (gerado) setLink(gerado);
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
        className="my-auto w-full max-w-lg overflow-hidden rounded-xl bg-carta shadow-concha"
      >
        <div className="flex items-start justify-between gap-3 border-b border-borda px-6 py-4">
          <div>
            <h2 id={`${idBase}-titulo`} className="font-display text-lg font-bold text-tinta">
              Convidar para a equipe
            </h2>
            <p className="mt-0.5 text-xs text-cinza">
              O convite gera um link de entrada válido por 7 dias. Você escolhe por onde mandar.
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

        {link ? (
          <div className="space-y-4 p-6">
            <p className="text-sm text-grafite">
              Convite de <strong className="text-tinta">{email.trim().toLowerCase()}</strong> criado
              como {ROTULO_PAPEL[papel]}. Mande este link para a pessoa entrar:
            </p>
            <code className="block overflow-x-auto rounded-md border border-borda bg-nevoa px-3.5 py-2.5 text-xs text-tinta">
              {link}
            </code>
            <div className="flex justify-end gap-2">
              <Botao type="button" variante="contorno" onClick={() => copiarLink(link)}>
                <Copy className="size-4" />
                Copiar link
              </Botao>
              <Botao type="button" onClick={aoFechar}>
                Concluir
              </Botao>
            </div>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4 p-6" noValidate>
            <Campo rotulo="E-mail">
              <Entrada
                ref={focar}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErro(null);
                }}
                placeholder="nome@empresa.com.br"
                autoComplete="off"
              />
            </Campo>

            <Campo rotulo="Papel" dica="Define o que a pessoa vê e altera no painel.">
              <Selecao value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
                {opcoes.map((p) => (
                  <option key={p} value={p}>
                    {ROTULO_PAPEL[p]}
                  </option>
                ))}
              </Selecao>
            </Campo>

            {erro && <p className="text-xs text-perigo">{erro}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Botao type="button" variante="contorno" onClick={aoFechar}>
                Cancelar
              </Botao>
              <Botao type="submit" disabled={enviando}>
                {enviando ? "Gerando…" : "Gerar convite"}
              </Botao>
            </div>
          </form>
        )}
      </div>
    </Sobreposicao>
  );
}
