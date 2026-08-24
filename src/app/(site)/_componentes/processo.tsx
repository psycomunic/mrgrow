import { Secao, CabecaSecao } from "./secao";

/** Aqui a numeração é informação: a ordem importa e cada etapa tem prazo. */
const PASSOS = [
  {
    t: "Diagnóstico gratuito",
    d: "Você preenche o formulário, a gente analisa sua conta, sua página e seu funil. Você recebe um parecer com os três gargalos mais caros.",
    prazo: "24 horas",
  },
  {
    t: "Plano e proposta",
    d: "Reunião de 40 minutos com o plano de mídia, meta de CPA e ROAS e escopo. Você sai sabendo o que será feito e quanto custa.",
    prazo: "Dia 1",
  },
  {
    t: "Setup e subida",
    d: "Rastreamento, estrutura de campanha, criativos e página. Colocamos no ar após o aceite.",
    prazo: "Até 7 dias",
  },
  {
    t: "Operação e escala",
    d: "Leitura diária, testes semanais, painel aberto e reunião quinzenal de performance com plano de ação.",
    prazo: "Contínuo",
  },
];

export function Processo() {
  return (
    <Secao id="processo">
      <CabecaSecao
        chapeu="Como funciona"
        titulo="Do primeiro contato ao primeiro resultado"
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
