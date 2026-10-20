import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  type TaskItem, 
  type GoalItem, 
  type InboxItem, 
  type JournalEntry, 
  type SadhanaLogRecord, 
  type PranayamaSessionRecord 
} from '../db';
import { 
  X, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Inbox, 
  CalendarCheck, 
  ListTodo, 
  Target, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Clock, 
  ShieldAlert, 
  TrendingUp, 
  Heart, 
  Smile, 
  Check, 
  Zap, 
  BookOpen, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface ReviewCadenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

type CadenceType = 'Weekly' | 'Monthly' | 'Annual';

export const ReviewCadenceModal: React.FC<ReviewCadenceModalProps> = ({
  isOpen,
  onClose,
  onCompleted
}) => {
  const [cadenceType, setCadenceType] = useState<CadenceType>('Weekly');
  const [currentStep, setCurrentStep] = useState<number>(1); // 1 to 5

  // Review Form States
  const [mit1, setMit1] = useState<string>('');
  const [mit2, setMit2] = useState<string>('');
  const [mit3, setMit3] = useState<string>('');
  const [winsList, setWinsList] = useState<string[]>([]);
  const [winInput, setWinInput] = useState<string>('');
  const [gapsText, setGapsText] = useState<string>('');
  const [lessonsText, setLessonsText] = useState<string>('');
  const [manualSadhanaMins, setManualSadhanaMins] = useState<number>(45);
  const [manualOjasScore, setManualOjasScore] = useState<number>(85);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);

  // Queries
  const inboxItems = useLiveQuery(() => db.inbox.where('status').equals('Inbox').toArray(), []) || [];
  const allTasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const activeGoals = useLiveQuery(() => db.goals.where('status').equals('Active').toArray(), []) || [];
  const sadhanaLogs = useLiveQuery(() => db.sadhanaLogs.orderBy('date').reverse().limit(14).toArray(), []) || [];
  const pranaSessions = useLiveQuery(() => db.pranayamaSessions.orderBy('date').reverse().limit(14).toArray(), []) || [];

  // Filter Active vs Completed Tasks
  const activeTasks = useMemo(() => allTasks.filter(t => !t.isCompleted), [allTasks]);
  const completedPast7Days = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allTasks.filter(t => t.isCompleted && t.updatedAt >= sevenDaysAgo);
  }, [allTasks]);

  // Overdue Tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = useMemo(() => {
    return activeTasks.filter(t => t.deadline && t.deadline < todayStr);
  }, [activeTasks, todayStr]);

  // Sadhana Past 7 Days Audit Aggregates
  const sadhanaStats = useMemo(() => {
    const logs7 = sadhanaLogs.slice(0, 7);
    const totalJapa = logs7.reduce((acc, l) => acc + (l.japaMalas || 0), 0);
    const totalDhyana = logs7.reduce((acc, l) => acc + (l.dhyanaMinutes || 0), 0);
    const totalPrana = logs7.reduce((acc, l) => acc + (l.pranayamaMinutes || 0), 0);
    const avgStillness = logs7.length > 0 
      ? Math.round(logs7.reduce((acc, l) => acc + (l.stillnessScore || 0), 0) / logs7.length)
      : 8;
    const avgOjas = logs7.length > 0 
      ? Math.round(logs7.reduce((acc, l) => acc + (l.ojasScore || 0), 0) / logs7.length)
      : 85;
    const brahmaMuhurtaCount = logs7.filter(l => l.brahmaMuhurta).length;

    return {
      daysLogged: logs7.length,
      totalJapa,
      totalDhyana,
      totalPrana,
      avgStillness,
      avgOjas,
      brahmaMuhurtaCount
    };
  }, [sadhanaLogs]);

  if (!isOpen) return null;

  // Step 1: Universal Inbox Quick Actions
  const handleTriageInboxToTask = async (item: InboxItem) => {
    const now = Date.now();
    await db.tasks.add({
      id: `task-inbox-${now}`,
      title: item.title,
      status: 'To Do',
      priority: 'Important Not Urgent',
      quadrant: 'Q2',
      urgency: 'Medium',
      impact: 'High',
      energyRequired: 'Deep Work',
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    });
    await db.inbox.update(item.id, { status: 'Processed', updatedAt: now });
  };

  const handleTriageInboxToKnowledge = async (item: InboxItem) => {
    const now = Date.now();
    await db.knowledge.add({
      id: `know-inbox-${now}`,
      title: item.title,
      type: 'Note',
      content: item.content,
      tags: ['Inbox Triage', 'Living Knowledge'],
      createdAt: now,
      updatedAt: now
    });
    await db.inbox.update(item.id, { status: 'Processed', updatedAt: now });
  };

  const handleArchiveInbox = async (itemId: string) => {
    await db.inbox.update(itemId, { status: 'Archived', updatedAt: Date.now() });
  };

  const handleArchiveAllInbox = async () => {
    const now = Date.now();
    for (const item of inboxItems) {
      await db.inbox.update(item.id, { status: 'Archived', updatedAt: now });
    }
  };

  // Step 2: Task Roll-over Actions
  const handleRolloverOverdueTasks = async () => {
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
    const nextSundayStr = nextSunday.toISOString().split('T')[0];
    const now = Date.now();

    for (const task of overdueTasks) {
      await db.tasks.update(task.id, {
        deadline: nextSundayStr,
        updatedAt: now
      });
    }
  };

  const handleMarkTaskDone = async (taskId: string) => {
    await db.tasks.update(taskId, {
      isCompleted: true,
      status: 'Done',
      updatedAt: Date.now()
    });
  };

  // Step 3: Life Goals Progress Update
  const handleUpdateGoalProgress = async (goalId: string, newProgress: number) => {
    await db.goals.update(goalId, {
      progress: Math.min(100, Math.max(0, newProgress)),
      status: newProgress >= 100 ? 'Achieved' : 'Active',
      updatedAt: Date.now()
    });
  };

  // Step 5: Wins Management
  const handleAddWin = () => {
    if (!winInput.trim()) return;
    setWinsList(prev => [...prev, winInput.trim()]);
    setWinInput('');
  };

  const handleRemoveWin = (idx: number) => {
    setWinsList(prev => prev.filter((_, i) => i !== idx));
  };

  // Final Submission: Commit Weekly Review to DB
  const handleCommitReview = async () => {
    setIsSubmitting(true);
    const now = Date.now();
    const cleanMits = [mit1.trim(), mit2.trim(), mit3.trim()].filter(Boolean);

    // 1. Create Tasks for the 3 MITs if entered
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
    const nextSundayStr = nextSunday.toISOString().split('T')[0];

    for (let i = 0; i < cleanMits.length; i++) {
      const mitTitle = cleanMits[i];
      // Check if task with exact title already exists
      const exists = activeTasks.some(t => t.title.toLowerCase() === mitTitle.toLowerCase());
      if (!exists) {
        await db.tasks.add({
          id: `task-mit-${now}-${i + 1}`,
          title: `[MIT ${i + 1}] ${mitTitle}`,
          status: 'To Do',
          priority: 'Urgent & Important',
          quadrant: 'Q1',
          urgency: 'High',
          impact: 'High',
          energyRequired: 'Deep Work',
          deadline: nextSundayStr,
          isCompleted: false,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // 2. Synthesize Review Journal Entry
    const synthesisMarkdown = [
      `# ${cadenceType} Review - ${todayStr}`,
      `*Cadence: ${cadenceType} | Completion Velocity: ${completedPast7Days.length} tasks completed*`,
      '',
      '## 1. Top Wins & Milestones',
      ...(winsList.length > 0 ? winsList.map(w => `- ✨ ${w}`) : ['- _Steady execution across projects._']),
      '',
      '## 2. Gaps & Friction Points',
      gapsText.trim() ? gapsText.trim() : '_No critical friction noted._',
      '',
      '## 3. Retrospective Lessons Learned',
      lessonsText.trim() ? lessonsText.trim() : '_Maintain stillness in action._',
      '',
      '## 4. Sadhana & Vitality Audit',
      `- Total Japa Malas: ${sadhanaStats.totalJapa} malas`,
      `- Meditation / Dhyana: ${sadhanaStats.totalDhyana || manualSadhanaMins} minutes`,
      `- Pranayama Discipline: ${sadhanaStats.totalPrana} minutes`,
      `- Pranic Ojas Score: ${sadhanaStats.avgOjas || manualOjasScore}/100`,
      `- Brahma Muhurta Adherence: ${sadhanaStats.brahmaMuhurtaCount} days`,
      '',
      '## 5. Next Horizon Most Important Tasks (MITs)',
      ...cleanMits.map((m, idx) => `- [ ] **MIT ${idx + 1}**: ${m}`),
      ''
    ].join('\n');

    const reviewEntry: JournalEntry = {
      id: `journal-review-${todayStr}`,
      date: todayStr,
      entryType: cadenceType === 'Monthly' ? 'Monthly Review' : 'Weekly Review',
      moodScore: Math.round((sadhanaStats.avgStillness || 8)),
      energyScore: Math.round((manualOjasScore / 10)),
      clarityScore: 9,
      morningTop3: cleanMits,
      morningCompleted: [false, false, false],
      eveningWins: winsList,
      lessonsLearned: lessonsText.trim(),
      content: synthesisMarkdown,
      createdAt: now,
      updatedAt: now
    };

    await db.journal.put(reviewEntry);

    setIsSubmitting(false);
    setCompletedSuccess(true);
    setTimeout(() => {
      setCompletedSuccess(false);
      onCompleted?.();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#181a24] border border-[#2c334d] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#2c334d] px-6 py-4 bg-[#141622] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-600/30 to-purple-600/30 text-amber-400 rounded-xl border border-amber-500/30">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Guided Review Cadence Engine</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Notion OS Protocol
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                5-Step Operational Triage Loop: Sweep, Roll-over, Align, Audit & Commit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cadence Selector Tabs */}
            <div className="bg-[#1d202e] p-1 rounded-xl border border-[#2d3246] flex items-center text-xs">
              {(['Weekly', 'Monthly', 'Annual'] as CadenceType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setCadenceType(type)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    cadenceType === type 
                      ? 'bg-amber-600 text-white shadow-sm' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-[#202538] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 5-Step Stepper Ribbon */}
        <div className="grid grid-cols-5 border-b border-[#2c334d] bg-[#161826] text-xs font-semibold shrink-0">
          {[
            { step: 1, label: '1. Inbox Sweep', icon: Inbox },
            { step: 2, label: '2. Task Roll-over', icon: ListTodo },
            { step: 3, label: '3. Goals Check', icon: Target },
            { step: 4, label: '4. Sadhana Audit', icon: Flame },
            { step: 5, label: '5. Set 3 MITs', icon: Sparkles }
          ].map(s => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center justify-center gap-2 py-3 px-2 border-r border-[#2c334d] last:border-r-0 transition-colors cursor-pointer ${
                  isCurrent 
                    ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-b-indigo-500 font-bold' 
                    : isDone
                    ? 'text-emerald-400 hover:bg-[#202438]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1d2e]'
                }`}
              >
                {isDone ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> : <Icon size={13} className="shrink-0" />}
                <span className="truncate hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.step}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: UNIVERSAL INBOX SWEEP */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Inbox className="text-indigo-400" size={16} />
                    <span>Step 1: Universal Inbox Sweep</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Process raw conversation snips, links, and quick notes. Triage into Tasks, Knowledge Notes, or Archive.
                  </p>
                </div>
                {inboxItems.length > 0 && (
                  <button
                    onClick={handleArchiveAllInbox}
                    className="text-xs text-gray-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-[#202538] hover:bg-rose-500/20 border border-[#2e354f] transition-colors cursor-pointer"
                  >
                    Archive All
                  </button>
                )}
              </div>

              {inboxItems.length === 0 ? (
                <div className="p-8 bg-[#141622] rounded-2xl border border-emerald-500/30 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h5 className="text-sm font-bold text-white">Universal Inbox Zero Achieved</h5>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    All incoming signals, quick notes, and dialogue extracts have been fully triaged. Your mental bandwidth is clear.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inboxItems.map(item => (
                    <div 
                      key={item.id}
                      className="p-4 bg-[#141622] border border-[#272b3d] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/40 transition-colors"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            {item.type}
                          </span>
                          <span className="text-xs font-semibold text-white">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-2">{item.content}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleTriageInboxToTask(item)}
                          title="Convert to Task"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/40 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <ListTodo size={12} />
                          <span>Task</span>
                        </button>
                        <button
                          onClick={() => handleTriageInboxToKnowledge(item)}
                          title="Convert to Knowledge Vault Note"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/40 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <BookOpen size={12} />
                          <span>Note</span>
                        </button>
                        <button
                          onClick={() => handleArchiveInbox(item.id)}
                          title="Archive item"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#1d202e] border border-[#2d3246] transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: TASK ROLL-OVER & EISENHOWER TRIAGE */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListTodo className="text-indigo-400" size={16} />
                    <span>Step 2: Task Roll-Over & Velocity Triage</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Review active commitments. Roll over expired tasks to next week or close out completed work.
                  </p>
                </div>
                {overdueTasks.length > 0 && (
                  <button
                    onClick={handleRolloverOverdueTasks}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock size={13} />
                    <span>Roll Over {overdueTasks.length} Overdue to Next Week</span>
                  </button>
                )}
              </div>

              {/* Weekly Velocity Metric Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#141622] rounded-xl border border-[#272b3d]">
                  <span className="text-[10px] text-gray-400 font-medium">Completed Past 7 Days</span>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{completedPast7Days.length} Tasks</div>
                  <span className="text-[10px] text-gray-500">Execution Velocity</span>
                </div>
                <div className="p-3.5 bg-[#141622] rounded-xl border border-[#272b3d]">
                  <span className="text-[10px] text-gray-400 font-medium">Active In-Flight Tasks</span>
                  <div className="text-xl font-bold text-white mt-0.5">{activeTasks.length} Tasks</div>
                  <span className="text-[10px] text-gray-500">Ongoing commitments</span>
                </div>
                <div className="p-3.5 bg-[#141622] rounded-xl border border-[#272b3d]">
                  <span className="text-[10px] text-gray-400 font-medium">Overdue Deadlines</span>
                  <div className={`text-xl font-bold mt-0.5 ${overdueTasks.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {overdueTasks.length} Tasks
                  </div>
                  <span className="text-[10px] text-gray-500">Requiring rollover</span>
                </div>
              </div>

              {/* Overdue Tasks List */}
              {overdueTasks.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={13} />
                    <span>Overdue Action Items ({overdueTasks.length})</span>
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {overdueTasks.map(t => (
                      <div 
                        key={t.id}
                        className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white block">{t.title}</span>
                          <span className="text-[10px] text-amber-400/80">Deadline was: {t.deadline}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkTaskDone(t.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40 text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Tasks Overview */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Active Tasks Sample</h5>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeTasks.slice(0, 10).map(t => (
                    <div 
                      key={t.id}
                      className="p-3 bg-[#141622] border border-[#272b3d] rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          t.quadrant === 'Q1' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                          t.quadrant === 'Q2' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                          'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                        }`}>
                          {t.quadrant}
                        </span>
                        <span className="text-gray-200 font-medium">{t.title}</span>
                      </div>
                      <button
                        onClick={() => handleMarkTaskDone(t.id)}
                        className="p-1 rounded text-gray-400 hover:text-emerald-400 hover:bg-[#1d202e] cursor-pointer"
                        title="Mark Done"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: LIFE GOALS PROGRESS CHECK */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="text-indigo-400" size={16} />
                  <span>Step 3: Life Goals Progress Check</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Calibrate your 5 Life Pillars: adjust progress % and verify that day-to-day actions ladder into your Life Pyramid.
                </p>
              </div>

              {activeGoals.length === 0 ? (
                <div className="p-8 bg-[#141622] rounded-2xl border border-[#272b3d] text-center text-xs text-gray-400">
                  No active goals registered in Goals Pyramid. Create goals in the Goals Pyramid module.
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {activeGoals.map(goal => (
                    <div 
                      key={goal.id}
                      className="p-4 bg-[#141622] border border-[#272b3d] rounded-xl space-y-3 hover:border-indigo-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">
                            {goal.lifeArea} • {goal.level}
                          </span>
                          <span className="text-xs font-bold text-white">{goal.title}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                          {goal.progress}%
                        </span>
                      </div>

                      {/* Progress Slider */}
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress}
                          onChange={(e) => handleUpdateGoalProgress(goal.id, parseInt(e.target.value, 10))}
                          className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-[#252a3b] rounded-lg"
                        />
                        <div className="flex gap-1">
                          {[25, 50, 75, 100].map(val => (
                            <button
                              key={val}
                              onClick={() => handleUpdateGoalProgress(goal.id, val)}
                              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                goal.progress === val 
                                  ? 'bg-indigo-600 text-white border-indigo-500' 
                                  : 'bg-[#1b1e2c] text-gray-400 border-[#2a3044] hover:text-white'
                              }`}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: SADHANA & PRANA AUDIT */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="text-amber-400" size={16} />
                  <span>Step 4: Sadhana & Pranic Vitality Audit</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Vedic inner governance: verify consistency in Japa, Dhyana, Pranayama, and vital Ojas energy over the past 7 days.
                </p>
              </div>

              {/* Sadhana KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#141622] rounded-xl border border-[#272b3d]">
                  <span className="text-[10px] text-gray-400 block">Japa Discipline</span>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">{sadhanaStats.totalJapa} Malas</div>
                  <span className="text-[10px] text-gray-500">{sadhanaStats.daysLogged} days logged</span>
                </div>
                <div className="p-3.5 bg-[#141622] rounded-xl border border-[#272b3d]">
                  <span className="text-[10px] text-gray-400 block">Dhyana (Meditation)</span>
                  <div className="text-xl font-bold text-indigo-400 mt-0.5">{sadhanaStats.totalDhyana || manualSadhanaMins} mins</div>
                  <span className="text-[10px] text-gray-500">Stillness & inward focus</span>
                </div>
                <div className="p-3.5 bg-[#141622] rounded-xl border border-[#272b3d]">
                  <span className="text-[10px] text-gray-400 block">Vital Ojas Score</span>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{sadhanaStats.avgOjas || manualOjasScore}/100</div>
                  <span className="text-[10px] text-gray-500">Pranic luster & immunity</span>
                </div>
                <div className="p-3.5 bg-[#141622] rounded-xl border border-[#272b3d]">
                  <span className="text-[10px] text-gray-400 block">Brahma Muhurta</span>
                  <div className="text-xl font-bold text-purple-400 mt-0.5">{sadhanaStats.brahmaMuhurtaCount}/7 Days</div>
                  <span className="text-[10px] text-gray-500">Dawn awakening</span>
                </div>
              </div>

              {/* Calibration Slider for Quick Weekly Assessment */}
              <div className="p-4 bg-[#141622] border border-[#272b3d] rounded-xl space-y-4">
                <h5 className="text-xs font-bold text-white">Weekly Pranic Vitality Calibration</h5>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Daily Average Sadhana (Minutes)</span>
                    <span className="text-indigo-400 font-bold font-mono">{manualSadhanaMins} mins</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="5"
                    value={manualSadhanaMins}
                    onChange={(e) => setManualSadhanaMins(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-[#252a3b] rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Vital Ojas & Equanimity Level</span>
                    <span className="text-emerald-400 font-bold font-mono">{manualOjasScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={manualOjasScore}
                    onChange={(e) => setManualOjasScore(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#252a3b] rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 italic">
                "Yoga is equanimity in action. When pranic rhythm is sustained, intellect (Buddhi) remains undisturbed by transient outcomes."
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 5: SET NEXT WEEK'S 3 MITS & SYNTHESIS */}
          {/* ------------------------------------------------------------- */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={16} />
                  <span>Step 5: Set Next Horizon 3 MITs & Retrospective Synthesis</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Synthesize the past week's breakthroughs and lock in the 3 high-leverage initiatives for the upcoming cycle.
                </p>
              </div>

              {/* Wins Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block">Top Wins & Breakthroughs of the Week</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={winInput}
                    onChange={(e) => setWinInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWin()}
                    placeholder="e.g. Mastered Vivarta Vada notes; Ingested 40 archives; Completed GIS coordinates..."
                    className="flex-1 bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddWin}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add Win
                  </button>
                </div>
                {winsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {winsList.map((win, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                      >
                        <span>{win}</span>
                        <button onClick={() => handleRemoveWin(idx)} className="text-emerald-400 hover:text-white">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Gaps & Lessons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 block">Friction, Gaps & Roadblocks</label>
                  <textarea
                    rows={2}
                    value={gapsText}
                    onChange={(e) => setGapsText(e.target.value)}
                    placeholder="What friction slowed down high-leverage work this week?"
                    className="w-full bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 block">Core Lessons & Strategic Realizations</label>
                  <textarea
                    rows={2}
                    value={lessonsText}
                    onChange={(e) => setLessonsText(e.target.value)}
                    placeholder="Key strategic or philosophical realization to carry forward..."
                    className="w-full bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* The 3 MITs (Most Important Tasks) */}
              <div className="space-y-3 pt-2 border-t border-[#2c334d]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Next Cycle: The 3 Most Important Tasks (MITs)
                  </label>
                  <span className="text-[10px] text-gray-500">Automatically scheduled to Q1/Q2 Eisenhower</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-xs font-bold text-amber-400 font-mono">#1</span>
                    <input
                      type="text"
                      value={mit1}
                      onChange={(e) => setMit1(e.target.value)}
                      placeholder="Primary high-leverage initiative (e.g. Finalize Uttarkashi land registry paperwork)..."
                      className="flex-1 bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-xs font-bold text-amber-400 font-mono">#2</span>
                    <input
                      type="text"
                      value={mit2}
                      onChange={(e) => setMit2(e.target.value)}
                      placeholder="Secondary strategic priority (e.g. Implement real-time wikilink bi-directional sync)..."
                      className="flex-1 bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-xs font-bold text-amber-400 font-mono">#3</span>
                    <input
                      type="text"
                      value={mit3}
                      onChange={(e) => setMit3(e.target.value)}
                      placeholder="Third key priority (e.g. Complete 108 japa malas and cold exposure protocol)..."
                      className="flex-1 bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {completedSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check size={16} className="text-emerald-400" />
                  <span>Review successfully committed to Journal and Tasks! Closing...</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Navigation */}
        <div className="border-t border-[#2c334d] p-4 bg-[#141622] flex items-center justify-between shrink-0">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202538] hover:bg-[#282d3e] disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Previous Step</span>
          </button>

          <span className="text-[11px] text-gray-500 font-mono">
            Step {currentStep} of 5
          </span>

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              disabled={isSubmitting || completedSuccess}
              onClick={handleCommitReview}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 disabled:opacity-50 text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/30"
            >
              <CheckCircle2 size={15} />
              <span>{isSubmitting ? 'Committing Review...' : `Commit ${cadenceType} Review & Lock MITs`}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
