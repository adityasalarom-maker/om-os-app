import React, { useState, useEffect } from 'react';
import { 
  THEMES, 
  type ThemeDefinition, 
  type ThemeCategory, 
  applyTheme, 
  getStoredThemeId 
} from '../services/themeEngine';
import { 
  Palette, 
  Check, 
  X, 
  Sun, 
  Moon, 
  Zap, 
  Sparkles,
  Layers
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeThemeId, setActiveThemeId] = useState<string>(getStoredThemeId());
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>(() => {
    const currentId = getStoredThemeId();
    const curr = THEMES.find(t => t.id === currentId);
    return curr ? curr.category : 'Basic Dark';
  });

  useEffect(() => {
    if (isOpen) {
      const currentId = getStoredThemeId();
      setActiveThemeId(currentId);
      const curr = THEMES.find(t => t.id === currentId);
      if (curr) {
        setSelectedCategory(curr.category);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const categories: { id: ThemeCategory; label: string; icon: any; count: number }[] = [
    { id: 'Basic Dark', label: 'Basic Dark (5)', icon: Moon, count: 5 },
    { id: 'High Contrast', label: 'High Contrast (5)', icon: Zap, count: 5 },
    { id: 'Bright Solar', label: 'Bright Solar (5)', icon: Sun, count: 5 }
  ];

  const handleSelectTheme = (theme: ThemeDefinition) => {
    setActiveThemeId(theme.id);
    setSelectedCategory(theme.category);
    applyTheme(theme.id);
  };

  const filteredThemes = THEMES.filter(t => t.category === selectedCategory);
  const activeThemeObj = THEMES.find(t => t.id === activeThemeId) || THEMES[0];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#141622] border border-[#272b3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#272b3d] flex items-center justify-between bg-[#181a26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Theme Studio & Aesthetics</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-indigo-300">
                  {THEMES.length} Themes
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Active: <strong className="text-white">{activeThemeObj.name}</strong> ({activeThemeObj.category})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-2 p-3 bg-[#10121a] border-b border-[#232738] overflow-x-auto text-xs">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#181a26] text-gray-400 hover:text-white border border-[#272b3d]'
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme Cards Grid */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredThemes.map(theme => {
              const isActive = activeThemeId === theme.id;
              const { bg, card, accent, text } = theme.previewColors;

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative group flex flex-col justify-between ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-[#181a26] border-[#272b3d] hover:border-gray-500 hover:bg-[#1e2130]'
                  }`}
                >
                  <div>
                    {/* Header: Title and Active Checkmark */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        {theme.name}
                      </span>
                      {isActive ? (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-500 group-hover:text-indigo-400">
                          Select
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                      {theme.description}
                    </p>
                  </div>

                  {/* Visual Color Palette Swatches */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Palette Swatch:</span>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/10">
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20" 
                        style={{ backgroundColor: bg }} 
                        title={`Background: ${bg}`}
                      />
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20" 
                        style={{ backgroundColor: card }} 
                        title={`Card: ${card}`}
                      />
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20" 
                        style={{ backgroundColor: accent }} 
                        title={`Accent: ${accent}`}
                      />
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20" 
                        style={{ backgroundColor: text }} 
                        title={`Text: ${text}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#272b3d] bg-[#181a26] flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[11px]">
            Theme persists across page refreshes and offline PWA mode.
          </span>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
