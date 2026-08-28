import { P } from '../palette.js';
import { BRL } from '../utils.js';
import { Row, Box, HeroAmount } from './atoms.jsx';

export function HomeTab({ D, spent, saldo, sumGoals, totPendRecv, onRemanejo, onCategoryClick }) {
  const totalSpent = Object.values(spent).reduce((s, v) => s + v, 0);
  const remaining = saldo - totalSpent;
  const unalloc = saldo - sumGoals - (D.investGoal || 0);
  const hasUnalloc = Math.abs(unalloc) > 0.5;

  return (
    <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* RESTANTE DO MÊS - Centered Hero */}
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24, paddingBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 8 }}>
          Restante do Mês
        </div>
        <HeroAmount value={remaining} color={remaining < -0.5 ? P.rb : remaining > 0.5 ? P.gb : P.text} size={56} />
        <div style={{ fontSize: 14, color: P.dim, fontWeight: 500, marginTop: 12 }}>
          {remaining < -0.5 ? 'acima do orçamento previsto' : remaining > 0.5 ? 'após gastos previstos' : 'orçamento totalmente utilizado'}
        </div>

        {totPendRecv > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: P.ab, fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
            {BRL(totPendRecv)} aguardando ressarcimento
          </div>
        )}
        
        {hasUnalloc && (
          <button onClick={onRemanejo} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: unalloc > 0 ? P.gb : P.rb, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{unalloc > 0 ? 'add_circle' : 'error'}</span>
            {unalloc > 0 ? 'Alocar na Planilha' : 'Ajustar as Metas'}
          </button>
        )}
      </div>

      {/* METAS MENSAIS */}
      <div style={{ background: P.card, borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim }}>Metas Mensais</div>
          <button onClick={onRemanejo} style={{ background: 'none', border: 'none', color: P.dim, cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>tune</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {D.cats.map((c, idx) => {
            const g = spent[c.id] || 0, p = Math.min(100, c.goal > 0 ? g / c.goal * 100 : 100), over = g > c.goal;
            const rem = c.goal - g;
            return (
              <div key={c.id} className="fade-up" style={{ animationDelay: `${(idx + 1) * 30}ms`, cursor: 'pointer' }} onClick={() => onCategoryClick && onCategoryClick(c.id)}>
                <Box sx={{ padding: 0, boxShadow: 'none', borderRadius: 0, background: 'none' }}>
                  <Row
                    a={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: over ? P.rb : c.hue, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: P.text, marginBottom: 2 }}>{c.name}</span>
                          <span style={{ fontSize: 12, color: P.dim2 }}>{BRL(g)} / {BRL(c.goal)}</span>
                        </div>
                      </div>
                    }
                    b={
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: over ? P.rb : P.text, fontVariantNumeric: 'tabular-nums' }}>{over ? `-${BRL(Math.abs(rem))}` : BRL(rem)}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.06em', color: P.dim2 }}>{over ? 'ACIMA' : 'RESTANTE'}</span>
                      </div>
                    }
                  />
                  <div style={{ background: P.card3, height: 2, overflow: 'hidden', marginTop: 14, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${p}%`, background: over ? P.rb : p > 80 ? P.ab : c.hue, transition: 'width .5s cubic-bezier(.22,1,.36,1)' }} />
                  </div>
                </Box>
              </div>
            );
          })}
        </div>
      </div>

      {/* INVESTIMENTOS CARD */}
      <div className="fade-up" style={{ animationDelay: `${(D.cats.length + 1) * 30}ms`, borderRadius: 20, padding: 24, background: `linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4338ca', marginBottom: 8 }}>Investimentos</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#312e81', letterSpacing: '-0.02em' }}>{BRL(D.investGoal || 0)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>/mês</span>
          </div>
        </div>
        <button style={{ position: 'absolute', right: 24, top: 24, width: 36, height: 36, borderRadius: '50%', background: '#4f46e5', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
}