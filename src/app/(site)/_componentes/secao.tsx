/**
 * Toda seção abre igual: etiqueta e título à esquerda, apoio à direita.
 * É a régua que dá unidade à página sem precisar de moldura.
 */
export function Secao({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="secao">
      <div className="limite">{children}</div>
    </section>
  );
}

export function CabecaSecao({
  etiqueta,
  titulo,
  apoio,
  antes,
}: {
  etiqueta: string;
  titulo: React.ReactNode;
  apoio?: string;
  /** Conteúdo opcional acima da etiqueta — a roda do G.R.O.W, por exemplo. */
  antes?: React.ReactNode;
}) {
  return (
    <div className="secao__cabeca">
      <div>
        {antes}
        <span className="etiqueta">{etiqueta}</span>
        <h2>{titulo}</h2>
      </div>
      {apoio && <p className="secao__apoio">{apoio}</p>}
    </div>
  );
}
