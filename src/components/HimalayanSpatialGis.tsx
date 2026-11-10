import React, { useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type KhasraParcelRecord, ensureSeedKhasraParcelsIfEmpty } from '../db';
import {
  calculateHimalayanArea,
  analyzeSlopeAndAspect,
  evaluateLegalDiligence,
  exportToGeoJson,
  parseGeoJsonToKhasra,
  computeCentroid,
  computeBoundingBox,
  projectGeoToPlanar,
  type AspectDirection,
} from '../services/spatialGisEngine';
import {
  Compass,
  MapPin,
  Mountain,
  Sun,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  Download,
  Upload,
  Plus,
  Trash2,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const HimalayanSpatialGis: React.FC = () => {
  const parcels = useLiveQuery(() => db.khasraParcels.toArray(), []) || [];
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'register' | 'diligence' | 'editor' | 'geojson'>('canvas');

  // Canvas Viewport & Layer Controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [showContours, setShowContours] = useState(true);
  const [showWaterStreams, setShowWaterStreams] = useState(true);
  const [showSolarHeatmap, setShowSolarHeatmap] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // New Parcel Form Modal
  const [isAddingParcel, setIsAddingParcel] = useState(false);
  const [newKhasraNo, setNewKhasraNo] = useState('');
  const [newKhataNo, setNewKhataNo] = useState('');
  const [newVillage, setNewVillage] = useState('Netala, Bhatwari Tehsil, Uttarkashi');
  const [newClassification, setNewClassification] = useState<KhasraParcelRecord['landClassification']>('Bagicha (Orchard)');
  const [newBhumidhars, setNewBhumidhars] = useState('');
  const [newAspect, setNewAspect] = useState<AspectDirection>('South-East');
  const [newElevMin, setNewElevMin] = useState(1350);
  const [newElevMax, setNewElevMax] = useState(1380);

  // GeoJSON Import Status
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Ensure seed data is populated if empty
  React.useEffect(() => {
    ensureSeedKhasraParcelsIfEmpty();
  }, []);

  // Selected Parcel Memo
  const selectedParcel = useMemo(() => {
    if (!selectedParcelId && parcels.length > 0) {
      return parcels[0];
    }
    return parcels.find((p) => p.id === selectedParcelId) || parcels[0] || null;
  }, [parcels, selectedParcelId]);

  // Global Bounding Box across all parcels for Canvas coordinate mapping
  const allCoords = useMemo(() => {
    const list: [number, number][] = [];
    parcels.forEach((p) => {
      (p.coordinates || []).forEach((c) => list.push(c));
    });
    // Add reference Gadhera stream coordinates
    list.push([78.4905, 30.767], [78.4945, 30.7635]);
    return list;
  }, [parcels]);

  const bbox = useMemo(() => computeBoundingBox(allCoords), [allCoords]);

  // Transform [lon, lat] into SVG Canvas coordinates (viewBox 0 0 800 600)
  const projectToSvg = (lon: number, lat: number) => {
    const padding = 60;
    const width = 800 - padding * 2;
    const height = 600 - padding * 2;

    const lonNorm = (lon - bbox.minLon) / bbox.widthDeg;
    const latNorm = (lat - bbox.minLat) / bbox.heightDeg;

    // SVG Y-axis is inverted (0 at top)
    const x = padding + lonNorm * width;
    const y = 600 - (padding + latNorm * height);
    return { x, y };
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleResetCanvas = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Toggle legal check in Dexie
  const handleToggleLegalCheck = async (
    parcel: KhasraParcelRecord,
    checkKey: keyof KhasraParcelRecord['legalChecks']
  ) => {
    const updatedChecks = {
      ...parcel.legalChecks,
      [checkKey]: !parcel.legalChecks[checkKey],
    };
    const evalResult = evaluateLegalDiligence(updatedChecks);

    await db.khasraParcels.update(parcel.id, {
      legalChecks: updatedChecks,
      riskScore: evalResult.score,
      diligenceStatus: evalResult.status,
      updatedAt: Date.now(),
    });
  };

  // Handle GeoJSON Export
  const handleExportGeoJson = () => {
    const geoJsonStr = exportToGeoJson(parcels);
    const blob = new Blob([geoJsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `himalayan_cadastre_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Copy GeoJSON to Clipboard
  const handleCopyGeoJson = async () => {
    const geoJsonStr = exportToGeoJson(parcels);
    await navigator.clipboard.writeText(geoJsonStr);
    setCopyFeedback('Copied RFC 7946 GeoJSON to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Handle GeoJSON Import
  const handleImportGeoJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedRecords = parseGeoJsonToKhasra(text);
      if (importedRecords.length === 0) {
        setImportStatus('No valid polygon features found in GeoJSON.');
        return;
      }
      for (const rec of importedRecords) {
        await db.khasraParcels.put(rec as KhasraParcelRecord);
      }
      setImportStatus(`Successfully imported ${importedRecords.length} Khasra parcel(s).`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus(`Import Error: ${err.message}`);
    }
  };

  // Save New Parcel
  const handleSaveNewParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKhasraNo.trim()) return;

    const now = Date.now();
    // Default 4-vertex quadrilateral offset from center
    const centerLon = bbox.minLon + bbox.widthDeg * 0.5;
    const centerLat = bbox.minLat + bbox.heightDeg * 0.5;
    const offset = 0.001;

    const coords: [number, number][] = [
      [centerLon - offset, centerLat + offset],
      [centerLon + offset, centerLat + offset],
      [centerLon + offset * 1.2, centerLat - offset],
      [centerLon - offset * 0.8, centerLat - offset * 0.9],
    ];

    const area = calculateHimalayanArea(coords);
    const slope = analyzeSlopeAndAspect(newElevMin, newElevMax, coords, newAspect);
    const initialChecks = {
      khatauni12Yr: true,
      nec12Yr: false,
      section143Cleared: false,
      patwariDemarcated: false,
      disasterSafe: true,
    };
    const evalRisk = evaluateLegalDiligence(initialChecks);

    const record: KhasraParcelRecord = {
      id: `khasra-${Date.now()}`,
      khasraNumber: newKhasraNo.trim(),
      khataNumber: newKhataNo.trim() || '00001',
      fasliYear: '1431-1436 Fasli',
      villageTehsil: newVillage.trim(),
      landClassification: newClassification,
      bhumidharNames: newBhumidhars.split(',').map((s) => s.trim()).filter(Boolean),
      shareFraction: 'Sole Bhumidhar',
      areaNali: area.nali,
      areaMutthi: area.mutthi,
      areaSqMeters: area.sqMeters,
      coordinates: coords,
      elevationMin: newElevMin,
      elevationMax: newElevMax,
      slopePercent: slope.slopePercent,
      aspectDirection: newAspect,
      waterStreamDistanceMeters: 55,
      roadDistanceMeters: 40,
      riskScore: evalRisk.score,
      diligenceStatus: evalRisk.status,
      legalChecks: initialChecks,
      encumbranceNotes: 'Cadastral parcel registered. Verification dossier initiated.',
      createdAt: now,
      updatedAt: now,
    };

    await db.khasraParcels.add(record);
    setSelectedParcelId(record.id);
    setIsAddingParcel(false);
    setNewKhasraNo('');
    setNewKhataNo('');
    setNewBhumidhars('');
  };

  // Delete parcel
  const handleDeleteParcel = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Khasra parcel from local spatial records?')) {
      await db.khasraParcels.delete(id);
      if (selectedParcelId === id) {
        setSelectedParcelId(null);
      }
    }
  };

  return (
    <div data-ag-id="HimalayanSpatialGis_Root_Workspace" className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner & Control Deck */}
      <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Mountain size={16} />
            <span>Himalayan Homestead & Land Diligence Spatial GIS</span>
            <span className="bg-amber-400/10 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/20 font-mono">
              Offline GeoJSON Cadastre
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Khasra Cadastral Mapping & 12-Year Khatauni Diligence Workbench
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Interactive zero-dependency vector GIS boundary canvas, Shoelace Nali/Mutthi area math, perennial Gadhera stream buffer analysis, and 5-point statutory legal clearance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddingParcel(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Khasra</span>
          </button>

          <button
            onClick={handleExportGeoJson}
            className="flex items-center gap-1.5 bg-[#202436] hover:bg-[#282d44] border border-[#343a54] text-gray-200 text-xs font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer"
            title="Download standard RFC 7946 GeoJSON for QGIS / Google Earth"
          >
            <Download size={14} className="text-cyan-400" />
            <span>Export GeoJSON</span>
          </button>

          <label className="flex items-center gap-1.5 bg-[#202436] hover:bg-[#282d44] border border-[#343a54] text-gray-200 text-xs font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer">
            <Upload size={14} className="text-emerald-400" />
            <span>Import Survey</span>
            <input type="file" accept=".geojson,.json" onChange={handleImportGeoJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Status Notifications */}
      {importStatus && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>{importStatus}</span>
          </div>
          <button onClick={() => setImportStatus(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {copyFeedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-medium text-gray-400 block">Khasra Parcels</span>
          <div className="text-2xl font-black text-white mt-1">{parcels.length}</div>
          <span className="text-[10px] text-gray-500">Cadastral Survey Units</span>
        </div>

        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-medium text-gray-400 block">Total Cadastral Area</span>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {parcels.reduce((acc, p) => acc + (p.areaNali || 0), 0).toFixed(1)} Nali
          </div>
          <span className="text-[10px] text-gray-500">
            ~{Math.round(parcels.reduce((acc, p) => acc + (p.areaSqMeters || 0), 0))} m² ({Math.round(parcels.reduce((acc, p) => acc + (p.areaSqMeters || 0), 0) * 10.764)} sq ft)
          </span>
        </div>

        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-medium text-gray-400 block">Clear Title Viability</span>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {parcels.filter((p) => p.diligenceStatus === 'Clear').length} / {parcels.length}
          </div>
          <span className="text-[10px] text-emerald-300/80">Passed 5-Point Audit</span>
        </div>

        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-medium text-gray-400 block">Solar Ridge Exposure</span>
          <div className="text-lg font-bold text-cyan-400 mt-1">
            {parcels.filter((p) => p.aspectDirection?.includes('South')).length} South-Facing
          </div>
          <span className="text-[10px] text-cyan-300/80">8–10h Winter Sun Insolation</span>
        </div>
      </div>

      {/* Main Workbench Navigation Tabs */}
      <div className="flex border-b border-[#272b3b] gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-semibold transition-colors cursor-pointer border-t border-x ${
            activeTab === 'canvas'
              ? 'bg-[#181a24] text-indigo-400 border-[#272b3b] border-b-[#181a24]'
              : 'text-gray-400 hover:text-gray-200 border-transparent'
          }`}
        >
          <Layers size={14} />
          <span>Spatial Vector GIS Canvas</span>
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-semibold transition-colors cursor-pointer border-t border-x ${
            activeTab === 'register'
              ? 'bg-[#181a24] text-indigo-400 border-[#272b3b] border-b-[#181a24]'
              : 'text-gray-400 hover:text-gray-200 border-transparent'
          }`}
        >
          <FileText size={14} />
          <span>Khasra & Khatauni Register</span>
        </button>

        <button
          onClick={() => setActiveTab('diligence')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-semibold transition-colors cursor-pointer border-t border-x ${
            activeTab === 'diligence'
              ? 'bg-[#181a24] text-indigo-400 border-[#272b3b] border-b-[#181a24]'
              : 'text-gray-400 hover:text-gray-200 border-transparent'
          }`}
        >
          <ShieldCheck size={14} />
          <span>5-Point Title Clearance Dossier</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-semibold transition-colors cursor-pointer border-t border-x ${
            activeTab === 'editor'
              ? 'bg-[#181a24] text-indigo-400 border-[#272b3b] border-b-[#181a24]'
              : 'text-gray-400 hover:text-gray-200 border-transparent'
          }`}
        >
          <Maximize2 size={14} />
          <span>Shoelace Coordinate & Area Math</span>
        </button>

        <button
          onClick={() => setActiveTab('geojson')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-semibold transition-colors cursor-pointer border-t border-x ${
            activeTab === 'geojson'
              ? 'bg-[#181a24] text-indigo-400 border-[#272b3b] border-b-[#181a24]'
              : 'text-gray-400 hover:text-gray-200 border-transparent'
          }`}
        >
          <ExternalLink size={14} />
          <span>RFC 7946 GeoJSON Serializer</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE SPATIAL GIS CANVAS */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main SVG Vector Map Canvas (2 cols) */}
          <div className="lg:col-span-2 bg-[#141622] border border-[#272b3b] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Canvas Header & Layer Toggles */}
            <div className="bg-[#181b28] border-b border-[#272b3b] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Compass size={14} className="text-amber-400" />
                  <span>Interactive Vector GIS Viewport</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">EPSG:4326 Conformal</span>
              </div>

              {/* Layer Controls & Zoom Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowContours(!showContours)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                    showContours
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-[#202436] border-[#2d3246] text-gray-400'
                  }`}
                  title="Toggle Elevation Contours"
                >
                  Contours
                </button>

                <button
                  onClick={() => setShowWaterStreams(!showWaterStreams)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                    showWaterStreams
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-[#202436] border-[#2d3246] text-gray-400'
                  }`}
                  title="Toggle Perennial Gadhera Water Streams & Flow Vectors"
                >
                  Gadhera Stream
                </button>

                <button
                  onClick={() => setShowSolarHeatmap(!showSolarHeatmap)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                    showSolarHeatmap
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : 'bg-[#202436] border-[#2d3246] text-gray-400'
                  }`}
                  title="Toggle Solar Aspect Exposure Overlay"
                >
                  Solar Aspect
                </button>

                <div className="h-4 w-[1px] bg-gray-700 mx-1" />

                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1 rounded bg-[#202436] hover:bg-[#2a3048] text-gray-300 border border-[#2d3246]"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>

                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1 rounded bg-[#202436] hover:bg-[#2a3048] text-gray-300 border border-[#2d3246]"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>

                <button
                  onClick={handleResetCanvas}
                  className="p-1 rounded bg-[#202436] hover:bg-[#2a3048] text-gray-300 border border-[#2d3246]"
                  title="Reset Pan/Zoom"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div
              className="relative w-full h-[520px] bg-[#0d0f17] overflow-hidden cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                viewBox="0 0 800 600"
                className="w-full h-full"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1e2e" strokeWidth="0.8" />
                  </pattern>

                  {/* Linear Gradient for Solar Ridge */}
                  <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                  </linearGradient>

                  {/* Linear Gradient for Perennial Stream */}
                  <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Background Grid */}
                <rect width="800" height="600" fill="url(#grid)" />

                {/* Elevation Contours (Topographical lines) */}
                {showContours && (
                  <g className="opacity-40">
                    <path d="M 30,120 Q 250,90 450,140 T 780,110" fill="none" stroke="#3b4260" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="50" y="115" fill="#64748b" fontSize="9" fontFamily="monospace">1340m MSL</text>

                    <path d="M 30,220 Q 280,180 500,240 T 780,210" fill="none" stroke="#475569" strokeWidth="1.2" />
                    <text x="50" y="215" fill="#64748b" fontSize="9" fontFamily="monospace">1360m MSL</text>

                    <path d="M 30,340 Q 300,300 520,360 T 780,330" fill="none" stroke="#475569" strokeWidth="1.2" />
                    <text x="50" y="335" fill="#64748b" fontSize="9" fontFamily="monospace">1380m MSL</text>

                    <path d="M 30,460 Q 320,420 540,480 T 780,450" fill="none" stroke="#3b4260" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="50" y="455" fill="#64748b" fontSize="9" fontFamily="monospace">1400m MSL</text>
                  </g>
                )}

                {/* Perennial Stream (Netala Gadhera) & 50m Buffer Corridor */}
                {showWaterStreams && (
                  <g>
                    {/* 50m Statutory Safety Buffer Ribbon */}
                    <path
                      d="M 120,50 Q 260,220 480,420 T 720,580"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="36"
                      strokeOpacity="0.08"
                    />
                    {/* Stream Centerline */}
                    <path
                      d="M 120,50 Q 260,220 480,420 T 720,580"
                      fill="none"
                      stroke="url(#streamGrad)"
                      strokeWidth="3"
                    />
                    <text x="280" y="270" fill="#38bdf8" fontSize="10" fontWeight="bold" transform="rotate(35 280 270)">
                      Netala Perennial Gadhera (Gravity Water Flow ➔)
                    </text>
                  </g>
                )}

                {/* Khasra Parcel Polygons */}
                {parcels.map((parcel) => {
                  const isSelected = parcel.id === selectedParcel?.id;
                  const pts = (parcel.coordinates || []).map(([lon, lat]) => projectToSvg(lon, lat));
                  if (pts.length < 3) return null;

                  const pathData = `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')} Z`;
                  const centroid = pts.reduce(
                    (acc, p) => ({ x: acc.x + p.x / pts.length, y: acc.y + p.y / pts.length }),
                    { x: 0, y: 0 }
                  );

                  let fillColor = '#1e293b';
                  let strokeColor = '#475569';
                  if (parcel.diligenceStatus === 'Clear') {
                    fillColor = isSelected ? '#065f46' : '#064e3b';
                    strokeColor = '#10b981';
                  } else if (parcel.diligenceStatus === 'Conditional') {
                    fillColor = isSelected ? '#78350f' : '#451a03';
                    strokeColor = '#f59e0b';
                  } else {
                    fillColor = isSelected ? '#881337' : '#4c0519';
                    strokeColor = '#f43f5e';
                  }

                  return (
                    <g key={parcel.id} onClick={() => setSelectedParcelId(parcel.id)} className="cursor-pointer">
                      {/* Solar aspect glow highlight */}
                      {showSolarHeatmap && parcel.aspectDirection?.includes('South') && (
                        <path d={pathData} fill="url(#solarGrad)" opacity={isSelected ? 0.9 : 0.6} />
                      )}

                      {/* Parcel Polygon boundary */}
                      <path
                        d={pathData}
                        fill={fillColor}
                        fillOpacity={isSelected ? 0.75 : 0.45}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="transition-all hover:fill-opacity-70"
                      />

                      {/* Vertex Markers */}
                      {pts.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 3.5 : 2}
                          fill={strokeColor}
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                      ))}

                      {/* Centroid Label */}
                      {showLabels && (
                        <g transform={`translate(${centroid.x}, ${centroid.y})`}>
                          <rect
                            x="-45"
                            y="-18"
                            width="90"
                            height="36"
                            rx="6"
                            fill="#0f111a"
                            fillOpacity="0.85"
                            stroke={strokeColor}
                            strokeWidth="1"
                          />
                          <text x="0" y="-3" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                            Khasra #{parcel.khasraNumber}
                          </text>
                          <text x="0" y="11" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                            {parcel.areaNali} Nali · {parcel.elevationMin}m
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* North Arrow Compass Rose Overlay (Top Right) */}
                <g transform="translate(740, 60)">
                  <circle cx="0" cy="0" r="22" fill="#141724" stroke="#2d3348" strokeWidth="1.5" />
                  {/* North Triangle (Red) */}
                  <polygon points="0,-18 5,0 -5,0" fill="#ef4444" />
                  {/* South Triangle (Silver) */}
                  <polygon points="0,18 5,0 -5,0" fill="#94a3b8" />
                  <text x="0" y="-22" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">N</text>
                </g>

                {/* Scale Bar (Bottom Left) */}
                <g transform="translate(40, 560)">
                  <line x1="0" y1="0" x2="100" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="50" y1="-3" x2="50" y2="3" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="100" y1="-4" x2="100" y2="4" stroke="#94a3b8" strokeWidth="2" />
                  <text x="0" y="14" fill="#94a3b8" fontSize="9" fontFamily="monospace">0m</text>
                  <text x="45" y="14" fill="#94a3b8" fontSize="9" fontFamily="monospace">50m</text>
                  <text x="90" y="14" fill="#94a3b8" fontSize="9" fontFamily="monospace">100m</text>
                </g>
              </svg>

              {/* Viewport Info Overlay */}
              <div className="absolute bottom-3 right-4 bg-[#141724]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#272b3b] text-[10px] text-gray-400 font-mono flex items-center gap-3">
                <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
                <span>Parcels: {parcels.length}</span>
                <span>Active: #{selectedParcel?.khasraNumber || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Selected Parcel Dossier Card (Right Rail) */}
          <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            {selectedParcel ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        Khasra #{selectedParcel.khasraNumber}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{
                          backgroundColor: `${selectedParcel.diligenceStatus === 'Clear' ? '#10b98120' : '#f59e0b20'}`,
                          color: selectedParcel.diligenceStatus === 'Clear' ? '#34d399' : '#fbbf24',
                          border: `1px solid ${selectedParcel.diligenceStatus === 'Clear' ? '#10b98140' : '#f59e0b40'}`,
                        }}
                      >
                        {selectedParcel.diligenceStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedParcel.villageTehsil}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteParcel(selectedParcel.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                    title="Delete parcel"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Himalayan Cadastral Area Box */}
                <div className="bg-[#12141d] border border-[#252a3a] rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-gray-400 flex items-center justify-between">
                    <span>Himalayan Cadastral Area</span>
                    <span className="text-amber-400 font-bold">{selectedParcel.areaNali} Nali</span>
                  </div>
                  <div className="text-lg font-black text-white mt-1">
                    {selectedParcel.areaSqMeters} m²
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    = {Math.round(selectedParcel.areaSqMeters * 10.764)} sq ft · {(selectedParcel.areaNali / 12).toFixed(2)} Bigha · {selectedParcel.areaMutthi} Mutthi
                  </div>
                </div>

                {/* Topography & Elevation */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#141622] p-2.5 rounded-xl border border-[#232738]">
                    <span className="text-[10px] text-gray-500 block">Elevation Belt</span>
                    <span className="font-semibold text-emerald-400">
                      {selectedParcel.elevationMin}m – {selectedParcel.elevationMax}m
                    </span>
                  </div>

                  <div className="bg-[#141622] p-2.5 rounded-xl border border-[#232738]">
                    <span className="text-[10px] text-gray-500 block">Slope Grade</span>
                    <span className="font-semibold text-cyan-400">
                      {selectedParcel.slopePercent}% Gradient
                    </span>
                  </div>

                  <div className="bg-[#141622] p-2.5 rounded-xl border border-[#232738]">
                    <span className="text-[10px] text-gray-500 block">Solar Ridge Aspect</span>
                    <span className="font-semibold text-amber-300 flex items-center gap-1">
                      <Sun size={12} />
                      <span>{selectedParcel.aspectDirection}</span>
                    </span>
                  </div>

                  <div className="bg-[#141622] p-2.5 rounded-xl border border-[#232738]">
                    <span className="text-[10px] text-gray-500 block">Stream Distance</span>
                    <span className="font-semibold text-blue-400 flex items-center gap-1">
                      <Droplets size={12} />
                      <span>{selectedParcel.waterStreamDistanceMeters}m to Gadhera</span>
                    </span>
                  </div>
                </div>

                {/* 5-Point Legal Diligence Checklist Preview */}
                <div className="space-y-2 pt-2 border-t border-[#232738]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-300 text-[11px] flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-indigo-400" />
                      <span>5-Point Title Clearance</span>
                    </span>
                    <span className="font-mono font-bold text-indigo-400">
                      {selectedParcel.riskScore}/100 Score
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { key: 'khatauni12Yr', label: '12-Yr Khatauni Chain Verified' },
                      { key: 'nec12Yr', label: 'Non-Encumbrance Clean Title' },
                      { key: 'section143Cleared', label: 'Section 154 / 143 Clearance' },
                      { key: 'patwariDemarcated', label: 'Revenue Patwari Demarcated' },
                      { key: 'disasterSafe', label: 'Bedrock & Stream Buffer Safe' },
                    ].map((item) => {
                      const checked = selectedParcel.legalChecks?.[item.key as keyof typeof selectedParcel.legalChecks];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleToggleLegalCheck(selectedParcel, item.key as any)}
                          className="w-full flex items-center justify-between text-left text-[11px] py-1 px-2 rounded-lg hover:bg-[#141724] transition-colors"
                        >
                          <span className={checked ? 'text-gray-200' : 'text-gray-500'}>{item.label}</span>
                          {checked ? (
                            <CheckCircle2 size={13} className="text-emerald-400" />
                          ) : (
                            <Circle size={13} className="text-gray-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Registered Landholders */}
                <div className="pt-2 border-t border-[#232738]">
                  <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold">
                    Registered Bhumidhars (Khatauni)
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedParcel.bhumidharNames?.map((name, i) => (
                      <span
                        key={i}
                        className="bg-[#1c2030] text-gray-300 text-[11px] px-2 py-0.5 rounded-md border border-[#2d3246]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 text-xs">
                <Mountain size={32} className="text-gray-600 mb-2" />
                <p>Select a Khasra polygon on the canvas to inspect its complete spatial and legal dossier.</p>
              </div>
            )}

            <button
              onClick={() => setActiveTab('diligence')}
              className="w-full mt-4 bg-[#202436] hover:bg-[#282e46] border border-[#343a54] text-indigo-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Full Legal Clearance Dossier</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: KHASRA & KHATAUNI CADASTRE REGISTER */}
      {activeTab === 'register' && (
        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#272b3b] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Cadastral Revenue Register</h3>
              <p className="text-xs text-gray-400">Formal revenue breakdown linked to Tehsil Khatauni records.</p>
            </div>
            <button
              onClick={() => setIsAddingParcel(true)}
              className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg"
            >
              <Plus size={13} />
              <span>Add Record</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#141622] text-[11px] text-gray-400 uppercase tracking-wider border-b border-[#272b3b]">
                <tr>
                  <th className="py-3 px-4">Khasra #</th>
                  <th className="py-3 px-4">Khata #</th>
                  <th className="py-3 px-4">Village / Tehsil</th>
                  <th className="py-3 px-4">Land Class</th>
                  <th className="py-3 px-4">Area (Nali / m²)</th>
                  <th className="py-3 px-4">Elevation & Aspect</th>
                  <th className="py-3 px-4">Registered Bhumidhars</th>
                  <th className="py-3 px-4">Title Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222638]">
                {parcels.map((parcel) => (
                  <tr
                    key={parcel.id}
                    onClick={() => {
                      setSelectedParcelId(parcel.id);
                      setActiveTab('canvas');
                    }}
                    className="hover:bg-[#1c2032] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                      <MapPin size={13} className="text-amber-400" />
                      <span>{parcel.khasraNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400">{parcel.khataNumber}</td>
                    <td className="py-3 px-4">{parcel.villageTehsil}</td>
                    <td className="py-3 px-4">
                      <span className="bg-[#1e2336] text-gray-300 px-2 py-0.5 rounded border border-[#2d334e] text-[11px]">
                        {parcel.landClassification}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      <div>{parcel.areaNali} Nali</div>
                      <div className="text-[10px] text-gray-500 font-mono">{parcel.areaSqMeters} m²</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{parcel.elevationMin}m MSL</div>
                      <div className="text-[10px] text-amber-300/80">{parcel.aspectDirection}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {parcel.bhumidharNames?.join(', ') || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{
                          backgroundColor: `${parcel.diligenceStatus === 'Clear' ? '#10b98120' : '#f59e0b20'}`,
                          color: parcel.diligenceStatus === 'Clear' ? '#34d399' : '#fbbf24',
                          border: `1px solid ${parcel.diligenceStatus === 'Clear' ? '#10b98140' : '#f59e0b40'}`,
                        }}
                      >
                        {parcel.diligenceStatus} ({parcel.riskScore})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 5-POINT TITLE CLEARANCE DOSSIER */}
      {activeTab === 'diligence' && (
        <div className="space-y-6">
          <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-400" />
              <span>5-Point Himalayan Land Due Diligence Framework</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Rigorous statutory diligence protocol for purchasing private agricultural land in Uttarakhand and Himachal Pradesh under Section 154 / 143 Land Revenue Codes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {[
                {
                  id: 'khatauni',
                  title: '1. 12-Year Revenue Chain (Khatauni)',
                  desc: 'Continuous Khatauni search from Fasli year to ensure clear hereditary Bhumidhari rights with transferable rights (Class 1-A). Confirms no pending mutations or unregistered co-shares.',
                },
                {
                  id: 'nec',
                  title: '2. Non-Encumbrance Certificate (NEC)',
                  desc: '12-year Nil-Encumbrance inspection at the Sub-Registrar office. Proves parcel is free from bank agricultural loans, mortgage hypothecations, or judicial attachment.',
                },
                {
                  id: 'ceiling',
                  title: '3. Section 154 / 143 Clearance',
                  desc: 'Compliance with Uttarakhand 250 sq m (~1.25 Nali) outsider purchase limit, or prior sanction under AYUSH/Tourism policy. Non-agricultural conversion clearance.',
                },
                {
                  id: 'demarcation',
                  title: '4. Patwari Demarcation Stones',
                  desc: 'Physical field boundary identification with Revenue Patwari and Total Station electronic survey. Cross-verification of Khasra coordinates against official Cadastral map.',
                },
                {
                  id: 'stream',
                  title: '5. Perennial Stream & Hazard Buffer',
                  desc: 'Environmental audit ensuring >50m safety corridor from perennial mountain streams (Gadhera) and >200m from primary riverbeds. Stable bedrock; zero flash-flood risk.',
                },
              ].map((card, i) => (
                <div key={i} className="bg-[#141622] border border-[#272b3b] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-indigo-300">{card.title}</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Diligence Action Table */}
          <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Active Khasra Parcels Diligence Verification Matrix
            </h4>

            <div className="space-y-3">
              {parcels.map((parcel) => (
                <div
                  key={parcel.id}
                  className="bg-[#12141e] border border-[#232738] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        Khasra #{parcel.khasraNumber} · {parcel.villageTehsil}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">({parcel.areaNali} Nali)</span>
                    </div>
                    <p className="text-xs text-gray-400">{parcel.encumbranceNotes}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right mr-3">
                      <span className="text-xs font-bold text-white block">{parcel.riskScore}/100</span>
                      <span
                        className="text-[10px] uppercase font-bold"
                        style={{
                          color: parcel.diligenceStatus === 'Clear' ? '#34d399' : '#fbbf24',
                        }}
                      >
                        {parcel.diligenceStatus}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedParcelId(parcel.id);
                        setActiveTab('canvas');
                      }}
                      className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Audit on Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SHOELACE COORDINATE & GEOMETRIC MATH */}
      {activeTab === 'editor' && (
        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Maximize2 size={16} className="text-indigo-400" />
              <span>Shoelace Polygon Area & Coordinate Vertex Mathematics</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Gauss Shoelace Formula projected over WGS-84 conformal Euclidean plane for exact mountain parcel sizing.
            </p>
          </div>

          {selectedParcel ? (
            <div className="space-y-4">
              <div className="bg-[#12141d] p-4 rounded-xl border border-[#252a3a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">
                    Inspecting Khasra #{selectedParcel.khasraNumber} Coordinate Ring
                  </span>
                  <span className="text-xs text-amber-400 font-mono">
                    {selectedParcel.coordinates?.length || 0} Boundary Vertices
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {selectedParcel.coordinates?.map(([lon, lat], idx) => (
                    <div key={idx} className="bg-[#181b28] p-2.5 rounded-lg border border-[#2a2f44] flex items-center justify-between">
                      <span className="text-gray-400">Vertex #{idx + 1}</span>
                      <span className="text-emerald-300">[{lon.toFixed(6)}, {lat.toFixed(6)}]</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mathematical Proof Box */}
              <div className="bg-[#141724] p-4 rounded-xl border border-[#272b3b] space-y-2 text-xs text-gray-300">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider block">
                  Area Evaluation Proof:
                </span>
                <p className="font-mono text-[11px] text-cyan-300">
                  Area = ½ | Σ (x_i · y_i+1 - x_i+1 · y_i) | = {selectedParcel.areaSqMeters} m²
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="bg-[#1c2030] p-2 rounded">
                    <span className="text-gray-500 block">Nali (2,160 sq ft)</span>
                    <span className="text-white font-bold">{selectedParcel.areaNali} Nali</span>
                  </div>
                  <div className="bg-[#1c2030] p-2 rounded">
                    <span className="text-gray-500 block">Mutthi (1/16 Nali)</span>
                    <span className="text-white font-bold">{selectedParcel.areaMutthi} Mutthi</span>
                  </div>
                  <div className="bg-[#1c2030] p-2 rounded">
                    <span className="text-gray-500 block">Bigha (12 Nali)</span>
                    <span className="text-white font-bold">{(selectedParcel.areaNali / 12).toFixed(2)} Bigha</span>
                  </div>
                  <div className="bg-[#1c2030] p-2 rounded">
                    <span className="text-gray-500 block">Square Feet</span>
                    <span className="text-white font-bold">{Math.round(selectedParcel.areaSqMeters * 10.764)} sq ft</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No parcel selected.</p>
          )}
        </div>
      )}

      {/* TAB 5: RFC 7946 GEOJSON SERIALIZER */}
      {activeTab === 'geojson' && (
        <div className="bg-[#161822] border border-[#272b3b] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ExternalLink size={16} className="text-cyan-400" />
                <span>RFC 7946 GeoJSON Cadastral Export & Pipeline</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Standardized GeoJSON FeatureCollection formatted for QGIS, ArcGIS, Google Earth KMZ, and Government Land Records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyGeoJson}
                className="flex items-center gap-1.5 bg-[#202436] hover:bg-[#282d44] border border-[#343a54] text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Copy size={13} />
                <span>Copy JSON</span>
              </button>
              <button
                onClick={handleExportGeoJson}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <Download size={13} />
                <span>Download .geojson</span>
              </button>
            </div>
          </div>

          <pre className="bg-[#0f1118] border border-[#252a3a] rounded-xl p-4 text-[11px] font-mono text-cyan-300 max-h-[480px] overflow-auto">
            {exportToGeoJson(parcels)}
          </pre>
        </div>
      )}

      {/* MODAL: ADD NEW KHASRA PARCEL */}
      {isAddingParcel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewParcel}
            className="bg-[#161822] border border-[#3b4260] rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#282d3e] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="text-indigo-400" size={17} />
                <span>Add Khasra Parcel / Survey Unit</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingParcel(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Khasra Number</label>
                <input
                  type="text"
                  value={newKhasraNo}
                  onChange={(e) => setNewKhasraNo(e.target.value)}
                  placeholder="e.g. 143/1"
                  required
                  className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Khata Number</label>
                <input
                  type="text"
                  value={newKhataNo}
                  onChange={(e) => setNewKhataNo(e.target.value)}
                  placeholder="e.g. 00045"
                  className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Village & Tehsil</label>
              <input
                type="text"
                value={newVillage}
                onChange={(e) => setNewVillage(e.target.value)}
                placeholder="e.g. Netala, Bhatwari Tehsil, Uttarkashi"
                className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Land Classification</label>
                <select
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value as any)}
                  className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Bagicha (Orchard)">Bagicha (Orchard)</option>
                  <option value="Krishi (Agricultural)">Krishi (Agricultural)</option>
                  <option value="Abadi (Residential)">Abadi (Residential)</option>
                  <option value="Banjar (Uncultivated)">Banjar (Uncultivated)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Solar Ridge Aspect</label>
                <select
                  value={newAspect}
                  onChange={(e) => setNewAspect(e.target.value as any)}
                  className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="South-East">South-East (Optimal 8.5h Sun)</option>
                  <option value="South">South (Maximum 9.5h Sun)</option>
                  <option value="East">East (Morning Sun 7h)</option>
                  <option value="South-West">South-West (Warm Afternoon)</option>
                  <option value="West">West (Afternoon 5.5h)</option>
                  <option value="North">North (Frost Pocket / Shaded)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Min Elevation (m)</label>
                <input
                  type="number"
                  value={newElevMin}
                  onChange={(e) => setNewElevMin(Number(e.target.value))}
                  className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Max Elevation (m)</label>
                <input
                  type="number"
                  value={newElevMax}
                  onChange={(e) => setNewElevMax(Number(e.target.value))}
                  className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Registered Bhumidhars (Comma Separated)
              </label>
              <input
                type="text"
                value={newBhumidhars}
                onChange={(e) => setNewBhumidhars(e.target.value)}
                placeholder="e.g. Sundar Singh Negi, Devendra Singh Negi"
                className="w-full bg-[#12141e] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#282d3e]">
              <button
                type="button"
                onClick={() => setIsAddingParcel(false)}
                className="text-xs text-gray-400 hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
              >
                Save Khasra Parcel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
