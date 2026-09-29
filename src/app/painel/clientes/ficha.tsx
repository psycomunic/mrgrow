"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  IdCard,
  Instagram,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plug,
  StickyNote,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Sobreposicao } from "@/components/ui/sobreposicao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Campo, Entrada, AreaTexto, Selecao } from "@/components/ui/campo";
import { EnvioArquivo, type ArquivoAnexado } from "@/components/painel/envio-arquivo";
import { brl, cn, dataCompleta, iniciais, multiplo, numero, percentual } from "@/lib/utils";
import { pode } from "@/lib/papeis";
import { usePainel } from "../_componentes/sessao-cliente";
import { atualizarCliente, type DadosCliente } from "./acoes";
import { DialogoExcluirCliente } from "./excluir";
import type { ClienteCarteira } from "@/lib/clientes";

const TOM: Record<string, "sucesso" | "azul" | "alerta" | "neutro"> = {
  ativo: "sucesso",
  onboarding: "azul",
  pausado: "alerta",
  encerrado: "neutro",
  prospecto: "neutro",
};

const ROTULO_STATUS: Record<string, string> = {
  ativo: "Ativo",
  onboarding: "Onboarding",
  pausado: "Pausado",
  encerrado: "Encerrado",
  prospecto: "Prospecto",
};

function corSaude(v: number) {
  if (v >= 80) return "bg-sucesso";
  if (v >= 60) return "bg-alerta";
  return "bg-perigo";
}

function leituraSaude(v: number) {
  if (v >= 80) return "Conta saudável";
  if (v >= 60) return "Merece atenção";
  return "Risco de saída";
}

function daFicha(c: ClienteCarteira): DadosCliente {
  return {
    nome: c.nome,
    segmento: c.segmento ?? "",
    status: c.status,
    documento: c.documento ?? "",
    site: c.site ?? "",
    instagram: c.instagram ?? "",
    contato_nome: c.contato?.nome ?? "",
    contato_email: c.contato?.email ?? "",
    contato_telefone: c.contato?.telefone ?? "",
    contato_cargo: c.contato?.cargo ?? "",
    logo_url: c.logo_url ?? "",
    fee_mensal: c.fee_mensal,
    investimento_previsto: c.investimento_previsto,
    percentual_sobre_investimento: c.percentual_sobre_investimento,
    dia_vencimento: c.dia_vencimento,
    inicio_contrato: c.inicio_contrato,
    fim_contrato: c.fim_contrato,
    saude: c.saude,
    nps: c.nps,
    observacoes: c.observacoes ?? "",
  };
}

/**
 * Ficha do cliente: o suficiente para decidir sem sair da carteira.
 *
 * É modal centralizado, e não gaveta lateral: com duas colunas — dinheiro de
 * um lado, contrato e relacionamento do outro — a gaveta obrigaria a rolar
 * tudo em fila única.
 *
 * Quem tem permissão de editar clientes edita aqui mesmo, sem ir até a página
 * do cliente. Para quem não tem, a ficha continua sendo só leitura e o botão
 * nem aparece — e a Server Action confere a permissão de novo, porque esconder
 * botão não é controle de acesso.
 */
export function FichaCliente({
  cliente,
  aoFechar,
}: {
  cliente: ClienteCarteira;
  aoFechar: () => void;
}) {
  const { papel } = usePainel();
  const podeEditar = pode(papel, "clientes", "editar");
  const podeExcluir = pode(papel, "clientes", "excluir");

  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [dados, setDados] = useState<DadosCliente>(() => daFicha(cliente));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const anual = cliente.fee_mensal * 12;
  const sobreMidia =
    (cliente.investimento_previsto * cliente.percentual_sobre_investimento) / 100;

  function abrirEdicao() {
    setDados(daFicha(cliente));
    setErro(null);
    setEditando(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const r = await atualizarCliente(cliente.id, dados);
    setSalvando(false);

    if (!r.ok) {
      setErro(r.erro ?? "Não foi possível salvar.");
      return;
    }
    toast.success(r.demo ? "Salvo (não persiste: modo demonstração)." : "Cliente atualizado.");
    setEditando(false);
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
        aria-label={cliente.nome}
        className="cartao my-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-xl"
      >
        {/* ── Cabeçalho ───────────────────────────────────────────── */}
        <header className="border-b border-borda px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {/* Logo quando existe, iniciais quando não. Não otimizada pelo
                  Next de propósito: a origem é o Storage do cliente, e
                  declarar cada domínio possível na configuração seria pior
                  que servir a imagem como veio. */}
              {cliente.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cliente.logo_url}
                  alt={`Logo de ${cliente.nome}`}
                  className="size-12 shrink-0 rounded-md object-contain ring-1 ring-borda"
                />
              ) : (
                <span className="font-display grid size-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-mrg-500/30 to-mrg-800/30 text-base font-bold text-acento-forte ring-1 ring-borda">
                  {iniciais(cliente.nome)}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="font-display truncate text-2xl font-extrabold text-tinta">
                  {cliente.nome}
                </h2>
                <p className="mt-0.5 text-sm text-cinza">{cliente.segmento ?? "Sem segmento"}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {podeEditar && !editando && (
                <Botao variante="contorno" tamanho="sm" onClick={abrirEdicao}>
                  <Pencil className="size-4" />
                  Editar
                </Botao>
              )}
              <button
                onClick={aoFechar}
                aria-label="Fechar"
                className="foco-anel rounded-sm p-2 text-cinza transition-colors hover:bg-nevoa hover:text-tinta"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Etiqueta tom={TOM[cliente.status] ?? "neutro"}>
              {ROTULO_STATUS[cliente.status] ?? cliente.status}
            </Etiqueta>
            {cliente.responsavel && (
              <Etiqueta>
                <User className="mr-1 inline size-3" />
                {cliente.responsavel}
              </Etiqueta>
            )}
            {/* Só quando for outra pessoa: na maioria das contas quem responde
                pelo cliente também toca a mídia, e repetir o mesmo nome em
                duas pílulas seguidas não informa nada. */}
            {cliente.gestor_trafego && cliente.gestor_trafego !== cliente.responsavel && (
              <Etiqueta>
                <Users className="mr-1 inline size-3" />
                Tráfego: {cliente.gestor_trafego}
              </Etiqueta>
            )}
            <Etiqueta>Vence dia {cliente.dia_vencimento}</Etiqueta>
            {cliente.documento && (
              <Etiqueta>
                <Building2 className="mr-1 inline size-3" />
                {cliente.documento}
              </Etiqueta>
            )}
          </div>
        </header>

        {editando ? (
          <Formulario
            dados={dados}
            setDados={setDados}
            erro={erro}
            salvando={salvando}
            aoSalvar={salvar}
            aoCancelar={() => setEditando(false)}
          />
        ) : (
          <>
            <div className="grid max-h-[65vh] overflow-y-auto lg:grid-cols-2">
              {/* ── Dinheiro ──────────────────────────────────────── */}
              <div className="space-y-6 border-borda p-6 lg:border-r">
                <section>
                  <div className="mb-2 flex items-baseline justify-between">
                    <Titulo>Saúde da conta</Titulo>
                    <span className="text-sm text-grafite">
                      <strong className="font-display text-lg font-extrabold text-tinta">
                        {cliente.saude}
                      </strong>
                      <span className="text-cinza-claro">/100</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-nevoa-2">
                    <div
                      className={cn("h-full rounded-full", corSaude(cliente.saude))}
                      style={{ width: `${cliente.saude}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-cinza">{leituraSaude(cliente.saude)}</p>
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <Bloco
                    rotulo="Fee mensal"
                    valor={brl(cliente.fee_mensal)}
                    nota="recorrente"
                    destaque
                  />
                  <Bloco rotulo="Fee em 12 meses" valor={brl(anual)} nota="valor do contrato" />
                  <Bloco
                    rotulo="Mídia prevista"
                    valor={brl(cliente.investimento_previsto)}
                    nota="no mês, pago às plataformas"
                  />
                  <Bloco
                    rotulo="ROAS"
                    valor={cliente.roas ? multiplo(cliente.roas, 1) : "—"}
                    nota={cliente.roas ? "retorno sobre a mídia" : "sem dado sincronizado"}
                  />
                </section>

                {cliente.percentual_sobre_investimento > 0 && (
                  <section>
                    <Titulo>Percentual sobre a mídia</Titulo>
                    <div className="mt-2 rounded-md border border-borda bg-nevoa p-3.5">
                      <p className="font-display text-xl font-extrabold tabular-nums text-tinta">
                        {brl(sobreMidia)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-cinza-claro">
                        {percentual(cliente.percentual_sobre_investimento, 1)} de{" "}
                        {brl(cliente.investimento_previsto)} · soma ao fee
                      </p>
                    </div>
                  </section>
                )}
              </div>

              {/* ── Contrato e relacionamento ─────────────────────── */}
              <div className="space-y-6 p-6">
                <section>
                  <Titulo>Contrato</Titulo>
                  <dl className="mt-3 divide-y divide-borda rounded-lg border border-borda">
                    <Linha
                      rotulo="Início"
                      valor={
                        cliente.inicio_contrato ? dataCompleta(cliente.inicio_contrato) : "—"
                      }
                      Icone={CalendarDays}
                    />
                    <Linha
                      rotulo="Término"
                      valor={
                        cliente.fim_contrato
                          ? dataCompleta(cliente.fim_contrato)
                          : "Sem data final"
                      }
                      Icone={CalendarDays}
                    />
                    <Linha
                      rotulo="Vencimento da fatura"
                      valor={`Todo dia ${numero(cliente.dia_vencimento)}`}
                      Icone={CalendarDays}
                    />
                    <Linha
                      rotulo="NPS"
                      valor={cliente.nps !== null ? `${cliente.nps} de 10` : "Ainda não medido"}
                      Icone={ArrowUpRight}
                    />
                  </dl>
                </section>

                <Contato cliente={cliente} />

                <section>
                  <Titulo>Observações</Titulo>
                  {cliente.observacoes ? (
                    <p className="mt-3 rounded-md border border-borda bg-nevoa p-3.5 text-sm leading-relaxed text-grafite">
                      {cliente.observacoes}
                    </p>
                  ) : (
                    <p className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-borda p-3.5 text-sm text-cinza-claro">
                      <StickyNote className="size-4 shrink-0" />
                      Nada anotado sobre esta conta ainda.
                    </p>
                  )}
                </section>
              </div>
            </div>

            <footer className="flex flex-wrap items-center gap-2 border-t border-borda px-6 py-4">
              <BotaoLink href={`/painel/clientes/${cliente.slug}`} tamanho="sm">
                Abrir ficha completa
                <ArrowUpRight className="size-4" />
              </BotaoLink>
              <BotaoLink
                href={`/painel/relatorios?cliente=${cliente.slug}`}
                variante="contorno"
                tamanho="sm"
              >
                <FileText className="size-4" />
                Relatório
              </BotaoLink>
              <BotaoLink href="/painel/integracoes" variante="contorno" tamanho="sm">
                <Plug className="size-4" />
                Contas
              </BotaoLink>
              <div className="ml-auto flex items-center gap-2">
                {podeExcluir && (
                  <Botao
                    variante="fantasma"
                    tamanho="sm"
                    className="text-perigo hover:bg-perigo/10"
                    onClick={() => setExcluindo(true)}
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </Botao>
                )}
                <Botao variante="fantasma" tamanho="sm" onClick={aoFechar}>
                  Fechar
                </Botao>
              </div>
            </footer>
          </>
        )}
      </div>
      {excluindo && (
        <DialogoExcluirCliente
          cliente={cliente}
          aoFechar={() => setExcluindo(false)}
          /* Encerrar é a saída segura: abre a edição já com o status
             trocado, para a pessoa revisar e salvar. */
          aoEncerrar={() => {
            setDados({ ...daFicha(cliente), status: "encerrado" });
            setErro(null);
            setEditando(true);
          }}
        />
      )}
    </Sobreposicao>
  );
}

/** Modo de edição: os mesmos dados da ficha, agora em campos. */
function Formulario({
  dados,
  setDados,
  erro,
  salvando,
  aoSalvar,
  aoCancelar,
}: {
  dados: DadosCliente;
  setDados: React.Dispatch<React.SetStateAction<DadosCliente>>;
  erro: string | null;
  salvando: boolean;
  aoSalvar: (e: React.FormEvent) => void;
  aoCancelar: () => void;
}) {
  /* O arquivo vive aqui e não no cartão: é este formulário que o troca, e
     o endereço final já está em `dados.logo_url`. */
  const [logo, setLogo] = useState<ArquivoAnexado | null>(() =>
    dados.logo_url
      ? { id: null, nome: "Logo", caminho: "", mime: "image/*", tamanho: 0, url: dados.logo_url }
      : null,
  );

  /* Campo numérico vazio vira 0, e não NaN: `Number("")` é 0, mas
     `Number("abc")` não, e NaN atravessaria até o banco recusar. */
  const numerico = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <form onSubmit={aoSalvar}>
      <div className="grid max-h-[65vh] overflow-y-auto lg:grid-cols-2">
        <div className="space-y-4 border-borda p-6 lg:border-r">
          <Campo rotulo="Nome">
            <Entrada
              value={dados.nome}
              onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Segmento">
              <Entrada
                value={dados.segmento}
                onChange={(e) => setDados((d) => ({ ...d, segmento: e.target.value }))}
                placeholder="Ex.: Odontologia"
              />
            </Campo>
            <Campo rotulo="Status">
              <Selecao
                value={dados.status}
                onChange={(e) => setDados((d) => ({ ...d, status: e.target.value }))}
              >
                {Object.entries(ROTULO_STATUS).map(([v, r]) => (
                  <option key={v} value={v}>
                    {r}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>

          <Campo rotulo="CNPJ ou CPF">
            <Entrada
              value={dados.documento}
              onChange={(e) => setDados((d) => ({ ...d, documento: e.target.value }))}
              placeholder="00.000.000/0000-00"
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Fee mensal (R$)">
              <Entrada
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={dados.fee_mensal || ""}
                onChange={(e) => setDados((d) => ({ ...d, fee_mensal: numerico(e.target.value) }))}
              />
            </Campo>
            <Campo rotulo="Mídia prevista (R$)">
              <Entrada
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={dados.investimento_previsto || ""}
                onChange={(e) =>
                  setDados((d) => ({ ...d, investimento_previsto: numerico(e.target.value) }))
                }
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="% sobre a mídia" dica="0 quando não há">
              <Entrada
                type="number"
                min={0}
                max={100}
                step="0.1"
                inputMode="decimal"
                value={dados.percentual_sobre_investimento || ""}
                onChange={(e) =>
                  setDados((d) => ({
                    ...d,
                    percentual_sobre_investimento: numerico(e.target.value),
                  }))
                }
              />
            </Campo>
            <Campo rotulo="Dia do vencimento" dica="De 1 a 28">
              <Entrada
                type="number"
                min={1}
                max={28}
                step="1"
                value={dados.dia_vencimento || ""}
                onChange={(e) =>
                  setDados((d) => ({ ...d, dia_vencimento: Math.trunc(numerico(e.target.value)) }))
                }
              />
            </Campo>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Início do contrato">
              <Entrada
                type="date"
                value={dados.inicio_contrato ?? ""}
                onChange={(e) =>
                  setDados((d) => ({ ...d, inicio_contrato: e.target.value || null }))
                }
              />
            </Campo>
            <Campo rotulo="Término" dica="Em branco: sem data final">
              <Entrada
                type="date"
                value={dados.fim_contrato ?? ""}
                onChange={(e) => setDados((d) => ({ ...d, fim_contrato: e.target.value || null }))}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Saúde (0 a 100)">
              <Entrada
                type="number"
                min={0}
                max={100}
                step="1"
                value={dados.saude}
                onChange={(e) =>
                  setDados((d) => ({ ...d, saude: Math.trunc(numerico(e.target.value)) }))
                }
              />
            </Campo>
            <Campo rotulo="NPS (0 a 10)" dica="Em branco: ainda não medido">
              <Entrada
                type="number"
                min={0}
                max={10}
                step="1"
                value={dados.nps ?? ""}
                onChange={(e) =>
                  setDados((d) => ({
                    ...d,
                    nps: e.target.value === "" ? null : Math.trunc(numerico(e.target.value)),
                  }))
                }
              />
            </Campo>
          </div>

          <Campo rotulo="Site">
            <Entrada
              value={dados.site}
              onChange={(e) => setDados((d) => ({ ...d, site: e.target.value }))}
              placeholder="empresa.com.br"
            />
          </Campo>

          <Campo rotulo="Instagram" dica="Só o usuário, sem @">
            <Entrada
              value={dados.instagram}
              onChange={(e) => setDados((d) => ({ ...d, instagram: e.target.value }))}
              placeholder="nomedaempresa"
            />
          </Campo>

          {/* A logo vai para o balde público: ela aparece na proposta e no
              relatório que o cliente abre por link, onde não há sessão para
              assinar um endereço temporário. */}
          <EnvioArquivo
            valor={logo}
            aoMudar={(a) => {
              setLogo(a);
              setDados((d) => ({ ...d, logo_url: a?.url ?? "" }));
            }}
            escopo="marca"
            recurso="clientes"
            rotulo="Logo do cliente"
            imagem
            publico
            dica="PNG, JPEG, WEBP ou SVG. Fundo transparente fica melhor."
          />

          {/* O contato fica junto do resto: para quem cadastra, tudo isto
              é "o cliente". Que ele more noutra tabela é detalhe do banco. */}
          <div className="border-t border-borda pt-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-cinza uppercase">
              Contato principal
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Nome de quem responde">
                <Entrada
                  value={dados.contato_nome}
                  onChange={(e) => setDados((d) => ({ ...d, contato_nome: e.target.value }))}
                  placeholder="Ex.: Rafael Dantas"
                />
              </Campo>
              <Campo rotulo="Cargo" dica="Opcional">
                <Entrada
                  value={dados.contato_cargo}
                  onChange={(e) => setDados((d) => ({ ...d, contato_cargo: e.target.value }))}
                  placeholder="Sócio, gerente de marketing…"
                />
              </Campo>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo rotulo="WhatsApp / telefone" dica="Vira botão de conversa na ficha">
                <Entrada
                  value={dados.contato_telefone}
                  onChange={(e) => setDados((d) => ({ ...d, contato_telefone: e.target.value }))}
                  placeholder="(21) 98888-7777"
                  inputMode="tel"
                />
              </Campo>
              <Campo rotulo="E-mail">
                <Entrada
                  type="email"
                  value={dados.contato_email}
                  onChange={(e) => setDados((d) => ({ ...d, contato_email: e.target.value }))}
                  placeholder="contato@empresa.com.br"
                />
              </Campo>
            </div>
          </div>

          <Campo rotulo="Observações" dica="O que a equipe precisa lembrar desta conta">
            <AreaTexto
              value={dados.observacoes}
              onChange={(e) => setDados((d) => ({ ...d, observacoes: e.target.value }))}
              className="min-h-24"
              placeholder="Prazos de aprovação, sazonalidade, combinados…"
            />
          </Campo>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-borda px-6 py-4">
        {erro && <p className="text-xs text-perigo">{erro}</p>}
        <div className="ml-auto flex gap-2">
          <Botao type="button" variante="contorno" tamanho="sm" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao type="submit" tamanho="sm" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar alterações"}
          </Botao>
        </div>
      </div>
    </form>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold tracking-wider text-cinza-claro uppercase">{children}</h3>
  );
}

function Bloco({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-md border border-borda bg-nevoa p-3.5">
      <p className="text-[11px] tracking-wider text-cinza-claro uppercase">{rotulo}</p>
      <p
        className={cn(
          "font-display mt-1.5 font-extrabold tabular-nums text-tinta",
          destaque ? "text-xl" : "text-base",
        )}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-[11px] text-cinza-claro">{nota}</p>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  Icone,
}: {
  rotulo: string;
  valor: string;
  Icone: typeof CalendarDays;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-cinza">
        <Icone className="size-3.5 text-cinza-claro" />
        {rotulo}
      </dt>
      <dd className="text-sm font-medium text-tinta">{valor}</dd>
    </div>
  );
}

export { TOM, ROTULO_STATUS, corSaude };

/** Só os dígitos, com o 55 na frente: é o formato que o wa.me aceita. */
function paraWhatsApp(telefone: string) {
  const so = telefone.replace(/\D/g, "");
  if (!so) return null;
  return so.startsWith("55") ? so : `55${so}`;
}

type ItemContato = {
  chave: string;
  Icone: typeof Mail;
  rotulo: string;
  texto: string;
  href: string | null;
  externo: boolean;
  tom: string;
};

/**
 * Contato e presença da conta, cada um a um toque de distância.
 *
 * Antes eram dois botões — "Site" e o usuário do Instagram — e nada de
 * telefone ou e-mail: quem precisava falar com o cliente saía da ficha,
 * abria a agenda e procurava. O contato estava no banco desde a
 * importação da planilha; era a carteira que não o carregava.
 *
 * Cada linha faz a coisa óbvia ao ser clicada: o WhatsApp abre a conversa,
 * o e-mail abre o programa de e-mail, o telefone disca. O botão de copiar
 * existe para quando a pessoa está no computador e vai usar o número no
 * celular.
 */
function Contato({ cliente }: { cliente: ClienteCarteira }) {
  const telefone = cliente.contato?.telefone ?? null;
  const zap = telefone ? paraWhatsApp(telefone) : null;
  const email = cliente.contato?.email ?? null;
  const instagram = cliente.instagram ? cliente.instagram.replace(/^@/, "") : null;

  const itens: ItemContato[] = [];

  if (zap && telefone) {
    itens.push({
      chave: "zap",
      Icone: MessageCircle,
      rotulo: "WhatsApp",
      texto: telefone,
      href: `https://wa.me/${zap}`,
      externo: true,
      tom: "text-sucesso",
    });
  }
  if (email) {
    itens.push({
      chave: "email",
      Icone: Mail,
      rotulo: "E-mail",
      texto: email,
      href: `mailto:${email}`,
      externo: false,
      tom: "text-acento",
    });
  }
  if (telefone) {
    itens.push({
      chave: "tel",
      Icone: Phone,
      rotulo: "Telefone",
      texto: telefone,
      href: `tel:${telefone.replace(/\D/g, "")}`,
      externo: false,
      tom: "text-cinza",
    });
  }
  if (instagram) {
    itens.push({
      chave: "insta",
      Icone: Instagram,
      rotulo: "Instagram",
      texto: `@${instagram}`,
      href: `https://instagram.com/${instagram}`,
      externo: true,
      tom: "text-perigo",
    });
  }
  if (cliente.site) {
    itens.push({
      chave: "site",
      Icone: Globe,
      rotulo: "Site",
      texto: cliente.site.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: cliente.site,
      externo: true,
      tom: "text-acento",
    });
  }
  if (cliente.documento) {
    itens.push({
      chave: "doc",
      Icone: IdCard,
      rotulo: "CNPJ / CPF",
      texto: cliente.documento,
      href: null,
      externo: false,
      tom: "text-cinza",
    });
  }

  return (
    <section>
      <Titulo>Contato</Titulo>

      {cliente.contato && (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-borda bg-nevoa px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-acento/12 text-sm font-semibold text-acento">
            {iniciais(cliente.contato.nome)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-tinta">{cliente.contato.nome}</p>
            <p className="truncate text-xs text-cinza">
              {cliente.contato.cargo ?? "Contato principal"}
            </p>
          </div>
        </div>
      )}

      {itens.length > 0 ? (
        <ul className="mt-2 divide-y divide-borda-fraca overflow-hidden rounded-md border border-borda">
          {itens.map((i) => (
            <li key={i.chave} className="group flex items-center gap-3 bg-carta px-4 py-2.5">
              <i.Icone className={cn("size-4 shrink-0", i.tom)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-cinza">{i.rotulo}</p>
                {i.href ? (
                  <a
                    href={i.href}
                    {...(i.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="foco-anel block truncate text-sm font-medium text-tinta hover:text-acento hover:underline"
                  >
                    {i.texto}
                  </a>
                ) : (
                  <p className="truncate text-sm font-medium text-tinta">{i.texto}</p>
                )}
              </div>
              <BotaoCopiar texto={i.texto} rotulo={i.rotulo} />
              {i.externo && i.href && (
                <ExternalLink className="size-3.5 shrink-0 text-cinza-claro" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-borda p-3.5 text-sm text-cinza">
          Nenhum contato cadastrado nesta conta. Edite a ficha para adicionar.
        </p>
      )}
    </section>
  );
}

function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Copiar ${rotulo.toLowerCase()}`}
      title="Copiar"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          toast.success(`${rotulo} copiado.`);
          setTimeout(() => setCopiado(false), 1500);
        } catch {
          /* A área de transferência é bloqueada fora de HTTPS e sob algumas
             políticas de navegador. Falhar calado seria pior. */
          toast.error("O navegador não liberou a área de transferência.");
        }
      }}
      className={cn(
        "foco-anel shrink-0 rounded-sm p-1.5 transition-colors",
        copiado
          ? "text-sucesso"
          : "text-cinza-claro opacity-0 hover:text-tinta group-hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      <Copy className="size-3.5" />
    </button>
  );
}
