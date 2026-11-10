import React, { useEffect, useRef } from 'react';
import { ExternalLink, RefreshCw, Sparkles } from 'lucide-react';

export const NotesStudioPreviewView: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const previewUrl = `${baseUrl}notes-studio-integration-preview.html`;

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const themeId = e.detail?.id || localStorage.getItem('om_knowledge_os_theme') || 'midnight-obsidian';
      iframeRef.current?.contentWindow?.postMessage({ type: 'OM_THEME_CHANGED', themeId }, '*');
    };

    window.addEventListener('om-theme-changed', handleThemeChange);
    return () => window.removeEventListener('om-theme-changed', handleThemeChange);
  }, []);

  const handleRefresh = () => {
    if (iframeRef.current) {
      const url = new URL(previewUrl, window.location.href);
      url.searchParams.set('_t', Date.now().toString());
      iframeRef.current.src = url.toString();
    }
  };

  const handlePopOut = () => {
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      data-ag-id="NotesStudioPreview_Root_Container" 
      className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Top Banner Toolbar */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 border-b shrink-0 text-xs"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderColor: 'var(--border-color)', 
          color: 'var(--text-main)' 
        }}
      >
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-indigo-500/15 text-indigo-400">
            <Sparkles size={13} />
          </span>
          <span className="font-semibold text-[11px] tracking-wide">
            Unified Notes Studio · Integration Engine
          </span>
          <span 
            className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded border"
            style={{ 
              borderColor: 'var(--border-color)', 
              color: 'var(--text-muted)' 
            }}
          >
            Standalone Workable Module
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] border hover:opacity-80 transition-colors cursor-pointer"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-color)', 
              color: 'var(--text-muted)' 
            }}
            title="Reload Module Engine"
          >
            <RefreshCw size={11} />
            <span className="hidden md:inline">Reload</span>
          </button>

          <button
            onClick={handlePopOut}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}
            title="Open in Fullscreen Standalone Browser Tab"
          >
            <ExternalLink size={11} />
            <span>Open Standalone</span>
          </button>
        </div>
      </div>

      {/* Embedded High-Fidelity Module Engine */}
      <iframe
        ref={iframeRef}
        src={previewUrl}
        title="Notes Studio Integration Preview"
        className="flex-1 w-full h-full border-0"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      />
    </div>
  );
};
