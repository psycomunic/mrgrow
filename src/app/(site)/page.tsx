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
import { Planos } from "./_componentes/planos";
import { Sobre } from "./_componentes/sobre";
import { Faq } from "./_componentes/faq";
import { PERGUNTAS } from "./_componentes/faq-dados";
import { CtaFinal } from "./_componentes/cta-final";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = {
  title: {
    absolute: "MR Grow · Tráfego pago e performance para negócios que querem escalar",
  },
  description:
    "Assessoria de marketing e performance. Tráfego, criativo, página e dados em uma operação só, com painel ao vivo para você acompanhar cada real investido.",
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
        "Gestão de tráfego pago",
        "Meta Ads",
        "Google Ads",
        "Landing pages de alta conversão",
        "Marketing de performance",
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
      <Planos />
      <Sobre />
      <Faq />
      <CtaFinal />
    </>
  );
}
