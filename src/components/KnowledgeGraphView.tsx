import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  type GraphNode, 
  type GraphLink, 
  buildKnowledgeGraph 
} from '../services/graphEngine';
import { type KnowledgeItem } from '../db';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Play, 
  Pause, 
  ExternalLink,
  X,
  Target,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface KnowledgeGraphViewProps {
  notes: KnowledgeItem[];
  onSelectNote: (noteId: string) => void;
  onOpenInEditor?: (noteId: string) => void;
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
  onOpenInEditor,
  activeNoteId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dprRef = useRef<number>(window.devicePixelRatio || 1);

  // Graph data & simulation state
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(activeNoteId || null);

  // Viewport transforms (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse & Touch interaction refs
  const isDraggingCanvasRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const touchPinchDistRef = useRef<number | null>(null);

  // Raw Graph Data
  const rawGraphData = useMemo(() => buildKnowledgeGraph(notes), [notes]);

  // Nodes and Links state mutable for simulation
  const simNodesRef = useRef<GraphNode[]>([]);
  const simLinksRef = useRef<GraphLink[]>([]);

  // Keep selected node synced if activeNoteId changes externally
  useEffect(() => {
    if (activeNoteId) {
      setSelectedNodeId(activeNoteId);
    }
  }, [activeNoteId]);

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

  // Selected note details lookup
  const selectedNote = useMemo(() => {
    if (!selectedNodeId) return null;
    return notes.find(n => n.id === selectedNodeId) || null;
  }, [notes, selectedNodeId]);

  // Connected neighbors for the selected node
  const selectedNeighbors = useMemo(() => {
    if (!selectedNodeId) return [];
    const neighborIds = new Set<string>();
    filteredLinks.forEach(link => {
      if (link.source === selectedNodeId) neighborIds.add(link.target);
      if (link.target === selectedNodeId) neighborIds.add(link.source);
    });
    return filteredNodes.filter(n => neighborIds.has(n.id));
  }, [selectedNodeId, filteredLinks, filteredNodes]);

  // Initialize or update simulation nodes with dispersed positions
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
      const angle = (idx / Math.max(1, filteredNodes.length)) * Math.PI * 2;
      // Dispersed starting layout to prevent central clutter
      const dist = 140 + (idx % 3) * 65 + Math.random() * 50;

      return {
        ...n,
        x: prev ? prev.x : width / 2 + Math.cos(angle) * dist,
        y: prev ? prev.y : height / 2 + Math.sin(angle) * dist,
        vx: prev ? prev.vx : (Math.random() - 0.5) * 1.5,
        vy: prev ? prev.vy : (Math.random() - 0.5) * 1.5,
        radius: Math.max(8, Math.min(24, 8 + n.linkCount * 3)),
        color: TYPE_COLORS[n.type] || '#6366f1'
      };
    });

    simNodesRef.current = initializedNodes;
    simLinksRef.current = filteredLinks;
  }, [filteredNodes, filteredLinks]);

  // High-DPI canvas resizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        dprRef.current = dpr;
        const rect = containerRef.current.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        canvasRef.current.width = Math.floor(w * dpr);
        canvasRef.current.height = Math.floor(h * dpr);
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Main 60 FPS Physics Simulation & Retina Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      const dpr = dprRef.current || 1;
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;

      // 1. Physics Step
      if (isSimulating) {
        const nodes = simNodesRef.current;
        const links = simLinksRef.current;
        const nodeMap = new Map<string, GraphNode>();
        nodes.forEach(n => nodeMap.set(n.id, n));

        // Well-tuned physics parameters for crisp dispersion
        const repulsionK = 3200;
        const springK = 0.035;
        const springLength = 170;
        const centerGravity = 0.0035; // Gentle center pull, avoids collapse
        const damping = 0.86;

        // Repulsion & collision avoidance between node pairs
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = (n1.x || 0) - (n2.x || 0);
            const dy = (n1.y || 0) - (n2.y || 0);
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < 420) {
              const force = repulsionK / (distSq + 150);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              // Collision clearance push
              const minClearance = (n1.radius || 10) + (n2.radius || 10) + 65;
              let collisionFx = 0;
              let collisionFy = 0;
              if (dist < minClearance) {
                const overlap = (minClearance - dist) * 0.12;
                collisionFx = (dx / dist) * overlap;
                collisionFy = (dy / dist) * overlap;
              }

              if (n1 !== draggedNodeRef.current) {
                n1.vx = (n1.vx || 0) + fx + collisionFx;
                n1.vy = (n1.vy || 0) + fy + collisionFy;
              }
              if (n2 !== draggedNodeRef.current) {
                n2.vx = (n2.vx || 0) - fx - collisionFx;
                n2.vy = (n2.vy || 0) - fy - collisionFy;
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

        // Centering Gravity & Velocity Verlet
        const centerX = cssWidth / 2;
        const centerY = cssHeight / 2;

        for (const node of nodes) {
          if (node === draggedNodeRef.current) continue;

          const cdx = centerX - (node.x || 0);
          const cdy = centerY - (node.y || 0);
          node.vx = (node.vx || 0) + cdx * centerGravity;
          node.vy = (node.vy || 0) + cdy * centerGravity;

          node.vx = (node.vx || 0) * damping;
          node.vy = (node.vy || 0) * damping;
          node.x = (node.x || 0) + (node.vx || 0);
          node.y = (node.y || 0) + (node.vy || 0);
        }
      }

      // 2. Clear Screen at Physical Resolution
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save state and apply High-DPI Scale + Viewport Pan/Zoom
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const nodes = simNodesRef.current;
      const links = simLinksRef.current;
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach(n => nodeMap.set(n.id, n));

      // Draw Grid dots in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const gridSize = 40;
      const startX = -pan.x / zoom;
      const startY = -pan.y / zoom;
      const endX = startX + cssWidth / zoom;
      const endY = startY + cssHeight / zoom;

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

        const isHoveredEdge = hoveredNode && (src.id === hoveredNode.id || tgt.id === hoveredNode.id);
        const isSelectedEdge = selectedNodeId && (src.id === selectedNodeId || tgt.id === selectedNodeId);

        ctx.beginPath();
        ctx.moveTo(src.x || 0, src.y || 0);
        ctx.lineTo(tgt.x || 0, tgt.y || 0);

        if (isHoveredEdge) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.lineWidth = 2.4 / zoom;
        } else if (isSelectedEdge) {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.85)';
          ctx.lineWidth = 2.0 / zoom;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
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
        const isSelected = selectedNodeId === node.id;
        const matchesSearch = searchQuery.trim() !== '' && node.label.toLowerCase().includes(searchQuery.toLowerCase());

        // Radial glow halo for active / hovered / central nodes
        if (isHovered || isSelected || matchesSearch || node.linkCount >= 3) {
          const glowRadius = radius * (isHovered || isSelected ? 2.5 : 1.8);
          const gradient = ctx.createRadialGradient(x, y, radius * 0.4, x, y, glowRadius);
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
        ctx.lineWidth = (isHovered || isSelected || matchesSearch ? 2.5 : 1.2) / zoom;
        ctx.strokeStyle = isSelected 
          ? '#38bdf8' 
          : isHovered 
            ? '#ffffff' 
            : matchesSearch 
              ? '#f59e0b' 
              : 'rgba(255, 255, 255, 0.35)';
        ctx.stroke();

        // Render Labels: Truncated for resting nodes, full for active/hovered
        const shouldShowLabel = zoom >= 0.55 || isHovered || isSelected || matchesSearch;
        if (shouldShowLabel) {
          let displayLabel = node.label;
          if (!isHovered && !isSelected && !matchesSearch && displayLabel.length > 22) {
            displayLabel = displayLabel.slice(0, 20) + '...';
          }

          ctx.font = '600 11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textMetrics = ctx.measureText(displayLabel);
          const textW = textMetrics.width;
          const textH = 14;
          const padX = 6;
          const padY = 3;
          const labelY = y + radius + 11;

          const pillX = x - textW / 2 - padX;
          const pillY = labelY - textH / 2 - padY;
          const pillW = textW + padX * 2;
          const pillH = textH + padY * 2;

          ctx.fillStyle = isSelected 
            ? 'rgba(20, 24, 38, 0.95)' 
            : isHovered 
              ? 'rgba(15, 23, 42, 0.95)' 
              : 'rgba(15, 17, 23, 0.88)';

          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(pillX, pillY, pillW, pillH, 4);
          } else {
            ctx.rect(pillX, pillY, pillW, pillH);
          }
          ctx.fill();

          ctx.lineWidth = isSelected ? 1.5 : 1;
          ctx.strokeStyle = isSelected 
            ? '#38bdf8' 
            : isHovered 
              ? '#818cf8' 
              : 'rgba(255, 255, 255, 0.15)';
          ctx.stroke();

          ctx.fillStyle = isSelected 
            ? '#38bdf8' 
            : isHovered 
              ? '#ffffff' 
              : matchesSearch 
                ? '#fcd34d' 
                : 'rgba(226, 232, 240, 0.9)';
          ctx.fillText(displayLabel, x, labelY);
        }
      }

      ctx.restore();
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [isSimulating, zoom, pan, hoveredNode, selectedNodeId, searchQuery]);

  // Transform Screen Point to Canvas World Coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Find node under pointer
  const getNodeAtPosition = useCallback((worldX: number, worldY: number): GraphNode | null => {
    const nodes = simNodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = (node.x || 0) - worldX;
      const dy = (node.y || 0) - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= (node.radius || 8) + 6) {
        return node;
      }
    }
    return null;
  }, []);

  // Center on a specific node
  const handleCenterNode = (node: GraphNode) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    setPan({
      x: width / 2 - (node.x || 0) * zoom,
      y: height / 2 - (node.y || 0) * zoom
    });
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    const clickedNode = getNodeAtPosition(world.x, world.y);

    dragStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      isDraggingCanvasRef.current = false;
    } else {
      isDraggingCanvasRef.current = true;
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
    } else if (isDraggingCanvasRef.current) {
      setPan(prev => ({
        x: prev.x + (e.clientX - dragStartPosRef.current.x),
        y: prev.y + (e.clientY - dragStartPosRef.current.y)
      }));
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const node = getNodeAtPosition(world.x, world.y);
      setHoveredNode(node);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? 'pointer' : 'grab';
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const moveDist = Math.hypot(
      e.clientX - dragStartPosRef.current.x,
      e.clientY - dragStartPosRef.current.y
    );

    // If movement < 5px, treat as a clean click/tap
    if (moveDist < 5) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = screenToWorld(screenX, screenY);
        const clickedNode = getNodeAtPosition(world.x, world.y);

        if (clickedNode) {
          setSelectedNodeId(clickedNode.id);
          onSelectNote(clickedNode.id);
        } else {
          // Clicked empty canvas -> deselect
          setSelectedNodeId(null);
        }
      }
    }

    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
  };

  // Touch Handlers for Mobile & Windows Touchscreens
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const world = screenToWorld(screenX, screenY);
      const node = getNodeAtPosition(world.x, world.y);

      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      if (node) {
        draggedNodeRef.current = node;
        isDraggingCanvasRef.current = false;
      } else {
        isDraggingCanvasRef.current = true;
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom initialization
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchPinchDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const world = screenToWorld(screenX, screenY);

      if (draggedNodeRef.current) {
        draggedNodeRef.current.x = world.x;
        draggedNodeRef.current.y = world.y;
        draggedNodeRef.current.vx = 0;
        draggedNodeRef.current.vy = 0;
      } else if (isDraggingCanvasRef.current) {
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    } else if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      // Pinch zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = currentDist / touchPinchDistRef.current;
      setZoom(z => Math.max(0.2, Math.min(3.5, z * factor)));
      touchPinchDistRef.current = currentDist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const moveDist = Math.hypot(
        touch.clientX - touchStartPosRef.current.x,
        touch.clientY - touchStartPosRef.current.y
      );

      // Clean tap detected (< 6px movement)
      if (moveDist < 6) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const screenX = touch.clientX - rect.left;
          const screenY = touch.clientY - rect.top;
          const world = screenToWorld(screenX, screenY);
          const tappedNode = getNodeAtPosition(world.x, world.y);

          if (tappedNode) {
            setSelectedNodeId(tappedNode.id);
            onSelectNote(tappedNode.id);
          } else {
            setSelectedNodeId(null);
          }
        }
      }
    }

    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
    touchPinchDistRef.current = null;
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
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
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
              className="bg-[#10121a] border border-[#2b3147] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-60"
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
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* In-Graph Inspector Card: Remains in graph, no accidental exits */}
        {selectedNote && (
          <div className="absolute top-4 right-4 bg-[#141622]/95 border border-[#2b3147] rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-sm w-80 space-y-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-2 border-b border-[#252a3d] pb-2.5">
              <div className="flex items-center gap-1.5">
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white font-mono uppercase"
                  style={{ backgroundColor: TYPE_COLORS[selectedNote.type] || '#6366f1' }}
                >
                  {selectedNote.type}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {selectedNeighbors.length} connection{selectedNeighbors.length === 1 ? '' : 's'}
                </span>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Dismiss Inspector"
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white leading-snug">
                {selectedNote.title}
              </h4>
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedNote.tags.map(t => (
                    <span key={t} className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selectedNote.content && (
              <div className="text-[11px] text-gray-300 bg-[#0f111a] p-2.5 rounded-xl border border-white/5 max-h-24 overflow-y-auto leading-relaxed">
                {selectedNote.content.slice(0, 180)}...
              </div>
            )}

            {/* Connected Neighbors list */}
            {selectedNeighbors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                  <LinkIcon size={11} /> Connected Nodes
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {selectedNeighbors.map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setSelectedNodeId(n.id);
                        onSelectNote(n.id);
                        handleCenterNode(n);
                      }}
                      className="text-[10px] bg-[#1a1d2c] hover:bg-indigo-600/30 text-gray-300 hover:text-indigo-200 border border-white/10 px-2 py-0.5 rounded-lg transition-all text-left truncate max-w-full"
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#252a3d]">
              {onOpenInEditor && (
                <button
                  onClick={() => onOpenInEditor(selectedNote.id)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                >
                  <ExternalLink size={13} />
                  <span>Open in Dual-Pane</span>
                </button>
              )}
              {simNodesRef.current.find(n => n.id === selectedNote.id) && (
                <button
                  onClick={() => {
                    const node = simNodesRef.current.find(n => n.id === selectedNote.id);
                    if (node) handleCenterNode(node);
                  }}
                  title="Center in View"
                  className="bg-[#1e2235] hover:bg-[#282d47] text-gray-300 hover:text-white p-2 rounded-xl border border-white/10 transition-colors"
                >
                  <Target size={14} />
                </button>
              )}
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
