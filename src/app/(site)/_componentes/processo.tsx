import { Secao, CabecaSecao } from "./secao";

/** Aqui a numeração é informação: a ordem importa e cada etapa tem prazo. */
const PASSOS = [
  {
    t: "Diagnóstico gratuito",
    d: "Você preenche o formulário e a gente analisa a sua presença digital, o conteúdo atual e a estrutura de campanhas. Você recebe um parecer com os três gargalos mais caros.",
    prazo: "24 horas",
  },
  {
    t: "Plano e proposta",
    d: "Reunião de 40 minutos com o plano de comunicação, o plano de mídia e o escopo. Você sai sabendo o que será feito, por quem e quanto custa.",
    prazo: "Dia 1",
  },
  {
    t: "Setup e primeiro cronograma",
    d: "Rastreamento configurado, posicionamento fechado e o cronograma do primeiro mês pronto, com os roteiros de vídeo já na sua mão.",
    prazo: "Até 7 dias",
  },
  {
    t: "Operação mensal",
    d: "Conteúdo publicado no calendário, campanhas rodando e ajustadas, relatório no fim do mês e reunião estratégica para definir o mês seguinte.",
    prazo: "Contínuo",
  },
];


export function Processo() {
  return (
    <Secao id="processo">
      <CabecaSecao
        chapeu="Como funciona"
        titulo="Do primeiro contato ao mês rodando"
        apoio="Sem mistério e sem processo interminável. Cada etapa tem entrega e prazo definidos."
      />

      <ol className="passos espaco">
        {PASSOS.map((p) => (
          <li className="passo vidro" key={p.t}>
            <h3>{p.t}</h3>
            <p>{p.d}</p>
            <span className="passo__prazo">{p.prazo}</span>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
