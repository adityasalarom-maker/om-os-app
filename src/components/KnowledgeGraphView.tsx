import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  type GraphNode, 
  type GraphLink, 
  buildKnowledgeGraph, 
  type GraphData 
} from '../services/graphEngine';
import { type KnowledgeItem } from '../db';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Search, 
  Play, 
  Pause, 
  Layers, 
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react';

interface KnowledgeGraphViewProps {
  notes: KnowledgeItem[];
  onSelectNote: (noteId: string) => void;
  activeNoteId?: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  Concept: '#f59e0b',  // Amber
  Note: '#6366f1',     // Indigo
  Source: '#10b981',   // Emerald
  Quote: '#a855f7',    // Purple
  Bookmark: '#06b6d4', // Cyan
  Question: '#f43f5e'  // Rose
};

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  notes,
  onSelectNote,
  activeNoteId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Graph data & simulation state
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Viewport transforms (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Raw Graph Data
  const rawGraphData = useMemo(() => buildKnowledgeGraph(notes), [notes]);

  // Nodes and Links state mutable for simulation
  const simNodesRef = useRef<GraphNode[]>([]);
  const simLinksRef = useRef<GraphLink[]>([]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return rawGraphData.nodes.filter(node => {
      if (filterType !== 'All' && node.type !== filterType) return false;
      return true;
    });
  }, [rawGraphData, filterType]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return rawGraphData.links.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));
  }, [rawGraphData, filteredNodes]);

  // Initialize or update simulation nodes with existing positions preserved
  useEffect(() => {
    const prevPositions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    for (const node of simNodesRef.current) {
      if (node.x !== undefined && node.y !== undefined) {
        prevPositions.set(node.id, { x: node.x, y: node.y, vx: node.vx || 0, vy: node.vy || 0 });
      }
    }

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const initializedNodes = filteredNodes.map((n, idx) => {
      const prev = prevPositions.get(n.id);
      const angle = (idx / filteredNodes.length) * Math.PI * 2;
      const dist = 80 + Math.random() * 160;

      return {
        ...n,
        x: prev ? prev.x : width / 2 + Math.cos(angle) * dist,
        y: prev ? prev.y : height / 2 + Math.sin(angle) * dist,
        vx: prev ? prev.vx : (Math.random() - 0.5) * 2,
        vy: prev ? prev.vy : (Math.random() - 0.5) * 2,
        radius: Math.max(6, Math.min(22, 6 + n.linkCount * 2.5)),
        color: TYPE_COLORS[n.type] || '#6366f1'
      };
    });

    simNodesRef.current = initializedNodes;
    simLinksRef.current = filteredLinks;
  }, [filteredNodes, filteredLinks]);

  // Main 60 FPS Physics Simulation & Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Physics Step (if simulation is active)
      if (isSimulating) {
        const nodes = simNodesRef.current;
        const links = simLinksRef.current;
        const nodeMap = new Map<string, GraphNode>();
        nodes.forEach(n => nodeMap.set(n.id, n));

        // Physics parameters
        const repulsionK = 750;
        const springK = 0.045;
        const springLength = 110;
        const centerGravity = 0.015;
        const damping = 0.88;

        // Repulsion between all node pairs
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = (n1.x || 0) - (n2.x || 0);
            const dy = (n1.y || 0) - (n2.y || 0);
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < 350) {
              const force = repulsionK / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (n1 !== draggedNodeRef.current) {
                n1.vx = (n1.vx || 0) + fx;
                n1.vy = (n1.vy || 0) + fy;
              }
              if (n2 !== draggedNodeRef.current) {
                n2.vx = (n2.vx || 0) - fx;
                n2.vy = (n2.vy || 0) - fy;
              }
            }
          }
        }

        // Spring Attraction along links
        for (const link of links) {
          const src = nodeMap.get(link.source);
          const tgt = nodeMap.get(link.target);
          if (src && tgt) {
            const dx = (tgt.x || 0) - (src.x || 0);
            const dy = (tgt.y || 0) - (src.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const displacement = dist - springLength;
            const force = displacement * springK;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (src !== draggedNodeRef.current) {
              src.vx = (src.vx || 0) + fx;
              src.vy = (src.vy || 0) + fy;
            }
            if (tgt !== draggedNodeRef.current) {
              tgt.vx = (tgt.vx || 0) - fx;
              tgt.vy = (tgt.vy || 0) - fy;
            }
          }
        }

        // Centering Gravity & Velocity Verlet update
        const centerX = width / 2;
        const centerY = height / 2;

        for (const node of nodes) {
          if (node === draggedNodeRef.current) continue;

          // Pull towards center
          const cdx = centerX - (node.x || 0);
          const cdy = centerY - (node.y || 0);
          node.vx = (node.vx || 0) + cdx * centerGravity;
          node.vy = (node.vy || 0) + cdy * centerGravity;

          // Apply damping & update position
          node.vx = (node.vx || 0) * damping;
          node.vy = (node.vy || 0) * damping;
          node.x = (node.x || 0) + (node.vx || 0);
          node.y = (node.y || 0) + (node.vy || 0);
        }
      }

      // 2. Clear Screen
      ctx.clearRect(0, 0, width, height);

      // Save state and apply Pan & Zoom transform
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const nodes = simNodesRef.current;
      const links = simLinksRef.current;
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach(n => nodeMap.set(n.id, n));

      // Draw Grid dots in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const gridSize = 40;
      const startX = -pan.x / zoom;
      const startY = -pan.y / zoom;
      const endX = startX + width / zoom;
      const endY = startY + height / zoom;

      for (let gx = Math.floor(startX / gridSize) * gridSize; gx < endX; gx += gridSize) {
        for (let gy = Math.floor(startY / gridSize) * gridSize; gy < endY; gy += gridSize) {
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
      }

      // 3. Draw Links (Edges)
      for (const link of links) {
        const src = nodeMap.get(link.source);
        const tgt = nodeMap.get(link.target);
        if (!src || !tgt) continue;

        const isConnectedToHover = hoveredNode && (src.id === hoveredNode.id || tgt.id === hoveredNode.id);
        const isConnectedToActive = activeNoteId && (src.id === activeNoteId || tgt.id === activeNoteId);

        ctx.beginPath();
        ctx.moveTo(src.x || 0, src.y || 0);
        ctx.lineTo(tgt.x || 0, tgt.y || 0);

        if (isConnectedToHover) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.lineWidth = 2.2 / zoom;
        } else if (isConnectedToActive) {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.75)';
          ctx.lineWidth = 1.8 / zoom;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = 1.0 / zoom;
        }
        ctx.stroke();
      }

      // 4. Draw Nodes (Vertices)
      for (const node of nodes) {
        const x = node.x || 0;
        const y = node.y || 0;
        const radius = node.radius || 8;
        const isHovered = hoveredNode?.id === node.id;
        const isActive = activeNoteId === node.id;
        const matchesSearch = searchQuery.trim() && node.label.toLowerCase().includes(searchQuery.toLowerCase());

        // Radial glow halo for active / hovered / central nodes
        if (isHovered || isActive || matchesSearch || node.linkCount >= 3) {
          const glowRadius = radius * (isHovered ? 2.4 : 1.8);
          const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
          gradient.addColorStop(0, node.color || '#6366f1');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Main Node Body Circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color || '#6366f1';
        ctx.fill();

        // Node Border Outline
        ctx.lineWidth = (isHovered || isActive || matchesSearch ? 2.5 : 1.2) / zoom;
        ctx.strokeStyle = isHovered 
          ? '#ffffff' 
          : isActive 
            ? '#38bdf8' 
            : matchesSearch 
              ? '#f59e0b' 
              : 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        // Render Labels when zoomed in or on hover/active/matching
        const shouldShowLabel = zoom >= 0.75 || isHovered || isActive || matchesSearch || node.linkCount >= 2;
        if (shouldShowLabel) {
          ctx.font = `${Math.max(10, Math.min(14, 11 / zoom))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Background pill for label legibility
          const textMetrics = ctx.measureText(node.label);
          const textW = textMetrics.width;
          const textH = 12 / zoom;
          const padX = 4 / zoom;
          const padY = 2 / zoom;

          ctx.fillStyle = 'rgba(15, 17, 23, 0.85)';
          ctx.fillRect(x - textW / 2 - padX, y + radius + 3 / zoom - padY, textW + padX * 2, textH + padY * 2);

          ctx.fillStyle = isHovered ? '#ffffff' : matchesSearch ? '#fcd34d' : 'rgba(226, 232, 240, 0.9)';
          ctx.fillText(node.label, x, y + radius + 3 / zoom);
        }
      }

      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isSimulating, zoom, pan, hoveredNode, activeNoteId, searchQuery]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Transform Screen Point to Canvas World Coordinates
  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  };

  // Find node under mouse pointer
  const getNodeAtPosition = (worldX: number, worldY: number): GraphNode | null => {
    const nodes = simNodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = (node.x || 0) - worldX;
      const dy = (node.y || 0) - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= (node.radius || 8) + 4) {
        return node;
      }
    }
    return null;
  };

  // Mouse & Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    const clickedNode = getNodeAtPosition(world.x, world.y);

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      isDraggingRef.current = false;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = world.x;
      draggedNodeRef.current.y = world.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    } else {
      const node = getNodeAtPosition(world.x, world.y);
      setHoveredNode(node);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = screenToWorld(screenX, screenY);
        const node = getNodeAtPosition(world.x, world.y);
        if (node && node.id === draggedNodeRef.current.id && !node.isVirtual) {
          onSelectNote(node.id);
        }
      }
      draggedNodeRef.current = null;
    }
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(0.2, Math.min(3.5, zoom * zoomFactor));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
    });
    setZoom(newZoom);
  };

  const handleResetView = () => {
    setZoom(1.0);
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[620px] bg-[#0c0e14] border border-[#23283b] rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none">
      
      {/* Top Toolbar */}
      <div className="h-14 bg-[#141622]/90 backdrop-blur-md border-b border-[#24293d] px-4 flex items-center justify-between z-10 gap-3 flex-wrap">
        
        {/* Left: Search input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Highlight concept in graph..."
              className="bg-[#10121a] border border-[#2b3147] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="hidden md:flex items-center gap-1">
            {['All', 'Concept', 'Note', 'Source', 'Quote'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  filterType === type 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-[#191c2b] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Controls (Zoom, Freeze, Reset) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(z => Math.min(3.5, z * 1.2))}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-[#191c2b] hover:bg-[#23283c] text-gray-400 hover:text-white border border-white/5 transition-colors"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-[#191c2b] hover:bg-[#23283c] text-gray-400 hover:text-white border border-white/5 transition-colors"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={handleResetView}
            title="Reset Center & Zoom"
            className="p-1.5 rounded-lg bg-[#191c2b] hover:bg-[#23283c] text-gray-400 hover:text-white border border-white/5 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            title={isSimulating ? 'Freeze Physics' : 'Resume Physics'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSimulating 
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' 
                : 'bg-amber-600/20 border-amber-500/40 text-amber-300'
            }`}
          >
            {isSimulating ? <Pause size={15} /> : <Play size={15} />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Floating Node Details Tooltip */}
        {hoveredNode && (
          <div 
            className="absolute top-4 left-4 bg-[#141622]/95 border border-[#2b3147] rounded-xl p-3 shadow-xl backdrop-blur-md pointer-events-none max-w-xs space-y-1.5 z-20"
          >
            <div className="flex items-center justify-between gap-2">
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white font-mono uppercase"
                style={{ backgroundColor: hoveredNode.color || '#6366f1' }}
              >
                {hoveredNode.type}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {hoveredNode.linkCount} {hoveredNode.linkCount === 1 ? 'connection' : 'connections'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white leading-snug">
              {hoveredNode.label}
            </h4>
            <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
              <ExternalLink size={10} />
              <span>{hoveredNode.isVirtual ? 'Virtual concept (Click to instantiate)' : 'Click node to open note'}</span>
            </div>
          </div>
        )}

        {/* Legend Overlay at Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-[#12141e]/85 backdrop-blur-md border border-white/5 rounded-xl px-3 py-2 text-[10px] text-gray-400 flex items-center gap-3 shadow-lg z-10 pointer-events-none">
          <span className="font-semibold text-gray-300">Legend:</span>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span>{type}</span>
            </div>
          ))}
        </div>

        {/* Graph Stats Overlay at Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-[#12141e]/85 backdrop-blur-md border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-mono text-gray-400 flex items-center gap-2 shadow-lg z-10 pointer-events-none">
          <span>Nodes: <strong className="text-white">{filteredNodes.length}</strong></span>
          <span>•</span>
          <span>Edges: <strong className="text-indigo-400">{filteredLinks.length}</strong></span>
          <span>•</span>
          <span>Zoom: <strong className="text-gray-300">{Math.round(zoom * 100)}%</strong></span>
        </div>
      </div>
    </div>
  );
};
