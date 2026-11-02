import React, { useState } from 'react';
import { Clock, X, ArrowRight, ShieldAlert } from 'lucide-react';
import type { TimeSegment, BoundaryConfidence } from '../../services/dailyTrackerEngine';

interface ActiveTimerModalProps {
  isOpen: boolean;
  activeSegment: TimeSegment | null;
  activeActivityName: string;
  newActivityName: string;
  onClose: () => void;
  onConfirmClosure: (
    closureType: 'CURRENT_TIME' | 'ACTUAL_END_TIME',
    actualEndTimeMs?: number,
    confidence?: BoundaryConfidence
  ) => void;
  onLogAsSecondary: () => void;
}

export function ActiveTimerModal({
  isOpen,
  activeSegment,
  activeActivityName,
  newActivityName,
  onClose,
  onConfirmClosure,
  onLogAsSecondary,
}: ActiveTimerModalProps) {
  // Hooks MUST be unconditional at the top of the component
  const [closureChoice, setClosureChoice] = useState<'CURRENT_TIME' | 'ACTUAL_END_TIME' | 'SECONDARY'>('CURRENT_TIME');
  const [actualHours, setActualHours] = useState<number>(() => new Date().getHours());
  const [actualMinutes, setActualMinutes] = useState<number>(() => new Date().getMinutes());
  const [confidence, setConfidence] = useState<BoundaryConfidence>('EXACT');

  if (!isOpen || !activeSegment) return null;

  const now = new Date();

  // Compute calculated end time
  const calculatedEndDate = new Date();
  calculatedEndDate.setHours(actualHours, actualMinutes, 0, 0);
  const calculatedEndTimeMs = calculatedEndDate.getTime();

  // Validate that actual end time is strictly between segment start and now
  const isEarlierValid =
    calculatedEndTimeMs > activeSegment.startAt && calculatedEndTimeMs <= now.getTime();
  
  const untrackedGapMinutes = isEarlierValid
    ? Math.round((now.getTime() - calculatedEndTimeMs) / 60000)
    : 0;

  const handleConfirm = () => {
    if (closureChoice === 'SECONDARY') {
      onLogAsSecondary();
    } else if (closureChoice === 'CURRENT_TIME') {
      onConfirmClosure('CURRENT_TIME', now.getTime(), 'EXACT');
    } else {
      if (!isEarlierValid) return;
      onConfirmClosure('ACTUAL_END_TIME', calculatedEndTimeMs, confidence);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-amber-400">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-lg">Active Primary Timer Detected</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-slate-200 space-y-1">
            <p className="font-medium text-amber-300">
              <span className="underline font-semibold">{activeActivityName}</span> is currently running as your Primary activity.
            </p>
            <p className="text-slate-400 text-xs">
              Starting <span className="text-slate-200 font-medium">{newActivityName}</span> requires resolving the primary timeline to prevent double-counting.
            </p>
          </div>

          <div className="space-y-3">
            {/* Option 1: End at current time */}
            <label
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                closureChoice === 'CURRENT_TIME'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="closureType"
                checked={closureChoice === 'CURRENT_TIME'}
                onChange={() => setClosureChoice('CURRENT_TIME')}
                className="mt-1 text-indigo-500 focus:ring-indigo-500"
              />
              <div className="space-y-0.5">
                <div className="font-medium text-sm">End at Current Time ({now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</div>
                <div className="text-xs text-slate-400">
                  Closes {activeActivityName} now with exact live confidence.
                </div>
              </div>
            </label>

            {/* Option 2: Set actual earlier end time */}
            <label
              className={`flex flex-col gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                closureChoice === 'ACTUAL_END_TIME'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <input
                  type="radio"
                  name="closureType"
                  checked={closureChoice === 'ACTUAL_END_TIME'}
                  onChange={() => setClosureChoice('ACTUAL_END_TIME')}
                  className="mt-1 text-indigo-500 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <div className="font-medium text-sm">Set Actual End Time (Earlier)</div>
                  <div className="text-xs text-slate-400">
                    If {activeActivityName} ended earlier, enter the actual time. The remaining gap will be preserved as untracked.
                  </div>
                </div>
              </div>

              {closureChoice === 'ACTUAL_END_TIME' && (
                <div className="ml-7 pt-2 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-4">
                    {/* Separate Hours input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Hours (0-23)</label>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={actualHours}
                        onChange={(e) => setActualHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-center text-sm font-mono text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <span className="text-slate-500 font-bold text-lg mt-5">:</span>

                    {/* Separate Minutes input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Minutes (0-59)</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={actualMinutes}
                        onChange={(e) => setActualMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-center text-sm font-mono text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Confidence toggle */}
                    <div className="space-y-1 ml-auto">
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Confidence</label>
                      <select
                        value={confidence}
                        onChange={(e) => setConfidence(e.target.value as BoundaryConfidence)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="EXACT">Exact</option>
                        <option value="ESTIMATED">Estimated / Approx</option>
                      </select>
                    </div>
                  </div>

                  {untrackedGapMinutes > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Leaves <strong>{untrackedGapMinutes} min</strong> untracked gap before {newActivityName}.</span>
                    </div>
                  )}

                  {!isEarlierValid && (
                    <p className="text-xs text-rose-400">
                      End time must be after {new Date(activeSegment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and before current time.
                    </p>
                  )}
                </div>
              )}
            </label>

            {/* Option 3: Keep running as Secondary */}
            <label
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                closureChoice === 'SECONDARY'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="closureType"
                checked={closureChoice === 'SECONDARY'}
                onChange={() => setClosureChoice('SECONDARY')}
                className="mt-1 text-indigo-500 focus:ring-indigo-500"
              />
              <div className="space-y-0.5">
                <div className="font-medium text-sm">Start as Secondary (Concurrent)</div>
                <div className="text-xs text-slate-400">
                  Keep {activeActivityName} running as Primary and log {newActivityName} as Secondary (e.g. music while study).
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={closureChoice === 'ACTUAL_END_TIME' && !isEarlierValid}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <span>Confirm & Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
