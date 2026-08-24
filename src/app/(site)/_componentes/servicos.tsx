import { Secao, CabecaSecao } from "./secao";

const SERVICOS = [
  {
    titulo: "Gestão de tráfego no Meta Ads",
    texto:
      "Estrutura por temperatura de público, teste contínuo de criativo e leitura diária da conta.",
    marcas: ["Instagram", "Facebook", "Advantage+"],
  },
  {
    titulo: "Gestão de tráfego no Google Ads",
    texto:
      "Search, Performance Max, YouTube e remarketing capturando quem já está pronto para comprar.",
    marcas: ["Search", "PMax", "YouTube"],
  },
  {
    titulo: "Criativos que vendem",
    texto:
      "Roteiro, edição e variação. Matriz de ângulos testada semana a semana, com vencedor documentado.",
    marcas: ["Reels", "Estático", "UGC"],
  },
  {
    titulo: "Landing pages de alta conversão",
    texto:
      "Página construída para converter: oferta clara, prova, velocidade e teste A/B contínuo.",
    marcas: ["Copy", "Design", "Teste A/B"],
  },
  {
    titulo: "Rastreamento e dados",
    texto:
      "GA4, GTM, Pixel e API de Conversões. A plataforma só otimiza bem quando enxerga direito.",
    marcas: ["GA4", "CAPI", "Server-side"],
  },
  {
    titulo: "Painel e relatórios ao vivo",
    texto:
      "Você acompanha investimento, retorno e projeção sem esperar o relatório do fim do mês.",
    marcas: ["Tempo real", "CRM", "Metas"],
  },
];

export function Servicos() {
  return (
    <Secao id="servicos">
      <CabecaSecao
        etiqueta="Escopo"
        titulo="Uma operação inteira, não um serviço solto."
        apoio="Tráfego sozinho não resolve. A MR Grow cuida de todas as peças que decidem se o seu investimento vira venda."
      />

      <div className="servicos espaco">
        {SERVICOS.map((s) => (
          <article className="servico" key={s.titulo}>
            <div className="marcas">
              {s.marcas.map((m) => (
                <span className="marca" key={m}>
                  {m}
                </span>
              ))}
            </div>
            <h3>{s.titulo}</h3>
            <p>{s.texto}</p>
          </article>
        ))}
      </div>
    </Secao>
  );
}
