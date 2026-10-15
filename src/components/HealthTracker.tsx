import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type HealthEntry } from '../db';
import { 
  Heart, 
  Flame, 
  Moon, 
  Sparkles, 
  Plus, 
  Calendar, 
  Activity, 
  Smile, 
  CheckCircle2, 
  Leaf, 
  Droplet,
  Sun
} from 'lucide-react';

export const HealthTracker: React.FC = () => {
  const healthEntries = useLiveQuery(() => db.health.orderBy('date').reverse().toArray(), []) || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = healthEntries.find(e => e.date === todayStr);

  const [isAdding, setIsAdding] = useState(false);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState<HealthEntry['sleepQuality']>('Deep / Restful');
  const [digestionAgni, setDigestionAgni] = useState<HealthEntry['digestionAgni']>('Sama (Balanced)');
  const [pranaScore, setPranaScore] = useState(9);
  const [yogaMin, setYogaMin] = useState(30);
  const [dietType, setDietType] = useState<HealthEntry['dietType']>('Sattvic');
  const [selectedHerbs, setSelectedHerbs] = useState<string[]>(['Organic Triphala Churna']);
  const [symptoms, setSymptoms] = useState('');
  const [doshaVata, setDoshaVata] = useState<'Balanced' | 'Elevated'>('Balanced');
  const [doshaPitta, setDoshaPitta] = useState<'Balanced' | 'Elevated'>('Balanced');
  const [doshaKapha, setDoshaKapha] = useState<'Balanced' | 'Elevated'>('Balanced');

  const commonHerbs = [
    'Organic Triphala Churna',
    'Ashwagandha Extract',
    'Brahmi Vati',
    'A2 Desi Cow Ghee',
    'Chyawanprash',
    'Turmeric & Black Pepper',
    'Tulsi Tea'
  ];

  const handleToggleHerb = (herb: string) => {
    setSelectedHerbs(prev => 
      prev.includes(herb) ? prev.filter(h => h !== herb) : [...prev, herb]
    );
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const entry: HealthEntry = {
      id: todayEntry ? todayEntry.id : `health-${todayStr}`,
      date: todayStr,
      sleepHours,
      sleepQuality,
      digestionAgni,
      doshaState: {
        vata: doshaVata,
        pitta: doshaPitta,
        kapha: doshaKapha,
      },
      pranaScore,
      yogaPranayamaMin: yogaMin,
      dietType,
      herbsTaken: selectedHerbs,
      symptomsOrNotes: symptoms.trim() || 'Balanced state maintained.',
      createdAt: todayEntry ? todayEntry.createdAt : now,
      updatedAt: now,
    };

    await db.health.put(entry);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="text-rose-400" size={22} />
            <span>Health & Ayurveda Dinacharya Tracker</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Holistic vitality management, Tridosha balance (Vata · Pitta · Kapha), Agni digestion scoring, and Ayurvedic routines.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>{isAdding ? 'Close Log Form' : 'Log Today’s Health'}</span>
        </button>
      </div>

      {/* Top Vitality Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pranic Vitality Score */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400">Pranic Energy</span>
            <Sun className="text-amber-400" size={17} />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{todayEntry?.pranaScore || pranaScore}</span>
            <span className="text-xs text-gray-400">/ 10</span>
          </div>
          <span className="text-[10px] text-amber-300/80 mt-1">Peak Mind-Body Vitality</span>
        </div>

        {/* Agni Digestion */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400">Digestive Agni</span>
            <Flame className="text-orange-400" size={17} />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-white block truncate">
              {todayEntry?.digestionAgni.split(' ')[0] || digestionAgni.split(' ')[0]}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1">Sama Metabolic Equilibrium</span>
        </div>

        {/* Sleep & Rest */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400">Rest & Sleep</span>
            <Moon className="text-indigo-400" size={17} />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{todayEntry?.sleepHours || sleepHours}</span>
            <span className="text-xs text-gray-400">hrs</span>
          </div>
          <span className="text-[10px] text-indigo-300 mt-1">{todayEntry?.sleepQuality || sleepQuality}</span>
        </div>

        {/* Diet & Herbs */}
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400">Dietary Flow</span>
            <Leaf className="text-emerald-400" size={17} />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-white">{todayEntry?.dietType || dietType}</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1">
            {(todayEntry?.herbsTaken.length || selectedHerbs.length)} Ayurvedic herbs taken
          </span>
        </div>
      </div>

      {/* Tridosha Equilibrium Card */}
      <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="text-teal-400" size={16} />
            <span>Tridosha Observation Profile</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-mono">Current Body Constitutional Signals</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Vata */}
          <div className="bg-[#141622] border border-[#272b3b] p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white">Vata (Air & Space)</span>
              <span className="text-[10px] text-gray-400 block">Nervous system & movement</span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              (todayEntry?.doshaState.vata || doshaVata) === 'Balanced'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              {todayEntry?.doshaState.vata || doshaVata}
            </span>
          </div>

          {/* Pitta */}
          <div className="bg-[#141622] border border-[#272b3b] p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white">Pitta (Fire & Water)</span>
              <span className="text-[10px] text-gray-400 block">Digestion, Agni & clarity</span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              (todayEntry?.doshaState.pitta || doshaPitta) === 'Balanced'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}>
              {todayEntry?.doshaState.pitta || doshaPitta}
            </span>
          </div>

          {/* Kapha */}
          <div className="bg-[#141622] border border-[#272b3b] p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white">Kapha (Earth & Water)</span>
              <span className="text-[10px] text-gray-400 block">Stability, tissue lubrication</span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              (todayEntry?.doshaState.kapha || doshaKapha) === 'Balanced'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
            }`}>
              {todayEntry?.doshaState.kapha || doshaKapha}
            </span>
          </div>
        </div>
      </div>

      {/* Log Entry Form Modal / Collapsible */}
      {isAdding && (
        <form onSubmit={handleSaveEntry} className="bg-[#181a24] border border-[#3b4260] rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#282d3e] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={17} />
              <span>Log Daily Health, Agni & Dinacharya</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">{todayStr}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prana score */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Pranic Energy Level (1–10): <span className="text-amber-400 font-bold">{pranaScore}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={pranaScore}
                onChange={(e) => setPranaScore(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Sleep Duration: <span className="text-indigo-300 font-bold">{sleepHours} hrs</span>
              </label>
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full accent-indigo-400"
              />
            </div>

            {/* Yoga / Pranayama */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Pranayama / Yoga: <span className="text-emerald-400 font-bold">{yogaMin} min</span>
              </label>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={yogaMin}
                onChange={(e) => setYogaMin(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Digestive Agni */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Digestive Agni</label>
              <select
                value={digestionAgni}
                onChange={(e) => setDigestionAgni(e.target.value as any)}
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Sama (Balanced)">Sama (Balanced & Smooth)</option>
                <option value="Manda (Sluggish)">Manda (Heavy / Sluggish)</option>
                <option value="Tikshna (Intense)">Tikshna (Excess Acid / Sharp)</option>
                <option value="Vishama (Irregular)">Vishama (Variable / Gas)</option>
              </select>
            </div>

            {/* Diet Classification */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Nutrition Guna</label>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value as any)}
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Sattvic">Sattvic (Pure, Fresh, Ghee, Fruit)</option>
                <option value="Rajasic">Rajasic (Spicy, Stimulating, Coffee)</option>
                <option value="Tamasic">Tamasic (Heavy, Stale, Fried)</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            {/* Sleep Quality */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Sleep Quality</label>
              <select
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value as any)}
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Deep / Restful">Deep / Restful</option>
                <option value="Moderate">Moderate</option>
                <option value="Disturbed">Disturbed</option>
              </select>
            </div>
          </div>

          {/* Herbs & Tonics taken */}
          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1.5">
              Herbs, Tonics & Dinacharya Routines
            </label>
            <div className="flex flex-wrap gap-2">
              {commonHerbs.map(herb => {
                const isSelected = selectedHerbs.includes(herb);
                return (
                  <button
                    type="button"
                    key={herb}
                    onClick={() => handleToggleHerb(herb)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'bg-[#141622] border-[#2d344d] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {isSelected ? '? ' : '+ '} {herb}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Symptoms or Self-Observation */}
          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">
              Self-Observation & Symptom Patterns
            </label>
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., Felt calm and centered after pranayama; slight dry eyes in afternoon..."
              className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              Save Daily Health Log
            </button>
          </div>
        </form>
      )}

      {/* Historical Entries Table */}
      <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="text-indigo-400" size={16} />
          <span>Historical Health & Dinacharya Log</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#141622] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#272b3b]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Prana</th>
                <th className="py-2.5 px-3">Agni (Digestion)</th>
                <th className="py-2.5 px-3">Sleep</th>
                <th className="py-2.5 px-3">Yoga</th>
                <th className="py-2.5 px-3">Herbs Taken</th>
                <th className="py-2.5 px-3">Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232738]">
              {healthEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-[#1c1f2e] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-white">{entry.date}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-amber-400">{entry.pranaScore}</span>/10
                  </td>
                  <td className="py-2.5 px-3 text-orange-300">{entry.digestionAgni.split(' ')[0]}</td>
                  <td className="py-2.5 px-3">{entry.sleepHours}h ({entry.sleepQuality.split(' ')[0]})</td>
                  <td className="py-2.5 px-3 text-emerald-400">{entry.yogaPranayamaMin}m</td>
                  <td className="py-2.5 px-3 truncate max-w-xs text-gray-400">
                    {entry.herbsTaken.join(', ')}
                  </td>
                  <td className="py-2.5 px-3 truncate max-w-xs">{entry.symptomsOrNotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
