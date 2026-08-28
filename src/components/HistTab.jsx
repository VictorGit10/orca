import { useState, useMemo } from 'react';
import { P } from '../palette.js';
import { BRL, fmtDate, nowYM } from '../utils.js';
import { Row, Box, EmptyState } from './atoms.jsx';

function dayLabel(dt) {
  const today = new Date(); today.setHours(12);
  const d = new Date(dt + 'T12:00:00');
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return fmtDate(dt);
}

export function HistTab({ D, dispatch, onEditTx, selCat, setSelCat }) {
  const months = useMemo(() => {
    const s = new Set(D.txs.map(t => t.dt.slice(0, 7)));
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [D.txs]);

  const [selMon, setSelMon] = useState(nowYM());

  const filtered = useMemo(() => D.txs.filter(t => t.dt.startsWith(selMon) && (selCat === 0 || t.cat === selCat)).sort((a, b) => b.dt.localeCompare(a.dt) || b.id - a.id), [D.txs, selMon, selCat]);
  const catMap = Object.fromEntries(D.cats.map(c => [c.id, c]));

  const groups = useMemo(() => {
    const m = new Map();
    filtered.forEach(t => { const k = t.dt; if (!m.has(k)) m.set(k, []); m.get(k).push(t); });
    return m;
  }, [filtered]);

  return (<div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24, marginTop: 20 }}>
    <div style={{ overflowX: 'auto', display: 'flex', gap: 12, paddingBottom: 4, width: '100%', minWidth: 0, scrollbarWidth: 'none' }}>
      {months.length === 0 && <span style={{ fontSize: 13, color: P.dim }}>Sem transações</span>}
      {months.map(m => {
        const lbl = new Date(m + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
        return <button key={m} onClick={() => setSelMon(m)} style={{ border: 'none', borderRadius: 12, background: selMon === m ? '#0f766e' : P.card, color: selMon === m ? '#fff' : P.text, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: selMon === m ? 700 : 500, textTransform: 'capitalize', transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', flexShrink: 0 }}>{lbl}</button>;
      })}
    </div>
    <div style={{ overflowX: 'auto', display: 'flex', gap: 10, paddingBottom: 4, width: '100%', minWidth: 0, scrollbarWidth: 'none' }}>
      <button onClick={() => setSelCat(0)} style={{ flexShrink: 0, border: `1px solid ${P.bd2}`, borderRadius: 20, background: selCat === 0 ? P.card2 : 'transparent', color: P.dim, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', transition: 'all .2s' }}>Tudo</button>
      <button onClick={() => setSelCat(-1)} style={{ flexShrink: 0, border: `1px solid ${P.inv}40`, borderRadius: 20, background: selCat === -1 ? `${P.inv}10` : 'transparent', color: P.dim, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: P.inv }} />Investim.</button>
      {D.cats.map(c => <button key={c.id} onClick={() => setSelCat(c.id)} style={{ flexShrink: 0, border: `1px solid ${c.hue}40`, borderRadius: 20, background: selCat === c.id ? `${c.hue}10` : 'transparent', color: P.dim, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: c.hue }} />{c.name}</button>)}
    </div>

    {filtered.length === 0 ? <EmptyState icon="🔍" text="Nenhuma transação neste período" /> : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[...groups].map(([dt, txs]) => (
          <div key={dt}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#475569', marginBottom: 16, paddingLeft: 4 }}>{dayLabel(dt).toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {txs.map(t => { 
                const c = t.cat === -1 ? { name: 'Investimento', hue: P.inv } : catMap[t.cat]; 
                return (
                <div key={t.id} style={{ background: P.card, borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: P.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#475569' }}>receipt_long</span>
                      <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: c?.hue || P.dim, border: '2px solid #fff' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{c?.name || '—'}</span>
                        {t.reemb && (
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6, background: `${P.ab}15`, color: P.ab }}>Reembolsável</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{t.note || 'Despesa'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: P.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>- {BRL(t.val)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                    <button onClick={() => onEditTx(t)} style={{ background: 'none', border: 'none', color: P.dim, cursor: 'pointer', fontSize: 18, padding: 4, display: 'flex', alignItems: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                    </button>
                    <button onClick={() => dispatch({ type: 'DEL_TX', payload: t })} style={{ background: 'none', border: 'none', color: P.bd2, cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
                  </div>
                </div>
              ); })}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>);
}