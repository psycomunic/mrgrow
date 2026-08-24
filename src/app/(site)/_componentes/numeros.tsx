const NUMEROS = [
  { v: "4,69×", r: "de retorno médio sobre o investimento em mídia" },
  { v: "R$ 11,40", r: "de custo por lead na média das contas ativas" },
  { v: "24h", r: "para devolver o diagnóstico da sua conta" },
  { v: "7 dias", r: "do aceite até a campanha no ar" },
];

export function Numeros() {
  return (
    <section className="numeros">
      <div className="limite">
        <div className="numeros__grade">
          {NUMEROS.map((n) => (
            <div className="numero" key={n.r}>
              <span className="numero__valor">{n.v}</span>
              <p className="numero__rotulo">{n.r}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
