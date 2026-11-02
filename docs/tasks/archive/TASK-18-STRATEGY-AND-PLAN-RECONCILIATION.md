# TASK-18: Strategic Inflection & System Plan Reconciliation (v2.0)

> **Specification Standard:** Spec-on-Disk v2.0 (Absolute Path Traceability Certified)  
> **Workspace Canonical Spec:** [TASK-18 Spec](file:///c:/Users/adity/Ag%20Folder/docs/tasks/TASK-18-STRATEGY-AND-PLAN-RECONCILIATION.md) (`c:\Users\adity\Ag Folder\docs\tasks\TASK-18-STRATEGY-AND-PLAN-RECONCILIATION.md`)  
> **Clean Room App Mirror:** [TASK-18 Clean Room Mirror](file:///c:/Users/adity/Ag%20Folder/om_os_app/docs/tasks/TASK-18-STRATEGY-AND-PLAN-RECONCILIATION.md) (`c:\Users\adity\Ag Folder\om_os_app\docs\tasks\TASK-18-STRATEGY-AND-PLAN-RECONCILIATION.md`)  
> **Milestone Alignment:** Post-Phase 17 Comprehensive Strategy Reconciliation  
> **Target Substratum:** Dexie.js (IndexedDB Schema v11) + React 19 + TypeScript + Vite  

---

## 1. The Strategic Inflection: What Changed in Strategy & Plan

Inspection of the 393 raw ChatGPT conversations (61.5 MB across `conversations-000.json` through `003.json`) combined with the completion of Phases 1 through 17 has crystallized the fundamental roadmap of Om Knowledge OS.

```mermaid
graph TD
    subgraph "Legacy Notion Paradigm (Static Sinks)"
        N1["24 Isolated Notion Pages"] --> N2["Unstructured Copy-Paste Text"]
        N2 --> N3["Context Truncation & Forgotten Silos"]
    end

    subgraph "Om Knowledge OS v2.0 Cognitive Refinery (Active Ingestion & Synthesis)"
        A1["Raw AI Transcripts (ChatGPT / Gemini / Papers)"] --> A2["Universal Inbox Turn Parser (Role & Code Isolation)"]
        A2 --> A3["Staged Approval Interface (Human-in-the-Loop)"]
        A3 --> A4["Dexie.js IndexedDB Substratum (24 ACID Local Stores)"]
        A4 --> B1["Task Intelligence (Eisenhower Q1-Q4 + Energy Badges)"]
        A4 --> B2["Knowledge Vault & 2D Backlink Graph (Wikilinks)"]
        A4 --> B3["Offline 256-Dim Semantic Vector Search (RRF Hybrid)"]
        A4 --> B4["Domain Engines (Himalayan GIS + Vedic Concordance + Sadhana)"]
        A4 <-->|TSV Bridge / Webhooks (Local Edits Prevail)| C1["Google Sheets (Tabular Metrics Only)"]
    end
```

### The 4 Major Strategic Pivots:
1. **From Disconnected Apps to Unified Cognitive Fabric**:
   - *Previous Approach:* Building separate screens for tasks, goals, pantry, health, and property research.
   - *New Paradigm:* Every entity is a node in the relational graph. A Himalayan land diligence record links directly to legal tasks in Eisenhower Quadrant Q2, which roll up to Life Vision Goals and link to study notes in the Knowledge Vault.
2. **From Passive Notes to Active Ingestion (Deterministic Pipeline)**:
   - *Previous Approach:* Manually retyping or creating notes from scratch.
   - *New Paradigm:* Ingestion engine splits multi-turn transcripts into distinct speaker blocks, shields code snippets from erroneous parsing, maps action verbs to Task candidates and headings to Concept candidates, and commits atomically upon user approval.
3. **Strict Payload Ceiling Enforcement (50k Character Partitioning)**:
   - *Discovered Constraint:* Google Sheets enforces a 50,000-character cell ceiling and Google Cloud imposes a 300 req/min API quota.
   - *Strategy Resolution:* Google Sheets functions exclusively as a tabular calculation satellite (Tasks, Projects, Goals, Pantry). Long-form markdown, AST block trees, and AI transcripts reside strictly in local IndexedDB.
4. **Digital Sovereignty & Zero Cloud Vulnerability**:
   - The OS operates with zero internet connectivity on Windows 11 and Samsung Galaxy S25 Ultra, utilizing browser IndexedDB, Web Audio synthesis, and client-side vector search.

---

## 2. Complete Data Contract & Schemas (TypeScript)

```typescript
/**
 * Ingested Architectural Concept Entity in Dexie db.knowledge
 */
export interface KnowledgeItem {
  id: string;
  title: string;
  type: 'Note' | 'Concept' | 'Source' | 'Bookmark' | 'Quote' | 'Question';
  content: string; // Markdown / block text
  tags: string[];
  projectId?: string;
  sourceUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Universal Inbox Ingestion Staging Candidate
 */
export interface IngestionCandidate {
  id: string;
  sourceFile: string;
  turnRole: 'user' | 'assistant' | 'system';
  score: number;
  rawText: string;
  suggestedType: 'Task' | 'Concept' | 'Goal' | 'LandRecord' | 'VedicNode';
  extractedMetadata: {
    title: string;
    quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    energyLevel?: 'Deep Work' | 'Quick Win' | 'Low Energy';
    tags: string[];
  };
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

/**
 * 2D Knowledge Graph Node & Edge Models
 */
export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  degree: number; // In-degree + Out-degree of backlinks
  x?: number;
  y?: number;
  color: string;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relationType: 'wikilink' | 'parent_project' | 'cross_reference';
}
```

---

## 3. Algorithmic Pseudocode: Ingestion & Graph Linking Engine

```typescript
function processTranscriptTurn(turnText: string): IngestionCandidate[] {
  // Step 1: Shield code blocks using regex mask
  const codeBlocks: string[] = [];
  const maskedText = turnText.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  const candidates: IngestionCandidate[] = [];

  // Step 2: Extract Task Candidates via Imperative Verbs and Checklist Tokens
  const lines = maskedText.split('\n');
  for (const line of lines) {
    if (/^[-*]\s*\[([ xX])\]/.test(line) || /^(TODO|ACTION|NEXT STEP):/i.test(line)) {
      candidates.push({
        id: generateUUID(),
        turnRole: 'assistant',
        score: calculateRelevanceScore(line),
        rawText: restoreCodeBlocks(line, codeBlocks),
        suggestedType: 'Task',
        extractedMetadata: {
          title: cleanMarkdown(line),
          quadrant: determineEisenhowerQuadrant(line),
          energyLevel: line.length > 50 ? 'Deep Work' : 'Quick Win',
          tags: ['Extracted-Task', 'AI-Ingestion']
        },
        approvalStatus: 'Pending'
      });
    }
  }

  // Step 3: Extract Conceptual Headings and Wikilinks
  const headingMatches = maskedText.match(/^(#{1,3})\s+(.+)$/gm);
  if (headingMatches) {
    for (const heading of headingMatches) {
      candidates.push({
        id: generateUUID(),
        turnRole: 'assistant',
        score: calculateRelevanceScore(heading),
        rawText: restoreCodeBlocks(heading, codeBlocks),
        suggestedType: 'Concept',
        extractedMetadata: {
          title: cleanMarkdown(heading),
          tags: ['Extracted-Concept', 'Knowledge-Vault']
        },
        approvalStatus: 'Pending'
      });
    }
  }

  return candidates;
}
```

---

## 4. Verification Directives
```powershell
npm --prefix "c:\Users\adity\Ag Folder\om_os_app" run audit
```
