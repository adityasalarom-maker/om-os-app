# ॐ Om Knowledge OS — Repository Conventions & Agent Execution Rules

This document establishes persistent repository rules, architecture standards, and execution constraints for all Antigravity agent interactions in this workspace.

---

## 1. System Invariants & Architecture Constraints
1. **Local-First Priority**:
   - The primary data engine is Dexie (IndexedDB) running in the browser / PWA client.
   - All read/write operations must function seamlessly with zero internet connectivity.
2. **Deterministic Conflict Resolution**:
   - In any sync collision between local edits and Google Sheets, local edits always prevail.
   - Conflicting remote records must be archived in `db.syncConflicts` for auditability rather than silently overwriting local state.
3. **Pre-Edit Snapshot Invariant**:
   - Before modifying any source files in `src/`, an automated physical snapshot must be generated via:
     `powershell scripts/backup.ps1 -Reason "<task_intent>"`
4. **Approval-First Milestones**:
   - Stop at the completion of each milestone or phase. Never begin new milestone implementation without explicit user authorization.

---

## 2. Directory Structure Conventions
```
+-- docs/                               # Architecture blueprints & protocols
¦   +-- ANTIGRAVITY_EXECUTION_PROTOCOL.md
+-- .agents/skills/                     # Modular Antigravity Agent Skills
¦   +-- om-os-sheets-sync/              # Bidirectional Google Sheets sync
¦   +-- om-os-backup-rollback/          # Safe-proof versioning & physical rollback
¦   +-- om-os-pwa-mobile-build/         # Responsive PWA & standalone mobile build
¦   +-- om-os-knowledge-markdown-bridge/# Ingestion & export of .md notes
+-- notion_os/                          # 24 core Notion OS module specs
+-- my_notes/                           # Metaphysical and study note archive
+-- version_backups/                    # Timestamped physical snapshots & manifest
+-- om_os_app/                          # Dedicated Software Clean Room (React 19 + TypeScript + Vite)
+-- scripts/                            # Automation scripts (backup.ps1, rollback.ps1)
```

---

## 3. Technology Stack Guidelines
- **UI Framework**: React 19 + TypeScript + Vite.
- **Styling**: TailwindCSS v4 with `@tailwindcss/vite`.
- **Database**: Dexie v4 + `dexie-react-hooks`.
- **Icons**: Lucide React.
- **Sync Middleware**: Google Apps Script (`doPost` / `doGet`) with Secret Passkey authentication.

---

## 4. Platform Deprecation Guard (October 19, 2026 Cutoff)
- **Zero Legacy Workflows**: No agent dependencies on deprecated `.agents/workflows/` or `.gemini/workflows/`.
- **Progressive Skill Loading**: All capabilities are encapsulated in `.agents/skills/<name>/SKILL.md` with strict YAML frontmatter.

---

## 5. Mode-Aware Communication Protocol
- **Default Mode (Execution & Coding):** Deliver lean cockpit updates (~200-450 tokens). Always include a compact, understandable narrative explaining what actually changed and why, followed by files touched, build verification status, and the next command. Saving tokens must never compromise delivering information in at least a minimum, precise, compact, understandable way of what is really happening.
- **Deep Dive Mode (Trigger: "use lens 2"):** Deliver full Lens 1 (Educational Systems Masterclass with inline parentheses definitions) + Lens 2 (Executable Technical Blueprint on disk in docs/tasks/).



