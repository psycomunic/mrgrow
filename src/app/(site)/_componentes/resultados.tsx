import { Secao, TituloSecao } from "./secao";

const CASES = [
  {
    segmento: "E-commerce de moda",
    destaque: "R$ 1,00 → R$ 6,20",
    metrica: "ROAS em 90 dias",
    contexto: "Reestruturação de campanhas + API de Conversões + 24 criativos testados por mês.",
    antes: "ROAS 2,1x",
    depois: "ROAS 6,2x",
  },
  {
    segmento: "Clínica de estética",
    destaque: "−63%",
    metrica: "no custo por agendamento",
    contexto: "Nova landing page, formulário curto e SLA de 10 minutos para o primeiro contato.",
    antes: "R$ 84 por lead",
    depois: "R$ 31 por lead",
  },
  {
    segmento: "Serviço local B2B",
    destaque: "3,4x",
    metrica: "mais orçamentos fechados",
    contexto: "Google Ads Search com intenção alta + CRM com follow-up automatizado.",
    antes: "18 fechamentos/mês",
    depois: "61 fechamentos/mês",
  },
];

const DEPOIMENTOS = [
  {
    texto:
      "A diferença foi parar de olhar para métrica bonita e passar a olhar para faturamento. Em dois meses a operação virou outra coisa.",
    iniciais: "L.M.",
    papel: "Sócio-fundador · E-commerce",
  },
  {
    texto:
      "O que mais me pegou foi a transparência. Eu abro o painel e vejo exatamente onde o dinheiro está indo e o que ele trouxe de volta.",
    iniciais: "C.A.",
    papel: "Diretora de marketing · Serviços",
  },
];

export function Resultados() {
  return (
    <Secao id="resultados" className="relative">
      <TituloSecao
        sobre="Resultados"
        titulo={
          <>
            O que muda quando a estrutura <span className="texto-gradiente">está certa</span>
          </>
        }
        descricao="Recortes reais de operação. Os números variam por segmento, oferta e verba — e a gente diz isso na primeira conversa."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {CASES.map((c, i) => (
          <div
            key={c.segmento}
            className={`cartao-vidro rounded-xl p-7 ${i === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}
          >
            <p className="text-[11px] font-bold tracking-[0.12em] text-mrg-300 uppercase">
              {c.segmento}
            </p>
            <p className="mt-4 font-display text-5xl leading-none font-extrabold text-white">
              {c.destaque}
            </p>
            <p className="mt-2 text-sm text-ink-400">{c.metrica}</p>
            <p className="mt-5 text-sm leading-relaxed text-ink-300">{c.contexto}</p>
            <div className="mt-6 flex items-center gap-3 border-t border-white/8 pt-5 text-xs">
              <span className="rounded-sm bg-white/5 px-2.5 py-1 text-ink-400">
                Antes: {c.antes}
              </span>
              <span className="rounded-sm bg-sucesso/15 px-2.5 py-1 font-semibold text-sucesso">
                Depois: {c.depois}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {DEPOIMENTOS.map((d) => (
          <figure key={d.iniciais} className="cartao-vidro rounded-xl p-7">
            <blockquote className="text-base leading-relaxed text-ink-100 text-pretty">
              <span className="mr-1 font-bold text-mrg-400">&ldquo;</span>
              {d.texto}
              <span className="ml-1 font-bold text-mrg-400">&rdquo;</span>
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 text-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mrg-500/15 text-xs font-bold text-mrg-300">
                {d.iniciais}
              </span>
              <span className="text-ink-400">{d.papel}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Secao>
  );
}
