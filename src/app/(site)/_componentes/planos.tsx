import { Check } from "lucide-react";
import { Secao, TituloSecao } from "./secao";
import { BotaoLink } from "@/components/ui/botao";

const PLANOS = [
  {
    nome: "Essencial",
    para: "Para quem está começando a investir com consistência",
    preco: "R$ 2.500",
    ciclo: "/mês",
    itens: [
      "Uma plataforma (Meta ou Google)",
      "Estruturação completa de campanhas",
      "Rastreamento GA4 + Pixel",
      "Até 8 criativos novos por mês",
      "Painel ao vivo",
      "Reunião mensal de performance",
    ],
  },
  {
    nome: "Performance",
    para: "Para quem já investe e quer escalar com previsibilidade",
    preco: "R$ 4.200",
    ciclo: "/mês",
    destaque: true,
    itens: [
      "Meta Ads + Google Ads integrados",
      "API de Conversões e rastreamento server-side",
      "Até 20 criativos novos por mês",
      "Landing page inclusa com testes A/B",
      "CRM com funil e automações",
      "Reunião quinzenal + plano de ação",
      "Suporte prioritário no WhatsApp",
    ],
  },
  {
    nome: "Growth Partner",
    para: "Operação dedicada para contas de alto volume",
    preco: "Sob consulta",
    ciclo: "",
    itens: [
      "Tudo do Performance",
      "Squad dedicado (mídia, criativo e dados)",
      "Produção audiovisual mensal",
      "BI customizado e integrações sob medida",
      "Acompanhamento semanal",
      "Modelo híbrido com variável sobre resultado",
    ],
  },
];

export function Planos() {
  return (
    <Secao id="planos">
      <TituloSecao
        sobre="Planos"
        titulo={
          <>
            Escolha pelo <span className="texto-gradiente">estágio da sua operação</span>
          </>
        }
        descricao="Valores de referência. O escopo final sai do diagnóstico — e a gente só propõe o que faz sentido para a sua margem."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {PLANOS.map((p) => (
          <div
            key={p.nome}
            className={
              p.destaque
                ? "relative rounded-xl border border-mrg-500/50 bg-gradient-to-b from-mrg-500/12 to-transparent p-7 shadow-[0_30px_80px_-40px_rgba(22,104,245,1)]"
                : "cartao-vidro rounded-xl p-7"
            }
          >
            {p.destaque && (
              <p className="mb-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-mrg-300 uppercase">
                <span className="block h-px w-4 bg-mrg-400" />
                Escolhido por quem escala
              </p>
            )}
            <h3 className="font-display text-xl font-bold text-white">{p.nome}</h3>
            <p className="mt-1.5 text-sm text-ink-300">{p.para}</p>

            <p className="mt-6 flex items-end gap-1">
              <span className="font-display text-3xl font-extrabold text-white">{p.preco}</span>
              <span className="pb-1 text-sm text-ink-400">{p.ciclo}</span>
            </p>

            <ul className="mt-6 space-y-2.5">
              {p.itens.map((i) => (
                <li key={i} className="flex gap-2.5 text-sm text-ink-200">
                  <Check className="mt-0.5 size-4 shrink-0 text-mrg-400" />
                  {i}
                </li>
              ))}
            </ul>

            <BotaoLink
              href="#diagnostico"
              largura="cheia"
              variante={p.destaque ? "primario" : "contorno"}
              className="mt-8"
            >
              Solicitar diagnóstico
            </BotaoLink>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink-400">
        O investimento em mídia é pago diretamente por você às plataformas. O fee acima é o da
        assessoria.
      </p>
    </Secao>
  );
}
