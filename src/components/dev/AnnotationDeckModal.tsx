import React, { useState, useEffect, useRef } from 'react';
import type { AnnotationRecord, AnnotationStatus } from '../../types/annotation';
import {
  getStoredAnnotations,
  updateAnnotationStatus,
  deleteAnnotation,
  clearAnnotations,
  formatAnnotationDirective,
  formatBatchAnnotationsDirective,
  copyToClipboardResilient,
} from '../../services/annotationStore';
import {
  X,
  Copy,
  Check,
  Trash2,
  Layers,
  Bug,
  Move,
  Palette,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  RotateCcw,
  Wrench,
  ChevronDown,
  GripHorizontal,
  AlertTriangle,
  BellRing,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useDraggableResizable, ResizeHandles, CaptureGlass } from './useDraggableResizable';

interface AnnotationDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnnotation?: (record: AnnotationRecord) => void;
}

export const AnnotationDeckModal: React.FC<AnnotationDeckModalProps> = ({
  isOpen,
  onClose,
  onSelectAnnotation,
}) => {
  const [annotations, setAnnotations] = useState<AnnotationRecord[]>([]);
  const [filter, setFilter] = useState<AnnotationStatus | 'all'>('pending');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [batchCopied, setBatchCopied] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Audio & Limit Alert Engine (Threshold: 10 warning, 15 critical saturation)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('om_annotation_alarm_muted') === 'true';
    } catch {
      return false;
    }
  });

  const lastAlarmLevelRef = useRef<number>(0);

  const playChime = (critical: boolean) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (critical) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.40);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.26);
      }
    } catch {}
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('om_annotation_alarm_muted', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const pending = annotations.filter(a => a.status === 'pending').length;
    if (pending >= 15 && lastAlarmLevelRef.current < 15) {
      playChime(true);
      lastAlarmLevelRef.current = 15;
    } else if (pending >= 10 && lastAlarmLevelRef.current < 10) {
      playChime(false);
      lastAlarmLevelRef.current = 10;
    } else if (pending < 10) {
      lastAlarmLevelRef.current = 0;
    }
  }, [annotations]);

  const formatDateTime = (timestamp: string | number) => {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  // 8-Way Draggable & Perimeter-Resizable Engine (throttled via requestAnimationFrame)
  const { pos, size, setPos, isInteracting, activeCursor, handleDragStart, handleTouchDragStart, handleResizeStart, handleTouchResizeStart } =
    useDraggableResizable({
      initialPos: () => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        const defaultWidth = isMobile ? Math.min(window.innerWidth - 16, 380) : 410;
        const defaultHeight = isMobile ? Math.min(window.innerHeight - 90, 480) : 520;
        const defaultX = Math.max(8, window.innerWidth - defaultWidth - (isMobile ? 8 : 16));
        const defaultY = Math.max(8, window.innerHeight - 56 - defaultHeight - (isMobile ? 8 : 12));
        return { x: defaultX, y: defaultY };
      },
      initialSize: typeof window !== 'undefined' && window.innerWidth < 640
        ? { width: Math.min(window.innerWidth - 16, 380), height: Math.min(window.innerHeight - 90, 480) }
        : { width: 410, height: 520 },
      minWidth: 240,
      minHeight: 180,
      maxWidth: 950,
      maxHeight: 850,
    });

  // Whenever Deck is opened fresh, dock it in the right bottom corner just above the Deck Launcher button
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 640;
      const targetWidth = isMobile ? Math.min(window.innerWidth - 16, size.width) : size.width;
      const targetHeight = isMobile ? Math.min(window.innerHeight - 90, size.height) : size.height;
      setPos({
        x: Math.max(8, window.innerWidth - targetWidth - (isMobile ? 8 : 16)),
        y: Math.max(8, window.innerHeight - 56 - targetHeight - (isMobile ? 8 : 12)),
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setAnnotations(getStoredAnnotations());

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ annotations: AnnotationRecord[] }>;
      if (custom.detail?.annotations) {
        setAnnotations(custom.detail.annotations);
      } else {
        setAnnotations(getStoredAnnotations());
      }
    };

    window.addEventListener('om-annotations-updated', handleUpdate);
    return () => window.removeEventListener('om-annotations-updated', handleUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = annotations.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const pendingCount = annotations.filter((a) => a.status === 'pending').length;

  const handleCopySingle = async (ann: AnnotationRecord) => {
    const directive = formatAnnotationDirective(ann);
    const ok = await copyToClipboardResilient(directive);
    if (ok) {
      setCopiedId(ann.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleCopyBatchPending = async () => {
    const directive = formatBatchAnnotationsDirective(annotations);
    const ok = await copyToClipboardResilient(directive);
    if (ok) {
      setBatchCopied(true);
      setTimeout(() => setBatchCopied(false), 2000);
    }
  };

  const handleToggleStatus = (id: string, current: AnnotationStatus) => {
    const next: AnnotationStatus = current === 'resolved' ? 'pending' : 'resolved';
    const updated = updateAnnotationStatus(id, next);
    setAnnotations(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteAnnotation(id);
    setAnnotations(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all visual annotations? This cannot be undone.')) {
      clearAnnotations();
      setAnnotations([]);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'BUG':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Bug size={10} /> BUG
          </span>
        );
      case 'LAYOUT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Move size={10} /> LAYOUT
          </span>
        );
      case 'REFACTOR':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Wrench size={10} /> REFACTOR
          </span>
        );
      case 'THEME':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Palette size={10} /> THEME
          </span>
        );
      case 'FEATURE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles size={10} /> FEATURE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <HelpCircle size={10} /> CLARIFY
          </span>
        );
    }
  };

  return (
    <>
      {/* Capture Glass: Shields against event leakage into underlying buttons/iframes during drag/resize */}
      <CaptureGlass isActive={isInteracting} cursor={activeCursor} />

      <div
        data-ag-id="AnnotationDeckModal_Dialog_Container"
        style={{
          position: 'fixed',
          top: `${pos.y}px`,
          left: `${pos.x}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex: 99960,
          boxShadow: '0 16px 40px -6px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(161, 161, 170, 0.35), 0 0 18px rgba(161, 161, 170, 0.2)',
        }}
        className="relative bg-zinc-950/95 border border-zinc-700/80 rounded-2xl flex flex-col overflow-hidden text-zinc-100 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 8-Way Perimeter Resizing Handles (4 Edges + 4 Corners) */}
        <ResizeHandles 
          onResizeStart={handleResizeStart} 
          onTouchResizeStart={handleTouchResizeStart} 
          accentClass="hover:bg-amber-400/50" 
        />

        {/* Header (Drag Handle) */}
        <div
          data-ag-id="AnnotationDeckModal_Header_GripBar"
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchDragStart}
          className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0 cursor-grab active:cursor-grabbing select-none"
          title="Click & Drag to move anywhere on screen"
        >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripHorizontal size={14} className="text-zinc-500 hover:text-amber-400 shrink-0" />
          <div className="p-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Layers size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 truncate">
              <span>Annotation Deck</span>
              <span className="text-[9px] font-normal px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                {annotations.length}
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer shrink-0"
          title="Close Deck"
        >
          <X size={14} />
        </button>
      </div>

      {/* Filter bar & Batch Action (Auto-wrapping to width) */}
      <div data-ag-id="AnnotationDeckModal_Filter_Bar" className="p-2 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-1.5 flex-wrap shrink-0">
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
          <button
            data-ag-id="AnnotationDeckModal_Filter_Pending" onClick={() => setFilter('pending')}
            className={`px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            data-ag-id="AnnotationDeckModal_Filter_Resolved" onClick={() => setFilter('resolved')}
            className={`px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
              filter === 'resolved'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Resolved ({annotations.length - pendingCount})
          </button>
          <button
            data-ag-id="AnnotationDeckModal_Filter_All" onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-zinc-200 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
        </div>

        {annotations.length > 0 && (
          <button
            data-ag-id="AnnotationDeckModal_Button_ClearAll" onClick={handleClearAll}
            className="text-[9px] text-zinc-500 hover:text-rose-400 px-1.5 py-0.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Visual Limit Warning & Critical Alarm Banner */}
      {pendingCount >= 10 && (
        <div 
          data-ag-id="AnnotationDeckModal_Banner_LimitAlarm"
          className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 select-none ${
            pendingCount >= 15 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 animate-pulse' 
              : 'bg-amber-500/15 border-amber-500/30 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {pendingCount >= 15 ? (
              <AlertTriangle size={16} className="text-rose-400 shrink-0 animate-bounce" />
            ) : (
              <BellRing size={15} className="text-amber-400 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold leading-tight flex items-center gap-1.5 truncate">
                <span>{pendingCount >= 15 ? '🚨 AI Context Saturation Alarm' : '⚡ Context Limit Alert'}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  pendingCount >= 15 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-zinc-950'
                }`}>
                  {pendingCount} items
                </span>
              </div>
              <p className="text-[9.5px] opacity-85 leading-tight mt-0.5 truncate">
                {pendingCount >= 15
                  ? 'Exceeding 15 items in a single turn degrades prompt focus & risks truncation. Batch copy now.'
                  : 'Nearing optimal AI turn limit (10–12 items). Consider batch copying to maintain sharp agent focus.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleMute}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title={isMuted ? 'Unmute chime' : 'Mute chime'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>
      )}

      {/* Batch Copy CTA Button */}
      {pendingCount > 0 && (
        <div data-ag-id="AnnotationDeckModal_Banner_BatchCopy" className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <span className="text-[10px] text-amber-200/90 font-medium">
            Feed AI Coding Agent
          </span>
          <button
            data-ag-id="AnnotationDeckModal_Button_BatchCopy" 
            onClick={handleCopyBatchPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              pendingCount >= 15
                ? 'bg-rose-500 hover:bg-rose-400 text-white ring-2 ring-rose-400 ring-offset-1 ring-offset-zinc-950 animate-pulse'
                : pendingCount >= 10
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 ring-2 ring-amber-400/80 shadow-amber-500/20'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
            }`}
          >
            {batchCopied ? (
              <>
                <Check size={11} className={pendingCount >= 15 ? 'text-white' : 'text-zinc-950'} />
                <span>Batch Copied!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>{pendingCount >= 15 ? `⚠️ Saturated (${pendingCount})` : `Copy All (${pendingCount})`}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Annotation List with Vertical Scroll & Responsive Auto-wrapping */}
      <div data-ag-id="AnnotationDeckModal_List_Annotations" className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <Layers size={24} className="text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No visual annotations found</p>
            <p className="text-[10px] text-zinc-600 mt-1 max-w-xs">
              Activate inspect mode via <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl+Shift+A</kbd> or the top header Lasso button.
            </p>
          </div>
        ) : (
          filtered.map((ann) => {
            const isResolved = ann.status === 'resolved';
            const isExpanded = expandedIds.has(ann.id);
            const isHovered = hoveredCardId === ann.id;

            return (
              <div
                key={ann.id}
                className={`p-2.5 rounded-xl border transition-all duration-200 ease-in-out ${
                  isResolved
                    ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 shadow-sm'
                }`}
              >
                {/* Top Bar with Badges & Collapse Toggle Button */}
                <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap min-w-0">
                    {getIntentBadge(ann.comment.intent)}
                    {ann.target.canonicalId ? (
                      <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 truncate max-w-[150px]">
                        {ann.target.canonicalId}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-400 truncate max-w-[130px]">
                        {ann.target.selector}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[8.5px] font-mono text-zinc-500 whitespace-nowrap">
                      {formatDateTime(ann.createdAt)} · {Math.round(ann.target.rect.width)}×{Math.round(ann.target.rect.height)}
                    </span>
                    <button
                      onClick={() => toggleExpand(ann.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/80 transition-colors cursor-pointer ml-0.5"
                      title={isExpanded ? 'Collapse Directive' : 'Expand Full Directive'}
                    >
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ease-out ${
                          isExpanded ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Animated Collapsible Directive Text with Auto-wrapping */}
                <div
                  onMouseEnter={() => setHoveredCardId(ann.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => toggleExpand(ann.id)}
                  className="cursor-pointer group"
                  title={isExpanded ? 'Click to collapse' : 'Click to expand'}
                >
                  <div
                    className={`transition-all duration-200 ease-out overflow-hidden text-xs text-zinc-200 leading-relaxed break-words ${
                      isExpanded
                        ? 'max-h-[500px] whitespace-pre-wrap'
                        : isHovered
                        ? 'max-h-24 bg-zinc-950/60 p-1.5 rounded-lg border border-amber-500/30'
                        : 'max-h-5 truncate font-medium text-zinc-300'
                    }`}
                  >
                    <p className={!isExpanded && !isHovered ? 'truncate' : isHovered && !isExpanded ? 'line-clamp-3' : ''}>
                      {ann.comment.userText}
                    </p>
                  </div>
                </div>

                {/* Text snippet if any */}
                {ann.target.textSnippet && isExpanded && (
                  <blockquote className="border-l-2 border-amber-500/40 pl-2 text-[9px] italic text-zinc-400 my-1.5 bg-zinc-950/50 py-0.5 rounded-r">
                    "{ann.target.textSnippet}"
                  </blockquote>
                )}

                {/* Item Actions */}
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/50 text-[10px] mt-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(ann.id, ann.status)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors cursor-pointer ${
                        isResolved
                          ? 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/60'
                          : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
                      }`}
                      title={isResolved ? 'Mark Pending' : 'Mark Resolved'}
                    >
                      {isResolved ? (
                        <>
                          <RotateCcw size={9} /> Reopen
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={9} /> Resolve
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopySingle(ann)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[9px] font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    {copiedId === ann.id ? (
                      <>
                        <Check size={10} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>Copy Directive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
};
