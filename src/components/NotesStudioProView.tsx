import React, { useEffect, useRef } from 'react';
import { ExternalLink, RefreshCw, Sparkles } from 'lucide-react';

export const NotesStudioProView: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const themeId = e.detail?.id || localStorage.getItem('om_knowledge_os_theme') || 'midnight-obsidian';
      iframeRef.current?.contentWindow?.postMessage({ type: 'OM_THEME_CHANGED', themeId }, '*');
    };

    window.addEventListener('om-theme-changed', handleThemeChange);
    return () => window.removeEventListener('om-theme-changed', handleThemeChange);
  }, []);

  const handleRefresh = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const standaloneUrl = `${window.location.origin}/notes-studio-pro.html?standalone=1`;

  return (
    <div 
      data-ag-id="NotesStudioPro_Root_Container" 
      className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Top Banner Action Bar */}
      <div 
        className="flex items-center justify-between px-3 py-1 border-b shrink-0 text-xs"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderColor: 'var(--border-color)', 
          color: 'var(--text-main)' 
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            3 Vertical Panes + 1 Bottom Dock · High-Fidelity Sovereign View
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border hover:opacity-80 transition-colors cursor-pointer"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-color)', 
              color: 'var(--text-muted)' 
            }}
            title="Reload Module Engine"
          >
            <RefreshCw size={11} />
            <span>Reload</span>
          </button>

          <a
            href={standaloneUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}
            title="Open Notes Studio Pro as a full-page app in a new tab. Maximize that tab for the desktop layout."
          >
            <ExternalLink size={11} />
            <span>Open full page</span>
          </a>
        </div>
      </div>

      {/* Embedded High-Fidelity Module Engine */}
      <iframe
        ref={iframeRef}
        src="/notes-studio-pro.html"
        title="Notes Studio Pro"
        className="flex-1 w-full h-full border-0"
        style={{ backgroundColor: 'var(--bg-primary)' }}
        onLoad={() => {
          const themeId = localStorage.getItem('om_knowledge_os_theme') || 'midnight-obsidian';
          iframeRef.current?.contentWindow?.postMessage({ type: 'OM_THEME_CHANGED', themeId }, '*');
        }}
      />
    </div>
  );
};
