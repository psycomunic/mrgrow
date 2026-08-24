import Image from "next/image";
import { Instagram } from "lucide-react";
import { Secao } from "./secao";
import { BotaoLink } from "@/components/ui/botao";
import { MARCA } from "@/lib/marca";

export function Sobre() {
  return (
    <Secao id="sobre">
      <div className="cartao-vidro grid gap-10 rounded-xl p-8 sm:p-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div className="relative">
          <div className="relative aspect-4/5 w-full overflow-hidden rounded-lg bg-gradient-to-br from-mrg-600/30 via-ink-800 to-ink-950 ring-1 ring-white/10">
            <Image
              src="/marca/mateus.webp"
              alt={`${MARCA.fundador}, fundador da ${MARCA.nome}`}
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover object-top"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-950/80 to-transparent"
            />
          </div>
          <span className="cartao-vidro absolute -right-3 -bottom-4 rounded-md px-4 py-3 text-center">
            <span className="block font-display text-xl font-extrabold text-white">+6 anos</span>
            <span className="text-[11px] text-ink-400">operando mídia paga</span>
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold tracking-[0.14em] text-mrg-300 uppercase">
            Quem está por trás
          </span>
          <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            {MARCA.fundador}, fundador da MR Grow
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-ink-300">
            <p>
              A MR Grow nasceu de uma inconformidade simples: empresário nenhum deveria precisar
              confiar na palavra da agência para saber se o investimento está voltando.
            </p>
            <p>
              Por isso a operação inteira é montada com dado aberto. Você tem acesso ao painel, aos
              números da conta e ao plano de ação — sempre. Se o resultado não vem, a conversa é
              sobre o que mudar, não sobre o que justificar.
            </p>
            <p className="text-ink-200">
              Trabalhamos com um número limitado de contas por mês. É o que garante que cada uma
              seja lida todos os dias por quem entende dela.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <BotaoLink href={MARCA.instagramFundador} externo variante="contorno">
              <Instagram className="size-4" />
              @mvteusrodrigues
            </BotaoLink>
            <BotaoLink href={MARCA.instagramAgencia} externo variante="contorno">
              <Instagram className="size-4" />
              @mrgrow.ag
            </BotaoLink>
          </div>
        </div>
      </div>
    </Secao>
  );
}
