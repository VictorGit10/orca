import { useState, useMemo } from 'react';
import { P } from '../palette.js';
import { BRL, nowYM, prevYM, calcSpent, calcMonthTotal } from '../utils.js';
import { Lbl, EmptyState } from './atoms.jsx';

const monLabel = m => new Date(m + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');

// Variação percentual entre dois meses. Gasto MAIOR é ruim (vermelho); menor é bom.
function Trend({ cur, prev, invert = false }) {
  if (prev == null || prev === 0) return null;
  const d = cur - prev;
  if (Math.abs(d) < 0.005) return <span style={{ fontSize: 11.5, fontWeight: 700, color: P.dim2 }}>estável</span>;
  const pct = Math.round(Math.abs(d / prev) * 100);
  const up = d > 0;
  const good = invert ? up : !up;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color: good ? P.gb : P.rb, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {up ? '▲' : '▼'} {pct}% <span style={{ color: P.dim2, fontWeight: 600 }}>vs. mês anterior</span>
    </span>
  );
}

// Metas de uma categoria num dado mês: usa o snapshot do histórico quando existe,
// senão o valor atual (único disponível para o mês corrente).
const goalFor = (histRec, cat, ym, isCurrent) => {
  if (isCurrent) return cat.goal;
  return histRec?.cats?.[cat.id] ?? null;
};

function CatBudgetRow({ name, hue, goal, spent }) {
  const pct = goal > 0 ? spent / goal : null;
  const color = pct == null ? P.dim : pct > 1 ? P.rb : pct > 0.8 ? P.ab : P.gb;
  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: hue, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {BRL(spent)}{goal > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: P.dim }}> / {BRL(goal)}</span>}
        </span>
      </div>
      {goal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: spent > goal ? P.rb : P.dim2, fontVariantNumeric: 'tabular-nums' }}>
            {spent > goal
              ? `${BRL(spent - goal)} acima da meta`
              : `${BRL(goal - spent)} de folga`}
          </span>
        </div>
      )}
      {goal > 0 && (
        <div style={{ height: 4, borderRadius: 2, background: P.card3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (pct || 0) * 100)}%`, borderRadius: 2, background: color, transition: 'width .3s' }} />
        </div>
      )}
    </div>
  );
}

function MonthBars({ months, totalByMonth, selMon, onSelect }) {
  const max = Math.max(...months.map(m => totalByMonth[m] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, paddingTop: 6 }}>
      {months.map(m => {
        const v = totalByMonth[m] || 0;
        const h = Math.max(4, (v / max) * 96);
        const active = m === selMon;
        return (
          <button key={m} onClick={() => onSelect(m)} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0, minWidth: 0 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: P.dim, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{v > 0 ? Math.round(v / 100) / 10 + 'k' : '—'}</span>
            <div style={{ width: '100%', maxWidth: 44, height: h, borderRadius: 6, background: active ? P.g : P.card3, transition: 'background .2s' }} />
            <span style={{ fontSize: 9.5, fontWeight: active ? 800 : 600, color: active ? P.gb : P.dim2, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{monLabel(m)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AnaliseTab({ D }) {
  const ym = nowYM();
  const hist = useMemo(() => D.hist || [], [D.hist]);
  const histByM = useMemo(() => Object.fromEntries(hist.map(h => [h.m, h])), [hist]);

  const months = useMemo(() => {
    const s = new Set([...D.txs.map(t => t.dt.slice(0, 7)), ...hist.map(h => h.m), ym]);
    return [...s].filter(Boolean).sort((a, b) => b.localeCompare(a)).slice(0, 12);
  }, [D.txs, hist, ym]);

  const [selMon, setSelMon] = useState(ym);

  const totalByMonth = useMemo(() => {
    const map = {};
    months.forEach(m => {
      const [ca, cm] = m.split('-').map(Number);
      map[m] = calcMonthTotal(D.txs, cm - 1, ca);
    });
    return map;
  }, [months, D.txs]);

  const [ca, cm] = selMon.split('-').map(Number);
  const spent = useMemo(() => calcSpent(D.txs, D.cats, cm - 1, ca), [D.txs, D.cats, cm, ca]);
  const histRec = selMon === ym ? null : histByM[selMon];
  const totalSpent = totalByMonth[selMon] || 0;

  // Mês anterior ao selecionado, para as comparações de tendência
  const prevMon = prevYM(selMon);
  const prevTotal = useMemo(() => {
    const [pa, pm] = prevMon.split('-').map(Number);
    const has = D.txs.some(t => t.dt.startsWith(prevMon));
    return has ? calcMonthTotal(D.txs, pm - 1, pa) : null;
  }, [D.txs, prevMon]);

  // Soma das metas vigentes no mês selecionado (só as categorias que têm meta)
  const totalGoal = useMemo(
    () => D.cats.reduce((acc, c) => acc + (goalFor(histRec, c, selMon, selMon === ym) ?? 0), 0),
    [D.cats, histRec, selMon, ym]
  );
  const totalCatSpent = useMemo(
    () => D.cats.reduce((acc, c) => acc + (spent[c.id] || 0), 0),
    [D.cats, spent]
  );
  const investido = useMemo(() => D.txs.filter(t => t.cat === -1 && t.dt.startsWith(selMon)).reduce((s, t) => s + t.val, 0), [D.txs, selMon]);

  // Evolução da reserva: meses no histórico + mês corrente (valor vivo)
  const resPoints = useMemo(() => {
    const pts = hist.map(h => ({ m: h.m, res: h.res }));
    if (!pts.some(p => p.m === ym)) pts.push({ m: ym, res: D.res });
    return pts.sort((a, b) => a.m.localeCompare(b.m)).slice(-8);
  }, [hist, D.res, ym]);

  // Média só dos meses FECHADOS — incluir o mês corrente (parcial) distorceria
  const mediaMeses = useMemo(() => {
    const fechados = months.filter(m => m !== ym).map(m => totalByMonth[m] || 0).filter(v => v > 0);
    if (fechados.length < 2) return null;
    return fechados.reduce((a, b) => a + b, 0) / fechados.length;
  }, [months, totalByMonth, ym]);

  const selHasData = D.txs.some(t => t.dt.startsWith(selMon)) || histRec || selMon === ym;

  return (<div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24, marginTop: 20 }}>

    {/* Seletor de mês */}
    <div style={{ overflowX: 'auto', display: 'flex', gap: 10, paddingBottom: 4, width: '100%', minWidth: 0, scrollbarWidth: 'none' }}>
      {months.map(m => (
        <button key={m} onClick={() => setSelMon(m)} style={{ border: 'none', borderRadius: 12, background: selMon === m ? '#0f766e' : P.card, color: selMon === m ? '#fff' : P.text, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: selMon === m ? 700 : 500, textTransform: 'capitalize', transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', flexShrink: 0 }}>{monLabel(m)}</button>
      ))}
    </div>

    {/* Resumo do mês selecionado */}
    {selHasData ? (<>
      <div className="fade-up" style={{ background: P.card, borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
        <Lbl t={`Resumo de ${monLabel(selMon)}`} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: P.card2, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 6 }}>Gasto do mês</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{BRL(totalSpent)}</div>
            <div style={{ marginTop: 5 }}><Trend cur={totalSpent} prev={prevTotal} /></div>
          </div>
          <div style={{ flex: 1, background: `${P.inv}0d`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.inv, marginBottom: 6 }}>Investido</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: P.inv, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{BRL(investido)}</div>
          </div>
        </div>
      </div>

      {/* Metas vs gasto por categoria */}
      <div className="fade-up" style={{ background: P.card, borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
        <Lbl t="Meta × Gasto por categoria" />
        {histRec && <div style={{ fontSize: 11, color: P.dim2, marginBottom: 4 }}>Metas de como estavam em {monLabel(selMon)}</div>}
        {D.cats.map(c => (
          <CatBudgetRow key={c.id} name={c.name} hue={c.hue} goal={goalFor(histRec, c, selMon, selMon === ym) ?? 0} spent={spent[c.id] || 0} />
        ))}
        {totalGoal > 0 && (
          <div style={{ marginTop: 10, paddingTop: 14, borderTop: `1px solid ${P.bd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: P.dim }}>Total</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>
                {BRL(totalCatSpent)}<span style={{ fontSize: 12, fontWeight: 500, color: P.dim }}> / {BRL(totalGoal)}</span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: totalCatSpent > totalGoal ? P.rb : P.gb, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                {totalCatSpent > totalGoal
                  ? `${BRL(totalCatSpent - totalGoal)} acima do orçado`
                  : `${BRL(totalGoal - totalCatSpent)} dentro do orçado`}
              </div>
            </div>
          </div>
        )}
      </div>
    </>) : <EmptyState icon="📊" text="Sem dados para este mês" />}

    {/* Evolução do gasto mensal */}
    <div className="fade-up" style={{ background: P.card, borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
      <Lbl t="Gasto mensal (últimos meses)" />
      <MonthBars months={[...months].reverse()} totalByMonth={totalByMonth} selMon={selMon} onSelect={setSelMon} />
      {mediaMeses != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${P.bd}`, gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: P.dim }}>Média dos meses fechados</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{BRL(mediaMeses)}</span>
        </div>
      )}
      {selMon === ym && <div style={{ fontSize: 11, color: P.dim2, marginTop: 8 }}>Mês em andamento — valor parcial</div>}
    </div>

    {/* Evolução da reserva */}
    <div className="fade-up" style={{ background: P.card, borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
      <Lbl t="Reserva de emergência" />
      {resPoints.length <= 1 ? (
        <div style={{ fontSize: 12.5, color: P.dim }}>O histórico da reserva começa a ser registrado a partir deste mês.</div>
      ) : resPoints.map((p, i) => {
        const prev = i > 0 ? resPoints[i - 1].res : null;
        const delta = prev == null ? null : p.res - prev;
        return (
          <div key={p.m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < resPoints.length - 1 ? `1px solid ${P.bd}` : 'none' }}>
            <span style={{ fontSize: 13, color: P.dim, textTransform: 'capitalize', fontWeight: 600 }}>{monLabel(p.m)}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              {delta != null && delta !== 0 && (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: delta > 0 ? P.gb : P.rb, fontVariantNumeric: 'tabular-nums' }}>{delta > 0 ? '+' : '−'}{BRL(Math.abs(delta)).replace('R$', '')}</span>
              )}
              <span style={{ fontSize: 15, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{BRL(p.res)}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>);
}