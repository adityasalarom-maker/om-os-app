# TASK-27: Notes Studio Pro Pane Resize and Orientation Controls

## Goal
Make Notes Studio Pro's pane layout controls usable on desktop and mobile. Every open note tab remains individually width-resizable; visible note panes can be resized by dragging their shared boundaries; each pane can switch between column and full-row orientation.

## Scope
- Modify only `public/notes-studio-pro.html` plus this task record and the Codex-to-Antigravity handoff.
- Preserve existing note records and the encrypted vault format. Add optional layout preferences backward-compatibly; old payloads without them must still load.
- Keep layout presets understandable and selectable at all widths. Mobile uses a scrollable one-column presentation with touch-sized controls.
- Do not change Notes Studio or Notes Workspace.

## Acceptance criteria
- [x] Each open ribbon tab can be resized independently with mouse or touch and keyboard; width persists, and double-click resets to 165px.
- [x] Pane split boundaries resize adjacent pane tracks with mouse or touch and persist in the local encrypted vault; keyboard arrows adjust focused splitters and double-click restores that split's default.
- [x] Every note pane has a named orientation button that toggles that note between a vertical column and a horizontal full-row placement.
- [x] The five layout preset buttons visibly select distinct arrangements; width adaptation no longer silently turns every selection into one focus pane.
- [x] Pane splitters are hidden where the phone uses a one-column scroll layout; tabs and pane tools retain touch-sized controls, and notes remain reachable by vertical scrolling.
- [x] Existing vault payloads and JSON backups remain compatible; restore merge/replace preserves the new optional preferences correctly.
- [x] Inline script syntax, the Pro vault/restore checks, and production build pass.

## Verification record
- Snapshot: `version_backups/snapshot_20261107_123446`.
- Verification: `node --check` on the inline Pro script passed; `node scripts/test_notes_studio_pro_vault.mjs` passed; `npm run build` passed.
- Status: Complete. Standalone Pro received a read-only UI inspection before the source update; a post-update physical-phone/browser interaction run was not available in this session.
