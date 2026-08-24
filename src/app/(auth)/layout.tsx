import Link from "next/link";
import { Logo } from "@/app/(site)/_componentes/cabecalho";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <div aria-hidden className="malha-fundo pointer-events-none absolute inset-0 -z-10" />

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <Link href="/" className="mb-10 inline-flex w-fit items-center rounded-sm bg-white px-3 py-2 foco-anel">
          <Logo altura={2.5} />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-white/8 lg:block">
        <div aria-hidden className="grade-fundo absolute inset-0" />
        <div className="relative flex h-full flex-col justify-center p-16">
          <blockquote className="max-w-md font-display text-3xl leading-tight font-extrabold text-balance">
            “Você não precisa confiar na palavra da agência. Você precisa <span className="texto-gradiente">ver os números</span>.”
          </blockquote>
          <p className="mt-6 text-sm text-ink-400">Mateus Rodrigues · fundador da MR Grow</p>

          <dl className="mt-14 grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
            {[
              { v: "Tempo real", r: "Métricas de Meta e Google sincronizadas" },
              { v: "Um lugar só", r: "CRM, financeiro, tarefas e relatórios" },
              { v: "Acesso do cliente", r: "Portal próprio para acompanhar a conta" },
              { v: "Automações", r: "Cobranças, alertas e follow-up no piloto" },
            ].map((i) => (
              <div key={i.v}>
                <dt className="font-display text-lg font-bold text-white">{i.v}</dt>
                <dd className="mt-1 text-sm text-ink-400">{i.r}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
