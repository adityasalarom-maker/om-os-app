import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  Inbox, 
  Compass, 
  BookHeart, 
  UtensilsCrossed, 
  Sheet, 
  Search, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Heart, 
  Mountain,
  Grid,
  X,
  Layers,
  Smartphone,
  Camera,
  TrendingUp,
  Moon,
  Scroll,
  Wind
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'tasks' 
  | 'knowledge' 
  | 'pdf' 
  | 'inbox' 
  | 'goals' 
  | 'journal' 
  | 'health' 
  | 'property' 
  | 'pantry' 
  | 'sheets'
  | 'analytics'
  | 'jyotish'
  | 'sadhana'
  | 'vedic'
  | 'pranayama'
  | 'sovereign_studio';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
  onOpenOcr?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenOcr,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pendingQueueCount = useLiveQuery(() => db.syncQueue.where('status').equals('pending').count(), []) || 0;
  const conflictCount = useLiveQuery(() => db.syncConflicts.toArray(), [])?.filter(c => !c.resolved).length || 0;

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', shortLabel: 'Home', icon: LayoutDashboard, category: 'Core OS' },
    { id: 'tasks', label: 'Task Intelligence', shortLabel: 'Tasks', icon: CheckSquare, category: 'Productivity' },
    { id: 'knowledge', label: 'Knowledge Vault', shortLabel: 'Vault', icon: BookOpen, category: 'Core OS' },
    { id: 'sovereign_studio', label: 'Sovereign Studio V2', shortLabel: 'Studio', icon: Sparkles, category: 'Core OS' },
    { id: 'pranayama', label: 'Pranayama & Breathwork', shortLabel: 'Prana', icon: Wind, category: 'Metaphysical' },
    { id: 'vedic', label: 'Vedic & Shankara Bhashya', shortLabel: 'Vedic', icon: Scroll, category: 'Metaphysical' },
    { id: 'sadhana', label: 'Dream & Sadhana OS', shortLabel: 'Sadhana', icon: Moon, category: 'Metaphysical' },
    { id: 'jyotish', label: 'Metaphysical & Jyotish', shortLabel: 'Jyotish', icon: Sparkles, category: 'Metaphysical' },
    { id: 'health', label: 'Health & Ayurveda', shortLabel: 'Health', icon: Heart, category: 'Life & Vitality' },
    { id: 'property', label: 'Himalayan Spatial GIS', shortLabel: 'GIS', icon: Mountain, category: 'Asset Diligence' },
    { id: 'pdf', label: 'Reading Library & Knowledge Hub', shortLabel: 'Library', icon: BookOpen, category: 'Study Archive' },
    { id: 'inbox', label: 'Universal Inbox & AI', shortLabel: 'Capture', icon: Inbox, category: 'Input Hub' },
    { id: 'goals', label: 'Goals (Life Pyramid)', shortLabel: 'Goals', icon: Compass, category: 'Life & Vitality' },
    { id: 'journal', label: 'Journal & Reflection', shortLabel: 'Journal', icon: BookHeart, category: 'Life & Vitality' },
    { id: 'analytics', label: 'Predictive Analytics & Radar', shortLabel: 'Analytics', icon: TrendingUp, category: 'Intelligence' },
    { id: 'pantry', label: 'Kitchen & Pantry', shortLabel: 'Pantry', icon: UtensilsCrossed, category: 'Household' },
    { id: 'sheets', label: 'Google Sheets Bridge', shortLabel: 'Sheets', icon: Sheet, category: 'Sync Bridge' },
  ];

  // Secondary tabs that indicate "More" is active when selected
  const isMoreActive = ['health', 'property', 'pdf', 'goals', 'journal', 'pantry', 'sheets', 'analytics', 'jyotish', 'sadhana', 'vedic', 'pranayama', 'sovereign_studio'].includes(currentTab);

  const handleMobileSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Left Rail Sidebar (Hidden on mobile) */}
      <aside 
        className={`hidden md:flex flex-col bg-[#161822] border-r border-[#272b3b] transition-all duration-200 select-none z-20 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#272b3b]">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                ॐ
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-wide text-white">Om Knowledge OS</h1>
                <span className="text-[10px] text-indigo-400 font-mono tracking-wider">v2.0 LOCAL-FIRST</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              ॐ
            </div>
          )}
          <button 
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#212536] transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Quick Search Button */}
        <div className="p-3">
          <button
            onClick={onOpenSearch}
            className={`w-full flex items-center gap-2 bg-[#1e2230] hover:bg-[#252a3d] border border-[#2e3347] text-gray-400 hover:text-white px-3 py-2 rounded-lg text-xs transition-all shadow-sm ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search size={15} className="text-indigo-400" />
              {!isCollapsed && <span>Search & Jump...</span>}
            </div>
            {!isCollapsed && (
              <kbd className="bg-[#161822] px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 border border-[#2e3347]">
                Ctrl+P
              </kbd>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2333]'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-gray-400'} />
                {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!isCollapsed && item.id === 'sheets' && (conflictCount > 0 || pendingQueueCount > 0) && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    conflictCount > 0 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {conflictCount > 0 ? `${conflictCount}!` : `${pendingQueueCount}`}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="p-4 border-t border-[#272b3b] text-[11px] text-gray-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Offline Ready
            </span>
            <span className="font-mono text-gray-400">Win11 & S25</span>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (Optimized for Samsung S25 Ultra 6.8" AMOLED & Thumb Ergonomics) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#161822]/95 backdrop-blur-md border-t border-[#272b3b] z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] h-[calc(4rem+env(safe-area-inset-bottom,0px))]">
        {/* 1. Home Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            currentTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        {/* 2. Tasks Matrix */}
        <button
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            currentTab === 'tasks' ? 'text-indigo-400 font-semibold' : 'text-gray-400'
          }`}
        >
          <CheckSquare size={20} />
          <span className="text-[10px] mt-1">Tasks</span>
        </button>

        {/* 3. Center Hero Quick Capture (Elevated Floating Action Button) */}
        <button
          onClick={() => onSelectTab('inbox')}
          className="flex flex-col items-center justify-center w-13 h-13 -mt-6 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/40 border-2 border-[#161822] active:scale-95 transition-transform"
          title="Quick Capture & AI Inbox"
        >
          <Sparkles size={22} />
        </button>

        {/* 4. Knowledge Vault */}
        <button
          onClick={() => onSelectTab('knowledge')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            currentTab === 'knowledge' ? 'text-indigo-400 font-semibold' : 'text-gray-400'
          }`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] mt-1">Vault</span>
        </button>

        {/* 5. More Modules Drawer Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center w-14 py-1 relative transition-colors ${
            isMoreActive ? 'text-indigo-400 font-semibold' : 'text-gray-400'
          }`}
        >
          {isMoreActive && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#161822]" />
          )}
          <Grid size={20} />
          <span className="text-[10px] mt-1">Modules</span>
        </button>
      </nav>

      {/* Mobile All-Modules Bottom Sheet Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sheet Container */}
          <div className="relative bg-[#161822] border-t border-[#2e3449] rounded-t-3xl shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom,1rem))] animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-12 h-1.5 rounded-full bg-gray-600/70" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-[#272b3b]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  ॐ
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Om Knowledge OS</h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Smartphone size={10} className="text-indigo-400" />
                    <span>Samsung S25 Ultra AMOLED • 11 Modules</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1f2333] text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Action Bar (Search & Jump + Scan OCR inside drawer) */}
            <div className="px-5 py-2.5 bg-[#12141c] border-b border-[#222638] flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="flex items-center gap-2 text-xs text-indigo-300 hover:text-white bg-[#1c2030] px-3 py-1.5 rounded-xl border border-[#2b3046] flex-1 justify-center"
              >
                <Search size={14} className="text-indigo-400" />
                <span>Search (Ctrl+P)</span>
              </button>
              {onOpenOcr && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenOcr();
                  }}
                  className="flex items-center gap-2 text-xs text-purple-300 hover:text-white bg-[#1c2030] px-3 py-1.5 rounded-xl border border-[#2b3046] flex-1 justify-center"
                >
                  <Camera size={14} className="text-purple-400" />
                  <span>Scan OCR</span>
                </button>
              )}
            </div>

            {/* Scrollable Module Grid */}
            <div className="p-4 overflow-y-auto space-y-4 max-h-[60vh]">
              <div className="grid grid-cols-2 gap-2.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileSelect(item.id as NavTab)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-98 ${
                        isCurrent 
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-[#1b1e2c] border-[#292e42] text-gray-300 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-[#24293d] text-indigo-400'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate leading-tight">{item.label}</span>
                          {item.id === 'sheets' && (conflictCount > 0 || pendingQueueCount > 0) && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                              conflictCount > 0 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {conflictCount > 0 ? `${conflictCount}!` : `${pendingQueueCount}`}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate">{item.category}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Status */}
            <div className="px-5 pt-2 flex items-center justify-between text-[11px] text-gray-500 border-t border-[#222638]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Dexie Local-First DB Active</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">PWA v2.1</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

