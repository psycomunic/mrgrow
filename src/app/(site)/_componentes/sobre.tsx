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

          <dl className="sobre__ficha vidro">
            {FICHA.map((f) => (
              <div key={f.r}>
                <dt>{f.r}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <span className="chapeu">
            <i />
            Quem está por trás
          </span>
          <h2>{MARCA.fundador}, fundador da MR Grow</h2>

          <div className="sobre__texto">
            <p>
              A MR Grow nasceu de uma inconformidade simples: empresário nenhum deveria precisar
              confiar na palavra da agência para saber se o investimento está voltando.
            </p>
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

          <div className="sobre__links">
            <a
              href={MARCA.instagramFundador}
              target="_blank"
              rel="noopener noreferrer"
              className="acao acao--linha acao--mini"
            >
              @mvteusrodrigues
            </a>
            <a
              href={MARCA.instagramAgencia}
              target="_blank"
              rel="noopener noreferrer"
              className="acao acao--linha acao--mini"
            >
              @mrgrow.ag
            </a>
          </div>
        </div>
      </div>
    </Secao>
  );
}
