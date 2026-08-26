import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCadastro } from "./formulario";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCadastro() {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold text-tinta">Criar sua conta</h1>
      <p className="mt-2 text-sm text-cinza">
        Depois de confirmar o e-mail, um administrador libera seu acesso à organização.
      </p>

      <FormularioCadastro />

      <p className="mt-6 text-sm text-cinza">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-mrg-600 hover:text-mrg-600 foco-anel">
          Entrar
        </Link>
      </p>
    </>
  );
}
