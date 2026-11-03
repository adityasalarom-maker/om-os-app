import React, { useState } from 'react';
import {
  Folder,
  Plus,
  X,
  Check,
  Star,
  Archive,
  Sparkles,
  Layers,
} from 'lucide-react';
import type {
  ActivityDefinition,
  ActivityCategory,
  ActivityRole,
} from '../../services/dailyTrackerEngine';
import { STARTER_CATEGORIES } from '../../services/dailyTrackerEngine';

interface ActivityCatalogModalProps {
  isOpen: boolean;
  activities: ActivityDefinition[];
  categories?: ActivityCategory[];
  onClose: () => void;
  onCreateActivity: (newAct: Omit<ActivityDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onToggleArchive: (actId: string, currentStatus?: boolean) => void;
}

export function ActivityCatalogModal({
  isOpen,
  activities,
  categories = STARTER_CATEGORIES,
  onClose,
  onCreateActivity,
  onToggleArchive,
}: ActivityCatalogModalProps) {
  // Unconditional state hooks
  const [activeTab, setActiveTab] = useState<'BROWSE' | 'CREATE'>('BROWSE');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');

  // Form state for creating a new activity
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_other');
  const [defaultMode, setDefaultMode] = useState<'EVENT' | 'INTERVAL'>('INTERVAL');
  const [defaultRole, setDefaultRole] = useState<ActivityRole>('PRIMARY');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateActivity({
      name: name.trim(),
      categoryId,
      defaultMode,
      defaultRole,
    });

    setName('');
    setActiveTab('BROWSE');
  };

  const filteredActivities = activities.filter((act) => {
    if (selectedCatFilter === 'ALL') return true;
    return act.categoryId === selectedCatFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-indigo-400">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">Activity & Category Taxonomy</h3>
              <p className="text-xs text-slate-400">Manage 11 starter categories, custom activities and default roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="px-6 pt-3 flex gap-4 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('BROWSE')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'BROWSE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Activity Catalog ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('CREATE')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'CREATE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Activity</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'BROWSE' ? (
            <div className="space-y-4">
              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                <button
                  onClick={() => setSelectedCatFilter('ALL')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                    selectedCatFilter === 'ALL'
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      selectedCatFilter === cat.id
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Activity Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredActivities.map((act) => {
                  const cat = categories.find((c) => c.id === act.categoryId);
                  return (
                    <div
                      key={act.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span>{act.name}</span>
                          {act.isArchived && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Archived</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span style={{ color: cat?.color }}>{cat?.name || 'General'}</span>
                          <span>•</span>
                          <span>{act.defaultMode === 'EVENT' ? 'Instant Event' : 'Interval Timer'}</span>
                          <span>•</span>
                          <span>{act.defaultRole}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleArchive(act.id, act.isArchived)}
                        className="p-1 text-slate-500 hover:text-slate-300"
                        title={act.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Activity Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sanskrit Chanting, Evening Walk, Journaling"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Primary Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.description})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Default Mode</label>
                  <select
                    value={defaultMode}
                    onChange={(e) => setDefaultMode(e.target.value as 'EVENT' | 'INTERVAL')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="INTERVAL">Start / Stop Interval</option>
                    <option value="EVENT">Instant Event (1-Tap Timestamp)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Default Role</label>
                  <select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value as ActivityRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PRIMARY">Primary (Exclusive 24h Allocation)</option>
                    <option value="SECONDARY">Secondary (Concurrent Overlay)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Save to Activity Catalog</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
