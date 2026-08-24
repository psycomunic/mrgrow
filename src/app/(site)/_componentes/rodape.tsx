import Link from "next/link";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { MARCA, linkWhatsApp } from "@/lib/marca";
import { Logo } from "./cabecalho";

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
      { r: "Portfólio", h: "#portfolio" },
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
    <footer className="border-t border-white/8 bg-ink-950">
      <div className="container-mrg py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo className="h-10" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">{MARCA.descricao}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-ink-200 transition-colors hover:bg-white/10 foco-anel"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
              <a
                href={MARCA.instagramAgencia}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-ink-200 transition-colors hover:bg-white/10 foco-anel"
              >
                <Instagram className="size-4" /> @mrgrow.ag
              </a>
              <a
                href={`mailto:${MARCA.email}`}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-ink-200 transition-colors hover:bg-white/10 foco-anel"
              >
                <Mail className="size-4" /> {MARCA.email}
              </a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUNAS.map((c) => (
              <div key={c.titulo}>
                <h3 className="text-xs font-bold tracking-[0.14em] text-ink-500 uppercase">
                  {c.titulo}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.r}>
                      <Link
                        href={l.h}
                        className="text-sm text-ink-300 transition-colors hover:text-white foco-anel"
                      >
                        {l.r}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
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
