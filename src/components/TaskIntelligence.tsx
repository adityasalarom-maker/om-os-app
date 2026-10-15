import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskItem, type Project } from '../db';
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
  Tag, 
  GripVertical, 
  Brain, 
  Leaf, 
  Clock, 
  ArrowUpDown, 
  FolderKanban 
} from 'lucide-react';

export const TaskIntelligence: React.FC = () => {
  const [activeView, setActiveView] = useState<'eisenhower' | 'kanban' | 'list'>('eisenhower');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'newest'>('deadline');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Drag and Drop active drop targets state
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newQuadrant, setNewQuadrant] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [newEnergy, setNewEnergy] = useState<'Deep Work' | 'Low Energy' | 'Quick Win'>('Deep Work');
  const [newDeadline, setNewDeadline] = useState('');
  const [newProjectId, setNewProjectId] = useState('');

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];

  const projectMap = new Map<string, Project>();
  projects.forEach(p => projectMap.set(p.id, p));

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterEnergy !== 'all' && task.energyRequired !== filterEnergy) return false;
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    if (sortBy === 'priority') {
      const quadOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      return (quadOrder[a.quadrant] || 5) - (quadOrder[b.quadrant] || 5);
    }
    return b.createdAt - a.createdAt;
  });

  const handleToggleComplete = async (task: TaskItem) => {
    const nextCompleted = !task.isCompleted;
    await db.tasks.update(task.id, {
      isCompleted: nextCompleted,
      status: nextCompleted ? 'Done' : 'To Do',
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

  // Drag and Drop Handlers for Quadrants
  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, quadrant: task.quadrant, status: task.status }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverQuadrant(null);
    setDragOverStatus(null);
  };

  const handleQuadrantDragOver = (e: React.DragEvent, quadrantKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverQuadrant !== quadrantKey) {
      setDragOverQuadrant(quadrantKey);
    }
  };

  const handleQuadrantDragLeave = (e: React.DragEvent, quadrantKey: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverQuadrant === quadrantKey) {
      setDragOverQuadrant(null);
    }
  };

  const handleQuadrantDrop = async (e: React.DragEvent, targetQuadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    e.preventDefault();
    setDragOverQuadrant(null);
    setDraggedTaskId(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    let taskId = rawData;
    try {
      const parsed = JSON.parse(rawData);
      if (parsed.taskId) taskId = parsed.taskId;
    } catch {
      // raw string fallback
    }

    const priorityMap: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', TaskItem['priority']> = {
      Q1: 'Urgent & Important',
      Q2: 'Important Not Urgent',
      Q3: 'Urgent Not Important',
      Q4: 'Neither'
    };

    await db.tasks.update(taskId, {
      quadrant: targetQuadrant,
      priority: priorityMap[targetQuadrant],
      urgency: targetQuadrant === 'Q1' || targetQuadrant === 'Q3' ? 'High' : 'Low',
      impact: targetQuadrant === 'Q1' || targetQuadrant === 'Q2' ? 'High' : 'Low',
      updatedAt: Date.now()
    });
  };

  // Drag and Drop Handlers for Kanban Status
  const handleStatusDragOver = (e: React.DragEvent, statusCol: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== statusCol) {
      setDragOverStatus(statusCol);
    }
  };

  const handleStatusDragLeave = (e: React.DragEvent, statusCol: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStatus === statusCol) {
      setDragOverStatus(null);
    }
  };

  const handleStatusDrop = async (e: React.DragEvent, targetStatus: 'To Do' | 'In Progress' | 'Done') => {
    e.preventDefault();
    setDragOverStatus(null);
    setDraggedTaskId(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    let taskId = rawData;
    try {
      const parsed = JSON.parse(rawData);
      if (parsed.taskId) taskId = parsed.taskId;
    } catch {
      // fallback
    }

    await db.tasks.update(taskId, {
      status: targetStatus,
      isCompleted: targetStatus === 'Done',
      updatedAt: Date.now()
    });
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
            Prioritize by cognitive impact, urgency, and energy. Drag & drop cards freely between quadrants.
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
              title="Eisenhower Matrix (4 Quadrants)"
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

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-[#141622] border border-[#282d3e] px-2 py-1 rounded-xl text-xs text-gray-300">
            <ArrowUpDown size={13} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-gray-300 text-xs focus:outline-none"
            >
              <option value="deadline" className="bg-[#141622]">Due Date</option>
              <option value="priority" className="bg-[#141622]">Priority (Q1-Q4)</option>
              <option value="newest" className="bg-[#141622]">Newest</option>
            </select>
          </div>

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

      {/* VIEW 1: Eisenhower Matrix (4 Quadrants with HTML5 Drag & Drop) */}
      {activeView === 'eisenhower' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Q1: Do First (Urgent & Important) */}
          <div 
            onDragOver={(e) => handleQuadrantDragOver(e, 'Q1')}
            onDragLeave={(e) => handleQuadrantDragLeave(e, 'Q1')}
            onDrop={(e) => handleQuadrantDrop(e, 'Q1')}
            className={`bg-[#181a24] border rounded-2xl p-4 flex flex-col shadow-sm transition-all duration-150 min-h-[220px] ${
              dragOverQuadrant === 'Q1'
                ? 'border-rose-400 ring-2 ring-rose-500/40 bg-[#221a24] border-dashed scale-[1.005]'
                : 'border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-rose-300 tracking-wide uppercase">
                  Q1 • Urgent & Important (Do First)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 hidden sm:inline">Drop to prioritize</span>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold">
                  {sortedTasks.filter(t => t.quadrant === 'Q1' && !t.isCompleted).length}
                </span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {sortedTasks.filter(t => t.quadrant === 'Q1').map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  project={task.projectId ? projectMap.get(task.projectId) : undefined}
                  isDragging={draggedTaskId === task.id}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onToggle={handleToggleComplete} 
                  onDelete={handleDeleteTask} 
                />
              ))}
              {sortedTasks.filter(t => t.quadrant === 'Q1').length === 0 && (
                <div className="h-28 border border-dashed border-[#2b3147] rounded-xl flex flex-col items-center justify-center text-gray-500 text-xs">
                  <span>No urgent crises right now.</span>
                  <span className="text-[11px] text-gray-600 mt-1">Drag task card here to move into Q1</span>
                </div>
              )}
            </div>
          </div>

          {/* Q2: Schedule (Important Not Urgent - Deep Work Core) */}
          <div 
            onDragOver={(e) => handleQuadrantDragOver(e, 'Q2')}
            onDragLeave={(e) => handleQuadrantDragLeave(e, 'Q2')}
            onDrop={(e) => handleQuadrantDrop(e, 'Q2')}
            className={`bg-[#181a24] border rounded-2xl p-4 flex flex-col shadow-sm transition-all duration-150 min-h-[220px] ${
              dragOverQuadrant === 'Q2'
                ? 'border-indigo-400 ring-2 ring-indigo-500/40 bg-[#1c2035] border-dashed scale-[1.005]'
                : 'border-indigo-500/30'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h3 className="text-xs font-bold text-indigo-300 tracking-wide uppercase">
                  Q2 • Important Not Urgent (Deep Work / Schedule)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 hidden sm:inline">Drop to prioritize</span>
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">
                  {sortedTasks.filter(t => t.quadrant === 'Q2' && !t.isCompleted).length}
                </span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {sortedTasks.filter(t => t.quadrant === 'Q2').map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  project={task.projectId ? projectMap.get(task.projectId) : undefined}
                  isDragging={draggedTaskId === task.id}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onToggle={handleToggleComplete} 
                  onDelete={handleDeleteTask} 
                />
              ))}
              {sortedTasks.filter(t => t.quadrant === 'Q2').length === 0 && (
                <div className="h-28 border border-dashed border-[#2b3147] rounded-xl flex flex-col items-center justify-center text-gray-500 text-xs">
                  <span>No deep work scheduled.</span>
                  <span className="text-[11px] text-gray-600 mt-1">Drag task card here to move into Q2</span>
                </div>
              )}
            </div>
          </div>

          {/* Q3: Delegate / Quick Wins (Urgent Not Important) */}
          <div 
            onDragOver={(e) => handleQuadrantDragOver(e, 'Q3')}
            onDragLeave={(e) => handleQuadrantDragLeave(e, 'Q3')}
            onDrop={(e) => handleQuadrantDrop(e, 'Q3')}
            className={`bg-[#181a24] border rounded-2xl p-4 flex flex-col shadow-sm transition-all duration-150 min-h-[220px] ${
              dragOverQuadrant === 'Q3'
                ? 'border-amber-400 ring-2 ring-amber-500/40 bg-[#252219] border-dashed scale-[1.005]'
                : 'border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="text-xs font-bold text-amber-300 tracking-wide uppercase">
                  Q3 • Urgent Not Important (Delegate / Batch)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 hidden sm:inline">Drop to prioritize</span>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                  {sortedTasks.filter(t => t.quadrant === 'Q3' && !t.isCompleted).length}
                </span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {sortedTasks.filter(t => t.quadrant === 'Q3').map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  project={task.projectId ? projectMap.get(task.projectId) : undefined}
                  isDragging={draggedTaskId === task.id}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onToggle={handleToggleComplete} 
                  onDelete={handleDeleteTask} 
                />
              ))}
              {sortedTasks.filter(t => t.quadrant === 'Q3').length === 0 && (
                <div className="h-28 border border-dashed border-[#2b3147] rounded-xl flex flex-col items-center justify-center text-gray-500 text-xs">
                  <span>No interruptions or delegate items.</span>
                  <span className="text-[11px] text-gray-600 mt-1">Drag task card here to move into Q3</span>
                </div>
              )}
            </div>
          </div>

          {/* Q4: Eliminate / Backlog (Neither Urgent nor Important) */}
          <div 
            onDragOver={(e) => handleQuadrantDragOver(e, 'Q4')}
            onDragLeave={(e) => handleQuadrantDragLeave(e, 'Q4')}
            onDrop={(e) => handleQuadrantDrop(e, 'Q4')}
            className={`bg-[#181a24] border rounded-2xl p-4 flex flex-col shadow-sm transition-all duration-150 min-h-[220px] ${
              dragOverQuadrant === 'Q4'
                ? 'border-gray-400 ring-2 ring-gray-400/40 bg-[#20222a] border-dashed scale-[1.005]'
                : 'border-gray-600/30'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#252a3b] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                <h3 className="text-xs font-bold text-gray-400 tracking-wide uppercase">
                  Q4 • Backlog & Someday (Eliminate / Minimize)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 hidden sm:inline">Drop to prioritize</span>
                <span className="text-[11px] font-mono text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full font-bold">
                  {sortedTasks.filter(t => t.quadrant === 'Q4' && !t.isCompleted).length}
                </span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {sortedTasks.filter(t => t.quadrant === 'Q4').map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  project={task.projectId ? projectMap.get(task.projectId) : undefined}
                  isDragging={draggedTaskId === task.id}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onToggle={handleToggleComplete} 
                  onDelete={handleDeleteTask} 
                />
              ))}
              {sortedTasks.filter(t => t.quadrant === 'Q4').length === 0 && (
                <div className="h-28 border border-dashed border-[#2b3147] rounded-xl flex flex-col items-center justify-center text-gray-500 text-xs">
                  <span>Backlog is completely clear.</span>
                  <span className="text-[11px] text-gray-600 mt-1">Drag task card here to move into Q4</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: Kanban Columns with Drag & Drop */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['To Do', 'In Progress', 'Done'] as const).map(statusCol => (
            <div 
              key={statusCol} 
              onDragOver={(e) => handleStatusDragOver(e, statusCol)}
              onDragLeave={(e) => handleStatusDragLeave(e, statusCol)}
              onDrop={(e) => handleStatusDrop(e, statusCol)}
              className={`bg-[#181a24] border rounded-2xl p-4 flex flex-col min-h-[300px] transition-all duration-150 ${
                dragOverStatus === statusCol
                  ? 'border-indigo-400 ring-2 ring-indigo-500/40 bg-[#1d2134] border-dashed scale-[1.005]'
                  : 'border-[#272b3b]'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#272b3b] mb-3">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    statusCol === 'Done' ? 'bg-emerald-400' : statusCol === 'In Progress' ? 'bg-amber-400' : 'bg-indigo-400'
                  }`}></span>
                  {statusCol}
                </h3>
                <span className="text-[11px] font-mono text-gray-400 bg-[#141622] px-2 py-0.5 rounded-full font-bold">
                  {sortedTasks.filter(t => t.status === statusCol).length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {sortedTasks.filter(t => t.status === statusCol).map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    project={task.projectId ? projectMap.get(task.projectId) : undefined}
                    isDragging={draggedTaskId === task.id}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onToggle={handleToggleComplete} 
                    onDelete={handleDeleteTask} 
                  />
                ))}
                {sortedTasks.filter(t => t.status === statusCol).length === 0 && (
                  <div className="h-28 border border-dashed border-[#2b3147] rounded-xl flex items-center justify-center text-gray-500 text-xs">
                    Drop task card here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: List View */}
      {activeView === 'list' && (
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 space-y-2">
          {sortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              project={task.projectId ? projectMap.get(task.projectId) : undefined}
              isDragging={draggedTaskId === task.id}
              onDragStart={(e) => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              onToggle={handleToggleComplete} 
              onDelete={handleDeleteTask} 
            />
          ))}
          {sortedTasks.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-xs">
              No tasks found matching current filters.
            </div>
          )}
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
  project?: Project;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  project, 
  isDragging, 
  onDragStart, 
  onDragEnd, 
  onToggle, 
  onDelete 
}) => {
  const energyBadge = () => {
    switch(task.energyRequired) {
      case 'Deep Work':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-950/70 text-indigo-300 border border-indigo-800/40 flex items-center gap-1">
            <Brain size={11} className="text-indigo-400" />
            <span>Deep Work</span>
          </span>
        );
      case 'Quick Win':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-amber-950/70 text-amber-300 border border-amber-800/40 flex items-center gap-1">
            <Zap size={11} className="text-amber-400" />
            <span>Quick Win</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
            <Leaf size={11} className="text-emerald-400" />
            <span>Low Energy</span>
          </span>
        );
    }
  };

  return (
    <div 
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 group select-none ${
        isDragging
          ? 'opacity-40 border-indigo-400 border-dashed scale-95 bg-[#171a27]'
          : task.isCompleted 
            ? 'bg-[#151722]/50 border-[#232738] opacity-60' 
            : 'bg-[#1e2232] border-[#2c3246] hover:border-indigo-500/50 hover:bg-[#23283b] shadow-sm'
      }`}
    >
      {/* Drag handle */}
      <div 
        className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 pt-1 shrink-0 transition-colors"
        title="Drag card to move between quadrants"
      >
        <GripVertical size={14} />
      </div>

      <div className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(task)}>
        <button 
          type="button"
          className="mt-0.5 text-gray-400 group-hover:text-indigo-400 transition-colors shrink-0"
        >
          {task.isCompleted ? <CheckCircle2 size={17} className="text-emerald-400" /> : <Circle size={17} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium leading-snug break-words ${
            task.isCompleted ? 'line-through text-gray-500' : 'text-gray-200 group-hover:text-white'
          }`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {energyBadge()}
            
            {project && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#141622] text-gray-300 border border-[#2b3147] flex items-center gap-1">
                <FolderKanban size={10} className="text-gray-400" />
                <span className="truncate max-w-[120px]">{project.name}</span>
              </span>
            )}

            {task.deadline && (
              <span className="text-[10px] text-amber-300/90 font-mono flex items-center gap-1">
                <Clock size={11} className="text-amber-400" />
                <span>{task.deadline}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 transition-opacity p-1 shrink-0"
        title="Delete Task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
