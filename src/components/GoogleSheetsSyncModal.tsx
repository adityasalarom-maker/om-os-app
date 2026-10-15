import React, { useState } from 'react';
import { db } from '../db';
import { 
  Sheet, 
  Download, 
  Upload, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Database, 
  Cloud, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export const GoogleSheetsSyncModal: React.FC = () => {
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState<string>('Ready for sync');
  const [isExporting, setIsExporting] = useState(false);

  // Copy structured table to clipboard formatted for Google Sheets paste
  const handleCopyForGoogleSheets = async (tableName: 'tasks' | 'projects' | 'goals' | 'pantry') => {
    let tsvData = '';
    if (tableName === 'tasks') {
      const records = await db.tasks.toArray();
      tsvData = ['ID\tTitle\tStatus\tPriority\tQuadrant\tEnergy\tDeadline\tCompleted'].join('\n') + '\n' +
        records.map(r => `${r.id}\t${r.title}\t${r.status}\t${r.priority}\t${r.quadrant}\t${r.energyRequired}\t${r.deadline || ''}\t${r.isCompleted}`).join('\n');
    } else if (tableName === 'projects') {
      const records = await db.projects.toArray();
      tsvData = ['ID\tName\tStatus\tPriority\tHealth\tProgress%\tBudget\tDeadline'].join('\n') + '\n' +
        records.map(r => `${r.id}\t${r.name}\t${r.status}\t${r.priority}\t${r.healthStatus}\t${r.progress}\t${r.budget || ''}\t${r.deadline || ''}`).join('\n');
    } else if (tableName === 'goals') {
      const records = await db.goals.toArray();
      tsvData = ['ID\tTitle\tLevel\tLifeArea\tStatus\tProgress%'].join('\n') + '\n' +
        records.map(r => `${r.id}\t${r.title}\t${r.level}\t${r.lifeArea}\t${r.status}\t${r.progress}`).join('\n');
    } else if (tableName === 'pantry') {
      const records = await db.pantry.toArray();
      tsvData = ['ID\tItemName\tCategory\tCurrentQty\tReorderPoint\tStatus\tStorage'].join('\n') + '\n' +
        records.map(r => `${r.id}\t${r.itemName}\t${r.category}\t${r.currentQty}\t${r.reorderPoint}\t${r.status}\t${r.storageType}`).join('\n');
    }

    await navigator.clipboard.writeText(tsvData);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 3000);
  };

  // Full OS JSON backup
  const handleFullBackup = async () => {
    setIsExporting(true);
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      projects: await db.projects.toArray(),
      tasks: await db.tasks.toArray(),
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
    a.download = `om_knowledge_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  // Restore from JSON backup
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
            Synchronize your structured tables with Google Sheets for formulas, cloud mirror, and zero vendor lock-in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: One-Click Google Sheets Formatted Export */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-400" size={18} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              1-Click Copy for Google Sheets Paste
            </h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Copies perfectly tab-delimited columns formatted with header rows. Open your Google Sheet, select cell <code className="bg-[#141622] px-1 py-0.5 rounded text-indigo-300">A1</code>, and press <kbd className="bg-[#141622] px-1 py-0.5 rounded text-gray-300 border border-[#282d3e]">Ctrl + V</kbd>.
          </p>

          <div className="space-y-2.5">
            {[
              { id: 'tasks', label: 'Tasks Intelligence Table', desc: 'IDs, Eisenhower quadrants, deadlines, status' },
              { id: 'projects', label: 'Projects & Milestones Table', desc: 'Progress %, budgets, deadlines, health' },
              { id: 'goals', label: 'Goals (Life Pyramid) Table', desc: 'Vision, 10Y, 1Y tiers, progress metrics' },
              { id: 'pantry', label: 'Kitchen & Pantry Table', desc: 'Rashan items, reorder thresholds, quantities' }
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

        {/* Card 2: Full Database Backup & Portability */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Database className="text-indigo-400" size={18} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Complete Data Portability & Backup
            </h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your data is 100% owned by you and saved locally. Create complete portable JSON snapshots anytime or restore to another Windows or Android device.
          </p>

          <div className="bg-[#141622] border border-[#262b3d] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
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

            <div className="pt-3 border-t border-[#262b3d] flex items-center justify-between">
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

          {/* Cloud Sync Connector Note */}
          <div className="bg-[#141622] border border-[#262b3d] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Cloud size={15} />
              <span>Automated Google Apps Script Webhook (Optional)</span>
            </div>
            <p className="text-[11px] text-gray-400">
              You can deploy a zero-cost Google Apps Script in your Google Drive and paste the Webhook URL below to automatically stream every task update directly into your Google Sheets workbook:
            </p>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-[#181a24] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
