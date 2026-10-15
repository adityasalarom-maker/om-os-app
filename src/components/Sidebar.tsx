import React from 'react';
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
  Mountain
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
  | 'sheets';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task Intelligence', icon: CheckSquare },
    { id: 'knowledge', label: 'Knowledge Vault', icon: BookOpen },
    { id: 'health', label: 'Health & Ayurveda', icon: Heart },
    { id: 'property', label: 'Land & Diligence', icon: Mountain },
    { id: 'pdf', label: 'PDF Research Reader', icon: FileText },
    { id: 'inbox', label: 'Universal Inbox & AI', icon: Inbox },
    { id: 'goals', label: 'Goals (Life Pyramid)', icon: Compass },
    { id: 'journal', label: 'Journal & Reflection', icon: BookHeart },
    { id: 'pantry', label: 'Kitchen & Pantry', icon: UtensilsCrossed },
    { id: 'sheets', label: 'Google Sheets Bridge', icon: Sheet },
  ];

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
                à¥
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-wide text-white">Om Knowledge OS</h1>
                <span className="text-[10px] text-indigo-400 font-mono tracking-wider">v2.0 LOCAL-FIRST</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              à¥
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
                {!isCollapsed && <span>{item.label}</span>}
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

      {/* Mobile Bottom Navigation Bar (Visible on phones like Samsung Galaxy S25) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161822]/95 backdrop-blur-md border-t border-[#272b3b] z-50 flex items-center justify-around px-2">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center w-12 py-1 ${
            currentTab === 'dashboard' ? 'text-indigo-400' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
        <button
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center justify-center w-12 py-1 ${
            currentTab === 'tasks' ? 'text-indigo-400' : 'text-gray-400'
          }`}
        >
          <CheckSquare size={20} />
          <span className="text-[10px] mt-1 font-medium">Tasks</span>
        </button>
        <button
          onClick={() => onSelectTab('inbox')}
          className={`flex flex-col items-center justify-center w-14 h-14 -mt-5 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/30 border-2 border-[#161822]`}
          title="Quick Capture"
        >
          <Sparkles size={22} />
        </button>
        <button
          onClick={() => onSelectTab('knowledge')}
          className={`flex flex-col items-center justify-center w-12 py-1 ${
            currentTab === 'knowledge' ? 'text-indigo-400' : 'text-gray-400'
          }`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] mt-1 font-medium">Vault</span>
        </button>
        <button
          onClick={() => onSelectTab('journal')}
          className={`flex flex-col items-center justify-center w-12 py-1 ${
            currentTab === 'journal' ? 'text-indigo-400' : 'text-gray-400'
          }`}
        >
          <BookHeart size={20} />
          <span className="text-[10px] mt-1 font-medium">Journal</span>
        </button>
      </nav>
    </>
  );
};

