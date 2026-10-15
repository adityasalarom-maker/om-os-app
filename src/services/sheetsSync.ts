import { 
  db, 
  type TaskItem, 
  type Project, 
  type GoalItem, 
  type PantryItem, 
  type KnowledgeItem, 
  type JournalEntry, 
  type HealthEntry, 
  type PropertyParcel,
  type SyncConflict,
  type SyncQueueItem 
} from '../db';

export type SyncableTable = 'tasks' | 'projects' | 'goals' | 'pantry' | 'knowledge' | 'journal' | 'health' | 'properties';

export interface SyncReport {
  timestamp: number;
  success: boolean;
  insertedLocal: number;
  updatedLocal: number;
  insertedRemote: number;
  updatedRemote: number;
  conflictsDetected: number;
  queuedMutationsProcessed: number;
  error?: string;
  details: string[];
}

export interface PingResult {
  success: boolean;
  latencyMs: number;
  message: string;
  timestamp?: number;
}

/**
 * Enqueue a mutation delta into Dexie when working offline or pending sync
 */
export async function enqueueSyncMutation(
  table: SyncableTable,
  action: 'insert' | 'update' | 'delete',
  recordId: string,
  payload?: any
): Promise<string> {
  const queueId = `queue-${table}-${recordId}-${Date.now()}`;
  const queueItem: SyncQueueItem = {
    id: queueId,
    table,
    action,
    recordId,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    retries: 0
  };
  await db.syncQueue.put(queueItem);
  return queueId;
}

/**
 * Get count of pending delta mutations in the queue
 */
export async function getPendingQueueCount(): Promise<number> {
  return await db.syncQueue.where('status').equals('pending').count();
}

/**
 * Clear all resolved or pending queue items
 */
export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear();
}

/**
 * Test connectivity & latency to Google Apps Script Webhook
 */
export async function pingGoogleSheetsWebhook(
  webhookUrl: string,
  passkey: string
): Promise<PingResult> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, latencyMs: 0, message: 'Webhook URL is empty.' };
  }

  const start = performance.now();
  try {
    const payload = {
      action: 'ping',
      passkey: passkey.trim(),
      clientTimestamp: Date.now()
    };

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // avoids CORS preflight OPTIONS in GAS
      },
      body: JSON.stringify(payload)
    });

    const latencyMs = Math.round(performance.now() - start);

    if (!response.ok) {
      return { 
        success: false, 
        latencyMs, 
        message: `HTTP Error: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    if (data.status === 'error') {
      return { success: false, latencyMs, message: data.message || 'Webhook authentication rejected.' };
    }

    return { 
      success: true, 
      latencyMs, 
      message: `Online & Authorized (${data.message || 'PONG'})`,
      timestamp: data.timestamp
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return { 
      success: false, 
      latencyMs, 
      message: err.message || 'Network unreachable or CORS blockage.' 
    };
  }
}

/**
 * Generates tab-delimited TSV string ready for pasting into Google Sheets cell A1
 */
export async function generateTableTSV(table: SyncableTable): Promise<string> {
  if (table === 'tasks') {
    const records = await db.tasks.toArray();
    const headers = ['ID', 'Title', 'Quadrant', 'Priority', 'Status', 'Energy Required', 'Urgency', 'Impact', 'Deadline', 'Completed', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.title.replace(/\t/g, ' '),
      r.quadrant,
      r.priority,
      r.status,
      r.energyRequired,
      r.urgency,
      r.impact,
      r.deadline || '',
      r.isCompleted ? 'TRUE' : 'FALSE',
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  if (table === 'projects') {
    const records = await db.projects.toArray();
    const headers = ['ID', 'Name', 'Status', 'Priority', 'Health', 'Progress %', 'Budget', 'Deadline', 'Tags', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.name.replace(/\t/g, ' '),
      r.status,
      r.priority,
      r.healthStatus,
      r.progress,
      r.budget || '',
      r.deadline || '',
      (r.tags || []).join(', '),
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  if (table === 'goals') {
    const records = await db.goals.toArray();
    const headers = ['ID', 'Title', 'Tier Level', 'Status', 'Progress %', 'Life Area', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.title.replace(/\t/g, ' '),
      r.level,
      r.status,
      r.progress,
      r.lifeArea,
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  if (table === 'pantry') {
    const records = await db.pantry.toArray();
    const headers = ['ID', 'Item Name', 'Category', 'Current Qty', 'Reorder Point', 'Status', 'Storage', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.itemName.replace(/\t/g, ' '),
      r.category,
      r.currentQty,
      r.reorderPoint,
      r.status,
      r.storageType,
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  if (table === 'knowledge') {
    const records = await db.knowledge.toArray();
    const headers = ['ID', 'Title', 'Type', 'Tags', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.title.replace(/\t/g, ' '),
      r.type,
      (r.tags || []).join(', '),
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  if (table === 'journal') {
    const records = await db.journal.toArray();
    const headers = ['ID', 'Date', 'Type', 'Mood (1-10)', 'Energy (1-10)', 'Content', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.date,
      r.entryType,
      r.moodScore,
      r.energyScore,
      r.content.replace(/[\t\n]/g, ' '),
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  if (table === 'health') {
    const records = await db.health.toArray();
    const headers = ['ID', 'Date', 'Sleep Hours', 'Sleep Quality', 'Agni Digestion', 'Prana Score', 'Diet Type', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.date,
      r.sleepHours,
      r.sleepQuality,
      r.digestionAgni,
      r.pranaScore,
      r.dietType,
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  if (table === 'properties') {
    const records = await db.properties.toArray();
    const headers = ['ID', 'Title', 'Location', 'Elevation (m)', 'Area', 'Asking Price', 'Status', 'Updated At'];
    const rows = records.map(r => [
      r.id,
      r.title.replace(/\t/g, ' '),
      r.location.replace(/\t/g, ' '),
      r.elevationMeters,
      r.areaSize,
      r.askingPrice,
      r.status,
      new Date(r.updatedAt).toISOString()
    ]);
    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  return '';
}

/**
 * Downloads a table as a standalone .tsv file
 */
export async function downloadTableTSV(table: SyncableTable): Promise<void> {
  const tsv = await generateTableTSV(table);
  const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OmOS_${table}_${new Date().toISOString().split('T')[0]}.tsv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Imports TSV pasted directly from Google Sheets back into Dexie local database
 */
export async function importTSVFromSheets(
  table: 'tasks' | 'pantry' | 'goals', 
  tsvText: string
): Promise<{ added: number; updated: number }> {
  const lines = tsvText.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length <= 1) return { added: 0, updated: 0 };

  const now = Date.now();
  let added = 0;
  let updated = 0;

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim());
    if (table === 'tasks' && cols.length >= 2) {
      const id = cols[0] || `task-sheet-${now}-${i}`;
      const existing = await db.tasks.get(id);
      const item: TaskItem = {
        id,
        title: cols[1] || 'Untitled Task',
        quadrant: (cols[2] as any) || 'Q2',
        priority: (cols[3] as any) || 'Important Not Urgent',
        status: (cols[4] as any) || 'To Do',
        energyRequired: (cols[5] as any) || 'Deep Work',
        urgency: (cols[6] as any) || 'Medium',
        impact: (cols[7] as any) || 'High',
        deadline: cols[8] || undefined,
        isCompleted: cols[9]?.toUpperCase() === 'TRUE',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      await db.tasks.put(item);
      if (existing) updated++; else added++;
    } else if (table === 'pantry' && cols.length >= 2) {
      const id = cols[0] || `pantry-sheet-${now}-${i}`;
      const existing = await db.pantry.get(id);
      const item: PantryItem = {
        id,
        itemName: cols[1] || 'Item',
        category: (cols[2] as any) || 'Grains & Pulses',
        currentQty: cols[3] || '1 unit',
        reorderPoint: cols[4] || '1 unit',
        status: (cols[5] as any) || 'In Stock',
        storageType: (cols[6] as any) || 'Pantry',
        updatedAt: now,
      };
      await db.pantry.put(item);
      if (existing) updated++; else added++;
    } else if (table === 'goals' && cols.length >= 2) {
      const id = cols[0] || `goal-sheet-${now}-${i}`;
      const existing = await db.goals.get(id);
      const item: GoalItem = {
        id,
        title: cols[1] || 'Untitled Goal',
        level: (cols[2] as any) || '1-Year',
        status: (cols[3] as any) || 'Active',
        progress: parseInt(cols[4] || '0', 10) || 0,
        lifeArea: (cols[5] as any) || 'Spiritual & Inner',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      await db.goals.put(item);
      if (existing) updated++; else added++;
    }
  }

  return { added, updated };
}

/**
 * Three-Way Sync Algorithm Execution against Google Apps Script Webhook
 * In strict adherence to Repository Convention Section 1 Invariant #2:
 * Local edits always prevail. Colliding remote records are archived in db.syncConflicts.
 */
export async function executeThreeWayGoogleSheetsSync(
  webhookUrl: string,
  passkey: string
): Promise<SyncReport> {
  const report: SyncReport = {
    timestamp: Date.now(),
    success: false,
    insertedLocal: 0,
    updatedLocal: 0,
    insertedRemote: 0,
    updatedRemote: 0,
    conflictsDetected: 0,
    queuedMutationsProcessed: 0,
    details: [],
  };

  if (!webhookUrl || !webhookUrl.trim()) {
    report.error = 'Webhook URL is required.';
    return report;
  }

  try {
    // 1. Fetch current local tables
    const localTasks = await db.tasks.toArray();
    const localProjects = await db.projects.toArray();
    const localGoals = await db.goals.toArray();
    const localPantry = await db.pantry.toArray();
    const localKnowledge = await db.knowledge.toArray();
    const localJournal = await db.journal.toArray();
    const localHealth = await db.health.toArray();
    const localProperties = await db.properties.toArray();

    // 2. Fetch pending queue items
    const pendingQueue = await db.syncQueue.where('status').equals('pending').toArray();

    // 3. Last sync timestamp from localStorage / syncSettings
    const lastSyncKey = 'om_os_last_sheets_sync_ts';
    const lastSyncTimestamp = Number(localStorage.getItem(lastSyncKey) || 0);

    // 4. Dispatch payload to Google Apps Script Webhook
    const payload = {
      action: 'sync',
      passkey: passkey.trim(),
      lastSyncTimestamp,
      clientTimestamp: Date.now(),
      pendingQueue,
      tables: {
        tasks: localTasks,
        projects: localProjects,
        goals: localGoals,
        pantry: localPantry,
        knowledge: localKnowledge,
        journal: localJournal,
        health: localHealth,
        properties: localProperties
      }
    };

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets Webhook HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(`Apps Script Error: ${data.message}`);
    }

    // 5. Merge remote updates into local Dexie database (Three-Way Merge with Local Priority)
    if (data.remoteUpdates) {
      const processTableMerge = async <T extends { id: string; updatedAt: number }>(
        tableName: SyncableTable,
        localRecords: T[],
        remoteRecords: any[],
        dbTable: any
      ) => {
        if (!Array.isArray(remoteRecords)) return;

        for (const remote of remoteRecords) {
          if (!remote || !remote.id) continue;
          const local = localRecords.find(item => item.id === remote.id);

          if (!local) {
            // New record added remotely
            await dbTable.put(remote);
            report.insertedLocal++;
          } else if (remote.updatedAt > local.updatedAt) {
            // Remote has newer timestamp.
            // Check if user had an unsynced local edit in the queue
            const hasQueuedLocalEdit = pendingQueue.some(q => q.table === tableName && q.recordId === local.id);

            if (hasQueuedLocalEdit) {
              // CONFLICT INVARIANT #2: Local edits always prevail!
              report.conflictsDetected++;
              report.details.push(`Conflict in ${tableName} [${remote.id}]: Local edit prioritized over Sheets.`);
              await db.syncConflicts.put({
                id: `conflict-${tableName}-${remote.id}-${Date.now()}`,
                table: tableName,
                recordId: remote.id,
                localData: local,
                remoteData: remote,
                resolved: false,
                timestamp: Date.now(),
              });
            } else {
              // Safe to accept remote update
              await dbTable.put(remote);
              report.updatedLocal++;
            }
          } else if (local.updatedAt > remote.updatedAt) {
            report.updatedRemote++;
          }
        }
      };

      await processTableMerge('tasks', localTasks, data.remoteUpdates.tasks, db.tasks);
      await processTableMerge('projects', localProjects, data.remoteUpdates.projects, db.projects);
      await processTableMerge('goals', localGoals, data.remoteUpdates.goals, db.goals);
      await processTableMerge('pantry', localPantry, data.remoteUpdates.pantry, db.pantry);
    }

    // 6. Mark processed queue items
    if (pendingQueue.length > 0) {
      for (const q of pendingQueue) {
        await db.syncQueue.update(q.id, { status: 'syncing' });
      }
      await db.syncQueue.bulkDelete(pendingQueue.map(q => q.id));
      report.queuedMutationsProcessed = pendingQueue.length;
    }

    localStorage.setItem(lastSyncKey, String(Date.now()));
    report.success = true;
    report.details.push(`Sync complete at ${new Date().toLocaleTimeString()} (Processed ${report.queuedMutationsProcessed} delta mutations).`);
    return report;

  } catch (err: any) {
    report.success = false;
    report.error = err.message || 'Unknown network error';
    report.details.push(`Error: ${report.error}`);
    return report;
  }
}

/**
 * Resolves a conflict according to user choice
 */
export async function resolveSyncConflict(
  conflictId: string, 
  decision: 'local' | 'remote'
): Promise<void> {
  const conflict = await db.syncConflicts.get(conflictId);
  if (!conflict) return;

  if (decision === 'remote') {
    // User explicitly chose remote: write remoteData to table
    const targetTable = (db as any)[conflict.table];
    if (targetTable && conflict.remoteData) {
      await targetTable.put(conflict.remoteData);
    }
  }

  // Mark conflict resolved
  await db.syncConflicts.update(conflictId, {
    resolved: true,
    resolution: decision
  });
}

/**
 * Dismiss all active conflicts, retaining local data
 */
export async function dismissAllConflictsAsLocal(): Promise<void> {
  const conflicts = await db.syncConflicts.where('resolved').equals(0 as any).toArray();
  for (const c of conflicts) {
    await db.syncConflicts.update(c.id, {
      resolved: true,
      resolution: 'local'
    });
  }
}

/**
 * Complete, ready-to-deploy Google Apps Script template for Google Drive
 * Supports both doPost (sync, ping, pull, push) and doGet (health & data export)
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =================================================================================
 * OM KNOWLEDGE OS: BIDIRECTIONAL 3-WAY GOOGLE SHEETS SYNC GATEWAY (v2.0)
 * =================================================================================
 * Instructions:
 * 1. Open Google Sheets (create a new blank workbook or open your existing Om OS sheet).
 * 2. Extensions > Apps Script.
 * 3. Delete any default code, paste this entire file, and click Save.
 * 4. Click Deploy > New deployment.
 * 5. Select type: "Web app".
 * 6. Execute as: "Me" | Who has access: "Anyone".
 * 7. Click Deploy, copy the Web app URL, and paste it into Om Knowledge OS!
 */

var DEFAULT_AUTH_KEY = "OmKnowledgeOS!SecureKey";

function getAuthKey() {
  try {
    var prop = PropertiesService.getScriptProperties().getProperty('OM_OS_AUTH_KEY');
    if (prop && prop.trim().length > 0) return prop.trim();
  } catch(e) {}
  return DEFAULT_AUTH_KEY;
}

function doGet(e) {
  try {
    var key = e && e.parameter ? e.parameter.passkey : "";
    if (key !== getAuthKey()) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "403 Forbidden: Invalid passkey"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      name: ss.getName(),
      sheets: ss.getSheets().map(function(s) { return s.getName(); }),
      timestamp: new Date().getTime()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var req = JSON.parse(raw);

    if (req.passkey !== getAuthKey()) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "403 Forbidden: Invalid passkey"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (req.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "PONG - Webhook Active",
        timestamp: new Date().getTime()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var lastSyncTs = req.lastSyncTimestamp || 0;
    var remoteUpdates = {};

    // Sync Tasks
    if (req.tables && req.tables.tasks) {
      remoteUpdates.tasks = syncSheetWithDelta(ss, "Tasks", req.tables.tasks, [
        "id", "title", "quadrant", "priority", "status", "energyRequired", "deadline", "isCompleted", "updatedAt"
      ], lastSyncTs);
    }

    // Sync Projects
    if (req.tables && req.tables.projects) {
      remoteUpdates.projects = syncSheetWithDelta(ss, "Projects", req.tables.projects, [
        "id", "name", "status", "priority", "healthStatus", "progress", "budget", "deadline", "updatedAt"
      ], lastSyncTs);
    }

    // Sync Goals
    if (req.tables && req.tables.goals) {
      remoteUpdates.goals = syncSheetWithDelta(ss, "Goals", req.tables.goals, [
        "id", "title", "level", "status", "progress", "lifeArea", "updatedAt"
      ], lastSyncTs);
    }

    // Sync Pantry
    if (req.tables && req.tables.pantry) {
      remoteUpdates.pantry = syncSheetWithDelta(ss, "Pantry", req.tables.pantry, [
        "id", "itemName", "category", "currentQty", "reorderPoint", "status", "updatedAt"
      ], lastSyncTs);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      timestamp: new Date().getTime(),
      message: "Sync completed successfully",
      remoteUpdates: remoteUpdates
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncSheetWithDelta(ss, sheetName, records, headers, lastSyncTs) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#eef2ff");
  }

  // Read existing sheet rows to discover any edits made directly in Google Sheets
  var lastRow = sheet.getLastRow();
  var remoteChanges = [];

  if (lastRow > 1) {
    var currentValues = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (var i = 0; i < currentValues.length; i++) {
      var row = currentValues[i];
      var rowId = row[0];
      if (!rowId) continue;

      var updatedVal = row[headers.indexOf("updatedAt")];
      var rowTs = typeof updatedVal === "string" ? new Date(updatedVal).getTime() : (typeof updatedVal === "number" ? updatedVal : 0);

      if (rowTs > lastSyncTs) {
        var obj = {};
        for (var h = 0; h < headers.length; h++) {
          obj[headers[h]] = row[h];
        }
        obj.updatedAt = rowTs;
        remoteChanges.push(obj);
      }
    }
  }

  // Write client records cleanly to Sheet
  if (records.length > 0) {
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
    }
    var rows = records.map(function(r) {
      return headers.map(function(h) {
        var val = r[h];
        if (val === undefined || val === null) return "";
        if (h === "updatedAt" && typeof val === "number") return new Date(val).toISOString();
        return val;
      });
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  return remoteChanges;
}
`;
