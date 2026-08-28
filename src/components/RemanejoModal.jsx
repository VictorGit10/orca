import { useState } from 'react';
import { P } from '../palette.js';
import { BRL } from '../utils.js';
import { Row, Hr } from './atoms.jsx';

function InputNum({ val, onChange, color = P.text }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ fontSize: 13, color: P.dim, fontWeight: 500 }}>R$</span>
    <input type="number" inputMode="decimal" value={val || ''} onChange={e => onChange(e.target.value)} style={{ width: 72, textAlign: 'right', background: 'transparent', border: 'none', borderBottom: `1.5px solid ${P.bd2}`, borderRadius: 0, padding: '4px 2px', fontSize: 15, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', outline: 'none', transition: 'border-color .2s' }} onFocus={e => e.target.style.borderBottomColor = color} onBlur={e => e.target.style.borderBottomColor = P.bd2} />
  </div>;
}

export function RemanejoModal({ D, dispatch, saldo, onClose }) {
  const [goals, setGoals] = useState(() => Object.fromEntries(D.cats.map(c => [c.id, c.goal])));
  const [invest, setInvest] = useState(D.investGoal || 0);

  const sumG = Object.values(goals).reduce((s, v) => s + (v || 0), 0);
  const totalAllocated = sumG + invest;
  const baseLivre = saldo;
  const remaining = baseLivre - totalAllocated;
  const remColor = Math.abs(remaining) < 0.5 ? P.text : remaining > 0 ? P.ab : P.rb;

  const adj = (id, val) => {
    const n = Math.max(0, parseFloat(val || 0));
    setGoals(g => ({ ...g, [id]: n }));
  };

  const save = () => {
    dispatch({ type: 'UPD_GOALS', payload: { investGoal: invest, goals } });
    onClose();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: P.bg, borderRadius: '22px 22px 0 0', width: '100%', padding: '8px 20px 32px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 12px' }}>
          <div style={{ width: 36, height: 4, background: P.bd2, borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: P.text }}>Distribuir Saldo</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: P.card2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.dim, fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: P.dim, marginBottom: 20 }}>Defina as metas do mês atual.</div>

        <div style={{ borderRadius: 14, padding: '20px 16px', marginBottom: 20, background: P.card, border: `1px solid ${P.bd}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 8 }}>Total disponível para alocar</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: P.g, letterSpacing: -1.5, fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>{BRL(baseLivre)}</div>
          <Hr my={0} />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: P.dim }}>{remaining > 0 ? 'Ainda não alocado' : remaining < 0 ? 'Estourado' : 'Tudo alocado!'}</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: remColor, fontVariantNumeric: 'tabular-nums', transition: 'color .2s' }}>{BRL(remaining)}</span>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 10 }}>Metas de Gastos</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {D.cats.map(c => (
            <div key={c.id} style={{ background: P.card, borderRadius: 10, padding: '10px 14px', border: `1px solid ${P.bd}` }}>
              <Row
                a={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: c.hue }} /><span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span></div>}
                b={<InputNum val={goals[c.id]} onChange={v => adj(c.id, v)} color={c.hue} />}
              />
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 10 }}>Meta de Investimento</div>
        <div style={{ background: P.card, borderRadius: 10, padding: '10px 14px', border: `1.5px solid ${P.inv}30`, marginBottom: 24 }}>
          <Row
            a={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: P.inv }} /><span style={{ fontWeight: 700, fontSize: 13, color: P.inv }}>Pote de Investimentos</span></div>}
            b={<InputNum val={invest} onChange={v => setInvest(Math.max(0, parseFloat(v || 0)))} color={P.inv} />}
          />
        </div>

        <button onClick={save} style={{ width: '100%', border: 'none', borderRadius: 12, background: `linear-gradient(135deg, ${P.g}, ${P.gb})`, color: '#fff', padding: 16, cursor: 'pointer', fontWeight: 800, fontSize: 16, boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Salvar distribuição ✓</button>
      </div>
    </div>
  );
}