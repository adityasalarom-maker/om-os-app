import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  History,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Layers,
  TrendingUp,
  ShieldAlert,
  FolderPlus,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Sprout,
  Check,
} from 'lucide-react';
import { ActiveTimerModal } from './ActiveTimerModal';
import { RetrospectiveEditorModal } from './RetrospectiveEditorModal';
import { Visual24hTimeline } from './Visual24hTimeline';
import { DailyIntelligenceSummary } from './DailyIntelligenceSummary';
import { ActivityDetailModal } from './ActivityDetailModal';
import { ActivityCatalogModal } from './ActivityCatalogModal';
import { GapReviewWizardModal } from './GapReviewWizardModal';
import { FailureRecoveryModal } from './FailureRecoveryModal';
import { db, initializeDailyTrackerIfEmpty } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  projectDayTimeline,
  evaluatePrimaryStartConflict,
  closePrimaryTimerWithConfirmation,
  recordWakeClosesSleep,
  STARTER_CATEGORIES,
  type ActivityCategory,
  type ActivityDefinition,
  type ActivityOccurrence,
  type TimeSegment,
  type BoundaryConfidence,
  type ProjectedSegment,
  type TimelineGap,
} from '../../services/dailyTrackerEngine';

// Default starter activities catalog fallback
const STARTER_ACTIVITIES: ActivityDefinition[] = [
  { id: 'act_wake', name: 'Wake Up', categoryId: 'cat_sleep', defaultMode: 'EVENT', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_washroom', name: 'Washroom & Hygiene', categoryId: 'cat_care', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_bath', name: 'Bath', categoryId: 'cat_care', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_exercise', name: 'Exercise & Yoga', categoryId: 'cat_physical', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_meditation', name: 'Meditation', categoryId: 'cat_mental', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_breakfast', name: 'Breakfast', categoryId: 'cat_food', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_study', name: 'Architecture & Coding', categoryId: 'cat_work', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_music', name: 'Music / Audio', categoryId: 'cat_entertainment', defaultMode: 'INTERVAL', defaultRole: 'SECONDARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_medicine', name: 'Medicine', categoryId: 'cat_care', defaultMode: 'EVENT', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_sleep', name: 'Night Sleep', categoryId: 'cat_sleep', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_calls', name: 'Calls & Catchup', categoryId: 'cat_social', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_commute', name: 'Commute / Travel', categoryId: 'cat_travel', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_room', name: 'Room Organizing', categoryId: 'cat_home', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_dinner', name: 'Dinner', categoryId: 'cat_food', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_errands', name: 'Household Errands', categoryId: 'cat_home', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
];

export function DailyTrackerView() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewType, setViewType] = useState<'CALENDAR_DAY' | 'WAKE_CYCLE'>('CALENDAR_DAY');
  const [activeSubTab, setActiveSubTab] = useState<'TIMELINE' | 'INTELLIGENCE'>('TIMELINE');

  // Mini Calendar Popover state
  const [isMiniCalendarOpen, setIsMiniCalendarOpen] = useState(false);

  // Category Drawer state
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [selectedDrawerCatId, setSelectedDrawerCatId] = useState<string>('ALL');
  const [drawerSearch, setDrawerSearch] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // Dexie live queries
  const dexieActivities = useLiveQuery(() => db.activities.toArray(), []);
  const occurrences = useLiveQuery(() => db.activityOccurrences.toArray(), []) || [];
  const segments = useLiveQuery(() => db.timeSegments.toArray(), []) || [];

  const [customCategories, setCustomCategories] = useState<ActivityCategory[]>(() => {
    try {
      const saved = localStorage.getItem('om_tracker_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activities = dexieActivities && dexieActivities.length > 0 ? dexieActivities : STARTER_ACTIVITIES;
  const allCategories: ActivityCategory[] = [...STARTER_CATEGORIES, ...customCategories];

  // Running elapsed timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Modal states
  const [isRetrospectiveOpen, setIsRetrospectiveOpen] = useState(false);
  const [isGapReviewOpen, setIsGapReviewOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [selectedSegmentForEdit, setSelectedSegmentForEdit] = useState<ProjectedSegment | null>(null);

  const [conflictPrompt, setConflictPrompt] = useState<{
    isOpen: boolean;
    pendingActivity: ActivityDefinition | null;
  }>({
    isOpen: false,
    pendingActivity: null,
  });

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize Dexie seed tables if clean
  useEffect(() => {
    initializeDailyTrackerIfEmpty();
  }, []);

  const activeSegment = segments.find((s) => s.endAt === undefined && s.role === 'PRIMARY') || null;
  const activeOccurrence = activeSegment ? occurrences.find((o) => o.id === activeSegment.occurrenceId) : null;
  const activeActivity = activeOccurrence ? activities.find((a) => a.id === activeOccurrence.activityId) : null;

  // Running elapsed timer tick
  useEffect(() => {
    if (!activeSegment) {
      setElapsedSeconds(0);
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

  // Compute dynamic circadian window bounds for Calendar Day vs Wake Cycle
  const { windowStart, windowEnd, wakeWindowLabel } = useMemo(() => {
    if (viewType === 'CALENDAR_DAY') {
      return {
        windowStart: startOfDay.getTime(),
        windowEnd: endOfDay.getTime(),
        wakeWindowLabel: '00:00 – 24:00',
      };
    }
    // WAKE_CYCLE: anchor to day's wake time (or default 06:30 AM) and span 24 hours
    const wakeOcc = occurrences.find(
      (o) =>
        (o.activityId === 'act_wake' || o.activityId.includes('wake')) &&
        o.recordedAt >= startOfDay.getTime() &&
        o.recordedAt <= endOfDay.getTime()
    );
    const wakeStart = wakeOcc
      ? wakeOcc.recordedAt
      : startOfDay.getTime() + 6.5 * 3600 * 1000; // 06:30 AM fallback
    const wakeEnd = wakeStart + 24 * 3600 * 1000;
    const startStr = new Date(wakeStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endStr = new Date(wakeEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      windowStart: wakeStart,
      windowEnd: wakeEnd,
      wakeWindowLabel: `${startStr} – Next Day ${endStr}`,
    };
  }, [viewType, selectedDate, occurrences]);

  const projection = projectDayTimeline({
    windowStart,
    windowEnd,
    windowType: viewType,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    occurrences,
    segments,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatTimerClock = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Seed realistic 3-day demo dataset
  const handleSeed3DayDemo = async () => {
    const now = Date.now();
    const oneDayMs = 86400000;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const t0 = todayMidnight.getTime();

    const sampleBatches = [
      // Day 0: Today
      { dayOffset: 0, name: 'Night Sleep', actId: 'act_sleep', startH: 0, endH: 6.5, conf: 'EXACT' as const },
      { dayOffset: 0, name: 'Wake Up', actId: 'act_wake', isEvent: true, timeH: 6.5, conf: 'EXACT' as const },
      { dayOffset: 0, name: 'Bath', actId: 'act_bath', startH: 6.75, endH: 7.25, conf: 'EXACT' as const },
      { dayOffset: 0, name: 'Breakfast', actId: 'act_breakfast', startH: 7.5, endH: 8.0, conf: 'EXACT' as const },
      { dayOffset: 0, name: 'Deep Work / Coding', actId: 'act_study', startH: 8.5, endH: 12.5, conf: 'EXACT' as const },
      { dayOffset: 0, name: 'Exercise & Yoga', actId: 'act_exercise', startH: 13.0, endH: 14.0, conf: 'EXACT' as const },
      { dayOffset: 0, name: 'Calls & Catchup', actId: 'act_calls', startH: 14.5, endH: 15.5, conf: 'ESTIMATED' as const },

      // Day -1: Yesterday
      { dayOffset: -1, name: 'Night Sleep', actId: 'act_sleep', startH: 0, endH: 6.25, conf: 'EXACT' as const },
      { dayOffset: -1, name: 'Wake Up', actId: 'act_wake', isEvent: true, timeH: 6.25, conf: 'EXACT' as const },
      { dayOffset: -1, name: 'Meditation', actId: 'act_meditation', startH: 6.5, endH: 7.25, conf: 'EXACT' as const },
      { dayOffset: -1, name: 'Breakfast', actId: 'act_breakfast', startH: 7.5, endH: 8.0, conf: 'EXACT' as const },
      { dayOffset: -1, name: 'Deep Work / Coding', actId: 'act_study', startH: 8.5, endH: 13.0, conf: 'EXACT' as const },
      { dayOffset: -1, name: 'Commute / Travel', actId: 'act_commute', startH: 13.25, endH: 14.0, conf: 'EXACT' as const },
      { dayOffset: -1, name: 'Dinner', actId: 'act_dinner', startH: 19.5, endH: 20.25, conf: 'EXACT' as const },

      // Day -2: 2 Days Ago
      { dayOffset: -2, name: 'Night Sleep', actId: 'act_sleep', startH: 0, endH: 6.5, conf: 'EXACT' as const },
      { dayOffset: -2, name: 'Wake Up', actId: 'act_wake', isEvent: true, timeH: 6.5, conf: 'EXACT' as const },
      { dayOffset: -2, name: 'Exercise & Yoga', actId: 'act_exercise', startH: 7.0, endH: 8.0, conf: 'EXACT' as const },
      { dayOffset: -2, name: 'Breakfast', actId: 'act_breakfast', startH: 8.25, endH: 8.75, conf: 'EXACT' as const },
      { dayOffset: -2, name: 'Deep Work / Coding', actId: 'act_study', startH: 9.0, endH: 13.5, conf: 'EXACT' as const },
      { dayOffset: -2, name: 'Room Organizing', actId: 'act_room', startH: 15.0, endH: 16.0, conf: 'ESTIMATED' as const },
    ];

    const newOccs: ActivityOccurrence[] = [];
    const newSegs: TimeSegment[] = [];

    sampleBatches.forEach((b, idx) => {
      const baseDay = t0 + b.dayOffset * oneDayMs;
      const occId = `occ_demo_${idx}_${now}`;
      const segId = `seg_demo_${idx}_${now}`;

      if (b.isEvent) {
        newOccs.push({
          id: occId,
          activityId: b.actId,
          kind: 'EVENT',
          source: 'LIVE',
          status: 'STOPPED',
          occurredAt: baseDay + (b.timeH || 6.5) * 3600000,
          recordedAt: baseDay + (b.timeH || 6.5) * 3600000,
          updatedAt: baseDay + (b.timeH || 6.5) * 3600000,
          timeZone: 'Asia/Kolkata',
          utcOffsetMinutes: 330,
        });
      } else {
        const startAt = baseDay + (b.startH || 0) * 3600000;
        const endAt = baseDay + (b.endH || 1) * 3600000;
        newOccs.push({
          id: occId,
          activityId: b.actId,
          kind: 'INTERVAL',
          source: 'LIVE',
          status: 'STOPPED',
          recordedAt: startAt,
          updatedAt: endAt,
          timeZone: 'Asia/Kolkata',
          utcOffsetMinutes: 330,
        });
        newSegs.push({
          id: segId,
          occurrenceId: occId,
          startAt,
          endAt,
          role: 'PRIMARY',
          startConfidence: b.conf,
          endConfidence: b.conf,
        });
      }
    });

    await db.transaction('rw', [db.activityOccurrences, db.timeSegments], async () => {
      await db.activityOccurrences.bulkPut(newOccs);
      await db.timeSegments.bulkPut(newSegs);
    });

    showToast('🌱 Seeded 3-day realistic demo timeline into Dexie!');
  };

  // Handle tap on Quick Action button
  const handleTapActivity = async (act: ActivityDefinition) => {
    const now = Date.now();

    // 1. If instant event:
    if (act.defaultMode === 'EVENT') {
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

        await db.transaction('rw', [db.timeSegments, db.activityOccurrences], async () => {
          await db.timeSegments.update(runningSleepSeg.id, {
            endAt: res.closedSleepSegment.endAt,
            endConfidence: res.closedSleepSegment.endConfidence,
          });
          await db.activityOccurrences.add(res.wakeOccurrence);
        });

        showToast('Wake recorded! Night sleep timer closed.');
        return;
      }

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
    await db.transaction('rw', [db.timeSegments, db.activityOccurrences], async () => {
      await db.timeSegments.update(activeSegment.id, {
        endAt: now,
        endConfidence: 'EXACT',
      });
      if (activeOccurrence) {
        await db.activityOccurrences.update(activeOccurrence.id, {
          status: 'STOPPED',
          updatedAt: now,
        });
      }
    });
    setElapsedSeconds(0);
    showToast(`Stopped ${activeActivity?.name || 'timer'}`);
  };

  const handleCreateNewCategory = async () => {
    if (!newCatName.trim()) return;
    const now = Date.now();
    const newCat: ActivityCategory = {
      id: `cat_custom_${now}`,
      name: newCatName.trim(),
      color: newCatColor,
      icon: 'Folder',
      description: 'Custom user category',
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    try {
      localStorage.setItem('om_tracker_custom_categories', JSON.stringify(updated));
    } catch {}
    setNewCatName('');
    setIsAddingNewCat(false);
    showToast(`Category "${newCat.name}" created!`);
  };

  const formatDurationMs = (ms: number) => {
    const mins = Math.round(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  // Recent 3 completed or active entries (matches Android widget contract)
  const recentEntries = occurrences
    .filter((o) => o.status === 'STOPPED' || o.kind === 'EVENT' || (activeOccurrence && o.id === activeOccurrence.id))
    .sort((a, b) => (b.updatedAt || b.recordedAt) - (a.updatedAt || a.recordedAt))
    .slice(0, 3);

  const selectedOccurrenceForEdit = selectedSegmentForEdit
    ? occurrences.find((o) => o.id === selectedSegmentForEdit.occurrenceId) || null
    : null;

  const selectedActivityForEdit = selectedSegmentForEdit
    ? activities.find((a) => a.id === selectedSegmentForEdit.activityId) || null
    : null;

  return (
    <div data-ag-id="DailyTracker_Root_Workspace" className="space-y-5 animate-in fade-in duration-300 pb-20">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-400 text-xs font-medium animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header: Clean Date Selector + View Mode Switcher (Redundant title & TASK-20 tags removed per user request) */}
      <div 
        data-ag-id="DailyTracker_Header_DateNavigator" 
        className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border transition-colors shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Date Selector & Mini Calendar Trigger */}
        <div className="relative flex items-center rounded-xl p-1 text-xs border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMiniCalendarOpen(!isMiniCalendarOpen)}
            className="px-3 py-1 font-medium flex items-center gap-2 cursor-pointer hover:opacity-90 rounded-md transition-colors"
            style={{ color: 'var(--text-main)' }}
            title="Click to open mini calendar quick-picker"
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">{selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Collapsible Mini Calendar Dropdown */}
          {isMiniCalendarOpen && (
            <div 
              className="absolute top-full mt-2 left-0 z-50 p-3.5 rounded-2xl border shadow-2xl space-y-3 min-w-[260px] animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold border-b pb-2" style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>
                <span>Quick Date Jump</span>
                <button 
                  onClick={() => setIsMiniCalendarOpen(false)} 
                  className="w-5 h-5 flex items-center justify-center rounded-md border text-xs cursor-pointer" 
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { setSelectedDate(new Date()); setIsMiniCalendarOpen(false); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold text-center border transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                >
                  Today
                </button>
                <button
                  onClick={() => { setSelectedDate(new Date(Date.now() - 86400000)); setIsMiniCalendarOpen(false); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-center border transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => { setSelectedDate(new Date(Date.now() - 86400000 * 2)); setIsMiniCalendarOpen(false); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-center border transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  2 Days Ago
                </button>
                <button
                  onClick={() => { setSelectedDate(new Date(Date.now() - 86400000 * 3)); setIsMiniCalendarOpen(false); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-center border transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  3 Days Ago
                </button>
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <label className="text-[10px] uppercase font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>Custom Date</label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setSelectedDate(new Date(y, m - 1, d, 12, 0, 0));
                      setIsMiniCalendarOpen(false);
                    }
                  }}
                  className="w-full text-xs p-1.5 rounded-lg border font-mono"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle: Calendar Day (24h) vs Wake Cycle */}
        <div className="flex rounded-xl p-1 text-xs border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setViewType('CALENDAR_DAY')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              viewType === 'CALENDAR_DAY' 
                ? 'font-bold shadow-sm' 
                : 'hover:opacity-80'
            }`}
            style={viewType === 'CALENDAR_DAY' ? { backgroundColor: 'var(--accent)', color: '#ffffff' } : { color: 'var(--text-muted)' }}
          >
            Calendar Day (24h)
          </button>
          <button
            onClick={() => setViewType('WAKE_CYCLE')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1.5 ${
              viewType === 'WAKE_CYCLE' 
                ? 'font-bold shadow-sm' 
                : 'hover:opacity-80'
            }`}
            style={viewType === 'WAKE_CYCLE' ? { backgroundColor: 'var(--accent)', color: '#ffffff' } : { color: 'var(--text-muted)' }}
            title="Circadian 24-hour horizon anchored to wake time"
          >
            <span>Wake Cycle</span>
            {viewType === 'WAKE_CYCLE' && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/25 rounded font-normal">
                {wakeWindowLabel}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* UPPER COCKPIT GRID: Left = Start Activity/Timer & Presets; Right = 2 Parallel Vertical Action Sections (User Comments 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT COLUMN (lg:col-span-7): Start Activity / Timer & 1-Tap Presets & Drawer */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          
          {/* Active Running Timer Hero Card (Solid clean green, no glowing or pinging) */}
          {activeSegment && activeActivity && (
            <div 
              data-ag-id="DailyTracker_HeroCard_ActiveTimer" 
              className="p-3.5 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: '#10b981' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                      Live Timer Running
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Started {new Date(activeSegment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight mt-0.5" style={{ color: 'var(--text-main)' }}>
                    {activeActivity.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono" style={{ color: 'var(--text-muted)' }}>Elapsed</div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatTimerClock(elapsedSeconds)}
                  </div>
                </div>
                <button
                  onClick={handleStopActiveTimer}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop Timer</span>
                </button>
              </div>
            </div>
          )}

          {/* Dedicated Start Button & Unfolding Category Drawer */}
          <div 
            data-ag-id="DailyTracker_Drawer_ActivityCatalog" 
            className="rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 flex-1 flex flex-col justify-between"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            {/* Main Action Bar */}
            <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2.5">
              <button
                onClick={() => setIsCategoryDrawerOpen(!isCategoryDrawerOpen)}
                className="flex-1 min-w-[220px] px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-white shrink-0" />
                  <div className="text-left">
                    <div className="font-bold">
                      {activeSegment && activeActivity ? 'Switch Activity or Add Concurrent' : 'Start Activity or Timer'}
                    </div>
                    {activeSegment && activeActivity && (
                      <div className="text-[10px] text-indigo-200 font-normal">
                        Active: {activeActivity.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-indigo-100">
                  <span>{isCategoryDrawerOpen ? 'Close Menu' : 'Browse Categories'}</span>
                  {isCategoryDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              <button
                onClick={() => setIsRetrospectiveOpen(true)}
                className="px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm hover:opacity-90"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                title="Log activities you did earlier today"
              >
                <History className="w-4 h-4 text-indigo-500" />
                <span>+ Log Missed Past Time</span>
              </button>
            </div>

            {/* Quick 1-Tap Preset Pills Row */}
            <div 
              className="px-3.5 sm:px-4 py-2.5 border-t flex items-center gap-2 overflow-x-auto no-scrollbar"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0" style={{ color: 'var(--text-muted)' }}>
                1-Tap Presets:
              </span>
              {activities.slice(0, 9).map((act) => {
                const isRunning = activeActivity?.id === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleTapActivity(act)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer shrink-0 active:scale-95 ${
                      isRunning
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 font-bold'
                        : 'hover:opacity-80'
                    }`}
                    style={!isRunning ? { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' } : undefined}
                  >
                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    <span>{act.name}</span>
                  </button>
                );
              })}
            </div>

            {/* ANIMATED UNFOLDING CATEGORY DRAWER */}
            {isCategoryDrawerOpen && (
              <div 
                className="border-t p-4 sm:p-5 space-y-3.5 animate-in slide-in-from-top-4 duration-250 ease-out"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              >
                {/* Search Bar & Add Category Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={drawerSearch}
                      onChange={(e) => setDrawerSearch(e.target.value)}
                      placeholder="Search across all categories & activities..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Category</span>
                    </button>
                    <button
                      onClick={() => setIsCatalogOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Manage All ({activities.length})</span>
                    </button>
                  </div>
                </div>

                {/* Inline Create New Category Form */}
                {isAddingNewCat && (
                  <div 
                    className="p-3.5 rounded-xl border space-y-2.5 animate-in fade-in duration-200"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                      <FolderPlus className="w-4 h-4 text-indigo-500" />
                      <span>Create Custom Category</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category name..."
                        className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg text-xs border"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                      />
                      <div className="flex items-center gap-1">
                        {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#8b5cf6'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewCatColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                              newCatColor === c ? 'scale-125 ring-2 ring-indigo-400' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleCreateNewCategory}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedDrawerCatId('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedDrawerCatId === 'ALL' ? 'font-bold' : 'hover:opacity-80'
                    }`}
                    style={selectedDrawerCatId === 'ALL' ? { backgroundColor: 'var(--accent)', color: '#ffffff' } : { backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
                  >
                    All Categories ({allCategories.length})
                  </button>
                  {allCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedDrawerCatId(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                        selectedDrawerCatId === cat.id ? 'font-bold' : 'hover:opacity-80'
                      }`}
                      style={selectedDrawerCatId === cat.id ? { backgroundColor: 'var(--accent)', color: '#ffffff' } : { backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Scrolling Activities List */}
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {allCategories
                    .filter((cat) => selectedDrawerCatId === 'ALL' || cat.id === selectedDrawerCatId)
                    .map((cat) => {
                      const catActivities = activities.filter(
                        (a) =>
                          !a.isArchived &&
                          a.categoryId === cat.id &&
                          a.name.toLowerCase().includes(drawerSearch.toLowerCase())
                      );
                      if (drawerSearch && catActivities.length === 0) return null;

                      return (
                        <div key={cat.id} className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{cat.name}</span>
                              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                ({catActivities.length} activities)
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {catActivities.map((act) => {
                              const isCurrentlyRunning = activeActivity?.id === act.id;
                              return (
                                <button
                                  key={act.id}
                                  onClick={() => handleTapActivity(act)}
                                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between group cursor-pointer active:scale-95 ${
                                    isCurrentlyRunning
                                      ? 'ring-2 ring-emerald-500/40 font-bold'
                                      : 'hover:opacity-85'
                                  }`}
                                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: isCurrentlyRunning ? '#10b981' : 'var(--border-color)' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                                      {act.name}
                                    </span>
                                    {isCurrentlyRunning ? (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    ) : (
                                      <Play className="w-3 h-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-[9px] px-1.5 py-0.2 rounded border font-mono" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                      {act.defaultMode === 'EVENT' ? '⚡ Instant' : '⏱ Timer'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}

                            {catActivities.length === 0 && (
                              <div className="col-span-full py-2 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
                                No activities in this category yet.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Relocated Recent Saved Entries (3 Slots — Direct Left Column Placement) */}
          <div 
            data-ag-id="DailyTracker_Card_RecentEntries"
            className="border rounded-2xl p-3.5 space-y-2.5 transition-colors shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500 shrink-0" />
                <span style={{ color: 'var(--text-main)' }}>Recent Saved Entries (3 Slots — Android Widget Contract)</span>
              </span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>Auto-updated</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recentEntries.map((rec) => {
                const act = activities.find((a) => a.id === rec.activityId);
                const isRunning = activeOccurrence && activeOccurrence.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    className={`p-2.5 border rounded-xl flex items-center justify-between text-xs transition-colors ${
                      isRunning ? 'border-emerald-500/50 bg-emerald-500/10' : ''
                    }`}
                    style={!isRunning ? { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' } : undefined}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-bold truncate flex items-center gap-1" style={{ color: 'var(--text-main)' }}>
                        {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        <span>{act?.name || 'Activity'}</span>
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {new Date(rec.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span 
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono border font-semibold shrink-0 ${
                        isRunning ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : ''
                      }`}
                      style={!isRunning ? { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' } : undefined}
                    >
                      {isRunning ? 'RUNNING' : rec.kind}
                    </span>
                  </div>
                );
              })}
              {recentEntries.length === 0 && (
                <div className="col-span-3 text-center py-2 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  No recent activities recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-5): 2 Parallel Vertical Action Sections (User Comments 2 & 3) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
          
          {/* Section 1: Views / Navigation Modes */}
          <div 
            className="p-3.5 rounded-2xl border flex flex-col justify-between space-y-3 transition-colors shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Timeline Views
              </span>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSubTab('TIMELINE')}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                    activeSubTab === 'TIMELINE' ? 'shadow-sm font-bold' : 'hover:opacity-80'
                  }`}
                  style={activeSubTab === 'TIMELINE' 
                    ? { backgroundColor: 'var(--accent)', color: '#ffffff', borderColor: 'var(--accent)' } 
                    : { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }
                  }
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>24h Timeline & Capture</span>
                  </div>
                  {activeSubTab === 'TIMELINE' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setActiveSubTab('INTELLIGENCE')}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                    activeSubTab === 'INTELLIGENCE' ? 'shadow-sm font-bold' : 'hover:opacity-80'
                  }`}
                  style={activeSubTab === 'INTELLIGENCE' 
                    ? { backgroundColor: 'var(--accent)', color: '#ffffff', borderColor: 'var(--accent)' } 
                    : { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }
                  }
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Time Intelligence</span>
                  </div>
                  {activeSubTab === 'INTELLIGENCE' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setIsRecoveryOpen(true)}
                className="w-full p-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer hover:opacity-85"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Recovery & Backup</span>
                </div>
                <span className="text-[10px] text-gray-400">JSON</span>
              </button>
            </div>
          </div>

          {/* Section 2: Action Assistants & Data Tools */}
          <div 
            className="p-3.5 rounded-2xl border flex flex-col justify-between space-y-3 transition-colors shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Action Assistants
              </span>
              <div className="space-y-2">
                <button
                  onClick={() => setIsGapReviewOpen(true)}
                  className="w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Review Gaps</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    projection.untrackedGaps.length > 0 
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                      : 'text-gray-400'
                  }`}>
                    {projection.untrackedGaps.length}
                  </span>
                </button>

                <button
                  onClick={() => setIsCatalogOpen(true)}
                  className="w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Catalog</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                    {allCategories.length} Cats
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={handleSeed3DayDemo}
                className="w-full p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 transition-all cursor-pointer shadow-sm active:scale-98"
                title="Populate current day and past 2 days with authentic sample timeline data"
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                <span>🌱 Seed 3-Day Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: 24h Timeline & Full Workspace Canvas */}
      {activeSubTab === 'TIMELINE' && (
        <div className="space-y-5">
          {/* INTERACTIVE 24-HOUR HORIZON TIMELINE CANVAS (Overhauled User Comment 1) */}
          <Visual24hTimeline
            windowStart={startOfDay.getTime()}
            windowEnd={endOfDay.getTime()}
            primarySegments={projection.primarySegments}
            secondarySegments={projection.secondarySegments}
            untrackedGaps={projection.untrackedGaps}
            activities={activities}
            categories={allCategories}
            onSelectSegment={(seg) => setSelectedSegmentForEdit(seg)}
            onSelectGap={(_gap) => setIsRetrospectiveOpen(true)}
          />

          {/* Quality Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border rounded-xl p-3 space-y-1 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Exact Primary</div>
              <div className="text-base sm:text-lg font-mono font-bold" style={{ color: 'var(--text-main)' }}>
                {formatDurationMs(projection.exactPrimaryDurationMs)}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Live Contemporaneous</div>
            </div>

            <div className="border rounded-xl p-3 space-y-1 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Estimated Primary</div>
              <div className="text-base sm:text-lg font-mono font-bold" style={{ color: 'var(--text-main)' }}>
                {formatDurationMs(projection.estimatedPrimaryDurationMs)}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Retrospective / Approx</div>
            </div>

            <div className="border rounded-xl p-3 space-y-1 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Secondary Overlays</div>
              <div className="text-base sm:text-lg font-mono font-bold" style={{ color: 'var(--text-main)' }}>
                {formatDurationMs(projection.secondaryDurationMs)}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Zero primary inflation</div>
            </div>

            <div className="border rounded-xl p-3 space-y-1 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Untracked Gaps</div>
              <div className="text-base sm:text-lg font-mono font-bold" style={{ color: 'var(--text-main)' }}>
                {formatDurationMs(projection.untrackedDurationMs)}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Honest unrecorded time</div>
            </div>
          </div>

          {/* TODAY'S ACTIVITY LOG (Bounded 4-line high-density scroll container - User Comment 5) */}
          <div 
            data-ag-id="DailyTracker_List_ChronologicalSegments" 
            className="border rounded-2xl p-4 sm:p-5 space-y-3 transition-colors shadow-sm" 
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-main)' }}>
                  Today's Activity Log ({projection.primarySegments.length} Segments Logged)
                </span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Click any entry to inspect or split timestamps. Exactly 4 lines visible with smooth scroll.
                </p>
              </div>
              {projection.untrackedGaps.length > 0 ? (
                <button
                  onClick={() => setIsGapReviewOpen(true)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{projection.untrackedGaps.length} Gaps to Fill</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Accounted</span>
                </span>
              )}
            </div>

            {/* Bounded Container: ~4 rows visible without scroll, smooth scroll for the rest */}
            <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1.5 custom-scrollbar">
              {projection.primarySegments.map((seg) => {
                const act = activities.find((a) => a.id === seg.activityId);
                const isRunning = seg.isRunning || seg.endAt == null;
                const startTimeStr = new Date(seg.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = isRunning ? 'Running Now' : new Date(seg.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durationMins = Math.max(1, Math.round(seg.durationMs / 60000));
                const hours = Math.floor(durationMins / 60);
                const mins = durationMins % 60;
                const durStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                const cat = allCategories.find((c) => c.id === act?.categoryId);

                return (
                  <div
                    key={seg.segmentId}
                    onClick={() => setSelectedSegmentForEdit(seg)}
                    className={`flex items-center justify-between p-2.5 px-3.5 rounded-xl border cursor-pointer transition-all hover:opacity-95 ${
                      isRunning
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : ''
                    }`}
                    style={!isRunning ? { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' } : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: isRunning ? '#10b981' : (cat?.color || 'var(--accent)') }}
                      />
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <span className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
                          {act?.name || 'Activity'}
                        </span>
                        {cat && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-medium border shrink-0 hidden sm:inline" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                            {cat.name}
                          </span>
                        )}
                        {isRunning && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                            LIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-xs">
                      <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {startTimeStr} – {endTimeStr}
                      </span>
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}>
                        {durStr}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border hidden md:inline" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        {seg.confidenceLabel}
                      </span>
                    </div>
                  </div>
                );
              })}

              {projection.primarySegments.length === 0 && (
                <div className="p-6 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  No activity logged yet today. Click "🌱 Seed 3-Day Demo" or start an activity from above.
                </div>
              )}
            </div>
          </div>


        </div>
      )}

      {/* VIEW TAB 2: Time Intelligence & Heatmap */}
      {activeSubTab === 'INTELLIGENCE' && (
        <DailyIntelligenceSummary
          report={projection}
          activities={activities}
          occurrences={occurrences}
          categories={allCategories}
        />
      )}

      {/* MODALS & SUBSYSTEM OVERLAYS */}
      {/* 1. Active Timer Conflict Modal */}
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

            await db.timeSegments.update(activeSegment.id, {
              endAt: closureRes.closedSegment.endAt,
              endConfidence: closureRes.closedSegment.endConfidence,
            });

            await startInterval(conflictPrompt.pendingActivity, 'PRIMARY', now, 'EXACT');
          }}
          onLogAsSecondary={async () => {
            if (!conflictPrompt.pendingActivity) return;
            await startInterval(conflictPrompt.pendingActivity, 'SECONDARY', Date.now(), 'EXACT');
          }}
        />
      )}

      {/* 2. Retrospective Batch Editor Modal */}
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

      {/* 3. Activity Detail & Occurrence Editor */}
      {selectedSegmentForEdit && (
        <ActivityDetailModal
          isOpen={!!selectedSegmentForEdit}
          segment={selectedSegmentForEdit}
          occurrence={selectedOccurrenceForEdit}
          activity={selectedActivityForEdit}
          onClose={() => setSelectedSegmentForEdit(null)}
          onSaveUpdate={async (updated) => {
            await db.timeSegments.update(selectedSegmentForEdit.segmentId, {
              startAt: updated.startAt,
              endAt: updated.endAt,
              role: updated.role,
              startConfidence: updated.startConfidence,
              endConfidence: updated.endConfidence,
            });
            if (selectedOccurrenceForEdit && updated.notes !== undefined) {
              await db.activityOccurrences.update(selectedOccurrenceForEdit.id, {
                notes: updated.notes,
              });
            }
            showToast('Updated activity details!');
          }}
          onSplitSegment={async (splitTimeMs) => {
            const originalSeg = await db.timeSegments.get(selectedSegmentForEdit.segmentId);
            if (!originalSeg) return;

            const part1: TimeSegment = {
              ...originalSeg,
              endAt: splitTimeMs,
              endConfidence: 'EXACT',
            };

            const part2: TimeSegment = {
              id: `seg_split_${Date.now()}`,
              occurrenceId: originalSeg.occurrenceId,
              startAt: splitTimeMs,
              endAt: originalSeg.endAt,
              role: originalSeg.role,
              startConfidence: 'EXACT',
              endConfidence: originalSeg.endConfidence,
            };

            await db.transaction('rw', [db.timeSegments], async () => {
              await db.timeSegments.put(part1);
              await db.timeSegments.add(part2);
            });

            showToast('Interval successfully split into two segments!');
          }}
          onDeleteSegment={async () => {
            await db.timeSegments.delete(selectedSegmentForEdit.segmentId);
            showToast('Deleted segment from timeline.');
          }}
        />
      )}

      {/* 4. Category Taxonomy & Catalog Modal */}
      {isCatalogOpen && (
        <ActivityCatalogModal
          isOpen={isCatalogOpen}
          activities={activities}
          categories={allCategories}
          onClose={() => setIsCatalogOpen(false)}
          onCreateActivity={async (newAct) => {
            const now = Date.now();
            const createdAct: ActivityDefinition = {
              ...newAct,
              id: `act_${now}`,
              createdAt: now,
              updatedAt: now,
            };
            await db.activities.add(createdAct);
            showToast(`Created activity ${createdAct.name}!`);
          }}
          onToggleArchive={async (actId, currentStatus) => {
            await db.activities.update(actId, { isArchived: !currentStatus });
            showToast('Updated activity status');
          }}
        />
      )}

      {/* 5. Untracked Gap Review Wizard Modal */}
      {isGapReviewOpen && (
        <GapReviewWizardModal
          isOpen={isGapReviewOpen}
          untrackedGaps={projection.untrackedGaps}
          onClose={() => setIsGapReviewOpen(false)}
          onReconstructGap={(_gap) => setIsRetrospectiveOpen(true)}
        />
      )}

      {/* 6. Failure Recovery & Data Export Modal */}
      {isRecoveryOpen && (
        <FailureRecoveryModal
          isOpen={isRecoveryOpen}
          occurrences={occurrences}
          segments={segments}
          onClose={() => setIsRecoveryOpen(false)}
          onOpenBatchGap={(_hrs) => setIsRetrospectiveOpen(true)}
        />
      )}
    </div>
  );
}
