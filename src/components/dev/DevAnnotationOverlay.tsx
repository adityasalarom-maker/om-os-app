import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AnnotationRecord, AnnotationTarget } from '../../types/annotation';
import { AnnotationPopover } from './AnnotationPopover';
import { getStoredAnnotations } from '../../services/annotationStore';
import {
  Layers,
  MousePointer2,
  BoxSelect,
  X,
  Check,
} from 'lucide-react';

export type InspectTool = 'element' | 'region';

interface DevAnnotationOverlayProps {
  isActive: boolean;
  onToggleActive: (active?: boolean) => void;
  onToggleDeck: () => void;
  isDeckOpen?: boolean;
  tool?: InspectTool;
  onToolChange?: (tool: InspectTool) => void;
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  isSidebarOpen?: boolean;
  onRequestOpenSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const DevAnnotationOverlay: React.FC<DevAnnotationOverlayProps> = ({
  isActive,
  onToggleActive,
  onToggleDeck,
  isDeckOpen = false,
  tool: propTool,
  onToolChange,
  isHovered = false,
  onHoverChange,
  isSidebarOpen = false,
  onRequestOpenSidebar,
  onToggleMobileSidebar,
}) => {
  const [internalTool, setInternalTool] = useState<InspectTool>('element');
  const tool = propTool ?? internalTool;
  const setTool = onToolChange ?? setInternalTool;

  const [hoveredTarget, setHoveredTarget] = useState<AnnotationTarget | null>(null);
  const [activeTarget, setActiveTarget] = useState<AnnotationTarget | null>(null);
  const [justSavedNotification, setJustSavedNotification] = useState<string | null>(null);

  // Deck pending count & alarm tracker
  const [deckPendingCount, setDeckPendingCount] = useState<number>(() => {
    try {
      return getStoredAnnotations().filter(a => a.status === 'pending').length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ annotations: AnnotationRecord[] }>;
      if (custom.detail?.annotations) {
        setDeckPendingCount(custom.detail.annotations.filter(a => a.status === 'pending').length);
      } else {
        setDeckPendingCount(getStoredAnnotations().filter(a => a.status === 'pending').length);
      }
    };
    window.addEventListener('om-annotations-updated', handleUpdate);
    return () => window.removeEventListener('om-annotations-updated', handleUpdate);
  }, []);

  // Drag selection state for arbitrary regions
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [dragBox, setDragBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Anchor geometry for the compact tool bar positioned directly to the LEFT of Annotate icon (or below on mobile)
  const getAnchorGeometry = useCallback((): { top: number; left: number; width: number; height: number; gap: number } | null => {
    if (typeof document === 'undefined') return null;
    const annotateEl = document.querySelector('[data-ag-id="App_Header_Button_VisualAnnotate"]');
    if (annotateEl) {
      const nRect = annotateEl.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const width = isMobile ? 140 : 152;
      const height = 32;
      const gap = 6;
      let left = Math.round(nRect.left - width - gap);
      let top = Math.round(nRect.top + (nRect.height - height) / 2);
      if (left < 8) {
        // If left overflows viewport on mobile, position directly beneath the annotate button
        left = Math.max(8, Math.min(window.innerWidth - width - 8, Math.round(nRect.right - width)));
        top = Math.round(nRect.bottom + gap);
      }
      return { top, left, width, height, gap };
    }
    return null;
  }, []);

  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number; height: number; gap: number } | null>(() => getAnchorGeometry());

  const updateAnchor = useCallback(() => {
    const geo = getAnchorGeometry();
    if (geo) setAnchor(geo);
  }, [getAnchorGeometry]);

  useEffect(() => {
    updateAnchor();
    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);
    return () => {
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, [updateAnchor, isActive, isHovered]);

  // Keyboard shortcut: Ctrl + Shift + A to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        onToggleActive(!isActive);
      } else if (e.key === 'Escape') {
        if (activeTarget) {
          setActiveTarget(null);
        } else if (isActive) {
          onToggleActive(false);
          onHoverChange?.(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, activeTarget, onToggleActive, onHoverChange]);

  // Deep Hit-Testing: Inspects both top-level DOM nodes and nested same-origin iframe elements (e.g. notes-studio-pro.html)
  const buildTargetFromElement = useCallback((el: HTMLElement, clientX?: number, clientY?: number): AnnotationTarget => {
    // If element is an iframe, inspect the exact child element inside the iframe document
    if (el instanceof HTMLIFrameElement && clientX !== undefined && clientY !== undefined) {
      try {
        const iframeRect = el.getBoundingClientRect();
        const iframeDoc = el.contentDocument || el.contentWindow?.document;
        if (iframeDoc) {
          const innerX = clientX - iframeRect.left;
          const innerY = clientY - iframeRect.top;
          const innerEl = iframeDoc.elementFromPoint(innerX, innerY) as HTMLElement | null;
          if (innerEl && innerEl !== iframeDoc.body && innerEl !== iframeDoc.documentElement) {
            const innerRect = innerEl.getBoundingClientRect();
            const canonicalEl = innerEl.closest('[data-ag-id]') as HTMLElement | null;
            const canonicalId =
              canonicalEl?.getAttribute('data-ag-id') || innerEl.getAttribute('data-ag-id') || undefined;

            let selector = innerEl.tagName.toLowerCase();
            if (innerEl.id) {
              selector += `#${innerEl.id}`;
            } else if (innerEl.className && typeof innerEl.className === 'string') {
              const parts = innerEl.className
                .split(/\s+/)
                .filter((c) => c && !c.includes(':') && !c.startsWith('dev-') && !c.includes('['))
                .slice(0, 2);
              if (parts.length > 0) selector += `.${parts.join('.')}`;
            }

            let componentHint = 'notes-studio-pro.html';
            if (canonicalId) {
              const prefix = canonicalId.split('_')[0];
              if (prefix) componentHint = `${prefix}.tsx`;
            }

            const selection = iframeDoc.getSelection();
            let textSnippet: string | undefined;
            if (selection && selection.toString().trim()) {
              textSnippet = selection.toString().trim().slice(0, 120);
            }

            return {
              type: 'element',
              canonicalId,
              tag: innerEl.tagName.toLowerCase(),
              selector,
              rect: {
                top: iframeRect.top + innerRect.top,
                left: iframeRect.left + innerRect.left,
                width: innerRect.width,
                height: innerRect.height,
                pageX: iframeRect.left + innerRect.left + window.scrollX,
                pageY: iframeRect.top + innerRect.top + window.scrollY,
              },
              componentHint,
              textSnippet,
            };
          }
        }
      } catch {
        // Fallback to top-level iframe rect if cross-origin
      }
    }

    // Top-Level DOM Element inspection
    const rect = el.getBoundingClientRect();
    const canonicalEl = el.closest('[data-ag-id]') as HTMLElement | null;
    const canonicalId =
      canonicalEl?.getAttribute('data-ag-id') || el.getAttribute('data-ag-id') || undefined;

    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector += `#${el.id}`;
    } else if (el.className && typeof el.className === 'string') {
      const parts = el.className
        .split(/\s+/)
        .filter((c) => c && !c.includes(':') && !c.startsWith('dev-') && !c.includes('['))
        .slice(0, 2);
      if (parts.length > 0) selector += `.${parts.join('.')}`;
    }

    let componentHint: string | undefined;
    if (canonicalId) {
      const prefix = canonicalId.split('_')[0];
      if (prefix) componentHint = `${prefix}.tsx`;
    }

    const selection = window.getSelection();
    let textSnippet: string | undefined;
    if (selection && selection.toString().trim()) {
      textSnippet = selection.toString().trim().slice(0, 120);
    }

    return {
      type: 'element',
      canonicalId,
      tag: el.tagName.toLowerCase(),
      selector,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pageX: rect.left + window.scrollX,
        pageY: rect.top + window.scrollY,
      },
      componentHint,
      textSnippet,
    };
  }, []);

  // Helper to determine if an element is a dev overlay or canvas to ignore in elementsFromPoint
  const isDevElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    return !!(
      target.closest('[data-dev-control]') ||
      target.closest('[data-dev-overlay]') ||
      target.closest('[data-dev-canvas]') ||
      target.closest('[data-dev-capture-glass]') ||
      target.closest('[data-dev-resize-handle]') ||
      target.hasAttribute('data-dev-overlay') ||
      target.hasAttribute('data-dev-control') ||
      target.hasAttribute('data-dev-canvas') ||
      target.hasAttribute('data-dev-capture-glass') ||
      target.hasAttribute('data-dev-resize-handle')
    );
  };

  // Find real underlying DOM element beneath the full-screen canvas shield
  const getUnderlyingElementAt = useCallback(
    (clientX: number, clientY: number): { el: HTMLElement; target: AnnotationTarget } | null => {
      const elements = document.elementsFromPoint(clientX, clientY);
      const el = elements.find((node) => !isDevElement(node)) as HTMLElement | null;

      if (!el || el === document.body || el === document.documentElement) {
        return null;
      }

      const target = buildTargetFromElement(el, clientX, clientY);
      return { el, target };
    },
    [buildTargetFromElement]
  );

  // Hardware-accelerated rAF throttlers for 120fps zero-lag drag & hover
  const dragBoxRafRef = useRef<number | null>(null);
  const pendingDragBoxRef = useRef<{ top: number; left: number; width: number; height: number } | null>(null);

  const scheduleDragBoxUpdate = useCallback((box: { top: number; left: number; width: number; height: number }) => {
    pendingDragBoxRef.current = box;
    if (dragBoxRafRef.current === null) {
      dragBoxRafRef.current = requestAnimationFrame(() => {
        if (pendingDragBoxRef.current) {
          setDragBox(pendingDragBoxRef.current);
        }
        dragBoxRafRef.current = null;
      });
    }
  }, []);

  const hoverRafRef = useRef<number | null>(null);
  const pendingHoverCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const scheduleHoverUpdate = useCallback((x: number, y: number) => {
    pendingHoverCoordsRef.current = { x, y };
    if (hoverRafRef.current === null) {
      hoverRafRef.current = requestAnimationFrame(() => {
        if (pendingHoverCoordsRef.current) {
          const res = getUnderlyingElementAt(pendingHoverCoordsRef.current.x, pendingHoverCoordsRef.current.y);
          setHoveredTarget(res ? res.target : null);

          // ॐ Header Toggle Hover Exception:
          // When hovering over App_Header_Button_MobileSidebarToggle, exceptionally trigger sidebar drawer open
          // so user can seamlessly select/annotate elements inside the right Vertical Mobile Drawer!
          if (res?.target.canonicalId === 'App_Header_Button_MobileSidebarToggle') {
            if (!isSidebarOpen && onRequestOpenSidebar) {
              onRequestOpenSidebar();
            }
          }
        }
        hoverRafRef.current = null;
      });
    }
  }, [getUnderlyingElementAt, isSidebarOpen, onRequestOpenSidebar]);

  useEffect(() => {
    return () => {
      if (dragBoxRafRef.current !== null) cancelAnimationFrame(dragBoxRafRef.current);
      if (hoverRafRef.current !== null) cancelAnimationFrame(hoverRafRef.current);
    };
  }, []);

  // Canvas Mouse Handlers (Full-Screen Shield: pointer-events-auto ensures underlying UI receives 0 clicks)
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || activeTarget) return;

    if (tool === 'element') {
      scheduleHoverUpdate(e.clientX, e.clientY);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || activeTarget) return;
    // Don't intercept clicks targeting dev controls (like the Tool Selector Bar or Deck Button)
    if (e.target instanceof Element && e.target.closest('[data-dev-control]')) return;

    e.preventDefault();
    e.stopPropagation();

    if (tool === 'region') {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setDragBox({ top: e.clientY, left: e.clientX, width: 0, height: 0 });

      const onGlobalDragMove = (moveEvt: MouseEvent) => {
        if (!isDraggingRef.current || !dragStartRef.current) return;
        const startX = dragStartRef.current.x;
        const startY = dragStartRef.current.y;
        const left = Math.min(startX, moveEvt.clientX);
        const top = Math.min(startY, moveEvt.clientY);
        const width = Math.abs(moveEvt.clientX - startX);
        const height = Math.abs(moveEvt.clientY - startY);

        scheduleDragBoxUpdate({ top, left, width, height });
      };

      const onGlobalDragUp = (upEvt: MouseEvent) => {
        window.removeEventListener('mousemove', onGlobalDragMove, { capture: true });
        window.removeEventListener('mouseup', onGlobalDragUp, { capture: true });

        if (!isDraggingRef.current || !dragStartRef.current) return;
        isDraggingRef.current = false;

        if (dragBoxRafRef.current !== null) {
          cancelAnimationFrame(dragBoxRafRef.current);
          dragBoxRafRef.current = null;
        }

        const startX = dragStartRef.current.x;
        const startY = dragStartRef.current.y;
        const endX = upEvt.clientX;
        const endY = upEvt.clientY;
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        setDragBox(null);
        dragStartRef.current = null;

        if (width >= 4 || height >= 4) {
          const finalW = Math.max(width, 10);
          const finalH = Math.max(height, 10);
          const centerX = left + width / 2;
          const centerY = top + height / 2;
          const res = getUnderlyingElementAt(centerX, centerY);

          setActiveTarget({
            type: 'region',
            canonicalId: res?.target.canonicalId,
            tag: res?.target.tag || 'region',
            selector: 'Custom Rect Selection',
            rect: {
              top,
              left,
              width: finalW,
              height: finalH,
              pageX: left + window.scrollX,
              pageY: top + window.scrollY,
            },
            componentHint: res?.target.componentHint,
          });
        } else {
          // If user clicked or made a micro-selection, select the underlying element
          const res = getUnderlyingElementAt(endX, endY);
          if (res) {
            setActiveTarget(res.target);
          }
        }
      };

      window.addEventListener('mousemove', onGlobalDragMove, { capture: true });
      window.addEventListener('mouseup', onGlobalDragUp, { capture: true });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || activeTarget) return;
    if (e.target instanceof Element && e.target.closest('[data-dev-control]')) return;

    e.preventDefault();
    e.stopPropagation();

    // Element Selection Click
    if (tool === 'element') {
      const res = getUnderlyingElementAt(e.clientX, e.clientY);
      if (res) {
        if (res.target.canonicalId === 'App_Header_Button_MobileSidebarToggle') {
          if (onToggleMobileSidebar) {
            onToggleMobileSidebar();
            return;
          }
        }
        setActiveTarget(res.target);
        setHoveredTarget(null);
      }
    }
  };

  // Canvas Mobile Touch Handlers (Full Touch-screen selection and ॐ toggle support)
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isActive || activeTarget) return;
    if (e.target instanceof Element && e.target.closest('[data-dev-control]')) return;

    const touch = e.touches[0];
    if (!touch) return;

    if (tool === 'region') {
      isDraggingRef.current = true;
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      setDragBox({ top: touch.clientY, left: touch.clientX, width: 0, height: 0 });
    } else {
      scheduleHoverUpdate(touch.clientX, touch.clientY);
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isActive || activeTarget) return;
    const touch = e.touches[0];
    if (!touch) return;

    if (tool === 'region' && isDraggingRef.current && dragStartRef.current) {
      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;
      const left = Math.min(startX, touch.clientX);
      const top = Math.min(startY, touch.clientY);
      const width = Math.abs(touch.clientX - startX);
      const height = Math.abs(touch.clientY - startY);
      scheduleDragBoxUpdate({ top, left, width, height });
    } else if (tool === 'element') {
      scheduleHoverUpdate(touch.clientX, touch.clientY);
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isActive || activeTarget) return;
    if (e.target instanceof Element && e.target.closest('[data-dev-control]')) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    if (tool === 'region') {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      isDraggingRef.current = false;
      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;
      const endX = touch.clientX;
      const endY = touch.clientY;
      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      setDragBox(null);
      dragStartRef.current = null;

      if (width >= 6 || height >= 6) {
        const finalW = Math.max(width, 10);
        const finalH = Math.max(height, 10);
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const res = getUnderlyingElementAt(centerX, centerY);

        setActiveTarget({
          type: 'region',
          canonicalId: res?.target.canonicalId,
          tag: res?.target.tag || 'region',
          selector: 'Custom Rect Selection',
          rect: {
            top,
            left,
            width: finalW,
            height: finalH,
            pageX: left + window.scrollX,
            pageY: top + window.scrollY,
          },
          componentHint: res?.target.componentHint,
        });
      } else {
        const res = getUnderlyingElementAt(endX, endY);
        if (res) {
          if (res.target.canonicalId === 'App_Header_Button_MobileSidebarToggle') {
            if (onToggleMobileSidebar) {
              onToggleMobileSidebar();
              return;
            }
          }
          setActiveTarget(res.target);
        }
      }
    } else {
      // Element Selection on Touch End
      const res = getUnderlyingElementAt(touch.clientX, touch.clientY);
      if (res) {
        if (res.target.canonicalId === 'App_Header_Button_MobileSidebarToggle') {
          // Second touch / tap on ॐ Header Toggle cleanly toggles off if open
          if (onToggleMobileSidebar) {
            onToggleMobileSidebar();
            return;
          }
        }
        setActiveTarget(res.target);
        setHoveredTarget(null);
      }
    }
  };

  // Cursor Management
  useEffect(() => {
    if (!isActive || activeTarget) {
      document.body.style.cursor = '';
      setHoveredTarget(null);
      setDragBox(null);
      isDraggingRef.current = false;
      dragStartRef.current = null;
      return;
    }

    document.body.style.cursor = tool === 'region' ? 'crosshair' : 'default';

    // Global listener to ensure ESC or outside triggers don't leak
    const handleCaptureClick = (e: MouseEvent) => {
      if (!isActive || activeTarget) return;
      if (e.target instanceof Element && e.target.closest('[data-dev-control]')) return;
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('click', handleCaptureClick, true);
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('click', handleCaptureClick, true);
    };
  }, [isActive, activeTarget, tool]);

  const handleSavedRecord = (rec: AnnotationRecord) => {
    setJustSavedNotification(`Directive copied: ${rec.target.canonicalId || rec.target.selector}`);
    setTimeout(() => setJustSavedNotification(null), 3000);
    setActiveTarget(null);
  };

  // Close toolbar explicitly
  const handleCloseToolBar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleActive(false);
    onHoverChange?.(false);
  };

  const showToolSwitcher = (isActive || isHovered) && !activeTarget;
  const activeAnchor = anchor || getAnchorGeometry();

  return (
    <>
      {/* 1. Bottom-Right Corner: Single Square Icon Deck Button */}
      <div
        data-dev-control="true"
        className="fixed z-[99980] flex items-center gap-2 select-none"
        style={{
          bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          right: 'max(16px, env(safe-area-inset-right, 16px))',
        }}
      >
        {justSavedNotification && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 text-zinc-950 text-xs font-bold shadow-lg animate-in slide-in-from-bottom-2">
            <Check size={13} />
            <span>{justSavedNotification}</span>
          </div>
        )}

        <button
          onClick={onToggleDeck}
          data-ag-id="DevAnnotationOverlay_Launcher_DeckButton"
          className={`relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl border shadow-2xl transition-all active:scale-95 flex items-center justify-center backdrop-blur-md cursor-pointer ${
            isDeckOpen
              ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-amber-500/20 ring-1 ring-amber-400'
              : deckPendingCount >= 15
              ? 'bg-rose-500/30 text-rose-300 border-rose-500/80 ring-2 ring-rose-500/50 animate-pulse'
              : deckPendingCount >= 10
              ? 'bg-amber-500/20 text-amber-400 border-amber-400/80 ring-1 ring-amber-400/50'
              : 'bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border-zinc-700/80 hover:border-amber-400/50'
          }`}
          title={isDeckOpen ? "Close Visual Annotation Deck" : "Open Visual Annotation Deck"}
        >
          <Layers size={18} />
          {deckPendingCount > 0 && !isDeckOpen && (
            <span
              className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-md ring-2 ring-zinc-950 ${
                deckPendingCount >= 15
                  ? 'bg-rose-500 text-white animate-bounce'
                  : deckPendingCount >= 10
                  ? 'bg-amber-500 text-zinc-950 animate-pulse'
                  : 'bg-zinc-800 text-amber-300 border border-amber-500/40'
              }`}
            >
              {deckPendingCount >= 15 ? '!' : deckPendingCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Sleek Compact Horizontal Tool Bar (Positioned to the LEFT of Annotate icon in same horizontal row) */}
      {showToolSwitcher && activeAnchor && (
        <>
          {/* Horizontal Hover Bridge: Spans the 6px gap to guarantee uninterrupted cursor hover from right to left */}
          <div
            data-dev-control="true"
            style={{
              position: 'fixed',
              top: `${activeAnchor.top - 4}px`,
              left: `${activeAnchor.left + activeAnchor.width}px`,
              width: `${activeAnchor.gap + 8}px`,
              height: `${activeAnchor.height + 8}px`,
              zIndex: 99994,
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => onHoverChange?.(true)}
            onMouseLeave={() => onHoverChange?.(false)}
          />

          <div
            data-dev-control="true"
            data-ag-id="DevAnnotationOverlay_ToolBar_Selector"
            style={{
              position: 'fixed',
              top: `${activeAnchor.top}px`,
              left: `${activeAnchor.left}px`,
              width: `${activeAnchor.width}px`,
              height: `${activeAnchor.height}px`,
            }}
            className="z-[99995] flex items-center justify-between p-0.5 rounded-lg bg-zinc-950/95 border border-amber-500/80 shadow-2xl backdrop-blur-md pointer-events-auto select-none animate-in fade-in slide-in-from-right-3 duration-150"
            onMouseEnter={() => onHoverChange?.(true)}
            onMouseLeave={() => onHoverChange?.(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Element Pick Button */}
            <button
              onClick={() => {
                onToggleActive(true);
                setTool('element');
              }}
              data-ag-id="DevAnnotationOverlay_Tool_ElementPick"
              className={`flex-1 h-full flex items-center justify-center gap-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                isActive && tool === 'element'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Element Pick: Hover & click any UI element"
            >
              <MousePointer2 size={12} className="shrink-0" />
              <span className="truncate">Element</span>
            </button>

            <div className="h-3.5 w-px bg-zinc-800 mx-0.5 shrink-0" />

            {/* Area Drag Button */}
            <button
              onClick={() => {
                onToggleActive(true);
                setTool('region');
              }}
              data-ag-id="DevAnnotationOverlay_Tool_AreaDrag"
              className={`flex-1 h-full flex items-center justify-center gap-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                isActive && tool === 'region'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Area Drag: Click & drag custom rectangular box"
            >
              <BoxSelect size={12} className="shrink-0" />
              <span className="truncate">Area</span>
            </button>

            <div className="h-3.5 w-px bg-zinc-800 mx-0.5 shrink-0" />

            {/* Dismiss / Close Button */}
            <button
              onClick={handleCloseToolBar}
              data-ag-id="DevAnnotationOverlay_Tool_Close"
              className="h-full px-1.5 flex items-center justify-center rounded-md text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
              title="Exit Annotation Mode (Esc)"
            >
              <X size={12} />
            </button>
          </div>
        </>
      )}

      {/* 3. Full-Screen Canvas Shield Layer when Active (pointer-events-auto completely shields underlying buttons) */}
      {isActive && !activeTarget && (
        <div
          data-ag-id="DevAnnotation_Canvas_CaptureShield"
          data-dev-canvas="true"
          className="fixed inset-0 z-[99970] pointer-events-auto select-none bg-transparent"
          style={{ cursor: tool === 'region' ? 'crosshair' : 'default' }}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Hover Bounding Box (Element Mode) */}
          {tool === 'element' && hoveredTarget && (
            <div
              data-dev-overlay="hover-box"
              style={{
                position: 'fixed',
                top: `${hoveredTarget.rect.top}px`,
                left: `${hoveredTarget.rect.left}px`,
                width: `${hoveredTarget.rect.width}px`,
                height: `${hoveredTarget.rect.height}px`,
                border: '2px solid #f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                pointerEvents: 'none',
                zIndex: 99975,
                transition: 'all 0.06s ease-out',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-26px',
                  left: '0px',
                  backgroundColor: '#09090b',
                  color: '#fbbf24',
                  border: '1px solid #f59e0b',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{hoveredTarget.canonicalId ? `🎯 ${hoveredTarget.canonicalId}` : hoveredTarget.selector}</span>
                <span style={{ color: '#a1a1aa', fontWeight: 400 }}>
                  {Math.round(hoveredTarget.rect.width)}×{Math.round(hoveredTarget.rect.height)}
                </span>
              </div>
            </div>
          )}

          {/* Drag Selection Box (Region Mode) */}
          {dragBox && (
            <div
              data-dev-overlay="drag-box"
              style={{
                position: 'fixed',
                top: `${dragBox.top}px`,
                left: `${dragBox.left}px`,
                width: `${dragBox.width}px`,
                height: `${dragBox.height}px`,
                border: '2px dashed #38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                pointerEvents: 'none',
                zIndex: 99975,
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: '-22px',
                  right: '0px',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  borderRadius: '3px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {Math.round(dragBox.width)}×{Math.round(dragBox.height)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Active Target Selection View (Frozen Highlight & Draggable Popover) */}
      {isActive && activeTarget && (
        <div data-dev-overlay="active-container" className="fixed inset-0 z-[99980] pointer-events-none select-none">
          {/* Frozen Active Selection Box around target */}
          <div
            data-dev-overlay="active-box"
            style={{
              position: 'fixed',
              top: `${activeTarget.rect.top}px`,
              left: `${activeTarget.rect.left}px`,
              width: `${activeTarget.rect.width}px`,
              height: `${activeTarget.rect.height}px`,
              border: '2px solid #10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              pointerEvents: 'none',
              zIndex: 99985,
              borderRadius: '4px',
            }}
          />

          {/* Draggable & Corner-Resizable Popover Card */}
          <AnnotationPopover
            target={activeTarget}
            onClose={() => setActiveTarget(null)}
            onSaved={handleSavedRecord}
          />
        </div>
      )}
    </>
  );
};
