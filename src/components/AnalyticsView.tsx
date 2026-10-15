import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  calculateLifeEquilibrium, 
  generate30DayHabitHeatmap, 
  calculateFinancialRunway, 
  seedDemoAnalyticsDataIfSparse,
  type FinancialRunwaySettings,
  type LifeAreaScore
} from '../services/predictiveAnalytics';
import { 
  TrendingUp, 
  Activity, 
  Compass, 
  DollarSign, 
  Sparkles, 
  Calendar, 
  Flame, 
  Award, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  Sliders, 
  RefreshCw,
  Mountain,
  Heart,
  BookOpen,
  CheckSquare
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  // Financial settings state with persistence in localStorage
  const [financialSettings, setFinancialSettings] = useState<FinancialRunwaySettings>(() => {
    try {
      const saved = localStorage.getItem('om_os_financial_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      liquidReserves: 1500000, // ₹15,00,000
      monthlyBurn: 45000,      // ₹45,000
      monthlyInflow: 95000,    // ₹95,000
      landTargetBudget: 2000000 // ₹20,00,000 for Himalayan homestead
    };
  });

  const [hoveredDay, setHoveredDay] = useState<any | null>(null);
  const [selectedArea, setSelectedArea] = useState<LifeAreaScore | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Live query data from Dexie
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const healthEntries = useLiveQuery(() => db.health.orderBy('date').reverse().toArray(), []) || [];
  const journalEntries = useLiveQuery(() => db.journal.orderBy('date').reverse().toArray(), []) || [];

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const updateFinancials = (partial: Partial<FinancialRunwaySettings>) => {
    const updated = { ...financialSettings, ...partial };
    setFinancialSettings(updated);
    try {
      localStorage.setItem('om_os_financial_settings', JSON.stringify(updated));
    } catch {}
  };

  // Calculations
  const equilibriumReport = useMemo(() => {
    return calculateLifeEquilibrium(goals, tasks, healthEntries, journalEntries);
  }, [goals, tasks, healthEntries, journalEntries]);

  const habitStats = useMemo(() => {
    return generate30DayHabitHeatmap(journalEntries, healthEntries, tasks, 35);
  }, [journalEntries, healthEntries, tasks]);

  const financialReport = useMemo(() => {
    return calculateFinancialRunway(financialSettings);
  }, [financialSettings]);

  // Handle Seeding Demo Historical Data
  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoAnalyticsDataIfSparse();
      if (res.addedJournal > 0 || res.addedHealth > 0) {
        showNotification(`Seeded ${res.addedJournal} journal days & ${res.addedHealth} Ayurvedic health logs!`);
      } else {
        showNotification('Historical data already well-populated (>= 10 days exist).');
      }
    } catch (e: any) {
      alert('Error seeding demo data: ' + e.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Mathematical SVG Coordinates for 5-Spoke Radar Chart
  const radarChartData = useMemo(() => {
    const size = 320;
    const center = size / 2;
    const maxRadius = center - 45;
    const numAxes = 5;

    // Calculate (x, y) for an axis index (0 to 4) at a given percentage (0 to 100)
    const getCoords = (index: number, value: number) => {
      // Angle: 0 starts at top (-PI/2), moving clockwise
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numAxes;
      const r = (value / 100) * maxRadius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle)
      };
    };

    // Concentric grid rings at 20, 40, 60, 80, 100%
    const gridRings = [20, 40, 60, 80, 100].map(pct => {
      const points = Array.from({ length: numAxes }, (_, i) => {
        const { x, y } = getCoords(i, pct);
        return `${x},${y}`;
      }).join(' ');
      return { pct, points };
    });

    // Radial spokes
    const spokes = Array.from({ length: numAxes }, (_, i) => {
      const start = { x: center, y: center };
      const end = getCoords(i, 100);
      const labelCoords = getCoords(i, 120);
      return { start, end, labelCoords, area: equilibriumReport.scores[i]?.area };
    });

    // Target polygon (80% across all 5 spokes)
    const targetPolygonPoints = Array.from({ length: numAxes }, (_, i) => {
      const { x, y } = getCoords(i, 80);
      return `${x},${y}`;
    }).join(' ');

    // Actual live data polygon
    const actualPolygonPoints = equilibriumReport.scores.map((s, i) => {
      const { x, y } = getCoords(i, s.score);
      return `${x},${y}`;
    }).join(' ');

    const vertices = equilibriumReport.scores.map((s, i) => {
      return { ...getCoords(i, s.score), scoreData: s, index: i };
    });

    return { size, center, gridRings, spokes, targetPolygonPoints, actualPolygonPoints, vertices };
  }, [equilibriumReport]);

  return (
    <div className="space-y-8 pb-24 md:pb-8 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles size={14} />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-6 rounded-3xl border border-[#272b3b] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-indigo-400" size={24} />
              <span>Predictive Analytics & Life Balance Engine</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v2.1 Intelligence
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            5-Spoke polygonal equilibrium, 30-day ritual consistency matrix, and 24-month financial runway forecaster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#141622] hover:bg-[#1e2335] text-indigo-300 hover:text-white border border-[#2b3046] flex items-center gap-2 transition-colors cursor-pointer"
            title="Populate past 30 days of journal & health logs if database is new"
          >
            <RefreshCw size={13} className={isSeeding ? 'animate-spin' : ''} />
            <span>Seed 30-Day Demo Data</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 5-SPOKE LIFE BALANCE RADAR & EQUILIBRIUM INDEX */}
      <div className="bg-[#161822] border border-[#252a3d] rounded-3xl p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222738] pb-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-semibold block">
              Dimension A • Holistic Equilibrium
            </span>
            <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
              <Compass size={18} className="text-indigo-400" />
              <span>5-Spoke Life Balance Radar & Equilibrium Index</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-[#12141d] border border-[#23273a] flex items-center gap-2">
              <span className="text-xs text-gray-400">Life Equilibrium Index:</span>
              <span className="text-sm font-bold text-indigo-300 font-mono">
                {equilibriumReport.equilibriumIndex}/100
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                equilibriumReport.status === 'Harmonious' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                equilibriumReport.status === 'Balanced' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {equilibriumReport.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Radar Chart SVG Graphic (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-2 bg-[#12141c] rounded-2xl border border-[#202435]">
            <svg 
              viewBox={`0 0 ${radarChartData.size} ${radarChartData.size}`} 
              className="w-full max-w-[340px] h-auto select-none overflow-visible"
            >
              <defs>
                <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
                </radialGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Concentric Polygonal Web Rings */}
              {radarChartData.gridRings.map(ring => (
                <polygon
                  key={ring.pct}
                  points={ring.points}
                  fill="none"
                  stroke="#262b3d"
                  strokeWidth="1"
                  strokeDasharray={ring.pct === 80 ? '3 3' : undefined}
                />
              ))}

              {/* Radial Spokes */}
              {radarChartData.spokes.map((spoke, i) => (
                <line
                  key={i}
                  x1={spoke.start.x}
                  y1={spoke.start.y}
                  x2={spoke.end.x}
                  y2={spoke.end.y}
                  stroke="#2b3147"
                  strokeWidth="1"
                />
              ))}

              {/* Target 80% Equilibrium Line (Dashed) */}
              <polygon
                points={radarChartData.targetPolygonPoints}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />

              {/* Actual Live Data Polygon with Gradient & Glow */}
              <polygon
                points={radarChartData.actualPolygonPoints}
                fill="url(#radarGradient)"
                stroke="#818cf8"
                strokeWidth="2.5"
                filter="url(#glow)"
                className="transition-all duration-500 ease-out"
              />

              {/* Vertices Dots */}
              {radarChartData.vertices.map((v, i) => (
                <g 
                  key={i} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedArea(v.scoreData)}
                >
                  <circle
                    cx={v.x}
                    cy={v.y}
                    r={selectedArea?.area === v.scoreData.area ? 7 : 5}
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all hover:scale-125"
                  />
                  <text
                    x={v.x}
                    y={v.y - 10}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    className="font-mono pointer-events-none drop-shadow"
                  >
                    {v.scoreData.score}%
                  </text>
                </g>
              ))}

              {/* Spoke Outer Labels */}
              {radarChartData.spokes.map((spoke, i) => (
                <text
                  key={i}
                  x={spoke.labelCoords.x}
                  y={spoke.labelCoords.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="600"
                  className="select-none pointer-events-none"
                >
                  {spoke.area?.replace('&', '\n&')}
                </text>
              ))}
            </svg>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                <span>Actual Current State</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 border-t-2 border-dashed border-gray-400 inline-block" />
                <span>Target Equilibrium (80%)</span>
              </span>
            </div>
          </div>

          {/* Breakdown Cards & Dimensional Intelligence (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="space-y-2">
              {equilibriumReport.scores.map(s => {
                const isSelected = selectedArea?.area === s.area;
                return (
                  <div
                    key={s.area}
                    onClick={() => setSelectedArea(s)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white' 
                        : 'bg-[#12141c] border-[#222638] text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {s.area === 'Spiritual & Inner' && <BookOpen size={13} className="text-amber-400" />}
                        {s.area === 'Health & Vitality' && <Heart size={13} className="text-rose-400" />}
                        {s.area === 'Wealth & Assets' && <Mountain size={13} className="text-emerald-400" />}
                        {s.area === 'Career & Skills' && <CheckSquare size={13} className="text-indigo-400" />}
                        {s.area === 'Family & Relationships' && <Sparkles size={13} className="text-purple-400" />}
                        <span>{s.area}</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-300">{s.score}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#1e2335] h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          s.score >= 75 ? 'bg-emerald-500' : s.score >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5">
                      <span>{s.statusText}</span>
                      <span>{s.goalsCount} goals • {s.tasksCompleted} tasks</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendation Alert Box */}
            <div className="p-3.5 bg-[#141624] border border-indigo-500/30 rounded-xl text-xs space-y-1">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Info size={13} />
                <span>Life Alignment Recommendation</span>
              </span>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {equilibriumReport.recommendations[0]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 30-DAY HABIT & RITUAL MATRIX */}
      <div className="bg-[#161822] border border-[#252a3d] rounded-3xl p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222738] pb-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold block">
              Dimension B • Ritual Continuity
            </span>
            <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-400" />
              <span>30-Day Multi-Habit & Ritual Consistency Matrix</span>
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-[#12141c] px-3 py-1.5 rounded-xl border border-[#222638]">
              <Flame size={14} className="text-amber-400" />
              <span className="text-gray-400">Current Streak:</span>
              <span className="font-bold text-white">{habitStats.currentStreak} Days</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#12141c] px-3 py-1.5 rounded-xl border border-[#222638]">
              <Award size={14} className="text-indigo-400" />
              <span className="text-gray-400">Consistency:</span>
              <span className="font-bold text-emerald-400">{habitStats.consistencyRate}%</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid & Legend */}
        <div className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px] flex gap-2 justify-between bg-[#12141d] p-4 rounded-2xl border border-[#202435]">
              {habitStats.days.map((day, idx) => {
                const isHovered = hoveredDay?.date === day.date;
                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex flex-col items-center gap-1 group relative cursor-pointer"
                  >
                    <div 
                      className={`w-7 h-10 rounded-lg transition-all duration-200 border ${
                        day.level === 4 ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/30' :
                        day.level === 3 ? 'bg-indigo-600 border-indigo-500' :
                        day.level === 2 ? 'bg-indigo-900/70 border-indigo-800' :
                        day.level === 1 ? 'bg-[#22263a] border-[#2c324c]' :
                        'bg-[#161824] border-[#1f2334]'
                      } ${isHovered ? 'scale-110 ring-2 ring-white z-10' : ''}`}
                    />
                    <span className="text-[9px] text-gray-500 font-mono">
                      {day.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Hover Detail Tooltip Banner */}
          {hoveredDay ? (
            <div className="p-3 bg-[#131622] rounded-xl border border-indigo-500/40 flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-white">{hoveredDay.date}</span>
                <span className="text-indigo-300 font-semibold">Ritual Score: {hoveredDay.score}%</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-300">
                <span className={hoveredDay.rituals.intentionsDone ? 'text-emerald-400' : 'text-gray-500'}>
                  ✓ Morning Top 3
                </span>
                <span className={hoveredDay.rituals.pranayamaDone ? 'text-emerald-400' : 'text-gray-500'}>
                  ✓ Pranayama/Yoga
                </span>
                <span className={hoveredDay.rituals.deepWorkDone ? 'text-emerald-400' : 'text-gray-500'}>
                  ✓ Deep Work Q1/Q2
                </span>
                <span className={hoveredDay.rituals.journalLogged ? 'text-emerald-400' : 'text-gray-500'}>
                  ✓ Evening Journal
                </span>
                <span className="font-mono text-amber-300">Prana {hoveredDay.rituals.pranaRating}/10</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-gray-400 px-2">
              <span className="text-[11px]">Hover over any day tile to inspect daily ritual fulfillment.</span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>Rest</span>
                <span className="w-3 h-3 rounded bg-[#161824] border border-[#1f2334]" />
                <span className="w-3 h-3 rounded bg-[#22263a] border border-[#2c324c]" />
                <span className="w-3 h-3 rounded bg-indigo-900/70 border border-indigo-800" />
                <span className="w-3 h-3 rounded bg-indigo-600 border border-indigo-500" />
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" />
                <span>Radiant</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: PREDICTIVE FINANCIAL RUNWAY & LAND ACQUISITION FORECASTER */}
      <div className="bg-[#161822] border border-[#252a3d] rounded-3xl p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222738] pb-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold block">
              Dimension C • Capital & Solvency
            </span>
            <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
              <DollarSign size={18} className="text-amber-400" />
              <span>Predictive Financial Burn & Land Acquisition Runway</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-bold border font-mono ${
              financialReport.solvencyRating.includes('Optimal') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              financialReport.solvencyRating.includes('Healthy') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {financialReport.solvencyRating}
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-[#12141c] rounded-2xl border border-[#222638] space-y-1">
            <span className="text-[11px] text-gray-400 block">Liquid Capital Reserves</span>
            <span className="text-base font-bold text-white font-mono">
              ₹{(financialSettings.liquidReserves / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-[10px] text-emerald-400 block">Available in Bank / FD</span>
          </div>

          <div className="p-4 bg-[#12141c] rounded-2xl border border-[#222638] space-y-1">
            <span className="text-[11px] text-gray-400 block">Monthly Living Burn</span>
            <span className="text-base font-bold text-rose-300 font-mono">
              ₹{financialSettings.monthlyBurn.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 block">Baseline operational outflow</span>
          </div>

          <div className="p-4 bg-[#12141c] rounded-2xl border border-[#222638] space-y-1">
            <span className="text-[11px] text-gray-400 block">Net Monthly Surplus</span>
            <span className={`text-base font-bold font-mono ${financialReport.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {financialReport.netCashflow >= 0 ? '+' : ''}₹{financialReport.netCashflow.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 block">Inflow ₹{financialSettings.monthlyInflow.toLocaleString()}</span>
          </div>

          <div className="p-4 bg-[#12141c] rounded-2xl border border-[#222638] space-y-1">
            <span className="text-[11px] text-gray-400 block">Mountain Land Target</span>
            <span className="text-base font-bold text-indigo-300 font-mono">
              {financialReport.landSavingsProgress}%
            </span>
            <span className="text-[10px] text-gray-400 block">
              ₹{(financialSettings.landTargetBudget / 100000).toFixed(1)}L Goal
            </span>
          </div>
        </div>

        {/* 24-Month Forecast Projection Visualization */}
        <div className="p-5 bg-[#12141c] rounded-2xl border border-[#222638] space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Activity size={14} className="text-indigo-400" />
              <span>24-Month Capital Trajectory by Scenario</span>
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Baseline Run</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Ascetic (Sadhana -25% Burn)</span>
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Land Acq (Month 6 Registry)</span>
              </span>
            </div>
          </div>

          {/* Forecast Sparkline SVG Curve */}
          <div className="h-44 w-full relative">
            <svg viewBox="0 0 800 160" className="w-full h-full overflow-visible">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="20" x2="800" y2="20" stroke="#1f2438" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="800" y2="70" stroke="#1f2438" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="800" y2="120" stroke="#1f2438" strokeWidth="1" strokeDasharray="3 3" />

              {/* Baseline Curve */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                points={financialReport.projections.map((p, idx) => {
                  const x = (idx / (financialReport.projections.length - 1)) * 800;
                  // Map ₹0 to ₹35L into 140 to 10
                  const y = Math.max(10, Math.min(150, 150 - (p.baselineReserves / 3500000) * 140));
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Ascetic Curve */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 4"
                points={financialReport.projections.map((p, idx) => {
                  const x = (idx / (financialReport.projections.length - 1)) * 800;
                  const y = Math.max(10, Math.min(150, 150 - (p.asceticReserves / 3500000) * 140));
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Land Acquisition Curve */}
              <polyline
                fill="none"
                stroke="#c084fc"
                strokeWidth="2.5"
                points={financialReport.projections.map((p, idx) => {
                  const x = (idx / (financialReport.projections.length - 1)) * 800;
                  const y = Math.max(10, Math.min(150, 150 - (p.landAcquisitionReserves / 3500000) * 140));
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Projection Month Nodes */}
              {financialReport.projections.map((p, idx) => {
                const x = (idx / (financialReport.projections.length - 1)) * 800;
                const y = Math.max(10, Math.min(150, 150 - (p.baselineReserves / 3500000) * 140));
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="1" />
                    <text x={x} y="160" textAnchor="middle" fill="#64748b" fontSize="10" className="font-mono">
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Interactive Parameter Tuning Sliders */}
        <div className="bg-[#12141c] p-5 rounded-2xl border border-[#222638] space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
            <span className="flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-400" />
              <span>Simulate Runway Parameters</span>
            </span>
            <span className="text-[11px] text-gray-500 font-mono">Adjust values to test stress scenarios</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Liquid Reserves Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Current Capital Reserves</span>
                <span className="font-mono text-white font-bold">
                  ₹{(financialSettings.liquidReserves / 100000).toFixed(1)} Lakhs
                </span>
              </div>
              <input 
                type="range"
                min={200000}
                max={5000000}
                step={50000}
                value={financialSettings.liquidReserves}
                onChange={(e) => updateFinancials({ liquidReserves: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Monthly Burn Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Monthly Burn Rate</span>
                <span className="font-mono text-rose-300 font-bold">
                  ₹{financialSettings.monthlyBurn.toLocaleString()}
                </span>
              </div>
              <input 
                type="range"
                min={20000}
                max={150000}
                step={2500}
                value={financialSettings.monthlyBurn}
                onChange={(e) => updateFinancials({ monthlyBurn: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Monthly Inflow Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Expected Monthly Inflow</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ₹{financialSettings.monthlyInflow.toLocaleString()}
                </span>
              </div>
              <input 
                type="range"
                min={0}
                max={250000}
                step={5000}
                value={financialSettings.monthlyInflow}
                onChange={(e) => updateFinancials({ monthlyInflow: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
