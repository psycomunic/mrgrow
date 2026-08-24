/**
 * Toda seção abre igual: chapéu e título à esquerda, apoio à direita.
 * É a régua que dá unidade sem precisar de moldura.
 */
export function Secao({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="secao">
      <div className="area">{children}</div>
    </section>
  );
}

export function CabecaSecao({
  chapeu,
  titulo,
  apoio,
  antes,
}: {
  chapeu: string;
  titulo: React.ReactNode;
  apoio?: string;
  /** Conteúdo acima do chapéu — a roda do G.R.O.W, por exemplo. */
  antes?: React.ReactNode;
}) {
  return (
    <div className="secao__cabeca">
      <div>
        {antes}
        <span className="chapeu">
          <i />
          {chapeu}
        </span>
        <h2>{titulo}</h2>
      </div>
      {apoio && <p className="secao__apoio">{apoio}</p>}
    </div>
  );
}
