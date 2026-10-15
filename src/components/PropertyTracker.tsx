import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PropertyParcel } from '../db';
import { 
  Compass, 
  MapPin, 
  Sun, 
  Droplet, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  Circle, 
  FileText,
  Mountain,
  Navigation
} from 'lucide-react';

export const PropertyTracker: React.FC = () => {
  const parcels = useLiveQuery(() => db.properties.orderBy('updatedAt').reverse().toArray(), []) || [];
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Uttarkashi, Uttarakhand');
  const [elevation, setElevation] = useState(1350);
  const [areaSize, setAreaSize] = useState('4.0 Nali (~8,640 sq ft)');
  const [askingPrice, setAskingPrice] = useState('?24,00,000');
  const [pricePerUnit, setPricePerUnit] = useState('?6.0L / Nali');
  const [roadAccess, setRoadAccess] = useState<PropertyParcel['roadAccess']>('Paved Motor Road');
  const [waterSource, setWaterSource] = useState<PropertyParcel['waterSource']>('Perennial Stream (Gadhera)');
  const [solarExposure, setSolarExposure] = useState<PropertyParcel['solarExposure']>('South Facing (Full Day)');
  const [status, setStatus] = useState<PropertyParcel['status']>('Shortlisted');
  const [legalNotes, setLegalNotes] = useState('');

  const [diligenceChecks, setDiligenceChecks] = useState({
    khatauni12YrVerified: false,
    necObtained: false,
    disasterFloodSafe: true,
    boundaryDemarcated: false,
    localTehsilApproved: false,
  });

  const handleToggleCheck = async (parcel: PropertyParcel, key: keyof PropertyParcel['diligenceChecks']) => {
    const updated = {
      ...parcel.diligenceChecks,
      [key]: !parcel.diligenceChecks[key],
    };
    await db.properties.update(parcel.id, {
      diligenceChecks: updated,
      updatedAt: Date.now(),
    });
  };

  const handleUpdateStatus = async (parcel: PropertyParcel, newStatus: PropertyParcel['status']) => {
    await db.properties.update(parcel.id, {
      status: newStatus,
      updatedAt: Date.now(),
    });
  };

  const handleSaveParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = Date.now();
    const newParcel: PropertyParcel = {
      id: `prop-${now}`,
      title: title.trim(),
      location: location.trim(),
      elevationMeters: elevation,
      areaSize: areaSize.trim(),
      askingPrice: askingPrice.trim(),
      pricePerUnit: pricePerUnit.trim(),
      roadAccess,
      waterSource,
      solarExposure,
      status,
      diligenceChecks,
      legalNotes: legalNotes.trim() || 'Diligence initialized.',
      createdAt: now,
      updatedAt: now,
    };

    await db.properties.add(newParcel);
    setTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mountain className="text-amber-400" size={22} />
            <span>Land & Property Due Diligence Hub</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Site shortlist, 12-year Khatauni revenue checks, perennial stream water access, solar elevation, and disaster safety.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>{isAdding ? 'Close Form' : 'Add Property Parcel'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-gray-400">Total Parcels</span>
          <div className="mt-2 text-2xl font-black text-white">{parcels.length}</div>
          <span className="text-[10px] text-gray-500">Shortlisted & Evaluated</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-gray-400">In Due Diligence</span>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {parcels.filter(p => p.status === 'Due Diligence').length}
          </div>
          <span className="text-[10px] text-amber-300/80">Revenue & Title Verification</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-gray-400">Ideal Elevation Belt</span>
          <div className="mt-2 text-lg font-bold text-emerald-400">1100m – 1600m</div>
          <span className="text-[10px] text-emerald-300/80">Temperate Himalayan Climate</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-gray-400">Water Security</span>
          <div className="mt-2 text-lg font-bold text-cyan-400">Perennial Stream</div>
          <span className="text-[10px] text-cyan-300/80">Gravity Water Source Baseline</span>
        </div>
      </div>

      {/* Add New Parcel Form */}
      {isAdding && (
        <form onSubmit={handleSaveParcel} className="bg-[#181a24] border border-[#3b4260] rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#282d3e] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="text-indigo-400" size={17} />
              <span>Add Property Shortlist / Diligence Dossier</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Parcel Title / Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Netala Upper Ridge Ridge Plot"
                required
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Location / Tehsil</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Uttarkashi, Bhatwari Tehsil"
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Elevation (Meters)</label>
              <input
                type="number"
                value={elevation}
                onChange={(e) => setElevation(Number(e.target.value))}
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Area / Size</label>
              <input
                type="text"
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                placeholder="e.g. 4.5 Nali"
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Asking Price</label>
              <input
                type="text"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="?25,00,000"
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Road Access</label>
              <select
                value={roadAccess}
                onChange={(e) => setRoadAccess(e.target.value as any)}
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Paved Motor Road">Paved Motor Road</option>
                <option value="Kaccha Jeep Track">Kaccha Jeep Track</option>
                <option value="Foot Trail">Foot Trail</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Water Source</label>
              <select
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value as any)}
                className="w-full bg-[#141622] border border-[#2d344d] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Perennial Stream (Gadhera)">Perennial Stream (Gadhera)</option>
                <option value="Spring Water">Spring Water</option>
                <option value="Borewell">Borewell</option>
                <option value="Piped">Piped</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Legal / Due Diligence Notes</label>
            <textarea
              rows={2}
              value={legalNotes}
              onChange={(e) => setLegalNotes(e.target.value)}
              placeholder="Khatauni inspection status, mutation registry notes, local Tehsil inquiry..."
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
              Save Property Parcel
            </button>
          </div>
        </form>
      )}

      {/* Parcel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {parcels.map(parcel => {
          const checks = parcel.diligenceChecks || {
            khatauni12YrVerified: false,
            necObtained: false,
            disasterFloodSafe: false,
            boundaryDemarcated: false,
            localTehsilApproved: false,
          };

          const completedCount = Object.values(checks).filter(Boolean).length;

          return (
            <div 
              key={parcel.id} 
              className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{parcel.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <MapPin size={13} className="text-amber-400" />
                      <span>{parcel.location}</span>
                    </div>
                  </div>
                  <select
                    value={parcel.status}
                    onChange={(e) => handleUpdateStatus(parcel, e.target.value as any)}
                    className="bg-[#141622] border border-[#2d344d] text-xs font-semibold rounded-lg px-2.5 py-1 text-gray-200"
                  >
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Site Visited">Site Visited</option>
                    <option value="Due Diligence">Due Diligence</option>
                    <option value="Acquired">Acquired</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {/* Specs Pill Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                  <div className="bg-[#141622] p-2 rounded-xl border border-[#232738]">
                    <span className="text-gray-500 block">Area & Price</span>
                    <span className="text-white font-semibold">{parcel.areaSize} · {parcel.askingPrice}</span>
                  </div>

                  <div className="bg-[#141622] p-2 rounded-xl border border-[#232738]">
                    <span className="text-gray-500 block">Elevation</span>
                    <span className="text-emerald-400 font-semibold">{parcel.elevationMeters}m MSL</span>
                  </div>

                  <div className="bg-[#141622] p-2 rounded-xl border border-[#232738]">
                    <span className="text-gray-500 block">Water Line</span>
                    <span className="text-cyan-300 font-semibold truncate block">{parcel.waterSource}</span>
                  </div>

                  <div className="bg-[#141622] p-2 rounded-xl border border-[#232738]">
                    <span className="text-gray-500 block">Solar Ridge</span>
                    <span className="text-amber-300 font-semibold truncate block">{parcel.solarExposure}</span>
                  </div>
                </div>

                {/* 5-Step Legal Diligence Checklist */}
                <div className="mt-4 pt-3 border-t border-[#232738] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-indigo-400" />
                      <span>Legal Due Diligence Verification</span>
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">{completedCount}/5 Complete</span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { key: 'khatauni12YrVerified', label: '12-Year Revenue Record (Khatauni Verified at Tehsil)' },
                      { key: 'necObtained', label: 'Non-Encumbrance Certificate (NEC Clean Title)' },
                      { key: 'disasterFloodSafe', label: 'Disaster Safety (Stable Bedrock, >200m River Buffer)' },
                      { key: 'boundaryDemarcated', label: 'Physical Boundary Demarcated with Revenue Patwari' },
                      { key: 'localTehsilApproved', label: 'Section 143 / Land Use Classification Clearance' },
                    ].map(item => {
                      const checked = checks[item.key as keyof typeof checks];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleToggleCheck(parcel, item.key as any)}
                          className="w-full flex items-center gap-2 text-left text-[11px] py-1 px-1.5 rounded hover:bg-[#141622] transition-colors"
                        >
                          {checked ? (
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={14} className="text-gray-600 shrink-0" />
                          )}
                          <span className={checked ? 'text-gray-200' : 'text-gray-500 line-through'}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legal Notes */}
              {parcel.legalNotes && (
                <div className="bg-[#12141d] p-3 rounded-xl border border-[#202434] text-[11px] text-gray-400">
                  <span className="font-bold text-gray-300 block mb-0.5">Notes & Findings:</span>
                  <p>{parcel.legalNotes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
