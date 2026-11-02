import React, { useState } from 'react';
import {
  Clock,
  History,
  Plus,
  Trash2,
  X,
  ArrowRight,
  AlertTriangle,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import {
  reconstructBatchWindow,
  type BoundaryConfidence,
  type RetrospectiveActivityInput,
  type ReconstructionBatch,
  type ActivityOccurrence,
  type TimeSegment,
  type TimelineGap,
} from '../../services/dailyTrackerEngine';

interface ActivityOption {
  id: string;
  name: string;
  icon?: string;
}

interface RetrospectiveEntryState {
  activityId: string;
  activityName: string;
  mode: 'DURATION' | 'SEQUENCE_ONLY';
  hours: number;
  minutes: number;
  confidence: BoundaryConfidence;
}

interface RetrospectiveEditorModalProps {
  isOpen: boolean;
  availableActivities: ActivityOption[];
  onClose: () => void;
  onSaveBatch: (result: {
    batch: ReconstructionBatch;
    occurrences: ActivityOccurrence[];
    segments: TimeSegment[];
    untrackedGaps: TimelineGap[];
  }) => void;
}

export function RetrospectiveEditorModal({
  isOpen,
  availableActivities,
  onClose,
  onSaveBatch,
}: RetrospectiveEditorModalProps) {
  // Hooks MUST be unconditional at the top of the component
  const [windowPreset, setWindowPreset] = useState<'15' | '30' | '60' | 'CUSTOM'>('30');
  const [customStartHours, setCustomStartHours] = useState<number>(() => new Date().getHours());
  const [customStartMinutes, setCustomStartMinutes] = useState<number>(() => Math.max(0, new Date().getMinutes() - 30));
  const [customEndHours, setCustomEndHours] = useState<number>(() => new Date().getHours());
  const [customEndMinutes, setCustomEndMinutes] = useState<number>(() => new Date().getMinutes());

  const [entries, setEntries] = useState<RetrospectiveEntryState[]>([
    {
      activityId: availableActivities[0]?.id || 'act_washroom',
      activityName: availableActivities[0]?.name || 'Washroom',
      mode: 'SEQUENCE_ONLY',
      hours: 0,
      minutes: 0,
      confidence: 'EXACT',
    },
  ]);

  if (!isOpen) return null;

  const now = new Date();

  // Compute window timestamps
  let windowStartMs: number;
  let windowEndMs: number;

  if (windowPreset === 'CUSTOM') {
    const s = new Date(now);
    s.setHours(customStartHours, customStartMinutes, 0, 0);
    const e = new Date(now);
    e.setHours(customEndHours, customEndMinutes, 0, 0);
    windowStartMs = s.getTime();
    windowEndMs = e.getTime();
  } else {
    const mins = parseInt(windowPreset, 10);
    windowEndMs = now.getTime();
    windowStartMs = now.getTime() - mins * 60000;
  }

  const windowTotalMinutes = Math.max(0, Math.round((windowEndMs - windowStartMs) / 60000));

  // Compute allocated minutes from entries
  const allocatedMinutes = entries.reduce((acc, curr) => {
    if (curr.mode === 'DURATION') {
      return acc + (curr.hours * 60 + curr.minutes);
    }
    return acc;
  }, 0);

  const remainingUntrackedMinutes = Math.max(0, windowTotalMinutes - allocatedMinutes);
  const isOverAllocated = allocatedMinutes > windowTotalMinutes;

  const addActivityEntry = () => {
    const nextAct = availableActivities[entries.length % availableActivities.length] || availableActivities[0];
    setEntries([
      ...entries,
      {
        activityId: nextAct?.id || `act_${Date.now()}`,
        activityName: nextAct?.name || 'New Activity',
        mode: 'SEQUENCE_ONLY',
        hours: 0,
        minutes: 0,
        confidence: 'ESTIMATED',
      },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, idx) => idx !== index));
  };

  const moveEntry = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === entries.length - 1) return;
    const target = direction === 'UP' ? index - 1 : index + 1;
    const copy = [...entries];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setEntries(copy);
  };

  const updateEntry = (index: number, patch: Partial<RetrospectiveEntryState>) => {
    setEntries(entries.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const handleSave = () => {
    if (isOverAllocated || windowEndMs <= windowStartMs || entries.length === 0) return;

    const engineInputs: RetrospectiveActivityInput[] = entries.map((entry) => {
      if (entry.mode === 'SEQUENCE_ONLY') {
        return {
          activityId: entry.activityId,
          startConfidence: 'UNKNOWN',
          endConfidence: 'UNKNOWN',
        };
      } else {
        const totalMins = entry.hours * 60 + entry.minutes;
        return {
          activityId: entry.activityId,
          durationMinutes: totalMins > 0 ? totalMins : undefined,
          startConfidence: entry.confidence,
          endConfidence: entry.confidence,
        };
      }
    });

    const result = reconstructBatchWindow({
      windowStart: windowStartMs,
      windowEnd: windowEndMs,
      activities: engineInputs,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      utcOffsetMinutes: -now.getTimezoneOffset(),
    });

    onSaveBatch(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-indigo-400">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">Retrospective Time Reconstruction</h3>
              <p className="text-xs text-slate-400">Reconstruct unrecorded past intervals without inventing false precision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Choose Window */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Select Reconstruction Window</span>
              <span className="text-indigo-400 font-normal">Window Total: {windowTotalMinutes} mins</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['15', '30', '60', 'CUSTOM'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setWindowPreset(preset)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    windowPreset === preset
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {preset === 'CUSTOM' ? 'Custom Range' : `Last ${preset} Mins`}
                </button>
              ))}
            </div>

            {windowPreset === 'CUSTOM' && (
              <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">From</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={customStartHours}
                  onChange={(e) => setCustomStartHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                />
                :
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={customStartMinutes}
                  onChange={(e) => setCustomStartMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                />
                <span className="text-slate-400 ml-2">To</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={customEndHours}
                  onChange={(e) => setCustomEndHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                />
                :
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={customEndMinutes}
                  onChange={(e) => setCustomEndMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                />
              </div>
            )}
          </div>

          {/* Section 2: Activity Sequence & Duration Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ordered Activities in This Window
              </label>
              <button
                type="button"
                onClick={addActivityEntry}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Activity</span>
              </button>
            </div>

            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-slate-800 text-slate-300 rounded-full text-[11px] font-mono">
                      {idx + 1}
                    </span>

                    {/* Activity Selector */}
                    <select
                      value={entry.activityId}
                      onChange={(e) => {
                        const act = availableActivities.find((a) => a.id === e.target.value);
                        updateEntry(idx, {
                          activityId: e.target.value,
                          activityName: act?.name || 'Activity',
                        });
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {availableActivities.map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.name}
                        </option>
                      ))}
                    </select>

                    {/* Mode Toggle: Duration vs Sequence Only */}
                    <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => updateEntry(idx, { mode: 'SEQUENCE_ONLY' })}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          entry.mode === 'SEQUENCE_ONLY'
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Sequence Only
                      </button>
                      <button
                        type="button"
                        onClick={() => updateEntry(idx, { mode: 'DURATION' })}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          entry.mode === 'DURATION'
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Has Duration
                      </button>
                    </div>

                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveEntry(idx, 'UP')}
                      className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === entries.length - 1}
                      onClick={() => moveEntry(idx, 'DOWN')}
                      className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Entry */}
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(idx)}
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* If Duration mode selected: Direct Separate Hours and Minutes Controls */}
                  {entry.mode === 'DURATION' && (
                    <div className="ml-7 pt-2 border-t border-slate-850 flex items-center gap-4 text-xs">
                      {/* Separate Hours input */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Hours:</span>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={entry.hours}
                          onChange={(e) =>
                            updateEntry(idx, {
                              hours: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-slate-100"
                        />
                      </div>

                      {/* Separate Minutes input */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Minutes:</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={entry.minutes}
                          onChange={(e) =>
                            updateEntry(idx, {
                              minutes: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)),
                            })
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-slate-100"
                        />
                      </div>

                      {/* Confidence selector */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-slate-400">Confidence:</span>
                        <select
                          value={entry.confidence}
                          onChange={(e) =>
                            updateEntry(idx, {
                              confidence: e.target.value as BoundaryConfidence,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        >
                          <option value="EXACT">Exact</option>
                          <option value="ESTIMATED">Estimated</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {entry.mode === 'SEQUENCE_ONLY' && (
                    <div className="ml-7 text-[11px] text-slate-400 italic">
                      Zero duration will be invented on timeline. Order #{idx + 1} preserved honestly.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Honest Accounting Summary */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Parent Window:</span>
              <span className="text-slate-200 font-mono">{windowTotalMinutes} min</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">User Specified Durations:</span>
              <span className="text-indigo-400 font-mono font-medium">{allocatedMinutes} min</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Untracked Remainder:</span>
              </span>
              <span className="text-amber-300 font-mono font-semibold">{remainingUntrackedMinutes} min</span>
            </div>

            {isOverAllocated && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Specified durations ({allocatedMinutes}m) exceed parent window ({windowTotalMinutes}m). Please adjust.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Rule AT-08: Never divides gaps equally across activities.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isOverAllocated || entries.length === 0}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Commit Reconstruction</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
