import React, { useState, useEffect } from 'react';
import { Sidebar, type NavTab } from './components/Sidebar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { TaskIntelligence } from './components/TaskIntelligence';
import { KnowledgeVault } from './components/KnowledgeVault';
import { NotesWorkspace } from './components/NotesWorkspace';
import { NotesStudioPreviewView } from './components/NotesStudioPreviewView';
import { NotesStudioProView } from './components/NotesStudioProView';
import { UniversalInboxAI } from './components/UniversalInboxAI';
import { GoalsPyramid } from './components/GoalsPyramid';
import { JournalView } from './components/JournalView';
import { PantryView } from './components/PantryView';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { HealthTracker } from './components/HealthTracker';
import { PropertyTracker } from './components/PropertyTracker';
import { CommandPalette } from './components/CommandPalette';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { AnalyticsView } from './components/AnalyticsView';
import { DiagnosticTestModal } from './components/DiagnosticTestModal';
import { MobileDeploymentModal } from './components/MobileDeploymentModal';
import { JyotishView } from './components/JyotishView';
// Code-split secondary views
const DreamSadhanaView = React.lazy(() => import('./components/DreamSadhanaView').then(m => ({ default: m.DreamSadhanaView })));
const VedicConcordanceView = React.lazy(() => import('./components/VedicConcordanceView').then(m => ({ default: m.VedicConcordanceView })));
const PranayamaView = React.lazy(() => import('./components/PranayamaView').then(m => ({ default: m.PranayamaView })));
const SovereignStudioV2 = React.lazy(() => import('./components/SovereignStudioV2').then(m => ({ default: m.SovereignStudioV2 })));
import { DailyTrackerView } from './components/tracker/DailyTrackerView';

// Code-split heavy libraries (pdfjs-dist, tesseract.js)
const PdfReaderView = React.lazy(() => import('./components/pdf/PdfReaderView').then(m => ({ default: m.PdfReaderView })));
const ResearchHubView = React.lazy(() => import('./components/ResearchHubView').then(m => ({ default: m.ResearchHubView })));
const ProjectPortfolioView = React.lazy(() => import('./components/ProjectPortfolioView').then(m => ({ default: m.ProjectPortfolioView })));
const DocumentIntelligenceModal = React.lazy(() => import('./components/DocumentIntelligenceModal').then(m => ({ default: m.DocumentIntelligenceModal })));
const NotesStudioView = React.lazy(() => import('./components/notes/NotesStudioView').then(m => ({ default: m.NotesStudioView })));
import { db, initializeSeedDataIfEmpty } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { initializeThemeOnStartup, getStoredThemeId, restoreThemeFromDbIfAvailable } from './services/themeEngine';
import { Search, LassoSelect } from 'lucide-react';
import { DevAnnotationOverlay } from './components/dev/DevAnnotationOverlay';
import { AnnotationDeckModal } from './components/dev/AnnotationDeckModal';
import { sleepWakeEngine, type SleepWakeStatusDetail } from './services/sleepWakeEngine';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view');
    return requestedView === 'notes-pro' ? 'notes_pro' : requestedView === 'notes-preview' ? 'notes_preview' : requestedView === 'notes-workspace' ? 'notes_workspace' : requestedView === 'notes' ? 'notes' : 'dashboard';
  });
  const [hasOpenedNotesPro, setHasOpenedNotesPro] = useState(() => new URLSearchParams(window.location.search).get('view') === 'notes-pro');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isMobileDeployOpen, setIsMobileDeployOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileSidebarWidth, setMobileSidebarWidth] = useState<number>(() => {
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
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isAnnotationActive, setIsAnnotationActive] = useState(false);
  const [isAnnotationDeckOpen, setIsAnnotationDeckOpen] = useState(false);
  const [annotationTool, setAnnotationTool] = useState<'element' | 'region'>('element');
  const [isAnnotateHovered, setIsAnnotateHovered] = useState(false);
  const hoverTimeoutRef = React.useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCanonicalMode, setIsCanonicalMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('om_os_canonical_names') === 'true';
    } catch {
      return false;
    }
  });

  const [wakeStatus, setWakeStatus] = useState<SleepWakeStatusDetail | null>(null);

  useEffect(() => {
    // Listen for Sleep & Wake events from sleepWakeEngine
    const handleStatus = (e: Event) => {
      const detail = (e as CustomEvent<SleepWakeStatusDetail>).detail;
      setWakeStatus(detail);
      if (detail?.status === 'success') {
        const timer = setTimeout(() => setWakeStatus(null), 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('om-sleep-wake-status', handleStatus);
    return () => window.removeEventListener('om-sleep-wake-status', handleStatus);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentTab === 'notes_pro') url.searchParams.set('view', 'notes-pro');
    else if (currentTab === 'notes_preview') url.searchParams.set('view', 'notes-preview');
    else if (currentTab === 'notes_workspace') url.searchParams.set('view', 'notes-workspace');
    else if (currentTab === 'notes') url.searchParams.set('view', 'notes');
    else if (['notes', 'notes-workspace', 'notes-preview', 'notes-pro'].includes(url.searchParams.get('view') || '')) url.searchParams.delete('view');
    window.history.replaceState(window.history.state, '', url);
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === 'notes_pro') setHasOpenedNotesPro(true);
  }, [currentTab]);

  useEffect(() => {
    if (isCanonicalMode) {
      document.documentElement.classList.add('dev-canonical-mode');
      document.body.classList.add('dev-canonical-mode');
    } else {
      document.documentElement.classList.remove('dev-canonical-mode');
      document.body.classList.remove('dev-canonical-mode');
    }
  }, [isCanonicalMode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        setIsCanonicalMode(prev => {
          const next = !prev;
          try { localStorage.setItem('om_os_canonical_names', String(next)); } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Dual-Version Operating Support: Version 1 (Technical Cockpit) vs Version 2 (Sovereign Studio)
  const [osVersion, setOsVersion] = useState<'v1' | 'v2'>(() => {
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('v2')) {
      return 'v2';
    }
    return 'v1';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.toLowerCase().includes('v2')) {
        setOsVersion('v2');
      } else {
        setOsVersion('v1');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const switchOsVersion = (ver: 'v1' | 'v2') => {
    setOsVersion(ver);
    window.location.hash = `#/${ver}`;
  };

  const pendingQueueCount = useLiveQuery(() => db.syncQueue.where('status').equals('pending').count(), []) || 0;
  const conflictCount = useLiveQuery(() => db.syncConflicts.toArray(), [])?.filter(c => !c.resolved).length || 0;

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => getStoredThemeId());

  useEffect(() => {
    const initialTheme = initializeThemeOnStartup();
    setCurrentThemeId(initialTheme.id);

    // If IndexedDB holds a persistent theme preference, reconcile seamlessly
    restoreThemeFromDbIfAvailable().then((restored) => {
      if (restored) {
        setCurrentThemeId(restored.id);
      }
    });

    const onThemeChanged = (e: any) => {
      if (e.detail?.id) setCurrentThemeId(e.detail.id);
    };
    window.addEventListener('om-theme-changed', onThemeChanged);

    initializeSeedDataIfEmpty().then(() => {
      setIsReady(true);
    });

    return () => window.removeEventListener('om-theme-changed', onThemeChanged);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3" style={{ backgroundColor: 'var(--bg-primary, #0f1117)', color: 'var(--text-main, #f3f4f6)' }}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold shadow-xl shadow-indigo-500/30 animate-pulse">
          ॐ
        </div>
        <p className="text-sm font-semibold tracking-wide">Initializing Om Knowledge OS...</p>
        <p className="text-xs text-gray-500 font-mono">Loading local-first encrypted tables</p>
      </div>
    );
  }

  // Render Version 2 Sovereign Studio if v2 route is active
  if (osVersion === 'v2') {
    return <SovereignStudioV2 onSwitchToV1={() => switchOsVersion('v1')} />;
  }

  return (
    <div data-ag-id="App_Root_Shell" className="app-shell flex w-screen overflow-hidden font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenOcr={() => setIsOcrOpen(true)}
        onSwitchToV2={() => switchOsVersion('v2')}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCanonicalMode={isCanonicalMode}
        onToggleCanonicalMode={() => setIsCanonicalMode(prev => {
          const next = !prev;
          try { localStorage.setItem('om_os_canonical_names', String(next)); } catch {}
          return next;
        })}
        onOpenMobileDeploy={() => setIsMobileDeployOpen(true)}
        isAnnotationActive={isAnnotationActive}
        onToggleAnnotation={() => setIsAnnotationActive(prev => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onToggleMobileOpen={() => setIsMobileSidebarOpen(prev => !prev)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        mobileWidth={mobileSidebarWidth}
        onMobileWidthChange={setMobileSidebarWidth}
      />

      {/* Main App Workspace (Side-by-Side dynamically responsive with Mobile Sidebar) */}
      <div 
        className="flex-1 flex flex-col min-w-0 overflow-hidden transition-[margin,width] duration-150 ease-out"
        style={{
          marginLeft: isMobileSidebarOpen && isMobileScreen ? `${mobileSidebarWidth}px` : undefined,
          width: isMobileSidebarOpen && isMobileScreen ? `calc(100vw - ${mobileSidebarWidth}px)` : undefined,
        }}
      >
        
        {/* Top Header Bar */}
        <header data-ag-id="App_Header_GlobalToolbar" className="h-16 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-10 shrink-0 border-b transition-colors gap-3 overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {/* Header Title Section with Zero Overlap */}
          <div className="flex items-center gap-2.5 min-w-0 max-w-md lg:max-w-xl shrink">
            <button
              type="button"
              data-ag-id="App_Header_Button_MobileSidebarToggle"
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="flex items-center justify-center min-w-[38px] min-h-[38px] sm:min-w-[48px] sm:min-h-[48px] p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 border border-indigo-500/30 transition-all cursor-pointer group shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              title="Toggle Om OS Navigation Sidebar"
              aria-label="Toggle Om OS Navigation Sidebar"
            >
              <span className="text-indigo-400 group-hover:text-indigo-300 font-bold text-lg select-none shrink-0 font-sans leading-none">{`\u0950`}</span>
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight truncate whitespace-nowrap capitalize m-0 select-none" style={{ color: 'var(--text-main)' }}>
                  {currentTab === 'tracker' ? 'Daily Life Tracker' :
                   currentTab === 'inbox' ? 'Universal Inbox & AI' : 
                   currentTab === 'sheets' ? 'Google Sheets Bridge' : 
                   currentTab === 'notes' ? 'Notes Studio' :
                   currentTab === 'notes_workspace' ? 'Notes Workspace' :
                   currentTab === 'notes_preview' ? 'Notes Studio (Integration Preview)' :
                   currentTab === 'notes_pro' ? 'Notes Studio Pro' :
                   currentTab === 'analytics' ? 'Predictive Analytics' : 
                   currentTab === 'jyotish' ? 'Metaphysical & Jyotish' : 
                   currentTab === 'sadhana' ? 'Dream & Sadhana OS' : 
                   currentTab === 'vedic' ? 'Vedic Concordance' : 
                   currentTab === 'pranayama' ? 'Pr\u0101\u1e47\u0101y\u0101ma Engine' : 
                   currentTab === 'research' ? 'Research Hub' : 
                   currentTab === 'pdf' ? 'Knowledge Library' : currentTab.replace('-', ' ')}
                </h1>
                {currentTab === 'notes_pro' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-300 bg-amber-500/10 font-medium whitespace-nowrap shrink-0">
                    Live Editing · Drag Resizing (⋮) · Multi-Layout
                  </span>
                )}
              </div>
              {currentTab === 'notes_pro' && (
                <span className="text-[10px] text-gray-400 font-normal truncate -mt-0.5">
                  Upgraded Sovereign Engine · 100% Offline-First
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto no-scrollbar py-1 ml-auto">
            {/* Quick search button for desktop */}
            <button
              onClick={() => setIsSearchOpen(true)}
              data-ag-id="App_Header_Button_QuickSearch"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors border shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              title="Global Search & Note Navigator (Ctrl+P)"
            >
              <Search size={13} className="text-indigo-400 shrink-0" />
              <span className="hidden xl:inline text-xs">Search</span>
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>Ctrl+P</kbd>
            </button>

            {/* Dev Visual Annotation Lasso Button (40% Width Icon-Only Button with Hover Trigger) */}
            <button
              onClick={() => {
                setIsAnnotationActive((prev) => {
                  const next = !prev;
                  if (next) setIsAnnotateHovered(true);
                  return next;
                });
              }}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                setIsAnnotateHovered(true);
              }}
              onMouseLeave={() => {
                hoverTimeoutRef.current = window.setTimeout(() => setIsAnnotateHovered(false), 300);
              }}
              data-ag-id="App_Header_Button_VisualAnnotate"
              className={`w-9 h-9 flex items-center justify-center p-0 rounded-xl border transition-all cursor-pointer shrink-0 shadow-sm ${
                isAnnotationActive
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                  : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: isAnnotationActive ? '#f59e0b' : 'var(--bg-card)',
                borderColor: isAnnotationActive ? '#f59e0b' : 'var(--border-color)',
                color: isAnnotationActive ? '#09090b' : 'var(--text-main)',
              }}
              title={isAnnotationActive ? 'Exit Annotation Mode (Esc)' : 'Visual Annotate UI (Ctrl+Shift+A)'}
            >
              <LassoSelect size={16} className={isAnnotationActive ? 'text-zinc-950 animate-pulse' : 'text-amber-500'} />
            </button>
          </div>
        </header>

        {/* Sleep & Wake Automatic Reconnect Banner */}
        {wakeStatus && (
          <div 
            data-ag-id="App_Banner_SleepWakeStatus"
            className={`px-4 py-1.5 text-xs font-mono font-medium flex items-center justify-between border-b z-50 transition-all ${
              wakeStatus.status === 'success' 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
                : wakeStatus.status === 'warning'
                ? 'bg-amber-950 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{wakeStatus.message}</span>
            </div>
            <button 
              type="button"
              onClick={() => window.location.reload()}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] uppercase font-bold cursor-pointer"
            >
              Force Reload
            </button>
          </div>
        )}

        {/* Scrollable Content View */}
        <main 
          data-ag-id="App_Main_Workspace" 
          className={
            currentTab === 'notes' || currentTab === 'notes_workspace' || currentTab === 'notes_preview' || currentTab === 'notes_pro'
              ? 'flex-1 overflow-hidden p-0 m-0 w-full h-[calc(100dvh-4rem)] flex flex-col' 
              : 'flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8'
          }
        >
          <div className={currentTab === 'notes' || currentTab === 'notes_workspace' || currentTab === 'notes_preview' || currentTab === 'notes_pro' ? 'w-full h-full flex flex-col' : 'max-w-7xl mx-auto'}>
            {currentTab === 'dashboard' && (
              <ExecutiveDashboard 
                onNavigate={setCurrentTab} 
                onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
                onOpenMobileDeploy={() => setIsMobileDeployOpen(true)}
              />
            )}
            {currentTab === 'tracker' && <DailyTrackerView />}
            {currentTab === 'tasks' && <TaskIntelligence />}
            {currentTab === 'projects' && (
              <React.Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Project Portfolio & Roadmaps...</div>}>
                <ProjectPortfolioView 
                  onNavigateToTasks={(projId) => setCurrentTab('tasks')}
                  onNavigateToGoals={() => setCurrentTab('goals')}
                />
              </React.Suspense>
            )}
            {currentTab === 'knowledge' && <KnowledgeVault />}
            {currentTab === 'notes' && (
              <React.Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Notes Studio...</div>}>
                <NotesStudioView />
              </React.Suspense>
            )}
            {currentTab === 'notes_workspace' && <NotesWorkspace />}
            {currentTab === 'notes_preview' && <NotesStudioPreviewView />}
            <div className={currentTab === 'notes_pro' ? 'w-full h-full flex flex-col' : 'hidden'} aria-hidden={currentTab !== 'notes_pro'}>
              {hasOpenedNotesPro && <NotesStudioProView />}
            </div>
            {currentTab === 'health' && <HealthTracker />}
            {currentTab === 'property' && <PropertyTracker />}
            {currentTab === 'pdf' && (
              <React.Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Reading Library & Knowledge Hub...</div>}>
                <PdfReaderView />
              </React.Suspense>
            )}
            {currentTab === 'research' && (
              <React.Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Structured Research Hub...</div>}>
                <ResearchHubView />
              </React.Suspense>
            )}
            {currentTab === 'inbox' && <UniversalInboxAI />}
            {currentTab === 'goals' && <GoalsPyramid />}
            {currentTab === 'journal' && <JournalView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'pantry' && <PantryView />}
            {currentTab === 'sheets' && <GoogleSheetsSyncModal />}
            {currentTab === 'jyotish' && <JyotishView />}
            <React.Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Module...</div>}>
              {currentTab === 'sadhana' && <DreamSadhanaView />}
              {currentTab === 'vedic' && <VedicConcordanceView />}
              {currentTab === 'pranayama' && <PranayamaView />}
              {currentTab === 'sovereign_studio' && (
                <SovereignStudioV2 
                  onSwitchToV1={() => switchOsVersion('v1')} 
                  embedded={true} 
                />
              )}
            </React.Suspense>
          </div>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+P) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentTab}
        onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
        onOpenMobileDeploy={() => setIsMobileDeployOpen(true)}
      />

      {/* Universal Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

      {/* Multimodal Document Intelligence & OCR Modal */}
      {isOcrOpen && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center text-white text-xs">Loading OCR Engine...</div>}>
          <DocumentIntelligenceModal
            isOpen={isOcrOpen}
            onClose={() => setIsOcrOpen(false)}
            onSavedToVault={() => {
              setIsOcrOpen(false);
              setCurrentTab('knowledge');
            }}
          />
        </React.Suspense>
      )}
      {/* Comprehensive E2E Diagnostic & Lighthouse PWA Audit Modal */}
      <DiagnosticTestModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />

      {/* Dev Visual Annotation Overlay & Deck Modal */}
      <DevAnnotationOverlay
        isActive={isAnnotationActive}
        onToggleActive={(val) => setIsAnnotationActive(typeof val === 'boolean' ? val : (prev) => !prev)}
        onToggleDeck={() => setIsAnnotationDeckOpen((prev) => !prev)}
        isDeckOpen={isAnnotationDeckOpen}
        tool={annotationTool}
        onToolChange={setAnnotationTool}
        isHovered={isAnnotateHovered}
        onHoverChange={(hovered) => {
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          if (hovered) {
            setIsAnnotateHovered(true);
          } else {
            hoverTimeoutRef.current = window.setTimeout(() => setIsAnnotateHovered(false), 300);
          }
        }}
        isSidebarOpen={isMobileSidebarOpen}
        onRequestOpenSidebar={() => setIsMobileSidebarOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />
      <AnnotationDeckModal
        isOpen={isAnnotationDeckOpen}
        onClose={() => setIsAnnotationDeckOpen(false)}
      />

      {/* Mobile & Samsung S25 Ultra Deployment Modal */}
      <MobileDeploymentModal
        isOpen={isMobileDeployOpen}
        onClose={() => setIsMobileDeployOpen(false)}
      />
    </div>
  );
}

export default App;

