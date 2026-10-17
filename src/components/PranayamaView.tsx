import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PranayamaSessionRecord } from '../db';
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Smartphone,
  Sparkles,
  Heart,
  Activity,
  Compass,
  Layers,
  Check,
  Flame,
  Moon,
  Sun,
  Timer,
  BookOpen,
  Plus,
  Sliders,
  Award
} from 'lucide-react';
import {
  playBreathPhaseCue,
  triggerBreathHaptic,
  playSingingBowlChime
} from '../services/sadhanaSoundEngine';

export type BreathPhase = 'puraka' | 'antara' | 'rechaka' | 'bahya';

interface PatternDefinition {
  id: string;
  name: PranayamaSessionRecord['patternName'];
  sanskritName: string;
  ratio: [number, number, number, number]; // [Puraka, Antara, Rechaka, Bahya] in seconds
  description: string;
  primaryBenefit: string;
  swaraRecommendation: string;
  category: 'Balancing' | 'Sedating' | 'Energizing' | 'Cooling' | 'Advanced';
}

const CLASSICAL_PATTERNS: PatternDefinition[] = [
  {
    id: 'sama-vritti',
    name: 'Sama Vritti',
    sanskritName: 'समवृत्ति प्राणायाम (Box Breathing)',
    ratio: [4, 4, 4, 4],
    description: 'Equal duration across all four phases of breath for immediate parasympathetic homeostasis.',
    primaryBenefit: 'Mental equilibrium, anxiety reduction, focus',
    swaraRecommendation: 'Suṣumṇā (Equilibrium / Both)',
    category: 'Balancing'
  },
  {
    id: 'visama-vritti',
    name: 'Visama Vritti',
    sanskritName: 'विषमवृत्ति प्राणायाम (Extended Exhale 1:2)',
    ratio: [4, 0, 8, 0],
    description: 'Double-length exhalation to stimulate the vagus nerve and slow cardiovascular rhythm.',
    primaryBenefit: 'Rapid heart-rate deceleration, pre-sleep calm',
    swaraRecommendation: 'Chandra (Iḍā / Left)',
    category: 'Sedating'
  },
  {
    id: 'nadi-shodhana',
    name: 'Nadi Shodhana',
    sanskritName: 'नाडी शोधन (Alternate Nostril 1:4:2:1)',
    ratio: [4, 16, 8, 4],
    description: 'Classical classical ratio balancing Ida and Pingala nadis with deep internal retention.',
    primaryBenefit: 'Hemispheric synchronization, energetic purification',
    swaraRecommendation: 'Alternate Inhale/Exhale Cycles',
    category: 'Balancing'
  },
  {
    id: 'kumbhaka-intensive',
    name: 'Kumbhaka Intensive',
    sanskritName: 'कुम्भक साधना (Hypercapnic Endurance 1:4:2:2)',
    ratio: [4, 16, 8, 8],
    description: 'Advanced dual-retention cycle conditioning cellular tolerance to CO2 and expanding Pranamaya Kosha.',
    primaryBenefit: 'Hypercapnic adaptation, nitric oxide surge, samadhi focus',
    swaraRecommendation: 'Suṣumṇā',
    category: 'Advanced'
  },
  {
    id: 'bhramari',
    name: 'Bhramari',
    sanskritName: 'भ्रामरी प्राणायाम (Bee Humming Resonance)',
    ratio: [4, 0, 12, 0],
    description: 'Slow inhalation followed by elongated humming exhalation causing skull cavity resonance.',
    primaryBenefit: '15x nitric oxide release, pineal stimulation, tinnitus relief',
    swaraRecommendation: 'Chandra or Both',
    category: 'Sedating'
  },
  {
    id: 'sheetali',
    name: 'Sheetali',
    sanskritName: 'शीतली प्राणायाम (Cooling Quench 1:1:1:0)',
    ratio: [5, 5, 5, 0],
    description: 'Inhalation through rolled tongue or teeth with internal pause and nose exhalation.',
    primaryBenefit: 'Pitta heat reduction, blood pressure moderation',
    swaraRecommendation: 'Chandra (Cooling Left)',
    category: 'Cooling'
  }
];

export const PranayamaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metronome' | 'vayu' | 'swara' | 'history'>('metronome');

  // Metronome State
  const [selectedPattern, setSelectedPattern] = useState<PatternDefinition>(CLASSICAL_PATTERNS[0]);
  const [customRatio, setCustomRatio] = useState<[number, number, number, number]>([4, 4, 4, 4]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('puraka');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [nadiNostril, setNadiNostril] = useState<'left' | 'right'>('left');

  // Prana Vayus & Swara State
  const [activeSwara, setActiveSwara] = useState<PranayamaSessionRecord['swaraActive']>('Sushumna (Equilibrium / Both)');
  const [vayuScores, setVayuScores] = useState({
    prana: 8,
    apana: 8,
    samana: 7,
    udana: 8,
    vyana: 8
  });
  const [comfortScore, setComfortScore] = useState(9);
  const [sessionNotes, setSessionNotes] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  // Kumbhaka Stopwatch Tester
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  // Live queries
  const history = useLiveQuery(() => db.pranayamaSessions.orderBy('timestamp').reverse().toArray(), []) || [];

  // Active ratio in effect
  const activeRatio = useMemo(() => {
    return isCustomMode ? customRatio : selectedPattern.ratio;
  }, [isCustomMode, customRatio, selectedPattern]);

  // Phase sequence helper
  const getNextPhase = (phase: BreathPhase): BreathPhase => {
    const [puraka, antara, rechaka, bahya] = activeRatio;
    if (phase === 'puraka') {
      return antara > 0 ? 'antara' : 'rechaka';
    }
    if (phase === 'antara') {
      return 'rechaka';
    }
    if (phase === 'rechaka') {
      return bahya > 0 ? 'bahya' : 'puraka';
    }
    // phase === 'bahya'
    return 'puraka';
  };

  const getPhaseDuration = (phase: BreathPhase): number => {
    const [puraka, antara, rechaka, bahya] = activeRatio;
    switch (phase) {
      case 'puraka': return puraka;
      case 'antara': return antara;
      case 'rechaka': return rechaka;
      case 'bahya': return bahya;
    }
  };

  // Main Pacer Interval Engine
  useEffect(() => {
    let timer: any = null;

    if (isRunning) {
      timer = setInterval(() => {
        setSessionElapsedSeconds(prev => prev + 1);

        setPhaseSecondsLeft(prevSec => {
          if (prevSec <= 1) {
            // Transition to next phase
            const next = getNextPhase(currentPhase);
            const duration = getPhaseDuration(next);

            // Cycle increment when wrapping back to puraka
            if (next === 'puraka') {
              setCycleCount(c => c + 1);
              // Toggle nostril for Nadi Shodhana
              if (selectedPattern.id === 'nadi-shodhana') {
                setNadiNostril(n => (n === 'left' ? 'right' : 'left'));
              }
            }

            setCurrentPhase(next);

            // Fire audio & haptics
            if (soundEnabled) {
              playBreathPhaseCue(next);
            }
            if (hapticsEnabled) {
              triggerBreathHaptic(next);
            }

            return duration;
          }
          return prevSec - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, currentPhase, activeRatio, selectedPattern.id, soundEnabled, hapticsEnabled]);

  // Kumbhaka Stopwatch Interval
  useEffect(() => {
    let swTimer: any = null;
    if (stopwatchRunning) {
      swTimer = setInterval(() => {
        setStopwatchSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (swTimer) clearInterval(swTimer);
    };
  }, [stopwatchRunning]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!isRunning) {
      // First start
      if (soundEnabled && cycleCount === 0 && sessionElapsedSeconds === 0) {
        playBreathPhaseCue(currentPhase);
      }
    }
    setIsRunning(!isRunning);
  };

  // Handle Reset
  const handleReset = () => {
    setIsRunning(false);
    setCurrentPhase('puraka');
    setPhaseSecondsLeft(activeRatio[0]);
    setCycleCount(0);
    setSessionElapsedSeconds(0);
  };

  // Select a preset pattern
  const handleSelectPattern = (pattern: PatternDefinition) => {
    setSelectedPattern(pattern);
    setIsCustomMode(false);
    setIsRunning(false);
    setCurrentPhase('puraka');
    setPhaseSecondsLeft(pattern.ratio[0]);
    setCycleCount(0);
    setSessionElapsedSeconds(0);
  };

  // Save current session to Dexie
  const handleSaveSession = async () => {
    if (sessionElapsedSeconds < 10) return;

    const newRecord: PranayamaSessionRecord = {
      id: `prana-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      patternName: isCustomMode ? 'Custom' : selectedPattern.name,
      ratio: activeRatio,
      totalCycles: cycleCount,
      totalDurationSeconds: sessionElapsedSeconds,
      swaraActive: activeSwara,
      retentionComfortScore: comfortScore,
      pranaVayus: vayuScores,
      heartRateEstimateBpm: 60 - Math.min(15, Math.floor(cycleCount / 2)),
      notes: sessionNotes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.pranayamaSessions.add(newRecord);
    setSavedNotice(true);
    playSingingBowlChime(432);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Phase color & metadata configuration
  const phaseConfig = {
    puraka: {
      label: 'PŪRAKA (Inhale)',
      sanskrit: 'पूरक',
      instruction: 'Draw Prāna deeply down into the pelvic floor',
      color: 'from-cyan-500 to-emerald-500',
      textColor: 'text-cyan-400',
      scale: 'scale-110',
      bgPulse: 'bg-cyan-500/20'
    },
    antara: {
      label: 'ANTARA KUMBHAKA (Hold)',
      sanskrit: 'अन्तर कुम्भक',
      instruction: 'Soothe consciousness in the heart cave (*Hridaya*)',
      color: 'from-amber-400 to-yellow-500',
      textColor: 'text-amber-400',
      scale: 'scale-115',
      bgPulse: 'bg-amber-500/25'
    },
    rechaka: {
      label: 'RECAKA (Exhale)',
      sanskrit: 'रेचक',
      instruction: 'Release all tension and surrender completely',
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-400',
      scale: 'scale-90',
      bgPulse: 'bg-indigo-500/20'
    },
    bahya: {
      label: 'BĀHYA KUMBHAKA (Void Hold)',
      sanskrit: 'बाह्य कुम्भक',
      instruction: 'Rest effortlessly in the still, breathless silence',
      color: 'from-slate-600 to-slate-800',
      textColor: 'text-slate-300',
      scale: 'scale-85',
      bgPulse: 'bg-slate-700/20'
    }
  };

  const currentCfg = phaseConfig[currentPhase];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#161822] border border-[#272b3b]">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Wind size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Prāṇāyāma & Bio-Energy Prāṇa Engine
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PHASE 17
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Classical 4-stage breath metronome (*Catur-Aṅga*), Web Audio harmonic cues, Swara Yoga & 5-Vāyu balance
            </p>
          </div>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                : 'bg-[#1b1e2c] border-[#292e44] text-gray-400 hover:text-white'
            }`}
            title="Toggle 432 Hz Harmonic Web Audio Phase Cues"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'Harmonics ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => setHapticsEnabled(!hapticsEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              hapticsEnabled
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                : 'bg-[#1b1e2c] border-[#292e44] text-gray-400 hover:text-white'
            }`}
            title="Toggle Samsung S25 Ultra & Mobile Haptic Vibration"
          >
            <Smartphone size={14} />
            <span>{hapticsEnabled ? 'Haptics ON' : 'Haptics OFF'}</span>
          </button>
        </div>
      </div>

      {/* Subsystem Navigation Tabs */}
      <div className="flex border-b border-[#272b3b] gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('metronome')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'metronome'
              ? 'bg-[#1c2030] text-cyan-300 border-b-2 border-cyan-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#161824]'
          }`}
        >
          <Timer size={15} />
          <span>Breath Pacer & Metronome</span>
        </button>

        <button
          onClick={() => setActiveTab('vayu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'vayu'
              ? 'bg-[#1c2030] text-amber-300 border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#161824]'
          }`}
        >
          <Activity size={15} />
          <span>5 Prāṇa Vāyus Scorecard</span>
        </button>

        <button
          onClick={() => setActiveTab('swara')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'swara'
              ? 'bg-[#1c2030] text-purple-300 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#161824]'
          }`}
        >
          <Compass size={15} />
          <span>Swara Yoga & Nostril Dominance</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#1c2030] text-emerald-300 border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#161824]'
          }`}
        >
          <BookOpen size={15} />
          <span>Session Logs ({history.length})</span>
        </button>
      </div>

      {/* TAB 1: BREATH METRONOME & VISUAL PACER */}
      {activeTab === 'metronome' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Animated Torus Mandala Pacer */}
          <div className="lg:col-span-7 bg-[#161822] border border-[#272b3b] rounded-2xl p-6 flex flex-col items-center justify-between min-h-[500px] relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${isRunning ? 'opacity-100' : 'opacity-20'} ${currentCfg.bgPulse}`} />

            {/* Top Status Indicators */}
            <div className="w-full flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-300">
                  {isCustomMode ? 'Custom Ratio' : selectedPattern.name}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                  {activeRatio.join(' : ')}s
                </span>
              </div>

              {selectedPattern.id === 'nadi-shodhana' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[11px] text-indigo-300 font-semibold animate-pulse">
                  <span>Active Nostril:</span>
                  <span className="capitalize font-bold text-white">{nadiNostril} ({nadiNostril === 'left' ? 'Iḍā / Moon' : 'Piṅgalā / Sun'})</span>
                </div>
              )}
            </div>

            {/* Central Animated Breathing Torus & Ring */}
            <div className="relative my-8 flex items-center justify-center">
              {/* Outer Pulsing Wave Ring */}
              <div
                className={`w-64 h-64 md:w-80 md:h-80 rounded-full border border-dashed border-cyan-500/30 flex items-center justify-center transition-all duration-1000 ${
                  isRunning ? currentCfg.scale : 'scale-100'
                }`}
              >
                {/* Mid Radial Mandala Ring */}
                <div
                  className={`w-48 h-48 md:w-60 md:h-60 rounded-full bg-gradient-to-tr ${currentCfg.color} p-1 shadow-2xl transition-all duration-1000 ${
                    isRunning ? 'shadow-cyan-500/40' : ''
                  }`}
                >
                  {/* Inner Dark Cavity */}
                  <div className="w-full h-full bg-[#11131c] rounded-full flex flex-col items-center justify-center text-center p-4">
                    <span className="text-3xl md:text-5xl font-black text-white font-mono tracking-tighter">
                      {phaseSecondsLeft}s
                    </span>
                    <span className={`text-xs md:text-sm font-bold uppercase tracking-widest mt-1 ${currentCfg.textColor}`}>
                      {currentCfg.label}
                    </span>
                    <span className="text-[11px] text-gray-400 font-sans mt-0.5">
                      {currentCfg.sanskrit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="text-center z-10 max-w-md">
              <p className="text-xs text-gray-300 font-medium italic">
                "{currentCfg.instruction}"
              </p>
            </div>

            {/* Bottom Controls Bar */}
            <div className="w-full flex items-center justify-between pt-6 border-t border-[#272b3b] z-10 mt-4">
              <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                <div>
                  <span className="text-gray-500">Cycles:</span>{' '}
                  <span className="text-white font-bold">{cycleCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Elapsed:</span>{' '}
                  <span className="text-white font-bold">
                    {Math.floor(sessionElapsedSeconds / 60)}:{(sessionElapsedSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl bg-[#1f2333] hover:bg-[#282d42] text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset Counter"
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  onClick={togglePlay}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                  }`}
                >
                  {isRunning ? <Pause size={15} /> : <Play size={15} />}
                  <span>{isRunning ? 'Pause Pacer' : 'Begin Breathing'}</span>
                </button>

                {sessionElapsedSeconds >= 10 && !isRunning && (
                  <button
                    onClick={handleSaveSession}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                    title="Log session to Dexie"
                  >
                    <Check size={14} />
                    <span>Save Session</span>
                  </button>
                )}
              </div>
            </div>

            {savedNotice && (
              <div className="absolute top-4 right-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl font-mono animate-bounce">
                ✔ Session saved to Dexie!
              </div>
            )}
          </div>

          {/* Right Panel: Pattern Selection & Custom Ratio Builder */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pattern Presets Card */}
            <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders size={16} className="text-cyan-400" />
                  <span>Classical Prāṇāyāma Ratios</span>
                </h3>
                <button
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    isCustomMode
                      ? 'bg-cyan-500 text-white'
                      : 'bg-[#1e2230] text-gray-400 hover:text-white border border-[#2a2f42]'
                  }`}
                >
                  {isCustomMode ? 'Custom Active' : 'Custom Builder'}
                </button>
              </div>

              {/* Preset List */}
              {!isCustomMode ? (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {CLASSICAL_PATTERNS.map(p => {
                    const isSelected = selectedPattern.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPattern(p)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/20 border-cyan-500/50 shadow-sm'
                            : 'bg-[#1a1d2c] border-[#252a3d] hover:bg-[#202538]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                            {p.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12141f] text-gray-300 border border-[#292e42]">
                            {p.ratio.join(' : ')}s
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1">{p.sanskritName}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{p.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                            {p.category}
                          </span>
                          <span className="text-[9px] text-gray-400 truncate">
                            🎯 {p.primaryBenefit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Custom 4-Stage Sliders */
                <div className="space-y-4 bg-[#1a1d2c] p-4 rounded-xl border border-[#272b3d]">
                  <p className="text-xs text-gray-300 font-medium">
                    Configure custom seconds for each stage (*Pūraka : Antara : Recaka : Bāhya*):
                  </p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-cyan-400 mb-1">
                        <span>Pūraka (Inhale)</span>
                        <span className="font-bold">{customRatio[0]}s</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="16"
                        value={customRatio[0]}
                        onChange={e => setCustomRatio([parseInt(e.target.value), customRatio[1], customRatio[2], customRatio[3]])}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-amber-400 mb-1">
                        <span>Antara Kumbhaka (Hold Full)</span>
                        <span className="font-bold">{customRatio[1]}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={customRatio[1]}
                        onChange={e => setCustomRatio([customRatio[0], parseInt(e.target.value), customRatio[2], customRatio[3]])}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-indigo-400 mb-1">
                        <span>Recaka (Exhale)</span>
                        <span className="font-bold">{customRatio[2]}s</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="24"
                        value={customRatio[2]}
                        onChange={e => setCustomRatio([customRatio[0], customRatio[1], parseInt(e.target.value), customRatio[3]])}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                        <span>Bāhya Kumbhaka (Hold Empty)</span>
                        <span className="font-bold">{customRatio[3]}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="16"
                        value={customRatio[3]}
                        onChange={e => setCustomRatio([customRatio[0], customRatio[1], customRatio[2], parseInt(e.target.value)])}
                        className="w-full accent-slate-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-xs font-mono text-gray-300">
                      Total Cycle Duration:{' '}
                      <strong className="text-white">
                        {customRatio[0] + customRatio[1] + customRatio[2] + customRatio[3]}s
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Kumbhaka Breath Retention Capacity Stopwatch */}
            <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-amber-400" />
                  <span>Kumbhaka Retention Capacity Probe</span>
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">Hypercapnic Assessment</span>
              </div>
              <p className="text-xs text-gray-400">
                Test your maximum comfortable breath retention (*Sukha Kumbhaka*) without strain.
              </p>

              <div className="flex items-center justify-between bg-[#1a1d2c] p-3 rounded-xl border border-[#272b3d]">
                <div className="text-2xl font-black font-mono text-amber-400">
                  {stopwatchSeconds}s
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (stopwatchRunning) {
                        setStopwatchRunning(false);
                      } else {
                        setStopwatchSeconds(0);
                        setStopwatchRunning(true);
                      }
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stopwatchRunning
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {stopwatchRunning ? 'Stop Retention' : 'Start Retention'}
                  </button>

                  <button
                    onClick={() => {
                      setStopwatchRunning(false);
                      setStopwatchSeconds(0);
                    }}
                    className="p-1.5 rounded-lg bg-[#252a3d] text-gray-400 hover:text-white"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 5 PRANA VAYUS ASSESSMENT */}
      {activeTab === 'vayu' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#161822] border border-[#272b3b] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame size={18} className="text-amber-400" />
                <span>The 5 Primary Sub-Vāyus of Prāṇamaya Koṣa</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Evaluate your subjective bio-energetic distribution across the 5 internal winds described in the *Praśna Upaniṣad* & *Haṭha Yoga Pradīpikā*.
              </p>
            </div>

            <div className="space-y-4">
              {/* Prana Vayu */}
              <div className="p-4 rounded-xl bg-[#1a1d2c] border border-[#282d42] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-cyan-300">1. Prāṇa Vāyu (Heart & Chest — Inward Vitality)</h4>
                    <p className="text-[11px] text-gray-400">Controls respiration, inhalation, sensory intake, and mental clarity.</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-cyan-400">{vayuScores.prana}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={vayuScores.prana}
                  onChange={e => setVayuScores({ ...vayuScores, prana: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Apana Vayu */}
              <div className="p-4 rounded-xl bg-[#1a1d2c] border border-[#282d42] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">2. Apāna Vāyu (Pelvic Floor & Colon — Downward Grounding)</h4>
                    <p className="text-[11px] text-gray-400">Controls exhalation, elimination, detox, reproductive energy, and earthly stability.</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-emerald-400">{vayuScores.apana}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={vayuScores.apana}
                  onChange={e => setVayuScores({ ...vayuScores, apana: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Samana Vayu */}
              <div className="p-4 rounded-xl bg-[#1a1d2c] border border-[#282d42] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">3. Samāna Vāyu (Solar Plexus & Navel — Equalizing Digestion)</h4>
                    <p className="text-[11px] text-gray-400">Ignites Jathara Agni (digestive fire), metabolic transformation, and inner center.</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-amber-400">{vayuScores.samana}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={vayuScores.samana}
                  onChange={e => setVayuScores({ ...vayuScores, samana: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Udana Vayu */}
              <div className="p-4 rounded-xl bg-[#1a1d2c] border border-[#282d42] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-purple-300">4. Udāna Vāyu (Throat & Ajna — Ascending Focus & Speech)</h4>
                    <p className="text-[11px] text-gray-400">Directs spiritual evolution, kundalini ascension, speech expression, and memory.</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-purple-400">{vayuScores.udana}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={vayuScores.udana}
                  onChange={e => setVayuScores({ ...vayuScores, udana: parseInt(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Vyana Vayu */}
              <div className="p-4 rounded-xl bg-[#1a1d2c] border border-[#282d42] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-300">5. Vyāna Vāyu (Whole Body & Aura — Omnipresent Circulation)</h4>
                    <p className="text-[11px] text-gray-400">Permeates peripheral nerve pathways, blood flow, radiant aura (*Tejas*), and coordination.</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-rose-400">{vayuScores.vyana}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={vayuScores.vyana}
                  onChange={e => setVayuScores({ ...vayuScores, vyana: parseInt(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Integrated Energetic Radar */}
          <div className="lg:col-span-4 bg-[#161822] border border-[#272b3b] rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award size={16} className="text-cyan-400" />
                <span>Prāṇic Balance Index</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Aggregated vitality quotient across the five kosha sub-currents.</p>

              <div className="my-6 p-4 rounded-2xl bg-gradient-to-tr from-cyan-950/40 via-indigo-950/30 to-purple-950/40 border border-cyan-500/20 text-center">
                <span className="text-4xl font-black font-mono text-cyan-300">
                  {Math.round(((vayuScores.prana + vayuScores.apana + vayuScores.samana + vayuScores.udana + vayuScores.vyana) / 50) * 100)}%
                </span>
                <p className="text-[11px] text-cyan-400/80 font-semibold mt-1">
                  Coherent Bio-Energetic Flow
                </p>
              </div>

              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-[#252a3d]">
                  <span className="text-gray-400">Prāṇa + Apāna Balance:</span>
                  <span className="font-mono font-bold text-white">
                    {Math.abs(vayuScores.prana - vayuScores.apana) <= 1 ? 'Equilibrated (Ideal)' : 'Imbalanced'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#252a3d]">
                  <span className="text-gray-400">Samāna Digestive Fire:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {vayuScores.samana >= 7 ? 'Sama Agni (Healthy)' : 'Manda Agni (Sluggish)'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Udāna Spiritual Vector:</span>
                  <span className="font-mono font-bold text-purple-300">
                    {vayuScores.udana >= 8 ? 'High Sattva Ascent' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1d2c] border border-[#272b3d] text-[11px] text-gray-400">
              💡 <em>Upaniṣadic Insight:</em> When Prāna and Apana are united at the navel chakra through Samana, Kundalini awakens into Sushumna.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SWARA YOGA & NOSTRIL OBSERVATION */}
      {activeTab === 'swara' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chandra Nadi Card */}
          <div
            onClick={() => setActiveSwara('Chandra (Ida / Left)')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeSwara.includes('Chandra')
                ? 'bg-cyan-950/30 border-cyan-500 shadow-xl shadow-cyan-500/10'
                : 'bg-[#161822] border-[#272b3b] hover:bg-[#1a1d2a]'
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Moon size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Chandra Swara (Iḍā Nāḍī)</h3>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Left Nostril Active
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                Represents lunar cooling, parasympathetic dominance, deep creative intuition, receptive contemplation, and calming tissue repair.
              </p>
            </div>

            <div className="pt-4 border-t border-[#252a3d] text-[11px] text-gray-400 space-y-1">
              <div><strong>Best For:</strong> Deep study, meditation, drinking water, sleep, peaceful conversations.</div>
            </div>
          </div>

          {/* Surya Nadi Card */}
          <div
            onClick={() => setActiveSwara('Surya (Pingala / Right)')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeSwara.includes('Surya')
                ? 'bg-amber-950/30 border-amber-500 shadow-xl shadow-amber-500/10'
                : 'bg-[#161822] border-[#272b3b] hover:bg-[#1a1d2a]'
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sun size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Sūrya Swara (Piṅgalā Nāḍī)</h3>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Right Nostril Active
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                Represents solar heating, sympathetic drive, muscular exertion, digestive fire (*Agni*), analytical logic, and dynamic debate.
              </p>
            </div>

            <div className="pt-4 border-t border-[#252a3d] text-[11px] text-gray-400 space-y-1">
              <div><strong>Best For:</strong> Heavy digestion, vigorous physical labor, business transactions, martial discipline.</div>
            </div>
          </div>

          {/* Sushumna Card */}
          <div
            onClick={() => setActiveSwara('Sushumna (Equilibrium / Both)')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeSwara.includes('Sushumna')
                ? 'bg-purple-950/30 border-purple-500 shadow-xl shadow-purple-500/10'
                : 'bg-[#161822] border-[#272b3b] hover:bg-[#1a1d2a]'
            }`}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Suṣumṇā Nāḍī (Cosmic Zero-Point)</h3>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Both Nostrils Equal
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                The central spinal axis of pure nondual consciousness. Occurs naturally at Sandhyā (dawn, noon, dusk, midnight) or during deep Samadhi.
              </p>
            </div>

            <div className="pt-4 border-t border-[#252a3d] text-[11px] text-gray-400 space-y-1">
              <div><strong>Best For:</strong> Dhyāna (Meditation), Japa, Samadhi, dissolving karmic knots (*Granthis*).</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SESSION LOGS & ARCHIVE */}
      {activeTab === 'history' && (
        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-400" />
              <span>Historical Prāṇāyāma Practice Logs</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Total Sessions: {history.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a1d2c] text-gray-400 font-semibold border-b border-[#282d42]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Pattern</th>
                  <th className="p-3">Ratio (s)</th>
                  <th className="p-3">Cycles</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Swara</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222638] text-gray-300">
                {history.map(s => (
                  <tr key={s.id} className="hover:bg-[#1e2233]">
                    <td className="p-3 font-mono text-gray-400">{s.date}</td>
                    <td className="p-3 font-semibold text-white">{s.patternName}</td>
                    <td className="p-3 font-mono text-cyan-400">{s.ratio.join(':')}s</td>
                    <td className="p-3 font-mono">{s.totalCycles}</td>
                    <td className="p-3 font-mono">
                      {Math.floor(s.totalDurationSeconds / 60)}m {s.totalDurationSeconds % 60}s
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#131622] text-gray-300 border border-[#252a3d]">
                        {s.swaraActive.split(' ')[0]}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 max-w-xs truncate">{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
