/** Formata em pt-BR sem depender do ICU do runtime. */
function moeda(valor: number) {
  const milhar = String(Math.floor(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${milhar},00`;
}

const INVESTIDO = 103_900;
const FATURADO = 487_320;

/**
 * A assinatura da página: a conta aberta.
 * Sem animação de propósito — o número é o argumento, e ele não pode
 * depender de JavaScript para existir.
 */
export function Extrato() {
  const retorno = FATURADO - INVESTIDO;
  const multiplo = (FATURADO / INVESTIDO).toFixed(2).replace(".", ",");

  const APURACAO = [
    { r: "ROAS", v: `${multiplo}×` },
    { r: "Custo por lead", v: "R$ 11,40" },
    { r: "Leads no período", v: "9.114" },
  ];

  return (
    <figure className="extrato entra entra--3">
      <figcaption className="extrato__cabeca">
        <span>Extrato da conta</span>
        <span className="extrato__periodo">Últimos 30 dias</span>
      </figcaption>

      <div className="extrato__corpo">
        <div className="lancamento lancamento--saida">
          <span className="lancamento__nome">Investido em mídia</span>
          <span className="lancamento__valor">&minus;&nbsp;{moeda(INVESTIDO)}</span>
        </div>

        <div className="lancamento">
          <span className="lancamento__nome">Faturamento atribuído</span>
          <span className="lancamento__valor">+&nbsp;{moeda(FATURADO)}</span>
        </div>

        <div className="saldo">
          <span className="rotulo">O que sobrou depois da mídia paga</span>
          <span className="saldo__valor">{moeda(retorno)}</span>
        </div>

        <dl className="apuracao">
          {APURACAO.map((m) => (
            <div key={m.r}>
              <dt>{m.r}</dt>
              <dd>{m.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="extrato__rodape">
        Recorte de uma conta em operação. O seu painel abre do mesmo jeito, com os seus números,
        atualizado todo dia — e você entra nele com o mesmo login.
      </p>
    </figure>
  );
}
