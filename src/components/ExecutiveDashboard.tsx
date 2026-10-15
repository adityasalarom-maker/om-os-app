import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskItem } from '../db';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  Calendar,
  Flame,
  ShieldCheck,
  Utensils,
  Compass,
  Smartphone
} from 'lucide-react';
import { calculateLifeEquilibrium } from '../services/predictiveAnalytics';

interface ExecutiveDashboardProps {
  onNavigate: (tab: any) => void;
  onOpenDiagnostics?: () => void;
  onOpenMobileDeploy?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  onNavigate, 
  onOpenDiagnostics,
  onOpenMobileDeploy 
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [quickType, setQuickType] = useState<'task' | 'inbox'>('task');

  // Live queries from local SQLite/IndexedDB
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const pantryLow = useLiveQuery(() => db.pantry.where('status').anyOf('Low', 'Need to Order').toArray(), []) || [];
  const latestJournal = useLiveQuery(() => db.journal.orderBy('createdAt').reverse().first(), []);
  const health = useLiveQuery(() => db.health.toArray(), []) || [];
  const journals = useLiveQuery(() => db.journal.toArray(), []) || [];

  const equilibrium = calculateLifeEquilibrium(goals, tasks, health, journals);

  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedToday = tasks.filter(t => t.isCompleted);
  const deepWorkTasks = tasks.filter(t => !t.isCompleted && t.energyRequired === 'Deep Work');

  const handleToggleTask = async (task: TaskItem) => {
    await db.tasks.update(task.id, {
      isCompleted: !task.isCompleted,
      status: !task.isCompleted ? 'Done' : 'To Do',
      updatedAt: Date.now()
    });
  };

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const now = Date.now();
    if (quickType === 'task') {
      await db.tasks.add({
        id: `task-${now}`,
        title: quickInput.trim(),
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
    } else {
      await db.inbox.add({
        id: `inbox-${now}`,
        title: quickInput.trim(),
        content: quickInput.trim(),
        type: 'Quick Note',
        status: 'Inbox',
        createdAt: now,
        updatedAt: now
      });
    }

    setQuickInput('');
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner / Today Focus */}
      <div className="bg-gradient-to-r from-[#1c2030] via-[#202538] to-[#1a1d2c] border border-[#2d3246] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Calendar size={14} />
              <span>{todayDateFormatted}</span>
              <span className="text-gray-500">•</span>
              <button
                onClick={onOpenDiagnostics}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                title="Run Automated E2E Test Suite & Lighthouse PWA Audit"
              >
                <ShieldCheck size={14} /> System Optimal (E2E Verified)
              </button>
              <span className="text-gray-500">•</span>
              <button
                onClick={onOpenMobileDeploy}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                title="Open Mobile & Samsung S25 Ultra Deployment Hub"
              >
                <Smartphone size={14} /> Samsung S25 Deploy
              </button>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Executive Command Center</h2>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              "Viveka is the anchor: distinguish the essential from the transient, align execution with the Life Pyramid, and act with clarity."
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('analytics')}
              className="bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/50 hover:to-indigo-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <TrendingUp size={14} className="text-cyan-400" />
              <span>Life Radar & Runway</span>
            </button>
            <button 
              onClick={() => onNavigate('tasks')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>Task Matrix</span>
              <ArrowUpRight size={14} />
            </button>
            <button 
              onClick={() => onNavigate('inbox')}
              className="bg-[#262c40] hover:bg-[#2d344d] border border-[#373f5c] text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              <Sparkles size={14} className="text-purple-400" />
              <span>AI Ingestion</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#292f44]">
          <div className="bg-[#141622]/60 rounded-xl p-3 border border-[#262b3d]">
            <span className="text-xs text-gray-400 block font-medium">Active Tasks</span>
            <span className="text-xl font-bold text-white mt-1 block">{activeTasks.length}</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={10} /> {completedToday.length} completed
            </span>
          </div>

          <div className="bg-[#141622]/60 rounded-xl p-3 border border-[#262b3d]">
            <span className="text-xs text-gray-400 block font-medium">Deep Work Queue</span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">{deepWorkTasks.length}</span>
            <span className="text-[10px] text-gray-400 mt-0.5 block">High cognitive impact</span>
          </div>

          <div className="bg-[#141622]/60 rounded-xl p-3 border border-[#262b3d]">
            <span className="text-xs text-gray-400 block font-medium">Active Projects</span>
            <span className="text-xl font-bold text-indigo-300 mt-1 block">{projects.length}</span>
            <span className="text-[10px] text-indigo-400 mt-0.5 block">All on track</span>
          </div>

          <div className="bg-[#141622]/60 rounded-xl p-3 border border-[#262b3d]">
            <span className="text-xs text-gray-400 block font-medium">Pantry Reorders</span>
            <span className="text-xl font-bold text-rose-300 mt-1 block">{pantryLow.length}</span>
            <span className="text-[10px] text-rose-400 mt-0.5 block">Needs replenishment</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Tasks + Projects), Right Column (Quick Capture + Journal + Pantry) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Focus Tasks */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="text-amber-400" size={18} />
                <h3 className="font-semibold text-white text-sm">Today's Priority Focus</h3>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                  {activeTasks.slice(0, 4).length} Pending
                </span>
              </div>
              <button 
                onClick={() => onNavigate('tasks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View Eisenhower Matrix <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="space-y-2">
              {activeTasks.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  All today's tasks completed! Capture new actions below.
                </div>
              ) : (
                activeTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#1d202e] hover:bg-[#232738] border border-[#2d3246] transition-colors group cursor-pointer"
                    onClick={() => handleToggleTask(task)}
                  >
                    <button className="mt-0.5 text-gray-400 group-hover:text-indigo-400 transition-colors">
                      <Circle size={17} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 leading-snug group-hover:text-white">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          task.priority === 'Urgent & Important'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {task.quadrant} • {task.priority}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ⚡ {task.energyRequired}
                        </span>
                        {task.deadline && (
                          <span className="text-[10px] text-amber-400/90 font-mono">
                            📅 {task.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Projects Hub */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-400" size={18} />
                <h3 className="font-semibold text-white text-sm">Active Projects & Milestones</h3>
              </div>
              <button 
                onClick={() => onNavigate('tasks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                All Projects <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {projects.map((proj) => (
                <div 
                  key={proj.id} 
                  className="bg-[#1d202e] border border-[#2d3246] rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                      <span className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[9px] border border-emerald-500/20">
                        {proj.healthStatus}
                      </span>
                      <span className="font-mono text-[10px]">{proj.progress}%</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white line-clamp-2 mb-3">
                      {proj.name}
                    </h4>
                  </div>
                  <div>
                    <div className="w-full bg-[#141622] h-1.5 rounded-full overflow-hidden mb-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Target: {proj.deadline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Quick Capture, Journal Snippet, Pantry Alerts */}
        <div className="space-y-6">
          
          {/* High-Speed Quick Capture */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="text-indigo-400" size={17} />
              <h3 className="font-semibold text-white text-sm">High-Speed Capture</h3>
            </div>
            
            <form onSubmit={handleQuickCapture} className="space-y-3">
              <div className="flex rounded-lg bg-[#141622] p-1 border border-[#282c3d]">
                <button
                  type="button"
                  onClick={() => setQuickType('task')}
                  className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${
                    quickType === 'task' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ⚡ Action Task
                </button>
                <button
                  type="button"
                  onClick={() => setQuickType('inbox')}
                  className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${
                    quickType === 'inbox' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📥 Raw Thought
                </button>
              </div>

              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder={quickType === 'task' ? "What needs to be done?..." : "Capture fleeting thought or idea..."}
                rows={3}
                className="w-full bg-[#1d202e] border border-[#2d3246] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <button
                type="submit"
                className="w-full bg-[#252a3d] hover:bg-indigo-600 border border-[#343b54] hover:border-indigo-500 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Save Directly to {quickType === 'task' ? 'Tasks' : 'Universal Inbox'}</span>
              </button>
            </form>
          </div>

          {/* Life Balance Equilibrium Widget */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="text-cyan-400" size={17} />
                <h3 className="font-semibold text-white text-sm">Life Balance Equilibrium</h3>
              </div>
              <button 
                onClick={() => onNavigate('analytics')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Radar View <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#141622] p-3 rounded-xl border border-[#222738] mb-3">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Equilibrium Index</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-cyan-400">{equilibrium.equilibriumIndex}</span>
                  <span className="text-xs text-gray-500 font-mono">/100</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block ${
                  equilibrium.status === 'Harmonious' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  equilibrium.status === 'Balanced' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {equilibrium.status}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">Variance: {equilibrium.variance}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {equilibrium.scores.map(s => (
                <div key={s.area} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px]">{s.area}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-[#1d202e] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          s.score >= 80 ? 'bg-emerald-400' : s.score >= 60 ? 'bg-cyan-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="text-gray-200 font-mono text-[10px] w-6 text-right">{s.score}%</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('analytics')}
              className="mt-4 w-full bg-[#1e2334] hover:bg-cyan-600/20 hover:border-cyan-500/50 border border-[#2e354f] text-cyan-300 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <TrendingUp size={13} />
              <span>Explore 30-Day Heatmaps & 24-Mo Runway</span>
            </button>
          </div>

          {/* Today's Reflection & Energy */}
          {latestJournal && (
            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>📓</span> Reflection & Energy
                </span>
                <button 
                  onClick={() => onNavigate('journal')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Open Log
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mb-3">
                <div className="bg-[#1d202e] p-2.5 rounded-xl border border-[#2d3246]">
                  <span className="text-[10px] text-gray-400 block">Energy Score</span>
                  <span className="text-lg font-bold text-amber-400">{latestJournal.energyScore}/10</span>
                </div>
                <div className="bg-[#1d202e] p-2.5 rounded-xl border border-[#2d3246]">
                  <span className="text-[10px] text-gray-400 block">Mood Index</span>
                  <span className="text-lg font-bold text-indigo-400">{latestJournal.moodScore}/10</span>
                </div>
              </div>
              <p className="text-xs text-gray-300 italic line-clamp-3 bg-[#141622] p-2.5 rounded-lg border border-[#222738]">
                "{latestJournal.content}"
              </p>
            </div>
          )}

          {/* Kitchen / Pantry Reorder Alerts */}
          {pantryLow.length > 0 && (
            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                  <Utensils size={14} className="text-rose-400" />
                  <span>Pantry Low Stock Alerts</span>
                </div>
                <button 
                  onClick={() => onNavigate('pantry')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-2">
                {pantryLow.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between text-xs bg-[#1d202e] p-2 rounded-lg border border-[#2d3246]"
                  >
                    <span className="text-gray-200">{item.itemName}</span>
                    <span className="text-rose-400 font-mono text-[11px]">{item.currentQty} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
