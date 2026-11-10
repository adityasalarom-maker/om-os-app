import React, { useState, useEffect, useRef, useCallback } from 'react';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export interface UseDraggableResizableOptions {
  initialPos?: { x: number; y: number } | (() => { x: number; y: number });
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function useDraggableResizable({
  initialPos,
  initialSize = { width: 260, height: 280 },
  minWidth = 210,
  minHeight = 180,
  maxWidth = 1000,
  maxHeight = 900,
}: UseDraggableResizableOptions = {}) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof initialPos === 'function') return initialPos();
    if (initialPos) return initialPos;
    const defaultX = Math.max(16, window.innerWidth - initialSize.width - 24);
    return { x: defaultX, y: 96 };
  });

  const [size, setSize] = useState<{ width: number; height: number }>(initialSize);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeCursor, setActiveCursor] = useState<string>('');

  const posRef = useRef(pos);
  const sizeRef = useRef(size);
  posRef.current = pos;
  sizeRef.current = size;

  const isDraggingRef = useRef(false);
  const resizeModeRef = useRef<ResizeDirection | null>(null);
  const startGeometryRef = useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  // requestAnimationFrame Throttler for smooth 60-120fps motion with zero React thrashing
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{
    pos?: { x: number; y: number };
    size?: { width: number; height: number };
  } | null>(null);

  const scheduleUpdate = useCallback(
    (newPos?: { x: number; y: number }, newSize?: { width: number; height: number }) => {
      pendingUpdateRef.current = {
        pos: newPos ?? pendingUpdateRef.current?.pos,
        size: newSize ?? pendingUpdateRef.current?.size,
      };

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingUpdateRef.current?.pos) {
            setPos(pendingUpdateRef.current.pos);
          }
          if (pendingUpdateRef.current?.size) {
            setSize(pendingUpdateRef.current.size);
          }
          pendingUpdateRef.current = null;
          rafRef.current = null;
        });
      }
    },
    []
  );

  const flushPendingUpdate = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingUpdateRef.current?.pos) {
      setPos(pendingUpdateRef.current.pos);
    }
    if (pendingUpdateRef.current?.size) {
      setSize(pendingUpdateRef.current.size);
    }
    pendingUpdateRef.current = null;
  }, []);

  const getCursorForDirection = (dir: ResizeDirection): string => {
    switch (dir) {
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      default:
        return 'default';
    }
  };

  // Drag start handler (attach to header/grab zone)
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, [role="button"]')) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startGeometryRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: posRef.current.x,
      startY: posRef.current.y,
      startW: sizeRef.current.width,
      startH: sizeRef.current.height,
    };
    setIsInteracting(true);
    setActiveCursor('move');
  }, []);

  const handleTouchDragStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, [role="button"]')) return;
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingRef.current = true;
    startGeometryRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: posRef.current.x,
      startY: posRef.current.y,
      startW: sizeRef.current.width,
      startH: sizeRef.current.height,
    };
    setIsInteracting(true);
    setActiveCursor('move');
  }, []);

  // Resize start handler (attach to any of the 8 handles)
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    resizeModeRef.current = direction;
    startGeometryRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: posRef.current.x,
      startY: posRef.current.y,
      startW: sizeRef.current.width,
      startH: sizeRef.current.height,
    };
    setIsInteracting(true);
    setActiveCursor(getCursorForDirection(direction));
  }, []);

  const handleTouchResizeStart = useCallback((e: React.TouchEvent, direction: ResizeDirection) => {
    const touch = e.touches[0];
    if (!touch) return;
    resizeModeRef.current = direction;
    startGeometryRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: posRef.current.x,
      startY: posRef.current.y,
      startW: sizeRef.current.width,
      startH: sizeRef.current.height,
    };
    setIsInteracting(true);
    setActiveCursor(getCursorForDirection(direction));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!startGeometryRef.current) return;
      const { mouseX, mouseY, startX, startY, startW, startH } = startGeometryRef.current;
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;

      // 1. Moving Window
      if (isDraggingRef.current) {
        const curW = sizeRef.current.width;
        const curH = sizeRef.current.height;
        const newX = Math.max(4, Math.min(window.innerWidth - curW - 4, startX + dx));
        const newY = Math.max(4, Math.min(window.innerHeight - curH - 4, startY + dy));
        scheduleUpdate({ x: newX, y: newY });
        return;
      }

      // 2. 8-Way Resizing
      const dir = resizeModeRef.current;
      if (!dir) return;

      const curMinW = minWidth;
      const curMinH = minHeight;
      const curMaxW = Math.min(maxWidth, window.innerWidth - 8);
      const curMaxH = Math.min(maxHeight, window.innerHeight - 8);

      let nextX = startX;
      let nextY = startY;
      let nextW = startW;
      let nextH = startH;

      // Horizontal Resize Logic
      if (dir === 'e' || dir === 'ne' || dir === 'se') {
        nextW = Math.min(curMaxW, Math.max(curMinW, startW + dx));
        if (nextX + nextW > window.innerWidth - 4) {
          nextW = window.innerWidth - 4 - nextX;
        }
      } else if (dir === 'w' || dir === 'nw' || dir === 'sw') {
        const proposedW = Math.min(curMaxW, Math.max(curMinW, startW - dx));
        const deltaW = proposedW - startW;
        const proposedX = startX - deltaW;
        if (proposedX >= 4) {
          nextW = proposedW;
          nextX = proposedX;
        } else {
          nextX = 4;
          nextW = startX + startW - 4;
        }
      }

      // Vertical Resize Logic
      if (dir === 's' || dir === 'se' || dir === 'sw') {
        nextH = Math.min(curMaxH, Math.max(curMinH, startH + dy));
        if (nextY + nextH > window.innerHeight - 4) {
          nextH = window.innerHeight - 4 - nextY;
        }
      } else if (dir === 'n' || dir === 'ne' || dir === 'nw') {
        const proposedH = Math.min(curMaxH, Math.max(curMinH, startH - dy));
        const deltaH = proposedH - startH;
        const proposedY = startY - deltaH;
        if (proposedY >= 4) {
          nextH = proposedH;
          nextY = proposedY;
        } else {
          nextY = 4;
          nextH = startY + startH - 4;
        }
      }

      scheduleUpdate({ x: nextX, y: nextY }, { width: nextW, height: nextH });
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      handleMouseMove({ clientX, clientY } as MouseEvent);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current && !resizeModeRef.current) return;
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = (e?: Event) => {
      if (isDraggingRef.current || resizeModeRef.current) {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();
      }
      isDraggingRef.current = false;
      resizeModeRef.current = null;
      startGeometryRef.current = null;
      setIsInteracting(false);
      setActiveCursor('');
      flushPendingUpdate();
    };

    if (isInteracting) {
      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
      window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: true });
      window.addEventListener('touchend', handleMouseUp, { capture: true });
      window.addEventListener('touchcancel', handleMouseUp, { capture: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      window.removeEventListener('touchend', handleMouseUp, { capture: true });
      window.removeEventListener('touchcancel', handleMouseUp, { capture: true });
    };
  }, [isInteracting, maxWidth, maxHeight, minWidth, minHeight, scheduleUpdate, flushPendingUpdate]);

  // Keep window in bounds if browser window resizes
  useEffect(() => {
    const handleWindowResize = () => {
      setPos((prev) => ({
        x: Math.max(4, Math.min(window.innerWidth - sizeRef.current.width - 4, prev.x)),
        y: Math.max(4, Math.min(window.innerHeight - sizeRef.current.height - 4, prev.y)),
      }));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  return {
    pos,
    size,
    setPos,
    setSize,
    isInteracting,
    activeCursor,
    handleDragStart,
    handleTouchDragStart,
    handleResizeStart,
    handleTouchResizeStart,
  };
}

/**
 * 8-Way Perimeter Resize Handles Component
 * Renders all 4 edges (North, South, East, West) and 4 corners (NW, NE, SW, SE)
 */
export const ResizeHandles: React.FC<{
  onResizeStart: (e: React.MouseEvent, dir: ResizeDirection) => void;
  onTouchResizeStart?: (e: React.TouchEvent, dir: ResizeDirection) => void;
  accentClass?: string;
}> = ({ onResizeStart, onTouchResizeStart, accentClass = 'hover:bg-amber-400/50' }) => {
  return (
    <>
      {/* 4 Cardinal Edges (Sides) */}
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "n")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "n")}
        className={`absolute -top-1.5 left-4 right-4 h-3 cursor-ns-resize z-30 transition-colors ${accentClass}`}
        title="Resize Top Side"
      />
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "s")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "s")}
        className={`absolute -bottom-1.5 left-4 right-4 h-3 cursor-ns-resize z-30 transition-colors ${accentClass}`}
        title="Resize Bottom Side"
      />
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "w")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "w")}
        className={`absolute top-4 bottom-4 -left-1.5 w-3 cursor-ew-resize z-30 transition-colors ${accentClass}`}
        title="Resize Left Side"
      />
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "e")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "e")}
        className={`absolute top-4 bottom-4 -right-1.5 w-3 cursor-ew-resize z-30 transition-colors ${accentClass}`}
        title="Resize Right Side"
      />

      {/* 4 Diagonal Corners */}
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "nw")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "nw")}
        className={`absolute -top-2 -left-2 w-4 h-4 cursor-nwse-resize z-40 rounded-tl transition-colors ${accentClass}`}
        title="Resize Top-Left Corner"
      />
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "ne")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "ne")}
        className={`absolute -top-2 -right-2 w-4 h-4 cursor-nesw-resize z-40 rounded-tr transition-colors ${accentClass}`}
        title="Resize Top-Right Corner"
      />
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "sw")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "sw")}
        className={`absolute -bottom-2 -left-2 w-4 h-4 cursor-nesw-resize z-40 rounded-bl transition-colors ${accentClass}`}
        title="Resize Bottom-Left Corner"
      />
      <div
        data-dev-resize-handle="true" 
        onMouseDown={(e) => onResizeStart(e, "se")}
        onTouchStart={(e) => onTouchResizeStart?.(e, "se")}
        className={`absolute -bottom-2 -right-2 w-4 h-4 cursor-nwse-resize z-40 rounded-br transition-colors flex items-center justify-center text-zinc-500 ${accentClass}`}
        title="Resize Bottom-Right Corner"
      >
        <span className="text-[7.5px] leading-none select-none">◢</span>
      </div>
    </>
  );
};

/**
 * Capture Glass Overlay
 * Prevents event leakage into underlying buttons/iframes during drag or resize gestures
 */
export const CaptureGlass: React.FC<{
  isActive: boolean;
  cursor: string;
}> = ({ isActive, cursor }) => {
  if (!isActive) return null;
  return (
    <div
      data-dev-capture-glass="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        cursor: cursor || 'default',
        userSelect: 'none',
        backgroundColor: 'transparent',
        pointerEvents: 'auto',
      }}
      onMouseMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
};
