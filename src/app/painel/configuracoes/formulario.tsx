"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada, Selecao } from "@/components/ui/campo";
import { salvarAgencia } from "./acoes";
import type { DadosAgencia } from "@/lib/organizacao";

const FUSOS = [
  { v: "America/Sao_Paulo", r: "Brasília (UTC−3)" },
  { v: "America/Manaus", r: "Manaus (UTC−4)" },
  { v: "America/Belem", r: "Belém (UTC−3)" },
  { v: "America/Fortaleza", r: "Fortaleza (UTC−3)" },
  { v: "America/Cuiaba", r: "Cuiabá (UTC−4)" },
  { v: "America/Rio_Branco", r: "Rio Branco (UTC−5)" },
  { v: "America/Noronha", r: "Fernando de Noronha (UTC−2)" },
];

/**
 * Formulário dos dados da agência.
 *
 * Antes era decoração: os campos existiam, o botão era `type="button"` sem
 * handler e nada saía dali. Agora grava de verdade — e o botão só habilita
 * quando algo mudou, para não sugerir salvamento onde não há alteração.
 */
export function FormularioAgencia({ inicial }: { inicial: DadosAgencia }) {
  const [dados, setDados] = useState(inicial);
  const [salvo, setSalvo] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudou = JSON.stringify(dados) !== JSON.stringify(salvo);

  const campo =
    (chave: keyof DadosAgencia) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDados((d) => ({ ...d, [chave]: e.target.value }));
      setErro(null);
    };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = await salvarAgencia(dados);
    setEnviando(false);

    if (!r.ok) {
      setErro(r.erro ?? "Não foi possível salvar.");
      return;
    }
    setSalvo(dados);
    toast.success(r.demo ? "Salvo na tela (modo demonstração)." : "Dados da agência atualizados.");
  }

  return (
    <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
      <Campo rotulo="Nome">
        <Entrada value={dados.nome} onChange={campo("nome")} maxLength={120} />
      </Campo>

      <Campo rotulo="CNPJ">
        <Entrada
          value={dados.documento}
          onChange={campo("documento")}
          placeholder="00.000.000/0001-00"
          inputMode="numeric"
        />
      </Campo>

      <Campo rotulo="E-mail de contato" dica="Aparece nas propostas e nos relatórios.">
        <Entrada type="email" value={dados.email_contato} onChange={campo("email_contato")} />
      </Campo>

      <Campo rotulo="WhatsApp comercial">
        <Entrada
          value={dados.whatsapp}
          onChange={campo("whatsapp")}
          placeholder="(00) 00000-0000"
          inputMode="tel"
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Cor primária" dica="Usada nas propostas e nos relatórios.">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(dados.cor_primaria) ? dados.cor_primaria : "#1668f5"}
              onChange={campo("cor_primaria")}
              aria-label="Escolher a cor primária"
              className="size-10 shrink-0 cursor-pointer rounded-md border border-borda bg-carta p-1 foco-anel"
            />
            <Entrada value={dados.cor_primaria} onChange={campo("cor_primaria")} maxLength={7} />
          </div>
        </Campo>

        <Campo rotulo="Fuso horário" dica="Decide o que é 'hoje' em prazos e vencimentos.">
          <Selecao value={dados.fuso_horario} onChange={campo("fuso_horario")}>
            {FUSOS.map((f) => (
              <option key={f.v} value={f.v}>
                {f.r}
              </option>
            ))}
          </Selecao>
        </Campo>
      </div>

      {erro && <p className="text-xs text-perigo">{erro}</p>}

      <div className="flex items-center gap-3">
        <Botao type="submit" disabled={enviando || !mudou}>
          {enviando ? "Salvando…" : "Salvar alterações"}
        </Botao>
        {mudou && !enviando && (
          <button
            type="button"
            onClick={() => {
              setDados(salvo);
              setErro(null);
            }}
            className="text-xs font-medium text-cinza hover:text-tinta foco-anel"
          >
            Descartar
          </button>
        )}
      </div>
    </form>
  );
}
