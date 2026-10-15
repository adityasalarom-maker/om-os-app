import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JournalEntry } from '../db';
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
  Trash2 
} from 'lucide-react';

export const JournalView: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Form state
  const [mood, setMood] = useState(8);
  const [energy, setEnergy] = useState(8);
  const [morning1, setMorning1] = useState('');
  const [morning2, setMorning2] = useState('');
  const [morning3, setMorning3] = useState('');
  const [win1, setWin1] = useState('');
  const [win2, setWin2] = useState('');
  const [content, setContent] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  const entries = useLiveQuery(() => db.journal.orderBy('date').reverse().toArray(), []) || [];
  const activeEntry = useLiveQuery(() => db.journal.where('date').equals(selectedDate).first(), [selectedDate]);

  // Sync state with active entry when selectedDate changes
  React.useEffect(() => {
    if (activeEntry) {
      setMood(activeEntry.moodScore || 8);
      setEnergy(activeEntry.energyScore || 8);
      setMorning1(activeEntry.morningTop3?.[0] || '');
      setMorning2(activeEntry.morningTop3?.[1] || '');
      setMorning3(activeEntry.morningTop3?.[2] || '');
      setWin1(activeEntry.eveningWins?.[0] || '');
      setWin2(activeEntry.eveningWins?.[1] || '');
      setContent(activeEntry.content || '');
    } else {
      setMorning1('');
      setMorning2('');
      setMorning3('');
      setWin1('');
      setWin2('');
      setContent('');
    }
    setSavedStatus(false);
  }, [activeEntry, selectedDate]);

  const handleSaveEntry = async () => {
    const now = Date.now();
    const entryData: JournalEntry = {
      id: `journal-${selectedDate}`,
      date: selectedDate,
      entryType: 'Daily',
      moodScore: mood,
      energyScore: energy,
      morningTop3: [morning1, morning2, morning3].filter(Boolean),
      eveningWins: [win1, win2].filter(Boolean),
      content: content.trim(),
      createdAt: activeEntry ? activeEntry.createdAt : now,
      updatedAt: now
    };

    await db.journal.put(entryData);


    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookHeart className="text-rose-400" size={22} />
            <span>Journal & Inner Reflection</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Morning intentional planning, evening scorecard, and daily energy/mood tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#141622] border border-[#282d3e] text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            onClick={handleSaveEntry}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Save size={15} />
            <span>{savedStatus ? 'Saved!' : 'Save Entry'}</span>
          </button>
        </div>
      </div>

      {savedStatus && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Journal entry recorded securely in local database.</span>
        </div>
      )}

      {/* Main Journal Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Morning Top 3, Evening Wins, Reflection */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Energy & Mood Sliders */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">
              Vitality & Mood Indexes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                  <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Zap size={15} /> Pranic Energy Level
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
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                  <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Smile size={15} /> Mental Clarity & Mood
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
              </div>
            </div>
          </div>

          {/* Morning Top 3 Intentions */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sun size={16} />
              <span>Morning Top 3 Intentions (High Leverage)</span>
            </div>
            <input
              type="text"
              value={morning1}
              onChange={(e) => setMorning1(e.target.value)}
              placeholder="1. Primary deep work outcome for the day..."
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={morning2}
              onChange={(e) => setMorning2(e.target.value)}
              placeholder="2. Essential secondary execution priority..."
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={morning3}
              onChange={(e) => setMorning3(e.target.value)}
              placeholder="3. Physical vitality or spiritual discipline..."
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Evening Scorecard & Wins */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Moon size={16} />
              <span>Evening Wins & Lessons</span>
            </div>
            <input
              type="text"
              value={win1}
              onChange={(e) => setWin1(e.target.value)}
              placeholder="1. Key win or milestone accomplished today..."
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={win2}
              onChange={(e) => setWin2(e.target.value)}
              placeholder="2. Meaningful lesson, realization, or gratitude..."
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Thought Dump / Free Reflection */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Daily Stream of Consciousness & Reflection
            </h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your contemplative notes, observations on mind states, insights from meditation, or day review..."
              rows={6}
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl p-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed font-mono"
            />
          </div>

        </div>

        {/* Right Column (4 cols): Historical Journal Timeline */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={15} className="text-indigo-400" />
              Journal History ({entries.length})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {entries.map(e => (
                <div
                  key={e.id}
                  onClick={() => setSelectedDate(e.date)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedDate === e.date
                      ? 'bg-[#1e2336] border-indigo-500/50'
                      : 'bg-[#141622] border-[#252a3b] hover:bg-[#181b28]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-bold text-white">{e.date}</span>
                    <span className="text-[10px] text-amber-400 font-mono">⚡ {e.energyScore}/10</span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">
                    {e.content || (e.morningTop3?.[0] ? `Top 1: ${e.morningTop3[0]}` : 'Journal entry recorded')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
