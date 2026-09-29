"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Entrada, Selecao } from "@/components/ui/campo";
import { cn, dataCurta, iniciais } from "@/lib/utils";
import {
  adicionarAoProjeto,
  adicionarPasso,
  alternarPasso,
  listarEquipe,
  listarPassos,
  removerDoProjeto,
  removerPasso,
  type MembroProjeto,
  type PassoProjeto,
} from "./equipe-acoes";

type Pessoa = { id: string; nome: string };

/**
 * Equipe e próximos passos de um projeto.
 *
 * Só aparece na edição: as duas listas penduram no id do projeto, e num
 * projeto que ainda não existe não há onde pendurá-las. Quem cria salva
 * primeiro e reabre — o que também evita montar uma equipe inteira e
 * perder tudo se o salvamento falhar.
 */
export function EquipeEPassos({
  projetoId,
  pessoas,
  responsavelPrincipal,
}: {
  projetoId: string;
  pessoas: Pessoa[];
  responsavelPrincipal: string | null;
}) {
  const [equipe, setEquipe] = useState<MembroProjeto[]>([]);
  const [passos, setPassos] = useState<PassoProjeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [, iniciar] = useTransition();

  const [novaPessoa, setNovaPessoa] = useState("");
  const [novaFrente, setNovaFrente] = useState("");
  const [novoPasso, setNovoPasso] = useState("");
  const [passoDe, setPassoDe] = useState("");
  const [passoAte, setPassoAte] = useState("");

  useEffect(() => {
    let vivo = true;
    Promise.all([listarEquipe(projetoId), listarPassos(projetoId)]).then(([e, p]) => {
      if (!vivo) return;
      setEquipe(e);
      setPassos(p);
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, [projetoId]);

  const disponiveis = pessoas.filter((p) => !equipe.some((m) => m.perfilId === p.id));

  function adicionarPessoa() {
    if (!novaPessoa) return toast.error("Escolha quem entra no projeto.");
    iniciar(async () => {
      const r = await adicionarAoProjeto(projetoId, novaPessoa, novaFrente);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível adicionar.");
        return;
      }
      setEquipe(await listarEquipe(projetoId));
      setNovaPessoa("");
      setNovaFrente("");
    });
  }

  function tirarPessoa(m: MembroProjeto) {
    iniciar(async () => {
      setEquipe((l) => l.filter((x) => x.id !== m.id));
      const r = await removerDoProjeto(m.id);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível remover.");
        setEquipe(await listarEquipe(projetoId));
      }
    });
  }

  function criarPasso() {
    if (!novoPasso.trim()) return toast.error("Escreva o passo.");
    iniciar(async () => {
      const r = await adicionarPasso(projetoId, novoPasso, passoDe || null, passoAte || null);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível adicionar.");
        return;
      }
      setPassos(await listarPassos(projetoId));
      setNovoPasso("");
      setPassoDe("");
      setPassoAte("");
    });
  }

  function alternar(p: PassoProjeto) {
    iniciar(async () => {
      /* Marca na hora: quem risca cinco passos seguidos não espera a ida
         ao servidor entre um e outro, e acha que o clique não pegou. */
      setPassos((l) => l.map((x) => (x.id === p.id ? { ...x, concluida: !x.concluida } : x)));
      const r = await alternarPasso(p.id, !p.concluida);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível salvar.");
        setPassos(await listarPassos(projetoId));
      }
    });
  }

  function apagarPasso(p: PassoProjeto) {
    iniciar(async () => {
      setPassos((l) => l.filter((x) => x.id !== p.id));
      const r = await removerPasso(p.id);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível remover.");
        setPassos(await listarPassos(projetoId));
      }
    });
  }

  const feitos = passos.filter((p) => p.concluida).length;

  if (carregando) {
    return <p className="py-6 text-center text-sm text-cinza">Carregando equipe e passos…</p>;
  }

  return (
    <div className="space-y-6">
      {/* ── Equipe ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-cinza uppercase">
            Quem toca este projeto
          </h3>
          {responsavelPrincipal && (
            <span className="text-[11px] text-cinza-claro">
              Responsável: <strong className="text-grafite">{responsavelPrincipal}</strong>
            </span>
          )}
        </div>

        {equipe.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {equipe.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-md border border-borda bg-nevoa px-3 py-2"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-acento/12 text-[10px] font-bold text-acento">
                  {iniciais(m.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-tinta">{m.nome}</p>
                  <p className="truncate text-[11px] text-cinza">
                    {m.frente || "Frente não definida"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => tirarPessoa(m)}
                  aria-label={`Tirar ${m.nome} do projeto`}
                  className="foco-anel rounded-sm p-1.5 text-cinza-claro transition-colors hover:bg-perigo/10 hover:text-perigo"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-md border border-dashed border-borda p-3 text-[13px] text-cinza">
            Ninguém além do responsável. Adicione quem cuida de cada frente.
          </p>
        )}

        {disponiveis.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Selecao
              value={novaPessoa}
              onChange={(e) => setNovaPessoa(e.target.value)}
              aria-label="Pessoa"
              className="text-sm"
            >
              <option value="">Quem entra…</option>
              {disponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Selecao>
            <Entrada
              value={novaFrente}
              onChange={(e) => setNovaFrente(e.target.value)}
              placeholder="Frente: design, copy, tráfego…"
              className="text-sm"
            />
            <Botao type="button" variante="contorno" tamanho="sm" onClick={adicionarPessoa}>
              <UserPlus className="size-4" />
              Adicionar
            </Botao>
          </div>
        )}
      </section>

      {/* ── Próximos passos ────────────────────────────────────── */}
      <section className="border-t border-borda pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-cinza uppercase">
            Próximos passos
          </h3>
          {passos.length > 0 && (
            <span className="text-[11px] text-cinza-claro">
              {feitos} de {passos.length} concluídos
            </span>
          )}
        </div>

        {passos.length > 0 ? (
          <ul className="mt-3 space-y-0.5">
            {passos.map((p) => (
              <li
                key={p.id}
                className="group flex items-center gap-3 rounded-md px-1 py-2 hover:bg-nevoa"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={p.concluida}
                  aria-label={`${p.concluida ? "Desmarcar" : "Marcar"} ${p.titulo}`}
                  onClick={() => alternar(p)}
                  className={cn(
                    "foco-anel grid size-5 shrink-0 place-items-center rounded-sm border transition-colors",
                    p.concluida
                      ? "border-sucesso bg-sucesso text-papel"
                      : "border-borda-forte bg-concha hover:border-acento",
                  )}
                >
                  {p.concluida && <Check className="size-3.5" strokeWidth={3} />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm",
                      p.concluida ? "text-cinza line-through" : "text-tinta",
                    )}
                  >
                    {p.titulo}
                  </p>
                  {(p.responsavel || p.venceEm) && (
                    <p className="truncate text-[11px] text-cinza">
                      {p.responsavel ?? "Sem responsável"}
                      {p.venceEm && ` · até ${dataCurta(p.venceEm)}`}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => apagarPasso(p)}
                  aria-label={`Remover ${p.titulo}`}
                  className="foco-anel rounded-sm p-1.5 text-cinza-claro opacity-0 transition-colors group-hover:opacity-100 hover:bg-perigo/10 hover:text-perigo focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-md border border-dashed border-borda p-3 text-[13px] text-cinza">
            Nenhum passo ainda. Cada um vira uma tarefa no quadro da equipe.
          </p>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <Entrada
            value={novoPasso}
            onChange={(e) => setNovoPasso(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                criarPasso();
              }
            }}
            placeholder="O que precisa acontecer…"
            className="text-sm"
          />
          <Selecao
            value={passoDe}
            onChange={(e) => setPassoDe(e.target.value)}
            aria-label="Responsável pelo passo"
            className="w-auto text-xs"
          >
            <option value="">Sem dono</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Selecao>
          <input
            type="date"
            value={passoAte}
            onChange={(e) => setPassoAte(e.target.value)}
            aria-label="Prazo do passo"
            className="foco-anel h-11 rounded-md border border-borda bg-concha px-2.5 text-xs text-tinta"
          />
          <Botao type="button" variante="contorno" tamanho="sm" onClick={criarPasso}>
            <Plus className="size-4" />
          </Botao>
        </div>

        <p className="mt-2 text-[11px] text-cinza-claro">
          Cada passo vira uma tarefa ligada a este projeto — aparece no quadro de tarefas de quem
          ficou responsável.
        </p>
      </section>
    </div>
  );
}
