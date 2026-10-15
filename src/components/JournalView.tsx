import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JournalEntry, type TaskItem } from '../db';
import { 
  BookHeart, 
  Calendar, 
  Sun, 
  Moon, 
  Smile, 
  Zap, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Download,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  Target,
  ArrowRight,
  ListTodo,
  HeartHandshake,
  Lightbulb
} from 'lucide-react';

export const JournalView: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Vitality & State Sliders
  const [energy, setEnergy] = useState(8);
  const [mood, setMood] = useState(8);
  const [clarity, setClarity] = useState(8);

  // Morning Intentions & Scorecard
  const [morning1, setMorning1] = useState('');
  const [morning2, setMorning2] = useState('');
  const [morning3, setMorning3] = useState('');
  const [completed1, setCompleted1] = useState(false);
  const [completed2, setCompleted2] = useState(false);
  const [completed3, setCompleted3] = useState(false);

  // Evening Scorecard & Reflection
  const [wins, setWins] = useState<string[]>([]);
  const [newWinInput, setNewWinInput] = useState('');
  const [gratitudes, setGratitudes] = useState<string[]>([]);
  const [newGratitudeInput, setNewGratitudeInput] = useState('');
  const [lessons, setLessons] = useState('');
  const [content, setContent] = useState('');

  // UI state
  const [savedStatus, setSavedStatus] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  // Queries
  const entries = useLiveQuery(() => db.journal.orderBy('date').reverse().toArray(), []) || [];
  const activeEntry = useLiveQuery(() => db.journal.where('date').equals(selectedDate).first(), [selectedDate]);
  const activeTasks = useLiveQuery(() => db.tasks.where('status').notEqual('Done').toArray(), []) || [];

  // Sync state with active entry when selectedDate changes
  useEffect(() => {
    if (activeEntry) {
      setEnergy(activeEntry.energyScore ?? 8);
      setMood(activeEntry.moodScore ?? 8);
      setClarity(activeEntry.clarityScore ?? 8);

      const mTop = activeEntry.morningTop3 || [];
      const mComp = activeEntry.morningCompleted || [];
      setMorning1(mTop[0] || '');
      setMorning2(mTop[1] || '');
      setMorning3(mTop[2] || '');
      setCompleted1(!!mComp[0]);
      setCompleted2(!!mComp[1]);
      setCompleted3(!!mComp[2]);

      setWins(activeEntry.eveningWins || []);
      setGratitudes(activeEntry.gratitude || []);
      setLessons(activeEntry.lessonsLearned || '');
      setContent(activeEntry.content || '');
    } else {
      setEnergy(8);
      setMood(8);
      setClarity(8);
      setMorning1('');
      setMorning2('');
      setMorning3('');
      setCompleted1(false);
      setCompleted2(false);
      setCompleted3(false);
      setWins([]);
      setGratitudes([]);
      setLessons('');
      setContent('');
    }
    setSavedStatus(false);
  }, [activeEntry, selectedDate]);

  // Save or Update Journal Entry
  const handleSaveEntry = async () => {
    const now = Date.now();
    const cleanTop3 = [morning1.trim(), morning2.trim(), morning3.trim()].filter(Boolean);
    const completedArr = [completed1, completed2, completed3].slice(0, cleanTop3.length);

    const entryData: JournalEntry = {
      id: `journal-${selectedDate}`,
      date: selectedDate,
      entryType: 'Daily',
      moodScore: mood,
      energyScore: energy,
      clarityScore: clarity,
      morningTop3: cleanTop3,
      morningCompleted: completedArr,
      eveningWins: wins.filter(w => w.trim().length > 0),
      gratitude: gratitudes.filter(g => g.trim().length > 0),
      lessonsLearned: lessons.trim(),
      content: content.trim(),
      createdAt: activeEntry ? activeEntry.createdAt : now,
      updatedAt: now
    };

    await db.journal.put(entryData);

    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  // Add Win
  const handleAddWin = () => {
    if (!newWinInput.trim()) return;
    setWins(prev => [...prev, newWinInput.trim()]);
    setNewWinInput('');
  };

  const handleRemoveWin = (idx: number) => {
    setWins(prev => prev.filter((_, i) => i !== idx));
  };

  // Add Gratitude
  const handleAddGratitude = () => {
    if (!newGratitudeInput.trim()) return;
    setGratitudes(prev => [...prev, newGratitudeInput.trim()]);
    setNewGratitudeInput('');
  };

  const handleRemoveGratitude = (idx: number) => {
    setGratitudes(prev => prev.filter((_, i) => i !== idx));
  };

  // Import high-leverage task into morning intentions
  const handleImportTaskToIntention = (task: TaskItem) => {
    if (!morning1.trim()) {
      setMorning1(task.title);
    } else if (!morning2.trim()) {
      setMorning2(task.title);
    } else if (!morning3.trim()) {
      setMorning3(task.title);
    }
    setShowTaskSelector(false);
  };

  // Delete Journal Entry
  const handleDeleteEntry = async (dateToDelete: string) => {
    if (window.confirm(`Delete journal entry for ${dateToDelete}?`)) {
      await db.journal.where('date').equals(dateToDelete).delete();
    }
  };

  // Intention Scorecard calculation
  const totalIntentionsCount = [morning1, morning2, morning3].filter(Boolean).length;
  const completedIntentionsCount = [
    morning1 && completed1,
    morning2 && completed2,
    morning3 && completed3
  ].filter(Boolean).length;
  const intentionScorePercent = totalIntentionsCount > 0 
    ? Math.round((completedIntentionsCount / totalIntentionsCount) * 100) 
    : 0;

  // Build GFM Markdown String for export / clipboard
  const generateMarkdown = (): string => {
    return `---
title: "Om Knowledge OS Daily Journal - ${selectedDate}"
date: "${selectedDate}"
type: "Daily Journal"
energy_prana: ${energy}/10
mental_clarity: ${clarity}/10
mood_index: ${mood}/10
intention_score: "${completedIntentionsCount}/${totalIntentionsCount} (${intentionScorePercent}%)"
---

# 🌅 Daily Intention Scorecard (${selectedDate})

### ⚡ Vitality & Mind Metrics
- **Pranic Energy / Vitality:** ${energy} / 10
- **Mental Clarity & Sattva:** ${clarity} / 10
- **Mood / Emotional Equanimity:** ${mood} / 10

---

### 🎯 Morning Top 3 High-Leverage Intentions
${morning1 ? `- [${completed1 ? 'x' : ' '}] ${morning1}` : ''}
${morning2 ? `- [${completed2 ? 'x' : ' '}] ${morning2}` : ''}
${morning3 ? `- [${completed3 ? 'x' : ' '}] ${morning3}` : ''}

**Execution Result:** ${completedIntentionsCount}/${totalIntentionsCount} completed (${intentionScorePercent}%)

---

### 🌙 Evening Wins & Milestones
${wins.length > 0 ? wins.map(w => `- ✨ ${w}`).join('\n') : '_No evening wins recorded._'}

---

### 🙏 Gratitude & Blessings
${gratitudes.length > 0 ? gratitudes.map(g => `- 🙏 ${g}`).join('\n') : '_No specific gratitude noted today._'}

---

### 💡 Retrospective Realizations & Lessons Learned
${lessons ? lessons : '_No lessons recorded._'}

---

### 📖 Stream of Consciousness & Inner Contemplation
${content ? content : '_No contemplation written._'}
`;
  };

  // Download GFM markdown file
  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `om_journal_${selectedDate}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy GFM markdown to clipboard
  const handleCopyMarkdown = async () => {
    const md = generateMarkdown();
    await navigator.clipboard.writeText(md);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  // 7-Day Sparkline Data Calculation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const match = entries.find(e => e.date === dStr);
    return {
      date: dStr,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      energy: match?.energyScore ?? 0,
      clarity: match?.clarityScore ?? match?.moodScore ?? 0,
      hasEntry: !!match
    };
  });

  const avgWeeklyEnergy = Math.round(
    last7Days.filter(d => d.hasEntry).reduce((acc, d) => acc + d.energy, 0) / 
    (last7Days.filter(d => d.hasEntry).length || 1)
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookHeart className="text-rose-400" size={22} />
            <span>Journal & Daily Intention Scorecard</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Morning high-leverage intentionality, interactive execution scorecard, and pranic vitality metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Date Shortcuts */}
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedDate === todayStr ? 'bg-indigo-600 text-white' : 'bg-[#141622] text-gray-400 hover:text-white border border-[#272b3b]'
            }`}
          >
            Today
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
          />

          <button
            onClick={handleCopyMarkdown}
            className="bg-[#202538] hover:bg-[#282f48] border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
            title="Copy GFM formatted journal to clipboard"
          >
            {copiedStatus ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedStatus ? 'Copied GFM!' : 'Copy GFM'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="bg-[#202538] hover:bg-[#282f48] border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
            title="Download note as .md file with YAML frontmatter"
          >
            <Download size={14} />
            <span>Export .md</span>
          </button>

          <button
            onClick={handleSaveEntry}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{savedStatus ? 'Saved!' : 'Save Entry'}</span>
          </button>
        </div>
      </div>

      {savedStatus && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Journal entry recorded securely in local Dexie database for {selectedDate}.</span>
        </div>
      )}

      {/* Main Journal Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Vitality Sliders, Scorecard, Wins, Reflection */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Energy, Clarity & Mood Sliders */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                Vitality, Prana & Mental State Sliders
              </h3>
              <span className="text-[11px] font-mono text-gray-400">
                Weekly Prana Avg: <strong className="text-amber-300">{avgWeeklyEnergy || 8}/10</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Pranic Energy */}
              <div className="bg-[#141622] p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Zap size={14} /> Prana / Energy
                  </span>
                  <span className="font-mono text-base font-bold text-amber-400">{energy} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 block font-mono">
                  {energy <= 3 ? 'Low • Exhausted / Rest Needed' : energy <= 6 ? 'Moderate • Steady Ojas' : energy <= 8 ? 'High • Radiant Vitality' : 'Peak • Supercharged'}
                </span>
              </div>

              {/* Mental Clarity */}
              <div className="bg-[#141622] p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                    <Target size={14} /> Mental Clarity
                  </span>
                  <span className="font-mono text-base font-bold text-cyan-400">{clarity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={clarity}
                  onChange={(e) => setClarity(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 block font-mono">
                  {clarity <= 3 ? 'Tamasic • Foggy / Distracted' : clarity <= 6 ? 'Rajasic • Busy / Focused' : clarity <= 8 ? 'Sattvic • Lucid & Calm' : 'Transcendent Clarity'}
                </span>
              </div>

              {/* Emotional Equanimity / Mood */}
              <div className="bg-[#141622] p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Smile size={14} /> Mood & Peace
                  </span>
                  <span className="font-mono text-base font-bold text-indigo-400">{mood} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 block font-mono">
                  {mood <= 3 ? 'Heavy • Somber Mind' : mood <= 6 ? 'Neutral • Stable' : mood <= 8 ? 'Joyful • Content & Grounded' : 'Blissful • Ananda'}
                </span>
              </div>
            </div>

            {/* 7-Day Sparkline Visualizer */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono block mb-2">
                7-Day Prana & Clarity Rhythm
              </span>
              <div className="grid grid-cols-7 gap-2">
                {last7Days.map(d => (
                  <div 
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`p-2 rounded-lg text-center cursor-pointer border transition-colors ${
                      selectedDate === d.date ? 'bg-indigo-950/60 border-indigo-500' : 'bg-[#141622] border-white/5 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 block font-mono">{d.dayLabel}</span>
                    <div className="h-8 flex items-end justify-center gap-1 my-1">
                      <div 
                        className="w-1.5 bg-amber-400 rounded-t"
                        style={{ height: `${(d.energy / 10) * 100}%` }}
                        title={`Prana: ${d.energy}/10`}
                      />
                      <div 
                        className="w-1.5 bg-cyan-400 rounded-t"
                        style={{ height: `${(d.clarity / 10) * 100}%` }}
                        title={`Clarity: ${d.clarity}/10`}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-gray-500">{d.energy ? `${d.energy}p` : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Morning Top 3 Intentions & Interactive Scorecard */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sun size={17} />
                <span>Morning Top 3 Intentions (High Leverage)</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTaskSelector(!showTaskSelector)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1"
                >
                  <ListTodo size={14} />
                  <span>{showTaskSelector ? 'Hide Tasks' : 'Import from Tasks'}</span>
                </button>

                {totalIntentionsCount > 0 && (
                  <span className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                    Scorecard: {completedIntentionsCount}/{totalIntentionsCount} ({intentionScorePercent}%)
                  </span>
                )}
              </div>
            </div>

            {/* Task Quick Importer Dropdown */}
            {showTaskSelector && (
              <div className="bg-[#141622] p-3 rounded-xl border border-indigo-500/30 space-y-2">
                <span className="text-[11px] font-semibold text-gray-300 block">
                  Select an active high-impact task to assign to today's Top 3:
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {activeTasks.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No pending tasks found.</p>
                  ) : (
                    activeTasks.slice(0, 8).map(task => (
                      <div 
                        key={task.id}
                        onClick={() => handleImportTaskToIntention(task)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-[#191b29] hover:bg-[#202538] border border-white/5 text-xs cursor-pointer transition-colors"
                      >
                        <span className="text-gray-200 truncate max-w-[280px]">{task.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300">
                            {task.quadrant || 'Q1'}
                          </span>
                          <ArrowRight size={12} className="text-gray-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Top 3 Interactive Inputs with Checkbox Strike-through */}
            <div className="space-y-2.5">
              {/* Intention 1 */}
              <div className="flex items-center gap-2.5 bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2">
                <input
                  type="checkbox"
                  checked={completed1}
                  disabled={!morning1.trim()}
                  onChange={(e) => setCompleted1(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                  title="Check off as completed"
                />
                <input
                  type="text"
                  value={morning1}
                  onChange={(e) => setMorning1(e.target.value)}
                  placeholder="1. Primary deep work outcome (High Impact Q1/Q2)..."
                  className={`flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none ${completed1 ? 'line-through text-gray-400' : ''}`}
                />
                <span className="text-[10px] font-mono text-amber-400 font-bold">#1 FOCUS</span>
              </div>

              {/* Intention 2 */}
              <div className="flex items-center gap-2.5 bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2">
                <input
                  type="checkbox"
                  checked={completed2}
                  disabled={!morning2.trim()}
                  onChange={(e) => setCompleted2(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                  title="Check off as completed"
                />
                <input
                  type="text"
                  value={morning2}
                  onChange={(e) => setMorning2(e.target.value)}
                  placeholder="2. Essential secondary execution priority..."
                  className={`flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none ${completed2 ? 'line-through text-gray-400' : ''}`}
                />
                <span className="text-[10px] font-mono text-indigo-400 font-bold">#2 CORE</span>
              </div>

              {/* Intention 3 */}
              <div className="flex items-center gap-2.5 bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2">
                <input
                  type="checkbox"
                  checked={completed3}
                  disabled={!morning3.trim()}
                  onChange={(e) => setCompleted3(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                  title="Check off as completed"
                />
                <input
                  type="text"
                  value={morning3}
                  onChange={(e) => setMorning3(e.target.value)}
                  placeholder="3. Vitality, physical health, or spiritual discipline..."
                  className={`flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none ${completed3 ? 'line-through text-gray-400' : ''}`}
                />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">#3 SADHANA</span>
              </div>
            </div>
          </div>

          {/* Evening Wins & Scorecard */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Moon size={17} />
                <span>Evening Wins & Accomplishments</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">{wins.length} recorded</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newWinInput}
                onChange={(e) => setNewWinInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWin(); } }}
                placeholder="Log a meaningful breakthrough, completed deliverable, or victory..."
                className="flex-1 bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddWin}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Log Win</span>
              </button>
            </div>

            {wins.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {wins.map((win, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#141622] border border-white/5 rounded-xl px-3 py-2 text-xs">
                    <span className="text-gray-200 flex items-center gap-2">
                      <Sparkles size={12} className="text-amber-400" />
                      {win}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWin(idx)}
                      className="text-gray-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gratitude & Lessons Learned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gratitudes */}
            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 uppercase tracking-wider">
                <HeartHandshake size={15} />
                <span>Gratitude & Blessings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newGratitudeInput}
                  onChange={(e) => setNewGratitudeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGratitude(); } }}
                  placeholder="I am grateful for..."
                  className="flex-1 bg-[#141622] border border-[#272b3d] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddGratitude}
                  className="bg-[#202538] hover:bg-[#282f48] text-rose-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {gratitudes.length > 0 && (
                <div className="space-y-1 pt-1 max-h-28 overflow-y-auto">
                  {gratitudes.map((grat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#141622] px-2 py-1 rounded text-xs border border-white/5">
                      <span className="text-gray-300 truncate text-[11px]">{grat}</span>
                      <button onClick={() => handleRemoveGratitude(idx)} className="text-gray-500 hover:text-rose-400 p-0.5">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retrospective Lessons */}
            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <Lightbulb size={15} />
                <span>Lessons & Realizations</span>
              </div>
              <textarea
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="What did today teach me about my mind, habits, or strategy?"
                rows={3}
                className="w-full bg-[#141622] border border-[#272b3d] rounded-xl p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Stream of Consciousness & Inner Contemplation */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <h3 className="font-bold uppercase tracking-wider">
                Daily Stream of Consciousness & Contemplation
              </h3>
              <span className="font-mono text-[10px] text-gray-500">
                {content.trim() ? `${content.trim().split(/\s+/).length} words` : '0 words'}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your contemplative notes, observations on mind states, insights from meditation, or philosophical inquiry..."
              rows={7}
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl p-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed font-mono"
            />
          </div>

        </div>

        {/* Right Column (4 cols): Historical Journal Timeline */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={15} className="text-indigo-400" />
                Journal History ({entries.length})
              </h3>
              <span className="text-[10px] font-mono text-gray-500">Saved Offline</span>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center">No journal entries saved yet.</p>
              ) : (
                entries.map(e => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedDate(e.date)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      selectedDate === e.date
                        ? 'bg-[#1e2336] border-indigo-500/50 shadow-md'
                        : 'bg-[#141622] border-[#252a3b] hover:bg-[#181b28]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono font-bold text-white flex items-center gap-1">
                        {e.date}
                        {e.date === todayStr && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded">Today</span>}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-400 font-mono">⚡ {e.energyScore}/10</span>
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleDeleteEntry(e.date);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-0.5 transition-opacity"
                          title="Delete entry"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2">
                      {e.morningTop3?.[0] ? `Top 1: ${e.morningTop3[0]}` : (e.content || 'Journal entry recorded')}
                    </p>
                    {e.morningCompleted && e.morningCompleted.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                        <CheckCircle2 size={10} />
                        <span>Scorecard: {e.morningCompleted.filter(Boolean).length}/{e.morningCompleted.length} done</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
