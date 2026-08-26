"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Kpi } from "@/components/painel/kpi";
import { brl, numero } from "@/lib/utils";
import { useCrm } from "./contexto";
import { DialogoNegocio } from "./dialogo";

/** KPIs do funil. Vivem no cliente para acompanharem o quadro em tempo real. */
export function Indicadores() {
  const { negocios, etapas } = useCrm();

  const total = negocios.reduce((s, n) => s + n.valor_mensal, 0);
  const quentes = negocios.filter((n) => n.temperatura === "quente").length;

  // Média ponderada pela probabilidade da etapa: o pipeline que a agência
  // pode de fato esperar, não a soma bruta.
  const ponderado = negocios.reduce((s, n) => {
    const etapa = etapas.find((e) => e.id === n.etapa_id);
    return s + n.valor_mensal * ((etapa?.probabilidade ?? 0) / 100);
  }, 0);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi rotulo="Negócios abertos" valor={numero(negocios.length)} detalhe="no funil comercial" />
      <Kpi rotulo="Valor do pipeline" valor={brl(total)} detalhe="recorrente mensal" />
      <Kpi
        rotulo="Previsão ponderada"
        valor={brl(ponderado)}
        detalhe="pela probabilidade da etapa"
      />
      <Kpi rotulo="Oportunidades quentes" valor={numero(quentes)} detalhe="prioridade de contato" />
    </section>
  );
}

/** Botão do topo da página. Fica no contexto para o cartão novo entrar no quadro. */
export function AcaoNovoNegocio() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Botao tamanho="sm" onClick={() => setAberto(true)}>
        <Plus className="size-4" />
        Novo negócio
      </Botao>
      {aberto && <DialogoNegocio aoFechar={() => setAberto(false)} />}
    </>
  );
}
