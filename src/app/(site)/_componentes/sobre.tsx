import Image from "next/image";
import { Secao } from "./secao";
import { MARCA } from "@/lib/marca";

const FICHA = [
  { r: "Operando mídia paga há", v: "+6 anos" },
  { r: "Base", v: "Brasil · remoto" },
  { r: "Contas novas por mês", v: "Limitadas" },
];

export function Sobre() {
  return (
    <Secao id="sobre">
      <div className="sobre">
        <div>
          <figure className="sobre__retrato">
            <Image
              src="/marca/mateus-retrato.webp"
              alt={`${MARCA.fundador}, fundador da ${MARCA.nome}`}
              width={1100}
              height={1347}
              sizes="(max-width: 992px) 100vw, 368px"
            />
          </figure>
        </div>

        <div>
          <span className="chapeu">
            <i />
            Quem está por trás
          </span>
          <h2>{MARCA.fundador}, fundador da MR Grow</h2>

          {/* A frase fundadora sai do corpo do texto e vira declaração:
              era o argumento mais forte da seção, e estava enterrado no
              meio do primeiro parágrafo, com o mesmo peso do resto. */}
          <blockquote className="sobre__lema">
            Empresário nenhum deveria precisar confiar na palavra da agência para saber se o
            investimento está voltando.
          </blockquote>

          <div className="sobre__texto">
            <p>
              Por isso a operação inteira é montada com dado aberto. Você tem acesso ao painel, aos
              números da conta e ao plano de ação, sempre. Se o resultado não vem, a conversa é
              sobre o que mudar, não sobre o que justificar.
            </p>
            <p>
              Trabalhamos com um número limitado de contas por mês. É o que garante que cada uma
              seja lida todos os dias por quem entende dela.
            </p>
          </div>

          {/* A ficha vive aqui, e não sob a foto: a coluna do texto é larga
              e o corpo dela e' estreito por limite de leitura, entao sobrava
              um vazio a direita. Deitada, ela ocupa essa largura. */}
          <dl className="sobre__ficha vidro">
            {FICHA.map((f) => (
              <div key={f.r}>
                <dt>{f.r}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>

          <div className="sobre__links">
            {/* Só o perfil pessoal. O da agência tem a seção inteira logo
                abaixo, e repetir aqui divide o clique entre os dois. */}
            <a
              href={MARCA.instagramFundador}
              target="_blank"
              rel="noopener noreferrer"
              className="acao acao--linha acao--mini"
            >
              @mvteusrodrigues
            </a>
          </div>
        </div>
      </div>
    </Secao>
  );
}
