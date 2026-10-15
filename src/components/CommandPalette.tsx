import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, BookOpen, CheckSquare, Compass, X, ArrowRight } from 'lucide-react';
import { type NavTab } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  const notes = useLiveQuery(() => db.knowledge.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];

  // Listen for Ctrl+P or Cmd+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        // Toggle palette
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedNotes = q ? notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 4) : [];
  const matchedTasks = q ? tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 4) : [];
  const matchedProjects = q ? projects.filter(p => p.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedGoals = q ? goals.filter(g => g.title.toLowerCase().includes(q)).slice(0, 3) : [];

  const handleSelect = (tab: NavTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-start justify-center pt-20 px-4">
      <div 
        className="bg-[#1a1d2c] border border-[#2e344d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#292e44] flex items-center gap-3">
          <Search size={18} className="text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search notes, tasks, projects, concepts..."
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[420px] overflow-y-auto p-3 space-y-4">
          {!q ? (
            <div className="space-y-2 p-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block">
                Quick Subsystem Navigation
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelect('dashboard')}
                  className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#202538] border border-[#262b3d] text-left text-xs font-semibold text-white flex items-center justify-between"
                >
                  <span>📊 Executive Dashboard</span>
                  <ArrowRight size={13} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleSelect('analytics')}
                  className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#202538] border border-[#262b3d] text-left text-xs font-semibold text-indigo-300 flex items-center justify-between"
                >
                  <span>📈 Predictive Analytics & Radar</span>
                  <ArrowRight size={13} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleSelect('tasks')}
                  className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#202538] border border-[#262b3d] text-left text-xs font-semibold text-white flex items-center justify-between"
                >
                  <span>✅ Task Intelligence</span>
                  <ArrowRight size={13} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleSelect('knowledge')}
                  className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#202538] border border-[#262b3d] text-left text-xs font-semibold text-white flex items-center justify-between"
                >
                  <span>📖 Knowledge Vault</span>
                  <ArrowRight size={13} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleSelect('sheets')}
                  className="p-2.5 rounded-xl bg-[#141624] hover:bg-[#202538] border border-[#262b3d] text-left text-xs font-semibold text-emerald-300 flex items-center justify-between"
                >
                  <span>📊 Google Sheets Bridge</span>
                  <ArrowRight size={13} className="text-gray-500" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Notes Matches */}
              {matchedNotes.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                    Knowledge Vault ({matchedNotes.length})
                  </span>
                  <div className="space-y-1">
                    {matchedNotes.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleSelect('knowledge')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#23283c] cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen size={16} className="text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
                              {n.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 truncate">
                              {n.content.replace(/^[#*-\s]+/gm, '')}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-500 group-hover:text-white shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Matches */}
              {matchedTasks.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                    Tasks Matrix ({matchedTasks.length})
                  </span>
                  <div className="space-y-1">
                    {matchedTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleSelect('tasks')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#23283c] cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate">
                              {t.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {t.quadrant} • {t.priority}
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-500 group-hover:text-white shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Matches */}
              {matchedProjects.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                    Projects ({matchedProjects.length})
                  </span>
                  <div className="space-y-1">
                    {matchedProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect('dashboard')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#23283c] cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs">📁</span>
                          <h4 className="text-xs font-semibold text-white truncate">{p.name}</h4>
                        </div>
                        <ArrowRight size={14} className="text-gray-500 group-hover:text-white shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchedNotes.length === 0 && matchedTasks.length === 0 && matchedProjects.length === 0 && (
                <div className="py-8 text-center text-gray-500 text-xs">
                  No direct matches for "{query}".
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-[#141622] border-t border-[#292e44] text-[11px] text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="bg-[#1e2333] px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400">Esc to close</kbd>
          </div>
          <span className="text-indigo-400 font-mono text-[10px]">Universal Indexer</span>
        </div>
      </div>
    </div>
  );
};
