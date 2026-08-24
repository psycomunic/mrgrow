import { Cabecalho } from "./_componentes/cabecalho";
import { Rodape } from "./_componentes/rodape";
import { AcoesFlutuantes } from "./_componentes/acoes-flutuantes";
import { Rastreadores } from "@/components/site/rastreadores";

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Rastreadores />
      <Cabecalho />
      <main>{children}</main>
      <Rodape />
      <AcoesFlutuantes />
    </>
  );
}
