import { useState } from 'react';
import { P } from '../palette.js';
import { BRL, mLeft } from '../utils.js';

export function CompTab({ D, dispatch }) {
  const [addInst, setAddInst] = useState(false);
  const [fi, setFi] = useState({ name: '', pm: '', end: '' });

  const saveInst = () => {
    const pm = parseFloat(fi.pm);
    if (!fi.name || isNaN(pm) || !fi.end || !/^\d{4}-\d{2}$/.test(fi.end)) return;
    dispatch({ type: 'ADD_INST', payload: { name: fi.name, pm, end: fi.end } });
    setFi({ name: '', pm: '', end: '' });
    setAddInst(false);
  };

  const totInst = D.inst.reduce((s, p) => s + p.pm * mLeft(p.end), 0);
  const totRecv = D.recv.reduce((s, r) => s + r.val, 0);

  return (
    <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 32, marginTop: 20 }}>
      {/* HEADER: Futuro */}
      <div>
        <div style={{ fontSize: 36, fontWeight: 800, color: P.text, letterSpacing: '-0.02em', marginBottom: 8 }}>Futuro</div>
        <div style={{ fontSize: 16, color: '#475569', lineHeight: 1.4 }}>Planejamento e controle de compromissos.</div>
      </div>

      {/* PARCELAS E DÍVIDAS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 16, background: '#dc2626', borderRadius: 2 }} />
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#334155' }}>Parcelas & Dívidas</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>-{BRL(totInst)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {D.inst.length === 0 ? <div style={{ fontSize: 13, color: P.dim }}>Nenhuma parcela cadastrada</div> : D.inst.map(p => { 
            const r = mLeft(p.end);
            return (
              <div key={p.id} style={{ background: P.card, borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: '#fca5a5' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Despesa</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{BRL(p.pm)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>{r}x rest.</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Até {p.end}</span>
                  </div>
                  <button onClick={() => dispatch({ type: 'DEL_INST', payload: p.id })} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                  </button>
                </div>
              </div>
            ); 
          })}

          {!addInst ? (
            <button onClick={() => setAddInst(true)} style={{ background: 'none', border: '2px dashed #cbd5e1', borderRadius: 16, padding: 16, color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all .2s' }}>+ Nova Parcela</button>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
              <input placeholder="Descrição..." value={fi.name} onChange={e => setFi(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', background: '#f8fafc', border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 12, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input placeholder="R$/mês" type="number" value={fi.pm} onChange={e => setFi(f => ({ ...f, pm: e.target.value }))} style={{ flex: 1, background: '#f8fafc', border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 14, outline: 'none' }} />
                <input type="month" value={fi.end} onChange={e => setFi(f => ({ ...f, end: e.target.value }))} style={{ width: 150, background: '#f8fafc', border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setAddInst(false)} style={{ flex: 1, border: 'none', borderRadius: 8, background: '#f1f5f9', color: '#64748b', padding: 12, cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
                <button onClick={saveInst} style={{ flex: 1, border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', padding: 12, cursor: 'pointer', fontWeight: 700 }}>Salvar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RESSARCIMENTOS */}
      {D.recv.length > 0 && (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 16, background: P.gb, borderRadius: 2 }} />
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#334155' }}>Ressarcimentos</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: P.gb, fontVariantNumeric: 'tabular-nums' }}>+{BRL(totRecv)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {D.recv.map(v => (
             <div key={v.id} style={{ background: P.card, borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4, textDecoration: v.got ? 'line-through' : 'none' }}>{v.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Variável</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: P.gb, fontVariantNumeric: 'tabular-nums' }}>{BRL(v.val)}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: v.got ? P.gb : '#64748b' }}>{v.got ? 'Recebido' : 'Pendente'}</span>
                  <button onClick={() => dispatch({ type: 'DEL_RECV', payload: v.id })} style={{ background: 'none', border: 'none', color: P.rb, cursor: 'pointer', fontSize: 10, fontWeight: 700, opacity: .6 }}>Excluir</button>
                </div>
                <div onClick={() => dispatch({ type: 'TOGGLE_RECV', payload: v.id })} style={{ width: 44, height: 24, borderRadius: 12, background: v.got ? P.gb : '#e2e8f0', display: 'flex', alignItems: 'center', padding: 2, cursor: 'pointer', transition: 'background .3s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: v.got ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .3s', boxShadow: '0 2px 4px rgba(0,0,0,.1)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}