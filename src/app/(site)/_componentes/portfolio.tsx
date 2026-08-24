import Image from "next/image";
import { Secao, CabecaSecao } from "./secao";

type Projeto = {
  arquivo: string;
  nome: string;
  segmento: string;
  tipo: string;
  /** Altura real da captura (largura é sempre 768) — evita salto de layout. */
  altura: number;
};

/** Sites e páginas entregues pela MR Grow. Capturas em `public/portfolio`. */
const PROJETOS: Projeto[] = [
  { arquivo: "manalinda-fitness", nome: "Mana Linda Fitness", segmento: "Moda fitness", tipo: "E-commerce", altura: 3045 },
  { arquivo: "casalinda", nome: "Casa Linda", segmento: "Casa e decoração", tipo: "E-commerce", altura: 3526 },
  { arquivo: "sneakpeak", nome: "SneakPeak", segmento: "Sneakers", tipo: "E-commerce", altura: 1350 },
  { arquivo: "doris-kids", nome: "Doris Kids", segmento: "Moda infantil", tipo: "E-commerce", altura: 2467 },
  { arquivo: "criativae", nome: "Criativa E", segmento: "Comunicação visual", tipo: "Institucional", altura: 6337 },
  { arquivo: "md-print-solutions", nome: "MD Print Solutions", segmento: "Equipamentos gráficos", tipo: "Institucional", altura: 4029 },
  { arquivo: "md-print-gtx-pro", nome: "MD Print · GTX Pro", segmento: "Equipamentos gráficos", tipo: "Produto", altura: 2292 },
  { arquivo: "pro-pay", nome: "Pro Pay", segmento: "Meios de pagamento", tipo: "Institucional", altura: 5049 },
  { arquivo: "guardpay", nome: "GuardPay", segmento: "Meios de pagamento", tipo: "Landing page", altura: 2173 },
  { arquivo: "soluth-contabilidade", nome: "Soluth Contabilidade", segmento: "Contabilidade", tipo: "Institucional", altura: 3701 },
  { arquivo: "nutricionista-gabriel-oliani", nome: "Gabriel Oliani", segmento: "Nutrição", tipo: "Captação", altura: 3249 },
  { arquivo: "chale-vale-das-aguas", nome: "Chalé Vale das Águas", segmento: "Hospedagem", tipo: "Reservas", altura: 4483 },
];

export function Portfolio() {
  return (
    <Secao id="trabalho">
      <CabecaSecao
        chapeu="Trabalho"
        titulo="Páginas feitas para vender, não para enfeitar"
        apoio="Todo site que entregamos nasce com rastreamento, velocidade e um caminho claro até a compra ou o contato. Passe o mouse para percorrer a página inteira."
      />

      <div className="obras espaco">
        {PROJETOS.map((p) => (
          <figure className="obra" key={p.arquivo}>
            <div className="obra__quadro">
              <Image
                src={`/portfolio/${p.arquivo}.webp`}
                alt={`Site desenvolvido para ${p.nome}`}
                width={768}
                height={p.altura}
                sizes="(max-width: 768px) 100vw, (max-width: 1216px) 50vw, 400px"
              />
            </div>
            <figcaption className="obra__pe">
              <div>
                <p className="obra__nome">{p.nome}</p>
                <p className="obra__seg">{p.segmento}</p>
              </div>
              <span className="obra__tipo">{p.tipo}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Secao>
  );
}
