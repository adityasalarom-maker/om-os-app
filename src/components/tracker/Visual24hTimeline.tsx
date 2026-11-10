import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Sparkles, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  ChevronRight, 
  LayoutGrid, 
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
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
  const [viewStyle, setViewStyle] = useState<'matrix' | 'macro'>('matrix');

  const windowDurationMs = windowEnd - windowStart;
  const actMap = new Map(activities.map((a) => [a.id, a]));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Current time marker position
  const now = Date.now();
  const isToday = now >= windowStart && now <= windowEnd;
  const nowPercent = isToday ? ((now - windowStart) / windowDurationMs) * 100 : null;

  // 24 hour tick marks
  const hourTicks = Array.from({ length: 13 }, (_, i) => i * 2);

  const getCategoryColor = (activityId: string) => {
    const act = actMap.get(activityId);
    if (!act) return '#64748b';
    const cat = catMap.get(act.categoryId || '');
    return cat?.color || '#6366f1';
  };

  const getCategoryName = (activityId: string) => {
    const act = actMap.get(activityId);
    if (!act) return '';
    const cat = catMap.get(act.categoryId || '');
    return cat?.name || '';
  };

  // Sort segments chronologically
  const sortedSegments = [...primarySegments].sort((a, b) => a.startAt - b.startAt);

  // Group segments and gaps into 4 Diurnal Quarters for Schedule Matrix View
  // Dawn & Morning: 06:00 - 12:00
  // Afternoon: 12:00 - 18:00
  // Evening: 18:00 - 22:00
  // Night & Sleep: 22:00 - 06:00
  const baseDate = new Date(windowStart);
  const getTimestampForHour = (hour: number, isNextDay = false) => {
    const d = new Date(baseDate);
    if (isNextDay) d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  };

  const quarters = [
    {
      id: 'morning',
      label: 'Dawn & Morning',
      sanskrit: 'Uṣas & Prātah',
      timeRange: '06:00 – 12:00',
      startMs: getTimestampForHour(6),
      endMs: getTimestampForHour(12),
      icon: Sunrise,
      iconColor: 'text-amber-500',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    },
    {
      id: 'afternoon',
      label: 'Afternoon Focus',
      sanskrit: 'Madhyāhna',
      timeRange: '12:00 – 18:00',
      startMs: getTimestampForHour(12),
      endMs: getTimestampForHour(18),
      icon: Sun,
      iconColor: 'text-orange-500',
      badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    },
    {
      id: 'evening',
      label: 'Evening & Reflection',
      sanskrit: 'Sāyāhna & Sandhyā',
      timeRange: '18:00 – 22:00',
      startMs: getTimestampForHour(18),
      endMs: getTimestampForHour(22),
      icon: Sunset,
      iconColor: 'text-purple-500',
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    },
    {
      id: 'night',
      label: 'Night & Rest',
      sanskrit: 'Rātri & Nidrā',
      timeRange: '22:00 – 06:00',
      startMs: getTimestampForHour(22),
      endMs: getTimestampForHour(6, true),
      icon: Moon,
      iconColor: 'text-indigo-400',
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
  ];

  return (
    <div 
      data-ag-id="DailyTracker_Timeline_24hCanvas" 
      className="border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {/* Header with Title, Mode Switcher, and Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          <h3 className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-main)' }}>
            24-Hour Horizon Schedule
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            {primarySegments.length} Segments • {untrackedGaps.length} Gaps
          </span>
        </div>

        {/* View Toggle: Schedule Matrix (Default, spacious) vs Macro Horizon Bar */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex rounded-xl p-1 text-xs border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setViewStyle('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
                viewStyle === 'matrix' ? 'shadow-sm font-bold' : 'hover:opacity-80'
              }`}
              style={viewStyle === 'matrix' ? { backgroundColor: 'var(--accent)', color: '#ffffff' } : { color: 'var(--text-muted)' }}
              title="Spacious diurnal quarters with full readable text and details"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Schedule Matrix</span>
            </button>
            <button
              onClick={() => setViewStyle('macro')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
                viewStyle === 'macro' ? 'shadow-sm font-bold' : 'hover:opacity-80'
              }`}
              style={viewStyle === 'macro' ? { backgroundColor: 'var(--accent)', color: '#ffffff' } : { color: 'var(--text-muted)' }}
              title="Continuous 24-hour horizontal track"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Macro Bar</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: SCHEDULE MATRIX VIEW (Diurnal Quarters with 100% Readable Cards) */}
      {viewStyle === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          {quarters.map((q) => {
            const QIcon = q.icon;
            // Filter segments that overlap this quarter
            const qSegments = sortedSegments.filter(
              (s) => (s.startAt >= q.startMs && s.startAt < q.endMs) || (s.endAt && s.endAt > q.startMs && s.endAt <= q.endMs)
            );
            // Filter gaps in this quarter
            const qGaps = untrackedGaps.filter(
              (g) => (g.startAt >= q.startMs && g.startAt < q.endMs) || (g.endAt > q.startMs && g.endAt <= q.endMs)
            );

            return (
              <div
                key={q.id}
                className="rounded-2xl border p-4 space-y-3 transition-colors shadow-xs flex flex-col justify-between"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                {/* Quarter Header */}
                <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg border shadow-xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                      <QIcon className={`w-4 h-4 ${q.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                        {q.label}
                      </h4>
                      <span className="text-[10px] italic font-sans" style={{ color: 'var(--text-muted)' }}>
                        {q.sanskrit}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${q.badgeColor}`}>
                    {q.timeRange}
                  </span>
                </div>

                {/* Quarter Activities List */}
                <div className="space-y-2 flex-1">
                  {qSegments.map((seg) => {
                    const act = actMap.get(seg.activityId);
                    const catName = getCategoryName(seg.activityId);
                    const color = getCategoryColor(seg.activityId);
                    const isRunning = seg.isRunning || seg.endAt == null;
                    const startTimeStr = new Date(seg.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endTimeStr = isRunning ? 'Running' : new Date(seg.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const durationMins = Math.max(1, Math.round(seg.durationMs / 60000));
                    const hours = Math.floor(durationMins / 60);
                    const mins = durationMins % 60;
                    const durStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                    return (
                      <div
                        key={seg.segmentId}
                        onClick={() => onSelectSegment(seg)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:opacity-95 shadow-xs ${
                          isRunning ? 'ring-1 ring-emerald-500/40 border-emerald-500/50 bg-emerald-500/10' : ''
                        }`}
                        style={!isRunning ? { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' } : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-2.5 h-7 rounded-full shrink-0" style={{ backgroundColor: isRunning ? '#10b981' : color }} />
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                              {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                              <span>{act?.name || 'Activity'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              <span className="font-mono">{startTimeStr} – {endTimeStr}</span>
                              {catName && <span>• {catName}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span 
                            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                          >
                            {durStr}
                          </span>
                          <span 
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded border hidden sm:inline"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                          >
                            {seg.confidenceLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Untracked Gaps in Quarter */}
                  {qGaps.map((gap, gIdx) => {
                    const mins = Math.round(gap.durationMs / 60000);
                    const hours = Math.floor(mins / 60);
                    const remMins = mins % 60;
                    const gapStr = hours > 0 ? `${hours}h ${remMins}m` : `${remMins}m`;

                    return (
                      <button
                        key={`gap_${q.id}_${gIdx}`}
                        onClick={() => onSelectGap(gap)}
                        className="w-full p-2 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 flex items-center justify-between text-xs transition-colors cursor-pointer text-amber-600 dark:text-amber-400"
                        title="Click to reconstruct missed activity in this gap"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>+{gapStr} Untracked Gap</span>
                        </div>
                        <span className="text-[10px] font-semibold underline">
                          + Fill Gap
                        </span>
                      </button>
                    );
                  })}

                  {qSegments.length === 0 && qGaps.length === 0 && (
                    <div className="py-4 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      No activity recorded in this quarter.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: CONTINUOUS 24-HOUR MACRO HORIZON BAR */}
      {viewStyle === 'macro' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] border-b pb-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span>Exact Live/Retro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-dashed border-amber-300" />
              <span>Estimated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm border border-dashed" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
              <span>Untracked Gap</span>
            </div>
          </div>

          <div className="relative pt-6 pb-2">
            {/* Hour Tick Markers */}
            <div className="absolute top-0 left-0 right-0 flex justify-between text-[10px] font-mono select-none px-1" style={{ color: 'var(--text-muted)' }}>
              {hourTicks.map((h) => (
                <span key={h} className="transform -translate-x-1/2">
                  {h.toString().padStart(2, '0')}:00
                </span>
              ))}
            </div>

            {/* Diurnal Ambient Track (h-20 = 80px) */}
            <div 
              className="relative h-20 rounded-xl overflow-hidden border shadow-inner flex"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              {/* Subtle 2-Hour Vertical Gridlines */}
              {hourTicks.map((h) => {
                const leftPct = (h / 24) * 100;
                return (
                  <div
                    key={`grid_${h}`}
                    style={{ left: `${leftPct}%`, borderColor: 'var(--border-color)' }}
                    className="absolute top-0 bottom-0 w-px border-r border-dashed opacity-25 pointer-events-none"
                  />
                );
              })}

              {/* Primary Segments */}
              {primarySegments.map((seg) => {
                const leftPercent = ((seg.startAt - windowStart) / windowDurationMs) * 100;
                const widthPercent = (seg.durationMs / windowDurationMs) * 100;
                const color = getCategoryColor(seg.activityId);
                const act = actMap.get(seg.activityId);
                const isRunning = seg.isRunning || (seg.endAt == null);
                const isEstimated = !isRunning && seg.confidenceLabel === 'Estimated';
                const startTimeStr = new Date(seg.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = isRunning ? 'Now' : new Date(seg.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durationMins = Math.max(1, Math.round(seg.durationMs / 60000));
                const hours = Math.floor(durationMins / 60);
                const mins = durationMins % 60;
                const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                return (
                  <div
                    key={seg.segmentId}
                    onClick={() => onSelectSegment(seg)}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(0.9, widthPercent)}%`,
                      backgroundColor: isRunning ? '#059669' : color,
                    }}
                    className={`absolute top-0 bottom-0 cursor-pointer transition-all hover:brightness-110 hover:z-20 flex flex-col justify-between p-1.5 overflow-hidden group shadow-sm ${
                      isRunning
                        ? 'border-2 border-emerald-400 z-10'
                        : isEstimated
                        ? 'border-2 border-dashed border-white/60'
                        : 'border-r border-black/15'
                    }`}
                    title={`${act?.name || 'Activity'}: ${startTimeStr} - ${endTimeStr} (${durationStr}) [${isRunning ? 'Live Now' : seg.confidenceLabel}]`}
                  >
                    {widthPercent >= 3.5 ? (
                      <>
                        <div className="flex items-center gap-1 min-w-0">
                          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 shrink-0 animate-ping" />}
                          <span className="text-[11px] font-bold text-white truncate drop-shadow-sm leading-tight">
                            {act?.name || 'Activity'}
                          </span>
                        </div>
                        <div className="text-[9px] text-white/95 font-mono truncate leading-none font-semibold">
                          {durationStr}
                        </div>
                      </>
                    ) : widthPercent >= 1.5 ? (
                      <div className="text-[9px] text-white/90 font-bold truncate">
                        {act?.name?.charAt(0) || '•'}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {/* Interactive Untracked Gaps */}
              {untrackedGaps.map((gap, idx) => {
                const leftPercent = ((gap.startAt - windowStart) / windowDurationMs) * 100;
                const widthPercent = (gap.durationMs / windowDurationMs) * 100;
                const mins = Math.round(gap.durationMs / 60000);
                const hours = Math.floor(mins / 60);
                const remMins = mins % 60;
                const gapStr = hours > 0 ? `${hours}h ${remMins}m` : `${remMins}m`;

                return (
                  <div
                    key={`gap_${idx}`}
                    onClick={() => onSelectGap(gap)}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      borderColor: 'var(--border-color)',
                    }}
                    className="absolute top-0 bottom-0 hover:bg-indigo-500/10 cursor-pointer flex items-center justify-center group transition-colors border-r"
                    title={`Untracked Gap: ${gapStr} (Click to reconstruct)`}
                  >
                    {widthPercent > 5 && (
                      <span className="text-[10px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded-md border shadow-xs transition-colors"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                      >
                        <Plus className="w-2.5 h-2.5 text-amber-500" />
                        <span>+{gapStr} gap</span>
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
                  <div className="w-2.5 h-2.5 -ml-[4px] -top-1 bg-rose-500 rounded-full" />
                </div>
              )}
            </div>

            {/* Secondary Activities Under-Rail */}
            {secondarySegments.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Secondary Concurrent Overlays (Zero Primary Inflation)
                </span>
                <div 
                  className="relative h-6 rounded-lg overflow-hidden border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
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
                        className="absolute top-0 bottom-0 bg-blue-500/30 border border-blue-400/50 rounded px-1.5 flex items-center overflow-hidden cursor-pointer hover:bg-blue-500/50 transition-colors"
                        title={`Secondary: ${act?.name || 'Activity'} (${Math.round(sec.durationMs / 60000)}m)`}
                      >
                        <span className="text-[9px] font-medium text-blue-500 dark:text-blue-200 truncate">
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
      )}
    </div>
  );
}
