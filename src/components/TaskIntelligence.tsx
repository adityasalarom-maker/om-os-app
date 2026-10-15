import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskItem } from '../db';
import { 
  CheckSquare, 
  Plus, 
  Circle, 
  CheckCircle2, 
  LayoutGrid, 
  List, 
  Columns, 
  Filter, 
  Calendar, 
  Zap, 
  Trash2,
  Tag
} from 'lucide-react';

export const TaskIntelligence: React.FC = () => {
  const [activeView, setActiveView] = useState<'eisenhower' | 'kanban' | 'list'>('eisenhower');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newQuadrant, setNewQuadrant] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [newEnergy, setNewEnergy] = useState<'Deep Work' | 'Low Energy' | 'Quick Win'>('Deep Work');
  const [newDeadline, setNewDeadline] = useState('');
  const [newProjectId, setNewProjectId] = useState('');

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];

  const filteredTasks = tasks.filter(task => {
    if (filterEnergy !== 'all' && task.energyRequired !== filterEnergy) return false;
    return true;
  });

  const handleToggleComplete = async (task: TaskItem) => {
    await db.tasks.update(task.id, {
      isCompleted: !task.isCompleted,
      status: !task.isCompleted ? 'Done' : 'To Do',
      updatedAt: Date.now()
    });
  };

  const handleDeleteTask = async (id: string) => {
    await db.tasks.delete(id);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const now = Date.now();
    const priorityMap = {
      Q1: 'Urgent & Important' as const,
      Q2: 'Important Not Urgent' as const,
      Q3: 'Urgent Not Important' as const,
      Q4: 'Neither' as const
    };

    await db.tasks.add({
      id: `task-${now}`,
      title: newTitle.trim(),
      projectId: newProjectId || undefined,
      status: 'To Do',
      priority: priorityMap[newQuadrant],
      quadrant: newQuadrant,
      deadline: newDeadline || undefined,
      urgency: newQuadrant === 'Q1' || newQuadrant === 'Q3' ? 'High' : 'Low',
      impact: newQuadrant === 'Q1' || newQuadrant === 'Q2' ? 'High' : 'Low',
      energyRequired: newEnergy,
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    });

    setNewTitle('');
    setNewDeadline('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-indigo-400" size={22} />
            <span>Task Intelligence Matrix</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Prioritize by cognitive impact, urgency, and energy rather than reactive firefighting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggles */}
          <div className="bg-[#141622] p-1 rounded-xl border border-[#282d3e] flex items-center">
            <button
              onClick={() => setActiveView('eisenhower')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                activeView === 'eisenhower' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-white'
              }`}
              title="Eisenhower Matrix"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Eisenhower</span>
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                activeView === 'kanban' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-white'
              }`}
              title="Kanban Board"
            >
              <Columns size={15} />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                activeView === 'list' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <List size={15} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Energy Filter */}
          <select
            value={filterEnergy}
            onChange={(e) => setFilterEnergy(e.target.value)}
            className="bg-[#141622] border border-[#282d3e] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">⚡ All Energy Levels</option>
            <option value="Deep Work">🧠 Deep Work Only</option>
            <option value="Quick Win">⚡ Quick Wins</option>
            <option value="Low Energy">🌿 Low Energy</option>
          </select>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Eisenhower Matrix (4 Quadrants) */}
      {activeView === 'eisenhower' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Q1: Do First (Urgent & Important) */}
          <div className="bg-[#181a24] border border-rose-500/30 rounded-2xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-rose-300 tracking-wide uppercase">
                  Q1 • Urgent & Important (Do First)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                {filteredTasks.filter(t => t.quadrant === 'Q1' && !t.isCompleted).length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {filteredTasks.filter(t => t.quadrant === 'Q1').map(task => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} onDelete={handleDeleteTask} />
              ))}
            </div>
          </div>

          {/* Q2: Schedule (Important Not Urgent - Deep Work Core) */}
          <div className="bg-[#181a24] border border-indigo-500/30 rounded-2xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h3 className="text-xs font-bold text-indigo-300 tracking-wide uppercase">
                  Q2 • Important Not Urgent (Schedule / Deep Work)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {filteredTasks.filter(t => t.quadrant === 'Q2' && !t.isCompleted).length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {filteredTasks.filter(t => t.quadrant === 'Q2').map(task => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} onDelete={handleDeleteTask} />
              ))}
            </div>
          </div>

          {/* Q3: Delegate / Quick Wins (Urgent Not Important) */}
          <div className="bg-[#181a24] border border-amber-500/30 rounded-2xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="text-xs font-bold text-amber-300 tracking-wide uppercase">
                  Q3 • Urgent Not Important (Delegate / Batch)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {filteredTasks.filter(t => t.quadrant === 'Q3' && !t.isCompleted).length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {filteredTasks.filter(t => t.quadrant === 'Q3').map(task => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} onDelete={handleDeleteTask} />
              ))}
            </div>
          </div>

          {/* Q4: Eliminate / Backlog (Neither Urgent nor Important) */}
          <div className="bg-[#181a24] border border-gray-600/30 rounded-2xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                <h3 className="text-xs font-bold text-gray-400 tracking-wide uppercase">
                  Q4 • Backlog & Someday (Eliminate / Minimize)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full">
                {filteredTasks.filter(t => t.quadrant === 'Q4' && !t.isCompleted).length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {filteredTasks.filter(t => t.quadrant === 'Q4').map(task => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} onDelete={handleDeleteTask} />
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: Kanban Columns */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['To Do', 'In Progress', 'Done'].map(statusCol => (
            <div key={statusCol} className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#272b3b] mb-3">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{statusCol}</h3>
                <span className="text-[11px] font-mono text-gray-500 bg-[#141622] px-2 py-0.5 rounded-full">
                  {filteredTasks.filter(t => t.status === statusCol).length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {filteredTasks.filter(t => t.status === statusCol).map(task => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} onDelete={handleDeleteTask} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: List View */}
      {activeView === 'list' && (
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 space-y-2">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} onDelete={handleDeleteTask} />
          ))}
        </div>
      )}

      {/* Task Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d2c] border border-[#2e344d] w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Task Title / Action</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Set up two-way Google Sheets sync bridge"
                  className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Eisenhower Quadrant</label>
                  <select
                    value={newQuadrant}
                    onChange={(e: any) => setNewQuadrant(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Q1">Q1: Urgent & Important</option>
                    <option value="Q2">Q2: Important Not Urgent (Deep Work)</option>
                    <option value="Q3">Q3: Urgent Not Important (Quick)</option>
                    <option value="Q4">Q4: Backlog / Someday</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Energy Required</label>
                  <select
                    value={newEnergy}
                    onChange={(e: any) => setNewEnergy(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Deep Work">🧠 Deep Work</option>
                    <option value="Quick Win">⚡ Quick Win</option>
                    <option value="Low Energy">🌿 Low Energy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Align with Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">(No specific project)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

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
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: TaskItem;
  onToggle: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  return (
    <div className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 group ${
      task.isCompleted 
        ? 'bg-[#151722]/50 border-[#232738] opacity-60' 
        : 'bg-[#1e2232] border-[#2c3246] hover:border-indigo-500/40 hover:bg-[#23283b]'
    }`}>
      <div className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(task)}>
        <button className="mt-0.5 text-gray-400 group-hover:text-indigo-400 transition-colors">
          {task.isCompleted ? <CheckCircle2 size={17} className="text-emerald-400" /> : <Circle size={17} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium leading-snug ${
            task.isCompleted ? 'line-through text-gray-500' : 'text-gray-200 group-hover:text-white'
          }`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[#141622] text-gray-400 border border-[#282d3e]">
              ⚡ {task.energyRequired}
            </span>
            {task.deadline && (
              <span className="text-[9px] text-amber-400/90 font-mono">
                📅 {task.deadline}
              </span>
            )}
          </div>
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 transition-opacity p-1"
        title="Delete Task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
