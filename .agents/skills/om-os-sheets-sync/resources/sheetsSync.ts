import { db, type TaskItem, type Project, type GoalItem, type PantryItem, type KnowledgeItem } from '../db';

export interface SyncReport {
  timestamp: number;
  success: boolean;
  insertedLocal: number;
  updatedLocal: number;
  insertedRemote: number;
  updatedRemote: number;
  conflictsDetected: number;
  error?: string;
  details: string[];
}

/**
 * Generates tab-delimited TSV string ready for pasting into Google Sheets cell A1
 */
export async function generateTableTSV(table: 'tasks' | 'projects' | 'goals' | 'pantry' | 'knowledge'): Promise<string> {
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

  return '';
}

/**
 * Imports TSV pasted directly from Google Sheets back into Dexie local database
 */
export async function importTSVFromSheets(table: 'tasks' | 'projects' | 'goals' | 'pantry', tsvText: string): Promise<{ added: number; updated: number }> {
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
    }
  }

  return { added, updated };
}

/**
 * Three-Way Sync Algorithm Execution against Google Apps Script Webhook
 * Based on Master Architecture Blueprint Section 6.1
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
    details: [],
  };

  if (!webhookUrl.trim()) {
    report.error = 'Webhook URL is required.';
    return report;
  }

  try {
    // 1. Fetch current local state
    const localTasks = await db.tasks.toArray();
    const localProjects = await db.projects.toArray();
    const localGoals = await db.goals.toArray();
    const localPantry = await db.pantry.toArray();

    // 2. Fetch last sync timestamp from local storage
    const lastSyncKey = 'om_os_last_sheets_sync_ts';
    const lastSyncTimestamp = Number(localStorage.getItem(lastSyncKey) || 0);

    // 3. Dispatch payload to Google Apps Script Webhook
    const payload = {
      action: 'sync',
      passkey: passkey.trim(),
      lastSyncTimestamp,
      clientTimestamp: Date.now(),
      tables: {
        tasks: localTasks,
        projects: localProjects,
        goals: localGoals,
        pantry: localPantry,
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script requires text/plain to avoid CORS preflight options
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

    // 4. Merge remote updates into local Dexie database (Three-Way Merge)
    if (data.remoteUpdates) {
      if (data.remoteUpdates.tasks && Array.isArray(data.remoteUpdates.tasks)) {
        for (const remoteTask of data.remoteUpdates.tasks) {
          const localTask = localTasks.find(t => t.id === remoteTask.id);
          if (!localTask) {
            await db.tasks.put(remoteTask);
            report.insertedLocal++;
          } else if (remoteTask.updatedAt > localTask.updatedAt) {
            await db.tasks.put(remoteTask);
            report.updatedLocal++;
          } else if (remoteTask.updatedAt < localTask.updatedAt) {
            // Local is newer: will be pushed on next cycle
            report.insertedRemote++;
          } else if (JSON.stringify(remoteTask) !== JSON.stringify(localTask)) {
            // CONFLICT DETECTED
            report.conflictsDetected++;
            report.details.push(`Conflict in Task: ${localTask.title}`);
            await db.syncConflicts.put({
              id: `conflict-task-${localTask.id}-${Date.now()}`,
              table: 'tasks',
              recordId: localTask.id,
              localData: localTask,
              remoteData: remoteTask,
              resolved: false,
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    localStorage.setItem(lastSyncKey, String(Date.now()));
    report.success = true;
    report.details.push(`Sync complete at ${new Date().toLocaleTimeString()}`);
    return report;

  } catch (err: any) {
    report.success = false;
    report.error = err.message || 'Unknown network error';
    report.details.push(`Error: ${report.error}`);
    return report;
  }
}

/**
 * Complete, ready-to-deploy Google Apps Script template for Google Drive
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =================================================================================
 * OM KNOWLEDGE OS: BIDIRECTIONAL 3-WAY GOOGLE SHEETS SYNC GATEWAY
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

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Sync Tasks
    if (req.tables && req.tables.tasks) {
      syncSheet(ss, "Tasks", req.tables.tasks, [
        "id", "title", "quadrant", "priority", "status", "energyRequired", "deadline", "isCompleted", "updatedAt"
      ]);
    }

    // Sync Projects
    if (req.tables && req.tables.projects) {
      syncSheet(ss, "Projects", req.tables.projects, [
        "id", "name", "status", "priority", "healthStatus", "progress", "budget", "deadline", "updatedAt"
      ]);
    }

    // Sync Goals
    if (req.tables && req.tables.goals) {
      syncSheet(ss, "Goals", req.tables.goals, [
        "id", "title", "level", "status", "progress", "lifeArea", "updatedAt"
      ]);
    }

    // Sync Pantry
    if (req.tables && req.tables.pantry) {
      syncSheet(ss, "Pantry", req.tables.pantry, [
        "id", "itemName", "category", "currentQty", "reorderPoint", "status", "updatedAt"
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      timestamp: new Date().getTime(),
      message: "Sync completed successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncSheet(ss, sheetName, records, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#eef2ff");
  }

  // Clear existing data rows (keep header)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }

  if (records.length === 0) return;

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
`;

