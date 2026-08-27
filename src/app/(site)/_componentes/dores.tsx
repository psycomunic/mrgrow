import { Secao, CabecaSecao } from "./secao";

/** Itens de uma auditoria, não etapas, por isso não são numerados. */
const AUDITORIA = [
  {
    titulo: "Posta toda semana e não vende",
    texto:
      "O engajamento até aparece. O faturamento não se mexe. Conteúdo sem intenção comercial entretém, não vende.",
  },
  {
    titulo: "Conteúdo decidido na véspera",
    texto:
      "Sem cronograma, o tema nasce do improviso e a marca fala de coisa diferente toda semana. Ninguém entende o que você faz.",
  },
  {
    titulo: "Você investe e não sabe o que voltou",
    texto:
      "O relatório mostra alcance, curtida e “engajamento”. Nenhum deles paga o boleto do dia 10.",
  },
  {
    titulo: "Trava na hora de gravar",
    texto:
      "Não é falta de câmera, é falta de roteiro. Sem saber o que falar, o vídeo não sai, e sem vídeo o alcance não vem.",
  },
  {
    titulo: "Marketing em três fornecedores",
    texto:
      "Social media de um lado, gestor de tráfego do outro, designer num terceiro. Ninguém se fala e a conta sobra para você.",
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
        peso="grande"
        titulo="Se dois destes itens são a sua rotina, o problema não é a verba"
        apoio="É a falta de estrutura. E estrutura é o que a gente monta antes de publicar qualquer post ou subir qualquer campanha."
      />

      <div className="auditoria espaco">
        {AUDITORIA.map((d) => (
          <article className="item vidro" key={d.titulo}>
            <h3 className="item__titulo">{d.titulo}</h3>
            <p className="item__texto">{d.texto}</p>
          </article>
        ))}
      </div>
    </Secao>
  );
}
