import type { Metadata } from "next";
import { Hero } from "./_componentes/hero";
import { Vsl } from "./_componentes/vsl";
import { ProvaSocial } from "./_componentes/prova-social";
import { Dores } from "./_componentes/dores";
import { Metodo } from "./_componentes/metodo";
import { Servicos } from "./_componentes/servicos";
import { Resultados } from "./_componentes/resultados";
import { Portfolio } from "./_componentes/portfolio";
import { Comparativo } from "./_componentes/comparativo";
import { Processo } from "./_componentes/processo";
import { Sobre } from "./_componentes/sobre";
import { InstagramConvite } from "./_componentes/instagram";
import { Faq } from "./_componentes/faq";
import { PERGUNTAS } from "./_componentes/faq-dados";
import { CtaFinal } from "./_componentes/cta-final";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = {
  title: {
    absolute: "MR Grow · Estratégia, conteúdo e tráfego para marcas que querem crescer",
  },
  description:
    "Assessoria de marketing completa: planejamento estratégico, produção de conteúdo para redes sociais, roteiro e edição de vídeo e gestão de tráfego no Meta e no Google.",
  alternates: { canonical: "/" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${MARCA.site}/#organizacao`,
      name: MARCA.nome,
      description: MARCA.descricao,
      url: MARCA.site,
      email: MARCA.email,
      logo: `${MARCA.site}/marca/mr-grow-logo.webp`,
      image: `${MARCA.site}/marca/og.png`,
      areaServed: "BR",
      founder: { "@type": "Person", name: MARCA.fundador },
      sameAs: [MARCA.instagramAgencia, MARCA.instagramFundador],
      serviceType: [
        "Assessoria de marketing",
        "Planejamento estratégico de marketing",
        "Produção de conteúdo para redes sociais",
        "Produção de vídeo e edição",
        "Gestão de tráfego pago",
        "Meta Ads",
        "Google Ads",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${MARCA.site}/#faq`,
      mainEntity: PERGUNTAS.map((q) => ({
        "@type": "Question",
        name: q.p,
        acceptedAnswer: { "@type": "Answer", text: q.r },
      })),
    },
  ],
};

export default function PaginaInicial() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Hero />
      <Vsl />
      <ProvaSocial />
      <Dores />
      <Metodo />
      <Servicos />
      <Resultados />
      <Portfolio />
      <Comparativo />
      <Processo />
      <Sobre />
      <InstagramConvite />
      <Faq />
      <CtaFinal />
    </>
  );
}
