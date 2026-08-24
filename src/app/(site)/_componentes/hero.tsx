import { ArrowRight, ShieldCheck } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";
import { linkWhatsApp } from "@/lib/marca";
import { PainelDemo } from "./painel-demo";

const PROVAS = [
  { valor: "R$ 18M+", rotulo: "gerenciados em mídia" },
  { valor: "4,7x", rotulo: "ROAS médio das contas" },
  { valor: "92%", rotulo: "de retenção de clientes" },
  { valor: "48h", rotulo: "para colocar no ar" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div aria-hidden className="malha-fundo pointer-events-none absolute inset-0 -z-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[46rem] -translate-x-1/2 rounded-full bg-mrg-600/20 blur-[140px]"
      />

      <div className="container-mrg">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-10">
          <div className="animate-surgir">
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold text-mrg-300">
              <span className="block h-3.5 w-0.5 rounded-full bg-mrg-400" />
              Assessoria de performance · vagas limitadas por mês
            </span>

            <h1 className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Seu anúncio não precisa de <span className="texto-gradiente">mais alcance</span>.
              <br className="hidden sm:block" /> Precisa de{" "}
              <span className="texto-gradiente">mais vendas</span>.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300 text-pretty">
              A MR Grow constrói a estrutura completa que transforma investimento em anúncios em
              faturamento previsível: tráfego, criativo, página, rastreamento e um painel onde você
              acompanha cada real investido — em tempo real.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <BotaoLink href="#diagnostico" tamanho="xl" className="group">
                Quero meu diagnóstico gratuito
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </BotaoLink>
              <BotaoLink href={linkWhatsApp()} externo variante="contorno" tamanho="xl">
                Falar com um especialista
              </BotaoLink>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-ink-400">
              <ShieldCheck className="size-4 text-mrg-400" />
              Análise gratuita da sua conta em até 24h · sem compromisso · sem robô do outro lado
            </p>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/10 pt-8 sm:grid-cols-4">
              {PROVAS.map((p) => (
                <div key={p.rotulo}>
                  <dt className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {p.valor}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-ink-400">{p.rotulo}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:pl-4">
            <PainelDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
