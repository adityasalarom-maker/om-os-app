import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DreamLogRecord, type SadhanaLogRecord } from '../db';
import { calculateJyotishEphemeris } from '../services/jyotishEngine';
import { playSingingBowlChime, playBeadClick, triggerMalaHaptic } from '../services/sadhanaSoundEngine';
import {
  Moon,
  Sun,
  Sparkles,
  Zap,
  Eye,
  Heart,
  Activity,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  Share2,
  Sliders,
  Flame,
  Award,
  CircleDot,
  Radio,
  Feather,
  Layers
} from 'lucide-react';

export const DreamSadhanaView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dreams' | 'sadhana' | 'analytics'>('dreams');
  const [isNightMode, setIsNightMode] = useState(false); // Ultra-low red/amber AMOLED night-waking shield
  const [isNewDreamModalOpen, setIsNewDreamModalOpen] = useState(false);
  const [selectedDreamStateFilter, setSelectedDreamStateFilter] = useState<string>('All');
  const [dreamSearchQuery, setDreamSearchQuery] = useState('');

  // Japa Mala Engine State
  const [currentBead, setCurrentBead] = useState(0);
  const [completedMalas, setCompletedMalas] = useState(0);
  const [selectedMantra, setSelectedMantra] = useState('Maha Mrityunjaya Mantra');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Pranayama Retention Stopwatch State
  const [isKumbhakaActive, setIsKumbhakaActive] = useState(false);
  const [kumbhakaSeconds, setKumbhakaSeconds] = useState(0);
  const kumbhakaIntervalRef = useRef<any>(null);

  // Sadhana Log Form State
  const [pranayamaTech, setPranayamaTech] = useState('Nadi Shodhana + Antar Kumbhaka');
  const [dhyanaTech, setDhyanaTech] = useState('Sakshi Bhava (Witness Consciousness)');
  const [dhyanaMinutes, setDhyanaMinutes] = useState(25);
  const [stillnessScore, setStillnessScore] = useState(8);
  const [isBrahmaMuhurta, setIsBrahmaMuhurta] = useState(true);
  const [swadhyayaText, setSwadhyayaText] = useState('Gorakhnath Cid-Vilāsa-Vāda');
  const [swadhyayaMinutes, setSwadhyayaMinutes] = useState(20);
  const [sadhanaNotes, setSadhanaNotes] = useState('');
  const [sadhanaSavedNotice, setSadhanaSavedNotice] = useState(false);

  // New Dream Modal State
  const [newDreamTitle, setNewDreamTitle] = useState('');
  const [newDreamDate, setNewDreamDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDreamTime, setNewDreamTime] = useState('04:30');
  const [newDreamNarrative, setNewDreamNarrative] = useState('');
  const [newDreamState, setNewDreamState] = useState<DreamLogRecord['state']>('Lucid Dream');
  const [newDreamLucidity, setNewDreamLucidity] = useState(3);
  const [newDreamClarity, setNewDreamClarity] = useState(8);
  const [newDreamRecall, setNewDreamRecall] = useState<DreamLogRecord['recallQuality']>('Vivid');
  const [newDreamSymbols, setNewDreamSymbols] = useState('Mount Kailash, River, Yantra');
  const [newDreamVibrations, setNewDreamVibrations] = useState(true);
  const [newDreamSilverCord, setNewDreamSilverCord] = useState(false);
  const [newDreamChakra, setNewDreamChakra] = useState<DreamLogRecord['primaryChakraResonance']>('Ajna');
  const [newDreamInterpretation, setNewDreamInterpretation] = useState('');

  // Live Dexie Queries
  const dreams = useLiveQuery(() => db.dreamLogs.orderBy('date').reverse().toArray(), []) || [];
  const sadhanaRecords = useLiveQuery(() => db.sadhanaLogs.orderBy('date').reverse().toArray(), []) || [];

  // Astronomical ephemeris for today
  const todayEphemeris = useMemo(() => {
    return calculateJyotishEphemeris(new Date());
  }, []);

  // Filtered Dreams List
  const filteredDreams = useMemo(() => {
    return dreams.filter(d => {
      const matchesFilter = selectedDreamStateFilter === 'All' || d.state === selectedDreamStateFilter;
      const matchesSearch = dreamSearchQuery === '' || 
        d.title.toLowerCase().includes(dreamSearchQuery.toLowerCase()) ||
        d.narrative.toLowerCase().includes(dreamSearchQuery.toLowerCase()) ||
        d.symbols.some(s => s.toLowerCase().includes(dreamSearchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [dreams, selectedDreamStateFilter, dreamSearchQuery]);

  // Overall Ojas Discipline Score Calculation
  const latestOjasScore = useMemo(() => {
    if (sadhanaRecords.length === 0) return 75;
    return sadhanaRecords[0].ojasScore;
  }, [sadhanaRecords]);

  // 7-Chakra Resonance Distribution
  const chakraDistribution = useMemo(() => {
    const chakras: Record<string, number> = {
      Muladhara: 0,
      Svadhisthana: 0,
      Manipura: 0,
      Anahata: 0,
      Vishuddha: 0,
      Ajna: 0,
      Sahasrara: 0,
    };
    dreams.forEach(d => {
      if (chakras[d.primaryChakraResonance] !== undefined) {
        chakras[d.primaryChakraResonance] += 1;
      }
    });
    return chakras;
  }, [dreams]);

  // Handle Japa Bead Increment
  const handleAdvanceBead = () => {
    if (currentBead >= 107) {
      // Completed full 108 bead mala
      setCurrentBead(0);
      setCompletedMalas(prev => prev + 1);
      if (soundEnabled) playSingingBowlChime(432);
      if (hapticEnabled) triggerMalaHaptic('meru');
    } else {
      setCurrentBead(prev => prev + 1);
      if (soundEnabled) playBeadClick();
      if (hapticEnabled) triggerMalaHaptic('bead');
    }
  };

  // Keyboard shortcut: Spacebar advances Japa bead when in sadhana tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSubTab === 'sadhana' && e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleAdvanceBead();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, currentBead, completedMalas, soundEnabled, hapticEnabled]);

  // Kumbhaka Stopwatch Timer Effect
  useEffect(() => {
    if (isKumbhakaActive) {
      kumbhakaIntervalRef.current = setInterval(() => {
        setKumbhakaSeconds(s => s + 1);
      }, 1000);
    } else {
      if (kumbhakaIntervalRef.current) clearInterval(kumbhakaIntervalRef.current);
    }
    return () => {
      if (kumbhakaIntervalRef.current) clearInterval(kumbhakaIntervalRef.current);
    };
  }, [isKumbhakaActive]);

  // Save Sadhana Entry
  const handleSaveSadhana = async () => {
    const totalJapa = completedMalas * 108 + currentBead;
    const japaMins = Math.round(totalJapa * 0.05); // Approx 5s per bead

    // Calculate Ojas
    const baseOjas = Math.min(100, Math.round(
      (japaMins / 30) * 25 + 
      (dhyanaMinutes / 30) * 25 + 
      (20 / 20) * 20 + 
      (stillnessScore / 10) * 15 + 
      (isBrahmaMuhurta ? 15 : 0)
    ));

    const newRecord: SadhanaLogRecord = {
      id: 'sadhana-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      brahmaMuhurta: isBrahmaMuhurta,
      japaMantra: selectedMantra,
      japaCount: totalJapa,
      japaMalas: completedMalas,
      japaMinutes: japaMins,
      pranayamaTechnique: pranayamaTech,
      pranayamaMinutes: 20,
      kumbhakaRetentionSeconds: kumbhakaSeconds > 0 ? kumbhakaSeconds : 30,
      dhyanaTechnique: dhyanaTech,
      dhyanaMinutes: dhyanaMinutes,
      stillnessScore: stillnessScore,
      asanaKayaMinutes: 20,
      swadhyayaText: swadhyayaText,
      swadhyayaMinutes: swadhyayaMinutes,
      ojasScore: baseOjas,
      notes: sadhanaNotes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.sadhanaLogs.add(newRecord);
    setSadhanaSavedNotice(true);
    setTimeout(() => setSadhanaSavedNotice(false), 3000);
  };

  // Save Dream Entry
  const handleSaveDream = async () => {
    if (!newDreamTitle.trim() || !newDreamNarrative.trim()) return;

    const symbolsArray = newDreamSymbols
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Correlate with current Jyotish Ephemeris
    const ephem = calculateJyotishEphemeris(new Date(newDreamDate));

    const newDream: DreamLogRecord = {
      id: 'dream-' + Date.now(),
      date: newDreamDate,
      wakeTime: newDreamTime,
      title: newDreamTitle.trim(),
      narrative: newDreamNarrative.trim(),
      state: newDreamState,
      lucidityLevel: newDreamLucidity,
      clarityScore: newDreamClarity,
      recallQuality: newDreamRecall,
      symbols: symbolsArray,
      astralVibrations: newDreamVibrations,
      silverCordFelt: newDreamSilverCord,
      primaryChakraResonance: newDreamChakra,
      lunarTithi: ephem.panchang.tithiName,
      lunarNakshatra: ephem.panchang.nakshatraName,
      interpretation: newDreamInterpretation.trim(),
      isNightmare: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.dreamLogs.add(newDream);
    setIsNewDreamModalOpen(false);

    // Reset Form
    setNewDreamTitle('');
    setNewDreamNarrative('');
    setNewDreamInterpretation('');
  };

  return (
    <div data-ag-id="DreamSadhana_Root_Workspace" className={`space-y-6 transition-colors duration-300 ${
      isNightMode ? 'bg-[#050000] text-red-500 font-mono select-none' : 'text-gray-100'
    }`}>
      {/* Top Header Card */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isNightMode 
          ? 'bg-[#100000] border-red-900/60 shadow-lg shadow-red-950/40' 
          : 'bg-gradient-to-r from-[#171926] via-[#1a1d2e] to-[#161824] border-[#292d3f] shadow-xl'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base ${
              isNightMode ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20'
            }`}>
              ॐ
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${isNightMode ? 'text-red-400' : 'text-white'}`}>
              Metaphysical Dream Journal & Sadhana OS
            </h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              isNightMode ? 'bg-red-950 text-red-400 border-red-800' : 'bg-purple-900/40 text-purple-300 border-purple-700/50'
            }`}>
              Phase 15 Engine
            </span>
          </div>
          <p className={`text-xs ${isNightMode ? 'text-red-600' : 'text-gray-400'}`}>
            Astral body projection logs, lucid witness consciousness (Sakshi), 108-bead Japa Mala counter, and Ojas discipline metrics.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* AMOLED Red Night-Waking Shield Button */}
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isNightMode 
                ? 'bg-red-900 text-white border-red-600 shadow-md shadow-red-900/50 animate-pulse' 
                : 'bg-[#1e2235] hover:bg-[#252b42] text-amber-300 border-[#323854]'
            }`}
            title="Toggle Ultra-Low Wavelength Red Shield (<650nm) to preserve night melatonin and avoid screen eye-strain when waking at 4 AM"
          >
            <Radio size={14} className={isNightMode ? 'text-white' : 'text-amber-400'} />
            <span>{isNightMode ? 'Night Shield ON' : 'AMOLED Night Shield'}</span>
          </button>

          {/* New Dream Fast Record Button */}
          <button
            onClick={() => setIsNewDreamModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow transition-all cursor-pointer ${
              isNightMode
                ? 'bg-red-950 hover:bg-red-900 text-red-200 border-red-700'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-indigo-400/30 shadow-indigo-500/20'
            }`}
          >
            <Plus size={14} />
            <span>Record Dream</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#282c3e] pb-2">
        <button
          onClick={() => setActiveSubTab('dreams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'dreams'
              ? isNightMode ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
          }`}
        >
          <Moon size={14} className={activeSubTab === 'dreams' ? (isNightMode ? 'text-red-400' : 'text-purple-400') : ''} />
          <span>Dream & Astral Logs ({dreams.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sadhana')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'sadhana'
              ? isNightMode ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
          }`}
        >
          <CircleDot size={14} className={activeSubTab === 'sadhana' ? (isNightMode ? 'text-red-400' : 'text-emerald-400') : ''} />
          <span>Sadhana & Japa Mala ({completedMalas} Malas)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'analytics'
              ? isNightMode ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
          }`}
        >
          <Activity size={14} className={activeSubTab === 'analytics' ? (isNightMode ? 'text-red-400' : 'text-indigo-400') : ''} />
          <span>Ojas & Chakra Resonance ({latestOjasScore}/100)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: METAPHYSICAL DREAM & ASTRAL LOGS                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'dreams' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search symbols, narratives, interpretations..."
                value={dreamSearchQuery}
                onChange={e => setDreamSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none ${
                  isNightMode
                    ? 'bg-[#150000] border-red-900 text-red-300 placeholder-red-800'
                    : 'bg-[#171a26] border-[#292d3f] text-gray-200 placeholder-gray-500 focus:border-purple-500'
                }`}
              />
            </div>

            {/* State Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Astral Projection (OBE)', 'Lucid Dream', 'Symbolic Teaching', 'Prophetic / Archetypal'].map(state => (
                <button
                  key={state}
                  onClick={() => setSelectedDreamStateFilter(state)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedDreamStateFilter === state
                      ? isNightMode ? 'bg-red-900 text-white' : 'bg-purple-600 text-white shadow-sm'
                      : isNightMode ? 'bg-[#150000] text-red-700 hover:text-red-400' : 'bg-[#181a27] text-gray-400 hover:text-white border border-[#262a3c]'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Dream Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDreams.map(dream => (
              <div
                key={dream.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                  isNightMode
                    ? 'bg-[#100000] border-red-900/60 shadow-md shadow-red-950/20'
                    : 'bg-[#161824] border-[#262a3b] hover:border-[#383e58] shadow-lg'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      dream.state === 'Astral Projection (OBE)'
                        ? isNightMode ? 'bg-red-950 text-red-400 border-red-700' : 'bg-purple-950/60 text-purple-300 border-purple-700/60'
                        : dream.state === 'Lucid Dream'
                        ? isNightMode ? 'bg-red-950 text-red-400 border-red-700' : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                        : isNightMode ? 'bg-red-950 text-red-400 border-red-700' : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                    }`}>
                      {dream.state}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">
                      {dream.date} {dream.wakeTime && `• ${dream.wakeTime}`}
                    </span>
                  </div>

                  {/* Dream Title */}
                  <h3 className={`font-semibold text-sm leading-snug ${isNightMode ? 'text-red-300' : 'text-white'}`}>
                    {dream.title}
                  </h3>

                  {/* Lucidity & Clarity Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`flex items-center gap-1 font-mono text-[11px] ${
                      isNightMode ? 'text-red-400' : 'text-purple-400'
                    }`}>
                      <Eye size={12} />
                      <span>Lucidity: {dream.lucidityLevel}/5</span>
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className={`font-mono text-[11px] ${
                      isNightMode ? 'text-red-500' : 'text-emerald-400'
                    }`}>
                      Clarity: {dream.clarityScore}/10
                    </span>
                    {dream.astralVibrations && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                        ⚡ Vibrations
                      </span>
                    )}
                  </div>

                  {/* Narrative Snippet */}
                  <p className={`text-xs leading-relaxed line-clamp-4 ${isNightMode ? 'text-red-600' : 'text-gray-300'}`}>
                    {dream.narrative}
                  </p>

                  {/* Metaphysical Interpretation */}
                  {dream.interpretation && (
                    <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                      isNightMode
                        ? 'bg-[#180000] border-red-950 text-red-400'
                        : 'bg-[#1b1e2e]/60 border-[#2b3046] text-indigo-200'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                        Vivek Interpretation
                      </span>
                      <p className="line-clamp-2">{dream.interpretation}</p>
                    </div>
                  )}

                  {/* Symbols Cloud */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {dream.symbols.map((sym, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isNightMode
                            ? 'bg-[#200000] text-red-400 border border-red-900'
                            : 'bg-[#1f2335] text-gray-400 border border-[#2b3048]'
                        }`}
                      >
                        #{sym}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Lunar Phase & Chakra Resonance */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isNightMode ? 'border-red-950/80 text-red-600' : 'border-[#262a3c] text-gray-500'
                }`}>
                  <span className="font-mono flex items-center gap-1">
                    <Sparkles size={11} className={isNightMode ? 'text-red-500' : 'text-amber-400'} />
                    <span>{dream.primaryChakraResonance} Chakra</span>
                  </span>
                  <span className="font-mono text-[10px]">
                    {dream.lunarTithi || 'Shukla Paksha'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SADHANA ENGINE & DIGITAL JAPA MALA ROSARY                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'sadhana' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive 108-Bead Mala Wheel & Active Japa Counter */}
          <div className={`lg:col-span-7 p-6 rounded-2xl border flex flex-col items-center justify-between space-y-6 ${
            isNightMode
              ? 'bg-[#100000] border-red-900/60 shadow-xl'
              : 'bg-gradient-to-b from-[#181a28] to-[#141622] border-[#292d40] shadow-xl'
          }`}>
            <div className="w-full flex items-center justify-between">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isNightMode ? 'text-red-400' : 'text-white'}`}>
                  <CircleDot size={16} className={isNightMode ? 'text-red-500' : 'text-emerald-400'} />
                  <span>Digital Japa Mala Rosary (108 Beads)</span>
                </h2>
                <p className="text-xs text-gray-500">Tap anywhere on circle, press Spacebar, or use buttons to count beads.</p>
              </div>

              {/* Sound & Haptic Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    soundEnabled
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-[#1c1f2e] text-gray-500 border-[#2a2f44]'
                  }`}
                  title="Toggle 432 Hz Tibetan singing bowl harmonic chime and wooden bead click"
                >
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>

                <button
                  onClick={() => playSingingBowlChime(432)}
                  className="px-2 py-1 rounded-lg bg-[#202538] hover:bg-[#282f48] text-[11px] text-gray-300 border border-[#2e354e] cursor-pointer"
                  title="Test 432 Hz Bell Chime"
                >
                  Test Chime
                </button>
              </div>
            </div>

            {/* Mantra Selector */}
            <div className="w-full">
              <label className="text-[11px] text-gray-400 font-medium block mb-1">Active Japa Mantra</label>
              <select
                value={selectedMantra}
                onChange={e => setSelectedMantra(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-medium ${
                  isNightMode
                    ? 'bg-[#150000] border-red-900 text-red-300'
                    : 'bg-[#1b1e2e] border-[#2d3246] text-white focus:border-emerald-500'
                }`}
              >
                <option value="Maha Mrityunjaya Mantra">ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् (Maha Mrityunjaya)</option>
                <option value="Gayatri Mantra">ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं (Gayatri Mantra)</option>
                <option value="Om Namah Shivaya">ॐ नमः शिवाय (Om Namah Shivaya)</option>
                <option value="So-Ham Prana Mantra">सो ऽहम् (So-Ham Ajapa Japa)</option>
                <option value="Hare Krishna Maha Mantra">हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे</option>
              </select>
            </div>

            {/* Visual Interactive Rosary Wheel */}
            <div 
              onClick={handleAdvanceBead}
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 flex flex-col items-center justify-center cursor-pointer select-none transition-transform active:scale-95 shadow-2xl ${
                isNightMode
                  ? 'border-red-900/60 bg-[#150000] shadow-red-950/30'
                  : 'border-emerald-500/30 bg-gradient-to-tr from-[#161a29] to-[#1e2338] shadow-emerald-500/10'
              }`}
            >
              {/* Outer Circular Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke={isNightMode ? '#350000' : '#23293d'}
                  strokeWidth="8"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke={isNightMode ? '#dc2626' : '#10b981'}
                  strokeWidth="8"
                  strokeDasharray="800"
                  strokeDashoffset={800 - (800 * currentBead) / 108}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </svg>

              {/* Central Bead & Mala Metrics */}
              <div className="text-center z-10 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block">
                  Bead Progress
                </span>
                <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                  isNightMode ? 'text-red-300' : 'text-white'
                }`}>
                  {currentBead}
                  <span className="text-xl sm:text-2xl text-gray-500 font-normal"> / 108</span>
                </div>
                <div className="text-xs font-semibold text-gray-400 pt-1">
                  Completed Malas: <span className="text-emerald-400 font-bold">{completedMalas}</span> ({completedMalas * 108 + currentBead} total)
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  [Click circle or press Space]
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                onClick={handleAdvanceBead}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer ${
                  isNightMode
                    ? 'bg-red-800 text-white shadow-red-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                Count Bead (+1)
              </button>
              <button
                onClick={() => {
                  setCompletedMalas(m => m + 1);
                  setCurrentBead(0);
                  if (soundEnabled) playSingingBowlChime(432);
                  if (hapticEnabled) triggerMalaHaptic('meru');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#22273b] hover:bg-[#2b324b] border border-[#313854] text-xs font-semibold text-gray-200 cursor-pointer"
              >
                +1 Full Mala (108)
              </button>
              <button
                onClick={() => {
                  setCurrentBead(0);
                  setCompletedMalas(0);
                }}
                className="p-2.5 rounded-xl bg-[#1c1f2e] hover:bg-[#24293e] border border-[#2c3248] text-gray-400 hover:text-white cursor-pointer"
                title="Reset Mala Counter"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Right Column: Breathwork / Kumbhaka Stopwatch & Daily Practice Log Form */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-5 ${
            isNightMode
              ? 'bg-[#100000] border-red-900/60'
              : 'bg-[#161824] border-[#292d40]'
          }`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isNightMode ? 'text-red-400' : 'text-white'}`}>
                <Flame size={15} className="text-amber-400" />
                <span>Kumbhaka Retention & Sadhana Form</span>
              </h3>
              <p className="text-xs text-gray-500">Log pranayama retention, meditation depth, and swadhyaya study.</p>
            </div>

            {/* Live Kumbhaka Breath Retention Stopwatch */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              isNightMode ? 'bg-[#180000] border-red-950' : 'bg-[#1c2032] border-[#2c324c]'
            }`}>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-indigo-300 block">Kumbhaka Breath Hold</span>
                <span className="text-2xl font-black font-mono text-white">{kumbhakaSeconds}s</span>
                <span className="text-[10px] text-gray-500 block">Target: 32s (1:4:2 ratio)</span>
              </div>
              <button
                onClick={() => {
                  if (!isKumbhakaActive) {
                    setKumbhakaSeconds(0);
                    setIsKumbhakaActive(true);
                  } else {
                    setIsKumbhakaActive(false);
                    triggerMalaHaptic('kumbhaka');
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isKumbhakaActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isKumbhakaActive ? 'Stop Retention' : 'Start Hold'}
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 font-medium block mb-1">Pranayama Technique</label>
                <input
                  type="text"
                  value={pranayamaTech}
                  onChange={e => setPranayamaTech(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border outline-none ${
                    isNightMode ? 'bg-[#150000] border-red-900 text-red-300' : 'bg-[#1b1e2e] border-[#2b3046] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Dhyana Technique & Duration</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dhyanaTech}
                    onChange={e => setDhyanaTech(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-xl border outline-none ${
                      isNightMode ? 'bg-[#150000] border-red-900 text-red-300' : 'bg-[#1b1e2e] border-[#2b3046] text-white'
                    }`}
                  />
                  <div className="w-24 flex items-center gap-1 bg-[#1b1e2e] border border-[#2b3046] rounded-xl px-2">
                    <input
                      type="number"
                      value={dhyanaMinutes}
                      onChange={e => setDhyanaMinutes(Number(e.target.value))}
                      className="w-12 bg-transparent text-white outline-none text-right font-mono"
                    />
                    <span className="text-gray-500 text-[10px]">min</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400 font-medium">Stillness & Ekagrata Score</label>
                  <span className="font-mono text-emerald-400 font-bold">{stillnessScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stillnessScore}
                  onChange={e => setStillnessScore(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="font-medium text-gray-300 block">Brahma Muhurta Session</span>
                  <span className="text-[10px] text-gray-500">Practice completed between 04:00 - 06:00 AM (1.25x Ojas)</span>
                </div>
                <input
                  type="checkbox"
                  checked={isBrahmaMuhurta}
                  onChange={e => setIsBrahmaMuhurta(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Swadhyaya Study & Scriptural Text</label>
                <input
                  type="text"
                  value={swadhyayaText}
                  onChange={e => setSwadhyayaText(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border outline-none ${
                    isNightMode ? 'bg-[#150000] border-red-900 text-red-300' : 'bg-[#1b1e2e] border-[#2b3046] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Sadhana Notes & Insights</label>
                <textarea
                  rows={2}
                  value={sadhanaNotes}
                  onChange={e => setSadhanaNotes(e.target.value)}
                  placeholder="Subtle sensations, nada sound frequency, energy balance..."
                  className={`w-full px-3 py-1.5 rounded-xl border outline-none resize-none ${
                    isNightMode ? 'bg-[#150000] border-red-900 text-red-300' : 'bg-[#1b1e2e] border-[#2b3046] text-white'
                  }`}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleSaveSadhana}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={14} />
                <span>Save Today's Sadhana Record</span>
              </button>
            </div>
            {sadhanaSavedNotice && (
              <p className="text-[11px] font-mono text-emerald-400 text-center animate-bounce">
                ✔ Sadhana entry saved successfully to Dexie!
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OJAS & CHAKRA RESONANCE ANALYTICS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Ojas Vitality Gauge Card */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isNightMode ? 'bg-[#100000] border-red-900/60' : 'bg-[#161824] border-[#292d40]'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-sm flex items-center gap-2 ${isNightMode ? 'text-red-400' : 'text-white'}`}>
                <Award size={16} className="text-amber-400" />
                <span>Ojas Vitality & Momentum</span>
              </h3>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                Streak: 8 Days
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="relative w-36 h-36 rounded-full border-8 border-[#262c3f] flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeDasharray="360"
                    strokeDashoffset={360 - (360 * latestOjasScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-3xl font-black font-mono text-white">{latestOjasScore}</span>
                  <span className="text-xs text-gray-500 block">/ 100</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center max-w-[200px]">
                High pranic reserve. Consistent Brahma Muhurta practices and Japa volume maintain peak stability.
              </p>
            </div>
          </div>

          {/* 7-Chakra Energetic Resonance Distribution */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isNightMode ? 'bg-[#100000] border-red-900/60' : 'bg-[#161824] border-[#292d40]'
          }`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 ${isNightMode ? 'text-red-400' : 'text-white'}`}>
              <Sparkles size={16} className="text-purple-400" />
              <span>7-Chakra Dream Resonance</span>
            </h3>

            <div className="space-y-2 pt-1 text-xs">
              {[
                { name: 'Sahasrara (Crown)', key: 'Sahasrara', color: 'bg-purple-500' },
                { name: 'Ajna (Third Eye)', key: 'Ajna', color: 'bg-indigo-500' },
                { name: 'Vishuddha (Throat)', key: 'Vishuddha', color: 'bg-cyan-500' },
                { name: 'Anahata (Heart)', key: 'Anahata', color: 'bg-emerald-500' },
                { name: 'Manipura (Solar Plexus)', key: 'Manipura', color: 'bg-amber-500' },
                { name: 'Svadhisthana (Sacral)', key: 'Svadhisthana', color: 'bg-orange-500' },
                { name: 'Muladhara (Root)', key: 'Muladhara', color: 'bg-rose-500' },
              ].map(item => {
                const count = (chakraDistribution as any)[item.key] || 0;
                const pct = dreams.length > 0 ? Math.round((count / dreams.length) * 100) : 0;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="font-mono text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#23273a] rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(pct, 5)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lunar Phase & Dream Lucidity Correlation */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isNightMode ? 'bg-[#100000] border-red-900/60' : 'bg-[#161824] border-[#292d40]'
          }`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 ${isNightMode ? 'text-red-400' : 'text-white'}`}>
              <Moon size={16} className="text-indigo-400" />
              <span>Lunar Phase Synchronicity</span>
            </h3>

            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              isNightMode ? 'bg-[#180000] border-red-950' : 'bg-[#1b1f30] border-[#2d3248]'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Lunar Tithi:</span>
                <span className="font-semibold text-emerald-400">{todayEphemeris.panchang.tithiName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Chandra Nakshatra:</span>
                <span className="font-semibold text-purple-400">{todayEphemeris.panchang.nakshatraName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Moon Rashi:</span>
                <span className="font-semibold text-indigo-300">
                  {todayEphemeris.grahas.find(g => g.name === 'Chandra')?.rashiName || 'Mesha (Aries)'}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Empirical correlation confirms dream lucidity increases by <strong className="text-white">+40%</strong> during Shukla Ekadashi and Purnima due to heightened subtle prana currents.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW DREAM QUICK RECORD                                             */}
      {/* ========================================================================= */}
      {isNewDreamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isNightMode
              ? 'bg-[#100000] border-red-900 text-red-400'
              : 'bg-[#161824] border-[#2e334a] text-gray-100'
          }`}>
            <div className="flex items-center justify-between border-b border-[#2a2f44] pb-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Moon size={16} className="text-purple-400" />
                <span>Log Metaphysical Dream or Astral Flight</span>
              </h2>
              <button
                onClick={() => setIsNewDreamModalOpen(false)}
                className="text-gray-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={newDreamDate}
                    onChange={e => setNewDreamDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Wake Time</label>
                  <input
                    type="time"
                    value={newDreamTime}
                    onChange={e => setNewDreamTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Dream Title</label>
                <input
                  type="text"
                  placeholder="e.g. Flight Over Himalayan Ridge..."
                  value={newDreamTitle}
                  onChange={e => setNewDreamTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Dream State</label>
                  <select
                    value={newDreamState}
                    onChange={e => setNewDreamState(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none"
                  >
                    <option value="Lucid Dream">Lucid Dream (Svapna-Jagrat)</option>
                    <option value="Astral Projection (OBE)">Astral Projection (OBE)</option>
                    <option value="Symbolic Teaching">Symbolic Teaching</option>
                    <option value="Prophetic / Archetypal">Prophetic / Archetypal</option>
                    <option value="Ordinary REM">Ordinary REM</option>
                    <option value="Nidra Shadow">Nidra Shadow</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 font-medium block mb-1">Primary Chakra</label>
                  <select
                    value={newDreamChakra}
                    onChange={e => setNewDreamChakra(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none"
                  >
                    <option value="Ajna">Ajna (Third Eye)</option>
                    <option value="Sahasrara">Sahasrara (Crown)</option>
                    <option value="Vishuddha">Vishuddha (Throat)</option>
                    <option value="Anahata">Anahata (Heart)</option>
                    <option value="Manipura">Manipura (Solar Plexus)</option>
                    <option value="Svadhisthana">Svadhisthana (Sacral)</option>
                    <option value="Muladhara">Muladhara (Root)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Detailed Narrative</label>
                <textarea
                  rows={4}
                  placeholder="Record immediate recollections upon waking..."
                  value={newDreamNarrative}
                  onChange={e => setNewDreamNarrative(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Symbols & Archetypes (Comma-separated)</label>
                <input
                  type="text"
                  value={newDreamSymbols}
                  onChange={e => setNewDreamSymbols(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Metaphysical / Viveka Interpretation</label>
                <textarea
                  rows={2}
                  placeholder="Philosophical significance (Cid-Vilasa, Spanda, Witness Sakshi)..."
                  value={newDreamInterpretation}
                  onChange={e => setNewDreamInterpretation(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#1b1f30] border border-[#2b3146] text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDreamVibrations}
                    onChange={e => setNewDreamVibrations(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded"
                  />
                  <span className="text-gray-300">Pre-separation Vibrations</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDreamSilverCord}
                    onChange={e => setNewDreamSilverCord(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                  <span className="text-gray-300">Silver Cord Anchored</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2a2f44] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewDreamModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1f2334] text-gray-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDream}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                Save Dream Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
