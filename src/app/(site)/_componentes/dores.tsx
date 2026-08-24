import { Secao, TituloSecao } from "./secao";

const DORES = [
  {
    numero: "01",
    titulo: "Você investe e não sabe o que voltou",
    texto:
      "O relatório mostra alcance, curtida e “engajamento”. Nenhum deles paga o boleto do dia 10.",
  },
  {
    numero: "02",
    titulo: "Rastreamento quebrado",
    texto:
      "Pixel mal configurado, eventos duplicados, iOS cortando dados. A plataforma otimiza no escuro.",
  },
  {
    numero: "03",
    titulo: "Criativo sempre o mesmo",
    texto: "Duas artes por mês não sustentam escala. Sem volume de teste, o CPA só sobe.",
  },
  {
    numero: "04",
    titulo: "Resposta lenta ao lead",
    texto:
      "Lead que espera 1 hora vale 7x menos. Sem processo, o comercial perde o que a mídia trouxe.",
  },
  {
    numero: "05",
    titulo: "Página que não converte",
    texto: "Tráfego bom em página ruim é dinheiro queimado. A conversão começa antes do clique.",
  },
  {
    numero: "06",
    titulo: "Agência que some",
    texto: "Você descobre que a campanha parou quando o faturamento cai. Não deveria ser assim.",
  },
];

export function Dores() {
  return (
    <Secao id="dores">
      <TituloSecao
        sobre="O diagnóstico honesto"
        titulo={
          <>
            Se você se reconhece em <span className="texto-gradiente">dois ou mais</span> destes
            pontos, o problema não é o valor investido
          </>
        }
        descricao="É a estrutura. E estrutura é exatamente o que a gente monta antes de subir qualquer campanha."
      />

      <div className="mt-14 grid gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
        {DORES.map(({ numero, titulo, texto }) => (
          <div
            key={numero}
            className="group relative bg-ink-950 p-7 transition-colors duration-200 hover:bg-ink-900"
          >
            <span className="font-display text-[2.5rem] leading-none font-extrabold text-white/[0.06] select-none">
              {numero}
            </span>
            <h3 className="mt-3 font-display text-base leading-snug font-bold text-white">
              {titulo}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">{texto}</p>
            <span className="absolute bottom-0 left-0 h-px w-0 bg-mrg-500 transition-all duration-300 group-hover:w-full" />
          </div>
        ))}
      </div>
    </Secao>
  );
}
