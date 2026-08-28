import { describe, it, expect } from 'vitest';
import { SEED } from '../seed.js';
import { calcSaldo, calcTotFix, calcTotInst, calcTotInc, calcTotPendRecv, calcSumGoals, nowYM } from '../utils.js';

// O SEED vai inteiro para o bundle público (a demo do GitHub Pages). Estes
// testes existem para que dados reais de alguém nunca voltem a entrar aqui sem
// que alguém perceba, e para que a demo abra numa tela que faça sentido.
describe('SEED (dados da demo pública)', () => {
  it('não carrega nada que identifique uma pessoa real', () => {
    const nomes = [
      ...SEED.cats.map(c => c.name),
      ...SEED.fix.map(f => f.name),
      ...SEED.inc.map(i => i.name),
      ...SEED.txs.map(t => t.note || ''),
    ].join(' ').toLowerCase();

    // Planos de saúde, convênios e instituições denunciam cidade/empregador
    for (const termo of ['ipasgo', 'unimed', 'ufg', 'bradesco saúde', 'amil']) {
      expect(nomes, `"${termo}" não deve aparecer na demo`).not.toContain(termo);
    }
  });

  it('abre com todas as seções povoadas', () => {
    expect(SEED.cats.length).toBeGreaterThanOrEqual(3);
    expect(SEED.fix.length).toBeGreaterThanOrEqual(3);
    expect(SEED.inc.length).toBeGreaterThanOrEqual(1);
    expect(SEED.inst.length).toBeGreaterThanOrEqual(1);
    expect(SEED.txs.length).toBeGreaterThanOrEqual(10);
  });

  it('tem meses fechados no histórico, para a aba Análise não abrir vazia', () => {
    const mesesComTx = new Set(SEED.txs.map(t => t.dt.slice(0, 7)));
    expect(SEED.hist.length).toBeGreaterThanOrEqual(2);
    for (const h of SEED.hist) {
      expect(mesesComTx.has(h.m), `hist tem ${h.m} mas não há transações nesse mês`).toBe(true);
      expect(h.m < nowYM(), `hist não pode conter o mês corrente (${h.m})`).toBe(true);
    }
    // e o mês corrente precisa ter movimento, senão a tela inicial abre zerada
    expect(mesesComTx.has(nowYM())).toBe(true);
  });

  it('as datas acompanham o calendário — a demo não envelhece', () => {
    const meses = [...new Set(SEED.txs.map(t => t.dt.slice(0, 7)))].sort();
    expect(meses.at(-1)).toBe(nowYM());
    // parcelas precisam ter fim no futuro, senão não entram no cálculo
    for (const p of SEED.inst) expect(p.end > nowYM(), `parcela "${p.name}" já venceu`).toBe(true);
  });

  it('abre com saldo livre positivo e um pouco acima da soma das metas', () => {
    const [cm, ca] = [new Date().getMonth(), new Date().getFullYear()];
    const saldo = calcSaldo(
      SEED.bal,
      calcTotInc(SEED.inc),
      calcTotFix(SEED.fix),
      SEED.res,
      calcTotInst(SEED.inst),
      SEED.investAcumulado,
      calcTotPendRecv(SEED.recv, cm, ca)
    );
    const metas = calcSumGoals(SEED.cats);
    // Um saldo negativo, ou uma folga grande demais, faria a demo passar a
    // impressão errada logo na primeira tela.
    expect(saldo).toBeGreaterThan(0);
    expect(saldo - metas).toBeGreaterThan(0);
    expect(saldo - metas).toBeLessThan(1000);
  });
});
