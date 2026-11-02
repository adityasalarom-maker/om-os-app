import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  History,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { QuickCaptureBar } from './QuickCaptureBar';
import { ActiveTimerModal } from './ActiveTimerModal';
import { RetrospectiveEditorModal } from './RetrospectiveEditorModal';
import { db, initializeDailyTrackerIfEmpty } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  projectDayTimeline,
  evaluatePrimaryStartConflict,
  closePrimaryTimerWithConfirmation,
  recordWakeClosesSleep,
  type ActivityDefinition,
  type ActivityOccurrence,
  type TimeSegment,
  type BoundaryConfidence,
} from '../../services/dailyTrackerEngine';

// Default starter activities catalog fallback
const STARTER_ACTIVITIES: ActivityDefinition[] = [
  { id: 'act_wake', name: 'Wake Up', defaultMode: 'EVENT', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_washroom', name: 'Washroom & Hygiene', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_bath', name: 'Bath', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_exercise', name: 'Exercise & Yoga', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_meditation', name: 'Meditation', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_breakfast', name: 'Breakfast', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_study', name: 'Deep Study / Work', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_music', name: 'Music / Audio', defaultMode: 'INTERVAL', defaultRole: 'SECONDARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_medicine', name: 'Medicine', defaultMode: 'EVENT', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_sleep', name: 'Night Sleep', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
];

export function DailyTrackerView() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewType, setViewType] = useState<'CALENDAR_DAY' | 'WAKE_CYCLE'>('CALENDAR_DAY');

  // Ensure starter activities are seeded into Dexie
  useEffect(() => {
    initializeDailyTrackerIfEmpty();
  }, []);

  // Live Queries from Dexie v13 Database
  const dbActivities = useLiveQuery(() => db.activities.toArray(), []);
  const dbOccurrences = useLiveQuery(() => db.activityOccurrences.toArray(), []);
  const dbSegments = useLiveQuery(() => db.timeSegments.toArray(), []);

  const activities = (dbActivities && dbActivities.length > 0) ? dbActivities : STARTER_ACTIVITIES;
  const occurrences = dbOccurrences || [];
  const segments = dbSegments || [];

  // Active running timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Modals state
  const [isRetrospectiveOpen, setIsRetrospectiveOpen] = useState(false);
  const [conflictPrompt, setConflictPrompt] = useState<{
    isOpen: boolean;
    pendingActivity: ActivityDefinition | null;
  }>({
    isOpen: false,
    pendingActivity: null,
  });

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Primary timer from database
  const activeSegment = segments.find((s) => s.role === 'PRIMARY' && s.endAt === undefined && !s.isPaused) || null;
  const activeOccurrence = activeSegment ? occurrences.find((o) => o.id === activeSegment.occurrenceId) : null;
  const activeActivity = activeOccurrence ? activities.find((a) => a.id === activeOccurrence.activityId) : null;

  // Running elapsed timer tick
  useEffect(() => {
    if (!activeSegment) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - activeSegment.startAt) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSegment]);

  // Window bounds calculation
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(24, 0, 0, 0);

  const projection = projectDayTimeline({
    windowStart: startOfDay.getTime(),
    windowEnd: endOfDay.getTime(),
    windowType: viewType,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    occurrences,
    segments,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle tap on Quick Action button
  const handleTapActivity = async (act: ActivityDefinition) => {
    const now = Date.now();

    // 1. If instant event:
    if (act.defaultMode === 'EVENT') {
      // Special rule: Wake closes Sleep if sleep is running
      const runningSleepSeg = segments.find(
        (s) => s.endAt === undefined && occurrences.find((o) => o.id === s.occurrenceId)?.activityId === 'act_sleep'
      );

      if (act.id === 'act_wake' && runningSleepSeg) {
        const res = recordWakeClosesSleep({
          activeSleepSegment: runningSleepSeg,
          wakeActivityId: act.id,
          wakeTime: now,
          recordingTime: now,
          mode: 'WAKE_NOW',
          confidence: 'EXACT',
          timeZone: 'Asia/Kolkata',
          utcOffsetMinutes: 330,
        });

        await db.timeSegments.update(runningSleepSeg.id, {
          endAt: res.closedSleepSegment.endAt,
          endConfidence: res.closedSleepSegment.endConfidence,
        });
        await db.activityOccurrences.add(res.wakeOccurrence);
        setElapsedSeconds(0);
        showToast('Wake recorded! Night sleep timer closed.');
        return;
      }

      // Normal instant event
      const newOcc: ActivityOccurrence = {
        id: `occ_evt_${now}`,
        activityId: act.id,
        kind: 'EVENT',
        source: 'LIVE',
        status: 'STOPPED',
        occurredAt: now,
        recordedAt: now,
        updatedAt: now,
        timeZone: 'Asia/Kolkata',
        utcOffsetMinutes: 330,
      };

      await db.activityOccurrences.add(newOcc);
      showToast(`${act.name} recorded!`);
      return;
    }

    // 2. If Interval: check for Primary conflict if active timer is running
    const conflictCheck = evaluatePrimaryStartConflict(segments, now);

    if (conflictCheck.hasConflict && act.defaultRole === 'PRIMARY') {
      setConflictPrompt({
        isOpen: true,
        pendingActivity: act,
      });
      return;
    }

    // Start interval cleanly
    await startInterval(act, act.defaultRole, now, 'EXACT');
  };

  const startInterval = async (
    act: ActivityDefinition,
    role: 'PRIMARY' | 'SECONDARY',
    startTime: number,
    confidence: BoundaryConfidence
  ) => {
    const now = Date.now();
    const newOccId = `occ_int_${now}`;
    const newSegId = `seg_int_${now}`;

    const newOcc: ActivityOccurrence = {
      id: newOccId,
      activityId: act.id,
      kind: 'INTERVAL',
      source: 'LIVE',
      status: 'RUNNING',
      recordedAt: now,
      updatedAt: now,
      timeZone: 'Asia/Kolkata',
      utcOffsetMinutes: 330,
    };

    const newSeg: TimeSegment = {
      id: newSegId,
      occurrenceId: newOccId,
      startAt: startTime,
      endAt: undefined, // running
      role,
      startConfidence: confidence,
      endConfidence: 'UNKNOWN',
    };

    await db.transaction('rw', [db.activityOccurrences, db.timeSegments], async () => {
      await db.activityOccurrences.add(newOcc);
      await db.timeSegments.add(newSeg);
    });

    if (role === 'PRIMARY') {
      setElapsedSeconds(0);
    }
    showToast(`Started ${act.name}`);
  };

  const handleStopActiveTimer = async () => {
    if (!activeSegment) return;
    const now = Date.now();
    await db.timeSegments.update(activeSegment.id, {
      endAt: now,
      endConfidence: 'EXACT',
    });
    setElapsedSeconds(0);
    showToast(`Stopped ${activeActivity?.name || 'timer'}`);
  };

  // Recent 3 completed entries (excluding running timer, matching Android widget contract)
  const recentEntries = occurrences
    .filter((o) => o.status === 'STOPPED' || (o.kind === 'EVENT'))
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .slice(0, 3);

  const formatDurationMs = (ms: number) => {
    const mins = Math.round(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-400 text-xs font-medium animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Day Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Personal Daily Life Tracker</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Dexie v13 Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Local-first chronological 24h ledger • Honest untracked time • Multi-mode capture
          </p>
        </div>

        {/* Date Selector & View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-medium text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex bg-slate-950/70 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewType('CALENDAR_DAY')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                viewType === 'CALENDAR_DAY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Calendar Day (24h)
            </button>
            <button
              onClick={() => setViewType('WAKE_CYCLE')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                viewType === 'WAKE_CYCLE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wake Cycle
            </button>
          </div>
        </div>
      </div>

      {/* Quality Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Exact Primary</div>
          <div className="text-lg font-mono font-bold text-slate-100">
            {formatDurationMs(projection.exactPrimaryDurationMs)}
          </div>
          <div className="text-[10px] text-slate-400">Contemporaneously verified</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Estimated Primary</div>
          <div className="text-lg font-mono font-bold text-slate-100">
            {formatDurationMs(projection.estimatedPrimaryDurationMs)}
          </div>
          <div className="text-[10px] text-slate-400">Retrospective / Approx</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Secondary Overlays</div>
          <div className="text-lg font-mono font-bold text-slate-100">
            {formatDurationMs(projection.secondaryDurationMs)}
          </div>
          <div className="text-[10px] text-slate-400">Zero primary inflation</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Untracked Time</div>
          <div className="text-lg font-mono font-bold text-slate-300">
            {formatDurationMs(projection.untrackedDurationMs)}
          </div>
          <div className="text-[10px] text-slate-400">Honest unrecorded gaps</div>
        </div>
      </div>

      {/* Quick Action Capture Bar */}
      <QuickCaptureBar
        quickActivities={activities}
        activeSegment={activeSegment}
        activeActivityName={activeActivity?.name || null}
        elapsedSeconds={elapsedSeconds}
        onTapActivity={handleTapActivity}
        onStopActiveTimer={handleStopActiveTimer}
        onOpenRetrospective={() => setIsRetrospectiveOpen(true)}
      />

      {/* Main Timeline View */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Chronological 24-Hour Timeline</h3>
          </div>
          <span className="text-xs text-slate-400">Resolution: Half-open [start, end) intervals</span>
        </div>

        {/* Timeline Blocks */}
        <div className="space-y-2">
          {projection.primarySegments.map((seg) => {
            const act = activities.find((a) => a.id === seg.activityId);
            const startTimeStr = new Date(seg.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = new Date(seg.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={seg.segmentId}
                className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span>{act?.name || 'Activity'}</span>
                      {seg.isCrossMidnight && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Cross-Midnight
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {startTimeStr} – {endTimeStr}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium text-slate-200">
                    {formatDurationMs(seg.durationMs)}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                      seg.confidenceLabel === 'Exact — Live'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : seg.confidenceLabel === 'Exact — Retrospective'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {seg.confidenceLabel}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Render Untracked Gaps with Clickable Reconstruct Button */}
          {projection.untrackedGaps.map((gap, idx) => (
            <div
              key={`gap_${idx}`}
              className="flex items-center justify-between p-3 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl text-slate-400"
            >
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Untracked Gap ({new Date(gap.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {new Date(gap.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
                <span className="font-mono text-slate-400">({formatDurationMs(gap.durationMs)})</span>
              </div>
              <button
                onClick={() => setIsRetrospectiveOpen(true)}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <span>Reconstruct</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Android Widget Contract Reference: 3 Recent Saved Entries */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Recent Saved Entries (3 Slots — Android Widget Contract)</span>
          </span>
          <span className="text-slate-400 font-normal">Active timer does not displace these slots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentEntries.map((rec) => {
            const act = activities.find((a) => a.id === rec.activityId);
            return (
              <div
                key={rec.id}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-medium text-slate-200">{act?.name || 'Activity'}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(rec.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {rec.kind}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Timer Confirmation Modal */}
      {conflictPrompt.isOpen && conflictPrompt.pendingActivity && (
        <ActiveTimerModal
          isOpen={conflictPrompt.isOpen}
          activeSegment={activeSegment}
          activeActivityName={activeActivity?.name || 'Running Activity'}
          newActivityName={conflictPrompt.pendingActivity.name}
          onClose={() => setConflictPrompt({ isOpen: false, pendingActivity: null })}
          onConfirmClosure={async (closureType, actualEndTimeMs, confidence) => {
            if (!activeSegment || !conflictPrompt.pendingActivity) return;
            const now = Date.now();
            const closureRes = closePrimaryTimerWithConfirmation({
              activeSegment,
              closureType,
              closureTime: actualEndTimeMs || now,
              confidence: confidence || 'EXACT',
              newActivityStartTime: now,
            });

            // Update closed segment in database
            await db.timeSegments.update(activeSegment.id, {
              endAt: closureRes.closedSegment.endAt,
              endConfidence: closureRes.closedSegment.endConfidence,
            });

            // Start the new pending activity
            await startInterval(conflictPrompt.pendingActivity, 'PRIMARY', now, 'EXACT');
          }}
          onLogAsSecondary={async () => {
            if (!conflictPrompt.pendingActivity) return;
            await startInterval(conflictPrompt.pendingActivity, 'SECONDARY', Date.now(), 'EXACT');
          }}
        />
      )}

      {/* Retrospective Batch Editor Modal */}
      {isRetrospectiveOpen && (
        <RetrospectiveEditorModal
          isOpen={isRetrospectiveOpen}
          availableActivities={activities.map((a) => ({ id: a.id, name: a.name }))}
          onClose={() => setIsRetrospectiveOpen(false)}
          onSaveBatch={async (res) => {
            await db.transaction('rw', [db.reconstructionBatches, db.activityOccurrences, db.timeSegments], async () => {
              await db.reconstructionBatches.add(res.batch);
              await db.activityOccurrences.bulkAdd(res.occurrences);
              await db.timeSegments.bulkAdd(res.segments);
            });
            showToast('Reconstructed batch successfully saved to Dexie!');
          }}
        />
      )}
    </div>
  );
}
