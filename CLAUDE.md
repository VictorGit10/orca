# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orça is a Brazilian Portuguese personal finance app (currency: BRL). Data persists via localStorage (auto-save) with optional Supabase real-time sync across devices. When Supabase env vars are absent, the app works offline-only; JSON export/import (in `AjudaModal`) is then the only backup path. The core workflow: configure once (fixed expenses, income, category goals, emergency reserve), then each month inform the real balance and distribute the resulting saldo livre across categories and investment.

## Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # Production build to dist/
npm run lint      # ESLint 9 flat config (eslint .)
npm run test      # Vitest — run tests once
npm run test:watch # Vitest — watch mode
npm run preview   # Preview production build
```

## Architecture

**Component structure:**
- `src/App.jsx` — Shell: navigation, FAB, help button (`?`), modals
- `src/hooks/useAppData.js` — State management hook (localStorage, rollover, computed values, Supabase sync, hist backfill from snapshots)
- `src/store/reducer.js` — Reducer function (`reduceD`), rollover logic (`applyRollover`), and storage keys (`STORAGE_KEY`, `QUEUE_KEY`, `CLIENT_ID`, `FAMILY_ID`)
- `src/lib/supabase.js` — Supabase client initialization and `supabaseReady` flag
- `src/utils.js` — Pure functions: `BRL`, `mLeft`, `nowYM`, `prevYM`, `calcSpent`, `calcSaldo`, `calcMonthTotal`, `histFromSnaps`, `mergeHist`, `pickBaseline`, etc.
- `scripts/backup.mjs` — Dumps the whole `events` table to JSON (`npm run backup`); reads `.env.local`, never hardcode credentials
- `src/palette.js` — Color palette (`P`)
- `src/seed.js` — Initial data (`SEED`)
- `src/components/` — UI components (atoms, HomeTab, SaldoTab, CompTab, HistTab, AnaliseTab, GastoModal, RemanejoModal, SaldoCalcModal, AjudaModal, GastosFixosSection, EntradasSection)

**State:** `useAppData` hook manages a single `D` object via `useState` and `reduceD`. Computed values (spent, totals, saldo) use `useMemo`. Data auto-saves to localStorage on every change.

**Navigation:** Tab-based via `useState(0)` — no router library. Five tabs: Início, Saldos, Obrig., Histórico, Análise.

**Monthly rollover:** `applyRollover()` in `src/store/reducer.js` checks if the month changed. If so, it archives the closing month into `D.hist` (per-category goals, reserva, bal, pote — capped at 36 entries), clears the saldo calculator scratchpad (`D.calc`), zeroes balance, clears `inc` (legacy), removes received (`got: true`) reimbursements, resets pending reimbursements to `got: false`, accumulates `investGoal` into `investAcumulado`, and queues a `SNAPSHOT_MONTHLY` event to localStorage for Supabase sync.

**Monthly history (aba Análise):** `D.hist` stores one record per closed month: `{ m: 'YYYY-MM', cats: { catId: goal }, res, bal, inv }`. Spent-per-month is always recomputed from `D.txs` (never pruned); goals/reserva of past months only exist in `hist`. On session start, `catchUp` fetches ALL `SNAPSHOT_MONTHLY` events (not just the latest) and merges them into `hist` via `histFromSnaps` + `mergeHist` (local records win per month) — this backfills history for data created before `hist` existed. Offline-only installs build `hist` from rollovers going forward.

⚠️ **Snapshot month semantics — read before touching `histFromSnaps`.** A `SNAPSHOT_MONTHLY` is written *after* `applyRollover`, so its payload is already the NEW month's state: `payload.lastMonth` is the month starting and `payload.bal` is already zeroed. The goals/reserve inside it are the ones that were in force during the month that just CLOSED. Therefore `histFromSnaps` labels each legacy snapshot with `prevYM(payload.lastMonth)`. Getting this wrong shifts the entire history by one month (it did, before v1.2). Snapshots written by v1.2+ carry `payload.hist` and are used directly instead of being reconstructed.

**Baseline selection (`pickBaseline`):** normally the most recent snapshot. A device that snapshots before finishing catch-up can write an incomplete baseline that freezes the app in a wrong past, so a candidate is rejected when an OLDER snapshot holds more than double its transaction count. `mergeHist` also takes a `minM` floor (the earliest transaction month) to drop phantom months produced by the backfill.

**Saldo calculator:** `D.calc = { accts: [{ id, name, val }], cards: [{ id, name, val }] }` is a month-scoped scratchpad (cleared at rollover) used by `SaldoCalcModal` (button "Calc" next to Saldo informado): sum of accounts minus card invoices. It does NOT change the saldo livre formula — applying it just dispatches `UPD_BAL` with the computed result (supports multiple accounts).

**Styling:** All inline `style={{}}` objects — no CSS framework, no CSS modules. `index.css` has only a global reset and animation keyframes.

**Remanejamento:** The `RemanejoModal` redistributes "saldo livre" across category goals and investment — core budget balancing feature.

**Sync architecture (Supabase):**
- `src/lib/supabase.js` initializes the Supabase client; `supabaseReady` flag indicates env vars are present
- Event queue: unsynced actions are stored in localStorage under `orca-queue` and sent via `triggerSync()` on the next online event
- `CLIENT_ID` (per-device UUID) and `FAMILY_ID` (from env) tag every event for multi-device conflict resolution
- `SNAPSHOT_MONTHLY` events in the `events` table serve as catch-up baselines (chosen by `pickBaseline`, not blindly the newest)
- `SNAPSHOT_MONTHLY` is also how a JSON import restores state: it replaces `D` wholesale and propagates the restore to the other devices
- Real-time: Postgres changes subscription pushes remote events from other devices into local state

## Key Conventions

- JavaScript only (no TypeScript)
- All UI text is Brazilian Portuguese
- Currency formatting via `BRL()` helper in `utils.js`
- Calculation logic is in pure functions in `utils.js` — testable without React
- ESLint: `no-unused-vars` ignores variables starting with uppercase or underscore
- Never remove or change the meaning of an existing `event_type` — months-old events are still replayed. Changes must be additive; `default: return prev` lets older clients ignore unknown events
- Never hardcode credentials, family ids, or personal record ids in source — this repo is public
- Data model originally specced in `Apenas histórico/EstruturaBasica.md`, a sibling directory of the author's working copy that is NOT part of this repository

## Saldo Livre Formula

```
Saldo informado + Entradas do mês + Ressarcimentos pendentes - Gastos fixos - Parcelas pendentes - Reserva - Pote de Investimentos = SALDO LIVRE
```

**Important:** The deduction is `investAcumulado` (the accumulated investment pot), NOT `investGoal` (the monthly target). This is by design — the accumulated pot represents money already committed to investments but still sitting in the bank account, so it must be subtracted to reflect the truly free balance. Each month, `applyRollover` adds `investGoal` to `investAcumulado`.

**Ressarcimentos:** Reimbursements are created through the GastoModal with the "reembolsável" toggle. They count toward saldo only from the month after they were created (pending reimbursements from past months). At month rollover, received (`got: true`) reimbursements are removed since their value has already been absorbed into the balance.

Saldo livre vs. sum of category goals = "disponível para alocar" (positive = surplus, negative = over-budget).