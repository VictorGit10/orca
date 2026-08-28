import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { SEED } from '../seed.js';
import { calcSpent, calcTotFix, calcTotInst, calcTotInc, calcSumGoals, calcSaldo, calcTotPendRecv, nowYM, histFromSnaps, mergeHist, pickBaseline } from '../utils.js';
import { supabase, supabaseReady } from '../lib/supabase.js';
import { STORAGE_KEY, QUEUE_KEY, CLIENT_ID, FAMILY_ID, applyRollover, reduceD } from '../store/reducer.js';

let isSyncing = false;

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return applyRollover(JSON.parse(raw));
  } catch { /* ignore corrupt data */ }
  return applyRollover(SEED);
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full or blocked */ }
}

export function useAppData() {
  const [D, setD] = useState(loadData);
  const catchUpDone = useRef(false);

  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? 'online' : 'offline');
  const [queueCount, setQueueCount] = useState(() => JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length);

  useEffect(() => { saveData(D); }, [D]);

  const [cm, ca] = [new Date().getMonth(), new Date().getFullYear()];
  const spent = useMemo(() => calcSpent(D.txs, D.cats, cm, ca), [D.txs, D.cats, cm, ca]);
  const totFix = useMemo(() => calcTotFix(D.fix), [D.fix]);
  const totInst = useMemo(() => calcTotInst(D.inst), [D.inst]);
  const totInc = useMemo(() => calcTotInc(D.inc), [D.inc]);
  const sumGoals = useMemo(() => calcSumGoals(D.cats), [D.cats]);
  const totPendRecv = useMemo(() => calcTotPendRecv(D.recv, cm, ca), [D.recv, cm, ca]);
  const saldo = useMemo(() => calcSaldo(D.bal, totInc, totFix, D.res, totInst, D.investAcumulado || 0, totPendRecv), [D.bal, totInc, totFix, D.res, totInst, D.investAcumulado, totPendRecv]);

  const triggerSync = useCallback(async () => {
    if (!supabaseReady) return;
    if (isSyncing || !navigator.onLine) {
        if (!navigator.onLine) setSyncStatus('offline');
        return;
    }

    const qRaw = localStorage.getItem(QUEUE_KEY);
    const q = JSON.parse(qRaw || '[]');
    if (q.length === 0) {
        setSyncStatus('online');
        return;
    }

    isSyncing = true;
    setSyncStatus('syncing');
    let hadFatalError = false;

    try {
        const { error } = await supabase.from('events').insert(q);

        if (error) {
            console.error("Sync failed:", error);
            // Ignora duplicidade caso tenha havido timeout no client, mas o row entrou no server
            if (error.code !== '23505') {
                hadFatalError = true;
                setSyncStatus('error');
                return;
            }
        }

        const qids = new Set(q.map(x => x.id));
        const currentQ = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        const remainingQ = currentQ.filter(x => !qids.has(x.id));
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQ));
        setQueueCount(remainingQ.length);
        setSyncStatus(remainingQ.length > 0 ? 'syncing' : 'online');

    } finally {
        isSyncing = false;
        // Só agenda retry se não houve erro fatal (ex: schema incompat., auth, etc.)
        if (!hadFatalError) {
            const finalQ = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            if (finalQ.length > 0 && navigator.onLine) {
                setTimeout(triggerSync, 500);
            } else if (finalQ.length === 0) {
                setSyncStatus('online');
            }
        }
    }
  }, []);

  const dispatch = useCallback((action) => {
    if (['ADD_TX', 'ADD_INC', 'ADD_FIX', 'ADD_INST', 'ADD_RECV'].includes(action.type)) {
       if (!action.payload.id) action.payload.id = crypto.randomUUID();
    }
    setD(prev => reduceD(prev, action));

    if (action.noSync) return;

    const event = {
        id: crypto.randomUUID(),
        client_id: CLIENT_ID,
        family_id: FAMILY_ID,
        event_type: action.type,
        payload: action.payload,
        device_ts: Date.now()
    };

    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    q.push(event);
    if (q.length > 500) q.splice(0, q.length - 500);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    setQueueCount(q.length);

    triggerSync();
  }, [triggerSync]);

  useEffect(() => {
     async function catchUp() {
         if (!supabaseReady) return;
         // Garante que o catchUp só rode UMA vez por sessão para não sobrescrever
         // ações locais (ex: DEL_TX) que ainda não foram sincronizadas.
         if (catchUpDone.current) return;
         catchUpDone.current = true;

         if (!navigator.onLine) {
             setSyncStatus('offline');
             return;
         }

         // Só seta 'syncing' se realmente tiver algo para carregar do servidor
         setSyncStatus('syncing');

         try {
             // Busca TODOS os snapshots: o mais recente vira baseline e os demais
             // alimentam o histórico mensal da aba Análise (metas/reserva da época).
             const { data: snaps } = await supabase
                 .from('events')
                 .select('*')
                 .eq('family_id', FAMILY_ID)
                 .eq('event_type', 'SNAPSHOT_MONTHLY')
                 .order('device_ts', { ascending: false });

             let baseD = JSON.parse(localStorage.getItem(STORAGE_KEY));
             if (!baseD) {
                 setSyncStatus('online');
                 return;
             }

             let snapshotTs = 0;
             if (snaps && snaps.length > 0) {
                 const snap = pickBaseline(snaps);
                 baseD = snap.payload;
                 snapshotTs = Number(snap.device_ts);
                 // Backfill do histórico a partir de todos os snapshots antigos.
                 // `minM` evita meses fantasma anteriores à primeira transação.
                 const minM = (baseD.txs || [])
                     .map(t => t.dt.slice(0, 7))
                     .sort()[0];
                 baseD.hist = mergeHist(baseD.hist || [], histFromSnaps(snaps), minM);
             }

             const { data: events } = await supabase
                 .from('events')
                 .select('*')
                 .eq('family_id', FAMILY_ID)
                 .gt('device_ts', snapshotTs)
                 .neq('event_type', 'SNAPSHOT_MONTHLY')
                 .order('device_ts', { ascending: true });

             if (events && events.length > 0) {
                 events.forEach(ev => {
                     baseD = reduceD(baseD, { type: ev.event_type, payload: ev.payload });
                 });
             }

             // Aplica a fila local POR ÚLTIMO para que DEL_TX, etc., sejam
             // sempre respeitados sobre o estado vindo do servidor.
             const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
             q.forEach(ev => {
                 baseD = reduceD(baseD, { type: ev.event_type, payload: ev.payload });
             });

             const currentYM = nowYM();
             if (baseD && baseD.lastMonth !== currentYM) {
                 baseD = applyRollover(baseD);
                 const rolloverEvent = {
                     id: crypto.randomUUID(),
                     client_id: CLIENT_ID,
                     family_id: FAMILY_ID,
                     event_type: 'SNAPSHOT_MONTHLY',
                     payload: baseD,
                     device_ts: Date.now(),
                 };
                 const currentQ = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
                 currentQ.push(rolloverEvent);
                 localStorage.setItem(QUEUE_KEY, JSON.stringify(currentQ));
                 setQueueCount(currentQ.length);
             }

             setD(baseD);
         } catch (err) {
             console.error('catchUp failed:', err);
         } finally {
             // Após carregar do server, dispara o envio da fila local
             // triggerSync() vai setar 'online' se a fila estiver vazia,
             // ou 'syncing' temporariamente enquanto envia.
             triggerSync();
         }
     }

     catchUp();

     const makeOnline = () => { triggerSync(); };
     const makeOffline = () => setSyncStatus('offline');
     window.addEventListener('online', makeOnline);
     window.addEventListener('offline', makeOffline);
     return () => {
         window.removeEventListener('online', makeOnline);
         window.removeEventListener('offline', makeOffline);
     };
  }, [triggerSync]);

  useEffect(() => {
     if (!supabaseReady) return;
     let isActive = true;
     const channel = supabase.channel('table-db-changes')
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events', filter: `family_id=eq.${FAMILY_ID}` }, (payload) => {
           if (!isActive) return;
           const ev = payload.new;
           if (ev.client_id !== CLIENT_ID) {
               setD(prev => reduceD(prev, { type: ev.event_type, payload: ev.payload }));
           }
       })
       .subscribe();

     return () => {
         isActive = false;
         supabase.removeChannel(channel);
     };
  }, []);

  return { D, dispatch, spent, totFix, totInst, totInc, sumGoals, saldo, totPendRecv, syncStatus, queueCount };
}