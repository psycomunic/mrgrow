import type { Metadata } from "next";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Tabela, Cabecalhos, Linha, Celula, CelulaTexto, Vazio } from "@/components/painel/tabela";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { Kpi } from "@/components/painel/kpi";
import { carregarFinanceiro } from "@/lib/financeiro";
import { STATUS_LANCAMENTO } from "@/lib/rotulos";
import { hoje } from "@/lib/tempo";
import { brl, dataCompleta } from "@/lib/utils";

export const metadata: Metadata = { title: "Faturas" };

export default async function PaginaFaturasCliente() {
  const { lancamentos, demo } = await carregarFinanceiro();

  /* Despesa da agência não é assunto do cliente. A RLS já barra isso com o
     banco ligado (`lancamentos_ler` só libera receita ao cliente); o filtro
     aqui é o que garante o mesmo em modo demonstração. */
  const faturas = lancamentos
    .filter((l) => l.tipo === "receita")
    .sort((a, b) => b.vencimento.localeCompare(a.vencimento));

  const dia = hoje();
  const emAberto = faturas
    .filter((l) => ["pendente", "previsto", "atrasado"].includes(l.status))
    .reduce((s, l) => s + l.valor, 0);
  const pagoNoAno = faturas
    .filter((l) => l.status === "pago" && l.vencimento.startsWith(dia.slice(0, 4)))
    .reduce((s, l) => s + l.valor, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-tinta">Suas faturas</h1>
        <p className="mt-1 text-sm text-cinza">
          Histórico de cobranças e o que está em aberto. Dúvida em alguma? Fale com a gente.
        </p>
      </div>

      {demo && <AvisoDemo />}

      <section className="grid gap-4 sm:grid-cols-2">
        <Kpi rotulo="Em aberto" valor={brl(emAberto)} detalhe="a vencer e vencidas" />
        <Kpi rotulo="Pago no ano" valor={brl(pagoNoAno)} tom="menta" detalhe="faturas liquidadas" />
      </section>

      {faturas.length ? (
        <Tabela larguraMinima="34rem">
          <Cabecalhos colunas={["Descrição", "Vencimento", "Valor", "Situação"]} />
          <tbody>
            {faturas.map((l) => {
              const atrasada = l.status === "atrasado" || (l.status === "pendente" && l.vencimento < dia);
              return (
                <Linha key={l.id}>
                  <CelulaTexto largura="20rem" className="text-tinta" titulo={l.descricao}>
                    {l.descricao}
                  </CelulaTexto>
                  <Celula className="tabular-nums whitespace-nowrap text-cinza">
                    {dataCompleta(l.vencimento)}
                  </Celula>
                  <Celula className="font-medium tabular-nums whitespace-nowrap text-tinta">
                    {brl(l.valor)}
                  </Celula>
                  <Celula>
                    <Etiqueta tom={atrasada ? "perigo" : STATUS_LANCAMENTO.tom(l.status)}>
                      {atrasada ? "Vencida" : STATUS_LANCAMENTO.rotulo(l.status)}
                    </Etiqueta>
                  </Celula>
                </Linha>
              );
            })}
          </tbody>
        </Tabela>
      ) : (
        <Vazio mensagem="Nenhuma fatura registrada até agora." />
      )}
    </div>
  );
}
