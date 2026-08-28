import { P } from '../palette.js';

export function GastoModal({ D, form, setForm, onSave, onClose, isInvestGasto, editMode }) {

  return (<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: P.bg, borderRadius: '22px 22px 0 0', width: '100%', padding: '8px 20px 32px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 12px' }}>
        <div style={{ width: 36, height: 4, background: P.bd2, borderRadius: 2 }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: P.text }}>{isInvestGasto ? 'Saque de Investimento' : editMode ? 'Editar Registro' : 'Novo Registro'}</div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: P.card2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.dim, fontSize: 18 }}>✕</button>
      </div>

      {isInvestGasto && <div style={{ fontSize: 13, color: P.dim, marginBottom: 20, lineHeight: 1.5 }}>Este valor será deduzido do acumulado no seu Pote de Investimentos.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 16 }}>Valor do Gasto</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, borderBottom: `1px solid ${P.bd}`, paddingBottom: 12, width: '100%', maxWidth: 280, justifyContent: 'center' }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: P.dim, letterSpacing: '-0.02em' }}>R$</span>
          <input autoFocus type="number" inputMode="decimal" placeholder="0,00" value={form.val} onChange={e => setForm(f => ({ ...f, val: e.target.value }))} style={{ background: 'transparent', border: 'none', textAlign: 'center', fontSize: 56, fontWeight: 800, color: form.val ? P.text : P.bd2, letterSpacing: '-0.04em', width: '100%', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />
        </div>
      </div>

      {!isInvestGasto && <>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 12 }}>Categoria</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {D.cats.map(c => <button key={c.id} onClick={() => setForm(f => ({ ...f, cat: c.id }))} style={{ border: form.cat === c.id ? `1px solid ${c.hue}40` : 'none', borderRadius: 8, background: form.cat === c.id ? `${c.hue}1a` : P.card, color: P.text, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', boxShadow: form.cat === c.id ? 'none' : '0 2px 8px rgba(0,0,0,0.02)' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: c.hue }} />{c.name}</button>)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, padding: '12px 16px', background: form.reemb ? `${P.ab}1a` : P.card, borderRadius: 12, border: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: P.text }}>Reembolsável?</span>
            {form.reemb && <span style={{ fontSize: 12, color: P.dim, marginTop: 2 }}>Não contará na meta da categoria</span>}
          </div>
          <div onClick={() => setForm(f => ({ ...f, reemb: !f.reemb }))} style={{ width: 44, height: 24, borderRadius: 12, background: form.reemb ? P.ab : '#e2e8f0', display: 'flex', alignItems: 'center', padding: 2, cursor: 'pointer', transition: 'background .3s' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: form.reemb ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .3s', boxShadow: '0 2px 4px rgba(0,0,0,.1)' }} />
          </div>
        </div>
      </>}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: P.dim, marginBottom: 8 }}>Data</div>
      <input type="date" value={form.dt} onChange={e => setForm(f => ({ ...f, dt: e.target.value }))} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `2px solid ${P.bd}33`, borderRadius: 0, padding: '12px 14px', color: P.text, fontSize: 15, marginBottom: 14, fontWeight: 600, outline: 'none', transition: 'border-bottom .2s' }} onFocus={e => e.target.style.borderBottom = `2px solid ${P.ab}`} onBlur={e => e.target.style.borderBottom = `2px solid ${P.bd}33`} />
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: P.dim, marginBottom: 8 }}>Observação (opcional)</div>
      <input type="text" placeholder="Ex: Almoço com amigos..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `2px solid ${P.bd}33`, borderRadius: 0, padding: '12px 14px', color: P.text, fontSize: 15, marginBottom: 24, outline: 'none', transition: 'border-bottom .2s' }} onFocus={e => e.target.style.borderBottom = `2px solid ${P.ab}`} onBlur={e => e.target.style.borderBottom = `2px solid ${P.bd}33`} />

      <button onClick={onSave} style={{ width: '100%', border: 'none', borderRadius: 8, background: form.val ? P.gb : P.bd2, color: form.val ? '#fff' : '#fff', padding: 18, cursor: form.val ? 'pointer' : 'default', fontWeight: 800, fontSize: 16, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {editMode ? 'Editar Registro' : 'Confirmar Registro'} {form.val && <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>}
      </button>
    </div>
  </div>);
}