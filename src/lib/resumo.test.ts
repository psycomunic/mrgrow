/**
 * Testes do resumo financeiro.
 *
 * Os números vêm da auditoria de setembro/2026 feita contra as planilhas
 * da agência. Eles existem aqui para que a regra não volte a divergir
 * entre as três telas sem alguém perceber — era exatamente esse o defeito
 * que deu origem a este módulo.
 *
 * Roda com `npm test`, no test runner do próprio Node.
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  atrasado,
  limitesDoMes,
  noPeriodo,
  porMes,
  resumirFinanceiro,
  type Movimento,
} from "./resumo.ts";

const HOJE = "2026-09-28";

function receita(vencimento: string, valor: number, status = "pendente"): Movimento {
  return { tipo: "receita", status, valor, valor_pago: status === "pago" ? valor : 0, vencimento };
}

function despesa(vencimento: string, valor: number): Movimento {
  return { tipo: "despesa", status: "pago", valor, valor_pago: valor, vencimento };
}

/* Recorte de setembro/2026: 19 cobranças somando R$ 48.450, das quais
   R$ 44.950 entraram e uma de R$ 3.500 venceu sem pagar (Conecta Express,
   25/09). As despesas do mês somam R$ 50.917,83. */
const SETEMBRO: Movimento[] = [
  ...Array.from({ length: 18 }, (_, i) => receita(`2026-09-${String(5 + i).padStart(2, "0")}`, 0, "pago")),
  receita("2026-09-25", 3500), // Conecta Express, vencida
];
// Distribui os R$ 44.950 recebidos entre as 18 pagas.
SETEMBRO.slice(0, 18).forEach((m, i) => {
  m.valor = i === 0 ? 44950 - 17 * 1000 : 1000;
  m.valor_pago = m.valor;
});

const DESPESAS_SET = [despesa("2026-09-15", 50917.83)];

describe("recorte de período", () => {
  it("fecha os dois lados do intervalo", () => {
    const m = receita("2026-10-25", 5000);
    assert.equal(noPeriodo(m, "2026-09-01", "2026-09-30"), false);
    assert.equal(noPeriodo(m, "2026-10-01", "2026-10-31"), true);
  });

  it("inclui o primeiro e o último dia", () => {
    assert.equal(noPeriodo(receita("2026-09-01", 1), "2026-09-01", "2026-09-30"), true);
    assert.equal(noPeriodo(receita("2026-09-30", 1), "2026-09-01", "2026-09-30"), true);
  });

  it("calcula o último dia de cada mês", () => {
    assert.deepEqual(limitesDoMes("2026-09"), { de: "2026-09-01", ate: "2026-09-30" });
    assert.deepEqual(limitesDoMes("2026-10"), { de: "2026-10-01", ate: "2026-10-31" });
    assert.deepEqual(limitesDoMes("2026-02"), { de: "2026-02-01", ate: "2026-02-28" });
    assert.deepEqual(limitesDoMes("2028-02"), { de: "2028-02-01", ate: "2028-02-29" });
  });
});

describe("atraso", () => {
  it("é receita vencida e não paga", () => {
    assert.equal(atrasado(receita("2026-09-25", 3500), HOJE), true);
  });

  it("não conta o que já foi pago", () => {
    assert.equal(atrasado(receita("2026-09-25", 3500, "pago"), HOJE), false);
  });

  it("não conta o que ainda vai vencer", () => {
    assert.equal(atrasado(receita("2026-10-25", 5000), HOJE), false);
  });

  it("não conta linha de valor zero", () => {
    // A planilha de origem trazia marcadores de R$ 0 que viravam atraso falso.
    assert.equal(atrasado(receita("2026-08-01", 0), HOJE), false);
  });

  it("não conta despesa", () => {
    assert.equal(atrasado({ ...despesa("2026-08-01", 900), status: "pendente" }, HOJE), false);
  });
});

describe("setembro/2026", () => {
  const r = resumirFinanceiro([...SETEMBRO, ...DESPESAS_SET], {
    de: "2026-09-01",
    ate: "2026-09-30",
    hoje: HOJE,
  });

  it("previsto é R$ 48.450", () => assert.equal(r.previsto, 48450));
  it("recebido é R$ 44.950", () => assert.equal(r.recebido, 44950));
  it("a receber é R$ 3.500", () => assert.equal(r.aReceber, 3500));
  it("em atraso é R$ 3.500, numa cobrança só", () => {
    assert.equal(r.atrasado, 3500);
    assert.equal(r.qtdAtrasada, 1);
  });
  it("despesas somam R$ 50.917,83", () => assert.equal(r.despesas, 50917.83));
  it("resultado é negativo: R$ -5.967,83", () => {
    assert.equal(Number(r.resultado.toFixed(2)), -5967.83);
  });
  it("conta 19 cobranças", () => assert.equal(r.cobrancas, 19));
});

describe("meses futuros não entram no mês corrente", () => {
  const todos = [
    ...SETEMBRO,
    ...DESPESAS_SET,
    receita("2026-10-25", 50400),
    receita("2026-11-25", 43400),
  ];

  it("setembro ignora outubro e novembro", () => {
    const r = resumirFinanceiro(todos, { de: "2026-09-01", ate: "2026-09-30", hoje: HOJE });
    // Era aqui que a tela mostrava R$ 142.250 somando os três meses.
    assert.equal(r.previsto, 48450);
  });

  it("outubro previsto é R$ 50.400", () => {
    const r = resumirFinanceiro(todos, { de: "2026-10-01", ate: "2026-10-31", hoje: HOJE });
    assert.equal(r.previsto, 50400);
    assert.equal(r.recebido, 0);
  });

  it("novembro previsto é R$ 43.400", () => {
    const r = resumirFinanceiro(todos, { de: "2026-11-01", ate: "2026-11-30", hoje: HOJE });
    assert.equal(r.previsto, 43400);
  });
});

describe("cancelado", () => {
  it("não entra em previsto nem em atraso", () => {
    const r = resumirFinanceiro(
      [receita("2026-09-10", 9999, "cancelado"), ...SETEMBRO],
      { de: "2026-09-01", ate: "2026-09-30", hoje: HOJE },
    );
    assert.equal(r.previsto, 48450);
  });
});

describe("série mensal", () => {
  const meses = porMes([
    ...SETEMBRO,
    receita("2026-10-25", 50400),
    receita("2026-11-25", 43400),
  ]);

  it("sai em ordem cronológica", () => {
    assert.deepEqual(
      meses.map((m) => m.competencia),
      ["2026-09", "2026-10", "2026-11"],
    );
  });

  it("bate com o resumo do mesmo mês", () => {
    const set = meses.find((m) => m.competencia === "2026-09");
    assert.equal(set?.previsto, 48450);
    assert.equal(set?.recebido, 44950);
  });

  it("mês sem recebimento fica com recebido zero", () => {
    assert.equal(meses.find((m) => m.competencia === "2026-10")?.recebido, 0);
  });
});

describe("quitação parcial", () => {
  it("conta o que entrou, não o que foi cobrado", () => {
    const r = resumirFinanceiro(
      [{ tipo: "receita", status: "pago", valor: 3000, valor_pago: 1500, vencimento: "2026-09-10" }],
      { de: "2026-09-01", ate: "2026-09-30", hoje: HOJE },
    );
    assert.equal(r.previsto, 3000);
    assert.equal(r.recebido, 1500);
    assert.equal(r.aReceber, 1500);
  });
});
