import { db, type KnowledgeItem } from './index';

/**
 * ॐ Om Knowledge OS — Top Architectural Concepts & Decisions Extracted from ChatGPT
 * 
 * Sourced from the 45 high-confidence PKM architecture discussions across
 * conversations-000.json through conversations-003.json.
 */
export const CHATGPT_ARCHITECTURAL_CONCEPTS: KnowledgeItem[] = [
  {
    id: 'pkm-notion-os-master',
    title: 'Notion OS Master Architecture: Static Pages to Intelligent Relational Subsystems',
    type: 'Concept',
    content: `### Architectural Decision: Evolution from Static Notes to Relational OS
**Source:** ChatGPT Archive — *Notion OS Development Progress* (Score: 2,434 pts, 246 matching turns)

#### 1. Core Problem Solved
Early personal note setups relied on unstructured, siloed pages that quickly became fragmented graveyards. As information volume grew, cross-referencing between projects, tasks, reading notes, and daily journals became impossible.

#### 2. Key Architectural Invariants
- **Decoupling Presentation from Storage**: The UI views (Executive Dashboard, Kanban, Eisenhower matrix) are completely decoupled from the underlying normalized database tables.
- **Relational Integrity**: Every actionable task links to a parent Project; every concept links to a domain category and bidirectional wikilink backlinks.
- **Zero-Friction Ingestion**: Elimination of manual copy-paste overhead through structured intake pipelines.`,
    tags: ['Architecture', 'Notion-OS', 'PKM', 'Relational-Databases', 'ChatGPT-Archive'],
    createdAt: 1722600000000,
    updatedAt: Date.now(),
  },
  {
    id: 'pkm-om-v2-local-first',
    title: 'Om Knowledge OS v2.0: Sovereign Local-First Substratum & Offline Mandate',
    type: 'Concept',
    content: `### Architectural Decision: Local-First Priority & Offline Resilience
**Source:** ChatGPT Archive — *Om Knowledge OS v2.0* (Score: 419 pts, 13 matching turns)

#### 1. The Cloud Vulnerability Dilemma
Proprietary cloud PKM tools (Notion, Roam, cloud databases) suffer from three fatal flaws for deep personal knowledge:
1. **Network Dependency**: Complete loss of access when working in remote valleys (e.g., Himalayan field diligence).
2. **API & Character Throttling**: Strict character ceilings and rate limits prevent large context analysis.
3. **Vendor Lock-in**: Personal second-brain notes are trapped behind recurring subscription paywalls.

#### 2. The Chosen Local-First Architecture
- **Primary Data Engine**: Browser IndexedDB managed by **Dexie.js v5** providing sub-10ms transactional read/writes with zero internet connectivity.
- **Client Platforms**: Fully responsive PWA engineered for Windows 11 Desktop and Samsung Galaxy S25 Ultra (360px–1920px).
- **Deterministic Conflict Rule**: Local device edits ALWAYS prevail over remote Google Sheets updates. Collisions are preserved in \`db.syncConflicts\` for auditability.`,
    tags: ['Om-Knowledge-OS', 'Local-First', 'Dexie', 'Offline-PWA', 'Data-Sovereignty'],
    createdAt: 1722605000000,
    updatedAt: Date.now(),
  },
  {
    id: 'pkm-task-intel-eisenhower',
    title: 'Task Intelligence: Relational Eisenhower Matrix & Cognitive Energy-Based Execution',
    type: 'Concept',
    content: `### Architectural Decision: Quadrant Categorization & Energy Matching
**Source:** ChatGPT Archive — *Task Intelligence Development* & *Notion Planners Utility Analysis* (Score: 390 pts)

#### 1. The Energy-Action Framework
Standard flat to-do lists fail because they ignore the cognitive state of the user. Task Intelligence enforces a dual-filter execution model:

#### 2. The Dimensions
1. **Eisenhower Matrix Priority**:
   - **Q1 (Urgent & Important)**: Crises, statutory deadlines, urgent commitments.
   - **Q2 (Important Not Urgent)**: Strategic work, spiritual study, property diligence, system architecture.
   - **Q3 (Urgent Not Important)**: Administrative errands, quick operational transfers.
   - **Q4 (Someday / Backlog)**: Low-leverage ideas and background reading.
2. **Cognitive Energy Demand**:
   - \`Deep Work\`: Uninterrupted morning blocks (high mental bandwidth).
   - \`Quick Win\`: Batch-executable in < 15 minutes.
   - \`Low Energy\`: Mechanical updates, file organization, passive reading.`,
    tags: ['Task-Intelligence', 'Productivity', 'Eisenhower-Matrix', 'Deep-Work', 'Ergonomics'],
    createdAt: 1722610000000,
    updatedAt: Date.now(),
  },
  {
    id: 'pkm-notion-protocol-limits',
    title: 'API Quotas & Boundary Protocols: Overcoming the 50,000 Character Cell Ceiling',
    type: 'Note',
    content: `### Architectural Decision: Hybrid Local-Core / Sheets-Satellite Partitioning
**Source:** ChatGPT Archive — *Notion prtcl access limits* (Score: 778 pts, 30 matching turns)

#### 1. Hard Technical Limits Discovered
- **Google Sheets Hard Limit**: Maximum 50,000 characters per cell. Attempting to write multi-turn AI transcripts or long-form literature notes directly into spreadsheet cells triggers fatal \`400 Bad Request: Value exceeds limit\` errors.
- **Google Cloud API Ceiling**: 300 requests/minute per project (60 req/min per user). High-frequency keystroke syncing causes \`429 Too Many Requests\`.

#### 2. The Architectural Resolution
Google Sheets is restricted strictly to **structured tabular summaries** (Tasks, Projects, Goals, Pantry). All long-form Markdown, AST block trees, and AI dialogue transcripts remain safely persisted in the local Dexie database.`,
    tags: ['Google-Sheets', 'API-Quotas', 'Data-Integrity', 'Payload-Limits', 'Architecture'],
    createdAt: 1722615000000,
    updatedAt: Date.now(),
  },
  {
    id: 'pkm-pkm-apps-evaluation',
    title: 'Comparative PKM Evaluation: Notion vs. Obsidian vs. Logseq Synthesis',
    type: 'Concept',
    content: `### Architectural Decision: Hybridizing Relational Typing with Plaintext Wikilinks
**Source:** ChatGPT Archive — *PKM Apps for VA* (Score: 398 pts, 35 matching turns)

#### 1. Comparative Breakdown
- **Notion**: Unrivaled relational databases, formula rollups, and multi-view presentation; poor offline reliability and proprietary cloud format.
- **Obsidian**: Superb local plaintext markdown, instant search, and bidirectional graph; weak native tabular typing and cumbersome relational rollups.
- **Logseq**: Outliner-first block anchoring with local privacy; complex query syntax for non-programmers.

#### 2. The Om OS Synthesis
Om Knowledge OS combines the best of all three:
1. **Relational Typing**: Native TypeScript interfaces and indexed IndexedDB stores (like Notion).
2. **Speed & Sovereignty**: Zero cloud round-trips, sub-10ms UI, local offline execution (like Obsidian).
3. **Bidirectional Backlinks**: Automatic \`[[wikilink]]\` extraction with an interactive 2D Knowledge Graph (like Logseq/Obsidian).`,
    tags: ['PKM', 'Comparative-Analysis', 'Obsidian', 'Notion', 'Backlinks', 'Knowledge-Graph'],
    createdAt: 1722620000000,
    updatedAt: Date.now(),
  },
  {
    id: 'pkm-universal-inbox-pipeline',
    title: 'Universal AI Ingestion Pipeline: Turn-by-Turn Parsing & Staged Approval',
    type: 'Note',
    content: `### Architectural Decision: The Deterministic 5-Stage Ingestion Pipeline
**Source:** ChatGPT Archive — *Protocol Execution Analysis* (Score: 143 pts, 13 matching turns)

\`\`\`Plain Text
ChatGPT / Gemini Transcript
        ↓
1. Role Splitter (User: / Assistant:)
        ↓
2. Code Block Isolation (Protect code from line parsers)
        ↓
3. Entity Discovery (Action verbs → Tasks; Headings → Concepts)
        ↓
4. Approval-First Staging UI (User review & toggle selection)
        ↓
5. Atomic Dexie Commit (db.tasks, db.knowledge, db.inbox)
\`\`\`

#### Key Invariant
Unreviewed automated entity injection corrupts database trust. Every extracted task or concept candidate MUST pass through the Approval-First Staging Screen before entering production tables.`,
    tags: ['AI-Ingestion', 'Universal-Inbox', 'AST-Parsing', 'Staged-Approval', 'Pipeline'],
    createdAt: 1722625000000,
    updatedAt: Date.now(),
  },
  {
    id: 'pkm-dashboard-setup',
    title: 'Executive Command Center: KPI Rollups, Today-Focus & Visual Ergonomics',
    type: 'Concept',
    content: `### Architectural Decision: Single-Screen Morning Alignment
**Source:** ChatGPT Archive — *Notion Dashboard Setup* (Score: 222 pts, 6 matching turns)

#### 1. Core Ergonomic Principle
A knowledge worker's cognitive fatigue begins with visual clutter. The Executive Home Dashboard is engineered as a **calm, single-screen command cockpit**:
- **Today Focus Area**: Surfaces only Q1 urgent tasks and current active projects.
- **Habit & Sadhana Radar**: Displays 5-spoke life balance metrics (Spiritual, Health, Wealth, Career, Family).
- **Quick Capture Anchor**: Instant keyboard shortcut (\`Ctrl+K\` / \`Ctrl+P\`) to dump raw thoughts into \`db.inbox\` without breaking flow state.
- **Deep Slate Aesthetic**: AMOLED-optimized high-contrast palette (\`#0f1117\`) to minimize eye strain during long nocturnal focus sessions.`,
    tags: ['Dashboard', 'Executive-Home', 'UI-Ergonomics', 'KPI-Rollups', 'Focus'],
    createdAt: 1722630000000,
    updatedAt: Date.now(),
  },
  {
    id: 'pkm-workspace-reviews',
    title: 'Periodic Review Cadences: Weekly, Monthly & Annual Knowledge Synthesizers',
    type: 'Note',
    content: `### Architectural Decision: Systematic Review Cadences for Life Momentum
**Source:** ChatGPT Archive — *Notion Workspace Progress Analysis* (Score: 117 pts, 3 matching turns)

#### 1. Three Review Horizons
1. **Weekly Review (45 min)**:
   - Archive completed tasks; recalculate project progress percentages.
   - Review incoming inbox notes and clear the staging queue.
   - Set top 3 milestone outcomes for the upcoming week.
2. **Monthly Review (2 hours)**:
   - Audit budget and financial inflows/outflows via ledger bridge.
   - Assess Himalayan land diligence progress and physical sadhana metrics.
   - Rebalance life pyramid OKRs.
3. **Annual Retrospective**:
   - Synthesize major conceptual breakthroughs in the Knowledge Vault.
   - Review 5-Year and 10-Year life vision alignment.`,
    tags: ['Reviews', 'Cadence', 'Knowledge-Synthesis', 'Momentum', 'Life-Pyramid'],
    createdAt: 1722635000000,
    updatedAt: Date.now(),
  }
];

/**
 * Idempotently ingests the top architectural concepts into db.knowledge.
 * Returns the count of items added.
 */
export async function ingestChatGPTArchitecturalConcepts(): Promise<{ added: number; existing: number }> {
  let added = 0;
  let existing = 0;

  for (const item of CHATGPT_ARCHITECTURAL_CONCEPTS) {
    const found = await db.knowledge.get(item.id);
    if (!found) {
      await db.knowledge.add(item);
      added++;
    } else {
      existing++;
    }
  }

  return { added, existing };
}
