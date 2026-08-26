import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold text-tinta">Entrar na plataforma</h1>
      <p className="mt-2 text-sm text-cinza">
        Acesse o painel da agência ou a área do cliente com o mesmo login.
      </p>

      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-lg bg-nevoa" />}>
        <FormularioEntrar />
      </Suspense>

      <p className="mt-6 text-sm text-cinza">
        Ainda não tem acesso?{" "}
        <Link href="/cadastro" className="font-semibold text-mrg-600 hover:text-mrg-600 foco-anel">
          Criar conta
        </Link>
      </p>
    </>
  );
}
