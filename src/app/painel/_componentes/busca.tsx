"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Icone } from "@/components/painel/icone";
import { MENU } from "@/lib/navegacao";
import { pode } from "@/lib/papeis";
import { usePainel } from "./sessao-cliente";

/** Remove acento para "metricas" achar "Métricas". */
const chave = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Busca rápida de navegação.
 *
 * Antes este campo era decorativo: um input bonito que não fazia nada, o que é
 * pior do que não existir. Agora ele encontra e abre qualquer tela do painel,
 * respeitando o que o papel do usuário pode ver, e responde ao atalho Ctrl+K.
 *
 * Busca por conteúdo (cliente, negócio, fatura) exige índice no banco e vai
 * entrar aqui como uma segunda seção — a navegação é o que resolve hoje.
 */
export function Busca() {
  const { papel } = usePainel();
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);

  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(0);

  const permitidos = useMemo(() => MENU.filter((i) => pode(papel, i.recurso, "ver")), [papel]);

  const achados = useMemo(() => {
    const t = chave(termo.trim());
    if (!t) return permitidos.slice(0, 6);
    return permitidos.filter((i) => chave(i.rotulo).includes(t) || chave(i.grupo).includes(t));
  }, [termo, permitidos]);

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        campo.current?.focus();
        setAberto(true);
      }
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", atalho);
    return () => document.removeEventListener("keydown", atalho);
  }, []);

  function ir(href: string) {
    setAberto(false);
    setTermo("");
    campo.current?.blur();
    router.push(href);
  }

  function teclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFoco((f) => Math.min(f + 1, achados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFoco((f) => Math.max(f - 1, 0));
    } else if (e.key === "Enter" && achados[foco]) {
      e.preventDefault();
      ir(achados[foco].href);
    }
  }

  return (
    <div className="relative hidden sm:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cinza-claro" />
      <input
        ref={campo}
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setFoco(0);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        /* Fechar no blur com atraso: sem isso o clique no resultado é perdido,
           porque o blur dispara antes do clique se resolver. */
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        onKeyDown={teclas}
        placeholder="Buscar no painel…"
        aria-label="Buscar no painel"
        role="combobox"
        aria-expanded={aberto}
        aria-controls="resultados-busca"
        className="h-9 w-52 rounded-full border border-borda bg-carta pr-12 pl-9 text-sm text-tinta placeholder:text-cinza-claro foco-anel lg:w-60"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-borda px-1.5 py-0.5 text-[10px] font-medium text-cinza-claro">
        Ctrl K
      </kbd>

      {aberto && achados.length > 0 && (
        <ul
          id="resultados-busca"
          role="listbox"
          className="cartao absolute top-11 right-0 z-50 w-72 overflow-hidden rounded-lg p-1.5"
        >
          {achados.map((item, i) => (
            <li key={item.href} role="option" aria-selected={i === foco}>
              <button
                type="button"
                onMouseEnter={() => setFoco(i)}
                onClick={() => ir(item.href)}
                className={[
                  "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm transition-colors",
                  i === foco ? "bg-mrg-50 text-mrg-700" : "text-grafite",
                ].join(" ")}
              >
                <Icone nome={item.icone} className="size-4 shrink-0 text-cinza-claro" />
                <span className="flex-1 truncate font-medium">{item.rotulo}</span>
                <span className="text-[11px] text-cinza-claro">{item.grupo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
