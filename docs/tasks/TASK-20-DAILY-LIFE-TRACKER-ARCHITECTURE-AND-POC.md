# TASK-20 — Personal Daily Life Tracker (Architecture Reconciliation & Phase 1 PoC)

**Workspace Path:** `docs/tasks/TASK-20-DAILY-LIFE-TRACKER-ARCHITECTURE-AND-POC.md`  
**Status:** Staged (Isolated from running `TASK-19` — DO NOT touch or interrupt `TASK-19`)  
**Model Routing (Oct 2026 Spec):** Routine/UI drafting via `Gemini 3.8 Flash`; Temporal & Overlap Engine reasoning via `Gemini 3.1 Pro`.

---

## 1. Safety & Task Isolation Guardrails (CRITICAL)
1. **Zero Interference with `TASK-19`**: Do NOT modify, overwrite, archive, or abort `TASK-19` or any files actively locked by `TASK-19`.
2. **Pre-Execution Check**: Before starting `TASK-20` implementation, verify whether `TASK-19` has completed and moved to `docs/tasks/archive/`. During this initial `/plan` pass, perform **READ-ONLY inspection (`INSPECT` & `PLAN`)** only.
3. **Brownfield Preservation**: Preserve all dirty/untracked files and existing `om_os_app` modules (`PdfReaderView`, `ResearchHubView`, `ProjectPortfolioView`, `DocumentIntelligenceModal`, and `.agents/skills/*`).

---

## 2. Reconciled Workspace Stack (Evidence from `structure.txt`)
Instead of treating the stack as an unknown blank slate, `TASK-20` leverages the verified dependencies already installed in `om_os_app`:
- **Frontend / Windows 11 PWA**: React + TypeScript + Vite + Tailwind CSS (`@tailwindcss/vite`, `lucide-react`), using existing `om-os-pwa-mobile-build` (`manifest.json`, `sw.js`).
- **Local-First Durable Store**: **Dexie.js** (`dexie`, `dexie-react-hooks`, `idb-keyval`) for zero-latency local commits, revision history, and `SyncOperation` outbox.
- **Android Native Host & Widget**: **Capacitor Android** (`com.omknowledge.os` in `om_os_app/android/app/src/main/java/com/omknowledge/os/MainActivity.java`). Native Android `AppWidgetProvider` + `RemoteViews` (`setChronometer` with `SystemClock.elapsedRealtime()`) will bridge to the local SQLite/IndexedDB/SharedPreferences store.

---

## 3. User-Confirmed Product Invariants (3 November 2026)
1. **Three Capture Modes**:
   - **Mode A (Instant Event)**: 1-tap timestamp (`occurred_at` separate from `recorded_at`), no mandatory duration.
   - **Mode B (Start/Stop Interval)**: Persisted open interval (`RUNNING`, `PAUSED`, `STOPPED`, `NEEDS_REVIEW`, `CONFLICTED`).
   - **Mode C (Retrospective / Batch Reconstruction)**: Last 15/30/60m or custom gap. Hybrid visual timeline + direct separate **Hours** (`0-23+`) and **Minutes** (`0-59`) inputs.
2. **Primary Timer Closure Confirmation**:
   - Starting a new Primary activity while a Primary timer is running MUST prompt before closing: offer `End at current time` or `Set actual end time` (with Exact/Approximate confidence).
   - If closed at an earlier time (e.g., opened at 1:00 PM, ended Lunch at 12:30 PM), leave 12:30–1:00 PM as **Untracked Time**. Never auto-fill gaps.
3. **Wake Closes Sleep**:
   - Recording `Wake` while `Sleep` is running closes `Sleep` using the selected Wake time (`Wake now` or retrospective `Set actual wake time`).
4. **Hybrid Interruption Model**:
   - Brief interruptions may be logged as `Secondary` (overlapping without inflating the 24-hour Primary allocation); substantial interruptions split/replace the `Primary` interval. Configurable threshold (5-min initial test candidate).
5. **Decomposed Confidence & Completeness Model**:
   - UI Labels: `Exact — Live`, `Exact — Retrospective`, `Estimated`, `Sequence Only`, `Unknown`.
   - Domain decomposition: `capture_method` (`LIVE` | `RETROSPECTIVE` | `SYSTEM_DERIVED` | `IMPORTED`), `start_confidence` (`EXACT` | `ESTIMATED` | `UNKNOWN`), `end_confidence` (`EXACT` | `ESTIMATED` | `UNKNOWN`), `duration_confidence`, and `sequence_order`.
   - Never divide a window equally among sequence-only activities without explicit user input and `Estimated` marking.
6. **Time-Zone & Day Projection**:
   - Store UTC instant + IANA timezone ID + UTC offset + wall-clock context.
   - Half-open intervals `[start, end)`. Support both **Calendar Day (00:00–24:00 local)** and **Wake Cycle (Wake-to-Wake)** views from a single canonical record without duplication.
7. **Android Widget Contract & Resource Budget**:
   - Dedicated ongoing timer panel (`setChronometer` — zero 1-minute background polling).
   - Separate list of **3 most recent completed/saved entries** (active running timer does not consume a slot).
   - Expandable/collapsible multi-action quick panel with user add/remove/pin/reorder and lightweight local adaptive ranking (frequency, recency, time-of-day, non-binding historical duration hints).
8. **Privacy & Sync**:
   - Local-first write before sync. Optional cloud sync with E2EE target, recovery key, full export/restore, and zero third-party AI data sharing without explicit opt-in.

---

## 4. Phased Implementation Plan (Within `om_os_app`)
- **Phase 1 (Read-Only Audit & PoC Design)**: Inspect `om_os_app/src/` to map how Dexie schemas, views, and Capacitor plugins are currently structured. Propose the exact file tree for the Daily Life Tracker module and Native Android Widget bridge.
- **Phase 2 (Temporal Domain & Dexie Schema)**: Implement TypeScript domain types (`ActivityDefinition`, `ActivityOccurrence`, `TimeSegment`, `ReconstructionBatch`, `RecordRevision`, `SyncOperation`) and pure unit tests for AT-01 to AT-19.
- **Phase 3 (Capture UI & Retrospective Workspace)**: Build the React views (Quick Capture, Active Timer Confirmation Modal, Hybrid Retrospective Editor with separate Hours/Minutes controls, 24h Timeline).
- **Phase 4 (Capacitor Android AppWidget PoC)**: Implement native `AppWidgetProvider` in `om_os_app/android/` with 3 recent entries, `RemoteViews.setChronometer`, and expandable quick actions.

---

## 5. Acceptance Gates
Must pass AT-01 through AT-36 as defined in the Master Functional Specification before production sign-off.
