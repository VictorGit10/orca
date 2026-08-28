import { describe, it, expect } from 'vitest';
import { reduceD, applyRollover } from '../store/reducer.js';
import { nowYM } from '../utils.js';

const baseState = () => ({
  bal: 5000,
  res: 400,
  investAcumulado: 1000,
  investGoal: 300,
  lastMonth: '2026-05',
  cats: [
    { id: 1, name: 'Transporte', goal: 300, hue: '#3b82f6' },
    { id: 2, name: 'Restaurantes', goal: 400, hue: '#ec4899' },
  ],
  txs: [],
  inc: [{ id: 'inc1', name: 'Salário', val: 5000, got: false, rcvd: 0 }],
  fix: [{ id: 'fix1', name: 'Aluguel', val: 1500 }],
  inst: [{ id: 'inst1', name: 'Notebook', pm: 200, end: '2026-12' }],
  recv: [],
});

describe('reduceD — ADD_TX', () => {
  it('adds a normal transaction', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_TX', payload: { dt: '2026-05-01', cat: 1, val: '50', note: 'Corrida', type: 'debito' } });
    expect(next.txs).toHaveLength(1);
    expect(next.txs[0].val).toBe(50);
    expect(next.txs[0].cat).toBe(1);
    expect(next.txs[0].reemb).toBe(false);
    expect(next.investAcumulado).toBe(1000);
  });

  it('adds a reimbursable transaction and creates a recv entry', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_TX', payload: { dt: '2026-05-01', cat: 1, val: '80', note: 'Jantar cliente', type: 'debito', reemb: true } });
    expect(next.txs).toHaveLength(1);
    expect(next.txs[0].reemb).toBe(true);
    expect(next.recv).toHaveLength(1);
    expect(next.recv[0].val).toBe(80);
    expect(next.recv[0].got).toBe(false);
    expect(next.recv[0].txId).toBe(next.txs[0].id);
  });

  it('adds an investment transaction (cat=-1) and decreases investAcumulado', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_TX', payload: { dt: '2026-05-01', cat: -1, val: '200', note: 'Tesouro', type: 'pix' } });
    expect(next.txs).toHaveLength(1);
    expect(next.txs[0].cat).toBe(-1);
    expect(next.investAcumulado).toBe(800);
  });

  it('rejects zero-value transaction', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_TX', payload: { dt: '2026-05-01', cat: 1, val: '0', note: '', type: 'debito' } });
    expect(next.txs).toHaveLength(0);
  });

  it('rejects duplicate id', () => {
    const state = baseState();
    const id = 'dup-id';
    reduceD(state, { type: 'ADD_TX', payload: { id, dt: '2026-05-01', cat: 1, val: '50', note: '', type: 'debito' } });
    const next = reduceD({ ...state, txs: [{ id, dt: '2026-05-01', cat: 1, val: 50, note: '', type: 'debito', reemb: false }] }, { type: 'ADD_TX', payload: { id, dt: '2026-05-01', cat: 1, val: '30', note: '', type: 'debito' } });
    expect(next.txs).toHaveLength(1);
  });
});

describe('reduceD — DEL_TX', () => {
  it('deletes a transaction', () => {
    const state = { ...baseState(), txs: [{ id: 'tx1', dt: '2026-05-01', cat: 1, val: 50, note: '', type: 'debito', reemb: false }] };
    const next = reduceD(state, { type: 'DEL_TX', payload: { id: 'tx1', cat: 1, val: 50 } });
    expect(next.txs).toHaveLength(0);
  });

  it('restores investAcumulado when deleting an investment transaction', () => {
    const state = { ...baseState(), investAcumulado: 800, txs: [{ id: 'tx1', dt: '2026-05-01', cat: -1, val: 200, note: 'Tesouro', type: 'pix', reemb: false }] };
    const next = reduceD(state, { type: 'DEL_TX', payload: { id: 'tx1', cat: -1, val: 200 } });
    expect(next.investAcumulado).toBe(1000);
    expect(next.txs).toHaveLength(0);
  });

  it('removes linked recv when deleting a reimbursable transaction', () => {
    const state = { ...baseState(), txs: [{ id: 'tx1', dt: '2026-05-01', cat: 1, val: 80, note: 'Jantar', type: 'debito', reemb: true }], recv: [{ id: 'r1', name: 'Ressarcimento', val: 80, got: false, dt: '2026-05-01', txId: 'tx1' }] };
    const next = reduceD(state, { type: 'DEL_TX', payload: { id: 'tx1', cat: 1, val: 80, reemb: true } });
    expect(next.txs).toHaveLength(0);
    expect(next.recv).toHaveLength(0);
  });

  it('ignores non-existent transaction id', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'DEL_TX', payload: { id: 'nonexistent', cat: 1, val: 50 } });
    expect(next).toEqual(state);
  });
});

describe('reduceD — UPD_TX', () => {
  it('updates a transaction value', () => {
    const state = { ...baseState(), txs: [{ id: 'tx1', dt: '2026-05-01', cat: 1, val: 50, note: 'Old', type: 'debito', reemb: false }] };
    const next = reduceD(state, { type: 'UPD_TX', payload: { id: 'tx1', dt: '2026-05-01', cat: 1, val: '80', note: 'New', type: 'debito', reemb: false } });
    expect(next.txs[0].val).toBe(80);
    expect(next.txs[0].note).toBe('New');
  });

  it('converts a normal transaction to reimbursable', () => {
    const state = { ...baseState(), txs: [{ id: 'tx1', dt: '2026-05-01', cat: 1, val: 80, note: 'Jantar', type: 'debito', reemb: false }] };
    const next = reduceD(state, { type: 'UPD_TX', payload: { id: 'tx1', dt: '2026-05-01', cat: 1, val: '80', note: 'Jantar', type: 'debito', reemb: true } });
    expect(next.txs[0].reemb).toBe(true);
    expect(next.recv).toHaveLength(1);
  });

  it('converts a reimbursable transaction to normal (removes recv)', () => {
    const state = { ...baseState(), txs: [{ id: 'tx1', dt: '2026-05-01', cat: 1, val: 80, note: 'Jantar', type: 'debito', reemb: true }], recv: [{ id: 'r1', name: 'Ressarcimento', val: 80, got: false, dt: '2026-05-01', txId: 'tx1' }] };
    const next = reduceD(state, { type: 'UPD_TX', payload: { id: 'tx1', dt: '2026-05-01', cat: 1, val: '80', note: 'Jantar', type: 'debito', reemb: false } });
    expect(next.txs[0].reemb).toBe(false);
    expect(next.recv).toHaveLength(0);
  });

  it('adjusts investAcumulado when changing value of an investment transaction', () => {
    const state = { ...baseState(), investAcumulado: 800, txs: [{ id: 'tx1', dt: '2026-05-01', cat: -1, val: 200, note: 'Tesouro', type: 'pix', reemb: false }] };
    const next = reduceD(state, { type: 'UPD_TX', payload: { id: 'tx1', dt: '2026-05-01', cat: -1, val: '300', note: 'Tesouro', type: 'pix', reemb: false } });
    expect(next.investAcumulado).toBe(700); // 800 + 200 - 300
  });

  it('converts investment to normal category', () => {
    const state = { ...baseState(), investAcumulado: 800, txs: [{ id: 'tx1', dt: '2026-05-01', cat: -1, val: 200, note: 'Tesouro', type: 'pix', reemb: false }] };
    const next = reduceD(state, { type: 'UPD_TX', payload: { id: 'tx1', dt: '2026-05-01', cat: 1, val: '200', note: 'Corrida', type: 'debito', reemb: false } });
    expect(next.investAcumulado).toBe(1000); // restored
    expect(next.txs[0].cat).toBe(1);
  });

  it('converts normal category to investment', () => {
    const state = { ...baseState(), investAcumulado: 1000, txs: [{ id: 'tx1', dt: '2026-05-01', cat: 1, val: 150, note: 'Corrida', type: 'debito', reemb: false }] };
    const next = reduceD(state, { type: 'UPD_TX', payload: { id: 'tx1', dt: '2026-05-01', cat: -1, val: '150', note: 'Tesouro', type: 'pix', reemb: false } });
    expect(next.investAcumulado).toBe(850); // 1000 - 150
    expect(next.txs[0].cat).toBe(-1);
  });

  it('updates value of a reimbursable transaction and syncs recv', () => {
    const state = { ...baseState(), txs: [{ id: 'tx1', dt: '2026-05-01', cat: 1, val: 80, note: 'Jantar', type: 'debito', reemb: true }], recv: [{ id: 'r1', name: 'Ressarcimento', val: 80, got: false, dt: '2026-05-01', txId: 'tx1' }] };
    const next = reduceD(state, { type: 'UPD_TX', payload: { id: 'tx1', dt: '2026-05-01', cat: 1, val: '100', note: 'Jantar caro', type: 'debito', reemb: true } });
    expect(next.txs[0].val).toBe(100);
    expect(next.recv[0].val).toBe(100);
    expect(next.recv[0].name).toBe('Jantar caro');
  });
});

describe('reduceD — UPD_BAL', () => {
  it('updates balance', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_BAL', payload: 7500 });
    expect(next.bal).toBe(7500);
  });
});

describe('reduceD — UPD_INVEST_GOAL', () => {
  it('updates investGoal', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_INVEST_GOAL', payload: 500 });
    expect(next.investGoal).toBe(500);
  });
});

describe('reduceD — UPD_RES', () => {
  it('updates reserva', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_RES', payload: 600 });
    expect(next.res).toBe(600);
  });
});

describe('reduceD — ADD_INC / DEL_INC / TOGGLE_INC / UPD_INC_VAL / UPD_INC_RCVD', () => {
  it('adds income', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_INC', payload: { id: 'inc2', name: 'Freela', val: 1000, got: false } });
    expect(next.inc).toHaveLength(2);
    expect(next.inc[1].name).toBe('Freela');
  });

  it('rejects duplicate income id', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_INC', payload: { id: 'inc1', name: 'Dup', val: 100, got: false } });
    expect(next.inc).toHaveLength(1);
  });

  it('deletes income', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'DEL_INC', payload: 'inc1' });
    expect(next.inc).toHaveLength(0);
  });

  it('toggles income received status', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'TOGGLE_INC', payload: 'inc1' });
    expect(next.inc[0].got).toBe(true);
    expect(next.inc[0].rcvd).toBe(0);
  });

  it('toggles back and resets rcvd', () => {
    const state = { ...baseState(), inc: [{ id: 'inc1', name: 'Salário', val: 5000, got: true, rcvd: 5000 }] };
    const next = reduceD(state, { type: 'TOGGLE_INC', payload: 'inc1' });
    expect(next.inc[0].got).toBe(false);
    expect(next.inc[0].rcvd).toBe(0);
  });

  it('updates income value', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_INC_VAL', payload: { id: 'inc1', val: 5500 } });
    expect(next.inc[0].val).toBe(5500);
  });

  it('updates income received amount', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_INC_RCVD', payload: { id: 'inc1', rcvd: 2000 } });
    expect(next.inc[0].rcvd).toBe(2000);
  });
});

describe('reduceD — ADD_FIX / DEL_FIX / UPD_FIX_VAL', () => {
  it('adds fixed expense', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_FIX', payload: { id: 'fix2', name: 'Netflix', val: 55 } });
    expect(next.fix).toHaveLength(2);
  });

  it('deletes fixed expense', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'DEL_FIX', payload: 'fix1' });
    expect(next.fix).toHaveLength(0);
  });

  it('updates fixed expense value', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_FIX_VAL', payload: { id: 'fix1', val: 1300 } });
    expect(next.fix[0].val).toBe(1300);
  });
});

describe('reduceD — ADD_INST / DEL_INST', () => {
  it('adds installment', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_INST', payload: { id: 'inst2', name: 'Celular', pm: 300, end: '2027-06' } });
    expect(next.inst).toHaveLength(2);
  });

  it('deletes installment', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'DEL_INST', payload: 'inst1' });
    expect(next.inst).toHaveLength(0);
  });
});

describe('reduceD — ADD_RECV', () => {
  it('adds a standalone receivable', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'ADD_RECV', payload: { id: 'r1', name: 'Amigo', val: 50, got: false, dt: '2026-05-01' } });
    expect(next.recv).toHaveLength(1);
    expect(next.recv[0].val).toBe(50);
  });
});

describe('reduceD — TOGGLE_RECV', () => {
  it('marks receivable as received and increases balance', () => {
    const state = { ...baseState(), recv: [{ id: 'r1', name: 'Ressarcimento', val: 80, got: false, dt: '2026-04-01', txId: 'tx1' }] };
    const next = reduceD(state, { type: 'TOGGLE_RECV', payload: 'r1' });
    expect(next.recv[0].got).toBe(true);
    expect(next.bal).toBe(5080);
  });

  it('unmarks receivable and decreases balance', () => {
    const state = { ...baseState(), bal: 5080, recv: [{ id: 'r1', name: 'Ressarcimento', val: 80, got: true, dt: '2026-04-01', txId: 'tx1' }] };
    const next = reduceD(state, { type: 'TOGGLE_RECV', payload: 'r1' });
    expect(next.recv[0].got).toBe(false);
    expect(next.bal).toBe(5000);
  });

  it('ignores non-existent receivable id', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'TOGGLE_RECV', payload: 'nonexistent' });
    expect(next).toEqual(state);
  });
});

describe('reduceD — UPD_GOALS', () => {
  it('updates category goals and investGoal', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_GOALS', payload: { investGoal: 500, goals: { 1: 400, 2: 500 } } });
    expect(next.investGoal).toBe(500);
    expect(next.cats[0].goal).toBe(400);
    expect(next.cats[1].goal).toBe(500);
  });

  it('preserves unspecified category goals', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_GOALS', payload: { investGoal: 300, goals: { 1: 400 } } });
    expect(next.cats[1].goal).toBe(400);
  });
});

describe('reduceD — SNAPSHOT_MONTHLY', () => {
  it('replaces state with payload', () => {
    const state = baseState();
    const snapshot = { ...baseState(), bal: 9999 };
    const next = reduceD(state, { type: 'SNAPSHOT_MONTHLY', payload: snapshot });
    expect(next.bal).toBe(9999);
  });
});

describe('reduceD — unknown action', () => {
  it('returns state unchanged for unknown action type', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UNKNOWN_ACTION', payload: {} });
    expect(next).toEqual(state);
  });
});

describe('reduceD — UPD_CALC', () => {
  it('replaces the saldo calculator scratchpad', () => {
    const state = baseState();
    const next = reduceD(state, { type: 'UPD_CALC', payload: { accts: [{ id: 'a1', name: 'Banco', val: 10000 }], cards: [{ id: 'c1', name: 'Nubank', val: 2000 }] } });
    expect(next.calc.accts).toHaveLength(1);
    expect(next.calc.cards[0].val).toBe(2000);
  });

  it('defaults missing lists to empty arrays', () => {
    const next = reduceD(baseState(), { type: 'UPD_CALC', payload: {} });
    expect(next.calc.accts).toEqual([]);
    expect(next.calc.cards).toEqual([]);
  });
});

describe('applyRollover — histórico mensal e calculadora', () => {
  // lastMonth no passado passado força o rollover independente da data real
  const pastState = () => ({ ...baseState(), lastMonth: '2000-01', bal: 7777, res: 500 });

  it('archives the closing month into hist (metas, reserva, bal, pote)', () => {
    const next = applyRollover(pastState());
    expect(next.hist).toHaveLength(1);
    const rec = next.hist[0];
    expect(rec.m).toBe('2000-01');
    expect(rec.cats).toEqual({ 1: 300, 2: 400 });
    expect(rec.res).toBe(500);
    expect(rec.bal).toBe(7777);
    expect(rec.inv).toBe(1000);
  });

  it('resets the calculator scratchpad and zeroes bal', () => {
    const state = { ...pastState(), calc: { accts: [{ id: 'a1', name: 'X', val: 1 }], cards: [] } };
    const next = applyRollover(state);
    expect(next.calc).toEqual({ accts: [], cards: [] });
    expect(next.bal).toBe(0);
  });

  it('appends to existing hist and caps at 36 entries', () => {
    const oldHist = Array.from({ length: 36 }, (_, i) => ({ m: `1990-${String((i % 12) + 1).padStart(2, '0')}`, cats: {}, res: 0, bal: 0, inv: 0 }));
    const next = applyRollover({ ...pastState(), hist: oldHist });
    expect(next.hist).toHaveLength(36);
    expect(next.hist.at(-1).m).toBe('2000-01');
  });

  it('keeps hist when no rollover is due', () => {
    const state = { ...baseState(), lastMonth: nowYM(), hist: [{ m: '2026-05', cats: {}, res: 1, bal: 0, inv: 0 }] };
    expect(applyRollover(state)).toBe(state);
  });
});