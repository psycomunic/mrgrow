"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { EnvioArquivo, type ArquivoAnexado } from "@/components/painel/envio-arquivo";
import { ROTULO_PAPEL, type Papel } from "@/lib/papeis";
import { salvarPerfil, trocarSenha, type DadosPerfil } from "./acoes";

export function FormularioPerfil({
  inicial,
  email,
  papel,
  organizacao,
}: {
  inicial: DadosPerfil;
  email: string;
  papel: Papel;
  organizacao: string;
}) {
  const [dados, setDados] = useState(inicial);
  const [salvo, setSalvo] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [foto, setFoto] = useState<ArquivoAnexado | null>(
    inicial.avatar_url
      ? {
          id: null,
          nome: "Foto de perfil",
          caminho: "",
          mime: "image/png",
          tamanho: 0,
          url: inicial.avatar_url,
        }
      : null,
  );

  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [trocando, setTrocando] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  const mudou = JSON.stringify(dados) !== JSON.stringify(salvo);

  const campo =
    (chave: keyof DadosPerfil) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDados((d) => ({ ...d, [chave]: e.target.value }));
      setErro(null);
    };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = await salvarPerfil(dados);
    setEnviando(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível salvar.");
    setSalvo(dados);
    toast.success(r.demo ? "Salvo na tela (modo demonstração)." : "Perfil atualizado.");
  }

  async function enviarSenha(e: React.FormEvent) {
    e.preventDefault();
    setErroSenha(null);
    setTrocando(true);
    const r = await trocarSenha(nova, confirmacao);
    setTrocando(false);

    if (!r.ok) return setErroSenha(r.erro ?? "Não foi possível trocar a senha.");
    setNova("");
    setConfirmacao("");
    toast.success(r.demo ? "Trocada na tela (demonstração)." : "Senha alterada.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="cartao rounded-lg p-6">
        <h2 className="font-display text-base font-bold text-tinta">Seus dados</h2>
        <p className="mt-0.5 text-xs text-cinza">
          O nome e a foto aparecem nas tarefas, no funil e para o resto da equipe.
        </p>

        <form onSubmit={enviar} className="mt-5 space-y-4" noValidate>
          <EnvioArquivo
            valor={foto}
            aoMudar={(a) => {
              setFoto(a);
              setDados((d) => ({ ...d, avatar_url: a?.url ?? "" }));
              setErro(null);
            }}
            escopo="perfis"
            recurso="visao"
            rotulo="Foto"
            imagem
            dica="PNG, JPEG ou WEBP — até 10 MB."
          />

          <Campo rotulo="Nome completo">
            <Entrada value={dados.nome_completo} onChange={campo("nome_completo")} />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Cargo" dica="Opcional">
              <Entrada
                value={dados.cargo}
                onChange={campo("cargo")}
                placeholder="Gestor de tráfego"
              />
            </Campo>
            <Campo rotulo="Telefone" dica="Opcional">
              <Entrada
                value={dados.telefone}
                onChange={campo("telefone")}
                placeholder="(00) 00000-0000"
              />
            </Campo>
          </div>

          {/* O e-mail é a credencial de entrada: trocá-lo exige confirmar
              o novo endereço, senão dá para se trancar para fora da conta.
              Fica visível e bloqueado até isso existir. */}
          <Campo rotulo="E-mail" dica="É com ele que você entra. Para trocar, fale com o proprietário.">
            <Entrada value={email} readOnly className="cursor-not-allowed opacity-70" />
          </Campo>

          {erro && <p className="text-xs text-perigo">{erro}</p>}

          <div className="flex items-center gap-3">
            <Botao type="submit" disabled={enviando || !mudou}>
              {enviando ? "Salvando…" : "Salvar perfil"}
            </Botao>
            {!mudou && <span className="text-xs text-cinza-claro">Tudo salvo.</span>}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="cartao rounded-lg p-6">
          <h2 className="font-display flex items-center gap-2 text-base font-bold text-tinta">
            <ShieldCheck className="size-4 text-acento" />
            Acesso
          </h2>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-cinza">Organização</dt>
              <dd className="font-medium text-tinta">{organizacao}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-cinza">Papel</dt>
              <dd>
                <Etiqueta tom="azul">{ROTULO_PAPEL[papel]}</Etiqueta>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-cinza">
            Só um proprietário altera papéis, em Equipe.
          </p>
        </div>

        <div className="cartao rounded-lg p-6">
          <h2 className="font-display flex items-center gap-2 text-base font-bold text-tinta">
            <KeyRound className="size-4 text-acento" />
            Trocar senha
          </h2>
          <p className="mt-0.5 text-xs text-cinza">
            Mínimo de 8 caracteres. A troca vale no próximo acesso.
          </p>

          <form onSubmit={enviarSenha} className="mt-5 space-y-4" noValidate>
            <Campo rotulo="Nova senha">
              <Entrada
                type="password"
                value={nova}
                onChange={(e) => {
                  setNova(e.target.value);
                  setErroSenha(null);
                }}
                autoComplete="new-password"
              />
            </Campo>
            <Campo rotulo="Repita a nova senha">
              <Entrada
                type="password"
                value={confirmacao}
                onChange={(e) => {
                  setConfirmacao(e.target.value);
                  setErroSenha(null);
                }}
                autoComplete="new-password"
              />
            </Campo>

            {erroSenha && <p className="text-xs text-perigo">{erroSenha}</p>}

            <Botao type="submit" variante="contorno" disabled={trocando || nova.length < 8}>
              {trocando ? "Trocando…" : "Trocar senha"}
            </Botao>
          </form>
        </div>
      </div>
    </div>
  );
}
