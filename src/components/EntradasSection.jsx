import { useState } from 'react';
import { P } from '../palette.js';
import { BRL } from '../utils.js';
import { Sw, Row, Lbl, Hr, Box, EditField } from './atoms.jsx';

export function EntradasSection({ D, dispatch }) {
  const [adding, setAdding] = useState(false);
  const [nf, setNf] = useState({ name: '', val: '' });

  const addInc = () => {
    const v = parseFloat(nf.val);
    if (!nf.name || isNaN(v)) return;
    dispatch({ type: 'ADD_INC', payload: { name: nf.name, val: v, got: false, rcvd: 0 } });
    setNf({ name: '', val: '' });
    setAdding(false);
  };

  return (
    <Box sx={{ marginBottom: 16 }}>
      <Row a={<Lbl t="Gerenciar Entradas" sx={{ marginBottom: 0 }} />} b={<button onClick={() => setAdding(a => !a)} style={{ border: `1px solid ${P.bd2}`, borderRadius: 6, background: '#fff', color: P.text, padding: '4px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>{adding ? 'Cancelar' : '+ Nova'}</button>} />
      {adding && <div style={{ marginTop: 12, marginBottom: 12, padding: 12, background: P.bg, borderRadius: 8, border: `1px solid ${P.bd}` }}>
        <input placeholder="Nome (ex: Salário)" value={nf.name} onChange={e => setNf(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', background: '#fff', border: `1px solid ${P.bd}`, borderRadius: 8, padding: '10px', fontSize: 14, marginBottom: 8 }} />
        <input placeholder="Valor Esperado (R$)" type="number" value={nf.val} onChange={e => setNf(f => ({ ...f, val: e.target.value }))} style={{ width: '100%', background: '#fff', border: `1px solid ${P.bd}`, borderRadius: 8, padding: '10px', fontSize: 14, marginBottom: 10 }} />
        <button onClick={addInc} style={{ width: '100%', background: P.g, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Salvar Entrada</button>
      </div>}
      <Hr my={12} />
      {D.inc.length === 0 && <div style={{ fontSize: 13, color: P.dim, textAlign: 'center' }}>Sem entradas previstas.</div>}
      {D.inc.map((e, i) => (
        <div key={e.id}>{i > 0 && <Hr my={12} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: e.got ? P.dim2 : P.text, textDecoration: e.got ? 'line-through' : 'none', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {e.name}
                  <button onClick={() => dispatch({ type: 'DEL_INC', payload: e.id })} style={{ background: 'none', border: 'none', color: P.rb, cursor: 'pointer', fontSize: 10, fontWeight: 700, opacity: .6 }}>Excluir</button>
                </div>
                <EditField value={e.val} onSave={v => dispatch({ type: 'UPD_INC_VAL', payload: { id: e.id, val: v } })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Sw on={e.got} yes="Recebido" no="Pendente" change={() => dispatch({ type: 'TOGGLE_INC', payload: e.id })} />
              </div>
            </div>
            {!e.got && (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: `1px solid ${P.bd2}` }}>
                  <span style={{ fontSize: 13, color: P.dim, fontWeight: 700 }}>Já recebido (Adiant.):</span>
                  <EditField value={e.rcvd || 0} onSave={v => dispatch({ type: 'UPD_INC_RCVD', payload: { id: e.id, rcvd: v } })} color={P.text} />
               </div>
            )}
          </div>
        </div>
      ))}
    </Box>
  );
}