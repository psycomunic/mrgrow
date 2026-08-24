import { CheckCircle2 } from "lucide-react";
import { FormularioDiagnostico } from "./formulario-diagnostico";

const ENTREGAS = [
  "Auditoria da estrutura de campanhas ativa",
  "Checagem de rastreamento (Pixel, GA4 e conversões)",
  "Análise da página de destino e do fluxo de atendimento",
  "Estimativa de CPA e ROAS possíveis para o seu ticket",
  "Os 3 gargalos que mais custam dinheiro hoje",
];

export function CtaFinal() {
  return (
    <section id="diagnostico" className="relative scroll-mt-20 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_50%_0%,rgba(11,79,209,.25),transparent_70%)]"
      />
      <div className="container-mrg">
        <div className="grid gap-12 lg:grid-cols-[1fr_.9fr] lg:items-start lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-mrg-300 uppercase">
              <span className="block h-px w-4 bg-mrg-500" />
              Diagnóstico gratuito
            </span>
            <h2 className="mt-5 font-display text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
              Descubra o que está <span className="texto-gradiente">travando</span> o seu resultado
              — antes de contratar qualquer um
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-300">
              Nenhuma apresentação genérica. Analisamos a sua conta de verdade e devolvemos um
              parecer objetivo em até 24 horas. Se não fizer sentido trabalharmos juntos, a gente
              diz.
            </p>

            <ul className="mt-8 space-y-3">
              {ENTREGAS.map((e) => (
                <li key={e} className="flex gap-3 text-sm text-ink-200">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-mrg-400" />
                  {e}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-4 rounded-lg border border-white/8 bg-white/[0.03] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sucesso/15 text-sm font-bold text-sucesso">
                24h
              </span>
              <p className="text-sm text-ink-300">
                <strong className="text-white">Resposta garantida em 24 horas úteis.</strong>{" "}
                Atendemos um número limitado de novas contas por mês.
              </p>
            </div>
          </div>

          <FormularioDiagnostico />
        </div>
      </div>
    </section>
  );
}
