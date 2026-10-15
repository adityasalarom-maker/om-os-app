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
import { PdfReaderView } from './components/pdf/PdfReaderView';
import { CommandPalette } from './components/CommandPalette';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { DocumentIntelligenceModal } from './components/DocumentIntelligenceModal';
import { initializeSeedDataIfEmpty } from './db';
import { initializeThemeOnStartup } from './services/themeEngine';
import { Search, Sparkles, Bell, Shield, Smartphone, Palette, Camera } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

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
          à¥
        </div>
        <p className="text-sm font-semibold tracking-wide">Initializing Om Knowledge OS...</p>
        <p className="text-xs text-gray-500 font-mono">Loading local-first encrypted tables</p>
      </div>
    );
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
              <span className="capitalize">{currentTab === 'inbox' ? 'Universal Inbox & AI' : currentTab === 'sheets' ? 'Google Sheets Bridge' : currentTab.replace('-', ' ')}</span>
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

            {/* Offline status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline">Local SQLite/IndexedDB Active</span>
              <span className="sm:hidden">Local</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && <ExecutiveDashboard onNavigate={setCurrentTab} />}
            {currentTab === 'tasks' && <TaskIntelligence />}
            {currentTab === 'knowledge' && <KnowledgeVault />}
            {currentTab === 'health' && <HealthTracker />}
            {currentTab === 'property' && <PropertyTracker />}
            {currentTab === 'pdf' && <PdfReaderView />}
            {currentTab === 'inbox' && <UniversalInboxAI />}
            {currentTab === 'goals' && <GoalsPyramid />}
            {currentTab === 'journal' && <JournalView />}
            {currentTab === 'pantry' && <PantryView />}
            {currentTab === 'sheets' && <GoogleSheetsSyncModal />}
          </div>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+P) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentTab}
      />

      {/* Universal Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

      {/* Multimodal Document Intelligence & OCR Modal */}
      <DocumentIntelligenceModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onSavedToVault={() => {
          setIsOcrOpen(false);
          setCurrentTab('knowledge');
        }}
      />
    </div>
  );
}

export default App;

