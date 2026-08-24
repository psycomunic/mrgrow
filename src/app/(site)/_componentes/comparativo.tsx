import { Check, X } from "lucide-react";
import { Secao, TituloSecao } from "./secao";

const LINHAS = [
  {
    criterio: "Rastreamento e dados",
    comum: "Pixel instalado e “tá certo”",
    mrgrow: "GA4 + GTM + Pixel + API de Conversões auditados todo mês",
  },
  {
    criterio: "Criativos",
    comum: "2 a 4 artes por mês",
    mrgrow: "Matriz de ângulos com testes semanais e vencedor documentado",
  },
  {
    criterio: "Relatório",
    comum: "PDF no dia 5 do mês seguinte",
    mrgrow: "Painel ao vivo, 24/7, com investimento e retorno por conta",
  },
  {
    criterio: "Página",
    comum: "“Manda o link que a gente anuncia”",
    mrgrow: "Landing page própria, otimizada e testada",
  },
  {
    criterio: "Comercial",
    comum: "Entrega o lead e some",
    mrgrow: "CRM, SLA de resposta e acompanhamento até o fechamento",
  },
  {
    criterio: "Meta",
    comum: "Alcance e engajamento",
    mrgrow: "CPA e ROAS alvo calculados sobre a sua margem",
  },
];

export function Comparativo() {
  return (
    <Secao id="comparativo">
      <TituloSecao
        sobre="A diferença"
        titulo={
          <>
            Agência comum <span className="text-ink-500">×</span>{" "}
            <span className="texto-gradiente">MR Grow</span>
          </>
        }
      />

      <div className="mt-14 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-xs tracking-wider text-ink-400 uppercase">
              <th className="px-5 py-3 font-semibold">Critério</th>
              <th className="px-5 py-3 font-semibold">Agência comum</th>
              <th className="px-5 py-3 font-semibold text-mrg-300">MR Grow</th>
            </tr>
          </thead>
          <tbody>
            {LINHAS.map((l) => (
              <tr
                key={l.criterio}
                className="cartao-vidro [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md"
              >
                <td className="px-5 py-4 text-sm font-semibold text-white">{l.criterio}</td>
                <td className="px-5 py-4 text-sm text-ink-400">
                  <span className="flex items-start gap-2">
                    <X className="mt-0.5 size-4 shrink-0 text-perigo" />
                    {l.comum}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-ink-100">
                  <span className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-sucesso" />
                    {l.mrgrow}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Secao>
  );
}
