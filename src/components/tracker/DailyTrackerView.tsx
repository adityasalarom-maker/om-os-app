import React, { useState, useEffect } from 'react';
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
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { QuickCaptureBar } from './QuickCaptureBar';
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
import { CANONICAL_ACTIVITIES, seedTracker3DayMockData } from '../../services/trackerMockData';
import {
  projectDayTimeline,
  evaluatePrimaryStartConflict,
  closePrimaryTimerWithConfirmation,
  recordWakeClosesSleep,
  STARTER_CATEGORIES,
  type ActivityDefinition,
  type ActivityOccurrence,
  type TimeSegment,
  type BoundaryConfidence,
  type ProjectedSegment,
  type TimelineGap,
} from '../../services/dailyTrackerEngine';

const ACTIVITY_CATEGORY_FALLBACKS: Record<string, string> = {
  act_wake: 'cat_sleep',
  act_sleep: 'cat_sleep',
  act_nap: 'cat_sleep',
  act_morning: 'cat_morning',
  act_water: 'cat_morning',
  act_study: 'cat_work',
  act_coding: 'cat_work',
  act_research: 'cat_work',
  act_breakfast: 'cat_food',
  act_lunch: 'cat_food',
  act_tea: 'cat_food',
  act_dinner: 'cat_food',
  act_bath: 'cat_care',
  act_washroom: 'cat_care',
  act_medicine: 'cat_care',
  act_exercise: 'cat_fitness',
  act_pranayama: 'cat_fitness',
  act_meditation: 'cat_fitness',
  act_walk: 'cat_fitness',
  act_music: 'cat_leisure',
  act_leisure_reading: 'cat_leisure',
  act_family: 'cat_social',
  act_calls: 'cat_social',
  act_commute: 'cat_travel',
  act_errands: 'cat_chores',
  act_cleaning: 'cat_chores',
  act_scrolling: 'cat_distracted',
};

export function DailyTrackerView() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewType, setViewType] = useState<'CALENDAR_DAY' | 'WAKE_CYCLE'>('CALENDAR_DAY');
  const [activeSubTab, setActiveSubTab] = useState<'TIMELINE' | 'INTELLIGENCE' | 'CATALOG'>('TIMELINE');

  // Ensure starter activities & 3-day history are seeded
  useEffect(() => {
    initializeDailyTrackerIfEmpty();
    seedTracker3DayMockData(false);
  }, []);

  // Live Queries from Dexie v13 Database
  const dbActivities = useLiveQuery(() => db.activities.toArray(), []);
  const dbOccurrences = useLiveQuery(() => db.activityOccurrences.toArray(), []);
  const dbSegments = useLiveQuery(() => db.timeSegments.toArray(), []);

  const activities = (dbActivities && dbActivities.length > 0) ? dbActivities : CANONICAL_ACTIVITIES;
  const occurrences = dbOccurrences || [];
  const segments = dbSegments || [];

  // Active running timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Dedicated Unfolding Category Drawer State (User Request #4)
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [selectedDrawerCatId, setSelectedDrawerCatId] = useState<string>('ALL');
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string; icon: string; color: string }[]>(() => {
    try {
      const saved = localStorage.getItem('om_os_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  const handleCreateNewCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat_custom_${Date.now()}`,
      name: newCatName.trim(),
      icon: 'Tag',
      color: newCatColor,
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    localStorage.setItem('om_os_custom_categories', JSON.stringify(updated));
    setNewCatName('');
    setIsAddingNewCat(false);
    showToast(`Created category "${newCat.name}"`);
  };

  const allCategories = [...STARTER_CATEGORIES, ...customCategories];

  const formatTimerClock = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Modals state
  const [isRetrospectiveOpen, setIsRetrospectiveOpen] = useState(false);
  const [selectedSegmentForEdit, setSelectedSegmentForEdit] = useState<ProjectedSegment | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isGapReviewOpen, setIsGapReviewOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const [conflictPrompt, setConflictPrompt] = useState<{
    isOpen: boolean;
    pendingActivity: ActivityDefinition | null;
  }>({
    isOpen: false,
    pendingActivity: null,
  });

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Primary timer from database (loose check catches both null and undefined)
  const activeSegment = segments.find((s) => s.role === 'PRIMARY' && s.endAt == null && !s.isPaused) || null;
  const activeOccurrence = activeSegment ? occurrences.find((o) => o.id === activeSegment.occurrenceId) : null;
  const activeActivity = activeOccurrence ? activities.find((a) => a.id === activeOccurrence.activityId) : null;

  // Running elapsed timer tick
  useEffect(() => {
    if (!activeSegment) return;

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

  const formatDurationMs = (ms: number) => {
    const mins = Math.round(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  // Recent 3 completed entries (excluding running timer, matching Android widget contract)
  const recentEntries = occurrences
    .filter((o) => o.status === 'STOPPED' || (o.kind === 'EVENT'))
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .slice(0, 3);

  const selectedOccurrenceForEdit = selectedSegmentForEdit
    ? occurrences.find((o) => o.id === selectedSegmentForEdit.occurrenceId) || null
    : null;

  const selectedActivityForEdit = selectedSegmentForEdit
    ? activities.find((a) => a.id === selectedSegmentForEdit.activityId) || null
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-400 text-xs font-medium animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Day Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Personal Daily Life Tracker</h2>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              TASK-20 Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Local-first chronological 24h ledger • 11 categories • Decomposed confidence • Zero gap fabrication
          </p>
        </div>

        {/* Date Selector & Day Navigation */}
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

      {/* Subsystem Navigation Bar & Action Tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('TIMELINE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeSubTab === 'TIMELINE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24h Timeline & Capture</span>
          </button>

          <button
            onClick={() => setActiveSubTab('INTELLIGENCE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeSubTab === 'INTELLIGENCE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Time Intelligence & Heatmap</span>
          </button>
        </div>

        {/* Action Assistant Tools (PRD §4.11 & §9.4) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGapReviewOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Smart assistant to review and fill unrecorded time blocks"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Review Gaps ({projection.untrackedGaps.length})</span>
          </button>

          <button
            onClick={() => setIsCatalogOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Catalog ({allCategories.length} Categories)</span>
          </button>

          <button
            onClick={() => setIsRecoveryOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Recovery & Backup</span>
          </button>

          <button
            onClick={async () => {
              const res = await seedTracker3DayMockData(true);
              showToast(res.message);
            }}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Seed 3 days of historical tracking data (Yesterday, 2 days ago, 3 days ago)"
          >
            <span>🌱 Seed 3-Day Demo</span>
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: 24h Timeline & Quick Capture */}
      {activeSubTab === 'TIMELINE' && (
        <div className="space-y-6">
          {/* 1. ACTIVE RUNNING TIMER (Matte, clean solid green without glowing or pinging) */}
          {activeSegment && activeActivity && (
            <div className="bg-slate-900 border border-emerald-600/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs uppercase font-semibold text-emerald-400">
                      Live Timer Active
                    </span>
                    <span className="text-xs text-slate-400">
                      Started at {new Date(activeSegment.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                    {activeActivity.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Elapsed</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {formatTimerClock(elapsedSeconds)}
                  </div>
                </div>
                <button
                  onClick={handleStopActiveTimer}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop Timer</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. DEDICATED START BUTTON & ANIMATED UNFOLDING CATEGORY DRAWER */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
            {/* Main Action Bar */}
            <div className="p-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setIsCategoryDrawerOpen(!isCategoryDrawerOpen)}
                className="flex-1 min-w-[240px] px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl text-sm flex items-center justify-between shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 fill-white" />
                  <span className="text-base font-bold">Start Activity or Timer</span>
                  <span className="text-xs font-normal text-indigo-200 bg-indigo-700/50 px-2.5 py-0.5 rounded-full">
                    {allCategories.length} Categories
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-100">
                  <span>{isCategoryDrawerOpen ? 'Close Menu' : 'Browse Categories'}</span>
                  {isCategoryDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              <button
                onClick={() => setIsRetrospectiveOpen(true)}
                className="px-4 py-3.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
                title="Log activities you did earlier today"
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold">+ Log Missed Past Time</span>
              </button>
            </div>

            {/* Quick 1-Tap Preset Pills Row */}
            <div className="px-4 pb-3.5 pt-1 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap uppercase tracking-wider">
                1-Tap Presets:
              </span>
              {activities.slice(0, 9).map((act) => {
                const isRunning = activeActivity?.id === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleTapActivity(act)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                      isRunning
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-200 hover:text-white'
                    }`}
                  >
                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    <span>{act.name}</span>
                  </button>
                );
              })}
            </div>

            {/* ANIMATED UNFOLDING COLLAPSIBLE CATEGORY MENU */}
            {isCategoryDrawerOpen && (
              <div className="border-t border-slate-800 bg-slate-950/80 p-5 space-y-4 animate-in slide-in-from-top-4 duration-300 ease-out">
                {/* Search Bar & Add Category Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={drawerSearch}
                      onChange={(e) => setDrawerSearch(e.target.value)}
                      placeholder="Search across all categories & activities..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Category</span>
                    </button>
                    <button
                      onClick={() => setIsCatalogOpen(true)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Manage All ({activities.length})</span>
                    </button>
                  </div>
                </div>

                {/* Inline Create New Category Form */}
                {isAddingNewCat && (
                  <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-3">
                    <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4" />
                      <span>Create New Custom Category</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category name (e.g. Creative Projects, Freelancing, Hobbies)..."
                        className="flex-1 min-w-[200px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center gap-1.5">
                        {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#8b5cf6'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewCatColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-full transition-transform ${
                              newCatColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleCreateNewCategory}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                      >
                        Save Category
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedDrawerCatId('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedDrawerCatId === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    All Categories ({allCategories.length})
                  </button>
                  {allCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedDrawerCatId(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        selectedDrawerCatId === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Scrolling Category Groups with 1-Tap Activity Cards */}
                <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1">
                  {allCategories
                    .filter((cat) => selectedDrawerCatId === 'ALL' || cat.id === selectedDrawerCatId)
                    .map((cat) => {
                      const catActivities = activities.filter(
                        (a) =>
                          !a.isArchived &&
                          (a.categoryId === cat.id || ACTIVITY_CATEGORY_FALLBACKS[a.id] === cat.id) &&
                          a.name.toLowerCase().includes(drawerSearch.toLowerCase())
                      );
                      if (drawerSearch && catActivities.length === 0) return null;

                      return (
                        <div key={cat.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
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
                                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between group active:scale-95 ${
                                    isCurrentlyRunning
                                      ? 'bg-emerald-950/60 border-emerald-500/60 ring-2 ring-emerald-500/30'
                                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 truncate">
                                      {act.name}
                                    </span>
                                    {isCurrentlyRunning ? (
                                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    ) : (
                                      <Play className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                      {act.defaultMode === 'EVENT' ? '⚡ Instant' : '⏱ Timer'}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                                      {act.defaultRole}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}

                            {catActivities.length === 0 && (
                              <div className="col-span-full py-2 text-center text-xs text-slate-500 italic">
                                No activities in this category yet. Click "+ Add New Category" or Catalog to add.
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

          {/* 3. INTERACTIVE 24-HOUR HORIZON TIMELINE CANVAS */}
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

          {/* 4. TODAY'S ACTIVITY LOG */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Today's Activity Log ({projection.primarySegments.length} Segments Logged)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any entry to adjust timestamps, split intervals, or delete.
                </p>
              </div>
              {projection.untrackedGaps.length > 0 ? (
                <button
                  onClick={() => setIsGapReviewOpen(true)}
                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{projection.untrackedGaps.length} Gaps to Fill</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Complete</span>
                </span>
              )}
            </div>

            <div className="space-y-2">
              {projection.primarySegments.map((seg) => {
                const act = activities.find((a) => a.id === seg.activityId);
                const isRunning = seg.isRunning || seg.endAt == null;
                const startTimeStr = new Date(seg.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = isRunning ? 'Running Now' : new Date(seg.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durationMins = Math.max(1, Math.round(seg.durationMs / 60000));

                return (
                  <div
                    key={seg.segmentId}
                    onClick={() => setSelectedSegmentForEdit(seg)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isRunning
                        ? 'bg-emerald-950/40 border-emerald-500/50 hover:bg-emerald-950/60'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <span>{act?.name || 'Activity'}</span>
                          {isRunning && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                              ACTIVE NOW
                            </span>
                          )}
                          {seg.isCrossMidnight && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Cross-Midnight
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {startTimeStr} – <span className={isRunning ? 'text-emerald-300 font-bold' : ''}>{endTimeStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isRunning ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-300">
                            {durationMins}m Running
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStopActiveTimer();
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                          >
                            Stop
                          </button>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {projection.primarySegments.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No activities logged yet for this day. Click "Start Activity or Timer" above to begin tracking.
                </div>
              )}
            </div>
          </div>

          {/* Android Widget Contract Reference: 3 Recent Saved Entries */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Recent Saved Entries (3 Slots — Android Widget Contract)</span>
              </span>
              <span className="text-slate-500 font-normal">Active timer does not displace these slots</span>
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
        </div>
      )}

      {/* VIEW TAB 2: Time Intelligence & Heatmap */}
      {activeSubTab === 'INTELLIGENCE' && (
        <DailyIntelligenceSummary
          report={projection}
          activities={activities}
          occurrences={occurrences}
          categories={STARTER_CATEGORIES}
        />
      )}

      {/* Modals & Subsystem Overlays */}
      {/* 1. Active Timer Confirmation Modal */}
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
          categories={STARTER_CATEGORIES}
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
