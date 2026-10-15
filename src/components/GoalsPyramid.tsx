import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type GoalItem } from '../db';
import { 
  Compass, 
  Plus, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Layers, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const GoalsPyramid: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newLevel, setNewLevel] = useState<GoalItem['level']>('1-Year');
  const [newArea, setNewArea] = useState<GoalItem['lifeArea']>('Spiritual & Inner');
  const [newProgress, setNewProgress] = useState(25);

  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];

  const pyramidLevels: GoalItem['level'][] = [
    'Life Vision',
    '10-Year',
    '5-Year',
    '1-Year',
    'Quarterly OKR'
  ];

  const handleUpdateProgress = async (id: string, newP: number) => {
    await db.goals.update(id, {
      progress: Math.min(100, Math.max(0, newP)),
      status: newP >= 100 ? 'Achieved' : 'Active',
      updatedAt: Date.now()
    });
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const now = Date.now();
    await db.goals.add({
      id: `goal-${now}`,
      title: newTitle.trim(),
      level: newLevel,
      status: 'Active',
      progress: newProgress,
      lifeArea: newArea,
      createdAt: now,
      updatedAt: now
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  const filteredGoals = goals.filter(g => selectedArea === 'All' || g.lifeArea === selectedArea);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="text-indigo-400" size={22} />
            <span>Goals & Life Pyramid Architecture</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Cascade your ultimate Life Vision into 10Y, 5Y, 1Y milestones down to Quarterly OKRs and Daily Actions.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Life Goal</span>
        </button>
      </div>

      {/* Filter by Life Area */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'Spiritual & Inner', 'Health & Vitality', 'Wealth & Assets', 'Career & Skills', 'Family & Relationships'].map(area => (
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

      {/* The Visual Pyramid Levels (Cascading Downwards) */}
      <div className="space-y-4">
        {pyramidLevels.map((lvl, index) => {
          const levelGoals = filteredGoals.filter(g => g.level === lvl);
          const levelColors = [
            'border-amber-500/40 bg-[#1f1e18]/40 text-amber-300', // Vision
            'border-purple-500/40 bg-[#1e1927]/40 text-purple-300', // 10-Year
            'border-indigo-500/40 bg-[#1a1e2d]/40 text-indigo-300', // 5-Year
            'border-emerald-500/40 bg-[#162121]/40 text-emerald-300', // 1-Year
            'border-cyan-500/40 bg-[#162028]/40 text-cyan-300', // OKRs
          ];

          return (
            <div
              key={lvl}
              className={`rounded-2xl border p-5 ${levelColors[index]} backdrop-blur-sm shadow-sm transition-all`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs font-mono">
                    L{5 - index}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">{lvl}</h3>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {index === 0 ? 'Top Anchor • Highest Purpose' : `Cascades from ${pyramidLevels[index - 1]}`}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-black/30">
                  {levelGoals.length} {levelGoals.length === 1 ? 'Goal' : 'Goals'}
                </span>
              </div>

              {levelGoals.length === 0 ? (
                <div className="py-4 text-center text-gray-500 text-xs italic">
                  No active goals set at the {lvl} level yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {levelGoals.map(goal => (
                    <div
                      key={goal.id}
                      className="bg-[#141622]/80 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span className="text-indigo-300 font-medium">{goal.lifeArea}</span>
                          <span className="font-mono text-white font-bold">{goal.progress}%</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug">
                          {goal.title}
                        </h4>
                      </div>

                      <div>
                        <div className="w-full bg-[#1b1f2e] h-2 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-500">Update progress:</span>
                          <div className="flex items-center gap-1">
                            {[25, 50, 75, 100].map(val => (
                              <button
                                key={val}
                                onClick={() => handleUpdateProgress(goal.id, val)}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                                  goal.progress === val
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-[#1b1f2e] text-gray-400 hover:text-white'
                                }`}
                              >
                                {val}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Goal Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d2c] border border-[#2e344d] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Define Life Pyramid Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Goal Statement</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Sankhya & Vedanta philosophy"
                  className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Pyramid Tier</label>
                  <select
                    value={newLevel}
                    onChange={(e: any) => setNewLevel(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Life Vision">Life Vision</option>
                    <option value="10-Year">10-Year</option>
                    <option value="5-Year">5-Year</option>
                    <option value="1-Year">1-Year</option>
                    <option value="Quarterly OKR">Quarterly OKR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Life Area</label>
                  <select
                    value={newArea}
                    onChange={(e: any) => setNewArea(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Spiritual & Inner">Spiritual & Inner</option>
                    <option value="Health & Vitality">Health & Vitality</option>
                    <option value="Wealth & Assets">Wealth & Assets</option>
                    <option value="Career & Skills">Career & Skills</option>
                    <option value="Family & Relationships">Family & Relationships</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Current Progress ({newProgress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
