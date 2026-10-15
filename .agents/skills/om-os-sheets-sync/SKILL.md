---
name: om-os-sheets-sync
description: Bidirectional 3-way synchronization between Om Knowledge OS local Dexie tables and Google Sheets using Google Apps Script Webhooks, 1-click TSV clipboard transfers, and local-first conflict resolution.
---

# Om Knowledge OS: Google Sheets Sync Bridge

Use this skill when the user asks to:
- Synchronize tasks, projects, goals, or pantry inventory with Google Sheets.
- Export or import tab-delimited TSV clipboard data for cell A1 paste.
- Inspect or deploy the Google Apps Script Webhook gateway.
- Resolve synchronization conflicts between local changes and remote spreadsheet rows.

## Procedures:
1. **1-Click Clipboard TSV**: Use `src/services/sheetsSync.ts::generateTableTSV(table)` to generate clean TSV strings.
2. **Automated Webhook Sync**: Dispatch payload to Google Apps Script `doPost` endpoint with passkey authentication.
3. **Conflict Resolution**: Apply Local-First rule — local edits take precedence while remote variant is recorded into `db.syncConflicts`.
