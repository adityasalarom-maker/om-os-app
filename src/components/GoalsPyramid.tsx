import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type GoalItem, type Project, type TaskItem } from '../db';
import { 
  Compass, 
  Plus, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  ChevronRight,
  ChevronDown,
  Sparkles,
  Calculator,
  Trash2,
  ListChecks,
  ArrowDown,
  RefreshCw,
  FolderKanban,
  Check,
  Calendar,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const GoalsPyramid: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set());
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<GoalItem['level']>('1-Year');
  const [lifeArea, setLifeArea] = useState<GoalItem['lifeArea']>('Spiritual & Inner');
  const [progress, setProgress] = useState(25);
  const [parentId, setParentId] = useState<string>('');
  const [targetDate, setTargetDate] = useState('');
  const [autoRollup, setAutoRollup] = useState(true);
  const [keyResultsList, setKeyResultsList] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newKrInput, setNewKrInput] = useState('');
  const [linkedProjectsList, setLinkedProjectsList] = useState<string[]>([]);

  // Live queries
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];

  const pyramidLevels: GoalItem['level'][] = [
    'Life Vision',
    '10-Year',
    '5-Year',
    '1-Year',
    'Quarterly OKR'
  ];

  const lifeAreas: GoalItem['lifeArea'][] = [
    'Spiritual & Inner',
    'Health & Vitality',
    'Wealth & Assets',
    'Career & Skills',
    'Family & Relationships'
  ];

  // Helper to toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedGoalIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Calculate dynamic rollup progress for a single goal
  const calculateGoalRollup = (goal: GoalItem, allGoals: GoalItem[], allProjects: Project[], allTasks: TaskItem[]): number => {
    // 1. If goal has Key Results defined, KRs provide direct quantifiable ground truth
    if (goal.keyResults && goal.keyResults.length > 0) {
      const completedKrs = goal.keyResults.filter(kr => kr.done).length;
      return Math.round((completedKrs / goal.keyResults.length) * 100);
    }

    // 2. If it's a Quarterly OKR with linked projects, calculate from project progress
    if (goal.level === 'Quarterly OKR' && goal.linkedProjectIds && goal.linkedProjectIds.length > 0) {
      const linked = allProjects.filter(p => goal.linkedProjectIds!.includes(p.id));
      if (linked.length > 0) {
        const avg = linked.reduce((acc, p) => acc + (p.progress || 0), 0) / linked.length;
        return Math.round(avg);
      }
    }

    // 3. Cascading Rollup from lower tier child goals
    // Find explicit children (parentId === goal.id)
    const directChildren = allGoals.filter(g => g.parentId === goal.id);
    if (directChildren.length > 0) {
      const avg = directChildren.reduce((acc, c) => acc + (c.progress || 0), 0) / directChildren.length;
      return Math.round(avg);
    }

    // Fallback: Tier-level cascading rollup by same lifeArea in the immediate subordinate tier
    const currentTierIdx = pyramidLevels.indexOf(goal.level);
    if (currentTierIdx < pyramidLevels.length - 1) {
      const lowerTier = pyramidLevels[currentTierIdx + 1];
      const lowerTierGoalsInArea = allGoals.filter(g => g.level === lowerTier && g.lifeArea === goal.lifeArea);
      if (lowerTierGoalsInArea.length > 0) {
        const avg = lowerTierGoalsInArea.reduce((acc, g) => acc + (g.progress || 0), 0) / lowerTierGoalsInArea.length;
        return Math.round(avg);
      }
    }

    // Default to the manual progress
    return goal.progress;
  };

  // Global Cascading Rollup Engine across all 5 tiers
  const executeCascadingRollup = async () => {
    setIsRecalculating(true);
    setRecalcMessage(null);

    try {
      const allGoals = await db.goals.toArray();
      const allProjects = await db.projects.toArray();
      const allTasks = await db.tasks.toArray();

      // We cascade bottom-up: Quarterly OKR -> 1-Year -> 5-Year -> 10-Year -> Life Vision
      const reversedTiers = [...pyramidLevels].reverse();
      let updatedCount = 0;

      // In-memory working copy to allow instantaneous multi-tier ripple
      const workingGoals = [...allGoals];

      for (const tier of reversedTiers) {
        const tierGoals = workingGoals.filter(g => g.level === tier);
        for (const goal of tierGoals) {
          if (goal.autoRollup !== false) {
            const newCalculatedProgress = calculateGoalRollup(goal, workingGoals, allProjects, allTasks);
            if (newCalculatedProgress !== goal.progress) {
              goal.progress = newCalculatedProgress;
              goal.status = newCalculatedProgress >= 100 ? 'Achieved' : 'Active';
              goal.updatedAt = Date.now();
              await db.goals.update(goal.id, {
                progress: goal.progress,
                status: goal.status,
                updatedAt: goal.updatedAt
              });
              updatedCount++;
            }
          }
        }
      }

      setRecalcMessage(`Cascading Rollup Complete: ${updatedCount} goals refreshed with active ground truth.`);
      setTimeout(() => setRecalcMessage(null), 4000);
    } catch (err: any) {
      setRecalcMessage(`Rollup error: ${err.message}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Toggle Key Result checkbox
  const handleToggleKeyResult = async (goal: GoalItem, krId: string) => {
    if (!goal.keyResults) return;
    const updatedKrs = goal.keyResults.map(kr => kr.id === krId ? { ...kr, done: !kr.done } : kr);
    const completedCount = updatedKrs.filter(kr => kr.done).length;
    const newProgress = Math.round((completedCount / updatedKrs.length) * 100);

    await db.goals.update(goal.id, {
      keyResults: updatedKrs,
      progress: goal.autoRollup !== false ? newProgress : goal.progress,
      status: (goal.autoRollup !== false && newProgress >= 100) ? 'Achieved' : goal.status,
      updatedAt: Date.now()
    });

    // Automatically trigger cascading ripple upwards
    if (goal.autoRollup !== false) {
      setTimeout(() => executeCascadingRollup(), 100);
    }
  };

  // Add Key Result in form
  const handleAddKeyResult = () => {
    if (!newKrInput.trim()) return;
    setKeyResultsList(prev => [
      ...prev,
      { id: `kr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, text: newKrInput.trim(), done: false }
    ]);
    setNewKrInput('');
  };

  const handleRemoveKeyResult = (id: string) => {
    setKeyResultsList(prev => prev.filter(kr => kr.id !== id));
  };

  // Direct manual progress update
  const handleUpdateProgress = async (id: string, newP: number) => {
    await db.goals.update(id, {
      progress: Math.min(100, Math.max(0, newP)),
      status: newP >= 100 ? 'Achieved' : 'Active',
      autoRollup: false, // Manual override pauses auto-rollup for this specific goal
      updatedAt: Date.now()
    });
  };

  // Reset to auto-rollup
  const handleReenableAutoRollup = async (goal: GoalItem) => {
    const rolledProgress = calculateGoalRollup({ ...goal, autoRollup: true }, goals, projects, tasks);
    await db.goals.update(goal.id, {
      autoRollup: true,
      progress: rolledProgress,
      status: rolledProgress >= 100 ? 'Achieved' : 'Active',
      updatedAt: Date.now()
    });
  };

  // Delete Goal
  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Delete this goal and unlink subordinate items?')) {
      await db.goals.delete(id);
    }
  };

  // Open modal for creating or editing
  const handleOpenAddModal = (editGoal?: GoalItem) => {
    if (editGoal) {
      setEditingGoalId(editGoal.id);
      setTitle(editGoal.title);
      setLevel(editGoal.level);
      setLifeArea(editGoal.lifeArea);
      setProgress(editGoal.progress);
      setParentId(editGoal.parentId || '');
      setTargetDate(editGoal.targetDate || '');
      setAutoRollup(editGoal.autoRollup !== false);
      setKeyResultsList(editGoal.keyResults || []);
      setLinkedProjectsList(editGoal.linkedProjectIds || []);
    } else {
      setEditingGoalId(null);
      setTitle('');
      setLevel('1-Year');
      setLifeArea('Spiritual & Inner');
      setProgress(20);
      setParentId('');
      setTargetDate('');
      setAutoRollup(true);
      setKeyResultsList([]);
      setLinkedProjectsList([]);
    }
    setNewKrInput('');
    setShowAddModal(true);
  };

  // Save Goal
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = Date.now();
    let calculatedProgress = progress;

    if (autoRollup && keyResultsList.length > 0) {
      const completed = keyResultsList.filter(kr => kr.done).length;
      calculatedProgress = Math.round((completed / keyResultsList.length) * 100);
    }

    const goalData: GoalItem = {
      id: editingGoalId || `goal-${now}`,
      title: title.trim(),
      level,
      status: calculatedProgress >= 100 ? 'Achieved' : 'Active',
      progress: calculatedProgress,
      lifeArea,
      parentId: parentId || undefined,
      targetDate: targetDate || undefined,
      autoRollup,
      keyResults: keyResultsList.length > 0 ? keyResultsList : undefined,
      linkedProjectIds: linkedProjectsList.length > 0 ? linkedProjectsList : undefined,
      createdAt: editingGoalId ? (goals.find(g => g.id === editingGoalId)?.createdAt || now) : now,
      updatedAt: now
    };

    if (editingGoalId) {
      await db.goals.put(goalData);
    } else {
      await db.goals.add(goalData);
    }

    setShowAddModal(false);
    // Trigger rollup ripple
    setTimeout(() => executeCascadingRollup(), 100);
  };

  const filteredGoals = goals.filter(g => selectedArea === 'All' || g.lifeArea === selectedArea);

  // Parent goal options based on selected level
  const currentLevelIndex = pyramidLevels.indexOf(level);
  const eligibleParentTiers = currentLevelIndex > 0 ? [pyramidLevels[currentLevelIndex - 1]] : [];
  const eligibleParents = goals.filter(g => eligibleParentTiers.includes(g.level));

  // Compute overall life area analytics
  const lifeAreaStats = lifeAreas.map(area => {
    const areaGoals = goals.filter(g => g.lifeArea === area);
    const avgProg = areaGoals.length > 0 
      ? Math.round(areaGoals.reduce((acc, g) => acc + g.progress, 0) / areaGoals.length)
      : 0;
    return {
      area,
      count: areaGoals.length,
      avgProg,
      achieved: areaGoals.filter(g => g.status === 'Achieved').length
    };
  });

  return (
    <div data-ag-id="GoalsPyramid_Root_Workspace" className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="text-indigo-400" size={22} />
            <span>Goals & Life Pyramid Architecture</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Cascade your ultimate Life Vision down through 10Y, 5Y, and 1Y milestones into Quarterly OKRs with mathematical rollup calculation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={executeCascadingRollup}
            disabled={isRecalculating}
            className="bg-[#202538] hover:bg-[#282f48] border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2"
            title="Recalculate dynamic progress from Key Results and cascading subordinate tiers"
          >
            <RefreshCw size={14} className={isRecalculating ? 'animate-spin' : ''} />
            <span>{isRecalculating ? 'Calculating...' : 'Recalculate Rollups'}</span>
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Life Goal</span>
          </button>
        </div>
      </div>

      {/* Recalc Alert Notification */}
      {recalcMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <Calculator size={16} className="text-indigo-400" />
          <span>{recalcMessage}</span>
        </div>
      )}

      {/* Holistic Life Area Balance Dashboard */}
      <div className="bg-[#141622] border border-[#24293d] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            Holistic Life Balance & Health Metrics
          </span>
          <span className="font-mono text-[11px] text-gray-500">
            Total Active Goals: {goals.filter(g => g.status === 'Active').length} | Achieved: {goals.filter(g => g.status === 'Achieved').length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {lifeAreaStats.map(stat => (
            <div 
              key={stat.area}
              onClick={() => setSelectedArea(selectedArea === stat.area ? 'All' : stat.area)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedArea === stat.area
                  ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                  : 'bg-[#181a26] border-[#252a3b] hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-medium text-white truncate" title={stat.area}>{stat.area}</span>
                <span className="font-mono font-bold text-indigo-400">{stat.avgProg}%</span>
              </div>
              <div className="w-full bg-[#10121a] h-1.5 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                  style={{ width: `${stat.avgProg}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>{stat.count} Goals</span>
                <span>{stat.achieved} Done</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter by Life Area Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', ...lifeAreas].map(area => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              selectedArea === area
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#181a24] text-gray-400 hover:text-white border border-[#272b3b]'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* The Visual Pyramid Levels (Cascading Downwards L5 -> L1) */}
      <div className="space-y-4">
        {pyramidLevels.map((lvl, index) => {
          const levelGoals = filteredGoals.filter(g => g.level === lvl);
          const levelColors = [
            'border-amber-500/40 bg-[#1f1e18]/40 text-amber-300', // Vision (L5)
            'border-purple-500/40 bg-[#1e1927]/40 text-purple-300', // 10-Year (L4)
            'border-indigo-500/40 bg-[#1a1e2d]/40 text-indigo-300', // 5-Year (L3)
            'border-emerald-500/40 bg-[#162121]/40 text-emerald-300', // 1-Year (L2)
            'border-cyan-500/40 bg-[#162028]/40 text-cyan-300', // OKRs (L1)
          ];

          return (
            <div
              key={lvl}
              className={`rounded-2xl border p-5 ${levelColors[index]} backdrop-blur-sm shadow-sm transition-all`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs font-mono">
                    L{5 - index}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">{lvl}</h3>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {index === 0 ? 'Top Anchor • Highest Purpose' : `Cascades from ${pyramidLevels[index - 1]}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-black/30">
                    {levelGoals.length} {levelGoals.length === 1 ? 'Goal' : 'Goals'}
                  </span>
                </div>
              </div>

              {levelGoals.length === 0 ? (
                <div className="py-4 text-center text-gray-500 text-xs italic">
                  No active goals set at the {lvl} level yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {levelGoals.map(goal => {
                    const isExpanded = expandedGoalIds.has(goal.id);
                    const parentGoal = goal.parentId ? goals.find(g => g.id === goal.parentId) : null;
                    const childGoals = goals.filter(g => g.parentId === goal.id);
                    const linkedProjects = goal.linkedProjectIds ? projects.filter(p => goal.linkedProjectIds!.includes(p.id)) : [];
                    const computedRollup = calculateGoalRollup(goal, goals, projects, tasks);

                    return (
                      <div
                        key={goal.id}
                        className="bg-[#141622]/90 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-md"
                      >
                        {/* Top Metadata */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                            <span className="text-indigo-300 font-medium">{goal.lifeArea}</span>
                            <div className="flex items-center gap-1.5">
                              {goal.targetDate && (
                                <span className="flex items-center gap-1 text-gray-400 font-mono">
                                  <Calendar size={11} /> {goal.targetDate}
                                </span>
                              )}
                              <span className="font-mono text-white font-bold">{goal.progress}%</span>
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-white leading-snug">
                              {goal.title}
                            </h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenAddModal(goal)}
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                                title="Edit Goal"
                              >
                                <Sparkles size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors"
                                title="Delete Goal"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Parent Goal Tag */}
                          {parentGoal && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded-md w-fit">
                              <ArrowDown size={10} className="rotate-180 text-indigo-400" />
                              <span>Rolls up to: <strong className="text-gray-300">{parentGoal.title}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar & Cascading Rollup Badge */}
                        <div>
                          <div className="w-full bg-[#1b1f2e] h-2 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-emerald-400 font-semibold">
                                {goal.status}
                              </span>
                              {goal.autoRollup !== false ? (
                                <span className="bg-indigo-900/40 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/20 text-[9px] font-mono flex items-center gap-0.5" title="Progress dynamically rolls up from Key Results and child milestones">
                                  <Calculator size={9} /> Auto-Rollup ({computedRollup}%)
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleReenableAutoRollup(goal)}
                                  className="text-amber-400 hover:text-amber-300 underline text-[9px] font-mono"
                                  title="Click to resume dynamic cascading calculation"
                                >
                                  Manual Override (Resume Rollup)
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => toggleExpand(goal.id)}
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium text-[10px]"
                            >
                              <span>{isExpanded ? 'Hide Details' : 'Key Results & Links'}</span>
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                          </div>

                          {/* Quick manual progress update bar */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5">
                            <span className="text-[9px] text-gray-500">Quick set:</span>
                            <div className="flex items-center gap-1">
                              {[0, 25, 50, 75, 100].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleUpdateProgress(goal.id, val)}
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                                    goal.progress === val
                                      ? 'bg-indigo-600 text-white font-bold'
                                      : 'bg-[#1b1f2e] text-gray-400 hover:text-white'
                                  }`}
                                >
                                  {val}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Section: Key Results & Subordinates */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-white/10 space-y-3 bg-[#0f111a]/60 -mx-4 -mb-4 p-3 rounded-b-xl">
                            {/* Key Results Checklist */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300 mb-1.5">
                                <span className="flex items-center gap-1 text-cyan-400">
                                  <ListChecks size={13} /> Key Results (Measurable Outcomes)
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                  {goal.keyResults ? `${goal.keyResults.filter(kr => kr.done).length}/${goal.keyResults.length}` : '0/0'}
                                </span>
                              </div>

                              {(!goal.keyResults || goal.keyResults.length === 0) ? (
                                <p className="text-[10px] text-gray-500 italic">No Key Results defined yet. Edit goal to add quantifiable metrics.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {goal.keyResults.map(kr => (
                                    <div
                                      key={kr.id}
                                      onClick={() => handleToggleKeyResult(goal, kr.id)}
                                      className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                        kr.done 
                                          ? 'bg-emerald-950/20 border-emerald-500/30 text-gray-300' 
                                          : 'bg-[#161826] border-[#252a3b] text-white hover:border-gray-500'
                                      }`}
                                    >
                                      <div className={`w-3.5 h-3.5 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                                        kr.done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-gray-500 bg-[#121420]'
                                      }`}>
                                        {kr.done && <Check size={11} strokeWidth={3} />}
                                      </div>
                                      <span className={`text-[11px] leading-tight ${kr.done ? 'line-through text-gray-400' : ''}`}>
                                        {kr.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Linked Projects */}
                            {linkedProjects.length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                  <FolderKanban size={12} className="text-amber-400" /> Linked Projects ({linkedProjects.length})
                                </span>
                                <div className="grid grid-cols-1 gap-1">
                                  {linkedProjects.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-[#141624] px-2 py-1 rounded text-[10px] font-mono border border-white/5">
                                      <span className="text-gray-300 truncate max-w-[150px]">{p.name}</span>
                                      <span className="text-indigo-400 font-bold">{p.progress}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Subordinate Child Goals Cascading Underneath */}
                            {childGoals.length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                  <Layers size={12} className="text-indigo-400" /> Subordinate Cascading Goals ({childGoals.length})
                                </span>
                                <div className="space-y-1">
                                  {childGoals.map(c => (
                                    <div key={c.id} className="flex items-center justify-between bg-[#141624] px-2 py-1 rounded text-[10px] border border-white/5">
                                      <span className="text-gray-300 truncate max-w-[160px]">{c.title}</span>
                                      <div className="flex items-center gap-1 font-mono text-[9px]">
                                        <span className="text-gray-500">{c.level}</span>
                                        <span className="text-emerald-400 font-bold">{c.progress}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Goal Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d2c] border border-[#2e344d] w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Compass className="text-indigo-400" size={20} />
              <span>{editingGoalId ? 'Edit Life Pyramid Goal' : 'Define New Life Pyramid Goal'}</span>
            </h3>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Goal Statement / North Star Objective *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Sankhya & Advaita Vedanta philosophy"
                  className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Pyramid Tier</label>
                  <select
                    value={level}
                    onChange={(e: any) => {
                      setLevel(e.target.value);
                      setParentId(''); // reset parent when tier changes
                    }}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Life Vision">L5: Life Vision (Ultimate Dharma)</option>
                    <option value="10-Year">L4: 10-Year (Decadal Anchor)</option>
                    <option value="5-Year">L3: 5-Year (Strategic Horizon)</option>
                    <option value="1-Year">L2: 1-Year (Annual Milestone)</option>
                    <option value="Quarterly OKR">L1: Quarterly OKR (90-Day Execution)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Life Area</label>
                  <select
                    value={lifeArea}
                    onChange={(e: any) => setLifeArea(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {lifeAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parent Goal Cascading Link */}
              {eligibleParents.length > 0 && (
                <div>
                  <label className="text-xs text-gray-300 block mb-1">
                    Cascading Parent Goal (Higher Tier Milestone)
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- No Direct Parent (Autonomous) --</option>
                    {eligibleParents.map(parent => (
                      <option key={parent.id} value={parent.id}>
                        [{parent.level}] {parent.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Target Horizon / Date</label>
                  <input
                    type="text"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    placeholder="e.g. Q4 2026 or 2030"
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Calculation Engine</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="autoRollupCheck"
                      checked={autoRollup}
                      onChange={(e) => setAutoRollup(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    <label htmlFor="autoRollupCheck" className="text-xs text-gray-300 cursor-pointer">
                      Auto-Rollup from KRs & Subordinates
                    </label>
                  </div>
                </div>
              </div>

              {/* Key Results Builder */}
              <div className="bg-[#141622] p-3 rounded-xl border border-[#272b3b] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <ListChecks size={14} /> Key Results (Quantifiable Objectives)
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{keyResultsList.length} defined</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newKrInput}
                    onChange={(e) => setNewKrInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyResult(); } }}
                    placeholder="e.g. Complete 50 hours of audio lectures..."
                    className="flex-1 bg-[#1a1d2c] border border-[#2b3147] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyResult}
                    className="bg-[#282f48] hover:bg-[#343d5e] text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Add KR
                  </button>
                </div>

                {keyResultsList.length > 0 && (
                  <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto">
                    {keyResultsList.map(kr => (
                      <div key={kr.id} className="flex items-center justify-between bg-[#191b29] px-2 py-1.5 rounded-lg text-xs border border-white/5">
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={kr.done}
                            onChange={() => {
                              setKeyResultsList(prev => prev.map(k => k.id === kr.id ? { ...k, done: !k.done } : k));
                            }}
                            className="accent-emerald-500 rounded"
                          />
                          <span className={`text-[11px] truncate ${kr.done ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                            {kr.text}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyResult(kr.id)}
                          className="text-gray-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Projects (For Quarterly OKRs or 1-Year Milestones) */}
              {projects.length > 0 && (
                <div className="bg-[#141622] p-3 rounded-xl border border-[#272b3b] space-y-2">
                  <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <FolderKanban size={14} className="text-amber-400" /> Link to Ground Projects
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pt-1">
                    {projects.map(proj => {
                      const isLinked = linkedProjectsList.includes(proj.id);
                      return (
                        <label 
                          key={proj.id} 
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer border ${
                            isLinked ? 'bg-indigo-950/40 border-indigo-500/50 text-white' : 'bg-[#181a26] border-transparent text-gray-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={() => {
                              setLinkedProjectsList(prev => 
                                isLinked ? prev.filter(id => id !== proj.id) : [...prev, proj.id]
                              );
                            }}
                            className="accent-indigo-600 rounded"
                          />
                          <span className="truncate text-[11px]">{proj.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manual Progress Slider (If not in auto-rollup mode) */}
              {!autoRollup && (
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Manual Progress ({progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b3147]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  {editingGoalId ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
