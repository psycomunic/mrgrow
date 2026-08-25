import { BorderBeamPanel } from "@/components/ui/border-beam-panel";
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

          <BorderBeamPanel
            radius={0}
            thickness={2}
            beams={1}
            idleSpeed={9}
            hoverSpeed={26}
            colors={["#7fb2ff"]}
            className="prazo-feixe !border-transparent !bg-transparent !p-0"
          >
            <div className="prazo">
              <strong>24h</strong>
              <p>
                Resposta garantida em 24 horas úteis. Atendemos um número limitado de contas
                novas por mês.
              </p>
            </div>
          </BorderBeamPanel>
        </div>

        {/* O feixe fica só aqui: marcar o ponto de conversão é o único
            lugar da página onde esse tipo de destaque se paga. */}
        <BorderBeamPanel
          radius={0}
          thickness={2}
          beams={1}
          idleSpeed={11}
          hoverSpeed={34}
          colors={["#7fb2ff"]}
          className="!border-transparent !bg-transparent !p-0"
        >
          <FormularioDiagnostico />
        </BorderBeamPanel>
      </div>
    </section>
  );
}
