import { useState } from 'react';
import { P } from '../palette.js';
import { BRL } from '../utils.js';
import { HeroAmount, EditField, Hr, Lbl } from './atoms.jsx';
import { SaldoCalcModal } from './SaldoCalcModal.jsx';
import { GastosFixosSection } from './GastosFixosSection.jsx';
import { EntradasSection } from './EntradasSection.jsx';

const line = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' };
const lbl = { fontSize: 15, color: '#475569' };
const valGreen = { fontWeight: 700, fontSize: 15, color: P.gb, fontVariantNumeric: 'tabular-nums' };
const valRed = { fontWeight: 700, fontSize: 15, color: P.rb, fontVariantNumeric: 'tabular-nums' };

function ResultLine({ label, value, style = {} }) {
  return (
    <div style={{ ...line, padding: '12px 0', borderTop: `1px solid ${P.bd}`, marginTop: 4, ...style }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: P.text }}>{label}</span>
      <span style={{ fontWeight: 800, fontSize: 16, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{BRL(value)}</span>
    </div>
  );
}

function ReservaCard({ value, onSave }) {
  const [ed, setEd] = useState(false);
  const [tmp, setTmp] = useState('');
  const save = () => {
    const v = parseFloat(tmp.replace(',', '.'));
    if (!isNaN(v)) onSave(v);
    setEd(false);
  };
  return (
    <div className="fade-up" style={{ borderRadius: 24, padding: '32px 24px', background: '#0d9488', color: '#fff', textAlign: 'center', boxShadow: '0 12px 32px rgba(13, 148, 136, 0.3)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .9, marginBottom: 12 }}>
        Reserva de Emergência
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', lineHeight: 1, marginBottom: 24 }}>
        {ed ? (
          <input autoFocus type="number" value={tmp} onChange={e => setTmp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEd(false); }} style={{ width: 160, textAlign: 'center', background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 12, padding: '8px 12px', color: '#fff', fontSize: 32, fontWeight: 800, fontVariantNumeric: 'tabular-nums', outline: 'none' }} />
        ) : (
          <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{BRL(value)}</span>
        )}
      </div>
      {ed ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} style={{ flex: 1, border: 'none', borderRadius: 12, background: '#fff', color: '#0d9488', padding: '16px', cursor: 'pointer', fontWeight: 800, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>Salvar</button>
          <button onClick={() => setEd(false)} style={{ flex: 1, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '16px', cursor: 'pointer', fontWeight: 800, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>Cancelar</button>
        </div>
      ) : (
        <button onClick={() => { setTmp(String(value)); setEd(true); }} style={{ width: '100%', border: 'none', borderRadius: 12, background: '#fff', color: '#0d9488', padding: '16px', cursor: 'pointer', fontWeight: 800, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>
          Ajustar Reserva
        </button>
      )}
    </div>
  );
}

export function SaldoTab({ D, dispatch, totFix, totInst, totInc, totPendRecv, saldo, sumGoals, onGastoInv }) {
  const investGoal = D.investGoal || 0;
  const investAcumulado = D.investAcumulado || 0;
  const unalloc = saldo - sumGoals - investGoal;
  const totalDisponivel = D.bal + totInc + (totPendRecv || 0);
  const [calcOpen, setCalcOpen] = useState(false);

  return (<div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

    {/* DERIVACAO DO SALDO LIVRE */}
    <div style={{ background: P.card, borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
      <Lbl t="Derivação do Saldo Livre" sx={{ marginBottom: 12 }} />

      {/* Saldo informado */}
      <div style={line}>
        <span style={lbl}>Saldo informado</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setCalcOpen(true)} title="Calculadora: contas − faturas" style={{ background: `${P.bl}12`, border: 'none', borderRadius: 8, color: P.bl, cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>calculate</span>Calc
          </button>
          <EditField value={D.bal} onSave={v => dispatch({ type: 'UPD_BAL', payload: v })} color={P.text} />
        </div>
      </div>

      {/* + Entradas */}
      <div style={line}>
        <span style={lbl}>Entradas do mês</span>
        <span style={valGreen}>+ {BRL(totInc)}</span>
      </div>

      {/* + Ressarcimentos pendentes (condicional) */}
      {totPendRecv > 0 && (
        <div style={line}>
          <span style={lbl}>Ressarcimentos pendentes</span>
          <span style={valGreen}>+ {BRL(totPendRecv)}</span>
        </div>
      )}

      {/* = Total disponivel */}
      <ResultLine label="= Total disponível" value={totalDisponivel} />

      <Hr my={4} color={P.card3} />

      {/* − Despesas fixas */}
      <div style={line}>
        <span style={lbl}>Despesas fixas</span>
        <span style={valRed}>− {BRL(totFix)}</span>
      </div>

      {/* − Reserva */}
      <div style={line}>
        <span style={lbl}>Reserva de emergência</span>
        <span style={valRed}>− {BRL(D.res)}</span>
      </div>

      {/* − Parcelas */}
      <div style={line}>
        <span style={lbl}>Parcelas pendentes</span>
        <span style={valRed}>− {BRL(totInst)}</span>
      </div>

      {/* − Pote de Investimentos */}
      <div style={line}>
        <span style={lbl}>Pote de Investimentos</span>
        <span style={valRed}>− {BRL(investAcumulado)}</span>
      </div>

      {/* = SALDO LIVRE */}
      <div style={{ ...line, padding: '16px 0 8px', borderTop: `2px solid ${P.g}`, marginTop: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.g }}>Saldo Livre</span>
        <HeroAmount value={saldo} color={P.g} size={32} />
      </div>
    </div>

    {/* DISTRIBUICAO DO SALDO LIVRE */}
    <div style={{ background: P.card, borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
      <Lbl t="Distribuição do Saldo Livre" sx={{ marginBottom: 12 }} />

      {/* Saldo Livre */}
      <div style={line}>
        <span style={{ ...lbl, fontWeight: 700, color: P.text }}>Saldo Livre</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{BRL(saldo)}</span>
      </div>

      <Hr my={4} color={P.card3} />

      {/* − Meta de investimento */}
      <div style={line}>
        <span style={lbl}>Meta de investimento</span>
        <span style={valRed}>− {BRL(investGoal)}</span>
      </div>

      {/* − Metas de categorias */}
      <div style={line}>
        <span style={lbl}>Metas de categorias</span>
        <span style={valRed}>− {BRL(sumGoals)}</span>
      </div>

      {/* Breakdown por categoria */}
      {D.cats.map(c => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 4px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.hue, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: P.dim }}>{c.name}</span>
          </div>
          <span style={{ fontSize: 13, color: P.dim, fontVariantNumeric: 'tabular-nums' }}>{BRL(c.goal)}</span>
        </div>
      ))}

      {/* = Disponivel para alocar */}
      <div style={{ ...line, padding: '12px 0', borderTop: `1px solid ${P.bd}`, marginTop: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: P.text }}>= Disponível para alocar</span>
        <span style={{ fontWeight: 800, fontSize: 18, color: unalloc >= 0 ? P.gb : P.rb, fontVariantNumeric: 'tabular-nums' }}>{BRL(unalloc)}</span>
      </div>
    </div>

    <EntradasSection D={D} dispatch={dispatch} />
    <GastosFixosSection D={D} dispatch={dispatch} />

    {/* RESERVA DE EMERGÊNCIA */}
    <ReservaCard value={D.res} onSave={v => dispatch({ type: 'UPD_RES', payload: v })} />

    {/* POTE DE INVESTIMENTOS */}
    <div className="fade-up" style={{ borderRadius: 24, padding: '32px 24px', background: '#6366f1', color: '#fff', textAlign: 'center', boxShadow: '0 12px 32px rgba(99, 102, 241, 0.3)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .9, marginBottom: 12 }}>
        Pote de Investimentos
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', lineHeight: 1, marginBottom: 24 }}>
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
          {BRL(D.investAcumulado || 0)}
        </span>
      </div>
      <button onClick={onGastoInv} style={{ width: '100%', border: 'none', borderRadius: 12, background: '#fff', color: '#4f46e5', padding: '16px', cursor: 'pointer', fontWeight: 800, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>
        Registrar Saque do Pote
      </button>
    </div>

    {calcOpen && <SaldoCalcModal D={D} dispatch={dispatch} onClose={() => setCalcOpen(false)} />}
  </div>);
}