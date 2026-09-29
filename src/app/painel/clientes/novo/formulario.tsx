"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { EnvioArquivo, type ArquivoAnexado } from "@/components/painel/envio-arquivo";
import { criarCliente, type DadosCliente } from "../acoes";

const STATUS: { v: string; r: string }[] = [
  { v: "prospecto", r: "Prospecto" },
  { v: "onboarding", r: "Onboarding" },
  { v: "ativo", r: "Ativo" },
  { v: "pausado", r: "Pausado" },
  { v: "encerrado", r: "Encerrado" },
];

/* Conta nova quase sempre entra em onboarding, com saúde neutra e sem
   NPS — ninguém mediu nada ainda. Preencher isso com um valor otimista
   contaminaria a média da carteira desde o primeiro dia. */
function vazio(): DadosCliente {
  return {
    nome: "",
    segmento: "",
    status: "onboarding",
    documento: "",
    site: "",
    instagram: "",
    fee_mensal: 0,
    investimento_previsto: 0,
    percentual_sobre_investimento: 0,
    dia_vencimento: 10,
    inicio_contrato: null,
    fim_contrato: null,
    saude: 80,
    nps: null,
    observacoes: "",
    contato_nome: "",
    contato_email: "",
    contato_telefone: "",
    contato_cargo: "",
    logo_url: "",
  };
}

export function FormularioNovoCliente() {
  const router = useRouter();
  const [d, setD] = useState<DadosCliente>(vazio);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [logo, setLogo] = useState<ArquivoAnexado | null>(null);

  const texto =
    (chave: keyof DadosCliente) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setD((x) => ({ ...x, [chave]: e.target.value }));
      setErro(null);
    };

  const numero =
    (chave: keyof DadosCliente, inteiro = false) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value.replace(",", ".")) || 0;
      setD((x) => ({ ...x, [chave]: inteiro ? Math.trunc(n) : n }));
      setErro(null);
    };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!d.nome.trim()) return setErro("Informe o nome do cliente.");

    setEnviando(true);
    const r = await criarCliente(d);
    setEnviando(false);

    if (!r.ok) return setErro(r.erro ?? "Não foi possível criar o cliente.");

    toast.success(r.demo ? "Criado na tela (modo demonstração)." : `${d.nome} entrou na carteira.`);
    /* Vai direto para a ficha: quem acabou de cadastrar costuma querer
       completar contrato e contatos na sequência. */
    router.push(r.slug ? `/painel/clientes/${r.slug}` : "/painel/clientes");
  }

  return (
    <form onSubmit={enviar} className="cartao max-w-3xl space-y-6 rounded-lg p-6" noValidate>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome do cliente">
            <Entrada
              value={d.nome}
              onChange={texto("nome")}
              placeholder="Ex.: Clínica Aurora"
              autoFocus
            />
          </Campo>
          <Campo rotulo="Segmento" dica="Opcional">
            <Entrada
              value={d.segmento}
              onChange={texto("segmento")}
              placeholder="Estética e saúde"
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Status">
            <Selecao value={d.status} onChange={texto("status")}>
              {STATUS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.r}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="CNPJ ou CPF" dica="Opcional">
            <Entrada
              value={d.documento}
              onChange={texto("documento")}
              placeholder="00.000.000/0000-00"
            />
          </Campo>
        </div>
      </div>

      <div className="space-y-4 border-t border-borda pt-6">
        <h2 className="font-display text-sm font-bold text-tinta">Contrato</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Fee mensal (R$)">
            <Entrada
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={d.fee_mensal || ""}
              onChange={numero("fee_mensal")}
              placeholder="3500"
            />
          </Campo>
          <Campo rotulo="Mídia prevista (R$)" dica="Paga por ele às plataformas">
            <Entrada
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={d.investimento_previsto || ""}
              onChange={numero("investimento_previsto")}
              placeholder="20000"
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="% sobre a mídia" dica="0 quando não há">
            <Entrada
              type="number"
              min={0}
              max={100}
              step="0.1"
              inputMode="decimal"
              value={d.percentual_sobre_investimento || ""}
              onChange={numero("percentual_sobre_investimento")}
            />
          </Campo>
          <Campo rotulo="Dia do vencimento" dica="De 1 a 28">
            <Entrada
              type="number"
              min={1}
              max={28}
              step="1"
              value={d.dia_vencimento || ""}
              onChange={numero("dia_vencimento", true)}
            />
          </Campo>
          <Campo rotulo="Início do contrato" dica="Opcional">
            <Entrada
              type="date"
              value={d.inicio_contrato ?? ""}
              onChange={(e) => setD((x) => ({ ...x, inicio_contrato: e.target.value || null }))}
            />
          </Campo>
        </div>
      </div>

      <div className="space-y-4 border-t border-borda pt-6">
        <h2 className="font-display text-sm font-bold text-tinta">Contato principal</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome de quem responde" dica="Opcional">
            <Entrada
              value={d.contato_nome}
              onChange={texto("contato_nome")}
              placeholder="Ex.: Rafael Dantas"
            />
          </Campo>
          <Campo rotulo="Cargo" dica="Opcional">
            <Entrada
              value={d.contato_cargo}
              onChange={texto("contato_cargo")}
              placeholder="Sócio, gerente de marketing…"
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="WhatsApp / telefone" dica="Vira botão de conversa na ficha">
            <Entrada
              value={d.contato_telefone}
              onChange={texto("contato_telefone")}
              placeholder="(21) 98888-7777"
              inputMode="tel"
            />
          </Campo>
          <Campo rotulo="E-mail do contato" dica="Opcional">
            <Entrada
              type="email"
              value={d.contato_email}
              onChange={texto("contato_email")}
              placeholder="contato@empresa.com.br"
            />
          </Campo>
        </div>
      </div>

      <div className="space-y-4 border-t border-borda pt-6">
        <h2 className="font-display text-sm font-bold text-tinta">Presença</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Site" dica="Opcional">
            <Entrada value={d.site} onChange={texto("site")} placeholder="empresa.com.br" />
          </Campo>
          <Campo rotulo="Instagram" dica="Só o usuário, sem @">
            <Entrada value={d.instagram} onChange={texto("instagram")} placeholder="nomedaempresa" />
          </Campo>
        </div>

        <EnvioArquivo
          valor={logo}
          aoMudar={(a) => {
            setLogo(a);
            setD((x) => ({ ...x, logo_url: a?.url ?? "" }));
            setErro(null);
          }}
          escopo="marca"
          recurso="clientes"
          rotulo="Logo do cliente"
          imagem
          publico
          dica="Opcional — PNG, JPEG, WEBP ou SVG."
        />

        <Campo rotulo="Observações" dica="O que a equipe precisa saber desta conta">
          <AreaTexto
            value={d.observacoes}
            onChange={texto("observacoes")}
            className="min-h-24"
            placeholder="Prazos de aprovação, sazonalidade, combinados…"
          />
        </Campo>
      </div>

      {erro && <p className="text-xs text-perigo">{erro}</p>}

      <div className="flex items-center gap-2 border-t border-borda pt-6">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Criando…" : "Criar cliente"}
        </Botao>
        <BotaoLink href="/painel/clientes" variante="contorno">
          Cancelar
        </BotaoLink>
      </div>
    </form>
  );
}
