import Link from "next/link";
import { BotaoLink } from "@/components/ui/botao";

export default function NaoEncontrado() {
  return (
    <div className="malha-fundo grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-mrg-500/30">404</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-white">Página não encontrada</h1>
        <p className="mt-2 text-sm text-ink-400">O endereço acessado não existe ou foi movido.</p>
        <div className="mt-8 flex justify-center gap-3">
          <BotaoLink href="/">Voltar ao site</BotaoLink>
          <BotaoLink href="/painel" variante="contorno">Ir para o painel</BotaoLink>
        </div>
        <p className="mt-8 text-xs text-ink-600">
          <Link href="/entrar" className="hover:text-ink-400">Área do cliente</Link>
        </p>
      </div>
    </div>
  );
}
