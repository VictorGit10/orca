import { useState } from 'react';
import { P } from './palette.js';
import { ISO } from './utils.js';
import { useAppData } from './hooks/useAppData.js';
import { HomeTab } from './components/HomeTab.jsx';
import { SaldoTab } from './components/SaldoTab.jsx';
import { CompTab } from './components/CompTab.jsx';
import { HistTab } from './components/HistTab.jsx';
import { AnaliseTab } from './components/AnaliseTab.jsx';
import { GastoModal } from './components/GastoModal.jsx';
import { RemanejoModal } from './components/RemanejoModal.jsx';
import { AjudaModal } from './components/AjudaModal.jsx';

const ICONS = {
  home: ['M3 12L5 10M5 10L12 3L19 10M5 10V20A1 1 0 006 21H9V16A1 1 0 0110 15H14A1 1 0 0115 16V21H18A1 1 0 0019 20V10', 'M8 21V11L12 6L16 11V21M3 12L5 10M19 10L21 12'],
  saldo: ['M2 10h20M7 15h2m4 0h2M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z', 'M3 10h18M7 15h2m4 0h2M5 7h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z'],
  cats: ['M4 6h16M4 10h16M4 14h16M4 18h16', 'M5 5h14v14H5zM5 9h14M5 13h14'],
  comp: ['M8 7V3m8 4V3M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM3 10h18', 'M8 2v4m8-4v4M4 6h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM3 11h18'],
  hist: ['M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3M3 4v4h4', 'M12 7v5l3 3M3.05 11a9 9 0 1 0 .5-3M3 4v4h4M12 3a9 9 0 110 18 9 9 0 010-18z'],
  analise: ['M4 20h16M7 20v-6M12 20V9M17 20v-9', 'M4 20h16M7 20v-6M12 20V9M17 20v-9M6.5 11l4-5M17.5 8l-4 3'],
};
const NAV = [{ l: 'Início', k: 'home' }, { l: 'Saldos', k: 'saldo' }, { l: 'Obrig.', k: 'comp' }, { l: 'Histórico', k: 'hist' }, { l: 'Análise', k: 'analise' }];

export default function App() {
  const { D, dispatch, spent, totFix, totInst, totInc, sumGoals, saldo, totPendRecv, syncStatus, queueCount } = useAppData();
  const [tab, setTab] = useState(0);
  const [histCat, setHistCat] = useState(0);
  const [modal, setModal] = useState(false);
  const [remanejo, setRemanejo] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const [form, setForm] = useState({ cat: 1, val: '', note: '', dt: ISO(), reemb: false });
  const [editingTxId, setEditingTxId] = useState(null);

  const openGastoInv = () => {
    setForm({ cat: -1, val: '', note: '', dt: ISO(), reemb: false });
    setEditingTxId(null);
    setModal(true);
  };

  const openGastoComum = () => {
    setForm({ cat: D.cats[0]?.id || 1, val: '', note: '', dt: ISO(), reemb: false });
    setEditingTxId(null);
    setModal(true);
  };

  const openEditTx = (t) => {
    setForm({ cat: t.cat, val: String(t.val), note: t.note || '', dt: t.dt, reemb: t.reemb || false });
    setEditingTxId(t.id);
    setModal(true);
  };

  const handleSave = () => {
    const v = parseFloat(String(form.val).replace(',', '.'));
    if (!v || isNaN(v)) return;
    if (editingTxId) {
      dispatch({ type: 'UPD_TX', payload: { id: editingTxId, ...form, val: String(v) } });
    } else {
      dispatch({ type: 'ADD_TX', payload: { ...form, val: String(v) } });
    }
    setModal(false);
    setForm({ cat: 1, val: '', note: '', dt: ISO(), reemb: false });
    setEditingTxId(null);
  };

  return (
    <div style={{ background: P.bg, color: P.text, fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif", height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', maxWidth: '600px', margin: '0 auto', boxShadow: '0 0 40px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', flexShrink: 0, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 20px', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {syncStatus !== 'online' && (
            <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: syncStatus === 'syncing' ? '#e0f2fe' : (syncStatus === 'error' ? '#fee2e2' : '#f1f5f9'), color: syncStatus === 'syncing' ? '#0369a1' : (syncStatus === 'error' ? '#b91c1c' : '#64748b'), display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: syncStatus === 'syncing' ? '#38bdf8' : (syncStatus === 'error' ? '#ef4444' : '#94a3b8'), animation: syncStatus === 'syncing' ? 'pulse 1.5s infinite' : 'none' }} />
              {syncStatus === 'syncing' ? 'Sincronizando...' : (queueCount > 0 ? `${queueCount} p/ enviar` : 'Offline')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <img src={`${import.meta.env.BASE_URL}orca-logo.svg`} alt="Orça" style={{ height: 38, width: 'auto', marginLeft: '6px' }} />
          <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.05em', color: P.text, display: 'flex', alignItems: 'baseline' }}>Orça<span style={{ color: '#10b981', fontSize: '28px', lineHeight: 0 }}>.</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setAjuda(true)} title="Como usar o Orça" style={{ width: 32, height: 32, borderRadius: '50%', background: P.card2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.dim, fontSize: 15, fontWeight: 800, marginRight: '6px' }}>?</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40, width: '100%', minWidth: 0 }}>
        {tab === 0 && <HomeTab D={D} spent={spent} saldo={saldo} sumGoals={sumGoals} totPendRecv={totPendRecv} onRemanejo={() => setRemanejo(true)} onCategoryClick={(id) => { setHistCat(id); setTab(3); }} />}
        {tab === 1 && <SaldoTab D={D} dispatch={dispatch} totFix={totFix} totInst={totInst} totInc={totInc} totPendRecv={totPendRecv} saldo={saldo} sumGoals={sumGoals} onGastoInv={openGastoInv} />}
        {tab === 2 && <CompTab D={D} dispatch={dispatch} />}
        {tab === 3 && <HistTab D={D} dispatch={dispatch} onEditTx={openEditTx} selCat={histCat} setSelCat={setHistCat} />}
        {tab === 4 && <AnaliseTab D={D} />}
      </div>

      {(tab === 0 || tab === 3) && <button onClick={openGastoComum} style={{ position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: '50%', background: P.g, border: 'none', color: '#fff', fontSize: 28, fontWeight: 300, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(16,185,129,.4)', zIndex: 20, transition: 'transform .15s' }}>+</button>}

      <nav style={{ flexShrink: 0, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 40px rgba(0,0,0,0.04)', zIndex: 10 }}>
        {NAV.map((n, i) => {
          const active = tab === i;
          const [outline, filled] = ICONS[n.k];
          return (
            <button key={i} onClick={() => setTab(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '12px 0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? P.g : P.dim2, transition: 'color .15s', position: 'relative' }}>
              <svg style={{ transition: 'transform .2s', transform: active ? 'scale(1.05)' : 'scale(1)' }} width={24} height={24} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={active ? filled : outline} /></svg>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>{n.l}</span>
            </button>
          );
        })}
      </nav>

      {modal && <GastoModal D={D} form={form} setForm={setForm} onSave={handleSave} onClose={() => { setModal(false); setEditingTxId(null); }} isInvestGasto={form.cat === -1} editMode={!!editingTxId} />}
      {remanejo && <RemanejoModal D={D} dispatch={dispatch} saldo={saldo} onClose={() => setRemanejo(false)} />}
      {ajuda && <AjudaModal D={D} dispatch={dispatch} onClose={() => setAjuda(false)} />}
    </div>
  );
}