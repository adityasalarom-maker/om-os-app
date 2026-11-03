import React, { useState } from 'react';
import {
  Clock,
  X,
  Trash2,
  Scissors,
  Save,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Sparkles,
} from 'lucide-react';
import type {
  ProjectedSegment,
  ActivityDefinition,
  ActivityOccurrence,
  BoundaryConfidence,
  ActivityRole,
} from '../../services/dailyTrackerEngine';

interface ActivityDetailModalProps {
  isOpen: boolean;
  segment: ProjectedSegment | null;
  occurrence: ActivityOccurrence | null;
  activity: ActivityDefinition | null;
  onClose: () => void;
  onSaveUpdate: (updatedSegment: {
    startAt: number;
    endAt: number;
    role: ActivityRole;
    startConfidence: BoundaryConfidence;
    endConfidence: BoundaryConfidence;
    notes?: string;
  }) => void;
  onSplitSegment: (splitTimeMs: number) => void;
  onDeleteSegment: () => void;
}

export function ActivityDetailModal({
  isOpen,
  segment,
  occurrence,
  activity,
  onClose,
  onSaveUpdate,
  onSplitSegment,
  onDeleteSegment,
}: ActivityDetailModalProps) {
  // Hooks MUST be unconditional
  const [startHours, setStartHours] = useState<number>(() => (segment ? new Date(segment.startAt).getHours() : 0));
  const [startMinutes, setStartMinutes] = useState<number>(() => (segment ? new Date(segment.startAt).getMinutes() : 0));
  const [endHours, setEndHours] = useState<number>(() => (segment ? new Date(segment.endAt).getHours() : 0));
  const [endMinutes, setEndMinutes] = useState<number>(() => (segment ? new Date(segment.endAt).getMinutes() : 0));
  const [role, setRole] = useState<ActivityRole>(() => segment?.role || 'PRIMARY');
  const [startConfidence, setStartConfidence] = useState<BoundaryConfidence>(() => segment?.startConfidence || 'EXACT');
  const [endConfidence, setEndConfidence] = useState<BoundaryConfidence>(() => segment?.endConfidence || 'EXACT');
  const [notes, setNotes] = useState<string>(() => occurrence?.notes || '');
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitHours, setSplitHours] = useState<number>(0);
  const [splitMinutes, setSplitMinutes] = useState<number>(0);

  if (!isOpen || !segment || !activity) return null;

  const handleSave = () => {
    const sDate = new Date(segment.startAt);
    sDate.setHours(startHours, startMinutes, 0, 0);

    const eDate = new Date(segment.endAt);
    eDate.setHours(endHours, endMinutes, 0, 0);

    if (eDate.getTime() <= sDate.getTime()) {
      alert('End time must be after start time.');
      return;
    }

    onSaveUpdate({
      startAt: sDate.getTime(),
      endAt: eDate.getTime(),
      role,
      startConfidence,
      endConfidence,
      notes,
    });
    onClose();
  };

  const handleConfirmSplit = () => {
    const splitDate = new Date(segment.startAt);
    splitDate.setHours(splitHours, splitMinutes, 0, 0);
    const splitMs = splitDate.getTime();

    if (splitMs <= segment.startAt || splitMs >= segment.endAt) {
      alert('Split time must be strictly between start and end time.');
      return;
    }

    onSplitSegment(splitMs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-indigo-400">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">{activity.name}</h3>
              <span className="text-xs text-slate-400">Occurrence & Timing Editor</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Time Boundary Controls (Separate H:M) */}
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Time Boundaries (Half-Open Interval)
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">Start Time (H:M)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={startHours}
                    onChange={(e) => setStartHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-sm text-slate-100"
                  />
                  <span className="text-slate-500">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={startMinutes}
                    onChange={(e) => setStartMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-sm text-slate-100"
                  />
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">End Time (H:M)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={endHours}
                    onChange={(e) => setEndHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-sm text-slate-100"
                  />
                  <span className="text-slate-500">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={endMinutes}
                    onChange={(e) => setEndMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-sm text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Confidence Selectors */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Start Confidence</label>
                <select
                  value={startConfidence}
                  onChange={(e) => setStartConfidence(e.target.value as BoundaryConfidence)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="EXACT">Exact</option>
                  <option value="ESTIMATED">Estimated</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">End Confidence</label>
                <select
                  value={endConfidence}
                  onChange={(e) => setEndConfidence(e.target.value as BoundaryConfidence)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="EXACT">Exact</option>
                  <option value="ESTIMATED">Estimated</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role: Primary vs Secondary */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeline Allocation Role</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRole('PRIMARY')}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                  role === 'PRIMARY'
                    ? 'border-indigo-500 bg-indigo-500/20 text-white font-medium'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Primary (Main 24h Ledger)
              </button>
              <button
                type="button"
                onClick={() => setRole('SECONDARY')}
                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                  role === 'SECONDARY'
                    ? 'border-blue-500 bg-blue-500/20 text-white font-medium'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Secondary (Concurrent Overlay)
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes & Details</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes, mood, energy or context..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Split Mode Section */}
          {isSplitting ? (
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-2 text-xs">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                <span>Split Interval into Two</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Choose the split moment. The activity will be divided into two adjacent half-open segments.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={splitHours}
                  onChange={(e) => setSplitHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                />
                :
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={splitMinutes}
                  onChange={(e) => setSplitMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono"
                />
                <button
                  type="button"
                  onClick={handleConfirmSplit}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium ml-auto"
                >
                  Confirm Split
                </button>
                <button
                  type="button"
                  onClick={() => setIsSplitting(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSplitHours(startHours);
                  setSplitMinutes(Math.min(59, startMinutes + 15));
                  setIsSplitting(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Split Interval</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${activity.name}?`)) {
                    onDeleteSegment();
                    onClose();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
