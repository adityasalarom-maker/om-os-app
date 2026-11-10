import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  LayoutDashboard,
  FlaskConical,
  FolderKanban, 
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
  ChevronDown,
  FileText, 
  Heart, 
  Mountain,
  Grid,
  X,
  Layers,
  Smartphone,
  Code,
  PenTool,
  Camera,
  TrendingUp,
  Moon,
  Scroll,
  Wind,
  Clock,
  Palette,
  ShieldCheck,
  Pin,
  PinOff
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'tracker' 
  | 'projects' 
  | 'tasks' 
  | 'knowledge' 
  | 'notes' 
  | 'notes_workspace'
  | 'notes_preview'
  | 'notes_pro'
  | 'pdf' 
  | 'research' 
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
  onSwitchToV2?: () => void;
  onOpenTheme?: () => void;
  onOpenDiagnostic?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isCanonicalMode?: boolean;
  onToggleCanonicalMode?: () => void;
  onOpenMobileDeploy?: () => void;
  isAnnotationActive?: boolean;
  onToggleAnnotation?: () => void;
  isMobileOpen?: boolean;
  onToggleMobileOpen?: () => void;
  onCloseMobile?: () => void;
  mobileWidth?: number;
  onMobileWidthChange?: (width: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenOcr,
  onSwitchToV2,
  onOpenTheme,
  onOpenDiagnostic,
  isCollapsed,
  onToggleCollapse,
  isCanonicalMode,
  onToggleCanonicalMode,
  onOpenMobileDeploy,
  isAnnotationActive,
  onToggleAnnotation,
  isMobileOpen,
  onToggleMobileOpen,
  onCloseMobile,
  mobileWidth: propMobileWidth,
  onMobileWidthChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobileDrawerActive = isMobileOpen !== undefined ? isMobileOpen : isMobileMenuOpen;

  const closeMobileDrawer = () => {
    if (onCloseMobile) onCloseMobile();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileDrawer = () => {
    if (onToggleMobileOpen) onToggleMobileOpen();
    else setIsMobileMenuOpen(prev => !prev);
  };

  const [internalMobileWidth, setInternalMobileWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('om_mobile_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 160 && parsed <= 500) return parsed;
      }
    } catch {}
    if (typeof window !== 'undefined') {
      return Math.round(window.innerWidth * 0.60);
    }
    return 240;
  });

  const mobileWidth = propMobileWidth !== undefined ? propMobileWidth : internalMobileWidth;

  const setMobileWidth = (newWidth: number) => {
    if (onMobileWidthChange) onMobileWidthChange(newWidth);
    setInternalMobileWidth(newWidth);
    try {
      localStorage.setItem('om_mobile_sidebar_width', String(newWidth));
    } catch {}
  };
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(mobileWidth);

  // Expandable/Collapsible section headers in mobile vertical drawer
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());
  const [collapsedSubsections, setCollapsedSubsections] = useState<Set<string>>(() => new Set());

  // Collapsible headers in desktop rail
  const [isDesktopModulesCollapsed, setIsDesktopModulesCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('om_sidebar_desktop_modules_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isDesktopSettingsCollapsed, setIsDesktopSettingsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('om_sidebar_desktop_settings_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Pinned section state (persisted across sessions)
  const [pinnedModuleIds, setPinnedModuleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('om_sidebar_pinned_modules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return ['notes_pro', 'tracker', 'dashboard'];
  });

  const [isPinnedSectionCollapsed, setIsPinnedSectionCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('om_sidebar_pinned_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const togglePinModule = (id: string) => {
    setPinnedModuleIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('om_sidebar_pinned_modules', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const togglePinnedSection = () => {
    setIsPinnedSectionCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('om_sidebar_pinned_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleDesktopModules = () => {
    setIsDesktopModulesCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('om_sidebar_desktop_modules_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleDesktopSettings = () => {
    setIsDesktopSettingsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('om_sidebar_desktop_settings_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleSection = (category: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const toggleSubsection = (subId: string) => {
    setCollapsedSubsections(prev => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const startResizing = (clientX: number) => {
    setIsResizing(true);
    resizeStartXRef.current = clientX;
    resizeStartWidthRef.current = mobileWidth;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    } catch {}
  };

  const handleTouchResizeStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) startResizing(touch.clientX);
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    startResizing(e.clientX);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (clientX: number) => {
      const delta = clientX - resizeStartXRef.current;
      const rawWidth = resizeStartWidthRef.current + delta;
      const minAllowed = typeof window !== 'undefined' ? Math.min(180, Math.round(window.innerWidth * 0.35)) : 180;
      const maxAllowed = Math.min(window.innerWidth - 32, 480);
      const clamped = Math.round(Math.max(minAllowed, Math.min(maxAllowed, rawWidth)));
      setMobileWidth(clamped);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX);
    };

    const onEnd = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('om_mobile_sidebar_width', String(mobileWidth));
      } catch {}
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mouseup', onEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mouseup', onEnd);
    };
  }, [isResizing, mobileWidth]);
  const pendingQueueCount = useLiveQuery(() => db.syncQueue.where('status').equals('pending').count(), []) || 0;
  const conflictCount = useLiveQuery(() => db.syncConflicts.toArray(), [])?.filter(c => !c.resolved).length || 0;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      category: 'Core OS'
    },
    {
      id: 'tracker',
      label: 'Daily Life Tracker',
      shortLabel: 'Tracker',
      icon: Clock,
      category: 'Core OS'
    },
    { id: 'projects', label: 'Project Portfolio', shortLabel: 'Projects', icon: FolderKanban, category: 'Core OS' },
    { id: 'tasks', label: 'Task Intelligence', shortLabel: 'Tasks', icon: CheckSquare, category: 'Productivity' },
    { id: 'knowledge', label: 'Knowledge Vault', shortLabel: 'Vault', icon: BookOpen, category: 'Core OS' },
    { id: 'notes', label: 'Notes Studio', shortLabel: 'Notes', icon: FileText, category: 'Core OS' },
    { id: 'notes_workspace', label: 'Notes Workspace', shortLabel: 'Workspace', icon: FileText, category: 'Core OS' },
    { id: 'notes_preview', label: 'Notes Studio Preview', shortLabel: 'Preview', icon: Grid, category: 'Core OS' },
    { id: 'notes_pro', label: 'Notes Studio Pro', shortLabel: 'Studio Pro', icon: Sparkles, category: 'Core OS' },
    { id: 'sovereign_studio', label: 'Sovereign Studio V2', shortLabel: 'Studio', icon: Sparkles, category: 'Core OS' },
    { id: 'pranayama', label: 'Pranayama & Breathwork', shortLabel: 'Prana', icon: Wind, category: 'Metaphysical' },
    { id: 'vedic', label: 'Vedic & Shankara Bhashya', shortLabel: 'Vedic', icon: Scroll, category: 'Metaphysical' },
    { id: 'sadhana', label: 'Dream & Sadhana OS', shortLabel: 'Sadhana', icon: Moon, category: 'Metaphysical' },
    { id: 'jyotish', label: 'Metaphysical & Jyotish', shortLabel: 'Jyotish', icon: Sparkles, category: 'Metaphysical' },
    { id: 'health', label: 'Health & Ayurveda', shortLabel: 'Health', icon: Heart, category: 'Life & Vitality' },
    { id: 'property', label: 'Himalayan Spatial GIS', shortLabel: 'GIS', icon: Mountain, category: 'Asset Diligence' },
    { id: 'pdf', label: 'Reading Library & Knowledge Hub', shortLabel: 'Library', icon: BookOpen, category: 'Study Archive' },
    { id: 'research', label: 'Structured Research Hub', shortLabel: 'Research', icon: FlaskConical, category: 'Study Archive' },
    { id: 'inbox', label: 'Universal Inbox & AI', shortLabel: 'Capture', icon: Inbox, category: 'Input Hub' },
    { id: 'goals', label: 'Goals (Life Pyramid)', shortLabel: 'Goals', icon: Compass, category: 'Life & Vitality' },
    { id: 'journal', label: 'Journal & Reflection', shortLabel: 'Journal', icon: BookHeart, category: 'Life & Vitality' },
    { id: 'analytics', label: 'Predictive Analytics & Radar', shortLabel: 'Analytics', icon: TrendingUp, category: 'Intelligence' },
    { id: 'pantry', label: 'Kitchen & Pantry', shortLabel: 'Pantry', icon: UtensilsCrossed, category: 'Household' },
    { id: 'sheets', label: 'Google Sheets Bridge', shortLabel: 'Sheets', icon: Sheet, category: 'Sync Bridge' },
  ];

  // Secondary tabs that indicate "More" is active when selected
  const isMoreActive = ['health', 'property', 'pdf', 'goals', 'journal', 'pantry', 'sheets', 'analytics', 'jyotish', 'sadhana', 'vedic', 'pranayama', 'sovereign_studio', 'notes_workspace', 'notes_preview', 'notes_pro'].includes(currentTab);

  const handleMobileSelect = (tab: NavTab) => {
    onSelectTab(tab);
    closeMobileDrawer();
  };

  return (
    <>
      {/* Desktop Left Rail Sidebar (Hidden on mobile) */}
      <aside 
        data-ag-id="Sidebar_Navigation_Drawer"
        className={`hidden md:flex flex-col border-r transition-all duration-200 select-none z-20 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
                ॐ
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-wide" style={{ color: 'var(--text-main)' }}>Om Knowledge OS</h1>
                <span className="text-[10px] font-mono tracking-wider font-semibold" style={{ color: 'var(--accent)' }}>v2.0 LOCAL-FIRST</span>
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
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-100 opacity-60"
            style={{ color: 'var(--text-main)' }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Quick Search Button */}
        <div className="p-3">
          <button
            onClick={onOpenSearch}
            className={`w-full flex items-center gap-2 border px-3 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            <div className="flex items-center gap-2">
              <Search size={15} style={{ color: 'var(--accent)' }} />
              {!isCollapsed && <span style={{ color: 'var(--text-main)' }}>Search & Jump...</span>}
            </div>
            {!isCollapsed && (
              <kbd 
                className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-muted)'
                }}
              >
                Ctrl+P
              </kbd>
            )}
          </button>
        </div>

        {/* Pinned Section (Directly Below Search, Collapsible with Full Toggle On/Off) */}
        {pinnedModuleIds.length > 0 && (
          <div data-ag-id="Sidebar_Section_Pinned" className="px-2 mb-1.5 flex flex-col shrink-0">
            <div
              data-ag-id="Sidebar_Header_PinnedSection"
              onClick={togglePinnedSection}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono uppercase tracking-wider font-bold flex items-center justify-between cursor-pointer transition-all select-none hover:opacity-100 ${
                isCollapsed ? 'justify-center px-1' : ''
              }`}
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              title={isPinnedSectionCollapsed ? 'Expand Pinned Modules' : 'Collapse Pinned Modules'}
            >
              {!isCollapsed && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Pin size={13} className="text-amber-500 fill-amber-500/20" />
                  <span className="truncate">Pinned</span>
                  <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>({pinnedModuleIds.length})</span>
                </div>
              )}
              {isCollapsed ? (
                <Pin size={14} className="text-amber-500 fill-amber-500/20" />
              ) : (
                <div className="p-0.5 rounded hover:bg-white/10 transition-colors">
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform duration-200 ${isPinnedSectionCollapsed ? '-rotate-90 opacity-60' : 'opacity-100'}`} 
                  />
                </div>
              )}
            </div>

            {/* Pinned Items Drawer with Smooth Height Transition */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
                isPinnedSectionCollapsed 
                  ? 'max-h-0 opacity-0 pointer-events-none' 
                  : 'max-h-[220px] opacity-100 mt-1'
              }`}
            >
              <div className="space-y-0.5 overflow-y-auto max-h-[200px] pr-0.5">
                {pinnedModuleIds.map((pinnedId) => {
                  const item = navItems.find((n) => n.id === pinnedId);
                  if (!item) return null;
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={`pinned-${item.id}`}
                      data-ag-id={`Sidebar_PinnedItem_${item.id}`}
                      onClick={() => onSelectTab(item.id as NavTab)}
                      className={`w-full group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        isActive ? 'font-semibold shadow-sm' : 'hover:opacity-100 opacity-80'
                      } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--accent)',
                              border: '1px solid var(--accent)',
                              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                            }
                          : {
                              color: 'var(--text-main)',
                              backgroundColor: 'transparent',
                            }
                      }
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={16} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                      {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                      {!isCollapsed && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinModule(item.id);
                          }}
                          className="p-0.5 text-amber-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                          title="Unpin module"
                        >
                          <PinOff size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modules Section Header with Toggle On/Off */}
        <div 
          data-ag-id="Sidebar_Header_ModulesSection"
          onClick={toggleDesktopModules}
          className={`px-3 py-1.5 mx-2 mb-1.5 rounded-lg border text-[11px] font-mono uppercase tracking-wider font-bold flex items-center justify-between cursor-pointer transition-all select-none hover:opacity-100 ${
            isCollapsed ? 'justify-center px-1' : ''
          }`}
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          title={isDesktopModulesCollapsed ? 'Expand Modules' : 'Collapse Modules'}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Grid size={13} style={{ color: 'var(--accent)' }} />
              <span className="truncate">Modules</span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>({navItems.length})</span>
            </div>
          )}
          {isCollapsed ? (
            <Grid size={14} style={{ color: 'var(--accent)' }} />
          ) : (
            <div className="p-0.5 rounded hover:bg-white/10 transition-colors">
              <ChevronDown 
                size={14} 
                className={`transition-transform duration-200 ${isDesktopModulesCollapsed ? '-rotate-90 opacity-60' : 'opacity-100'}`} 
              />
            </div>
          )}
        </div>

        {/* Navigation Items (Smooth glide transition, displays 5+ more modules immediately) */}
        <div 
          className={`transition-all duration-300 ease-in-out flex flex-col min-h-0 overflow-hidden ${
            isDesktopModulesCollapsed 
              ? 'max-h-0 opacity-0 pointer-events-none' 
              : 'flex-1 opacity-100'
          }`}
        >
          <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto min-h-0 py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isPinned = pinnedModuleIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  data-ag-id={`Sidebar_NavItem_${item.id}`}
                  onClick={() => onSelectTab(item.id as NavTab)}
                  className={`w-full group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'font-semibold shadow-sm'
                      : 'hover:opacity-100 opacity-80'
                  } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent)',
                          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)'
                        }
                      : {
                          color: 'var(--text-main)',
                          backgroundColor: 'transparent'
                        }
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon 
                    size={16} 
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} 
                  />
                  {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {!isCollapsed && item.id === 'sheets' && (conflictCount > 0 || pendingQueueCount > 0) && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      conflictCount > 0 
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                        : 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
                    }`}>
                      {conflictCount > 0 ? `${conflictCount}!` : `${pendingQueueCount}`}
                    </span>
                  )}
                  {!isCollapsed && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinModule(item.id);
                      }}
                      className={`p-0.5 rounded transition-opacity cursor-pointer ${
                        isPinned 
                          ? 'text-amber-500 opacity-100 hover:text-amber-400' 
                          : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-200'
                      }`}
                      title={isPinned ? 'Unpin module from top' : 'Pin module to top'}
                    >
                      <Pin size={11} className={isPinned ? 'fill-amber-500/30' : ''} />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dedicated Action Dock: Extra Settings & Tools (Collapsible with Butter-Smooth Relocation) */}
        <div 
          data-ag-id="Sidebar_Section_ExtraSettings"
          className={`p-2 border-t flex flex-col gap-1.5 transition-all duration-300 ease-in-out ${
            isDesktopModulesCollapsed && !isDesktopSettingsCollapsed ? 'flex-1 min-h-0' : 'shrink-0'
          }`}
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        >
          {/* Extra Settings Header with Toggle On/Off */}
          <div 
            data-ag-id="Sidebar_Header_ExtraSettings"
            onClick={toggleDesktopSettings}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono uppercase tracking-wider font-bold flex items-center justify-between cursor-pointer transition-all select-none hover:opacity-100 ${
              isCollapsed ? 'justify-center px-1' : ''
            }`}
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            title={isDesktopSettingsCollapsed ? 'Expand Extra Settings' : 'Collapse Extra Settings'}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Palette size={13} className="text-amber-500" />
                <span className="truncate">Extra Settings</span>
              </div>
            )}
            {isCollapsed ? (
              <Palette size={14} className="text-amber-500" />
            ) : (
              <div className="p-0.5 rounded hover:bg-white/10 transition-colors">
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-200 ${isDesktopSettingsCollapsed ? '-rotate-90 opacity-60' : 'opacity-100'}`} 
                />
              </div>
            )}
          </div>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
              isDesktopSettingsCollapsed
                ? 'max-h-0 opacity-0 pointer-events-none'
                : 'opacity-100'
            } ${
              isDesktopModulesCollapsed && !isDesktopSettingsCollapsed ? 'flex-1 min-h-0' : ''
            }`}
          >
            <div className="flex flex-col gap-1.5 w-full max-h-[35vh] overflow-y-auto pr-0.5">
              {onToggleAnnotation && (
                <button
                  onClick={onToggleAnnotation}
                  data-ag-id="Sidebar_Button_AnnotateToggle"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isAnnotationActive 
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-sm' 
                      : 'hover:opacity-100 opacity-80 border'
                  }`}
                  style={{
                    backgroundColor: isAnnotationActive ? '#f59e0b' : 'var(--bg-secondary)',
                    borderColor: isAnnotationActive ? '#f59e0b' : 'var(--border-color)',
                    color: isAnnotationActive ? '#09090b' : 'var(--text-muted)'
                  }}
                  title="Toggle Dev Visual Annotation Overlay (Ctrl+Shift+A)"
                >
                  <PenTool size={14} className={isAnnotationActive ? 'text-zinc-950' : 'text-amber-500'} />
                  {!isCollapsed && <span>{isAnnotationActive ? '[Annotate: ON]' : '[✏️ Annotate UI]'}</span>}
                </button>
              )}

              {onToggleCanonicalMode && (
                <button
                  onClick={onToggleCanonicalMode}
                  data-ag-id="Sidebar_Button_CanonicalToggle"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isCanonicalMode 
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 ring-1 ring-amber-500/30' 
                      : 'hover:opacity-100 opacity-80 border'
                  }`}
                  style={{
                    backgroundColor: isCanonicalMode ? undefined : 'var(--bg-secondary)',
                    borderColor: isCanonicalMode ? undefined : 'var(--border-color)',
                    color: isCanonicalMode ? undefined : 'var(--text-muted)'
                  }}
                  title="Toggle Visual Canonical UI Naming System (Ctrl+Shift+I)"
                >
                  <Code size={14} className={isCanonicalMode ? 'text-amber-500' : 'text-gray-400'} />
                  {!isCollapsed && <span>{isCanonicalMode ? '[UI: ON]' : '[UI Naming System]'}</span>}
                </button>
              )}

              {onOpenMobileDeploy && (
                <button
                  onClick={onOpenMobileDeploy}
                  data-ag-id="Sidebar_Button_S25Hub"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } hover:opacity-100 opacity-80`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                  title="Mobile & Samsung Galaxy S25 Ultra Deployment Hub"
                >
                  <Smartphone size={14} className="text-cyan-500 shrink-0" />
                  {!isCollapsed && <span>S25 Mobile Hub</span>}
                </button>
              )}

              {/* Separator below Mobile Hub */}
              <div className="h-px my-0.5 opacity-20" style={{ backgroundColor: 'var(--border-color)' }} />

              {/* 1. Version 2: Sovereign Studio Switcher Button */}
              {onSwitchToV2 && (
                <button
                  onClick={onSwitchToV2}
                  data-ag-id="Sidebar_Button_V2Studio"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border-amber-500/30 text-amber-500 dark:text-amber-300 hover:text-amber-600 dark:hover:text-white shadow-sm shrink-0 whitespace-nowrap ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  }`}
                  title="Open Version 2: Sovereign Studio"
                >
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  {!isCollapsed && <span>✦ V2 Studio</span>}
                </button>
              )}

              {/* 2. Multimodal OCR Scanner Button */}
              {onOpenOcr && (
                <button
                  onClick={onOpenOcr}
                  data-ag-id="Sidebar_Button_ScanOcr"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border shadow-sm shrink-0 whitespace-nowrap hover:opacity-100 opacity-80 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  }`}
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  title="Multimodal Document Intelligence: Scan bills, receipts, or Sanskrit text via offline OCR"
                >
                  <Camera size={14} className="text-purple-500 shrink-0" />
                  {!isCollapsed && <span>Scan / OCR</span>}
                </button>
              )}

              {/* 3. Visual Theme Selector Button */}
              {onOpenTheme && (
                <button
                  onClick={onOpenTheme}
                  data-ag-id="Sidebar_Button_ThemeSelector"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border shadow-sm shrink-0 whitespace-nowrap hover:opacity-100 opacity-80 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  }`}
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  title="Change Visual Theme"
                >
                  <Palette size={14} className="text-indigo-500 shrink-0" />
                  {!isCollapsed && <span>Theme</span>}
                </button>
              )}

              {/* 4. Quick Google Sheets Sync Button */}
              <button
                onClick={() => onSelectTab('sheets')}
                data-ag-id="Sidebar_Button_SheetsSync"
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border shrink-0 whitespace-nowrap ${
                  conflictCount > 0 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-500' 
                    : pendingQueueCount > 0 
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-500' 
                    : 'text-emerald-600 dark:text-emerald-400 hover:opacity-100 opacity-80'
                } ${
                  isCollapsed ? 'justify-center' : 'justify-start'
                }`}
                style={{
                  backgroundColor: conflictCount === 0 && pendingQueueCount === 0 ? 'var(--bg-secondary)' : undefined,
                  borderColor: conflictCount === 0 && pendingQueueCount === 0 ? 'var(--border-color)' : undefined
                }}
                title="Google Sheets Live Automation & Cloud Bridge"
              >
                <Sheet size={14} className={conflictCount > 0 ? 'text-amber-500 shrink-0' : pendingQueueCount > 0 ? 'text-cyan-500 shrink-0' : 'text-emerald-500 shrink-0'} />
                {!isCollapsed && (
                  <span className="font-medium flex-1 text-left">
                    {conflictCount > 0 ? `${conflictCount} Conflicts` : pendingQueueCount > 0 ? `${pendingQueueCount} Queued` : 'Sheets'}
                  </span>
                )}
              </button>

              {/* 5. System Diagnostic & E2E Audit Button */}
              {onOpenDiagnostic && (
                <button
                  onClick={onOpenDiagnostic}
                  data-ag-id="Sidebar_Button_DiagnosticAudit"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  }`}
                  title="Run Automated E2E Test Suite & Lighthouse PWA Audit"
                >
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  {!isCollapsed && <span>Audit: 100% Local</span>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        {!isCollapsed && (
          <div 
            className="p-4 border-t text-[11px] flex items-center justify-between"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Offline Ready
            </span>
            <span className="font-mono" style={{ color: 'var(--text-muted)' }}>Win11 & S25</span>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (Optimized for Samsung S25 Ultra 6.8" AMOLED & Thumb Ergonomics) */}
      <nav data-ag-id="Sidebar_Navigation_BottomBar" className="md:hidden fixed bottom-0 left-0 right-0 bg-[#161822]/95 backdrop-blur-md border-t border-[#272b3b] z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] h-[calc(4rem+env(safe-area-inset-bottom,0px))]">
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

        {/* 4. Notes Workspace */}
        <button
          data-ag-id="Nav_Item_NotesStudio"
          onClick={() => onSelectTab('notes')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            currentTab === 'notes' ? 'text-indigo-400 font-semibold' : 'text-gray-400'
          }`}
        >
          <FileText size={20} />
          <span className="text-[10px] mt-1">Notes</span>
        </button>

        {/* 5. More Modules Drawer Trigger */}
        <button
          onClick={toggleMobileDrawer}
          className={`flex flex-col items-center justify-center w-14 py-1 relative transition-colors ${
            isMoreActive || isMobileDrawerActive ? 'text-indigo-400 font-semibold' : 'text-gray-400'
          }`}
        >
          {(isMoreActive || isMobileDrawerActive) && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#161822]" />
          )}
          <Grid size={20} />
          <span className="text-[10px] mt-1">Modules</span>
        </button>
      </nav>

      {/* Mobile Vertical Navigation Sidebar Drawer (with Long-Touch & Drag Width Resizing) */}
      {isMobileDrawerActive && (
        <div 
          data-ag-id="Sidebar_Mobile_DrawerContainer" 
          className="md:hidden fixed inset-0 z-40 flex pointer-events-none select-none"
        >
          {/* Vertical Drawer Sheet Container */}
          <div 
            data-ag-id="Sidebar_Mobile_VerticalDrawer"
            className="relative shadow-2xl h-[100dvh] max-h-[100dvh] flex flex-col select-none border-r animate-in slide-in-from-left duration-150 pointer-events-auto"
            style={{ 
              width: `${mobileWidth}px`, 
              maxWidth: 'calc(100vw - 48px)', 
              minWidth: '180px',
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              transition: isResizing ? 'none' : 'width 150ms ease-out'
            }}
          >
            {/* Right Side Long-Touch & Drag Resize Rail */}
            <div
              data-ag-id="Sidebar_Drawer_ResizeHandle"
              onMouseDown={handleMouseDownResize}
              onTouchStart={handleTouchResizeStart}
              className={`absolute top-0 -right-2 bottom-0 w-4 flex items-center justify-center cursor-ew-resize touch-none z-30 select-none group ${isResizing ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
              title="Touch & drag (or long touch) to resize sidebar width"
            >
              {/* Visual Grab Pill Bar */}
              <div 
                className={`w-1 h-20 rounded-full transition-all duration-150 ${
                  isResizing 
                    ? 'w-1.5 shadow-md scale-y-110' 
                    : 'group-hover:scale-y-105'
                }`} 
                style={{
                  backgroundColor: isResizing ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isResizing ? '0 0 10px var(--accent)' : undefined
                }}
              />
              {/* Live width tooltip indicator while actively dragging (safely inside drawer) */}
              {isResizing && (
                <div 
                  className="absolute top-1/2 right-4 -translate-y-1/2 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold shadow-xl border pointer-events-none whitespace-nowrap animate-in fade-in"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--accent)'
                  }}
                >
                  ↔ {Math.round(mobileWidth)}px
                </div>
              )}
            </div>

            {/* Drawer Header */}
            <div 
              className="px-4 pb-3 pt-[max(1.75rem,env(safe-area-inset-top,1.75rem))] flex items-center justify-between border-b shrink-0"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20 shrink-0">
                  ॐ
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-main)' }}>Om Knowledge OS</h3>
                  <p className="text-[10px] flex items-center gap-1.5 font-mono truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>v2.0</span>
                    <span>•</span>
                    <span>S25 AMOLED</span>
                    <span>•</span>
                    <span>{Math.round(mobileWidth)}px</span>
                  </p>
                </div>
              </div>
              <button 
                data-ag-id="Sidebar_Mobile_Button_Close"
                onClick={closeMobileDrawer}
                className="w-9 h-9 rounded-xl flex items-center justify-center border active:scale-95 transition-all shrink-0 cursor-pointer"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                title="Close Sidebar"
                aria-label="Close Sidebar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Search & OCR Action Bar */}
            <div 
              className="px-3 py-2 border-b flex items-center gap-2 shrink-0"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
            >
              <button
                onClick={() => {
                  closeMobileDrawer();
                  onOpenSearch();
                }}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border flex-1 justify-center active:scale-98 transition-all min-h-[40px]"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                <Search size={14} style={{ color: 'var(--accent)' }} className="shrink-0" />
                <span className="truncate">Search (Ctrl+P)</span>
              </button>
              {onOpenOcr && (
                <button
                  onClick={() => {
                    closeMobileDrawer();
                    onOpenOcr();
                  }}
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border flex-1 justify-center active:scale-98 transition-all min-h-[40px]"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <Camera size={14} style={{ color: 'var(--accent)' }} className="shrink-0" />
                  <span className="truncate">Scan OCR</span>
                </button>
              )}
            </div>

            {/* Scrollable Navigation List with Adaptive Responsive Wrapping & Collapsible Sections/Subsections */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 min-h-0">
              {/* Mobile Pinned Modules Strip */}
              {pinnedModuleIds.length > 0 && (
                <div data-ag-id="Sidebar_Mobile_Section_Pinned" className="space-y-1 mb-2">
                  <div 
                    onClick={togglePinnedSection}
                    className="px-2 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider font-bold flex items-center justify-between cursor-pointer transition-all select-none"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Pin size={12} className="text-amber-500 fill-amber-500/20" />
                      <span className="truncate">Pinned Modules</span>
                      <span className="text-[9px] font-normal" style={{ color: 'var(--text-muted)' }}>({pinnedModuleIds.length})</span>
                    </div>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${isPinnedSectionCollapsed ? '-rotate-90 opacity-60' : 'opacity-100'}`} />
                  </div>
                  {!isPinnedSectionCollapsed && (
                    <div className="grid grid-cols-1 gap-1">
                      {pinnedModuleIds.map(pId => {
                        const it = navItems.find(n => n.id === pId);
                        if (!it) return null;
                        const Icon = it.icon;
                        const isCurrent = currentTab === it.id;
                        return (
                          <button
                            key={`mob-pin-${it.id}`}
                            onClick={() => handleMobileSelect(it.id as NavTab)}
                            className="flex items-center gap-2 p-2 rounded-xl border text-left transition-all active:scale-98 min-h-[44px]"
                            style={{
                              backgroundColor: isCurrent ? 'var(--bg-card)' : 'var(--bg-primary)',
                              borderColor: isCurrent ? 'var(--accent)' : 'var(--border-color)',
                              color: isCurrent ? 'var(--text-main)' : 'var(--text-muted)',
                            }}
                          >
                            <Icon size={16} className="text-amber-500 shrink-0" />
                            <span className="text-xs font-semibold truncate flex-1">{it.label}</span>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinModule(it.id);
                              }}
                              className="p-1 text-amber-500 hover:text-rose-400"
                              title="Unpin"
                            >
                              <PinOff size={11} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {['Core OS', 'Metaphysical', 'Life & Vitality', 'Study Archive', 'Input Hub', 'Sync Bridge', 'Intelligence', 'Asset Diligence', 'Household', 'Productivity'].map(category => {
                const categoryItems = navItems.filter(item => item.category === category);
                if (!categoryItems.length) return null;

                const isSectionCollapsed = collapsedSections.has(category);

                // Subsections categorization
                let primaryItems = categoryItems;
                let subGroup: { id: string; label: string; icon: any; items: typeof categoryItems } | null = null;

                if (category === 'Core OS') {
                  const notesIds = ['notes', 'notes_workspace', 'notes_preview', 'notes_pro', 'sovereign_studio'];
                  primaryItems = categoryItems.filter(it => !notesIds.includes(it.id));
                  const notesItems = categoryItems.filter(it => notesIds.includes(it.id));
                  if (notesItems.length > 0) {
                    subGroup = {
                      id: 'core_notes_suite',
                      label: 'Notes & Studio Suite',
                      icon: Sparkles,
                      items: notesItems,
                    };
                  }
                } else if (category === 'Metaphysical') {
                  const subIds = ['sadhana', 'jyotish'];
                  primaryItems = categoryItems.filter(it => !subIds.includes(it.id));
                  const subItems = categoryItems.filter(it => subIds.includes(it.id));
                  if (subItems.length > 0) {
                    subGroup = {
                      id: 'meta_jyotish_stream',
                      label: 'Jyotish & Sadhana Stream',
                      icon: Moon,
                      items: subItems,
                    };
                  }
                } else if (category === 'Life & Vitality') {
                  const subIds = ['goals', 'journal'];
                  primaryItems = categoryItems.filter(it => !subIds.includes(it.id));
                  const subItems = categoryItems.filter(it => subIds.includes(it.id));
                  if (subItems.length > 0) {
                    subGroup = {
                      id: 'life_mind_stream',
                      label: 'Mind & Reflection Stream',
                      icon: BookHeart,
                      items: subItems,
                    };
                  }
                }

                const isSubCollapsed = subGroup ? collapsedSubsections.has(subGroup.id) : false;

                const renderItemBtn = (item: (typeof categoryItems)[0]) => {
                  const Icon = item.icon;
                  const isCurrent = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      data-ag-id={`Nav_Item_${item.id}`}
                      onClick={() => handleMobileSelect(item.id as NavTab)}
                      className="flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all active:scale-98 min-h-[48px]"
                      style={{
                        backgroundColor: isCurrent ? 'var(--bg-card)' : 'var(--bg-primary)',
                        borderColor: isCurrent ? 'var(--accent)' : 'var(--border-color)',
                        color: isCurrent ? 'var(--text-main)' : 'var(--text-muted)',
                        boxShadow: isCurrent ? '0 0 12px rgba(99,102,241,0.15)' : undefined,
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)',
                          color: isCurrent ? '#ffffff' : 'var(--accent)'
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold truncate leading-tight" style={{ color: isCurrent ? 'var(--text-main)' : 'var(--text-muted)' }}>{item.label}</span>
                          {item.id === 'sheets' && (conflictCount > 0 || pendingQueueCount > 0) && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {conflictCount > 0 ? `${conflictCount}!` : `${pendingQueueCount}`}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.shortLabel}</div>
                      </div>
                    </button>
                  );
                };

                return (
                  <div key={category} className="space-y-1">
                    {/* Section Heading with Single Toggle Button */}
                    <div 
                      data-ag-id={`Sidebar_SectionHeader_${category.replace(/\s+/g, '')}`}
                      onClick={() => toggleSection(category)}
                      className="px-2 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider font-bold flex items-center justify-between cursor-pointer transition-all select-none"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{category}</span>
                        <span className="text-[9px] font-normal" style={{ color: 'var(--text-muted)' }}>({categoryItems.length})</span>
                      </div>
                      <button
                        type="button"
                        data-ag-id={`Sidebar_Button_Toggle_${category.replace(/\s+/g, '')}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection(category);
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer"
                        style={{ color: 'var(--accent)' }}
                        title={isSectionCollapsed ? `Expand ${category}` : `Collapse ${category}`}
                        aria-label={isSectionCollapsed ? `Expand ${category}` : `Collapse ${category}`}
                      >
                        <ChevronDown 
                          size={13} 
                          className={`transition-transform duration-200 ${isSectionCollapsed ? '-rotate-90 opacity-60' : 'opacity-100'}`} 
                        />
                      </button>
                    </div>

                    {/* Section Body */}
                    {!isSectionCollapsed && (
                      <div className="space-y-1.5 pt-0.5">
                        {/* Primary Items Grid */}
                        {primaryItems.length > 0 && (
                          <div className={`grid ${mobileWidth >= 340 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                            {primaryItems.map(renderItemBtn)}
                          </div>
                        )}

                        {/* Hierarchical Subsections with Single Toggle Button */}
                        {subGroup && (
                          <div className="space-y-1 pt-1 pl-1 border-l-2 ml-1" style={{ borderColor: 'var(--accent)' }}>
                            <div
                              data-ag-id={`Sidebar_SubSectionHeader_${subGroup.id}`}
                              onClick={() => toggleSubsection(subGroup!.id)}
                              className="px-2 py-1 rounded border text-[9.5px] font-mono uppercase tracking-wider font-semibold flex items-center justify-between cursor-pointer transition-all select-none"
                              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <subGroup.icon size={11} style={{ color: 'var(--accent)' }} className="shrink-0" />
                                <span className="truncate">{subGroup.label}</span>
                                <span className="text-[8.5px] font-normal" style={{ color: 'var(--text-muted)' }}>({subGroup.items.length})</span>
                              </div>
                              <button
                                type="button"
                                data-ag-id={`Sidebar_Button_Toggle_${subGroup.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSubsection(subGroup!.id);
                                }}
                                className="w-5 h-5 rounded flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer"
                                style={{ color: 'var(--accent)' }}
                                title={isSubCollapsed ? `Expand ${subGroup.label}` : `Collapse ${subGroup.label}`}
                                aria-label={isSubCollapsed ? `Expand ${subGroup.label}` : `Collapse ${subGroup.label}`}
                              >
                                <ChevronDown 
                                  size={11} 
                                  className={`transition-transform duration-200 ${isSubCollapsed ? '-rotate-90 opacity-60' : 'opacity-100'}`} 
                                />
                              </button>
                            </div>

                            {!isSubCollapsed && (
                              <div className={`grid ${mobileWidth >= 340 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 pt-0.5`}>
                                {subGroup.items.map(renderItemBtn)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Quick Tools & S25 Mobile Hub Trigger */}
            <div 
              className="p-3 border-t space-y-2 shrink-0"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-2">
                {onOpenMobileDeploy && (
                  <button
                    onClick={() => {
                      closeMobileDrawer();
                      onOpenMobileDeploy();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold active:scale-98 transition-all min-h-[42px]"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                  >
                    <Smartphone size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="truncate">S25 Hub</span>
                  </button>
                )}
                {onToggleAnnotation && (
                  <button
                    onClick={() => {
                      closeMobileDrawer();
                      onToggleAnnotation();
                    }}
                    data-ag-id="Sidebar_Mobile_Button_AnnotateToggle"
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold active:scale-98 transition-all min-h-[42px] ${
                      isAnnotationActive ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: isAnnotationActive ? '#f59e0b' : 'var(--bg-secondary)',
                      borderColor: isAnnotationActive ? '#f59e0b' : 'var(--border-color)',
                      color: isAnnotationActive ? '#09090b' : 'var(--accent)',
                    }}
                    title="Toggle Visual UI Annotation Overlay"
                  >
                    <PenTool size={13} className={isAnnotationActive ? 'text-zinc-950' : 'text-amber-500'} />
                    <span className="font-mono text-[10px]">{isAnnotationActive ? 'ANN: ON' : 'Annotate'}</span>
                  </button>
                )}
                {onToggleCanonicalMode && (
                  <button
                    onClick={onToggleCanonicalMode}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold active:scale-98 transition-all min-h-[42px]"
                    style={{ 
                      backgroundColor: isCanonicalMode ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)', 
                      borderColor: isCanonicalMode ? '#f59e0b' : 'var(--border-color)', 
                      color: isCanonicalMode ? '#fbbf24' : 'var(--text-muted)' 
                    }}
                    title="Toggle Developer Canonical IDs"
                  >
                    <Code size={13} />
                    <span className="font-mono text-[10px]">{isCanonicalMode ? 'UI: ON' : 'UI'}</span>
                  </button>
                )}
              </div>

              {/* Status & Resize Guidance Hint */}
              <div className="flex items-center justify-between text-[10px] pt-1" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Dexie Local-First</span>
                </span>
                <span className="italic" style={{ color: 'var(--text-muted)' }}>↔ Drag right edge to resize</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

