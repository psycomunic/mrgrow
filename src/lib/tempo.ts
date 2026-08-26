/**
 * Datas do lado do servidor, no fuso da agência.
 *
 * `new Date().toISOString().slice(0,10)` devolve o dia em UTC. Rodando na
 * Vercel isso significa que, entre 21h e meia-noite em Brasília, o servidor
 * já acha que é amanhã: fatura marcada atrasada um dia antes, tarefa fora do
 * prazo antes da hora, baixa registrada no dia seguinte. A interface já
 * corrigia o lado dela (`utils.ts`); estas funções corrigem o do servidor.
 *
 * O Brasil não usa horário de verão desde 2019, mas `Intl` acompanha a base
 * de fusos do sistema — então nada aqui precisa mudar se isso voltar.
 */

export const FUSO_PADRAO = "America/Sao_Paulo";

const formatador = (fuso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Data de hoje no fuso informado, como "2026-08-26". */
export function hoje(fuso = FUSO_PADRAO) {
  return formatador(fuso).format(new Date());
}

/** Data a N dias de hoje (N negativo volta no tempo), como "2026-08-29". */
export function emDias(dias: number, fuso = FUSO_PADRAO) {
  return formatador(fuso).format(new Date(Date.now() + dias * 86_400_000));
}

/** Primeiro dia do mês corrente no fuso informado. */
export function inicioDoMes(fuso = FUSO_PADRAO) {
  return hoje(fuso).slice(0, 8) + "01";
}

/** "2026-08" — chave de competência mensal. */
export function competencia(fuso = FUSO_PADRAO) {
  return hoje(fuso).slice(0, 7);
}
