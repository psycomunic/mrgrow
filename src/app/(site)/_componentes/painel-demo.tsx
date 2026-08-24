import { TrendingUp } from "lucide-react";

const SERIE = [22, 30, 27, 41, 38, 52, 49, 63, 58, 74, 81, 96];

/** Mock visual do painel MR Grow — prova de que a operação é transparente. */
export function PainelDemo() {
  const maximo = Math.max(...SERIE);

  return (
    <div className="animate-flutuar relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-mrg-500/25 via-transparent to-transparent blur-2xl"
      />

      <div className="cartao-vidro overflow-hidden rounded-xl">
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <span className="size-2.5 rounded-full bg-perigo/70" />
          <span className="size-2.5 rounded-full bg-alerta/70" />
          <span className="size-2.5 rounded-full bg-sucesso/70" />
          <span className="ml-3 text-xs text-ink-400">painel.mrgrow.com.br</span>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-ink-400">Faturamento atribuído · últimos 30 dias</p>
              <p className="font-display text-3xl font-extrabold text-white">R$ 487.320</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sucesso/15 px-2.5 py-1 text-xs font-semibold text-sucesso ring-1 ring-inset ring-sucesso/30">
              <TrendingUp className="size-3.5" /> +38,4%
            </span>
          </div>

          <div className="flex h-32 items-end gap-1.5" aria-hidden>
            {SERIE.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-mrg-700/40 to-mrg-400"
                style={{ height: `${(v / maximo) * 100}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { r: "Investimento", v: "R$ 103.900" },
              { r: "ROAS", v: "4,69x" },
              { r: "CPL", v: "R$ 11,40" },
            ].map((m) => (
              <div key={m.r} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[11px] text-ink-400">{m.r}</p>
                <p className="mt-0.5 text-sm font-bold text-white">{m.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
