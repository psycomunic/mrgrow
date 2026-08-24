import { Secao, TituloSecao } from "./secao";

const PASSOS = [
  {
    n: "01",
    t: "Diagnóstico gratuito",
    d: "Você preenche o formulário, a gente analisa sua conta, sua página e seu funil. Em até 24h você recebe um parecer com os 3 gargalos mais caros.",
    prazo: "24 horas",
  },
  {
    n: "02",
    t: "Plano e proposta",
    d: "Reunião de 40 minutos com o plano de mídia, meta de CPA/ROAS e escopo. Sem enrolação: você sai sabendo o que será feito e quanto custa.",
    prazo: "Dia 1",
  },
  {
    n: "03",
    t: "Setup e subida",
    d: "Rastreamento, estrutura de campanha, criativos e página. Colocamos no ar em até 7 dias úteis após o aceite.",
    prazo: "Até 7 dias",
  },
  {
    n: "04",
    t: "Operação e escala",
    d: "Leitura diária, testes semanais, painel ao vivo e reunião quinzenal de performance com plano de ação.",
    prazo: "Contínuo",
  },
];

export function Processo() {
  return (
    <Secao id="processo">
      <TituloSecao
        sobre="Como funciona"
        titulo={
          <>
            Do primeiro contato ao <span className="texto-gradiente">primeiro resultado</span>
          </>
        }
        descricao="Sem mistério e sem processo interminável. Cada etapa tem entrega e prazo definidos."
      />

      <ol className="mt-16 grid gap-6 lg:grid-cols-4">
        {PASSOS.map((p, i) => (
          <li key={p.n} className="relative">
            {i < PASSOS.length - 1 && (
              <span
                aria-hidden
                className="absolute top-6 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r from-mrg-500/50 to-transparent lg:block"
              />
            )}
            <span className="grid size-12 place-items-center rounded-full border border-mrg-500/30 bg-mrg-500/10 font-display text-sm font-extrabold text-mrg-300">
              {p.n}
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-white">{p.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">{p.d}</p>
            <span className="mt-4 inline-block rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-ink-300">
              {p.prazo}
            </span>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
