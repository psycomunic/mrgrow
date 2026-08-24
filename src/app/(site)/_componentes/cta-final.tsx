import { FormularioDiagnostico } from "./formulario-diagnostico";

const ENTREGAS = [
  "Auditoria da estrutura de campanhas ativa",
  "Checagem de rastreamento: Pixel, GA4 e conversões",
  "Análise da página de destino e do fluxo de atendimento",
  "Estimativa de CPA e ROAS possíveis para o seu ticket",
  "Os três gargalos que mais custam dinheiro hoje",
];

export function CtaFinal() {
  return (
    <section className="fecho" id="diagnostico">
      <div className="area fecho__grade">
        <div>
          <span className="chapeu">
            <i />
            Diagnóstico gratuito
          </span>
          <h2>Descubra o que está travando o seu resultado</h2>
          <p className="fecho__texto">
            Nenhuma apresentação genérica. Analisamos a sua conta de verdade e devolvemos um
            parecer objetivo. Se não fizer sentido trabalharmos juntos, a gente diz.
          </p>

          <ul className="entregas">
            {ENTREGAS.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>

          <div className="prazo vidro">
            <strong>24h</strong>
            <p>
              Resposta garantida em 24 horas úteis. Atendemos um número limitado de contas novas
              por mês.
            </p>
          </div>
        </div>

        <FormularioDiagnostico />
      </div>
    </section>
  );
}
