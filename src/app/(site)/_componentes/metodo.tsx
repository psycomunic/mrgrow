import Image from "next/image";
import { Secao, TituloSecao } from "./secao";

const PILARES = [
  {
    letra: "G",
    titulo: "Ground · Fundação",
    resumo: "Antes de gastar o primeiro real",
    itens: [
      "Diagnóstico de conta, oferta e margem",
      "Rastreamento completo: GA4, GTM, Pixel e API de Conversões",
      "Definição de CPA e ROAS alvo a partir da sua margem real",
      "Página e fluxo de atendimento revisados",
    ],
  },
  {
    letra: "R",
    titulo: "Reach · Aquisição",
    resumo: "Estrutura de campanha que escala",
    itens: [
      "Arquitetura de campanhas por temperatura de público",
      "Meta Ads e Google Ads trabalhando juntos, não competindo",
      "Volume real de criativos em teste toda semana",
      "Controle diário de orçamento e curva de aprendizagem",
    ],
  },
  {
    letra: "O",
    titulo: "Optimize · Otimização",
    resumo: "Decisão por dado, não por achismo",
    itens: [
      "Rotina diária de leitura de conta",
      "Matriz de criativos: ângulo × formato × oferta",
      "Testes A/B de página com meta de conversão declarada",
      "Corte rápido do que não performa, escala do que performa",
    ],
  },
  {
    letra: "W",
    titulo: "Win · Previsibilidade",
    resumo: "Do lead ao caixa",
    itens: [
      "CRM com funil, follow-up e SLA de resposta",
      "Painel ao vivo com investimento, retorno e projeção",
      "Reunião de performance quinzenal com plano de ação",
      "Metas mensais acordadas e acompanhadas",
    ],
  },
];

export function Metodo() {
  return (
    <Secao id="metodo" className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 h-96 bg-[radial-gradient(50rem_20rem_at_50%_50%,rgba(11,79,209,.16),transparent_70%)]"
      />

      <div className="mb-8 flex justify-center">
        <Image
          src="/marca/grow-roda.webp"
          alt="Roda do método G.R.O.W: Ground, Reach, Optimize e Win"
          width={720}
          height={720}
          sizes="140px"
          className="size-28 drop-shadow-[0_12px_32px_rgba(22,104,245,.35)] sm:size-32"
        />
      </div>

      <TituloSecao
        sobre="Método G.R.O.W"
        titulo={
          <>
            Quatro etapas para sair do <span className="texto-gradiente">imprevisível</span>
          </>
        }
        descricao="Nada de fórmula mágica. É processo — o mesmo que roda em todas as contas da MR Grow, com responsável, prazo e indicador em cada etapa."
      />

      <div className="mt-16 grid gap-5 lg:grid-cols-2">
        {PILARES.map((p, i) => (
          <div key={p.letra} className="cartao-vidro relative overflow-hidden rounded-xl p-7">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-6 -right-2 font-display text-[7rem] leading-none font-extrabold text-white/[0.035]"
            >
              {p.letra}
            </span>

            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-mrg-400 to-mrg-700 font-display text-xl font-extrabold text-white">
                {p.letra}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-white">{p.titulo}</h3>
                <p className="text-sm text-mrg-300">{p.resumo}</p>
              </div>
            </div>

            <ul className="mt-6 space-y-2.5">
              {p.itens.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink-200">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-mrg-400" />
                  {item}
                </li>
              ))}
            </ul>

            <span className="mt-6 block text-xs font-semibold tracking-wider text-ink-500 uppercase">
              Etapa {i + 1} de 4
            </span>
          </div>
        ))}
      </div>
    </Secao>
  );
}
