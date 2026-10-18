import React, { useState } from 'react';
import {
  V2_REAL_TASKS,
  V2_REAL_CONCEPTS,
  V2_LAND_CHECKLIST,
  V2_LIFE_GOALS,
  V2_SAMPLE_JOURNAL,
  type V2Task,
  type V2Concept,
  type V2LandChecklistItem
} from '../data/v2RealData';
import {
  Sun,
  Moon,
  Compass,
  CheckCircle2,
  Circle,
  BookOpen,
  Mountain,
  Target,
  Sparkles,
  Flame,
  Search,
  Plus,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface SovereignStudioV2Props {
  onSwitchToV1?: () => void;
  embedded?: boolean;
}

export const SovereignStudioV2: React.FC<SovereignStudioV2Props> = ({ onSwitchToV1, embedded = false }) => {
  // Navigation tabs in V2
  const [activeTab, setActiveTab] = useState<'today' | 'knowledge' | 'sanctuary' | 'goals' | 'journal'>('today');

  // Interactive Task state
  const [tasks, setTasks] = useState<V2Task[]>(V2_REAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Interactive Land Checklist state
  const [landChecklist, setLandChecklist] = useState<V2LandChecklistItem[]>(V2_LAND_CHECKLIST);

  // Knowledge search & active concept
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<V2Concept | null>(V2_REAL_CONCEPTS[0]);

  // Journal state
  const [journal, setJournal] = useState(V2_SAMPLE_JOURNAL);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Done' ? 'Pending' : 'Done';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: V2Task = {
      id: `task-v2-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: 'Personal',
      priority: 'Important Not Urgent',
      status: 'Pending',
      sourceFile: 'Active Capture'
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleLandStatus = (id: string) => {
    setLandChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const statuses: V2LandChecklistItem['status'][] = ['Pending Verification', 'In Diligence', 'Verified'];
        const nextIdx = (statuses.indexOf(item.status) + 1) % statuses.length;
        return { ...item, status: statuses[nextIdx] };
      }
      return item;
    }));
  };

  const filteredConcepts = V2_REAL_CONCEPTS.filter(c => {
    const q = knowledgeSearch.toLowerCase();
    return c.title.toLowerCase().includes(q) || 
           c.summary.toLowerCase().includes(q) || 
           c.tags.some(t => t.toLowerCase().includes(q));
  });

  const verifiedLandSteps = landChecklist.filter(item => item.status === 'Verified').length;
  const landProgressPercent = Math.round((verifiedLandSteps / landChecklist.length) * 100);

  // Renders the tab body content (shared between Standalone and Embedded modes)
  const renderTabContent = () => (
    <>
      {/* TAB 1: SANCTUARY TODAY */}
      {activeTab === 'today' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Morning Intention & Contemplative Anchor Banner */}
          <div className="bg-gradient-to-r from-[#171b29] via-[#1a1e2f] to-[#141724] border border-[#2b334a] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">
              <Sparkles size={14} /> Morning Intention & Contemplative Anchor
            </div>
            <p className="text-sm md:text-base text-gray-200 font-serif leading-relaxed italic max-w-3xl">
              "{journal.morningIntention}"
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400 border-t border-white/5 pt-3">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <Sun size={13} className="text-amber-400" /> Active Breath: {journal.swaraActive}
              </span>
              <span>•</span>
              <span className="text-gray-300">
                Deep Work Anchor: {journal.deepWorkFocus}
              </span>
            </div>
          </div>

          {/* Daily Operational Focus (User's Real To-Dos) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Real Action Items (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Actual To-Do Items ({tasks.filter(t => t.status !== 'Done').length} Active)
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  Sourced from <code className="text-indigo-300">my_notes/09_To do lists Main.md</code>
                </span>
              </div>

              {/* Add Quick Action */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Capture an actionable task directly..."
                  className="flex-1 bg-[#121522] border border-[#242b3d] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              {/* Task Cards List */}
              <div className="space-y-2.5">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 group ${
                      task.status === 'Done'
                        ? 'bg-[#0f111a]/60 border-white/5 opacity-60'
                        : 'bg-[#131724] hover:bg-[#181d2e] border-[#22293b] hover:border-[#333d59] shadow-sm'
                    }`}
                  >
                    <button className="mt-0.5 text-gray-400 group-hover:text-amber-400 transition-colors">
                      {task.status === 'Done' ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          task.priority === 'Urgent & Important'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                            : task.priority === 'Important Not Urgent'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                          {task.category}
                        </span>
                      </div>
                      <h4 className={`text-xs md:text-sm font-medium ${
                        task.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-100'
                      }`}>
                        {task.title}
                      </h4>
                      {task.notes && (
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Contemplative Daily Rhythm (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#121522] border border-[#23293b] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Compass size={16} /> Sovereign Daily Rhythm
                </div>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3 border-l-2 border-amber-500/60 pl-3">
                    <div>
                      <span className="font-semibold text-white block">1. Brahma Muhurta & Sadhana</span>
                      <p className="text-gray-400 text-[11px] mt-0.5">Pranayama, observation of Swara, stillness before sunrise.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-l-2 border-indigo-500/60 pl-3">
                    <div>
                      <span className="font-semibold text-white block">2. Deep Philosophical Study</span>
                      <p className="text-gray-400 text-[11px] mt-0.5">Mati-Vivek discrimination and Shankara Bhashya contemplation.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-l-2 border-emerald-500/60 pl-3">
                    <div>
                      <span className="font-semibold text-white block">3. Focused Physical Execution</span>
                      <p className="text-gray-400 text-[11px] mt-0.5">Trishaa study table, bed dimensions, garden plant guide.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-l-2 border-purple-500/60 pl-3">
                    <div>
                      <span className="font-semibold text-white block">4. Uttarkashi Land Diligence</span>
                      <p className="text-gray-400 text-[11px] mt-0.5">Statutory verification of revenue records and ESZ clearances.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-l-2 border-cyan-500/60 pl-3">
                    <div>
                      <span className="font-semibold text-white block">5. Evening Sakshi Reflection</span>
                      <p className="text-gray-400 text-[11px] mt-0.5">Review day as the non-attached observer; log wins & lessons.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Link to Uttarkashi Sanctuary Progress */}
              <div 
                onClick={() => setActiveTab('sanctuary')}
                className="bg-[#121522] hover:bg-[#161a29] border border-[#23293b] hover:border-amber-500/30 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold text-gray-200">
                    <Mountain size={14} className="text-amber-400" /> Uttarkashi Diligence
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{landProgressPercent}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${landProgressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2.5">
                  <span>{verifiedLandSteps} of {landChecklist.length} statutory checks verified</span>
                  <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVING KNOWLEDGE */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212638] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-amber-400" />
                Living Knowledge & Philosophical Inquiries
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Sourced from your actual study archives: <code className="text-indigo-300">04_Mati vivek.md</code>, <code className="text-indigo-300">06_Vivarta vada and vadas.md</code>
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                value={knowledgeSearch}
                onChange={(e) => setKnowledgeSearch(e.target.value)}
                placeholder="Search concepts or Sanskrit terms..."
                className="w-full bg-[#121522] border border-[#242b3d] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
            {/* Concept Selector */}
            <div className="lg:col-span-4 space-y-2.5">
              {filteredConcepts.map(c => {
                const isSelected = selectedConcept?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConcept(c)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181d2f] border-amber-500/40 shadow-md ring-1 ring-amber-500/20'
                        : 'bg-[#121522] hover:bg-[#161a29] border-[#22283b] hover:border-[#323952]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                      <span className="font-mono text-amber-400 uppercase font-semibold">{c.category}</span>
                      <span>{c.tags[0]}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {c.title}
                    </h4>
                    {c.sanskritTitle && (
                      <p className="text-[11px] text-amber-300/80 font-serif mt-1">
                        {c.sanskritTitle}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {c.summary}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Deep Reader */}
            <div className="lg:col-span-8">
              {selectedConcept ? (
                <div className="bg-[#121522] border border-[#23293b] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
                  <div className="border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase">
                        {selectedConcept.category}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        Source: <code className="text-indigo-300">{selectedConcept.sourceFile}</code>
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight font-serif">
                      {selectedConcept.title}
                    </h3>
                    {selectedConcept.sanskritTitle && (
                      <p className="text-sm text-amber-400/90 font-serif mt-1">
                        {selectedConcept.sanskritTitle}
                      </p>
                    )}
                  </div>

                  <div className="bg-[#181d2f]/70 border-l-4 border-amber-500 p-4 rounded-r-xl">
                    <p className="text-xs md:text-sm text-amber-100/90 italic font-serif leading-relaxed">
                      "{selectedConcept.quote}"
                    </p>
                  </div>

                  <div className="prose prose-invert prose-xs md:prose-sm max-w-none text-gray-300 leading-relaxed space-y-4">
                    {selectedConcept.fullContent.split('\n\n').map((paragraph, idx) => (
                      <div key={idx} className="whitespace-pre-wrap font-sans text-xs md:text-sm leading-relaxed text-gray-300">
                        {paragraph}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5">
                    {selectedConcept.tags.map(t => (
                      <span key={t} className="text-[10px] bg-[#1a1f33] text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-lg font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 text-center text-xs text-gray-400 bg-[#121522] border border-[#23293b] rounded-2xl">
                  Select a philosophical concept to open the study reader.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UTTARKASHI SANCTUARY */}
      {activeTab === 'sanctuary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#151928] via-[#181d2f] to-[#121522] border border-[#2b334a] rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  <Mountain size={16} /> Uttarakhand Land Due Diligence Framework
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white font-serif">
                  Uttarkashi Bhagirathi Valley Retreat Sanctuary
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {landProgressPercent}%
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Diligence Score
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Sourced directly from <code className="text-indigo-300">my_notes/07_Uttarkashi UK.md</code>. Systematic legal, physical, and environmental verification before finalizing any land transaction in Uttarkashi district.
            </p>

            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${landProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {landChecklist.map(item => (
              <div
                key={item.id}
                onClick={() => toggleLandStatus(item.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  item.status === 'Verified'
                    ? 'bg-[#101924]/80 border-emerald-500/30'
                    : item.status === 'In Diligence'
                    ? 'bg-[#1a1b26] border-amber-500/30'
                    : 'bg-[#121522] border-[#22283b] hover:border-[#323952]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                    {item.step} • {item.criticality}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.status === 'Verified'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : item.status === 'In Diligence'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}>
                    {item.status} (Click to toggle)
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.lawReference && (
                  <div className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 inline-block">
                    Statute: {item.lawReference}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIFE HORIZONS */}
      {activeTab === 'goals' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-[#212638] pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target size={18} className="text-amber-400" />
              Goals & Life Pyramid — Converting Vision into Daily Action
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Sourced from <code className="text-indigo-300">notion_os/Goals Life Pyramid.md</code>
            </p>
          </div>

          <div className="space-y-4">
            {V2_LIFE_GOALS.map((goal, idx) => (
              <div
                key={goal.id}
                className="bg-[#121522] border border-[#23293b] rounded-2xl p-5 md:p-6 space-y-3 shadow-sm hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">
                    Tier {idx + 1}: {goal.horizon}
                  </span>
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {goal.pillar}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm md:text-base font-bold text-white">
                    {goal.title}
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {goal.description}
                  </p>
                </div>

                <div className="text-[11px] text-gray-400 border-t border-white/5 pt-2 flex items-center gap-2">
                  <span className="font-semibold text-gray-300">Success Metric:</span>
                  <span>{goal.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: INNER STATE & JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-[#212638] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame size={18} className="text-amber-400" />
                Sadhana & Inner State Contemplation
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Sourced from <code className="text-indigo-300">notion_os/Journal  Reflection.md</code>
              </p>
            </div>
            <span className="text-xs font-mono text-gray-400">
              {journal.date}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#121522] border border-[#23293b] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sun size={15} /> Morning Anchor (Brahma Muhurta)
              </div>
              <div>
                <label className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                  Morning Intention
                </label>
                <textarea
                  rows={3}
                  value={journal.morningIntention}
                  onChange={(e) => setJournal({ ...journal, morningIntention: e.target.value })}
                  className="w-full bg-[#0d0f17] border border-[#212638] rounded-xl p-3 text-xs text-gray-200 leading-relaxed focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                  Deep Work Focus
                </label>
                <textarea
                  rows={2}
                  value={journal.deepWorkFocus}
                  onChange={(e) => setJournal({ ...journal, deepWorkFocus: e.target.value })}
                  className="w-full bg-[#0d0f17] border border-[#212638] rounded-xl p-3 text-xs text-gray-200 leading-relaxed focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="bg-[#121522] border border-[#23293b] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Moon size={15} /> Evening Reflection (Sakshi Bhav)
              </div>
              <div>
                <label className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                  Evening Accomplishments & Wins
                </label>
                <textarea
                  rows={3}
                  value={journal.eveningWins}
                  onChange={(e) => setJournal({ ...journal, eveningWins: e.target.value })}
                  className="w-full bg-[#0d0f17] border border-[#212638] rounded-xl p-3 text-xs text-gray-200 leading-relaxed focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                  Primary Lesson / Realization
                </label>
                <textarea
                  rows={2}
                  value={journal.lessonLearned}
                  onChange={(e) => setJournal({ ...journal, lessonLearned: e.target.value })}
                  className="w-full bg-[#0d0f17] border border-[#212638] rounded-xl p-3 text-xs text-gray-200 leading-relaxed focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // If embedded in Version 1 Executive Dashboard:
  if (embedded) {
    return (
      <div className="space-y-6 pt-2">
        {/* Serene V2 Header in Embedded Dashboard Mode */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-2xl shadow-inner">
                ॐ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                    Om Sanctuary Studio
                  </h3>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Version 2 • Real Data Dashboard
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Sovereign contemplation, actual study notes, and life navigation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 bg-[#121522] px-2.5 py-1 rounded-xl border border-white/5">
                <Sun size={12} className="text-amber-400" />
                <span>Swara: {journal.swaraActive.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Serene Navigation Bar */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-white/5 pt-3">
            {[
              { id: 'today', label: '✦ Sanctuary Today', desc: 'Focus & Tasks' },
              { id: 'knowledge', label: '🧠 Living Knowledge', desc: 'Mati-Vivek & Vedanta' },
              { id: 'sanctuary', label: '🏔️ Uttarkashi Sanctuary', desc: 'Land Diligence' },
              { id: 'goals', label: '🎯 Life Horizons', desc: 'Pyramid & Vision' },
              { id: 'journal', label: '📓 Inner State & Sadhana', desc: 'Daily Reflection' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Embedded Main Content */}
        <div className="space-y-6">
          {renderTabContent()}
        </div>
      </div>
    );
  }

  // Standalone Full-Page Mode (when visiting #/v2)
  return (
    <div className="min-h-screen bg-[#0a0c13] text-[#e2e8f0] font-sans selection:bg-amber-500/20 selection:text-amber-200">
      
      {/* Standalone V2 Header */}
      <header className="sticky top-0 z-40 bg-[#0d101a]/90 backdrop-blur-xl border-b border-[#1f2436] px-4 md:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-2xl shadow-inner">
              ॐ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Om Sanctuary Studio
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Version 2 • Real Data
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Sovereign contemplation, actual study notes, and life navigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onSwitchToV1 && (
              <button
                onClick={onSwitchToV1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171b29] hover:bg-[#20263a] border border-[#272e45] hover:border-indigo-500/40 text-xs text-indigo-300 hover:text-white transition-all shadow-sm group cursor-pointer"
                title="Switch to Version 1 (Technical Cockpit with all 19 Modules & Knowledge Graph)"
              >
                <Sliders size={13} className="text-indigo-400 group-hover:rotate-45 transition-transform" />
                <span>⊞ Switch to V1: Technical Cockpit</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-gray-400 bg-[#121522] px-2.5 py-1 rounded-xl border border-white/5">
              <Sun size={12} className="text-amber-400" />
              <span>Swara: {journal.swaraActive.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Serene Navigation Bar */}
        <div className="max-w-6xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-white/5 pt-2">
          {[
            { id: 'today', label: '✦ Sanctuary Today', desc: 'Focus & Tasks' },
            { id: 'knowledge', label: '🧠 Living Knowledge', desc: 'Mati-Vivek & Vedanta' },
            { id: 'sanctuary', label: '🏔️ Uttarkashi Sanctuary', desc: 'Land Diligence' },
            { id: 'goals', label: '🎯 Life Horizons', desc: 'Pyramid & Vision' },
            { id: 'journal', label: '📓 Inner State & Sadhana', desc: 'Daily Reflection' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24">
        {renderTabContent()}
      </main>
    </div>
  );
};
