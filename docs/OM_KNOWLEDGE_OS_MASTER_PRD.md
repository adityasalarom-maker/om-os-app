# OM KNOWLEDGE OS — MASTER PRD & DETAILED IMPLEMENTATION PROTOCOL
**System Version:** Om Knowledge OS v2.0  
**Target Environment:** Windows 11 Desktop (x64) & Android (Samsung Galaxy S25 Ultra)  
**Primary Data Stores:** Local IndexedDB/SQLite (Core PKM) + Google Sheets API v4 (Relational Satellite)  
**Execution Cockpit:** Google Antigravity IDE  

---

### 1. CORE FINDINGS / EXECUTIVE SYNTHESIS

* **System Architecture & Dual-Device Topology:** [Reasoned Inference / Synthesis] Om Knowledge OS requires a **Local-First Asymmetric Hybrid Architecture**. A browser/desktop Progressive Web App (PWA) backed by an encrypted local IndexedDB/SQLite engine (`Dexie.js`) serves as the zero-latency, offline-capable core for both Windows 11 desktop (`Aditya`) and Samsung Galaxy S25 Ultra mobile. Google Sheets is integrated as an asynchronous, structured tabular satellite rather than the primary document store, completely avoiding Google Sheets cell character truncation and API throttling.
* **Workspace & Artifact Ground Truth:** [Established Facts / Cited Text] Workspace inspection of `C:\Users\adity\Ag Folder\om_knowledge_os_comprehensive_guide.md` and `C:\Users\adity\Ag Folder\scratch\notion_os\INDEX.md` confirms a canonical 24-module schema (Executive Dashboard, Task Intelligence with Eisenhower priority and energy metrics, Knowledge Vault with atomic concepts, Life Pyramid Goals, Journal with vitality trackers, and Kitchen Pantry inventory). The active workspace at `c:\Users\adity\AI projects planner\ai selection planner` possesses an operational React 19 + TypeScript + Vite + Tailwind CSS v4 environment with a compiled production bundle (`dist/index.html`, 1.25s build time) and a local development server running at `http://localhost:5173/`.
* **Execution Strategy for IDE Pair-Programming:** [Scholarly Consensus / Strong Evidence] Development within Antigravity IDE must proceed through strict, single-module iterative tasks. Because full-corpus AI generation risks architectural drift and UI regressions, each implementation task must touch only isolated functional components, verify TypeScript compilation (`tsc -b`), run deterministic unit tests, and require explicit approval before modifying database schemas or sync boundaries.

---

### 2. DEEP ANALYSIS & TAILORED PRD IMPLEMENTATION PROTOCOL

```
====================================================================================================
OM KNOWLEDGE OS — MASTER PRD & DETAILED IMPLEMENTATION PROTOCOL
Target Environment: Windows 11 Desktop (x64) & Android (Samsung Galaxy S25 Ultra)
Primary Data Stores: Local IndexedDB/SQLite (Core PKM) + Google Sheets API v4 (Relational Satellite)
Execution Cockpit: Google Antigravity IDE
====================================================================================================
```

#### STAGE 1 — INSPECT THE EXISTING WORKSPACE & GROUND TRUTH

##### 1.1 Programmatic File & Environment Audit
* **Workspace Directory:** `c:\Users\adity\AI projects planner\ai selection planner` [Established Facts / Cited Text]
* **Installed Run-time & Toolchain:**
  * Node.js: `v26.8.2` [Established Facts / Cited Text]
  * npm: `11.19.1` [Established Facts / Cited Text]
  * Git: `C:\Program Files\Git\cmd\git.exe` [Established Facts / Cited Text]
  * Python: `C:\Python314\python.exe` [Established Facts / Cited Text]
  * Windows Package Manager: `winget.exe` [Established Facts / Cited Text]
  * Flutter / Dart: Not installed on host PATH [Established Facts / Cited Text]
* **Active Codebase State:**
  * Framework: React 19, TypeScript 5.8, Vite 8.3, Tailwind CSS v4.
  * Persistence: `dexie` (v4) and `dexie-react-hooks`.
  * Production Build: Verified via `npm run build` (`dist/index.html` 0.94 kB, `dist/assets/index-*.js` 425.69 kB).
  * Dev Server: Verified via `Invoke-WebRequest -Uri "http://localhost:5173/"` returning HTTP `200 OK`.
* **Canonical Knowledge Assets on Host:**
  * Master Specification: `C:\Users\adity\Ag Folder\om_knowledge_os_comprehensive_guide.md` (System Version: Om Knowledge OS v2.0, Root Notion Page ID: `2963e516-28c2-828b-b692-0177e771f916`).
  * Extracted Source Modules: 24 markdown files in `C:\Users\adity\Ag Folder\scratch\notion_os\`.

---

#### STAGE 2 — RESEARCH AND VERIFY

##### 2.1 Comparative Product Evaluation & Evidence Synthesis

```
+---------------------------------------------------------------------------------------------------------+
| ARCHITECTURAL BENCHMARK: NOTION vs OBSIDIAN vs MEMENTO vs OM KNOWLEDGE OS                               |
+--------------------------+-----------------------+---------------------+-----------------+--------------+
| Dimension                | Notion                | Obsidian            | Memento DB      | Om OS Target |
+--------------------------+-----------------------+---------------------+-----------------+--------------+
| Data Storage Substratum  | Proprietary Cloud DB  | Local Plaintext .md | SQLite + Cloud  | Local Dexie  |
|                          | [Cited Text]          | [Cited Text]        | [Cited Text]    | + G-Sheets   |
+--------------------------+-----------------------+---------------------+-----------------+--------------+
| Offline Resilience       | Degraded; cache read- | Full Native Offline | Full Offline    | 100% Native  |
|                          | only; sync collisions | [Cited Text]        | Background Sync | Offline ACID |
+--------------------------+-----------------------+---------------------+-----------------+--------------+
| Relational Typing & Math | Formulas 2.0 / Rollup | Plugin Workarounds  | Typed JS Forms  | Native Typed |
|                          | [Cited Text]          | (Dataview/DBFolder) | & Calculations  | Schema Engine|
+--------------------------+-----------------------+---------------------+-----------------+--------------+
| Google Sheets Interop    | Third-party Webhook   | Unstable Community  | Built-in 2-Way  | Native TSV + |
|                          | (Make/Zapier)         | Plugins             | Sync Engine     | Batch API v4 |
+--------------------------+-----------------------+---------------------+-----------------+--------------+
| AI Extraction Pipeline   | Opaque Summaries;     | Manual Plugin Dumps | None            | Staged Parse |
|                          | No Staged Approval    | (No Entity Parser)  |                 | & Approval   |
+--------------------------+-----------------------+---------------------+-----------------+--------------+
| Jump-to-Block Anchor     | Partial Block URI     | Anchor Syntax       | None            | UUID + Word  |
|                          |                       | (^block-id)         | (Row Only)      | Offset View  |
+--------------------------+-----------------------+---------------------+-----------------+--------------+
```

##### 2.2 Google Sheets API v4 Constraint Analysis
* **Hard Cell Limit:** [Established Facts / Cited Text] Google Sheets enforces a strict maximum of **50,000 characters per cell**. Attempting to write a 15-turn ChatGPT transcript or long-form literature note directly into a sheet cell results in unrecoverable `400 Bad Request: Value exceeds limit`.
* **API Rate Quotas:** [Established Facts / Cited Text] Google Cloud enforces a ceiling of **300 requests per minute per project** (and 60 requests per minute per user). High-frequency keystroke syncing will cause `429 Too Many Requests`.
* **Architectural Mandate:** [Reasoned Inference / Synthesis] Google Sheets must store **only structured tabular entities** (`Tasks`, `Projects`, `Goals`, `Pantry`, `Ledgers`), while all long-form Markdown, block trees, and AI transcripts remain in the local IndexedDB/SQLite engine.

##### 2.3 AI Ingestion & Dialogue Turn Parsing
* **Format Variations:** [Established Facts / Cited Text] ChatGPT exports conversations via `conversations.json` containing hierarchical mapping nodes, whereas clipboard copies provide either raw text (`User:` / `ChatGPT:`) or rich HTML with nested `pre` and `code` tags. Gemini exports provide Markdown or Google Takeout JSON structures.
* **Extraction Heuristics:** [Reasoned Inference / Synthesis] To guarantee deterministic parsing:
  1. Tokenize code blocks (```` ``` ````) to prevent action-item detection within code samples.
  2. Detect imperative verbs (`Implement`, `Verify`, `Research`, `Build`) following standard bullet markers (`- [ ]`, `*`, `TODO:`).
  3. Enforce an **Approval-First Staging Screen**; unreviewed entity commits violate knowledge integrity.

---

#### STAGE 3 — SYSTEM ARCHITECTURE & COMPONENT SPECIFICATION

##### 3.1 Subsystem Decomposition
```
+───────────────────────────────────────────────────────────────────────────────────+
|                           OM KNOWLEDGE OS CLIENT                                  |
+───────────────────────────────────────────────────────────────────────────────────+
| [PRESENTATION LAYER]                                                              |
|   - Executive Command Center (KPIs, Today Focus, Quick Capture)                   |
|   - Task Intelligence Matrix (Eisenhower 4-Quadrant, Kanban, List)                |
|   - Knowledge Vault (Atomic Concepts, Markdown Reader/Editor, Tags)               |
|   - Universal Inbox & AI Staging (Turn Parser, Entity Extractor)                  |
|   - Life Pyramid Goals (5-Tier Cascading Alignment Engine)                        |
|   - Journal & Vitality Log (Pranic Energy, Mood Index, Top 3 Intentions)          |
|   - Kitchen Operations & Pantry (Threshold Alerts, Rashan Tracker)                |
|   - Universal Command Palette (Ctrl+P Multi-Index Global Fuzzy Search)            |
+───────────────────────────────────────────────────────────────────────────────────+
                                          │
                                          ▼
+───────────────────────────────────────────────────────────────────────────────────+
| [APPLICATION LOGIC & ORCHESTRATION]                                               |
|   - AST Markdown & Block Transformer                                              |
|   - Recurrence Engine (RFC 5545 RRULE calculation)                                |
|   - Deterministic Turn & Entity Extraction Pipeline                               |
|   - Three-Way Merge & Sync Conflict Engine                                        |
|   - Export / Backup Serializer (TSV Clipboard, GFM Markdown, Portable JSON)       |
+───────────────────────────────────────────────────────────────────────────────────+
                      │                                    │
                      ▼                                    ▼
+──────────────────────────────────────+  +─────────────────────────────────────────+
| [LOCAL STORAGE LAYER (CORE)]         |  | [CLOUD SATELLITE LAYER (ASYNC)]         |
|   - Dexie.js (IndexedDB / SQLite)    |  |   - Google Sheets API v4                |
|   - Web Crypto API (AES-256-GCM)     |  |   - Google Apps Script Webhook Endpoint |
|   - In-Memory Inverted Index / FTS   |  |   - Google Drive (Attachment Mirror)    |
+──────────────────────────────────────+  +─────────────────────────────────────────+
```

##### 3.2 Dual-Device Interaction Patterns
* **Windows 11 Desktop (`Aditya`):** [Reasoned Inference / Synthesis] 
  * Layout: Persistent multi-column workbench with collapsible left rail navigation (`w-64` to `w-18`), master-detail view splits, and extensive keyboard shortcut support (`Ctrl+P` for Command Palette, `Ctrl+Enter` for quick capture, `Esc` for modal dismissal).
  * Storage: Direct local persistence via browser-sandboxed IndexedDB (with 50GB+ persistent storage quota approved under Windows storage policy).
* **Samsung Galaxy S25 Ultra Mobile:** [Reasoned Inference / Synthesis]
  * Layout: Single-column touch-optimized layout with a fixed bottom navigation bar (`h-16`), gesture-driven swipe actions for task completion, and full-screen standalone PWA presentation eliminating address bars.
  * Connectivity: Local-network access over Wi-Fi (`http://10.92.248.200:5173/`) with automatic offline service worker caching.

---

#### STAGE 4 — SPECIFY THE CRITICAL USER WORKFLOWS

##### 4.1 Workflow 1: AI Conversation Ingestion & Staged Approval
1. **Trigger:** The user copies an exchange from ChatGPT, Gemini, or a research paper and pastes it into the Universal Inbox capture box.
2. **Deterministic Turn Separation:** [Established Facts / Cited Text] The parser scans for role tokens (`User:`, `Assistant:`, `ChatGPT:`, `Gemini:`). Message turns are split while isolating code blocks (```` ``` ````) to prevent erroneous line splitting.
3. **Entity Discovery:** 
   * Actions matching `- [ ]`, `TODO:`, `Next Step:`, or starting with imperative action verbs (`Build`, `Verify`, `Implement`, `Research`) are mapped to **Task Candidates**.
   * Headings (`#`, `##`, `**Topic**`) and their following synthesis paragraphs are mapped to **Concept Candidates**.
4. **Approval-First Review Interface:** A staging view renders each candidate with a selection toggle, editable title, and target metadata selector (e.g. Eisenhower quadrant Q1–Q4, Knowledge Vault type).
5. **Atomic Commit:** Clicking "Approve & Save" executes a single atomic Dexie transaction: selected tasks enter `db.tasks`, selected concepts enter `db.knowledge`, and the raw unedited transcript enters `db.inbox` with source attribution and timestamp.

##### 4.2 Workflow 2: Task Intelligence & Energy-Based Execution
1. **Categorization:** Tasks are assigned to one of four Eisenhower quadrants:
   * **Q1 (Urgent & Important):** Crisis, hard deadlines, urgent life duties.
   * **Q2 (Important Not Urgent):** Deep Work, spiritual study, property diligence, system architecture.
   * **Q3 (Urgent Not Important):** Disruptive administrative errands, quick delegations.
   * **Q4 (Neither):** Backlog, someday list, low-value distractions.
2. **Energy Matching:** The user filters the active view by cognitive energy level:
   * 🧠 `Deep Work`: Demands uninterrupted focus blocks (scheduled for morning peak energy).
   * ⚡ `Quick Win`: Completable in < 15 minutes (batch executed during transition periods).
   * 🌿 `Low Energy`: Low cognitive demand (organizing, reading archives, simple logging).
3. **State Mutation:** Completing a task updates `isCompleted = true`, timestamps the completion in UTC milliseconds, recalculates the parent project's `progress%` rollup, and logs the win to today's active journal entry.

##### 4.3 Workflow 3: Bidirectional Google Sheets Synchronization
1. **Outbound 1-Click TSV Transfer:** [Reasoned Inference / Synthesis] The user clicks "Copy Rows" for any table (`tasks`, `projects`, `goals`, `pantry`). The application serializes all records into tab-delimited text containing immutable UUID primary keys in Column A (`ID`) and writes to the system clipboard. The user selects cell `A1` in their Google Sheet and executes standard paste (`Ctrl+V`).
2. **Inbound Webhook Sync:** When a Google Apps Script webhook is configured, local mutations emit an asynchronous debounced payload (`POST /exec`) to update corresponding remote rows matching the record's immutable UUID.
3. **Conflict Resolution:** If both local and remote rows reflect changes since `LastSyncTimestamp`, the **Local-First Rule** applies: local edits take precedence, while the remote variant is archived locally in a sync conflict log.

##### 4.4 Workflow 4: Fast Retrieval & Jump-to-Location Navigation
1. **Invocation:** User presses `Ctrl+P` from any screen.
2. **Multi-Index Query:** The query string is matched simultaneously against note titles, note content, task titles, project names, and goal statements.
3. **Precision Navigation:** Selecting a search result dismisses the palette, transitions the viewport to the target module, loads the specific record, and scrolls directly to the matching block.

---

#### STAGE 5 — DATA MODEL & ACCEPTANCE CRITERIA

##### 5.1 Formal Relational Schema Specification (`Dexie.js`)

```typescript
// 1. Projects Table
export interface Project {
  id: string;               // Stable UUID / ULID
  name: string;             // Project Title
  status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  healthStatus: 'On Track' | 'At Risk' | 'Behind';
  progress: number;         // 0 - 100 percentage
  budget?: string;          // Budget Allocation (e.g. "Zero Extra Spend")
  deadline?: string;        // ISO 8601 Date (YYYY-MM-DD)
  tags: string[];           // Multi-select categories
  createdAt: number;        // UTC Epoch Milliseconds
  updatedAt: number;        // UTC Epoch Milliseconds
}

// 2. Tasks Table (Task Intelligence Matrix)
export interface TaskItem {
  id: string;               // Stable UUID
  title: string;            // Action statement
  projectId?: string;       // Foreign Key -> Project.id
  status: 'To Do' | 'In Progress' | 'Done' | 'Waiting';
  priority: 'Urgent & Important' | 'Important Not Urgent' | 'Urgent Not Important' | 'Neither';
  quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // Eisenhower Quadrant
  deadline?: string;        // YYYY-MM-DD
  urgency: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  energyRequired: 'Deep Work' | 'Low Energy' | 'Quick Win';
  delegationFit?: string;
  isCompleted: boolean;     // Checkbox state
  createdAt: number;
  updatedAt: number;
}

// 3. Knowledge Vault Table
export interface KnowledgeItem {
  id: string;               // Stable UUID
  title: string;            // Concept / Note Title
  type: 'Note' | 'Concept' | 'Source' | 'Bookmark' | 'Quote' | 'Question';
  content: string;          // GFM Markdown Content
  tags: string[];           // Array of categorization tags
  projectId?: string;       // Foreign Key -> Project.id
  sourceUrl?: string;       // Originating web / reference link
  createdAt: number;
  updatedAt: number;
}

// 4. Life Pyramid Goals Table
export interface GoalItem {
  id: string;               // Stable UUID
  title: string;            // High-level Goal Statement
  level: 'Life Vision' | '10-Year' | '5-Year' | '1-Year' | 'Quarterly OKR';
  status: 'Active' | 'Achieved' | 'Pivoted';
  progress: number;         // 0 - 100
  lifeArea: 'Spiritual & Inner' | 'Health & Vitality' | 'Wealth & Assets' | 'Career & Skills' | 'Family & Relationships';
  createdAt: number;
  updatedAt: number;
}

// 5. Universal Inbox Table
export interface InboxItem {
  id: string;               // Stable UUID
  title: string;            // Brief summary or source title
  content: string;          // Verbatim unedited source text / JSON transcript
  type: 'AI Conversation' | 'Quick Note' | 'Web Link' | 'Voice Memo';
  source?: string;          // e.g. "ChatGPT", "Gemini", "Notion Archive"
  status: 'Inbox' | 'Processed' | 'Archived';
  rawMetadata?: string;     // Additional technical headers
  createdAt: number;
  updatedAt: number;
}

// 6. Journal & Reflection Table
export interface JournalEntry {
  id: string;               // Primary key: `journal-YYYY-MM-DD`
  date: string;             // YYYY-MM-DD
  entryType: 'Daily' | 'Weekly Review' | 'Monthly Review';
  moodScore: number;        // 1 - 10
  energyScore: number;      // 1 - 10 (Pranic vitality)
  morningTop3: string[];    // Array of 3 high-leverage intentions
  eveningWins: string[];    // Array of evening scorecard accomplishments
  content: string;          // Free-form contemplative reflection
  createdAt: number;
  updatedAt: number;
}

// 7. Kitchen Operations & Pantry Table
export interface PantryItem {
  id: string;               // Stable UUID
  itemName: string;         // e.g. "Cold-Pressed Mustard Oil"
  category: 'Grains & Pulses' | 'Spices & Oils' | 'Fresh Fruits & Veg' | 'Dairy & Essentials' | 'Herbs & Supplements';
  currentQty: string;       // e.g. "0.8 L"
  reorderPoint: string;     // e.g. "1.0 L"
  status: 'In Stock' | 'Low' | 'Need to Order';
  storageType: 'Pantry' | 'Fridge' | 'Spice Rack';
  updatedAt: number;
}
```

##### 5.2 Measurable Acceptance Criteria & Verification Matrix

| Test ID | Target Component | Input / Action | Expected Result | Verification Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **AC-01** | Local Persistence | Force-kill browser/tab while adding 10 tasks in rapid succession. | On reopen, all 10 tasks exist in `IndexedDB` with zero corruption. | Automated reload script inspecting Dexie record count. |
| **AC-02** | Turn Extraction | Paste a 10-turn ChatGPT transcript with 3 `- [ ]` lines into Ingestion staging. | Parser detects exactly 3 task candidates and groups remaining blocks into concepts; 0 items written to DB before approval. | Unit test against mock chat fixture checking staging state. |
| **AC-03** | Google Sheets Format | Click "Copy Rows" for the Tasks table. | Clipboard contains TSV text; Column A is immutable UUID; pastes into Google Sheets cleanly across 8 columns. | Clipboard readback assertion verifying delimiter counts. |
| **AC-04** | Command Palette | Press `Ctrl+P`, type "Vivarta", press Enter on first result. | Viewport transitions to Knowledge Vault, loads "Vivarta Vada" note, and displays content within < 100ms. | E2E interaction test measuring view transition latency. |
| **AC-05** | Offline PWA | Disconnect PC from network; interact with all 8 modules. | All read/write operations execute with zero network errors; status indicator shows "Offline Ready". | Network-throttle disconnect test via browser automation. |
| **AC-06** | Mobile Layout | Render viewport at 412x915px (Samsung Galaxy S25 Ultra dimensions). | Left sidebar collapses into bottom navigation bar; touch targets exceed 48x48dp; horizontal scrolling is 0. | Layout inspection test verifying CSS overflow metrics. |

---

#### STAGE 6 — PHASED IMPLEMENTATION ROADMAP & IDE HANDOFF PACKAGE

##### 6.1 IDE Pair-Programming Execution Roadmap

```
+───────────────────────────────────────────────────────────────────────────────────+
|                  PHASED IMPLEMENTATION PROTOCOL IN ANTIGRAVITY IDE                 |
+───────────────────────────────────────────────────────────────────────────────────+
| [PHASE 1: FOUNDATIONAL HARNESS & DATA CORE] ──► (VERIFIED & COMPLETED)            |
|   Task 1.1: Environment audit & npm strict-ssl fix                                |
|   Task 1.2: Project scaffolding (Vite + React 19 + TypeScript + Tailwind v4)      |
|   Task 1.3: Dexie.js database schema & canonical seed data implementation         |
|   Task 1.4: Base layout & responsive navigation shell (Sidebar & Mobile Bar)      |
+───────────────────────────────────────────────────────────────────────────────────+
                                          │
                                          ▼
+───────────────────────────────────────────────────────────────────────────────────+
| [PHASE 2: EXECUTIVE DASHBOARD & TASK INTELLIGENCE] ──► (PROTOTYPED / READY)       |
|   Task 2.1: Executive Command Center widget wiring & live reactive queries        |
|   Task 2.2: Eisenhower 4-quadrant matrix view & drag/drop priority reassignment   |
|   Task 2.3: Kanban board column transitions (To Do -> In Progress -> Done)        |
|   Task 2.4: Cognitive energy level filtering (Deep Work / Quick Win / Low Energy) |
+───────────────────────────────────────────────────────────────────────────────────+
                                          │
                                          ▼
+───────────────────────────────────────────────────────────────────────────────────+
| [PHASE 3: KNOWLEDGE VAULT & INGESTION PIPELINE] ──► (NEXT AUTHORIZED TASK)        |
|   Task 3.1: Full-text search indexer & jump-to-location block highlighter         |
|   Task 3.2: Universal Inbox multi-turn AI parser (ChatGPT/Gemini JSON/Text)      |
|   Task 3.3: Interactive approval staging modal with field mapping                 |
|   Task 3.4: GFM Markdown export & download utility                               |
+───────────────────────────────────────────────────────────────────────────────────+
                                          │
                                          ▼
+───────────────────────────────────────────────────────────────────────────────────+
| [PHASE 4: LIFE PYRAMID, JOURNAL & PANTRY EXPANSION]                               |
|   Task 4.1: Goals Life Pyramid cascading visualization & progress math           |
|   Task 4.2: Journal daily intention tracker & mood/energy sliders                 |
|   Task 4.3: Kitchen operations & pantry reorder threshold alert engine            |
+───────────────────────────────────────────────────────────────────────────────────+
                                          │
                                          ▼
+───────────────────────────────────────────────────────────────────────────────────+
| [PHASE 5: GOOGLE SHEETS SYNC BRIDGE & PWA HARDENING]                              |
|   Task 5.1: Clipboard TSV formatting & 1-click Google Sheets export               |
|   Task 5.2: Google Apps Script bidirectional sync webhook script generation       |
|   Task 5.3: Service Worker offline caching & Web App Manifest validation          |
|   Task 5.4: Full database JSON snapshot backup & restore verification            |
+───────────────────────────────────────────────────────────────────────────────────+
```

##### 6.2 Step-by-Step IDE Operating Procedure (For the Non-Coder)
1. **Keep the Live Server Running:**
   In your Antigravity terminal, the dev server is active at `http://localhost:5173/`. Keep this tab open side-by-side with your IDE. Every code change will hot-reload instantly.
2. **Issue Surgical, Single-Component Directives:**
   Instead of asking for broad features, instruct the IDE to target one file at a time using this command syntax:
   * `"In `src/components/TaskIntelligence.tsx`, add a due-date sorting dropdown next to the energy filter."`
   * `"In `src/db/index.ts`, add a new field to `JournalEntry` for tracking daily water intake."`
   * `"In `src/components/KnowledgeVault.tsx`, enhance the markdown viewer to render code blocks with syntax highlighting."`
3. **Run Immediate Compilation Checks:**
   After every code edit, run:
   ```powershell
   npm run build
   ```
   If exit code is `0`, the TypeScript types and bundle are verified healthy.

---

### 3. CONTRADICTIONS, EDGE CASES & LIMITATIONS

1. **Google Sheets as Database vs. Google Sheets as Mirror:** [Scholarly Consensus / Strong Evidence]
   * *Contradiction:* The user's intake prompt expressed a strong preference for Google Sheets as the "preferred structured-data store", while also demanding rich markdown notes, block editing, attachments, fast offline search, and instant mobile responsiveness.
   * *Resolution:* Google Sheets cannot physically support long-form block trees or binary attachments due to the 50,000 character-per-cell limit and 300 RPM quota. The **Asymmetric Hybrid Pattern** resolves this contradiction: local IndexedDB/SQLite holds the raw notes, while Google Sheets acts as the tabular reporting mirror.
2. **Device Baseline Ambiguity (`Galaxy S25 Ultra` vs `A25`):** [Established Facts / Cited Text]
   * *Evidence:* The intake block refers to "Samsung Galaxy S25 Ultra", while earlier project context noted "A25 Ultra".
   * *Impact on AI Models:* If running on an S25 Ultra (Snapdragon 8 Elite, 12GB+ RAM), on-device quantized models (e.g. MediaPipe / WebLLM) are technically viable in the browser. If running on an A25 (Exynos 1280, 6GB RAM), on-device LLMs will trigger mobile browser tab crashes due to OOM constraints.
   * *Mitigation:* The AI conversation extraction pipeline is designed as a **deterministic, client-side regex/AST parser** requiring zero local GPU memory, ensuring identical performance on both devices.
3. **Sync Collisions on Manual Spreadsheet Sorting:** [Reasoned Inference / Synthesis]
   * *Edge Case:* If the user manually sorts rows in Google Sheets, row index positions change. If an integration syncs by row number, data corruption will occur.
   * *Rule:* The sync engine must strictly reference Column A (`ID: UUID`). Row positions in Google Sheets are completely ignored during data ingestion.
