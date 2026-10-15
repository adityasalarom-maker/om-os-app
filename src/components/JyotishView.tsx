import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JyotishChartRecord } from '../db';
import {
  calculateJyotishEphemeris,
  LOCATION_PRESETS,
  RASHI_NAMES,
  RASHI_SYMBOLS,
  GRAHA_COLORS,
  type LocationCoordinates,
  type JyotishCalculationResult,
  type GrahaPosition
} from '../services/jyotishEngine';
import {
  Sparkles,
  Compass,
  Sun,
  Moon,
  Clock,
  MapPin,
  Calendar,
  Save,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Layers,
  AlertTriangle,
  Info,
  ChevronRight,
  BookHeart
} from 'lucide-react';

export const JyotishView: React.FC = () => {
  // Current time state
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  const [selectedLocationKey, setSelectedLocationKey] = useState<string>('tehri');
  const [customLat, setCustomLat] = useState<string>('30.3842');
  const [customLon, setCustomLon] = useState<string>('78.4802');
  const [isCustomLoc, setIsCustomLoc] = useState<boolean>(false);

  // Chart view mode: D1 (Rashi) vs D9 (Navamsha)
  const [chartMode, setChartMode] = useState<'D1' | 'D9'>('D1');

  // Chart save state
  const [chartTitle, setChartTitle] = useState<string>('');
  const [chartNotes, setChartNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // Live query for saved charts
  const savedCharts = useLiveQuery(() => db.jyotishCharts.orderBy('createdAt').reverse().toArray(), []) || [];

  // Active Location Coordinates
  const currentLocation: LocationCoordinates = useMemo(() => {
    if (isCustomLoc) {
      return {
        name: 'Custom Coordinates',
        latitude: parseFloat(customLat) || 30.0,
        longitude: parseFloat(customLon) || 78.0,
        timezoneOffsetHours: 5.5
      };
    }
    return LOCATION_PRESETS[selectedLocationKey] || LOCATION_PRESETS.tehri;
  }, [selectedLocationKey, isCustomLoc, customLat, customLon]);

  // Master Ephemeris Calculation
  const ephemeris: JyotishCalculationResult = useMemo(() => {
    return calculateJyotishEphemeris(selectedDateTime, currentLocation);
  }, [selectedDateTime, currentLocation]);

  const handleSetNow = () => {
    setSelectedDateTime(new Date());
  };

  const handleSaveChart = async () => {
    if (!chartTitle.trim()) return;

    const lagnaGraha = ephemeris.grahas.find(g => g.name === 'Surya');
    const chandra = ephemeris.grahas.find(g => g.name === 'Chandra');

    const newRecord: JyotishChartRecord = {
      id: `jyotish-${Date.now()}`,
      title: chartTitle.trim(),
      dateTime: selectedDateTime.toISOString(),
      locationName: currentLocation.name,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      notes: chartNotes.trim(),
      lagnaRashi: ephemeris.lagna.rashiName,
      lagnaDegree: ephemeris.lagna.formattedDegree,
      chandraRashi: chandra ? chandra.rashiName : '',
      chandraNakshatra: ephemeris.panchang.nakshatraName,
      tithi: ephemeris.panchang.tithiName,
      vara: ephemeris.panchang.varaName,
      grahasJson: JSON.stringify(ephemeris.grahas),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.jyotishCharts.add(newRecord);
    setChartTitle('');
    setChartNotes('');
    setIsSaving(false);
  };

  const handleLoadChart = (chart: JyotishChartRecord) => {
    setSelectedDateTime(new Date(chart.dateTime));
    const presetKey = Object.keys(LOCATION_PRESETS).find(k => LOCATION_PRESETS[k].name === chart.locationName);
    if (presetKey) {
      setIsCustomLoc(false);
      setSelectedLocationKey(presetKey);
    } else {
      setIsCustomLoc(true);
      setCustomLat(chart.latitude.toString());
      setCustomLon(chart.longitude.toString());
    }
  };

  const handleDeleteChart = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.jyotishCharts.delete(id);
  };

  const handleCopyPanchangMarkdown = async () => {
    const md = [
      `### ॐ Vedic Panchang & Muhurta Snapshot`,
      `*${selectedDateTime.toLocaleString()} | Location: ${currentLocation.name}*`,
      `- **Tithi**: ${ephemeris.panchang.tithiName} (${ephemeris.panchang.tithiElapsedPercentage}% elapsed)`,
      `- **Nakshatra**: ${ephemeris.panchang.nakshatraName} (Pada ${ephemeris.panchang.pada}, Lord: ${ephemeris.panchang.nakshatraLord})`,
      `- **Yoga**: ${ephemeris.panchang.yogaName}`,
      `- **Karana**: ${ephemeris.panchang.karanaName} ${ephemeris.panchang.isBhadra ? '(⚠️ Bhadra Active)' : ''}`,
      `- **Vara**: ${ephemeris.panchang.varaName}`,
      `- **Sun Timings**: Sunrise ${ephemeris.panchang.sunriseTime} | Sunset ${ephemeris.panchang.sunsetTime} (Daylight: ${ephemeris.panchang.dayDurationHours}h)`,
      `- **Lagna (Ascendant)**: ${ephemeris.lagna.rashiName} at ${ephemeris.lagna.formattedDegree}`,
      `- **Active Muhurta**: ${ephemeris.activeMuhurta ? ephemeris.activeMuhurta.name : 'Standard Muhurta'}`
    ].join('\n');

    await navigator.clipboard.writeText(md);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  // Format date input value (YYYY-MM-DDTHH:mm)
  const localIsoDateTime = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = selectedDateTime.getFullYear();
    const m = pad(selectedDateTime.getMonth() + 1);
    const d = pad(selectedDateTime.getDate());
    const h = pad(selectedDateTime.getHours());
    const min = pad(selectedDateTime.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }, [selectedDateTime]);

  // House mapping for D1 / D9 North Indian Diamond Chart
  // In D1, house 1 = lagna rashi. In D9, house 1 = lagna d9 rashi.
  const chartLagnaRashi = chartMode === 'D1' ? ephemeris.lagna.rashiIndex : ephemeris.lagna.d9RashiIndex;

  const houseData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const houseNumber = i + 1;
      const rashiIndex = (chartLagnaRashi + i) % 12;
      const occupants = ephemeris.grahas.filter(g => {
        const gRashi = chartMode === 'D1' ? g.rashiIndex : g.d9RashiIndex;
        return gRashi === rashiIndex;
      });
      return {
        houseNumber,
        rashiIndex,
        rashiName: RASHI_NAMES[rashiIndex],
        rashiSymbol: RASHI_SYMBOLS[rashiIndex],
        occupants
      };
    });
  }, [chartLagnaRashi, ephemeris.grahas, chartMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Compass size={22} />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Metaphysical & Jyotish Ephemeris Engine</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Lahiri Ayanamsha ({ephemeris.ayanamsha.toFixed(2)}°)
                  </span>
                </h1>
                <p className="text-xs text-gray-400">
                  Offline astronomical planetary coordinates, 5-limb Vedic Panchang, and Muhurta alignment.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSetNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2436] hover:bg-[#252b40] border border-[#2d334a] text-xs font-semibold text-cyan-300 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Current Time</span>
            </button>
            <button
              onClick={handleCopyPanchangMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
            >
              {copiedStatus ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedStatus ? 'Copied MD!' : 'Copy Panchang'}</span>
            </button>
            <button
              onClick={() => setIsSaving(!isSaving)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition-colors"
            >
              <Save size={13} />
              <span>Save Chart</span>
            </button>
          </div>
        </div>

        {/* Date, Time & Location Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-5 mt-5 border-t border-[#25293d]">
          {/* DateTime Picker */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <Calendar size={11} className="text-indigo-400" /> Date & Time (Local IST)
            </label>
            <input
              type="datetime-local"
              value={localIsoDateTime}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDateTime(new Date(e.target.value));
                }
              }}
              className="w-full bg-[#12141f] border border-[#2b3044] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Location Presets */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <MapPin size={11} className="text-amber-400" /> Observation Location
            </label>
            <select
              value={isCustomLoc ? 'custom' : selectedLocationKey}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomLoc(true);
                } else {
                  setIsCustomLoc(false);
                  setSelectedLocationKey(e.target.value);
                }
              }}
              className="w-full bg-[#12141f] border border-[#2b3044] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="tehri">🏔️ Tehri Garhwal (Himalayas) [30.38°N, 78.48°E]</option>
              <option value="rishikesh">🌊 Rishikesh (Ganga Valley) [30.08°N, 78.26°E]</option>
              <option value="delhi">🏛️ New Delhi (Capital) [28.61°N, 77.20°E]</option>
              <option value="varanasi">🛕 Varanasi (Kashi) [25.31°N, 82.97°E]</option>
              <option value="mumbai">🌆 Mumbai [19.07°N, 72.87°E]</option>
              <option value="bengaluru">🌿 Bengaluru [12.97°N, 77.59°E]</option>
              <option value="custom">📍 Custom Latitude / Longitude</option>
            </select>
          </div>

          {/* Lagna & Ephemeris Summary Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141622] border border-[#25293d]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Lagna (Ascendant):</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <span>{ephemeris.lagna.rashiName}</span>
                <span className="text-amber-400 font-mono text-[11px]">({ephemeris.lagna.formattedDegree})</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-mono block">Julian Day</span>
              <span className="text-[11px] font-mono text-cyan-300 font-semibold">{ephemeris.julianDay.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Custom Latitude/Longitude Inputs (if selected) */}
        {isCustomLoc && (
          <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-[#222638]">
            <div>
              <label className="text-[10px] text-gray-400 font-semibold block mb-1">Latitude (°N):</label>
              <input
                type="number"
                step="0.0001"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full bg-[#12141f] border border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-semibold block mb-1">Longitude (°E):</label>
              <input
                type="number"
                step="0.0001"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                className="w-full bg-[#12141f] border border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Save Chart Form */}
        {isSaving && (
          <div className="p-4 rounded-xl bg-[#141724] border border-amber-500/30 mt-4 space-y-3 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Save size={13} /> Save Current Jyotish Chart Snapshot to Dexie Vault
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Chart Title (e.g. Aditya Birth Chart, Tehri Registry Muhurta)"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full bg-[#10121d] border border-[#2d334a] rounded-lg px-3 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Optional Notes / Muhurta Purpose"
                value={chartNotes}
                onChange={(e) => setChartNotes(e.target.value)}
                className="w-full bg-[#10121d] border border-[#2d334a] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSaving(false)}
                className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChart}
                disabled={!chartTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs disabled:opacity-50 transition-colors"
              >
                Save to Database
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Muhurta Alert Card */}
      {ephemeris.activeMuhurta && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-md ${
          ephemeris.activeMuhurta.type === 'spiritual'
            ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
            : ephemeris.activeMuhurta.type === 'auspicious'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            : ephemeris.activeMuhurta.type === 'inauspicious'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            : 'bg-[#181a24] border-[#272b3b] text-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`p-2.5 rounded-xl border ${
              ephemeris.activeMuhurta.type === 'spiritual' ? 'bg-purple-900/40 border-purple-500/40 text-purple-300' :
              ephemeris.activeMuhurta.type === 'auspicious' ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300' :
              ephemeris.activeMuhurta.type === 'inauspicious' ? 'bg-rose-900/40 border-rose-500/40 text-rose-300' :
              'bg-[#12141f] border-[#25293d] text-gray-400'
            }`}>
              <Clock size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Window: {ephemeris.activeMuhurta.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full border bg-black/40">
                  {ephemeris.activeMuhurta.startTime} — {ephemeris.activeMuhurta.endTime}
                </span>
              </div>
              <p className="text-xs text-gray-300/90 mt-0.5">
                {ephemeris.activeMuhurta.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5-Limb Vedic Panchang Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Tithi */}
        <div className="p-4 rounded-2xl bg-[#181a24] border border-[#272b3b] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Moon size={12} className="text-sky-400" /> Tithi
            </span>
            <span className="text-[10px] font-mono text-sky-300">
              {ephemeris.panchang.paksha}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white truncate">
            {ephemeris.panchang.tithiName}
          </h3>
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>Tithi Elapsed:</span>
              <span>{ephemeris.panchang.tithiElapsedPercentage}%</span>
            </div>
            <div className="w-full bg-[#12141f] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all"
                style={{ width: `${ephemeris.panchang.tithiElapsedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Nakshatra */}
        <div className="p-4 rounded-2xl bg-[#181a24] border border-[#272b3b] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" /> Nakshatra
            </span>
            <span className="text-[10px] font-mono text-amber-300">
              Pada {ephemeris.panchang.pada}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white truncate">
            {ephemeris.panchang.nakshatraName}
          </h3>
          <p className="text-[11px] text-gray-400">
            Governing Lord: <span className="text-amber-300 font-semibold">{ephemeris.panchang.nakshatraLord}</span>
          </p>
        </div>

        {/* 3. Yoga */}
        <div className="p-4 rounded-2xl bg-[#181a24] border border-[#272b3b] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Layers size={12} className="text-indigo-400" /> Yoga
            </span>
            <span className="text-[10px] font-mono text-indigo-300">
              #{ephemeris.panchang.yogaIndex + 1} of 27
            </span>
          </div>
          <h3 className="text-sm font-bold text-white truncate">
            {ephemeris.panchang.yogaName}
          </h3>
          <p className="text-[11px] text-gray-400">
            Solilunar angle: <span className="font-mono text-indigo-200">{(ephemeris.panchang.yogaIndex * 13.33).toFixed(1)}°</span>
          </p>
        </div>

        {/* 4. Karana */}
        <div className="p-4 rounded-2xl bg-[#181a24] border border-[#272b3b] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} className="text-emerald-400" /> Karana
            </span>
            {ephemeris.panchang.isBhadra ? (
              <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/40">
                ⚠️ Bhadra
              </span>
            ) : (
              <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
                Auspicious
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white truncate">
            {ephemeris.panchang.karanaName}
          </h3>
          <p className="text-[11px] text-gray-400">
            Half-tithi interval
          </p>
        </div>

        {/* 5. Vara & Solar Times */}
        <div className="p-4 rounded-2xl bg-[#181a24] border border-[#272b3b] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sun size={12} className="text-amber-400" /> Vara & Solar
            </span>
            <span className="text-[10px] font-mono text-amber-300">
              {ephemeris.panchang.dayDurationHours}h Sun
            </span>
          </div>
          <h3 className="text-xs font-bold text-white truncate">
            {ephemeris.panchang.varaName}
          </h3>
          <p className="text-[10px] text-gray-400 font-mono">
            🌅 {ephemeris.panchang.sunriseTime} | 🌇 {ephemeris.panchang.sunsetTime}
          </p>
        </div>
      </div>

      {/* Main Interactive Kundli Chart & Planetary Table (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: North Indian Diamond Kundli Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#181a24] border border-[#272b3b] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>North Indian Kundli Chart</span>
                <span className="text-xs font-mono text-amber-400">[{chartMode}]</span>
              </h3>
              <p className="text-[11px] text-gray-400">
                {chartMode === 'D1' ? 'Rashi Chart (Physical reality & planetary positions)' : 'Navamsha Chart (Harmonic D9 soul purpose & inner strength)'}
              </p>
            </div>
            {/* D1 / D9 Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#12141f] border border-[#282d3f] text-xs font-bold">
              <button
                onClick={() => setChartMode('D1')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  chartMode === 'D1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                D1 Rashi
              </button>
              <button
                onClick={() => setChartMode('D9')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  chartMode === 'D9' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                D9 Navamsha
              </button>
            </div>
          </div>

          {/* SVG Diamond Chart Canvas */}
          <div className="relative w-full aspect-square max-w-[460px] mx-auto bg-[#10121d] rounded-2xl border border-[#292f44] p-3 shadow-inner">
            <svg viewBox="0 0 400 400" className="w-full h-full stroke-amber-500/40 select-none">
              {/* Outer Square */}
              <rect x="10" y="10" width="380" height="380" fill="none" strokeWidth="1.5" />
              {/* Diagonals */}
              <line x1="10" y1="10" x2="390" y2="390" strokeWidth="1.2" />
              <line x1="390" y1="10" x2="10" y2="390" strokeWidth="1.2" />
              {/* Inner Diamond */}
              <line x1="200" y1="10" x2="10" y2="200" strokeWidth="1.2" />
              <line x1="10" y1="200" x2="200" y2="390" strokeWidth="1.2" />
              <line x1="200" y1="390" x2="390" y2="200" strokeWidth="1.2" />
              <line x1="390" y1="200" x2="200" y2="10" strokeWidth="1.2" />

              {/* House Numbers (Rashi indices 1-12) and Graha Placements */}
              {/* House 1 (Top Center Diamond) */}
              <text x="200" y="110" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
                {houseData[0].rashiIndex + 1}
              </text>
              <text x="200" y="130" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                {houseData[0].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 2 (Top Left Triangle) */}
              <text x="110" y="65" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[1].rashiIndex + 1}
              </text>
              <text x="110" y="85" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[1].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 3 (Far Left Triangle) */}
              <text x="65" y="110" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[2].rashiIndex + 1}
              </text>
              <text x="65" y="130" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[2].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 4 (Left Diamond) */}
              <text x="110" y="200" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
                {houseData[3].rashiIndex + 1}
              </text>
              <text x="110" y="220" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                {houseData[3].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 5 (Bottom Left Triangle) */}
              <text x="65" y="290" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[4].rashiIndex + 1}
              </text>
              <text x="65" y="310" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[4].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 6 (Far Bottom Left Triangle) */}
              <text x="110" y="335" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[5].rashiIndex + 1}
              </text>
              <text x="110" y="355" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[5].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 7 (Bottom Center Diamond) */}
              <text x="200" y="290" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
                {houseData[6].rashiIndex + 1}
              </text>
              <text x="200" y="310" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                {houseData[6].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 8 (Far Bottom Right Triangle) */}
              <text x="290" y="335" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[7].rashiIndex + 1}
              </text>
              <text x="290" y="355" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[7].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 9 (Bottom Right Triangle) */}
              <text x="335" y="290" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[8].rashiIndex + 1}
              </text>
              <text x="335" y="310" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[8].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 10 (Right Diamond) */}
              <text x="290" y="200" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
                {houseData[9].rashiIndex + 1}
              </text>
              <text x="290" y="220" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                {houseData[9].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 11 (Far Top Right Triangle) */}
              <text x="335" y="110" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[10].rashiIndex + 1}
              </text>
              <text x="335" y="130" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[10].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>

              {/* House 12 (Top Right Triangle) */}
              <text x="290" y="65" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                {houseData[11].rashiIndex + 1}
              </text>
              <text x="290" y="85" textAnchor="middle" fill="#f59e0b" fontSize="9">
                {houseData[11].occupants.map(g => `${g.name}${g.isRetrograde ? '[R]' : ''}`).join(', ')}
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono px-2">
            <span>Center = 1st House (Lagna: {RASHI_NAMES[chartLagnaRashi]})</span>
            <span>Numbers = Rashi Signs (1 = Mesha to 12 = Meena)</span>
          </div>
        </div>

        {/* Right Column: Planetary Positions Table & Muhurtas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Grahas Table */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Planetary Ephemeris (Nirayana)</span>
              <span className="text-[10px] font-mono text-gray-400">9 Vedic Grahas</span>
            </h3>

            <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
              {ephemeris.grahas.map(g => (
                <div
                  key={g.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#12141f] border border-[#222638] text-xs hover:border-[#353b52] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: `${GRAHA_COLORS[g.name]}20`, color: GRAHA_COLORS[g.name] }}
                    >
                      {g.symbol}
                    </span>
                    <div>
                      <span className="font-bold text-white block leading-tight">
                        {g.name} <span className="text-[10px] text-gray-400 font-normal">({g.sanskritName})</span>
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {g.nakshatraName} • P{g.pada}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end font-mono text-[11px]">
                      <span className="text-white font-bold">{g.rashiName.split(' ')[0]}</span>
                      <span className="text-amber-400">{g.degreeInRashi.toFixed(1)}°</span>
                      {g.isRetrograde && (
                        <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1 rounded">
                          [R]
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono">
                      H{g.house} • D9: {g.d9RashiName.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Muhurtas Timetable */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Muhurta Timetable</span>
              <span className="text-[10px] font-mono text-cyan-300">Daily Auspicious Windows</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              {ephemeris.muhurtas.map(m => {
                const isActive = ephemeris.activeMuhurta?.name === m.name;
                return (
                  <div
                    key={m.name}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[#1e2338] border-cyan-500/60 shadow-md'
                        : 'bg-[#12141f] border-[#222638]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{m.name}</span>
                        {isActive && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded-full font-mono animate-pulse">
                            Active Now
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{m.description}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-300 shrink-0 ml-2">
                      {m.startTime} — {m.endTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Charts & Historical Ingestion Vault */}
      <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookHeart size={16} className="text-indigo-400" />
              <span>Saved Charts & Muhurta Vault ({savedCharts.length})</span>
            </h3>
            <p className="text-xs text-gray-400">
              Personal birth charts, Himalayan registry muhurtas, and key planetary configurations saved in local Dexie database.
            </p>
          </div>
        </div>

        {savedCharts.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#12141f] border border-[#222638] text-center text-xs text-gray-500">
            No saved charts yet. Click "Save Chart" at the top to bookmark any significant astrological transit or event.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedCharts.map(sc => (
              <div
                key={sc.id}
                onClick={() => handleLoadChart(sc)}
                className="p-3.5 rounded-xl bg-[#12141f] hover:bg-[#161928] border border-[#24283c] hover:border-amber-500/40 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                    {sc.title}
                  </h4>
                  <button
                    onClick={(e) => handleDeleteChart(sc.id, e)}
                    className="text-gray-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 space-y-0.5 font-mono">
                  <p>📍 {sc.locationName}</p>
                  <p>🗓️ {new Date(sc.dateTime).toLocaleDateString()} {new Date(sc.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-amber-300/80">Lagna: {sc.lagnaRashi} • Chandra: {sc.chandraRashi}</p>
                </div>
                {sc.notes && (
                  <p className="text-[10px] text-gray-500 italic line-clamp-1 border-t border-[#1f2233] pt-1.5">
                    "{sc.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
