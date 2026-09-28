import type { Metadata } from "next";
import { Topo } from "../_componentes/topo";
import { FormularioPerfil } from "./formulario";
import { AvisoDemo } from "@/components/painel/aviso-demo";
import { exigirEquipe } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao } from "@/lib/dados";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PaginaPerfil() {
  const sessao = await exigirEquipe();

  /* Nome e avatar já vêm na sessão, mas cargo e telefone não — a sessão
     carrega só o que a barra lateral usa. */
  let telefone = "";
  let cargo = "";

  if (!modoDemonstracao()) {
    const db = await criarClienteServidor();
    const { data } = await db
      .from("perfis")
      .select("telefone, cargo")
      .eq("id", sessao.usuarioId)
      .maybeSingle();
    const p = data as { telefone: string | null; cargo: string | null } | null;
    telefone = p?.telefone ?? "";
    cargo = p?.cargo ?? "";
  }

  return (
    <>
      <Topo titulo="Meu perfil" descricao="Seus dados, sua foto e sua senha." />

      <div className="space-y-5 p-5 sm:p-8">
        {modoDemonstracao() && <AvisoDemo />}
        <FormularioPerfil
          inicial={{
            nome_completo: sessao.nome ?? "",
            telefone,
            cargo,
            avatar_url: sessao.avatarUrl ?? "",
          }}
          email={sessao.email ?? ""}
          papel={sessao.papel}
          organizacao={sessao.organizacaoNome}
        />
      </div>
    </>
  );
}
