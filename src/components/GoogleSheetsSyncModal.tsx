import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SyncConflict } from '../db';
import { 
  Sheet, 
  Download, 
  Upload, 
  Copy, 
  CheckCircle2, 
  Cloud, 
  Database, 
  FileSpreadsheet, 
  RefreshCw, 
  Code, 
  AlertTriangle,
  ExternalLink,
  Wifi,
  WifiOff,
  Zap,
  ShieldCheck,
  ArrowRight,
  Clock,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  generateTableTSV, 
  downloadTableTSV,
  importTSVFromSheets, 
  executeThreeWayGoogleSheetsSync, 
  pingGoogleSheetsWebhook,
  resolveSyncConflict,
  dismissAllConflictsAsLocal,
  clearSyncQueue,
  GOOGLE_APPS_SCRIPT_TEMPLATE, 
  type SyncReport,
  type PingResult,
  type SyncableTable
} from '../services/sheetsSync';

export const GoogleSheetsSyncModal: React.FC = () => {
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [downloadedTable, setDownloadedTable] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [passkey, setPasskey] = useState('OmKnowledgeOS!SecureKey');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [pasteTable, setPasteTable] = useState<'tasks' | 'pantry' | 'goals'>('tasks');
  const [pasteInput, setPasteInput] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);

  // Ping & Network
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auto-sync scheduler
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(0); // 0 = manual, 5, 15, 30 min
  const [countdown, setCountdown] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Live queries
  const pendingQueue = useLiveQuery(() => db.syncQueue.where('status').equals('pending').toArray(), []) || [];
  const conflicts = useLiveQuery(() => db.syncConflicts.toArray(), []) || [];
  const unresolvedConflicts = conflicts.filter(c => !c.resolved);

  useEffect(() => {
    const savedUrl = localStorage.getItem('om_os_sheets_webhook') || '';
    const savedKey = localStorage.getItem('om_os_sheets_passkey') || 'OmKnowledgeOS!SecureKey';
    const savedInterval = Number(localStorage.getItem('om_os_sheets_autosync') || 0);
    setWebhookUrl(savedUrl);
    setPasskey(savedKey);
    setAutoSyncInterval(savedInterval);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync timer management
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (autoSyncInterval > 0 && webhookUrl.trim() && isOnline) {
      setCountdown(autoSyncInterval * 60);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleExecuteSync();
            return autoSyncInterval * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoSyncInterval, webhookUrl, isOnline]);

  const handleSaveConfig = () => {
    localStorage.setItem('om_os_sheets_webhook', webhookUrl.trim());
    localStorage.setItem('om_os_sheets_passkey', passkey.trim());
    localStorage.setItem('om_os_sheets_autosync', String(autoSyncInterval));
  };

  const handlePing = async () => {
    handleSaveConfig();
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await pingGoogleSheetsWebhook(webhookUrl, passkey);
      setPingResult(res);
    } finally {
      setIsPinging(false);
    }
  };

  // 1-Click Copy TSV
  const handleCopyForGoogleSheets = async (table: SyncableTable) => {
    const tsv = await generateTableTSV(table);
    await navigator.clipboard.writeText(tsv);
    setCopiedTable(table);
    setTimeout(() => setCopiedTable(null), 2500);
  };

  // 1-Click Download TSV File
  const handleDownloadTSV = async (table: SyncableTable) => {
    await downloadTableTSV(table);
    setDownloadedTable(table);
    setTimeout(() => setDownloadedTable(null), 2500);
  };

  // Import TSV Pasted from Google Sheets
  const handlePasteImport = async () => {
    if (!pasteInput.trim()) return;
    const res = await importTSVFromSheets(pasteTable, pasteInput);
    setPasteSuccess(`Imported ${res.added} new records and updated ${res.updated} existing rows.`);
    setPasteInput('');
    setTimeout(() => setPasteSuccess(null), 4000);
  };

  // Automated 3-Way Sync
  const handleExecuteSync = async () => {
    handleSaveConfig();
    setIsSyncing(true);
    setSyncReport(null);
    try {
      const report = await executeThreeWayGoogleSheetsSync(webhookUrl, passkey);
      setSyncReport(report);
    } finally {
      setIsSyncing(false);
    }
  };

  // Conflict handling
  const handleResolveConflict = async (conflictId: string, choice: 'local' | 'remote') => {
    await resolveSyncConflict(conflictId, choice);
  };

  const handleDismissAllConflicts = async () => {
    await dismissAllConflictsAsLocal();
  };

  // Full Database JSON Backup
  const handleFullBackup = async () => {
    setIsExporting(true);
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks: await db.tasks.toArray(),
      projects: await db.projects.toArray(),
      knowledge: await db.knowledge.toArray(),
      goals: await db.goals.toArray(),
      inbox: await db.inbox.toArray(),
      journal: await db.journal.toArray(),
      pantry: await db.pantry.toArray(),
      health: await db.health.toArray(),
      properties: await db.properties.toArray(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmKnowledgeOS_MasterBackup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  // Restore JSON
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.tasks) await db.tasks.bulkPut(data.tasks);
        if (data.projects) await db.projects.bulkPut(data.projects);
        if (data.knowledge) await db.knowledge.bulkPut(data.knowledge);
        if (data.goals) await db.goals.bulkPut(data.goals);
        if (data.inbox) await db.inbox.bulkPut(data.inbox);
        if (data.journal) await db.journal.bulkPut(data.journal);
        if (data.pantry) await db.pantry.bulkPut(data.pantry);
        if (data.health) await db.health.bulkPut(data.health);
        if (data.properties) await db.properties.bulkPut(data.properties);
        alert('Master backup successfully restored into local database!');
      } catch (err) {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2500);
  };

  const tableList: { id: SyncableTable; label: string; desc: string }[] = [
    { id: 'tasks', label: 'Tasks Intelligence Table', desc: 'Eisenhower matrix, status, energy, deadlines' },
    { id: 'projects', label: 'Projects & Milestones Table', desc: 'Progress %, budgets, deadlines, health' },
    { id: 'goals', label: 'Goals (Life Pyramid) Table', desc: 'Life Vision, 10Y, 1Y tiers, progress metrics' },
    { id: 'pantry', label: 'Kitchen & Pantry Table', desc: 'Rashan items, reorder thresholds, quantities' },
    { id: 'knowledge', label: 'Knowledge Vault Concepts', desc: 'Concept titles, types, tags, updated dates' },
    { id: 'journal', label: 'Reflections & Daily Journal', desc: 'Mood, energy, morning intentions, evening wins' },
    { id: 'health', label: 'Ayurvedic Health & Vitality', desc: 'Sleep, agni digestion, dosha, prana rating' },
    { id: 'properties', label: 'Himalayan Property Records', desc: 'Land title, elevation, area size, legal notes' }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck size={12} /> Local-First Architecture
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isOnline ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? 'Online (LAN/Web)' : 'Offline (Local Only)'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sheet className="text-emerald-400" size={22} />
            <span>Google Sheets Live Automation & Cloud Bridge</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Zero-cost Google Apps Script webhook sync, delta queue draining, local-first conflict resolution, and 1-click TSV transfers.
          </p>
        </div>
        <button
          onClick={() => setShowScriptModal(true)}
          className="bg-[#212638] hover:bg-[#2c334d] text-indigo-300 border border-[#343c5a] text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-sm"
        >
          <Code size={14} />
          <span>Apps Script Gateway Code</span>
        </button>
      </div>

      {/* Unresolved Conflict Banner (If Any) */}
      {unresolvedConflicts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={20} />
              <h3 className="text-sm font-bold text-amber-200">
                {unresolvedConflicts.length} Synchronization Collision{unresolvedConflicts.length > 1 ? 's' : ''} Detected
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                Invariant #2: Local Edits Prevail
              </span>
            </div>
            <button
              onClick={handleDismissAllConflicts}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto"
            >
              Confirm All as Local & Dismiss
            </button>
          </div>

          <div className="space-y-3">
            {unresolvedConflicts.map(c => (
              <div key={c.id} className="bg-[#141622] border border-[#2b3145] rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-300 font-semibold uppercase tracking-wider text-[11px]">
                    Table: {c.table} • ID: {c.recordId}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(c.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#181a24] p-3 rounded-lg border border-emerald-500/30">
                    <span className="text-emerald-400 font-semibold block text-[11px] mb-1">
                      ?? Local Version (Active in Dexie)
                    </span>
                    <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                      {JSON.stringify(c.localData, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-[#181a24] p-3 rounded-lg border border-rose-500/30">
                    <span className="text-rose-400 font-semibold block text-[11px] mb-1">
                      ?? Remote Version (From Google Sheets)
                    </span>
                    <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                      {JSON.stringify(c.remoteData, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleResolveConflict(c.id, 'local')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Keep Local (Recommended)
                  </button>
                  <button
                    onClick={() => handleResolveConflict(c.id, 'remote')}
                    className="bg-[#242a3e] hover:bg-rose-600 text-gray-300 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Adopt Google Sheets Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Card 1 (Live Automation & Queue) & Card 2 (1-Click Portability Hub) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Automated 3-Way Cloud Sync */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="text-indigo-400" size={18} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated 3-Way Google Sheets Sync
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {pendingQueue.length > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Zap size={10} /> {pendingQueue.length} Delta{pendingQueue.length > 1 ? 's' : ''} Queued
                </span>
              )}
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                Section 6.1
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Non-destructive bidirectional merge with zero-cost Google Apps Script. Remote changes are pulled into Dexie while local offline edits are queued and dispatched safely.
          </p>

          <div className="space-y-3 bg-[#141622] border border-[#262b3d] p-4 rounded-xl">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-gray-300">
                  Apps Script Webhook URL
                </label>
                <button
                  type="button"
                  onClick={handlePing}
                  disabled={isPinging || !webhookUrl.trim()}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw size={10} className={isPinging ? 'animate-spin' : ''} />
                  <span>{isPinging ? 'Pinging...' : 'Ping Latency'}</span>
                </button>
              </div>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-[#181a24] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Ping Result Notification */}
            {pingResult && (
              <div className={`text-[11px] p-2.5 rounded-lg border flex items-center justify-between ${
                pingResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <span className="flex items-center gap-1.5 font-medium">
                  {pingResult.success ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  <span>{pingResult.message}</span>
                </span>
                {pingResult.success && (
                  <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    ⚡ {pingResult.latencyMs}ms
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Passkey Authorization Secret
              </label>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full bg-[#181a24] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Auto-Sync Frequency Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#232738]">
              <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Clock size={12} className="text-indigo-400" />
                <span>Background Sync Cadence:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { val: 0, label: 'Manual' },
                  { val: 5, label: '5m' },
                  { val: 15, label: '15m' },
                  { val: 30, label: '30m' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setAutoSyncInterval(opt.val);
                      localStorage.setItem('om_os_sheets_autosync', String(opt.val));
                    }}
                    className={`text-[10px] px-2 py-1 rounded-lg font-mono font-semibold transition-all ${
                      autoSyncInterval === opt.val
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#181a24] text-gray-400 hover:text-white border border-[#282d3e]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {countdown > 0 && (
              <div className="text-[10px] text-indigo-300 flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-mono">
                <span>Auto-sync heartbeat active</span>
                <span>Next in {Math.floor(countdown / 60)}m {countdown % 60}s</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleExecuteSync}
                disabled={isSyncing || !webhookUrl.trim()}
                className={`text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 ${
                  isSyncing || !webhookUrl.trim()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Synchronizing Tables...' : 'Sync Now with Sheets'}</span>
              </button>

              <div className="flex items-center gap-3">
                {pendingQueue.length > 0 && (
                  <button
                    onClick={() => clearSyncQueue()}
                    className="text-[10px] text-gray-500 hover:text-rose-400 flex items-center gap-1"
                    title="Clear pending delta queue"
                  >
                    <Trash2 size={11} /> Clear Queue
                  </button>
                )}
                <button
                  onClick={handleSaveConfig}
                  className="text-[11px] text-gray-400 hover:text-gray-200 underline"
                >
                  Save Settings
                </button>
              </div>
            </div>

            {/* Sync Report Results */}
            {syncReport && (
              <div className={`mt-3 p-3.5 rounded-xl border text-xs space-y-2 ${
                syncReport.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center justify-between font-semibold">
                  <span>{syncReport.success ? '? Sync Executed Successfully' : '? Sync Failed'}</span>
                  <span className="font-mono text-[10px]">
                    {new Date(syncReport.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {syncReport.error && (
                  <p className="text-rose-300 font-mono text-[11px] bg-[#141622] p-2 rounded-lg">
                    {syncReport.error}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-[#141622]/60 p-2 rounded border border-[#2b3044]">
                    <span className="text-gray-400 block">Local Inserted:</span>
                    <span className="font-mono font-bold text-emerald-400">+{syncReport.insertedLocal} rows</span>
                  </div>
                  <div className="bg-[#141622]/60 p-2 rounded border border-[#2b3044]">
                    <span className="text-gray-400 block">Local Updated:</span>
                    <span className="font-mono font-bold text-cyan-400">+{syncReport.updatedLocal} rows</span>
                  </div>
                </div>

                {syncReport.conflictsDetected > 0 && (
                  <div className="text-amber-300 text-[11px] flex items-center gap-1 mt-1 font-semibold">
                    <AlertTriangle size={13} />
                    <span>{syncReport.conflictsDetected} conflict(s) saved to review queue.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reverse TSV Paste Box */}
          <div className="space-y-3 bg-[#141622] border border-[#262b3d] p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Reverse Paste Import from Google Sheets
              </span>
              <select
                value={pasteTable}
                onChange={(e) => setPasteTable(e.target.value as any)}
                className="bg-[#181a24] text-gray-300 text-xs rounded-lg px-2 py-1 border border-[#2b3145] focus:outline-none focus:border-indigo-500"
              >
                <option value="tasks">Tasks Table</option>
                <option value="pantry">Pantry Table</option>
                <option value="goals">Goals Table</option>
              </select>
            </div>
            <textarea
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="Select rows in Google Sheets, copy (Ctrl+C), and paste here..."
              rows={3}
              className="w-full bg-[#181a24] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={handlePasteImport}
                disabled={!pasteInput.trim()}
                className="bg-[#1f2436] hover:bg-emerald-600 text-gray-200 hover:text-white border border-[#2d344d] text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              >
                Import Pasted Rows
              </button>
              {pasteSuccess && <span className="text-[11px] text-emerald-400 font-semibold">{pasteSuccess}</span>}
            </div>
          </div>
        </div>

        {/* Card 2: 1-Click Clipboard Copy & Full JSON Backup */}
        <div className="space-y-6">
          
          {/* Subcard: 1-Click Clipboard Exporter for 8 Tables */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={18} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  1-Click TSV Export for Google Sheets
                </h3>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Cell A1 Ready</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Copies tab-delimited columns with headers. Select cell <code className="bg-[#141622] px-1 py-0.5 rounded text-indigo-300">A1</code> in Google Sheets and press <kbd className="bg-[#141622] px-1 py-0.5 rounded text-gray-300 border border-[#282d3e]">Ctrl + V</kbd>, or download directly as a <code className="bg-[#141622] px-1 py-0.5 rounded text-indigo-300">.tsv</code> file.
            </p>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {tableList.map(tab => (
                <div 
                  key={tab.id}
                  className="bg-[#141622] border border-[#262b3d] rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-white truncate">{tab.label}</h4>
                    <span className="text-[10px] text-gray-500 font-mono block truncate">{tab.desc}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyForGoogleSheets(tab.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                        copiedTable === tab.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1f2436] hover:bg-indigo-600 text-gray-200 hover:text-white border border-[#2d344d]'
                      }`}
                      title="Copy TSV to clipboard"
                    >
                      {copiedTable === tab.id ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                      <span>{copiedTable === tab.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTSV(tab.id)}
                      className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                        downloadedTable === tab.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1f2436] hover:bg-cyan-600 text-gray-300 hover:text-white border border-[#2d344d]'
                      }`}
                      title="Download as .tsv file"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subcard: Complete Portable JSON Snapshot */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Database className="text-indigo-400" size={18} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Full Database JSON Snapshot
              </h3>
            </div>
            <div className="bg-[#141622] border border-[#262b3d] rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">Export Full JSON Snapshot</h4>
                <p className="text-[10px] text-gray-400">All 12+ modules, notes, tasks, properties, and health logs</p>
              </div>
              <button
                onClick={handleFullBackup}
                disabled={isExporting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Backup Now</span>
              </button>
            </div>

            <div className="bg-[#141622] border border-[#262b3d] rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">Restore from Backup</h4>
                <p className="text-[10px] text-gray-400">Import a previously saved JSON snapshot</p>
              </div>
              <label className="bg-[#1f2436] hover:bg-[#282e46] border border-[#2d344d] text-gray-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
                <Upload size={14} />
                <span>Select File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* Apps Script Gateway Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a24] border border-[#2c334d] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2c334d] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="text-indigo-400" size={18} />
                <span>Google Apps Script Synchronization Gateway (v2.0)</span>
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Copy this script and paste it into Google Sheets (<b>Extensions → Apps Script</b>). Deploy it as a <b>Web app</b> (Execute as: "Me", Access: "Anyone"), then copy the Web app URL into the sync connector above.
            </p>

            <pre className="flex-1 bg-[#10121a] border border-[#252a3d] p-3 rounded-xl text-[11px] text-gray-300 font-mono overflow-auto max-h-64 select-all">
              {GOOGLE_APPS_SCRIPT_TEMPLATE}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyScript}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
              >
                {scriptCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                <span>{scriptCopied ? 'Code Copied to Clipboard!' : 'Copy Gateway Script'}</span>
              </button>
              <button
                onClick={() => setShowScriptModal(false)}
                className="bg-[#212638] text-gray-300 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
