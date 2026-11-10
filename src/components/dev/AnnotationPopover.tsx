import React, { useState } from 'react';
import type { AnnotationIntent, AnnotationRecord, AnnotationTarget } from '../../types/annotation';
import { formatAnnotationDirective, saveAnnotation, copyToClipboardResilient } from '../../services/annotationStore';
import { Check, Copy, X, Sparkles, Layers, Bug, Move, Palette, HelpCircle, Save, Wrench, GripHorizontal } from 'lucide-react';
import { useDraggableResizable, ResizeHandles, CaptureGlass } from './useDraggableResizable';

interface AnnotationPopoverProps {
  target: AnnotationTarget;
  onClose: () => void;
  onSaved?: (record: AnnotationRecord) => void;
}

const INTENTS: { id: AnnotationIntent; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'BUG', label: 'Bug', icon: Bug },
  { id: 'LAYOUT', label: 'Layout', icon: Move },
  { id: 'REFACTOR', label: 'Refactor', icon: Wrench },
  { id: 'THEME', label: 'Theme', icon: Palette },
  { id: 'FEATURE', label: 'Feature', icon: Sparkles },
  { id: 'CLARIFY', label: 'Clarify', icon: HelpCircle },
];

export const AnnotationPopover: React.FC<AnnotationPopoverProps> = ({ target, onClose, onSaved }) => {
  const [intent, setIntent] = useState<AnnotationIntent>('LAYOUT');
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  // 8-Way Draggable & Perimeter-Resizable Engine (throttled via requestAnimationFrame)
  const {
    pos,
    size,
    isInteracting,
    activeCursor,
    handleDragStart,
    handleTouchDragStart,
    handleResizeStart,
    handleTouchResizeStart,
  } = useDraggableResizable({
    initialPos: () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      const popoverWidth = isMobile ? Math.min(window.innerWidth - 24, 300) : 260;
      const defaultX = isMobile
        ? Math.max(12, Math.round((window.innerWidth - popoverWidth) / 2))
        : Math.max(16, window.innerWidth - 280);
      const defaultY = isMobile ? Math.max(64, Math.round((window.innerHeight - 300) / 2)) : 96;
      return { x: defaultX, y: defaultY };
    },
    initialSize: typeof window !== 'undefined' && window.innerWidth < 640
      ? { width: Math.min(window.innerWidth - 24, 300), height: 290 }
      : { width: 260, height: 275 },
    minWidth: 210,
    minHeight: 180,
    maxWidth: 800,
    maxHeight: 700,
  });

  const buildRecord = (): AnnotationRecord => {
    return {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      target,
      comment: {
        intent,
        userText: commentText.trim() || 'Please inspect and refine this target element',
      },
      page: {
        url: window.location.href,
        route: window.location.pathname + window.location.search,
        title: document.title || 'Om Knowledge OS',
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          dpr: window.devicePixelRatio || 1,
        },
      },
    };
  };

  const handleCopyAndSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const record = buildRecord();
    saveAnnotation(record);
    const directive = formatAnnotationDirective(record);
    const copySuccess = await copyToClipboardResilient(directive);
    setCopied(true);
    setTimeout(() => {
      onSaved?.(record);
      onClose();
    }, 600);
  };

  const handleSaveOnly = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const record = buildRecord();
    saveAnnotation(record);
    onSaved?.(record);
    onClose();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <>
      {/* Capture Glass: Shields against event leakage into underlying buttons/iframes during drag/resize */}
      <CaptureGlass isActive={isInteracting} cursor={activeCursor} />

      <div
        data-dev-control="true"
        data-ag-id="AnnotationPopover_Dialog_Container"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          position: 'fixed',
          top: `${pos.y}px`,
          left: `${pos.x}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex: 999999,
          cursor: 'default',
          boxShadow: '0 16px 40px -6px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(161, 161, 170, 0.35), 0 0 18px rgba(161, 161, 170, 0.2)',
        }}
        className="relative p-2.5 rounded-xl border border-zinc-600/60 bg-zinc-950/95 text-zinc-100 backdrop-blur-md flex flex-col gap-2 select-none animate-in fade-in zoom-in-95 duration-100 pointer-events-auto"
      >
        {/* 8-Way Perimeter Resizing Handles (4 Edges + 4 Corners) */}
        <ResizeHandles
          onResizeStart={handleResizeStart}
          onTouchResizeStart={handleTouchResizeStart}
          accentClass="hover:bg-zinc-400/50"
        />

        {/* Header with Drag Handle & Target Badge */}
        <div
          data-ag-id="AnnotationPopover_Header_GripBar"
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchDragStart}
          className="flex items-center justify-between gap-1.5 border-b pb-1.5 border-zinc-800/80 cursor-grab active:cursor-grabbing select-none"
          title="Click & Drag to move anywhere on screen"
        >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <GripHorizontal size={13} className="text-zinc-500 hover:text-amber-400 shrink-0" />
          <span className="p-0.5 rounded bg-indigo-500/20 text-indigo-400 shrink-0">
            <Layers size={11} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold tracking-tight truncate text-indigo-300">
              {target.canonicalId ? `[${target.canonicalId}]` : target.selector}
            </div>
            <div className="text-[8.5px] text-zinc-400 font-mono truncate">
              {target.tag} · {Math.round(target.rect.width)}×{Math.round(target.rect.height)}px
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          title="Cancel (Esc)"
        >
          <X size={13} />
        </button>
      </div>

      {/* 1-Click Intent Selection Chips (Auto-wrapping to container width) */}
      <div data-ag-id="AnnotationPopover_IntentChips_Group" className="shrink-0">
        <div className="text-[8.5px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Action Intent</span>
          <span className="text-[7.5px] text-zinc-500 lowercase font-mono">1-click select</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {INTENTS.map((item) => {
            const Icon = item.icon;
            const isSelected = intent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIntent(item.id);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-semibold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon size={9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Note Input (Fills remaining height smoothly) */}
      <div data-ag-id="AnnotationPopover_Directive_Container" className="flex-1 min-h-[44px] flex flex-col">
        <textarea
          data-ag-id="AnnotationPopover_Directive_Textarea"
          autoFocus
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Directive note (e.g. adjust padding, fix alignment, add button)..."
          className="w-full flex-1 min-h-[44px] text-[10px] p-1.5 rounded-lg border bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-sans select-text cursor-text"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleCopyAndSave();
            }
          }}
        />
      </div>

      {/* Primary Action Buttons */}
      <div data-ag-id="AnnotationPopover_Actions_ButtonBar" className="flex items-center gap-1.5 pt-0.5 shrink-0">
        <button
          type="button"
          onClick={handleCopyAndSave}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer shadow-md min-h-[38px] active:scale-95 ${
            copied
              ? 'bg-emerald-600 text-white border border-emerald-400'
              : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'
          }`}
          title="Copy formatted directive to clipboard (Ready to Ctrl+V into Antigravity Chat)"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span className="truncate">{copied ? 'Copied to Clipboard!' : 'Copy AI Directive'}</span>
        </button>

        <button
          type="button"
          onClick={handleSaveOnly}
          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-xs border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Save to Pending Deck"
        >
          <Save size={13} />
        </button>
      </div>

      <div className="text-[8px] text-zinc-400 text-center font-mono shrink-0 truncate">
        <kbd className="px-1 py-0.2 rounded bg-black/40 border border-zinc-800">Ctrl+Enter</kbd> copy · <kbd className="px-1 py-0.2 rounded bg-black/40 border border-zinc-800">Esc</kbd> cancel
      </div>
    </div>
    </>
  );
};
