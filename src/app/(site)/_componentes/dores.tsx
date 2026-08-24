import { Secao, CabecaSecao } from "./secao";

/** Itens de uma auditoria, não etapas — por isso não são numerados. */
const AUDITORIA = [
  {
    titulo: "Você investe e não sabe o que voltou",
    texto:
      "O relatório mostra alcance, curtida e “engajamento”. Nenhum deles paga o boleto do dia 10.",
  },
  {
    titulo: "Rastreamento quebrado",
    texto:
      "Pixel mal configurado, eventos duplicados, iOS cortando dados. A plataforma otimiza no escuro.",
  },
  {
    titulo: "Criativo sempre o mesmo",
    texto: "Duas artes por mês não sustentam escala. Sem volume de teste, o CPA só sobe.",
  },
  {
    titulo: "Resposta lenta ao lead",
    texto:
      "Lead que espera uma hora vale muito menos. Sem processo, o comercial perde o que a mídia trouxe.",
  },
  {
    titulo: "Página que não converte",
    texto: "Tráfego bom em página ruim é dinheiro queimado. A conversão começa antes do clique.",
  },
  {
    titulo: "Agência que some",
    texto: "Você descobre que a campanha parou quando o faturamento cai. Não deveria ser assim.",
  },
];

export function Dores() {
  return (
    <Secao id="diagnostico-dores">
      <CabecaSecao
        chapeu="Diagnóstico"
        titulo="Se dois destes itens são a sua rotina, o problema não é a verba"
        apoio="É a estrutura. E estrutura é o que a gente monta antes de subir qualquer campanha."
      />

      <div className="auditoria espaco">
        {AUDITORIA.map((d) => (
          <article className="item vidro" key={d.titulo}>
            <span className="item__marca" aria-hidden />
            <h3 className="item__titulo">{d.titulo}</h3>
            <p className="item__texto">{d.texto}</p>
          </article>
        ))}
      </div>
    </Secao>
  );
}
