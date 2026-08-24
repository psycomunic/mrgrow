import Link from "next/link";
import { MARCA, linkWhatsApp } from "@/lib/marca";
import { Lampada } from "./cabecalho";

const COLUNAS = [
  {
    titulo: "Serviços",
    links: [
      { r: "Gestão de tráfego", h: "#servicos" },
      { r: "Landing pages", h: "#servicos" },
      { r: "Criativos", h: "#servicos" },
      { r: "Rastreamento e dados", h: "#servicos" },
    ],
  },
  {
    titulo: "A agência",
    links: [
      { r: "Método G.R.O.W", h: "#metodo" },
      { r: "Resultados", h: "#resultados" },
      { r: "Trabalho", h: "#portfolio" },
      { r: "Sobre o fundador", h: "#sobre" },
      { r: "Planos", h: "#planos" },
    ],
  },
  {
    titulo: "Acesso",
    links: [
      { r: "Área do cliente", h: "/entrar" },
      { r: "Painel da agência", h: "/painel" },
      { r: "Dúvidas frequentes", h: "#faq" },
    ],
  },
];

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="limite">
        <div className="rodape__grade">
          <div>
            <Link href="/" className="rodape__marca">
              <Lampada altura={2} />
              <span className="topo__nome">MR Grow</span>
            </Link>
            <p className="rodape__descricao">{MARCA.descricao}</p>

            <div className="rodape__contatos">
              <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <a href={MARCA.instagramAgencia} target="_blank" rel="noopener noreferrer">
                @mrgrow.ag
              </a>
              <a href={`mailto:${MARCA.email}`}>{MARCA.email}</a>
            </div>
          </div>

          <div className="rodape__colunas">
            {COLUNAS.map((c) => (
              <div key={c.titulo}>
                <h3>{c.titulo}</h3>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.r}>
                      <Link href={l.h}>{l.r}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rodape__base">
          <p>
            © {new Date().getFullYear()} {MARCA.nome}. Todos os direitos reservados.
          </p>
          <p>
            Este site não é afiliado ao Facebook, Meta Platforms ou Google. Resultados variam
            conforme segmento, oferta e investimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
