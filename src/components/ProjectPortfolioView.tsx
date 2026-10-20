import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  type Project, 
  type TaskItem, 
  type GoalItem, 
  type ProjectMilestone,
  type ResearchInquiry,
  type KnowledgeItem
} from '../db';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Compass, 
  CheckSquare, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  X, 
  Edit3, 
  Trash2, 
  ArrowUpRight, 
  ShieldAlert, 
  Layers, 
  BarChart3,
  Flame,
  ListTodo,
  TrendingUp,
  Tag
} from 'lucide-react';

interface ProjectPortfolioViewProps {
  onNavigateToTasks?: (projectId?: string) => void;
  onNavigateToGoals?: () => void;
}

export const ProjectPortfolioView: React.FC<ProjectPortfolioViewProps> = ({
  onNavigateToTasks,
  onNavigateToGoals
}) => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'roadmap'>('cockpit');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Quick Task Add state
  const [taskAddProjectId, setTaskAddProjectId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Quick Milestone Add state
  const [milestoneAddProjectId, setMilestoneAddProjectId] = useState<string | null>(null);
  const [quickMilestoneTitle, setQuickMilestoneTitle] = useState('');
  const [quickMilestoneDate, setQuickMilestoneDate] = useState('');

  // New Project Form State
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'On Hold' | 'Completed'>('In Progress');
  const [deadline, setDeadline] = useState('');
  const [goalId, setGoalId] = useState('');
  const [budget, setBudget] = useState('');
  const [tags, setTags] = useState('Architecture, Strategic');
  const [notes, setNotes] = useState('');

  // Toast notification
  const [notification, setNotification] = useState('');

  // Live queries from Dexie
  const projects = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const researchInquiries = useLiveQuery(() => db.researchInquiries?.toArray() || Promise.resolve([]), []) || [];
  const knowledge = useLiveQuery(() => db.knowledge.toArray(), []) || [];

  // Goals Map for instant laddering lookup
  const goalsMap = useMemo(() => {
    const map = new Map<string, GoalItem>();
    for (const g of goals) map.set(g.id, g);
    return map;
  }, [goals]);

  // Dynamic Task Rollups and Formula-Derived Health Signals per project
  const projectRollups = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, {
      totalTasks: number;
      completedTasks: number;
      rollupProgress: number;
      researchCount: number;
      knowledgeCount: number;
      derivedHealth: 'On Track' | 'At Risk' | 'Behind' | 'Critical';
      daysRemaining: number | null;
      isOverdue: boolean;
    }>();

    for (const proj of projects) {
      const pTasks = tasks.filter(t => t.projectId === proj.id);
      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter(t => t.isCompleted || t.status === 'Done').length;
      const rollupProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (proj.progress || 0);

      const rCount = researchInquiries.filter(r => r.relatedProjectIds?.includes(proj.id)).length;
      const kCount = knowledge.filter(k => k.projectId === proj.id).length;

      let daysRemaining: number | null = null;
      let isOverdue = false;

      if (proj.deadline) {
        const deadlineTime = new Date(proj.deadline).getTime();
        daysRemaining = Math.ceil((deadlineTime - now) / (1000 * 60 * 60 * 24));
        isOverdue = daysRemaining < 0 && rollupProgress < 100;
      }

      // Formula-derived health status
      let derivedHealth: 'On Track' | 'At Risk' | 'Behind' | 'Critical' = 'On Track';
      if (proj.status === 'Completed' || rollupProgress === 100) {
        derivedHealth = 'On Track';
      } else if (isOverdue) {
        derivedHealth = 'Behind';
      } else if (daysRemaining !== null && daysRemaining <= 5 && rollupProgress < 40) {
        derivedHealth = 'Critical';
      } else if (daysRemaining !== null && daysRemaining <= 14 && rollupProgress < 50) {
        derivedHealth = 'At Risk';
      }

      map.set(proj.id, {
        totalTasks,
        completedTasks,
        rollupProgress,
        researchCount: rCount,
        knowledgeCount: kCount,
        derivedHealth,
        daysRemaining,
        isOverdue
      });
    }

    return map;
  }, [projects, tasks, researchInquiries, knowledge]);

  // Overall Portfolio Metrics
  const portfolioMetrics = useMemo(() => {
    const total = projects.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let criticalOrBehindCount = 0;
    let totalRollupProgress = 0;

    for (const proj of projects) {
      const r = projectRollups.get(proj.id);
      if (proj.status === 'Completed' || (r && r.rollupProgress === 100)) completedCount++;
      else inProgressCount++;

      if (r && (r.derivedHealth === 'Behind' || r.derivedHealth === 'Critical')) {
        criticalOrBehindCount++;
      }
      totalRollupProgress += r ? r.rollupProgress : (proj.progress || 0);
    }

    const avgProgress = total > 0 ? Math.round(totalRollupProgress / total) : 0;
    return { total, completedCount, inProgressCount, criticalOrBehindCount, avgProgress };
  }, [projects, projectRollups]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesTags = p.tags ? p.tags.some(t => t.toLowerCase().includes(q)) : false;
        const linkedGoal = p.goalId ? goalsMap.get(p.goalId) : null;
        const matchesGoal = linkedGoal ? linkedGoal.title.toLowerCase().includes(q) : false;
        return matchesName || matchesTags || matchesGoal;
      }
      return true;
    });
  }, [projects, statusFilter, priorityFilter, searchQuery, goalsMap]);

  // Toggle Sub-Milestone
  const handleToggleMilestone = async (project: Project, milestoneId: string) => {
    const milestones = project.milestones || [];
    const updated = milestones.map(m => m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m);
    await db.projects.update(project.id, {
      milestones: updated,
      updatedAt: Date.now()
    });
    setNotification('Toggled milestone status');
  };

  // Add Quick Sub-Milestone
  const handleAddMilestone = async (projectId: string) => {
    if (!quickMilestoneTitle.trim()) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newMilestone: ProjectMilestone = {
      id: `ms-${Date.now()}`,
      title: quickMilestoneTitle.trim(),
      targetDate: quickMilestoneDate.trim() || undefined,
      isCompleted: false
    };

    const updated = [...(project.milestones || []), newMilestone];
    await db.projects.update(projectId, {
      milestones: updated,
      updatedAt: Date.now()
    });

    setMilestoneAddProjectId(null);
    setQuickMilestoneTitle('');
    setQuickMilestoneDate('');
    setNotification(`Added milestone to "${project.name}"`);
  };

  // Quick Add Task associated with Project
  const handleQuickAddTask = async (projectId: string) => {
    if (!quickTaskTitle.trim()) return;
    const now = Date.now();
    const newTask: TaskItem = {
      id: `task-${now}`,
      title: quickTaskTitle.trim(),
      projectId,
      status: 'To Do',
      priority: 'Important Not Urgent',
      quadrant: 'Q2',
      urgency: 'Medium',
      impact: 'High',
      energyRequired: 'Deep Work',
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    };

    await db.tasks.add(newTask);
    setTaskAddProjectId(null);
    setQuickTaskTitle('');
    setNotification(`Added task to project! Progress rollup will recalculate automatically.`);
  };

  // Change Project Goal Linkage
  const handleLinkGoal = async (projectId: string, newGoalId: string) => {
    await db.projects.update(projectId, {
      goalId: newGoalId || undefined,
      updatedAt: Date.now()
    });
    setNotification('Updated Life Goals Pyramid laddering');
  };

  // Create New Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = Date.now();
    const rawTags = tags.split(',').map(t => t.trim()).filter(Boolean);

    const newProj: Project = {
      id: `proj-${now}`,
      name: name.trim(),
      status,
      priority,
      healthStatus: 'On Track',
      progress: 0,
      deadline: deadline.trim() || undefined,
      goalId: goalId || undefined,
      budget: budget.trim() || undefined,
      tags: rawTags,
      notes: notes.trim() || undefined,
      milestones: [
        { id: `ms-${now}-1`, title: 'Phase 1: Architecture & Foundations', isCompleted: false },
        { id: `ms-${now}-2`, title: 'Phase 2: Execution & Verification', isCompleted: false },
        { id: `ms-${now}-3`, title: 'Phase 3: Operational Deployment', isCompleted: false }
      ],
      createdAt: now,
      updatedAt: now
    };

    await db.projects.add(newProj);
    setIsNewProjectModalOpen(false);
    setName('');
    setDeadline('');
    setBudget('');
    setNotes('');
    setNotification(`Project "${newProj.name}" created with Life Goal link!`);
  };

  // Delete Project
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this project from your portfolio?')) return;
    await db.projects.delete(id);
    setNotification('Project removed from portfolio');
  };

  const getHealthBadge = (health: 'On Track' | 'At Risk' | 'Behind' | 'Critical') => {
    if (health === 'Behind') return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (health === 'Critical') return 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse';
    if (health === 'At Risk') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 select-none">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#1e2336] border border-indigo-500/40 text-indigo-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b] shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <FolderKanban size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Project Portfolio Roadmap & Task Rollups</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  Notion OS Engine
                </span>
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Formula-derived progress rollups from active tasks • Life Goals Pyramid laddering • Milestone timelines
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Strategic Project</span>
        </button>
      </div>

      {/* Critical Deadline Alert Banner */}
      {portfolioMetrics.criticalOrBehindCount > 0 && (
        <div className="bg-[#1f191a] border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>{portfolioMetrics.criticalOrBehindCount} Project(s) Require Immediate Triage</span>
              </h4>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Deadline alerts triggered by overdue completion or lagging task rollups. Re-scope deadlines or resolve blocked dependencies.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('all')}
            className="text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold px-3 py-1.5 rounded-xl border border-rose-500/30 transition-colors whitespace-nowrap"
          >
            Review Alerts
          </button>
        </div>
      )}

      {/* Portfolio KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
            <Layers size={14} className="text-indigo-400" />
            <span>Total Projects</span>
          </span>
          <span className="text-2xl font-bold text-white mt-1 font-mono">{portfolioMetrics.total}</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-indigo-400 flex items-center gap-1.5 font-medium">
            <TrendingUp size={14} />
            <span>In Flight</span>
          </span>
          <span className="text-2xl font-bold text-indigo-300 mt-1 font-mono">{portfolioMetrics.inProgressCount}</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={14} />
            <span>Completed</span>
          </span>
          <span className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{portfolioMetrics.completedCount}</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-cyan-400 flex items-center gap-1.5 font-medium">
            <BarChart3 size={14} />
            <span>Portfolio Completion</span>
          </span>
          <span className="text-2xl font-bold text-cyan-300 mt-1 font-mono">{portfolioMetrics.avgProgress}%</span>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181a24] p-3 rounded-2xl border border-[#272b3b]">
        
        {/* Tab Switcher: Cockpit vs Roadmap */}
        <div className="flex items-center gap-1 bg-[#141622] p-1 rounded-xl border border-[#272b3b]">
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'cockpit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderKanban size={13} />
            <span>Project Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'roadmap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={13} />
            <span>Milestone Roadmap</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141622] border border-[#272b3b] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Not Started">Not Started</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#141622] border border-[#272b3b] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, tags, goals..."
              className="w-full bg-[#141622] border border-[#272b3b] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: PROJECT COCKPIT BOARD */}
      {activeTab === 'cockpit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500 text-xs bg-[#181a24] border border-[#272b3b] rounded-2xl p-8">
              <FolderKanban size={42} className="mx-auto mb-3 text-gray-600" />
              <p className="font-semibold text-gray-300 text-sm">No strategic projects match this filter</p>
              <p className="mt-1">Click "New Strategic Project" above to initialize a project linked to the Life Goals Pyramid.</p>
            </div>
          ) : (
            filteredProjects.map(proj => {
              const rollup = projectRollups.get(proj.id) || {
                totalTasks: 0,
                completedTasks: 0,
                rollupProgress: proj.progress || 0,
                researchCount: 0,
                knowledgeCount: 0,
                derivedHealth: 'On Track' as const,
                daysRemaining: null,
                isOverdue: false
              };

              const linkedGoal = proj.goalId ? goalsMap.get(proj.goalId) : null;
              const milestones = proj.milestones || [];

              return (
                <div
                  key={proj.id}
                  className="bg-[#181a24] border border-[#272b3b] hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 group transition-all shadow-sm"
                >
                  <div>
                    {/* Header Badges: Priority + Derived Health */}
                    <div className="flex items-center justify-between text-[11px] mb-2.5">
                      <span className={`font-mono px-2 py-0.5 rounded-lg border ${
                        proj.priority === 'High' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-[#141622] text-gray-400 border-[#282d3e]'
                      }`}>
                        {proj.priority} Priority
                      </span>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getHealthBadge(rollup.derivedHealth)}`}>
                        {rollup.derivedHealth}
                      </span>
                    </div>

                    {/* Project Title */}
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                      {proj.name}
                    </h3>

                    {/* Life Goals Pyramid Laddering Pill */}
                    <div className="mt-2.5 bg-[#141622] p-2 rounded-xl border border-[#272b3b] flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Compass size={12} className="text-amber-400 shrink-0" />
                        <span className="text-gray-400 shrink-0">Life Goal:</span>
                        <span className="text-amber-300 font-semibold truncate" title={linkedGoal?.title || 'Unlinked'}>
                          {linkedGoal ? linkedGoal.title : 'No Goal Linked'}
                        </span>
                      </div>

                      <select
                        value={proj.goalId || ''}
                        onChange={(e) => handleLinkGoal(proj.id, e.target.value)}
                        className="bg-transparent text-[10px] text-indigo-400 focus:outline-none cursor-pointer max-w-[80px]"
                      >
                        <option value="" className="bg-[#181a24] text-gray-400">Link...</option>
                        {goals.map(g => (
                          <option key={g.id} value={g.id} className="bg-[#181a24] text-white">
                            {g.title.slice(0, 30)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Task Rollup Progress Bar */}
                    <div className="mt-3.5 space-y-1.5 pt-3 border-t border-[#252a3b]">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-gray-400 flex items-center gap-1">
                          <CheckSquare size={12} className="text-indigo-400" />
                          <span>{rollup.completedTasks} / {rollup.totalTasks} Tasks Completed</span>
                        </span>
                        <span className={`font-bold ${rollup.rollupProgress === 100 ? 'text-emerald-400' : 'text-indigo-300'}`}>
                          {rollup.rollupProgress}%
                        </span>
                      </div>

                      <div className="w-full bg-[#141622] h-2 rounded-full overflow-hidden border border-[#272b3b]">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            rollup.rollupProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${rollup.rollupProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Sub-Milestones Checklist */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span className="font-semibold text-gray-300">Milestones ({milestones.filter(m => m.isCompleted).length}/{milestones.length})</span>
                        <button
                          onClick={() => setMilestoneAddProjectId(milestoneAddProjectId === proj.id ? null : proj.id)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus size={11} />
                          <span>Add Milestone</span>
                        </button>
                      </div>

                      {/* Milestone Add Input */}
                      {milestoneAddProjectId === proj.id && (
                        <div className="bg-[#141622] p-2 rounded-xl border border-[#272b3b] space-y-2 animate-in fade-in">
                          <input
                            type="text"
                            value={quickMilestoneTitle}
                            onChange={(e) => setQuickMilestoneTitle(e.target.value)}
                            placeholder="Milestone name..."
                            className="w-full bg-[#181a24] border border-[#272b3b] rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="date"
                              value={quickMilestoneDate}
                              onChange={(e) => setQuickMilestoneDate(e.target.value)}
                              className="bg-[#181a24] border border-[#272b3b] rounded-lg px-2 py-1 text-gray-300 text-[10px]"
                            />
                            <button
                              onClick={() => handleAddMilestone(proj.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {milestones.map(m => (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(proj, m.id)}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#141622] transition-colors cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={m.isCompleted}
                              onChange={() => {}}
                              className="rounded border-[#2e344d] bg-[#141622] text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className={`text-[11px] flex-1 truncate ${m.isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                              {m.title}
                            </span>
                            {m.targetDate && (
                              <span className="text-[9px] font-mono text-gray-500 shrink-0">{m.targetDate}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deadline & Rollup Counts */}
                    <div className="mt-3 pt-3 border-t border-[#252a3b] flex items-center justify-between text-[11px] text-gray-400">
                      <span className={`flex items-center gap-1 font-mono text-[10px] ${
                        rollup.isOverdue ? 'text-rose-400 font-bold' : (rollup.daysRemaining !== null && rollup.daysRemaining <= 7 ? 'text-amber-400' : 'text-gray-400')
                      }`}>
                        <Calendar size={12} />
                        <span>{proj.deadline ? (rollup.isOverdue ? `Overdue by ${Math.abs(rollup.daysRemaining!)}d` : `Due in ${rollup.daysRemaining}d`) : 'No Deadline'}</span>
                      </span>

                      <div className="flex items-center gap-2 text-[10px]">
                        <span title="Linked Research Inquiries">🔬 {rollup.researchCount}</span>
                        <span title="Linked Knowledge Notes">📚 {rollup.knowledgeCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Quick Task Add */}
                  <div className="pt-2 border-t border-[#252a3b] space-y-2">
                    {taskAddProjectId === proj.id ? (
                      <div className="bg-[#141622] p-2 rounded-xl border border-indigo-500/40 space-y-2 animate-in fade-in">
                        <input
                          type="text"
                          value={quickTaskTitle}
                          onChange={(e) => setQuickTaskTitle(e.target.value)}
                          placeholder="Task title (instant rollup)..."
                          className="w-full bg-[#181a24] border border-[#272b3b] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setTaskAddProjectId(null)}
                            className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleQuickAddTask(proj.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setTaskAddProjectId(proj.id)}
                          className="flex-1 bg-[#141622] hover:bg-[#202538] text-gray-300 hover:text-white border border-[#272b3b] text-[11px] font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Add Task</span>
                        </button>

                        {onNavigateToTasks && (
                          <button
                            onClick={() => onNavigateToTasks(proj.id)}
                            className="p-1.5 bg-[#141622] hover:bg-[#202538] text-indigo-400 rounded-xl border border-[#272b3b] text-xs"
                            title="Filter Tasks by this Project"
                          >
                            <ArrowUpRight size={13} />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          className="p-1.5 bg-[#141622] hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-xl border border-[#272b3b] text-xs"
                          title="Delete Project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: MILESTONE ROADMAP (TIMELINE VIEW) */}
      {activeTab === 'roadmap' && (
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              <span>Strategic Project Milestone Timeline</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              Auto-calculated from active milestones & deadline targets
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {filteredProjects.map(proj => {
              const rollup = projectRollups.get(proj.id) || {
                totalTasks: 0,
                completedTasks: 0,
                rollupProgress: proj.progress || 0,
                derivedHealth: 'On Track' as const,
                daysRemaining: null,
                isOverdue: false
              };
              const milestones = proj.milestones || [];
              const linkedGoal = proj.goalId ? goalsMap.get(proj.goalId) : null;

              return (
                <div key={proj.id} className="bg-[#141622] border border-[#272b3b] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getHealthBadge(rollup.derivedHealth)}`}>
                          {rollup.derivedHealth}
                        </span>
                        <h4 className="font-bold text-white text-sm">{proj.name}</h4>
                      </div>
                      {linkedGoal && (
                        <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                          <Compass size={11} />
                          <span>Ladders into: {linkedGoal.title}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="text-indigo-300 font-bold">{rollup.rollupProgress}% Complete</span>
                      <span className="text-gray-500 text-[10px] block">
                        {proj.deadline ? `Target: ${proj.deadline}` : 'No Target Date'}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Timeline Track */}
                  <div className="space-y-1">
                    <div className="w-full bg-[#181a24] h-2.5 rounded-full overflow-hidden border border-[#272b3b]">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          rollup.rollupProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${rollup.rollupProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones along roadmap */}
                  {milestones.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#252a3b]">
                      {milestones.map((m, idx) => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestone(proj, m.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                            m.isCompleted 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-[#181a24] border-[#272b3b] text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={m.isCompleted}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                          <div className="overflow-hidden">
                            <span className={`font-semibold text-[11px] block truncate ${m.isCompleted ? 'line-through' : 'text-gray-200'}`}>
                              M{idx + 1}: {m.title}
                            </span>
                            {m.targetDate && (
                              <span className="text-[9px] font-mono text-gray-500">{m.targetDate}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="p-4 bg-[#141622] border-b border-[#252a3b] flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" />
                <span>Create Strategic Project</span>
              </h3>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-3.5">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Himalayan Land Title Demarcation & Survey"
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Life Goals Pyramid Relation</label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">-- No Direct Goal Link --</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>
                      [{g.level} • {g.lifeArea}] {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Not Started">Not Started</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Architecture, Due Diligence, High Altitude"
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Project Scope & Strategic Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key deliverables, risk mitigation notes..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#252a3b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3.5 py-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#202538]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-xl shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
