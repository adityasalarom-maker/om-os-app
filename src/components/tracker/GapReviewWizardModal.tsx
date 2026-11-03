import React, { useState } from 'react';
import {
  Clock,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { TimelineGap } from '../../services/dailyTrackerEngine';

interface GapReviewWizardModalProps {
  isOpen: boolean;
  untrackedGaps: TimelineGap[];
  onClose: () => void;
  onReconstructGap: (gap: TimelineGap) => void;
}

export function GapReviewWizardModal({
  isOpen,
  untrackedGaps,
  onClose,
  onReconstructGap,
}: GapReviewWizardModalProps) {
  const [currentGapIndex, setCurrentGapIndex] = useState(0);

  if (!isOpen) return null;

  // Filter significant gaps (> 10 mins)
  const significantGaps = untrackedGaps.filter((g) => g.durationMs >= 10 * 60000);

  if (significantGaps.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-lg">No Significant Untracked Gaps</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your daily records are comprehensive. All gaps are under 10 minutes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
          >
            Close Review
          </button>
        </div>
      </div>
    );
  }

  const currentGap = significantGaps[currentGapIndex];
  const isLast = currentGapIndex === significantGaps.length - 1;
  const gapDurationMins = currentGap ? Math.round(currentGap.durationMs / 60000) : 0;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentGapIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">Untracked Gap Review Assistant</h3>
              <p className="text-xs text-slate-400">
                Gap {currentGapIndex + 1} of {significantGaps.length} • Rule AT-08 Honest Remainder
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
        {currentGap && (
          <div className="p-6 space-y-5 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">Untracked Interval</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{gapDurationMins} minutes</span>
              </div>
              <div className="text-lg font-mono font-semibold text-slate-100">
                {new Date(currentGap.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' — '}
                {new Date(currentGap.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <p className="text-[11px] text-slate-400">
                Did an activity happen during this time, or would you like to leave this interval recorded honestly as Untracked?
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onReconstructGap(currentGap);
                  onClose();
                }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center justify-between shadow-lg shadow-indigo-600/20 transition-all text-xs"
              >
                <span>Reconstruct Activities in this Gap</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleNext}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-medium transition-colors text-xs text-left"
              >
                Leave Untracked & Proceed {isLast ? '(Finish Review)' : 'to Next Gap'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
