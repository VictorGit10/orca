export const BRL = v =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export const ISO = () => new Date().toISOString().slice(0, 10);

export const fmtDate = d =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export const mLeft = end => {
  const [y, m] = end.split('-').map(Number);
  const n = new Date();
  return Math.max(0, (y - n.getFullYear()) * 12 + (m - 1 - n.getMonth()) + 1);
};

export const nowYM = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

export const calcSpent = (txs, cats, cm, ca) => {
  const a = {};
  cats.forEach(c => (a[c.id] = 0));
  txs.forEach(t => {
    const d = new Date(t.dt + 'T12:00:00');
    if (t.cat !== -1 && !t.reemb && d.getMonth() === cm && d.getFullYear() === ca)
      a[t.cat] = (a[t.cat] || 0) + t.val;
  });
  return a;
};

export const calcTotFix = fix => fix.reduce((s, g) => s + g.val, 0);

export const calcTotInst = inst => inst.reduce((s, p) => s + p.pm * mLeft(p.end), 0);

export const calcTotInc = inc => inc.reduce((s, e) => {
  if (e.got) return s;
  return s + Math.max(0, e.val - (e.rcvd || 0));
}, 0);

export const calcSumGoals = cats => cats.reduce((s, c) => s + c.goal, 0);

export const calcTotPendRecv = (recv, cm, ca) =>
  recv.reduce((s, r) => {
    if (r.got) return s;
    if (!r.dt) return s;
    const d = new Date(r.dt + 'T12:00:00');
    const isCurrentMonth = d.getMonth() === cm && d.getFullYear() === ca;
    return isCurrentMonth ? s : s + r.val;
  }, 0);

export const calcSaldo = (bal, totInc, totFix, res, totInst, investReserve, totPendRecv) =>
  bal + totInc + (totPendRecv || 0) - totFix - res - totInst - (investReserve || 0);

// Total gasto num mês (mesma regra do calcSpent: exclui investimento e reembolsáveis)
export const calcMonthTotal = (txs, cm, ca) =>
  txs.reduce((s, t) => {
    const d = new Date(t.dt + 'T12:00:00');
    if (t.cat !== -1 && !t.reemb && d.getMonth() === cm && d.getFullYear() === ca) return s + t.val;
    return s;
  }, 0);

// Mês anterior a um 'YYYY-MM'
export const prevYM = ym => {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

// Reconstrói registros de histórico mensal a partir de snapshots do Supabase.
//
// Um SNAPSHOT_MONTHLY é gravado DEPOIS do rollover, então seu payload já é o
// estado do mês novo: `payload.lastMonth` é o mês que está começando e o mês
// que ele de fato descreve (metas e reserva vigentes) é o ANTERIOR. Snapshots
// gravados pela v1.2+ já trazem `payload.hist` pronto — nesses, usamos o
// histórico embutido em vez de reconstruir.
export const histFromSnaps = snaps =>
  (snaps || []).flatMap(s => {
    const p = s.payload || {};
    if (Array.isArray(p.hist) && p.hist.length) return p.hist.filter(h => h && h.m);
    if (!p.lastMonth) return [];
    return [{
      m: prevYM(p.lastMonth),
      cats: Object.fromEntries((p.cats || []).map(c => [c.id, c.goal])),
      res: p.res || 0,
      bal: p.bal || 0,
      inv: p.investAcumulado || 0,
    }];
  });

// Mescla históricos por mês (base local vence extra/snapshot em caso de
// divergência) — mais antigo primeiro, cap 36. `minM` descarta meses anteriores
// ao início real dos dados, evitando meses fantasma vindos do backfill.
export const mergeHist = (base, extra, minM) => {
  const map = new Map((extra || []).filter(h => h && h.m).map(h => [h.m, h]));
  (base || []).filter(h => h && h.m).forEach(h => map.set(h.m, h));
  return [...map.values()]
    .filter(h => !minM || h.m >= minM)
    .sort((a, b) => a.m.localeCompare(b.m))
    .slice(-36);
};

// Escolhe o snapshot que serve de baseline. Normalmente é o mais recente, mas
// um snapshot pode ter sido gravado a partir de um estado local incompleto
// (ex.: aparelho que abriu o app antes de terminar o catch-up). Um baseline
// desses "congela" o app num passado errado, então rejeitamos o candidato
// quando um snapshot MAIS ANTIGO tem mais que o dobro das transações dele.
export const pickBaseline = snaps => {
  const ord = [...(snaps || [])].sort((a, b) => Number(b.device_ts) - Number(a.device_ts));
  const nTx = s => (s?.payload?.txs || []).length;
  for (let i = 0; i < ord.length; i++) {
    const older = ord.slice(i + 1);
    if (!older.some(o => nTx(o) > nTx(ord[i]) * 2 + 1)) return ord[i];
  }
  return ord[0] || null;
};
