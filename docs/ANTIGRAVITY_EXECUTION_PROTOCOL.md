# ??? Antigravity Execution Protocol: Om Knowledge OS (v2.0)
**Specification Version:** 2026.10  
**Effective Date:** October 15, 2026  
**Status:** Active Protocol (Phase 0 Reconciled)  
**Platform Deprecation Guard:** Migrated from legacy IDE workflows (`.agents/workflows/`) ahead of the October 19, 2026 platform cutoff. Standardized on persistent Project Rules (`AGENTS.md`) and focused Agent Skills (`.agents/skills/`).

---

## 1. Executive Context & System Inventory

| Application Surface | Target Devices / Roles | Key Files & Schemas | Source Status |
| :--- | :--- | :--- | :--- |
| **Om Knowledge OS Desktop & Mobile PWA** | Primary personal OS (Windows 11 `Aditya` & Samsung Galaxy S25 Ultra, responsive 360px–1920px) | `src/App.tsx`, `src/components/*`, `src/db/index.ts`, `public/manifest.json`, `public/sw.js` | Active Production (`http://localhost:5173/`) |
| **Local-First Database (Dexie/IndexedDB)** | Offline tabular store for Projects, Tasks, Knowledge Vault, Goals, Journal, and Pantry | `src/db/index.ts` (Stores: `projects`, `tasks`, `knowledge`, `goals`, `journal`, `pantry`, `syncConflicts`) | Active Local Persistence |
| **3-Way Google Sheets Sync Gateway** | Authenticated bidirectional sync and TSV clipboard bridge | `src/services/sheetsSync.ts`, `src/components/GoogleSheetsSyncModal.tsx`, `UNIFIED_GOOGLE_APPS_SCRIPT_SYNC.gs` | Deployed Gateway |
| **Source Knowledge Archives** | 24 extracted Notion OS modules and philosophical study vault | `notion_os/*.md`, `my_notes/*.md`, `om_knowledge_os_comprehensive_guide.md` | Authoritative Ground Truth |
| **Safe-Proof Versioning Engine** | Pre-edit physical snapshotting & 1-click restore | `scripts/backup.ps1`, `scripts/rollback.ps1`, `version_backups/manifest.jsonl` | Active Git & Backup Rig |

---

## 2. Phase 0: Architecture Alternatives & Technical Trade-offs

### A. Core Architecture Evaluation
* **Alternative 1: Cloud-Tethered Backend (Firebase / Supabase / Cloud Run)**
  * *Mechanism:* Host serverless Postgres or Firestore database in cloud; web client queries via REST/GraphQL.
  * *Assessment:* **Rejected.** Requires mandatory internet connection, introduces monthly recurring billing risks, locks personal second-brain notes behind cloud credentials, and violates the "offline-autonomous on Samsung S25 Ultra" requirement.
* **Alternative 2: Pure Plaintext Markdown Vault (Obsidian Style)**
  * *Mechanism:* Store all data as `.md` files parsed on the fly with regex/frontmatter.
  * *Assessment:* **Rejected for tabular state.** While excellent for atomic notes (Vivarta Vada, Mati & Vivek), purely flat markdown fails on relational tasks (Eisenhower Q1–Q4 sorting, Kanban state transitions, inventory reorder thresholds, and formula calculations).
* **Alternative 3: Hybrid Local-Core / Sheets-Satellite (Chosen Architecture)**
  * *Mechanism:* Local Dexie (IndexedDB) for zero-latency, offline-first execution on desktop and mobile, paired with an authenticated Google Apps Script Webhook and TSV bridge for Google Sheets synchronization.
  * *Assessment:* **Selected.** Sub-10ms UI query latency, 100% offline functionality, zero recurring subscription fees, full Google Sheets formula interoperability, and 1-click JSON backup portability.

### B. Free-Tier Limits & Quota Audit
1. **Google Apps Script Webhook**:
   - Quota: 20,000 URL Fetch calls/day; 90 min/day execution time.
   - Current Consumption: ~20–60 sync calls/day for single-user workflow (<0.3% of quota). 100% Free.
2. **Google Sheets Limits**:
   - Quota: 10,000,000 cells per workbook.
   - Current Consumption: 5 sheets (Tasks, Projects, Goals, Pantry, Knowledge) using ~1,200 cells (<0.012% of quota).
3. **Browser Local Storage / IndexedDB**:
   - Quota: Up to 80% of available disk space on Chromium / Samsung Internet (>50 GB on S25 Ultra and Windows 11).
   - Current Consumption: ~4.5 MB for all 24 modules and pre-seeded notes.
4. **Vite / Local Dev Server**:
   - Port 5173 localhost & LAN bind (`0.0.0.0`). Zero external hosting bandwidth consumed.

### C. Data Classification & Privacy Boundaries
* **Confidential Tier (Local-Only & Authenticated Passkey)**:
  - Personal journal entries (Pranic energy, mental clarity, reflection notes).
  - Financial, asset, and land research criteria (Uttarkashi Tehsil Khatauni records).
  - Stored strictly in local IndexedDB; never sent over unauthenticated internet channels.
* **Synchronized Tabular Tier (Google Sheets Bridge)**:
  - Structured Tasks (Eisenhower matrix, deadlines, status).
  - Kitchen/pantry inventory (Rashan, Ayurvedic supplements, reorder points).
  - High-level life goals (OKRs and progress percentages).
* **Public / Open Source Tier**:
  - React components, Tailwind styling, offline service worker (`sw.js`), and open documentation.

---

## 3. Inviolable Operational Rules (AGENTS.md Alignment)
1. **Zero Accidental Data Loss (`accidental-data-loss-prevention`)**:
   - Never delete or overwrite Dexie tables or markdown source files without pre-edit snapshot verification.
2. **Pre-Edit Snapshot Enforcement**:
   - Every modification to application source code must be preceded by `powershell scripts/backup.ps1`.
3. **Local-First Conflict Rule**:
   - In any synchronization collision between local Windows 11/Android edits and Google Sheets, local edits always prevail. Remote variants are archived into `syncConflicts`.
4. **Strict Approval Boundaries**:
   - Research and planning (Phase 0) must halt at the approval gateway before any phase implementation begins.

---

## 4. Verification & Testing Protocol (Acceptance Criteria)

### Test 1: Capability & Discovery Audit
* Verify `AGENTS.md` is detected at repository root.
* Verify 4 focused skills in `.agents/skills/`:
  1. `om-os-sheets-sync`
  2. `om-os-backup-rollback`
  3. `om-os-pwa-mobile-build`
  4. `om-os-knowledge-markdown-bridge`
* Confirm legacy `.agents/workflows/` and `.gemini/workflows/` are absent.

### Test 2: Intent-Trigger & Progressive Loading Check
* Non-destructive dry run testing progressive loading of specific `SKILL.md` instructions based on natural user intent.
