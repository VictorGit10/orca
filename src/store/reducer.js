import { nowYM } from '../utils.js';

export const STORAGE_KEY = 'orca-data';
export const QUEUE_KEY = 'orca-queue';

export let CLIENT_ID = (() => {
  try {
    const stored = localStorage.getItem('orca-client-id');
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem('orca-client-id', id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
})();

export const FAMILY_ID = import.meta.env.VITE_SUPABASE_FAMILY_ID || 'familia-padrao';

export function applyRollover(data) {
  const ym = nowYM();
  if (data.lastMonth === ym) return data;
  // Snapshot do mês que está encerrando (metas/reserva da época não são
  // reconstruíveis depois — sem isso a aba Análise não teria histórico).
  const histRec = {
    m: data.lastMonth,
    cats: Object.fromEntries((data.cats || []).map(c => [c.id, c.goal])),
    res: data.res || 0,
    bal: data.bal || 0,
    inv: data.investAcumulado || 0,
  };
  const rolled = {
    ...data,
    hist: [...(data.hist || []), histRec].slice(-36),
    calc: { accts: [], cards: [] }, // calculadora de saldo é rascunho do mês
    lastMonth: ym,
    bal: 0,
    inc: data.inc.map(i => ({ ...i, got: false, rcvd: 0 })),
    fix: data.fix,
    recv: data.recv.filter(r => !r.got).map(r => ({ ...r, got: false })),
    investAcumulado: (data.investAcumulado || 0) + (data.investGoal || 0),
    investGoal: data.investGoal || 0,
  };

  return rolled;
}

export function reduceD(prev, action) {
  let next = { ...prev };
  switch (action.type) {
    case 'ADD_TX': {
      const form = action.payload;
      const v = parseFloat(form.val);
      if (!v || isNaN(v)) return prev;
      const newId = action.payload.id || crypto.randomUUID();
      if (prev.txs.some(t => t.id === newId)) return prev;
      const isInvest = form.cat === -1;
      next.investAcumulado = isInvest ? Math.max(0, (prev.investAcumulado || 0) - v) : prev.investAcumulado;
      next.txs = [{ id: newId, dt: form.dt, cat: form.cat, val: v, note: form.note, reemb: form.reemb || false }, ...prev.txs];
      if (form.reemb) {
        next.recv = [{ id: crypto.randomUUID(), name: form.note || 'Ressarcimento', val: v, got: false, dt: form.dt, txId: newId }, ...prev.recv];
      }
      break;
    }
    case 'DEL_TX': {
      const t = action.payload;
      if (!prev.txs.some(x => x.id === t.id)) return prev;
      next.investAcumulado = t.cat === -1 ? (prev.investAcumulado || 0) + t.val : prev.investAcumulado;
      next.txs = prev.txs.filter(x => x.id !== t.id);
      if (t.reemb) {
        next.recv = prev.recv.filter(r => r.txId !== t.id);
      }
      break;
    }
    case 'UPD_TX': {
      const { id, dt, cat, val, note, reemb } = action.payload;
      const v = parseFloat(val);
      if (!v || isNaN(v)) return prev;
      const old = prev.txs.find(t => t.id === id);
      if (!old) return prev;
      const oldIsInv = old.cat === -1;
      const newIsInv = cat === -1;
      if (oldIsInv && newIsInv) {
        next.investAcumulado = Math.max(0, (prev.investAcumulado || 0) + old.val - v);
      } else if (oldIsInv) {
        next.investAcumulado = (prev.investAcumulado || 0) + old.val;
      } else if (newIsInv) {
        next.investAcumulado = Math.max(0, (prev.investAcumulado || 0) - v);
      }
      next.txs = prev.txs.map(t =>
        t.id === id ? { id, dt, cat, val: v, note, reemb: reemb || false } : t
      );
      const wasReemb = old.reemb;
      const isReemb = reemb || false;
      if (!wasReemb && isReemb) {
        next.recv = [{ id: crypto.randomUUID(), name: note || 'Ressarcimento', val: v, got: false, dt, txId: id }, ...prev.recv];
      } else if (wasReemb && !isReemb) {
        next.recv = prev.recv.filter(r => r.txId !== id);
      } else if (wasReemb && isReemb) {
        next.recv = next.recv.map(r => r.txId === id ? { ...r, name: note || 'Ressarcimento', val: v, dt } : r);
      }
      break;
    }
    case 'IMPORT_DATA':
      next = applyRollover(action.payload);
      break;
    case 'UPD_BAL':
      next.bal = action.payload;
      break;
    case 'UPD_CALC':
      next.calc = { accts: action.payload.accts || [], cards: action.payload.cards || [] };
      break;
    case 'UPD_INVEST_GOAL':
      next.investGoal = action.payload;
      break;
    case 'UPD_INVEST_ACUMULADO':
      next.investAcumulado = action.payload;
      break;
    case 'UPD_RES':
      next.res = action.payload;
      break;
    case 'ADD_INC': {
      const id = action.payload.id || crypto.randomUUID();
      if (prev.inc.some(x => x.id === id)) return prev;
      next.inc = [...prev.inc, { ...action.payload, id }];
      break;
    }
    case 'ADD_FIX': {
      const id = action.payload.id || crypto.randomUUID();
      if (prev.fix.some(x => x.id === id)) return prev;
      next.fix = [...prev.fix, { ...action.payload, id }];
      break;
    }
    case 'ADD_INST': {
      const id = action.payload.id || crypto.randomUUID();
      if (prev.inst.some(x => x.id === id)) return prev;
      next.inst = [...prev.inst, { ...action.payload, id }];
      break;
    }
    case 'ADD_RECV': {
      const id = action.payload.id || crypto.randomUUID();
      if (prev.recv.some(x => x.id === id)) return prev;
      next.recv = [...prev.recv, { ...action.payload, id }];
      break;
    }
    case 'UPD_GOALS': {
      next.investGoal = action.payload.investGoal;
      next.cats = prev.cats.map(c => ({ ...c, goal: action.payload.goals[c.id] ?? c.goal }));
      break;
    }
    case 'DEL_INC': { if (!prev.inc.some(x => x.id === action.payload)) return prev; next.inc = prev.inc.filter(x => x.id !== action.payload); break; }
    case 'DEL_FIX': { if (!prev.fix.some(x => x.id === action.payload)) return prev; next.fix = prev.fix.filter(x => x.id !== action.payload); break; }
    case 'DEL_INST': { if (!prev.inst.some(x => x.id === action.payload)) return prev; next.inst = prev.inst.filter(x => x.id !== action.payload); break; }
    case 'UPD_INC_VAL': next.inc = prev.inc.map(x => x.id === action.payload.id ? { ...x, val: action.payload.val } : x); break;
    case 'TOGGLE_INC': next.inc = prev.inc.map(x => x.id === action.payload ? { ...x, got: !x.got, rcvd: x.got ? 0 : x.rcvd } : x); break;
    case 'UPD_INC_RCVD': next.inc = prev.inc.map(x => x.id === action.payload.id ? { ...x, rcvd: action.payload.rcvd } : x); break;
    case 'UPD_FIX_VAL': next.fix = prev.fix.map(x => x.id === action.payload.id ? { ...x, val: action.payload.val } : x); break;

    case 'DEL_RECV': { if (!prev.recv.some(x => x.id === action.payload)) return prev; next.recv = prev.recv.filter(x => x.id !== action.payload); break; }
    case 'TOGGLE_RECV': {
      const r = prev.recv.find(x => x.id === action.payload);
      if (!r) return prev;
      const newGot = !r.got;
      next.recv = prev.recv.map(x => x.id === action.payload ? { ...x, got: newGot } : x);
      next.bal = newGot ? prev.bal + r.val : prev.bal - r.val;
      break;
    }
    case 'SNAPSHOT_MONTHLY': next = action.payload; break;
    default: return prev;
  }
  return next;
}