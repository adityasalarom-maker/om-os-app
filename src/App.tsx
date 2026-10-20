import React, { useState, useEffect } from 'react';
import { Sidebar, type NavTab } from './components/Sidebar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { TaskIntelligence } from './components/TaskIntelligence';
import { KnowledgeVault } from './components/KnowledgeVault';
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
import { DreamSadhanaView } from './components/DreamSadhanaView';
import { VedicConcordanceView } from './components/VedicConcordanceView';
import { PranayamaView } from './components/PranayamaView';
import { SovereignStudioV2 } from './components/SovereignStudioV2';

// Code-split heavy libraries (pdfjs-dist, tesseract.js)
const PdfReaderView = React.lazy(() => import('./components/pdf/PdfReaderView').then(m => ({ default: m.PdfReaderView })));
const ResearchHubView = React.lazy(() => import('./components/ResearchHubView').then(m => ({ default: m.ResearchHubView })));
const DocumentIntelligenceModal = React.lazy(() => import('./components/DocumentIntelligenceModal').then(m => ({ default: m.DocumentIntelligenceModal })));
import { db, initializeSeedDataIfEmpty } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { initializeThemeOnStartup } from './services/themeEngine';
import { Search, Sparkles, Bell, Shield, Smartphone, Palette, Camera, Sheet, ShieldCheck } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isMobileDeployOpen, setIsMobileDeployOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

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

  useEffect(() => {
    // Initialize user's persisted visual theme
    initializeThemeOnStartup();

    // Seed initial database records from Om Knowledge OS v2.0
    initializeSeedDataIfEmpty().then(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center text-white space-y-3">
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1117] text-gray-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenOcr={() => setIsOcrOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-[#161822]/80 backdrop-blur-md border-b border-[#272b3b] px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400">à¥</span>
              <span className="capitalize">
                {currentTab === 'inbox' ? 'Universal Inbox & AI' : 
                 currentTab === 'sheets' ? 'Google Sheets Bridge' : 
                 currentTab === 'analytics' ? 'Predictive Analytics & Life Balance' : 
                 currentTab === 'jyotish' ? 'Metaphysical & Jyotish Ephemeris' : 
                 currentTab === 'sadhana' ? 'Metaphysical Dream & Sadhana OS' : 
                 currentTab === 'vedic' ? 'Vedic & Shankara Bhashya Concordance' : 
                 currentTab === 'pranayama' ? 'Prāṇāyāma & Bio-Energy Engine' : 
                 currentTab === 'research' ? 'Structured Research Hub & Evidence Pipeline' : currentTab === 'pdf' ? 'Reading Library & Knowledge Hub' : currentTab.replace('-', ' ')}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick search button for desktop */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-[#1c2030] hover:bg-[#23283c] border border-[#2d3246] text-gray-400 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              <Search size={14} className="text-indigo-400" />
              <span>Jump to note or task...</span>
              <kbd className="bg-[#141622] px-1 py-0.5 rounded text-[10px] font-mono border border-[#272b3d]">Ctrl+P</kbd>
            </button>

            {/* Version 2: Sovereign Studio Switcher Button */}
            <button
              onClick={() => switchOsVersion('v2')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 text-amber-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Open Version 2: Sovereign Studio (Grounded in your authentic Notion OS & My Notes archives)"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>✦ V2: Sovereign Studio</span>
            </button>

            {/* Multimodal OCR Scanner Button */}
            <button
              onClick={() => setIsOcrOpen(true)}
              className="flex items-center gap-1.5 bg-[#1c2030] hover:bg-[#23283c] border border-[#2d3246] text-purple-300 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
              title="Multimodal Document Intelligence: Scan bills, receipts, or Sanskrit text via offline OCR"
            >
              <Camera size={14} className="text-purple-400" />
              <span className="hidden sm:inline">Scan / OCR</span>
            </button>

            {/* Visual Theme Selector Button */}
            <button
              onClick={() => setIsThemeOpen(true)}
              className="flex items-center gap-1.5 bg-[#1c2030] hover:bg-[#23283c] border border-[#2d3246] text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
              title="Change Visual Theme (15 themes available across Basic Dark, High Contrast, Bright Solar)"
            >
              <Palette size={14} className="text-indigo-400" />
              <span className="hidden sm:inline">Theme</span>
            </button>

            {/* Quick Google Sheets Sync Button */}
            <button
              onClick={() => setCurrentTab('sheets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                conflictCount > 0 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : pendingQueueCount > 0 
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' 
                  : 'bg-[#1c2030] hover:bg-[#23283c] border-[#2d3246] text-emerald-300 hover:text-white'
              }`}
              title="Google Sheets Live Automation & Cloud Bridge"
            >
              <Sheet size={14} className={conflictCount > 0 ? 'text-amber-400' : pendingQueueCount > 0 ? 'text-cyan-400' : 'text-emerald-400'} />
              <span className="hidden sm:inline font-medium">
                {conflictCount > 0 ? `${conflictCount} Conflicts` : pendingQueueCount > 0 ? `${pendingQueueCount} Queued` : 'Sheets'}
              </span>
            </button>

            {/* Mobile & S25 Ultra Deployment Hub Button */}
            <button
              onClick={() => setIsMobileDeployOpen(true)}
              className="flex items-center gap-1.5 bg-[#1c2030] hover:bg-[#23283c] border border-[#2d3246] text-cyan-300 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
              title="Mobile & Samsung Galaxy S25 Ultra Deployment Hub"
            >
              <Smartphone size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">S25 Hub</span>
            </button>

            {/* System Diagnostic & E2E Audit Button */}
            <button
              onClick={() => setIsDiagnosticOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-[11px] text-emerald-400 font-mono transition-colors cursor-pointer"
              title="Run Automated E2E Test Suite & Lighthouse PWA Audit"
            >
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="hidden sm:inline">Audit: 100% Local-First</span>
              <span className="sm:hidden">Audit</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <ExecutiveDashboard 
                onNavigate={setCurrentTab} 
                onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
                onOpenMobileDeploy={() => setIsMobileDeployOpen(true)}
              />
            )}
            {currentTab === 'tasks' && <TaskIntelligence />}
            {currentTab === 'knowledge' && <KnowledgeVault />}
            {currentTab === 'health' && <HealthTracker />}
            {currentTab === 'property' && <PropertyTracker />}
            {currentTab === 'pdf' && (
              <React.Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Reading Library & Knowledge Hub...</div>}>
                <PdfReaderView />
              </React.Suspense>
            )}
            {currentTab === 'inbox' && <UniversalInboxAI />}
            {currentTab === 'goals' && <GoalsPyramid />}
            {currentTab === 'journal' && <JournalView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'pantry' && <PantryView />}
            {currentTab === 'sheets' && <GoogleSheetsSyncModal />}
            {currentTab === 'jyotish' && <JyotishView />}
            {currentTab === 'sadhana' && <DreamSadhanaView />}
            {currentTab === 'vedic' && <VedicConcordanceView />}
            {currentTab === 'pranayama' && <PranayamaView />}
            {currentTab === 'sovereign_studio' && (
              <SovereignStudioV2 
                onSwitchToV1={() => switchOsVersion('v1')} 
                embedded={true} 
              />
            )}
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

      {/* Mobile & Samsung S25 Ultra Deployment Modal */}
      <MobileDeploymentModal
        isOpen={isMobileDeployOpen}
        onClose={() => setIsMobileDeployOpen(false)}
      />
    </div>
  );
}

export default App;

