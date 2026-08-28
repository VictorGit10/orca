import { describe, it, expect } from 'vitest';
import { BRL, mLeft, calcSpent, calcTotFix, calcTotInst, calcTotInc, calcSumGoals, calcSaldo, calcTotPendRecv, calcMonthTotal, histFromSnaps, mergeHist, prevYM, pickBaseline } from '../utils.js';

describe('BRL', () => {
  it('formats 0', () => expect(BRL(0)).toMatch(/0,00/));
  it('formats positive value', () => expect(BRL(1234.56)).toMatch(/1\.234,56/));
  it('formats null/undefined as 0', () => expect(BRL(null)).toMatch(/0,00/));
  it('formats negative value', () => expect(BRL(-50)).toContain('-'));
});

describe('mLeft', () => {
  it('returns 0 for past months', () => {
    const past = '2020-01';
    expect(mLeft(past)).toBe(0);
  });

  it('returns correct count for future months', () => {
    const now = new Date();
    const futureY = now.getFullYear() + 1;
    const futureM = String(now.getMonth() + 1).padStart(2, '0');
    // Same month next year = 12 months left (current month counts as 1)
    expect(mLeft(`${futureY}-${futureM}`)).toBe(13);
  });

  it('returns 1 for current month end', () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(mLeft(ym)).toBe(1);
  });
});

describe('calcTotFix', () => {
  it('sums all fixed expenses', () => {
    const fix = [
      { id: 1, name: 'A', val: 100 },
      { id: 2, name: 'B', val: 200 },
      { id: 3, name: 'C', val: 300 },
    ];
    expect(calcTotFix(fix)).toBe(600);
  });

  it('returns 0 for empty array', () => {
    expect(calcTotFix([])).toBe(0);
  });
});

describe('calcTotInst', () => {
  it('calculates total commitment from installments', () => {
    const inst = [
      { pm: 200, end: '2030-12' },
      { pm: 150, end: '2030-06' },
    ];
    const total = calcTotInst(inst);
    expect(total).toBeGreaterThan(0);
    expect(total).toBe(200 * mLeft('2030-12') + 150 * mLeft('2030-06'));
  });
});

describe('calcTotInc', () => {
  it('sums all income values', () => {
    const inc = [{ val: 5000, got: false }, { val: 500, got: false }];
    expect(calcTotInc(inc)).toBe(5500);
  });

  it('skips received income', () => {
    const inc = [{ val: 5000, got: true }, { val: 500, got: false }];
    expect(calcTotInc(inc)).toBe(500);
  });

  it('subtracts partial advance from pending income', () => {
    const inc = [{ val: 5000, got: false, rcvd: 2000 }];
    expect(calcTotInc(inc)).toBe(3000);
  });
});

describe('calcSumGoals', () => {
  it('sums category goals', () => {
    const cats = [{ goal: 300 }, { goal: 400 }, { goal: 900 }];
    expect(calcSumGoals(cats)).toBe(1600);
  });
});

describe('calcSaldo', () => {
  it('calculates saldo livre correctly', () => {
    const bal = 6000;
    const totInc = 4000;
    const totFix = 2100;
    const res = 400;
    const totInst = 0;
    const investGoal = 300;
    const saldo = calcSaldo(bal, totInc, totFix, res, totInst, investGoal);
    expect(saldo).toBe(6000 + 4000 - 2100 - 400 - 0 - 300);
    expect(saldo).toBe(7200);
  });

  it('handles negative saldo', () => {
    const saldo = calcSaldo(1000, 0, 2000, 0, 0);
    expect(saldo).toBe(-1000);
  });
});

describe('calcSpent', () => {
  it('sums transactions by category for current month', () => {
    const now = new Date();
    const cm = now.getMonth();
    const ca = now.getFullYear();
    const ym = `${ca}-${String(cm + 1).padStart(2, '0')}`;
    const txs = [
      { id: 1, dt: `${ym}-01`, cat: 1, val: 10, type: 'debito' },
      { id: 2, dt: `${ym}-05`, cat: 1, val: 20, type: 'debito' },
      { id: 3, dt: `${ym}-10`, cat: 2, val: 50, type: 'credito' },
    ];
    const cats = [{ id: 1 }, { id: 2 }];
    const spent = calcSpent(txs, cats, cm, ca);
    expect(spent[1]).toBe(30);
    expect(spent[2]).toBe(50);
  });

  it('ignores investment transactions (cat=-1)', () => {
    const now = new Date();
    const cm = now.getMonth();
    const ca = now.getFullYear();
    const ym = `${ca}-${String(cm + 1).padStart(2, '0')}`;
    const txs = [
      { id: 1, dt: `${ym}-01`, cat: -1, val: 100, type: 'pix' },
      { id: 2, dt: `${ym}-05`, cat: 1, val: 50, type: 'debito' },
    ];
    const cats = [{ id: 1 }];
    const spent = calcSpent(txs, cats, cm, ca);
    expect(spent[1]).toBe(50);
  });

  it('ignores transactions from other months', () => {
    const txs = [
      { id: 1, dt: '2020-01-01', cat: 1, val: 100, type: 'debito' },
    ];
    const cats = [{ id: 1 }];
    const spent = calcSpent(txs, cats, 5, 2026);
    expect(spent[1]).toBe(0);
  });
});

describe('Monthly rollover logic', () => {
  it('zeroes balance, resets inc, removes got:true recv, and accumulates investGoal', () => {
    const prevState = {
      lastMonth: '2025-12',
      bal: 5000,
      inc: [{ id: 1, name: 'Salário', val: 5000, got: true }],
      fix: [{ id: 1, name: 'Aluguel', val: 1500 }],
      recv: [
        { id: 1, name: 'Received', val: 200, got: true, dt: '2025-11-01', txId: 'tx1' },
        { id: 2, name: 'Pending', val: 100, got: false, dt: '2025-10-01', txId: 'tx2' },
      ],
      investAcumulado: 1000,
      investGoal: 300,
      txs: [],
    };

    const next = {
      ...prevState,
      lastMonth: '2026-01',
      bal: 0,
      inc: prevState.inc.map(i => ({ ...i, got: false, rcvd: 0 })),
      fix: prevState.fix,
      recv: prevState.recv.filter(r => !r.got).map(r => ({ ...r, got: false })),
      investAcumulado: (prevState.investAcumulado || 0) + (prevState.investGoal || 0),
      investGoal: prevState.investGoal || 0,
    };

    expect(next.bal).toBe(0);
    expect(next.inc[0].got).toBe(false);
    expect(next.inc[0].rcvd).toBe(0);
    expect(next.recv).toHaveLength(1);
    expect(next.recv[0].id).toBe(2);
    expect(next.recv[0].got).toBe(false);
    expect(next.fix).toHaveLength(1);
    expect(next.investAcumulado).toBe(1300);
  });
});

describe('Remanejamento logic', () => {
  it('calculates remaining allocation correctly', () => {
    const saldo = 8500; // saldo livre já computado pelo hook
    const newGoals = 2500;
    const newInvest = 600;
    const totalAllocated = newGoals + newInvest;
    const remaining = saldo - totalAllocated;

    expect(remaining).toBe(5400);
  });

  it('detects over-allocation', () => {
    const saldo = 1000;
    const newGoals = 800;
    const newInvest = 300;
    const remaining = saldo - (newGoals + newInvest);

    expect(remaining).toBeLessThan(0);
  });
});

describe('calcSpent with reembolsáveis', () => {
  it('excludes reemb transactions from category spending', () => {
    const now = new Date();
    const cm = now.getMonth();
    const ca = now.getFullYear();
    const ym = `${ca}-${String(cm + 1).padStart(2, '0')}`;
    const txs = [
      { id: 1, dt: `${ym}-01`, cat: 1, val: 50, reemb: false },
      { id: 2, dt: `${ym}-05`, cat: 1, val: 220, reemb: true },
    ];
    const cats = [{ id: 1 }];
    const spent = calcSpent(txs, cats, cm, ca);
    expect(spent[1]).toBe(50);
  });

  it('excludes reemb transactions even when reembGot is true', () => {
    const now = new Date();
    const cm = now.getMonth();
    const ca = now.getFullYear();
    const ym = `${ca}-${String(cm + 1).padStart(2, '0')}`;
    const txs = [
      { id: 1, dt: `${ym}-01`, cat: 1, val: 220, reemb: true },
    ];
    const cats = [{ id: 1 }];
    const spent = calcSpent(txs, cats, cm, ca);
    expect(spent[1]).toBe(0);
  });

  it('includes normal transactions alongside reemb ones', () => {
    const now = new Date();
    const cm = now.getMonth();
    const ca = now.getFullYear();
    const ym = `${ca}-${String(cm + 1).padStart(2, '0')}`;
    const txs = [
      { id: 1, dt: `${ym}-01`, cat: 2, val: 30 },
      { id: 2, dt: `${ym}-05`, cat: 2, val: 100, reemb: true },
      { id: 3, dt: `${ym}-10`, cat: 2, val: 20 },
    ];
    const cats = [{ id: 2 }];
    const spent = calcSpent(txs, cats, cm, ca);
    expect(spent[2]).toBe(50);
  });
});

describe('calcTotPendRecv', () => {
  it('returns 0 for receivables in the current month', () => {
    const now = new Date();
    const cm = now.getMonth();
    const ca = now.getFullYear();
    const ym = `${ca}-${String(cm + 1).padStart(2, '0')}`;
    const recv = [
      { id: 1, name: 'Reembolso', val: 220, got: false, dt: `${ym}-15`, txId: 'tx1' },
    ];
    expect(calcTotPendRecv(recv, cm, ca)).toBe(0);
  });

  it('sums pending receivables from previous months', () => {
    const recv = [
      { id: 1, name: 'Reembolso', val: 220, got: false, dt: '2025-04-15', txId: 'tx1' },
      { id: 2, name: 'Outro', val: 100, got: false, dt: '2025-03-01', txId: 'tx2' },
    ];
    expect(calcTotPendRecv(recv, 3, 2025)).toBe(100); // April sees March as previous, April as current
    expect(calcTotPendRecv(recv, 4, 2025)).toBe(320); // May sees both as previous
  });

  it('excludes got receivables', () => {
    const recv = [
      { id: 1, name: 'Reembolso', val: 220, got: true, dt: '2025-04-15', txId: 'tx1' },
    ];
    expect(calcTotPendRecv(recv, 5, 2025)).toBe(0);
  });

  it('excludes receivables without dt', () => {
    const recv = [
      { id: 1, name: 'Antigo', val: 200, got: false },
    ];
    expect(calcTotPendRecv(recv, 5, 2025)).toBe(0);
  });
});

describe('calcSaldo with totPendRecv', () => {
  it('increases saldo when totPendRecv is provided', () => {
    const saldo = calcSaldo(1000, 500, 300, 100, 0, 50, 220);
    expect(saldo).toBe(1000 + 500 + 220 - 300 - 100 - 0 - 50);
  });

  it('handles undefined totPendRecv as 0', () => {
    const saldo = calcSaldo(1000, 500, 300, 100, 0, 50);
    expect(saldo).toBe(1000 + 500 - 300 - 100 - 0 - 50);
  });

  it('handles zero totPendRecv', () => {
    const saldo = calcSaldo(1000, 500, 300, 100, 0, 50, 0);
    expect(saldo).toBe(1000 + 500 - 300 - 100 - 0 - 50);
  });
});

describe('calcMonthTotal', () => {
  const txs = [
    { dt: '2026-05-02', cat: 1, val: 30 },
    { dt: '2026-05-10', cat: 2, val: 20 },
    { dt: '2026-05-11', cat: -1, val: 300 },      // investimento não conta
    { dt: '2026-05-12', cat: 1, val: 15, reemb: true }, // reembolsável não conta
    { dt: '2026-06-01', cat: 1, val: 99 },        // outro mês
  ];

  it('sums only regular expenses of the month', () => {
    expect(calcMonthTotal(txs, 4, 2026)).toBe(50);
  });

  it('returns 0 for a month without txs', () => {
    expect(calcMonthTotal(txs, 0, 2026)).toBe(0);
  });
});

describe('prevYM', () => {
  it('returns the previous month', () => expect(prevYM('2026-08')).toBe('2026-07'));
  it('crosses the year boundary', () => expect(prevYM('2026-01')).toBe('2025-12'));
  it('keeps two-digit padding', () => expect(prevYM('2026-11')).toBe('2026-10'));
});

describe('histFromSnaps', () => {
  // Um SNAPSHOT_MONTHLY é gravado DEPOIS do rollover: seu payload.lastMonth é o
  // mês que começa, e as metas/reserva dentro dele são as do mês que FECHOU.
  it('atribui o snapshot ao mês que fechou, não ao que começou', () => {
    const snaps = [
      { payload: { lastMonth: '2026-05', cats: [{ id: 1, goal: 300 }], res: 400, bal: 0, investAcumulado: 900 } },
      { payload: { lastMonth: '2026-06', cats: [], res: 450, bal: 0, investAcumulado: 1200 } },
    ];
    const hist = histFromSnaps(snaps);
    expect(hist).toHaveLength(2);
    expect(hist[0]).toEqual({ m: '2026-04', cats: { 1: 300 }, res: 400, bal: 0, inv: 900 });
    expect(hist[1].m).toBe('2026-05');
  });

  it('usa payload.hist quando o snapshot já traz o histórico (v1.2+)', () => {
    const snaps = [{ payload: { lastMonth: '2026-06', hist: [{ m: '2026-05', res: 999, cats: {} }] } }];
    expect(histFromSnaps(snaps)).toEqual([{ m: '2026-05', res: 999, cats: {} }]);
  });

  it('drops snapshots without lastMonth and handles null input', () => {
    expect(histFromSnaps([{ payload: {} }, { payload: null }])).toEqual([]);
    expect(histFromSnaps(null)).toEqual([]);
  });
});

describe('mergeHist', () => {
  it('merges and dedupes by month, base (local) wins', () => {
    const base = [{ m: '2026-05', res: 400 }, { m: '2026-06', res: 450 }];
    const extra = [{ m: '2026-06', res: 460 }, { m: '2026-07', res: 500 }];
    const merged = mergeHist(base, extra);
    expect(merged.map(h => h.m)).toEqual(['2026-05', '2026-06', '2026-07']);
    expect(merged[1].res).toBe(450); // registro local preservado
  });

  it('sorts ascending and caps at 36', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ m: `20${String(i).padStart(2, '0')}-01`, res: i }));
    const merged = mergeHist([], many);
    expect(merged).toHaveLength(36);
    expect(merged[0].m).toBe('2004-01');
    expect(merged.at(-1).m).toBe('2039-01');
  });

  it('descarta meses anteriores a minM (meses fantasma do backfill)', () => {
    const extra = [{ m: '2026-03', res: 1 }, { m: '2026-04', res: 2 }, { m: '2026-05', res: 3 }];
    expect(mergeHist([], extra, '2026-04').map(h => h.m)).toEqual(['2026-04', '2026-05']);
  });

  it('handles null/undefined inputs', () => {
    expect(mergeHist(null, null)).toEqual([]);
  });
});

describe('pickBaseline', () => {
  const snap = (ts, nTx) => ({ device_ts: ts, payload: { txs: Array.from({ length: nTx }, (_, i) => ({ id: i })) } });

  it('escolhe o snapshot mais recente quando todos são consistentes', () => {
    const escolhido = pickBaseline([snap(100, 10), snap(300, 30), snap(200, 20)]);
    expect(escolhido.device_ts).toBe(300);
  });

  it('rejeita um baseline que perdeu quase todas as transações', () => {
    // O mais recente tem 2 txs, mas um anterior tinha 300 — estado incompleto
    const escolhido = pickBaseline([snap(100, 300), snap(200, 2)]);
    expect(escolhido.device_ts).toBe(100);
  });

  it('aceita reduções normais (exclusões de lançamentos)', () => {
    const escolhido = pickBaseline([snap(100, 30), snap(200, 28)]);
    expect(escolhido.device_ts).toBe(200);
  });

  it('handles empty input', () => expect(pickBaseline([])).toBe(null));
});
