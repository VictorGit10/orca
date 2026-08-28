import { useState } from 'react';
import { P } from '../palette.js';
import { BRL } from '../utils.js';
import { Row } from './atoms.jsx';

const uid = () => crypto.randomUUID();

function LineList({ items, onChange, ph, accent }) {
  const upd = (id, field, v) => onChange(items.map(it => it.id === id ? { ...it, [field]: v } : it));
  const del = id => onChange(items.filter(it => it.id !== id));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(it => (
        <div key={it.id} style={{ background: P.card, borderRadius: 10, padding: '8px 12px', border: `1px solid ${P.bd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="text" value={it.name} placeholder={ph} onChange={e => upd(it.id, 'name', e.target.value)} style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: P.text }} />
          <span style={{ fontSize: 12, color: P.dim }}>R$</span>
          <input type="number" inputMode="decimal" value={it.val ?? ''} onChange={e => upd(it.id, 'val', e.target.value === '' ? '' : parseFloat(e.target.value))} style={{ width: 76, textAlign: 'right', background: 'transparent', border: 'none', borderBottom: `1.5px solid ${P.bd2}`, outline: 'none', fontSize: 15, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }} />
          <button onClick={() => del(it.id)} style={{ background: 'none', border: 'none', color: P.bd2, cursor: 'pointer', fontSize: 15, padding: 2, lineHeight: 1 }}>✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { id: uid(), name: '', val: '' }])} style={{ alignSelf: 'flex-start', background: 'none', border: `1px dashed ${P.bd2}`, borderRadius: 10, color: P.dim, padding: '8px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>+ Adicionar</button>
    </div>
  );
}

export function SaldoCalcModal({ D, dispatch, onClose }) {
  const calc = D.calc || { accts: [], cards: [] };
  const [accts, setAccts] = useState(calc.accts.map(a => ({ ...a })));
  const [cards, setCards] = useState(calc.cards.map(c => ({ ...c })));

  const sum = list => list.reduce((s, it) => s + (parseFloat(it.val) || 0), 0);
  const totAccts = sum(accts);
  const totCards = sum(cards);
  const result = totAccts - totCards;
  const hasEntries = accts.length > 0 || cards.length > 0;

  const persist = (apply) => {
    const clean = list => list
      .filter(it => String(it.name).trim() || parseFloat(it.val))
      .map(it => ({ id: it.id, name: String(it.name).trim() || '—', val: parseFloat(it.val) || 0 }));
    const payload = { accts: clean(accts), cards: clean(cards) };
    dispatch({ type: 'UPD_CALC', payload });
    if (apply && hasEntries) dispatch({ type: 'UPD_BAL', payload: result });
    onClose();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }} onClick={() => persist(false)}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: P.bg, borderRadius: '22px 22px 0 0', width: '100%', padding: '8px 20px 32px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 12px' }}>
          <div style={{ width: 36, height: 4, background: P.bd2, borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: P.text }}>Calculadora de Saldo</div>
          <button onClick={() => persist(false)} style={{ width: 36, height: 36, borderRadius: '50%', background: P.card2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.dim, fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: P.dim, marginBottom: 20 }}>Some o que tem nas contas e subtraia as faturas dos cartões — sem calculadora.</div>

        {/* Resultado */}
        <div style={{ borderRadius: 14, padding: '20px 16px', marginBottom: 20, background: P.card, border: `1px solid ${P.bd}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 8 }}>Saldo a informar</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: result < 0 ? P.rb : P.g, letterSpacing: -1.4, fontVariantNumeric: 'tabular-nums' }}>{BRL(result)}</div>
          <div style={{ fontSize: 12, color: P.dim, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {BRL(totAccts)} em contas − {BRL(totCards)} em faturas
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 10 }}>Contas (+)</div>
        <LineList items={accts} onChange={setAccts} ph="Ex.: Banco principal" accent={P.gb} />

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, margin: '20px 0 10px' }}>Faturas de cartão (−)</div>
        <LineList items={cards} onChange={setCards} ph="Ex.: Nubank" accent={P.rb} />

        <button onClick={() => persist(true)} style={{ width: '100%', marginTop: 24, border: 'none', borderRadius: 12, background: `linear-gradient(135deg, ${P.g}, ${P.gb})`, color: '#fff', padding: 16, cursor: 'pointer', fontWeight: 800, fontSize: 16, boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Usar este saldo ✓
        </button>
        {!hasEntries && <div style={{ fontSize: 11.5, color: P.dim2, textAlign: 'center', marginTop: 8 }}>Adicione ao menos uma conta para aplicar</div>}
      </div>
    </div>
  );
}