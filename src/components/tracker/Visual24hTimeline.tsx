import React from 'react';
import { Clock, Plus, Sparkles, AlertCircle } from 'lucide-react';
import type {
  ProjectedSegment,
  TimelineGap,
  ActivityDefinition,
  ActivityCategory,
} from '../../services/dailyTrackerEngine';
import { STARTER_CATEGORIES } from '../../services/dailyTrackerEngine';

interface Visual24hTimelineProps {
  windowStart: number;
  windowEnd: number;
  primarySegments: ProjectedSegment[];
  secondarySegments: ProjectedSegment[];
  untrackedGaps: TimelineGap[];
  activities: ActivityDefinition[];
  categories?: ActivityCategory[];
  onSelectSegment: (segment: ProjectedSegment) => void;
  onSelectGap: (gap: TimelineGap) => void;
}

export function Visual24hTimeline({
  windowStart,
  windowEnd,
  primarySegments,
  secondarySegments,
  untrackedGaps,
  activities,
  categories = STARTER_CATEGORIES,
  onSelectSegment,
  onSelectGap,
}: Visual24hTimelineProps) {
  const windowDurationMs = windowEnd - windowStart;
  const actMap = new Map(activities.map((a) => [a.id, a]));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Current time marker position
  const now = Date.now();
  const isToday = now >= windowStart && now <= windowEnd;
  const nowPercent = isToday ? ((now - windowStart) / windowDurationMs) * 100 : null;

  // 24 hour tick marks (00 to 24)
  const hourTicks = Array.from({ length: 25 }, (_, i) => i);

  const getCategoryColor = (activityId: string) => {
    const act = actMap.get(activityId);
    if (!act) return '#64748b';
    const cat = catMap.get(act.categoryId || '');
    return cat?.color || '#6366f1';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm">24-Hour Horizon Canvas (00:00 – 24:00)</h3>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span>Exact Live/Retro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80 border border-dashed border-amber-300" />
            <span>Estimated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-dashed border-slate-600" />
            <span>Untracked Gap</span>
          </div>
        </div>
      </div>

      {/* Main 24-Hour Strip Canvas */}
      <div className="relative pt-6 pb-2">
        {/* Hour Tick Markers */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-[9px] font-mono text-slate-500 select-none">
          {hourTicks.filter((h) => h % 2 === 0).map((h) => (
            <span key={h} className="transform -translate-x-1/2">
              {h.toString().padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {/* Primary Timeline Bar */}
        <div className="relative h-14 bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex">
          {/* Primary Segments */}
          {primarySegments.map((seg) => {
            const leftPercent = ((seg.startAt - windowStart) / windowDurationMs) * 100;
            const widthPercent = (seg.durationMs / windowDurationMs) * 100;
            const color = getCategoryColor(seg.activityId);
            const act = actMap.get(seg.activityId);
            const isRunning = seg.isRunning || (seg.endAt == null);
            const isEstimated = !isRunning && seg.confidenceLabel === 'Estimated';
            const startTimeStr = new Date(seg.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = isRunning ? 'Running Now' : new Date(seg.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const durationMins = Math.max(1, Math.round(seg.durationMs / 60000));

            return (
              <div
                key={seg.segmentId}
                onClick={() => onSelectSegment(seg)}
                style={{
                  left: `${leftPercent}%`,
                  width: `${Math.max(1.2, widthPercent)}%`,
                  backgroundColor: isRunning ? '#059669' : color,
                }}
                className={`absolute top-0 bottom-0 cursor-pointer transition-all hover:brightness-110 hover:z-20 flex flex-col justify-center px-1.5 overflow-hidden group shadow-md ${
                  isRunning
                    ? 'border-2 border-emerald-400 z-10'
                    : isEstimated
                    ? 'border-2 border-dashed border-white/40'
                    : ''
                }`}
                title={`${act?.name || 'Activity'}: ${startTimeStr} - ${endTimeStr} (${durationMins}m) [${isRunning ? 'Live Now' : seg.confidenceLabel}]`}
              >
                <div className="flex items-center gap-1">
                  {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />}
                  <span className="text-[10px] font-bold text-white truncate drop-shadow-sm leading-tight">
                    {act?.name || 'Activity'}
                  </span>
                </div>
                <span className="text-[9px] text-white/90 font-mono truncate leading-tight">
                  {isRunning ? `${durationMins}m Live` : `${durationMins}m`}
                </span>
              </div>
            );
          })}

          {/* Interactive Untracked Gaps */}
          {untrackedGaps.map((gap, idx) => {
            const leftPercent = ((gap.startAt - windowStart) / windowDurationMs) * 100;
            const widthPercent = (gap.durationMs / windowDurationMs) * 100;
            const mins = Math.round(gap.durationMs / 60000);

            return (
              <div
                key={`gap_${idx}`}
                onClick={() => onSelectGap(gap)}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
                className="absolute top-0 bottom-0 bg-slate-900/60 hover:bg-indigo-950/40 border-r border-slate-800/80 cursor-pointer flex items-center justify-center group transition-colors"
                title={`Untracked Gap: ${mins} minutes (Click to reconstruct)`}
              >
                {widthPercent > 4 && (
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-indigo-300 flex items-center gap-0.5 transition-colors">
                    <Plus className="w-2.5 h-2.5" />
                    <span>{mins}m gap</span>
                  </span>
                )}
              </div>
            );
          })}

          {/* Live 'Now' Cursor */}
          {nowPercent !== null && (
            <div
              style={{ left: `${nowPercent}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.9)]"
            >
              <div className="w-2 h-2 -ml-[3px] -top-1 bg-rose-500 rounded-full" />
            </div>
          )}
        </div>

        {/* Secondary Activities Under-Rail */}
        {secondarySegments.length > 0 && (
          <div className="mt-2 space-y-1">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
              Secondary Concurrent Overlays (Zero Primary Inflation)
            </span>
            <div className="relative h-6 bg-slate-950/40 border border-slate-800/60 rounded-lg overflow-hidden">
              {secondarySegments.map((sec) => {
                const leftPercent = ((sec.startAt - windowStart) / windowDurationMs) * 100;
                const widthPercent = (sec.durationMs / windowDurationMs) * 100;
                const act = actMap.get(sec.activityId);

                return (
                  <div
                    key={sec.segmentId}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(1, widthPercent)}%`,
                    }}
                    className="absolute top-0 bottom-0 bg-blue-500/40 border border-blue-400/60 rounded px-1 flex items-center overflow-hidden cursor-pointer hover:bg-blue-500/60 transition-colors"
                    title={`Secondary: ${act?.name || 'Activity'} (${Math.round(sec.durationMs / 60000)}m)`}
                  >
                    <span className="text-[9px] font-medium text-blue-200 truncate">
                      {act?.name || 'Secondary'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
