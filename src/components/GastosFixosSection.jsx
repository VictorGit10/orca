import { useState } from 'react';
import { P } from '../palette.js';
import { BRL } from '../utils.js';
import { Row, Lbl, Hr, Box, EditField } from './atoms.jsx';

export function GastosFixosSection({ D, dispatch }) {
  const [adding, setAdding] = useState(false);
  const [nf, setNf] = useState({ name: '', val: '' });

  const addFix = () => {
    const v = parseFloat(nf.val);
    if (!nf.name || isNaN(v)) return;
    dispatch({ type: 'ADD_FIX', payload: { name: nf.name, val: v } });
    setNf({ name: '', val: '' });
    setAdding(false);
  };

  return (
    <Box sx={{ marginBottom: 16 }}>
      <Row a={<Lbl t="Gerenciar Gastos Fixos" sx={{ marginBottom: 0 }} />} b={<button onClick={() => setAdding(a => !a)} style={{ border: `1px solid ${P.bd2}`, borderRadius: 6, background: '#fff', color: P.text, padding: '4px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>{adding ? 'Cancelar' : '+ Novo'}</button>} />
      {adding && <div style={{ marginTop: 12, marginBottom: 12, padding: 12, background: P.bg, borderRadius: 8, border: `1px solid ${P.bd}` }}>
        <input placeholder="Nome da conta (ex: Aluguel)" value={nf.name} onChange={e => setNf(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', background: '#fff', border: `1px solid ${P.bd}`, borderRadius: 8, padding: '10px', fontSize: 14, marginBottom: 8 }} />
        <input placeholder="Valor (R$)" type="number" value={nf.val} onChange={e => setNf(f => ({ ...f, val: e.target.value }))} style={{ width: '100%', background: '#fff', border: `1px solid ${P.bd}`, borderRadius: 8, padding: '10px', fontSize: 14, marginBottom: 10 }} />
        <button onClick={addFix} style={{ width: '100%', background: P.g, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Salvar Conta Fixa</button>
      </div>}
      <Hr my={12} />
      {D.fix.length === 0 && <div style={{ fontSize: 13, color: P.dim, textAlign: 'center' }}>Sem gastos fixos.</div>}
      {D.fix.map((g, i) => (
        <div key={g.id}>{i > 0 && <Hr my={12} />}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: P.text, display: 'flex', gap: 8, alignItems: 'center' }}>
                {g.name}
                <button onClick={() => dispatch({ type: 'DEL_FIX', payload: g.id })} style={{ background: 'none', border: 'none', color: P.rb, cursor: 'pointer', fontSize: 10, fontWeight: 700, opacity: .6 }}>Excluir</button>
              </div>
              <EditField value={g.val} onSave={v => dispatch({ type: 'UPD_FIX_VAL', payload: { id: g.id, val: v } })} />
            </div>
          </div>
        </div>
      ))}
    </Box>
  );
}