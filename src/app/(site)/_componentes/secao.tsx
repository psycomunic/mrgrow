import { Revelar } from "./revelar";

/**
 * Toda seção abre igual: chapéu e título à esquerda, apoio à direita.
 * É a régua que dá unidade sem precisar de moldura.
 */
export function Secao({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <Revelar como="section" id={id} className="secao">
      <div className="area">{children}</div>
    </Revelar>
  );
}

export function CabecaSecao({
  chapeu,
  titulo,
  apoio,
  antes,
  /** `grande` para as seções que carregam o argumento; `media` para as de apoio. */
  peso = "media",
}: {
  chapeu: string;
  titulo: React.ReactNode;
  apoio?: string;
  antes?: React.ReactNode;
  peso?: "grande" | "media";
}) {
  return (
    <div className="secao__cabeca">
      <div>
        {antes}
        <span className="chapeu">
          <i />
          {chapeu}
        </span>
        <h2 className={peso === "grande" ? "titulo--grande" : undefined}>{titulo}</h2>
      </div>
      {apoio && <p className="secao__apoio">{apoio}</p>}
    </div>
  );
}
