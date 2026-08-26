"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/* Nada muda depois de montar, então a inscrição é vazia: só queremos o
   par servidor/cliente para saber se o `document` já existe. Um efeito
   com setState faria o mesmo, mas o React 19 reclama disso com razão. */
const inscrever = () => () => {};
const noCliente = () => true;
const noServidor = () => false;

/**
 * Raiz de um modal ou painel lateral, montada direto no `<body>`.
 *
 * Sem isso a sobreposição fica presa em quem a renderizou: `backdrop-filter`,
 * `transform` e `filter` fazem do elemento um bloco de contenção para
 * descendentes `position: fixed`, e aí `inset-0` passa a valer a caixa do
 * ancestral em vez da janela. Era o que acontecia com todo diálogo aberto
 * pelo botão de ação do cabeçalho, que tem `backdrop-blur`: o modal
 * aparecia espremido na faixa do topo.
 */
export function Sobreposicao({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const montado = useSyncExternalStore(inscrever, noCliente, noServidor);
  if (!montado) return null;
  return createPortal(<div className={className} {...props} />, document.body);
}
