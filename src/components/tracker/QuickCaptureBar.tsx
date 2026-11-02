import React from 'react';
import {
  Square,
  Clock,
  History,
  Sun,
  Moon,
  Coffee,
  BookOpen,
  Dumbbell,
  Pill,
  Sparkles,
} from 'lucide-react';
import type { ActivityDefinition, TimeSegment } from '../../services/dailyTrackerEngine';

interface QuickCaptureBarProps {
  quickActivities: ActivityDefinition[];
  activeSegment: TimeSegment | null;
  activeActivityName: string | null;
  elapsedSeconds: number;
  onTapActivity: (activity: ActivityDefinition) => void;
  onStopActiveTimer: () => void;
  onOpenRetrospective: () => void;
}

export function QuickCaptureBar({
  quickActivities,
  activeSegment,
  activeActivityName,
  elapsedSeconds,
  onTapActivity,
  onStopActiveTimer,
  onOpenRetrospective,
}: QuickCaptureBarProps) {
  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getActivityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wake') || lower.includes('morning')) return <Sun className="w-4 h-4 text-amber-400" />;
    if (lower.includes('sleep') || lower.includes('nap')) return <Moon className="w-4 h-4 text-indigo-400" />;
    if (lower.includes('food') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('tea'))
      return <Coffee className="w-4 h-4 text-orange-400" />;
    if (lower.includes('study') || lower.includes('work') || lower.includes('reading'))
      return <BookOpen className="w-4 h-4 text-blue-400" />;
    if (lower.includes('exercise') || lower.includes('yoga') || lower.includes('bath'))
      return <Dumbbell className="w-4 h-4 text-emerald-400" />;
    if (lower.includes('medicine') || lower.includes('water')) return <Pill className="w-4 h-4 text-rose-400" />;
    return <Sparkles className="w-4 h-4 text-purple-400" />;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
      {/* Top Bar: Ongoing Timer (if running) + Retrospective Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Active Timer Pill */}
        {activeSegment && activeActivityName ? (
          <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5">Ongoing:</span>
              <strong className="text-white font-medium">{activeActivityName}</strong>
              <span className="ml-2 font-mono text-indigo-300 font-semibold">{formatElapsed(elapsedSeconds)}</span>
            </div>
            <button
              onClick={onStopActiveTimer}
              className="ml-2 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Square className="w-3 h-3 fill-rose-300" />
              <span>Stop</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>No active timer running — ready for one-tap capture</span>
          </div>
        )}

        {/* Retrospective Action */}
        <button
          onClick={onOpenRetrospective}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reconstruct Past Window</span>
        </button>
      </div>

      {/* Quick Action Activity Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Quick Actions (1-Tap Capture)</span>
          <span className="text-slate-400 font-normal">Instant Event or Start Interval</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {quickActivities.map((act) => {
            const isCurrentlyActive = activeSegment?.occurrenceId === act.id;
            return (
              <button
                key={act.id}
                onClick={() => onTapActivity(act)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left group ${
                  isCurrentlyActive
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform">
                  {getActivityIcon(act.name)}
                </div>
                <div className="truncate">
                  <div className="truncate font-medium">{act.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {act.defaultMode === 'EVENT' ? 'Instant Event' : 'Interval'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
