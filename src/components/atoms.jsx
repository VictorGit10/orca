import { useState } from 'react';
import { P } from '../palette.js';
import { BRL } from '../utils.js';

export function Sw({ on, change, yes = 'Pago', no = 'Pendente' }) {
  return (
    <button onClick={change} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 }}>
      <div style={{ width: 40, height: 22, borderRadius: 11, background: on ? P.g : P.card3, border: `1px solid ${on ? P.g : P.bd2}`, position: 'relative', transition: 'background .25s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.32,.72,0,1)', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
      </div>
      <span style={{ fontSize: 10, color: on ? P.gb : P.dim, fontWeight: 600, whiteSpace: 'nowrap', transition: 'color .2s' }}>{on ? yes : no}</span>
    </button>
  );
}

export const Row = ({ a, b, sx = {} }) =>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, ...sx }}>
    <div style={{ minWidth: 0, flex: 1, wordBreak: 'break-word' }}>{a}</div>
    <div style={{ flexShrink: 0 }}>{b}</div>
  </div>;

export const Lbl = ({ t, sx = {} }) =>
  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 9, ...sx }}>{t}</div>;

export const Hr = ({ my = 10, color = P.bd }) =>
  <div style={{ height: 1, background: color, margin: `${my}px 0` }} />;

export const Box = ({ children, sx = {} }) =>
  <div style={{ background: P.card, borderRadius: 16, padding: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', ...sx }}>{children}</div>;


export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 0', color: P.dim }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

export function EditField({ value, onSave, color = P.text, suffix = '' }) {
  const [ed, setEd] = useState(false);
  const [tmp, setTmp] = useState('');
  const save = () => {
    const v = parseFloat(tmp.replace(',', '.'));
    if (!isNaN(v)) onSave(v);
    setEd(false);
  };
  if (ed) return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input autoFocus type="number" value={tmp} onChange={e => setTmp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEd(false); }} style={{ flex: 1, minWidth: 80, maxWidth: 120, background: P.card, border: `1px solid ${P.bd2}`, borderRadius: 8, padding: '7px 10px', color: P.text, fontSize: 14, fontWeight: 700 }} />
      <button onClick={save} style={{ border: 'none', borderRadius: 8, background: P.g, color: '#fff', padding: '7px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>&#10003;</button>
      <button onClick={() => setEd(false)} style={{ border: `1px solid ${P.bd}`, borderRadius: 8, background: P.card2, color: P.dim, padding: '7px 10px', cursor: 'pointer' }}>&#10005;</button>
    </div>
  );
  return (
    <button onClick={() => { setTmp(String(value)); setEd(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
      <span style={{ fontWeight: 700, fontSize: 15, color, fontVariantNumeric: 'tabular-nums' }}>{BRL(value)}{suffix}</span>
      <span style={{ fontSize: 11, color: P.bl, marginLeft: 8 }}>editar</span>
    </button>
  );
}

export function HeroAmount({ value, color, size = 48 }) {
  const raw = BRL(value);
  const neg = value < 0;
  const symbol = neg ? '-R$' : 'R$';
  const match = raw.replace(/[^0-9.,-]/g, '').replace('-', '').split(',');
  const numeric = match[0] || '0';
  const decimalPart = match[1] != null ? `,${match[1]}` : ',00';
  return (
    <div style={{ color, display: 'flex', alignItems: 'baseline', justifyContent: 'center', lineHeight: 1 }}>
      <span style={{ fontSize: size * 0.45, fontWeight: 700, marginRight: 2, letterSpacing: 0, opacity: 0.8 }}>{symbol}</span>
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{numeric}</span>
      <span style={{ fontSize: size * 0.45, fontWeight: 700, opacity: 0.7, marginLeft: 1 }}>{decimalPart}</span>
    </div>
  );
}