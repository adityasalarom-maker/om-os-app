---
name: om-os-backup-rollback
description: Safe-proof physical snapshotting, automated version checkpointing, and sub-second rollback management for Om Knowledge OS codebase and data stores.
---

# Om Knowledge OS: Backup & Rollback Engine

Use this skill when:
- Creating pre-edit physical snapshots before applying modifications to the codebase.
- Reverting to a prior stable milestone or timestamped snapshot.
- Exporting complete database JSON dumps or restoring JSON snapshots.
- Auditing the snapshot lineage in `version_backups/manifest.jsonl`.

## Procedures:
1. **Pre-Edit Snapshot**: Run `powershell scripts/backup.ps1 -Reason "<task_intent>"`.
2. **Rollback**: Run `powershell scripts/rollback.ps1 -SnapshotName <folder_name>`.
3. **Data Dump**: Use the in-app Google Sheets & Portability Center to export/import JSON.
