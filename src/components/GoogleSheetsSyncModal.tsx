import React, { useState, useEffect } from 'react';
import { db } from '../db';
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
  ExternalLink
} from 'lucide-react';
import { 
  generateTableTSV, 
  importTSVFromSheets, 
  executeThreeWayGoogleSheetsSync, 
  GOOGLE_APPS_SCRIPT_TEMPLATE, 
  type SyncReport 
} from '../services/sheetsSync';

export const GoogleSheetsSyncModal: React.FC = () => {
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [passkey, setPasskey] = useState('OmKnowledgeOS!SecureKey');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [pasteTable, setPasteTable] = useState<'tasks' | 'pantry'>('tasks');
  const [pasteInput, setPasteInput] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('om_os_sheets_webhook') || '';
    const savedKey = localStorage.getItem('om_os_sheets_passkey') || 'OmKnowledgeOS!SecureKey';
    setWebhookUrl(savedUrl);
    setPasskey(savedKey);
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('om_os_sheets_webhook', webhookUrl.trim());
    localStorage.setItem('om_os_sheets_passkey', passkey.trim());
  };

  // 1-Click Copy TSV
  const handleCopyForGoogleSheets = async (table: 'tasks' | 'projects' | 'goals' | 'pantry' | 'knowledge') => {
    const tsv = await generateTableTSV(table);
    await navigator.clipboard.writeText(tsv);
    setCopiedTable(table);
    setTimeout(() => setCopiedTable(null), 2500);
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
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmKnowledgeOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
        alert('Backup successfully restored into local database!');
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

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sheet className="text-emerald-400" size={22} />
            <span>Google Sheets Bridge & Portability Center</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Bidirectional 3-Way synchronization with Google Sheets, 1-click clipboard paste, and full JSON portability.
          </p>
        </div>
        <button
          onClick={() => setShowScriptModal(true)}
          className="bg-[#212638] hover:bg-[#2c334d] text-indigo-300 border border-[#343c5a] text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Code size={14} />
          <span>Apps Script Gateway Code</span>
        </button>
      </div>

      {/* Main Grid */}
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
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
              Section 6.1 Algorithm
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Directly connect your Google Sheets workbook using a zero-cost Google Apps Script Webhook. Non-destructive 3-way merge with conflict safety.
          </p>

          <div className="space-y-3 bg-[#141622] border border-[#262b3d] p-4 rounded-xl">
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Apps Script Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-[#181a24] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

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

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleExecuteSync}
                disabled={isSyncing || !webhookUrl.trim()}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 ${
                  isSyncing || !webhookUrl.trim()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Synchronizing...' : 'Sync Now with Sheets'}</span>
              </button>

              <button
                onClick={handleSaveConfig}
                className="text-[11px] text-gray-400 hover:text-gray-200 underline"
              >
                Save Settings
              </button>
            </div>

            {/* Sync Report Results */}
            {syncReport && (
              <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1.5 ${
                syncReport.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {syncReport.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{syncReport.success ? 'Sync Completed Successfully' : 'Sync Failed'}</span>
                </div>
                {syncReport.error && <p className="text-[11px] font-mono">{syncReport.error}</p>}
                <div className="text-[11px] opacity-80 space-y-0.5 pt-1">
                  <div>Local updates applied: {syncReport.updatedLocal + syncReport.insertedLocal}</div>
                  <div>Conflicts detected: {syncReport.conflictsDetected}</div>
                </div>
              </div>
            )}
          </div>

          {/* Paste from Sheets section */}
          <div className="bg-[#141622] border border-[#262b3d] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white">Import / Paste from Google Sheets</h4>
              <select
                value={pasteTable}
                onChange={(e) => setPasteTable(e.target.value as any)}
                className="bg-[#181a24] border border-[#2d344d] text-gray-300 text-xs rounded-lg px-2 py-1"
              >
                <option value="tasks">Tasks Table</option>
                <option value="pantry">Pantry Table</option>
              </select>
            </div>
            <textarea
              rows={2}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="Copy rows in Google Sheets (Ctrl+C) and paste them here (Ctrl+V)..."
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
          
          {/* Subcard: 1-Click Clipboard Exporter */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-400" size={18} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                1-Click Copy for Google Sheets Paste
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Copies tab-delimited columns with headers. Open Google Sheets, select cell <code className="bg-[#141622] px-1 py-0.5 rounded text-indigo-300">A1</code>, and press <kbd className="bg-[#141622] px-1 py-0.5 rounded text-gray-300 border border-[#282d3e]">Ctrl + V</kbd>.
            </p>

            <div className="space-y-2.5">
              {[
                { id: 'tasks', label: 'Tasks Intelligence Table', desc: 'IDs, Eisenhower quadrants, deadlines, status' },
                { id: 'projects', label: 'Projects & Milestones Table', desc: 'Progress %, budgets, deadlines, health' },
                { id: 'goals', label: 'Goals (Life Pyramid) Table', desc: 'Vision, 10Y, 1Y tiers, progress metrics' },
                { id: 'pantry', label: 'Kitchen & Pantry Table', desc: 'Rashan items, reorder thresholds, quantities' },
                { id: 'knowledge', label: 'Knowledge Vault Concepts', desc: 'Concept titles, types, tags, updated dates' }
              ].map(tab => (
                <div 
                  key={tab.id}
                  className="bg-[#141622] border border-[#262b3d] rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{tab.label}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">{tab.desc}</span>
                  </div>
                  <button
                    onClick={() => handleCopyForGoogleSheets(tab.id as any)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      copiedTable === tab.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#1f2436] hover:bg-indigo-600 text-gray-200 hover:text-white border border-[#2d344d]'
                    }`}
                  >
                    {copiedTable === tab.id ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Rows</span>
                      </>
                    )}
                  </button>
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
                <p className="text-[10px] text-gray-400">All 24 modules, notes, tasks, and journals</p>
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
                <span>Google Apps Script Synchronization Gateway</span>
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ? Close
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Copy this script and paste it into Google Sheets (<b>Extensions ? Apps Script</b>). Deploy it as a <b>Web app</b> (Execute as: "Me", Access: "Anyone"), then copy the Web app URL into the sync connector.
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
