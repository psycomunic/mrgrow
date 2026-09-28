"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/botao";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { EnvioArquivo, type ArquivoAnexado } from "@/components/painel/envio-arquivo";
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

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function Secao({
  titulo,
  apoio,
  children,
}: {
  titulo: string;
  apoio: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-borda pt-6 first:border-0 first:pt-0">
      <h3 className="font-display text-sm font-bold text-tinta">{titulo}</h3>
      <p className="mt-0.5 mb-4 text-xs text-cinza">{apoio}</p>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * Dados da agência.
 *
 * Só `nome`, `documento`, `cor_primaria`, `fuso_horario` e `logo_url` têm
 * coluna própria; o resto vive em `organizacoes.configuracoes`, que é um
 * jsonb feito para isso. Por isso o formulário pode crescer sem migration.
 *
 * As seções existem porque a tela responde a perguntas de origens
 * diferentes: identidade da empresa, o que aparece para o cliente, como
 * ele paga, e o que a proposta já vem preenchida.
 */
export function FormularioAgencia({ inicial }: { inicial: DadosAgencia }) {
  const [dados, setDados] = useState(inicial);
  const [salvo, setSalvo] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [logo, setLogo] = useState<ArquivoAnexado | null>(
    inicial.logo_url
      ? {
          id: null,
          nome: "Logo da agência",
          caminho: "",
          mime: "image/png",
          tamanho: 0,
          url: inicial.logo_url,
        }
      : null,
  );

  const mudou = JSON.stringify(dados) !== JSON.stringify(salvo);

  const campo =
    (chave: keyof DadosAgencia) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setDados((d) => ({ ...d, [chave]: e.target.value }));
      setErro(null);
    };

  const numero =
    (chave: keyof DadosAgencia) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDados((d) => ({ ...d, [chave]: Number(e.target.value.replace(",", ".")) || 0 }));
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
    <form onSubmit={enviar} className="mt-6 space-y-6" noValidate>
      <Secao titulo="Identificação" apoio="Vai no contrato, na nota e na proposta.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome comercial">
            <Entrada value={dados.nome} onChange={campo("nome")} />
          </Campo>
          <Campo rotulo="Razão social" dica="Se for diferente do nome comercial">
            <Entrada
              value={dados.razao_social}
              onChange={campo("razao_social")}
              placeholder="MR Grow Assessoria de Marketing LTDA"
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="CNPJ">
            <Entrada
              value={dados.documento}
              onChange={campo("documento")}
              placeholder="00.000.000/0001-00"
            />
          </Campo>
          <Campo rotulo="Inscrição municipal" dica="Opcional — usada em nota de serviço">
            <Entrada value={dados.inscricao_municipal} onChange={campo("inscricao_municipal")} />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Contato" apoio="Aparece nas propostas, nos relatórios e no portal do cliente.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="E-mail de contato">
            <Entrada
              type="email"
              value={dados.email_contato}
              onChange={campo("email_contato")}
              placeholder="contato@mrgrow.com.br"
            />
          </Campo>
          <Campo rotulo="WhatsApp comercial">
            <Entrada
              value={dados.whatsapp}
              onChange={campo("whatsapp")}
              placeholder="(00) 00000-0000"
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Telefone fixo" dica="Opcional">
            <Entrada value={dados.telefone} onChange={campo("telefone")} />
          </Campo>
          <Campo rotulo="Site">
            <Entrada value={dados.site} onChange={campo("site")} placeholder="mrgrow.com.br" />
          </Campo>
        </div>

        <Campo rotulo="Instagram" dica="Só o usuário, sem @">
          <Entrada value={dados.instagram} onChange={campo("instagram")} placeholder="mrgrow.ag" />
        </Campo>
      </Secao>

      <Secao titulo="Endereço" apoio="Entra no contrato e na nota fiscal.">
        <Campo rotulo="Logradouro e número">
          <Entrada
            value={dados.endereco}
            onChange={campo("endereco")}
            placeholder="Rua Exemplo, 123 — Sala 4"
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Cidade">
            <Entrada value={dados.cidade} onChange={campo("cidade")} />
          </Campo>
          <Campo rotulo="Estado">
            <Selecao value={dados.estado} onChange={campo("estado")}>
              <option value="">—</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="CEP">
            <Entrada value={dados.cep} onChange={campo("cep")} placeholder="00000-000" />
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Marca"
        apoio="A logo aparece na proposta e no relatório que o cliente abre por link."
      >
        <EnvioArquivo
          valor={logo}
          aoMudar={(a) => {
            setLogo(a);
            setDados((d) => ({ ...d, logo_url: a?.url ?? "" }));
            setErro(null);
          }}
          escopo="marca"
          recurso="configuracoes"
          rotulo="Logo"
          imagem
          dica="PNG, JPEG, WEBP ou SVG — até 10 MB. Fundo transparente fica melhor."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Cor primária" dica="Usada nas propostas e nos relatórios.">
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Escolher cor"
                value={/^#[0-9a-f]{6}$/i.test(dados.cor_primaria) ? dados.cor_primaria : "#1668f5"}
                onChange={campo("cor_primaria")}
                className="foco-anel h-11 w-12 shrink-0 cursor-pointer rounded-md border border-borda bg-nevoa p-1"
              />
              <Entrada value={dados.cor_primaria} onChange={campo("cor_primaria")} />
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
      </Secao>

      <Secao titulo="Cobrança" apoio="O que a proposta e a fatura informam a quem vai pagar.">
        <Campo rotulo="Chave PIX">
          <Entrada
            value={dados.pix_chave}
            onChange={campo("pix_chave")}
            placeholder="CNPJ, e-mail ou chave aleatória"
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Banco">
            <Entrada value={dados.banco} onChange={campo("banco")} placeholder="260 · Nu Pagamentos" />
          </Campo>
          <Campo rotulo="Agência">
            <Entrada value={dados.agencia_bancaria} onChange={campo("agencia_bancaria")} />
          </Campo>
          <Campo rotulo="Conta">
            <Entrada value={dados.conta_bancaria} onChange={campo("conta_bancaria")} />
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Padrões da operação"
        apoio="O que a proposta já vem preenchida e como a agência mede o resultado."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Validade da proposta (dias)">
            <Entrada
              type="number"
              min={1}
              max={365}
              value={String(dados.proposta_validade_dias)}
              onChange={numero("proposta_validade_dias")}
            />
          </Campo>
          <Campo rotulo="Meta de ROAS" dica="Abaixo disso a conta entra na fila de revisão.">
            <Entrada
              inputMode="decimal"
              value={String(dados.meta_roas)}
              onChange={numero("meta_roas")}
              placeholder="3.5"
            />
          </Campo>
        </div>

        <Campo
          rotulo="Condições padrão da proposta"
          dica="Texto que entra em toda proposta nova — dá para editar caso a caso."
        >
          <AreaTexto
            value={dados.proposta_condicoes}
            onChange={campo("proposta_condicoes")}
            className="min-h-24"
            placeholder="O investimento em mídia é pago diretamente às plataformas e não entra no valor da assessoria."
          />
        </Campo>

        <Campo rotulo="Assinatura de e-mail" dica="Fecha os e-mails enviados pelo painel.">
          <AreaTexto
            value={dados.assinatura_email}
            onChange={campo("assinatura_email")}
            className="min-h-20"
            placeholder={"Equipe MR Grow\ncontato@mrgrow.com.br"}
          />
        </Campo>
      </Secao>

      {erro && <p className="text-xs text-perigo">{erro}</p>}

      {/* Grudado embaixo: o formulário ficou longo e o botão sumiria da
          tela justamente quando há algo para salvar. */}
      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-borda bg-carta/95 px-6 py-4 backdrop-blur">
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
            className="foco-anel text-xs font-medium text-cinza hover:text-tinta"
          >
            Descartar
          </button>
        )}
        {!mudou && <span className="text-xs text-cinza-claro">Tudo salvo.</span>}
      </div>
    </form>
  );
}
