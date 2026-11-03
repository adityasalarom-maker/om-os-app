import React, { useState } from 'react';
import {
  ShieldAlert,
  BatteryCharging,
  Calendar,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { ActivityOccurrence, TimeSegment } from '../../services/dailyTrackerEngine';

interface FailureRecoveryModalProps {
  isOpen: boolean;
  occurrences: ActivityOccurrence[];
  segments: TimeSegment[];
  onClose: () => void;
  onOpenBatchGap: (durationHours: number) => void;
}

export function FailureRecoveryModal({
  isOpen,
  occurrences,
  segments,
  onClose,
  onOpenBatchGap,
}: FailureRecoveryModalProps) {
  if (!isOpen) return null;

  const handleExportJson = () => {
    const data = {
      exportTimestamp: Date.now(),
      version: '1.0',
      totalOccurrences: occurrences.length,
      totalSegments: segments.length,
      occurrences,
      segments,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `om-daily-life-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    let csv = 'occurrence_id,activity_id,kind,source,start_time,end_time,duration_mins,confidence\n';
    segments.forEach((seg) => {
      const occ = occurrences.find((o) => o.id === seg.occurrenceId);
      const startStr = new Date(seg.startAt).toISOString();
      const endStr = seg.endAt ? new Date(seg.endAt).toISOString() : 'RUNNING';
      const durationMins = seg.endAt ? Math.round((seg.endAt - seg.startAt) / 60000) : 0;
      csv += `"${seg.occurrenceId}","${occ?.activityId || ''}","${occ?.kind || ''}","${occ?.source || ''}","${startStr}","${endStr}",${durationMins},"${seg.startConfidence}-${seg.endConfidence}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `om-daily-life-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-indigo-400">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">Failure & Recovery Scenarios (PRD §9.4)</h3>
              <p className="text-xs text-slate-400">
                Imperfect life tracking recovery • Battery death • Multi-day absence • Full data ownership
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Recovery Scenario 1: 6-Hour Gap */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <BatteryCharging className="w-4 h-4 text-amber-400" />
              <span>Scenario A: Phone Died / 6-Hour Untracked Period</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              If you were away from your phone for several hours, open a 6-hour retrospective batch window. Enter only what you remember; unremembered time will be preserved neutrally.
            </p>
            <button
              onClick={() => {
                onOpenBatchGap(6);
                onClose();
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg font-medium transition-colors"
            >
              Launch 6-Hour Recovery Window
            </button>
          </div>

          {/* Recovery Scenario 2: 3-Day Absence */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Scenario B: 3-Day Absence Recovery</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              If you haven't opened the application for multiple days, the system will never mass-generate fabricated activities. You can reconstruct key anchor events (Wake, Sleep, Work) day-by-day.
            </p>
            <button
              onClick={() => {
                onOpenBatchGap(24);
                onClose();
              }}
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium transition-colors"
            >
              Reconstruct Prior Day Anchor Events
            </button>
          </div>

          {/* Data Ownership & Export */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Local-First Data Ownership & Export (PRD §4.12)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Export all your private life records with complete timestamp provenance and decomposed confidence metadata.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportJson}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export JSON ({occurrences.length} entries)</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV for Sheets</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
