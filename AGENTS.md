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
   - Stop at the completion of each milestone or phase. Never begin new milestone implementation without explicit user authorization , suggest next action if needed ..

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
- **Default Mode (Execution & Coding):** Deliver lean cockpit updates (~300-750 tokens). Always include:
  1. Mechanical Summary: 5-6 concise sentences in bullet format explaining the engineering rationale and what was changed.
  2. Files Touched: Exact file paths created or modified.
  3. Verification: Build/test status (Pass/Fail) and output metrics.
  4. Command to Run: Single copy-pasteable terminal execution line (if user action required).
  5. Next Step: 1-line actionable prompt with objective why it needed , suggestion as your audits, reports and investigations .
- **Deep Dive Mode (Trigger: "use lens 2"):** Deliver full Lens 1 (Educational Systems Masterclass with inline parentheses definitions) + Lens 2 (Executable Technical Blueprint on disk in docs/tasks/).




## 6. Context and UI Navigation
- Start with `../docs/PROJECT_PASSPORT.md`; use `../docs/tasks/INDEX.md` for task status.
- For every Codex conversation working in this project, read and follow `../docs/CODEX_FOUNDATION_GUIDE.md` in addition to these repository rules. Keep its guidance project-scoped; do not treat it as a global Codex instruction.
- Use `scripts/audit_ui_ids.mjs` to check React `data-ag-id` assignments. In UI-change responses, map only affected visible labels to canonical IDs, behavior, visual description, and component file using `../docs/UI_COMPONENT_NAMING.md`.
- Keep detailed procedures inside relevant `.agents/skills/<name>/SKILL.md`; keep frontmatter descriptions short.
- Use `docs/CODEX_SESSION_PROGRESS.md` as the evolving Codex/Antigravity handoff. The similarly named handoff files are pointers, not separate progress histories.
