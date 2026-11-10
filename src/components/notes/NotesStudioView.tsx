// File: om_os_app/src/components/notes/NotesStudioView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
  Pin,
  Search,
  Undo2,
  Redo2,
  Copy,
  Check,
  Columns2,
  Columns3,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FolderTree,
  Table,
  WrapText,
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  Clock,
  Tag,
  Archive,
  Download,
  Trash2,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  CheckSquare,
  Square,
  Layers,
  Settings,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ListOrdered,
  Quote,
  SeparatorHorizontal,
  FolderPlus,
  FileText,
  FileCheck,
  Strikethrough,
  Filter,
  CheckCheck,
  Menu,
  PenTool,
  MessageSquare,
  CornerDownRight,
  SplitSquareVertical,
  SplitSquareHorizontal
} from 'lucide-react';
import {
  type StudioNote,
  type NoteDomain,
  type DailyPulseCategory,
  type StudioViewStyle,
  type SplitLayoutMode,
  type CollapsibleGroupConfig,
  type CopyablePromptBlock,
  type ScratchpadTableRow,
  type ChecklistItem,
  type TargetFolderEntry,
  type StudioAnnotation,
  matchesNoteSearch,
  buildPureCodeAiPrompt,
  buildAnnotationAiPrompt
} from '../../types/notesStudio';

const STORAGE_KEY = 'om_os_notes_studio_v2';
const GROUPS_STORAGE_KEY = 'om_os_notes_studio_groups_v2';
const LAYOUT_DIMS_KEY = 'om_os_notes_studio_layout_v1';
const MAX_OPEN_TABS = 20;
const MAX_UNDO_STEPS = 5;

// Upload 1 Default Collapsible Groups
const INITIAL_COLLAPSIBLE_GROUPS: CollapsibleGroupConfig[] = [
  {
    id: 'grp-knowledge-views',
    icon: '🧠',
    title: 'Knowledge Data & Views',
    whatIsHereBrief:
      'What is here: the canonical Knowledge database and its library views; collapsed until needed.',
    tabs: [
      {
        id: 'tab-lib',
        label: 'Library',
        icon: '📚',
        summaryLine: 'All Canonical Prompts · Protocols · Active Project Notes.'
      },
      {
        id: 'tab-think',
        label: 'Thinking',
        icon: '💡',
        summaryLine: 'Ideas Inbox · Key Learnings · Open Questions.'
      },
      {
        id: 'tab-conn',
        label: 'Connection',
        icon: '🔗',
        summaryLine: 'Cross-Model Synthesis · YouTube Verbatim · Chat Extracts.'
      }
    ]
  },
  {
    id: 'grp-content-model',
    icon: '📁',
    title: 'Knowledge Content Model',
    whatIsHereBrief:
      'What is here: the structured entry types already defined for the knowledge system.',
    tabs: [
      {
        id: 'tab-sources',
        label: 'Sources & Notes',
        icon: '📄',
        summaryLine: 'Source · Note · Verbatim Transcripts · PDF Extracts.'
      },
      {
        id: 'tab-concepts',
        label: 'Concepts & Refer',
        icon: '🧩',
        summaryLine: 'Taxonomy · Canonicals · Vedic & Agentic Terminology.'
      }
    ]
  }
];

// Rich Seed Notes demonstrating all domains
const SEED_NOTES: StudioNote[] = [
  {
    id: 'note-1-prompts',
    title: '01 · AI Prompts & Sovereign Protocols',
    briefBeneath: 'Active engineering prompts, system rules, and copyable prompt cards for LLM pair programming.',
    domain: 'AI_ENGINE',
    mainCategory: 'AI_System_Directives',
    subCategory: 'Prompt_Library',
    dailyCategory: 'Daily_AI',
    tags: ['ai-prompts', 'protocols', 'antigravity', 'spec-driven'],
    properties: {
      Model_Target: 'Claude 3.7 / Gemini 2.5 Pro',
      Execution_Mode: 'Spec-on-Disk (TASK-XX.md)',
      Status: 'Active',
      Author: 'Aditya'
    },
    viewStyle: 'EDITOR_BLOCKS',
    content: `# Sovereign AI Engineering & Architecture Protocols

### Operational Guidelines
1. **Spec-on-Disk Protocol**: Never execute non-trivial multi-file edits without a pre-compiled markdown specification in \`docs/tasks/TASK-XX.md\`.
2. **Deterministic Conflict Resolution**: In any sync collision between local browser IndexedDB and external spreadsheets, **local edits strictly prevail**.
3. **Canonical UI Tagging**: All landmark containers must carry \`data-ag-id="<FeatureName>_<Section>_<ComponentType>"\`.

> [!TIP]
> Always verify bundle sizes before releasing: keep production chunks strictly under 800 kB for fast mobile hydration on Samsung Galaxy S25 Ultra.

| Standard | Target | Verification Method |
| :--- | :--- | :--- |
| Database Engine | Dexie.js v4 (IndexedDB) | 100% Offline Autonomy |
| UI Framework | React 19 + TypeScript | \`npm run build\` (\`tsc -b\`) |
| CSS Architecture | TailwindCSS v4 (@theme) | Zero tailwind.config.js |
| Mobile Screen | 120Hz Dynamic AMOLED | Safe-Area & dvh support |`,
    copyBlocks: [
      {
        id: 'blk-1',
        title: 'Spec-on-Disk Execution Prompt',
        blockType: 'Prompt',
        content: `Act as a Principal Software Architect. Review the active task specification in docs/tasks/TASK-XX.md.
Follow Mode 1 execution:
1. Deliver a lean cockpit update (~200-450 tokens).
2. Report Causal Summary, Files Touched, Verification Status, and Next Step.
3. Keep all edits strictly locked to om_os_app/src/.`
      },
      {
        id: 'blk-2',
        title: 'Pre-Edit Snapshot PowerShell Invariant',
        blockType: 'Protocol',
        content: `powershell scripts/backup.ps1 -Reason "pre_feature_checkpoint"`
      }
    ],
    tableRows: [],
    checklistItems: [],
    targetFolders: [],
    isPinned: true,
    isArchived: false,
    fontSize: 'base',
    wordWrap: true,
    undoStack: [],
    redoStack: [],
    createdAt: '2026-11-04T16:00:00.000Z',
    updatedAt: '2026-11-04T16:15:00.000Z'
  },
  {
    id: 'note-2-notepad',
    title: '02 · Raw Chat & Codex Snippets (Notepad Table)',
    briefBeneath: 'Quick-capture table for copying raw text while reading AI chats, IDE logs, or YouTube transcripts.',
    domain: 'RAW_SCRATCHPAD',
    mainCategory: 'Chat_Extracts',
    subCategory: 'Audit_Inbox',
    dailyCategory: 'Work',
    tags: ['scratchpad', 'chat-gems', 're-feed-ai', 'audit'],
    properties: {
      Format: 'Windows Notepad Table',
      ReFeed_Ready: 'Yes',
      Source_Platform: 'ChatGPT + Antigravity'
    },
    viewStyle: 'NOTEPAD_TABLE',
    content: 'Tabular capture of raw chat snippets. Select any rows and click "Generate Pure-Code AI Audit Prompt" to re-feed directly to AI.',
    copyBlocks: [],
    tableRows: [
      {
        id: 'row-1',
        selected: true,
        capturedText: 'React 19 Action hooks and useOptimistic allow instant local UI mutations before Dexie sync finishes.',
        source: 'Antigravity IDE',
        intent: 'Clarify',
        notes: 'How does useOptimistic degrade gracefully if Dexie transaction rolls back?'
      },
      {
        id: 'row-2',
        selected: true,
        capturedText: 'Tailwind v4 replaces postcss.config.js and tailwind.config.js with pure CSS @theme definitions inside src/index.css.',
        source: 'Vite 8 Documentation',
        intent: 'Understand',
        notes: 'Verify how CSS custom variables (var(--bg-primary)) interact with @theme rules.'
      },
      {
        id: 'row-3',
        selected: false,
        capturedText: 'YouTube verbatim extract on Epistemic Systems: Knowledge graphs without local backlinks decay within 30 days.',
        source: 'YouTube Verbatim',
        intent: 'Synthesize',
        notes: 'Synthesize with KnowledgeVault two-way living markdown exporter.'
      }
    ],
    checklistItems: [],
    targetFolders: [],
    isPinned: false,
    isArchived: false,
    fontSize: 'sm',
    wordWrap: true,
    undoStack: [],
    redoStack: [],
    createdAt: '2026-11-04T16:05:00.000Z',
    updatedAt: '2026-11-04T16:20:00.000Z'
  },
  {
    id: 'note-3-directory',
    title: '03 · Target Folders & Files Directory Map',
    briefBeneath: 'Canonical directory map of selected target folders across PC, Laptop, and Om OS App.',
    domain: 'PATH_DIRECTORY',
    mainCategory: 'System_Architecture',
    subCategory: 'Directory_Registry',
    dailyCategory: 'Special',
    tags: ['pc-folders', 'laptop-ssd', 'directory-tree', 'registry'],
    properties: {
      Host_OS: 'Windows 11 Pro',
      Primary_Drive: 'C:\\Users\\adity\\Ag Folder',
      Backup_Target: 'D:\\Om_Vault_Snapshots'
    },
    viewStyle: 'DIRECTORY_MAP',
    content: 'Curated registry of target folders across Windows PC, Laptop SSD, and Om Knowledge OS.',
    copyBlocks: [],
    tableRows: [],
    checklistItems: [],
    targetFolders: [
      {
        id: 'dir-1',
        device: 'Windows_PC',
        folderPath: 'C:\\Users\\adity\\Ag Folder\\om_os_app\\src\\components\\notes',
        mainCategory: 'App_Source',
        subCategory: 'Notes_Studio_Module',
        whatIsInside: 'Standalone NotesStudioView.tsx UI component and multi-pane split engine.',
        lastVerified: '2026-11-04'
      },
      {
        id: 'dir-2',
        device: 'Windows_PC',
        folderPath: 'C:\\Users\\adity\\Ag Folder\\my_notes',
        mainCategory: 'Protected_Vault',
        subCategory: 'Philosophical_Archives',
        whatIsInside: 'Read-only study archives (00_My_Notes_Main.md to 11_Sample.md).',
        lastVerified: '2026-11-04'
      },
      {
        id: 'dir-3',
        device: 'Windows_PC',
        folderPath: 'C:\\Users\\adity\\Ag Folder\\docs\\tasks',
        mainCategory: 'Spec_Pipeline',
        subCategory: 'Active_Task_Specs',
        whatIsInside: 'Single active TASK-XX.md spec; completed specs live in docs/tasks/archive/.',
        lastVerified: '2026-11-04'
      }
    ],
    isPinned: false,
    isArchived: false,
    fontSize: 'sm',
    wordWrap: true,
    undoStack: [],
    redoStack: [],
    createdAt: '2026-11-04T16:10:00.000Z',
    updatedAt: '2026-11-04T16:22:00.000Z'
  },
  {
    id: 'note-4-daily-pulse',
    title: '04 · Daily Pulse Checklists & Taxonomy Lexicon',
    briefBeneath: 'Daily AI, Work, List, Special, Remember, Learn, and Ponder checklists + terminology.',
    domain: 'DAILY_PULSE',
    mainCategory: 'Daily_Execution',
    subCategory: 'Multi_Bucket_Checklist',
    dailyCategory: 'Daily_AI',
    tags: ['daily-checklist', 'remember', 'learn', 'ponder', 'taxonomy'],
    properties: {
      Active_Bucket: 'Daily_AI + Learn + Ponder',
      Sync_Target: 'Desktop + S25 Ultra',
      Cadence: 'Daily Morning & Evening'
    },
    viewStyle: 'CHECKLIST_BOARD',
    content: `### Canonical Terminology & Taxonomy Notes
- **Progressive Inlining (\`@[label](path)\`)**: Expands external markdown only when a scoped rule triggers.
- **Deterministic Conflict Resolution**: Local Dexie edits strictly prevail over remote sheet collisions.
- **AMOLED True-Black Theme**: Uses \`#000000\` root background for power efficiency on 120Hz displays.`,
    copyBlocks: [
      {
        id: 'blk-lex-1',
        title: 'Canonical UI Naming Attribute',
        blockType: 'Canonical',
        content: 'data-ag-id="<FeatureName>_<Section>_<ComponentType>"'
      }
    ],
    tableRows: [],
    checklistItems: [
      {
        id: 'chk-1',
        text: 'Verify Notes Studio 3-Vertical + 1-Bottom split layout in browser',
        completed: true,
        bucket: 'Daily_AI'
      },
      {
        id: 'chk-2',
        text: 'Test 1-click pure-code AI prompt wrapper on misc chat snippets',
        completed: true,
        bucket: 'Work'
      },
      {
        id: 'chk-3',
        text: 'Review YouTube verbatim extracts and tag canonical terms',
        completed: false,
        bucket: 'Learn'
      },
      {
        id: 'chk-4',
        text: 'Contemplate connection between epistemic taxonomy and graph backlinks',
        completed: false,
        bucket: 'Ponder'
      }
    ],
    targetFolders: [],
    isPinned: true,
    isArchived: false,
    fontSize: 'base',
    wordWrap: true,
    undoStack: [],
    redoStack: [],
    createdAt: '2026-11-04T16:12:00.000Z',
    updatedAt: '2026-11-04T16:25:00.000Z'
  }
];

// Dedicated Stable Subcomponent for Live Editable Fenced Code Blocks (Point 1 Fix)
interface EditableCodeBlockProps {
  noteId: string;
  blockIdx: number;
  initialCode: string;
  lang: string;
  fontSizePx: number;
  onUpdateCode: (noteId: string, blockIdx: number, newCode: string, newLang?: string) => void;
  onAddBelow: (noteId: string, blockIdx: number, lang: string) => void;
  onRemove: (noteId: string, blockIdx: number) => void;
}

const EditableCodeBlock: React.FC<EditableCodeBlockProps> = React.memo(({
  noteId,
  blockIdx,
  initialCode,
  lang,
  fontSizePx,
  onUpdateCode,
  onAddBelow,
  onRemove
}) => {
  const [localCode, setLocalCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external undo/redo changes without interrupting user's active keyboard focus
  useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      setLocalCode(initialCode);
    }
  }, [initialCode]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalCode(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onUpdateCode(noteId, blockIdx, val);
    }, 200);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    onUpdateCode(noteId, blockIdx, localCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="my-3 rounded-xl border overflow-hidden font-mono text-xs shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }}
    >
      {/* Code Block Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b text-[11px]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)'
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          <select
            value={lang.toLowerCase()}
            onChange={(e) => {
              const newLang = e.target.value;
              onUpdateCode(noteId, blockIdx, localCode, newLang);
            }}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--accent)',
              borderColor: 'transparent'
            }}
            className="font-bold uppercase tracking-wider text-[11px] focus:outline-none cursor-pointer"
            title="Switch code block language"
          >
            {[
              'typescript',
              'javascript',
              'python',
              'json',
              'sql',
              'html',
              'css',
              'bash',
              'rust',
              'go',
              'markdown',
              'yaml',
              'code'
            ].map((l) => (
              <option
                key={l}
                value={l}
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
              >
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded text-[11px] font-medium transition-all hover:opacity-85 active:scale-95"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)'
            }}
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onAddBelow(noteId, blockIdx, lang)}
            className="flex items-center gap-0.5 cursor-pointer px-1.5 py-0.5 rounded text-[11px] hover:text-indigo-400 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Add code snippet below"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(noteId, blockIdx)}
            className="flex items-center gap-0.5 cursor-pointer px-1.5 py-0.5 rounded text-[11px] hover:text-red-400 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Delete code snippet"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Directly Editable Monospace Textarea */}
      <textarea
        ref={textareaRef}
        value={localCode}
        onChange={handleChange}
        onBlur={handleBlur}
        rows={Math.max(3, localCode.split('\n').length)}
        placeholder={`// Type or paste ${lang} code here...`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-main)',
          fontSize: `${fontSizePx || 12}px`,
          minHeight: '80px'
        }}
        className="w-full p-3 font-mono text-[12px] leading-relaxed resize-y focus:outline-none border-t border-[var(--border-color)] block whitespace-pre focus:ring-1 focus:ring-indigo-500/40 select-text"
        spellCheck={false}
      />
    </div>
  );
});

export const NotesStudioView: React.FC = () => {
  // Persistent Notes Store
  const [notes, setNotes] = useState<StudioNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return SEED_NOTES;
  });

  // Upload 1 Collapsible Groups Store
  const [collapsibleGroups, setCollapsibleGroups] = useState<CollapsibleGroupConfig[]>(() => {
    try {
      const saved = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_COLLAPSIBLE_GROUPS;
  });

  // Open Tabs (Up to 20 tabs as requested in Upload 2 Sketch 1: "upto 20")
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => [
    'note-1-prompts',
    'note-2-notepad',
    'note-3-directory',
    'note-4-daily-pulse'
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('note-1-prompts');

  // Split Layout Mode: SINGLE_PANE | THREE_PLUS_BOTTOM (Upload 2 Sketch 2) | GRID_3X2
  const [splitMode, setSplitMode] = useState<SplitLayoutMode>('THREE_PLUS_BOTTOM');

  // Resizable Layout States (Persisted in localStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_DIMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.sidebarWidth === 'number') return parsed.sidebarWidth;
      }
    } catch {}
    return 310;
  });

  const [columnPercents, setColumnPercents] = useState<[number, number, number]>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_DIMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.columnPercents) && parsed.columnPercents.length === 3) {
          return parsed.columnPercents as [number, number, number];
        }
      }
    } catch {}
    return [33.33, 33.33, 33.34];
  });

  const [colPercents2, setColPercents2] = useState<[number, number]>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_DIMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.colPercents2) && parsed.colPercents2.length === 2) {
          return parsed.colPercents2 as [number, number];
        }
      }
    } catch {}
    return [50, 50];
  });

  const [bottomDockHeight, setBottomDockHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_DIMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.bottomDockHeight === 'number') return parsed.bottomDockHeight;
      }
    } catch {}
    return 220;
  });

  const [bottomDockNoteId, setBottomDockNoteId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_DIMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.bottomDockNoteId === 'string') return parsed.bottomDockNoteId;
      }
    } catch {}
    return null;
  });

  // Animated Tab / Pane Highlight Trigger (Req: Glow when clicking top header)
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag and Drop Tab Reordering in Top Ribbon
  const [draggedTabIdx, setDraggedTabIdx] = useState<number | null>(null);

  const handleTabDragStart = (idx: number, e: React.DragEvent) => {
    setDraggedTabIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleTabDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTabDrop = (targetIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTabIdx === null || draggedTabIdx === targetIdx) return;
    setOpenTabIds((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedTabIdx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
    setDraggedTabIdx(null);
  };

  const handleTabDragEnd = () => {
    setDraggedTabIdx(null);
  };

  // Save layout dimensions
  useEffect(() => {
    try {
      localStorage.setItem(
        LAYOUT_DIMS_KEY,
        JSON.stringify({
          sidebarWidth,
          columnPercents,
          colPercents2,
          bottomDockHeight,
          bottomDockNoteId
        })
      );
    } catch {}
  }, [sidebarWidth, columnPercents, colPercents2, bottomDockHeight, bottomDockNoteId]);

  // Ref for the 3-column top deck container to measure precise pixel width
  const columnsContainerRef = useRef<HTMLDivElement>(null);

  // Sideways Collapsible Menu (Left Sidebar)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'grp-knowledge-views': true,
    'grp-content-model': true,
    domains: true,
    dailyBuckets: false,
    notesList: true
  });

  // Active Pill Tab inside Upload 1 Collapsible Groups
  const [activeGroupTab, setActiveGroupTab] = useState<Record<string, string>>({
    'grp-knowledge-views': 'tab-lib',
    'grp-content-model': 'tab-sources'
  });

  // Filters & Search
  const [selectedDomain, setSelectedDomain] = useState<NoteDomain | 'ALL'>('ALL');
  const [selectedDailyBucket, setSelectedDailyBucket] = useState<DailyPulseCategory | 'ALL'>('ALL');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'EXACT' | 'APPROXIMATE'>('EXACT');
  const [showArchived, setShowArchived] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Pane Focus / Maximized State
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null);
  const [collapsedPanes, setCollapsedPanes] = useState<Record<string, boolean>>({});
  const [bottomDrawerCollapsed, setBottomDrawerCollapsed] = useState(false);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Pane View Modes (Edit vs Preview vs Split)
  const [paneViewModes, setPaneViewModes] = useState<Record<string, 'edit' | 'preview' | 'split'>>({});
  const [propertiesDrawerOpen, setPropertiesDrawerOpen] = useState<Record<string, boolean>>({});

  // Direct Textarea Ref map for true selection-based Markdown formatting
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // ChatGPT-Style Floating Selection Pen & Popover State (Point 3)
  const [activeSelection, setActiveSelection] = useState<{
    noteId: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [annotationPromptOpen, setAnnotationPromptOpen] = useState(false);
  const [annotationComment, setAnnotationComment] = useState('');
  const [annotationIntent, setAnnotationIntent] = useState<'Clarify' | 'Refactor' | 'Audit' | 'Explain' | 'Ask AI'>('Clarify');

  // Side-Panel Annotation Deck Drawer State
  const [isAnnotationDeckOpen, setIsAnnotationDeckOpen] = useState(false);
  const [annotationFilterNoteId, setAnnotationFilterNoteId] = useState<'ALL' | string>('ALL');

  // Tabular Scratchpad Resizable Column Widths in Pixels (Point 1)
  const [tableColWidths, setTableColWidths] = useState({
    sel: 38,
    snippet: 300,
    source: 110,
    intent: 115,
    notes: 240,
    del: 38
  });

  // Collapsible Prompt Cards State (Issue 2)
  const [copyBlocksCollapsed, setCopyBlocksCollapsed] = useState<Record<string, boolean>>({
    'note-1-prompts': true
  });

  // Auto-Save Effect
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to persist notes to localStorage', e);
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(collapsibleGroups));
    } catch (e) {
      console.warn('Failed to persist groups to localStorage', e);
    }
  }, [collapsibleGroups]);

  // Global Keyboard Shortcuts (Ctrl+B to toggle sidebar, Ctrl+F for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Guard against any stuck userSelect or cursor styles from HMR or resize aborts
  useEffect(() => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  // -------------------------------------------------------------
  // Resizer Event Handlers (Columns, Sidebar, Bottom Dock)
  // -------------------------------------------------------------
  const resetColumnPercents = () => {
    setColumnPercents([33.33, 33.33, 33.34]);
    setColPercents2([50, 50]);
  };

  const startCol2Resize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const containerWidth =
      columnsContainerRef.current?.getBoundingClientRect().width || 900;
    const startP0 = colPercents2[0];

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaPercent = (deltaPx / containerWidth) * 100;
      const newP0 = Math.min(Math.max(startP0 + deltaPercent, 15), 85);
      const newP1 = Number((100 - newP0).toFixed(2));
      setColPercents2([Number(newP0.toFixed(2)), newP1]);
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startColumnResize = (splitIdx: 0 | 1, e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const containerWidth =
      columnsContainerRef.current?.getBoundingClientRect().width || 900;
    const [startP0, startP1, startP2] = columnPercents;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaPercent = (deltaPx / containerWidth) * 100;

      if (splitIdx === 0) {
        // Resizing between Column 0 and Column 1
        const newP0 = Math.min(Math.max(startP0 + deltaPercent, 15), 70);
        const diff = newP0 - startP0;
        const newP1 = Math.min(Math.max(startP1 - diff, 15), 70);
        const adjustedP0 = Number((100 - startP2 - newP1).toFixed(2));
        setColumnPercents([adjustedP0, Number(newP1.toFixed(2)), startP2]);
      } else {
        // Resizing between Column 1 and Column 2
        const newP1 = Math.min(Math.max(startP1 + deltaPercent, 15), 70);
        const diff = newP1 - startP1;
        const newP2 = Math.min(Math.max(startP2 - diff, 15), 70);
        const adjustedP1 = Number((100 - startP0 - newP2).toFixed(2));
        setColumnPercents([startP0, adjustedP1, Number(newP2.toFixed(2))]);
      }
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startBottomDockResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = bottomDockHeight;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.min(Math.max(startHeight - deltaY, 100), 550);
      setBottomDockHeight(newHeight);
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startSidebarResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newW = Math.min(Math.max(startW + deltaX, 220), 480);
      setSidebarWidth(newW);
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startTableColResize = (
    colKey: 'snippet' | 'source' | 'intent' | 'notes',
    e: React.PointerEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = tableColWidths[colKey];
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      setTableColWidths((prev) => ({
        ...prev,
        [colKey]: Math.max(70, startW + delta)
      }));
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Aggregated list of all annotations across all notes (Point 3)
  const allAnnotations = useMemo(() => {
    const list: StudioAnnotation[] = [];
    notes.forEach((n) => {
      if (Array.isArray(n.annotations)) {
        n.annotations.forEach((a) => {
          list.push({ ...a, noteTitle: a.noteTitle || n.title });
        });
      }
    });
    return list;
  }, [notes]);

  // Direct Format Toolbar Annotate Trigger (Issue 3 & 4 Fix)
  const handleToolbarAnnotate = (noteId: string) => {
    setAnnotationFilterNoteId(noteId);
    const textarea = textareaRefs.current[noteId];
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const selected = start !== null && end !== null && end > start ? val.substring(start, end).trim() : '';
      const textToAnnotate = selected.length >= 2 ? selected : (val.trim() ? val.slice(0, 120) : 'Active Note Selection');
      setActiveSelection({
        noteId,
        text: textToAnnotate,
        x: 0,
        y: 0
      });
      setAnnotationComment('');
      setAnnotationPromptOpen(true);
      return;
    }
    const sel = window.getSelection();
    const selText = sel ? sel.toString().trim() : '';
    const targetNote = notes.find((n) => n.id === noteId);
    setActiveSelection({
      noteId,
      text: selText.length >= 2 ? selText : (targetNote?.content.slice(0, 120) || 'Active Note Selection'),
      x: 0,
      y: 0
    });
    setAnnotationComment('');
    setAnnotationPromptOpen(true);
  };

  const handleSaveAnnotation = () => {
    if (!activeSelection) return;
    const targetNote = notes.find((n) => n.id === activeSelection.noteId);
    const newAnnotation: StudioAnnotation = {
      id: `ann-${Date.now()}`,
      noteId: activeSelection.noteId,
      noteTitle: targetNote?.title || 'Active Note',
      selectedText: activeSelection.text,
      comment: annotationComment.trim() || 'Annotated snippet for AI review',
      intent: annotationIntent,
      resolved: false,
      createdAt: new Date().toISOString()
    };

    updateNoteWithUndo(activeSelection.noteId, (n) => ({
      ...n,
      annotations: [...(n.annotations || []), newAnnotation]
    }));

    setAnnotationPromptOpen(false);
    setActiveSelection(null);
    setIsAnnotationDeckOpen(true);
  };

  const handleDeleteAnnotation = (noteId: string, annotationId: string) => {
    updateNoteWithUndo(noteId, (n) => ({
      ...n,
      annotations: (n.annotations || []).filter((a) => a.id !== annotationId)
    }));
  };

  const handleToggleResolveAnnotation = (noteId: string, annotationId: string) => {
    updateNoteWithUndo(noteId, (n) => ({
      ...n,
      annotations: (n.annotations || []).map((a) =>
        a.id === annotationId ? { ...a, resolved: !a.resolved } : a
      )
    }));
  };

  const handleJumpToAnnotation = (ann: StudioAnnotation) => {
    if (!openTabIds.includes(ann.noteId)) {
      handleOpenNoteTab(ann.noteId);
    } else {
      setActiveTabId(ann.noteId);
    }
    triggerNoteHighlight(ann.noteId);
  };

  // Live Markdown Code Snippet Update & Mutation Helpers (Point 1 & 2)
  const updateCodeBlockInMarkdown = (
    noteId: string,
    targetBlockIdx: number,
    newCode: string,
    newLang?: string
  ) => {
    updateNoteWithUndo(noteId, (n) => {
      const lines = n.content.split('\n');
      let blockIdx = 0;
      let inBlock = false;
      let startIdx = -1;
      let currentLang = '';

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('```')) {
          if (!inBlock) {
            inBlock = true;
            startIdx = i;
            currentLang = lines[i].trim().replace(/^```/, '').trim();
          } else {
            inBlock = false;
            if (blockIdx === targetBlockIdx) {
              const langToUse = newLang !== undefined ? newLang : currentLang;
              const newLines = [
                ...lines.slice(0, startIdx),
                `\`\`\`${langToUse}`,
                ...newCode.split('\n'),
                `\`\`\``,
                ...lines.slice(i + 1)
              ];
              return { ...n, content: newLines.join('\n') };
            }
            blockIdx++;
          }
        }
      }

      // Fallback for unclosed code block at EOF
      if (inBlock && blockIdx === targetBlockIdx) {
        const langToUse = newLang !== undefined ? newLang : currentLang;
        const newLines = [
          ...lines.slice(0, startIdx),
          `\`\`\`${langToUse}`,
          ...newCode.split('\n'),
          `\`\`\``
        ];
        return { ...n, content: newLines.join('\n') };
      }

      return n;
    });
  };

  const addCodeBlockBelow = (noteId: string, afterBlockIdx: number, defaultLang = 'typescript') => {
    updateNoteWithUndo(noteId, (n) => {
      const lines = n.content.split('\n');
      let blockIdx = 0;
      let inBlock = false;
      let targetLine = lines.length;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('```')) {
          if (!inBlock) {
            inBlock = true;
          } else {
            inBlock = false;
            if (blockIdx === afterBlockIdx) {
              targetLine = i + 1;
              break;
            }
            blockIdx++;
          }
        }
      }

      const newLines = [
        ...lines.slice(0, targetLine),
        '',
        `\`\`\`${defaultLang}`,
        '// Write code snippet here...',
        `\`\`\``,
        ...lines.slice(targetLine)
      ];
      return { ...n, content: newLines.join('\n') };
    });
  };

  const removeCodeBlockFromMarkdown = (noteId: string, targetBlockIdx: number) => {
    updateNoteWithUndo(noteId, (n) => {
      const lines = n.content.split('\n');
      let blockIdx = 0;
      let inBlock = false;
      let startIdx = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('```')) {
          if (!inBlock) {
            inBlock = true;
            startIdx = i;
          } else {
            inBlock = false;
            if (blockIdx === targetBlockIdx) {
              const newLines = [
                ...lines.slice(0, startIdx),
                ...lines.slice(i + 1)
              ];
              return { ...n, content: newLines.join('\n') };
            }
            blockIdx++;
          }
        }
      }
      return n;
    });
  };
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (!showArchived && note.isArchived) return false;

      // Group sub-tab filter (Upload 1)
      if (selectedGroupFilter === 'tab-lib') {
        if (note.domain !== 'AI_ENGINE' && note.domain !== 'KNOWLEDGE_HUB') return false;
      } else if (selectedGroupFilter === 'tab-think') {
        if (
          !note.tags.includes('learn') &&
          !note.tags.includes('ponder') &&
          note.domain !== 'DAILY_PULSE'
        ) {
          return false;
        }
      } else if (selectedGroupFilter === 'tab-conn') {
        if (note.domain !== 'RAW_SCRATCHPAD' && note.domain !== 'TAXONOMY_LEXICON') return false;
      } else if (selectedGroupFilter === 'tab-sources') {
        if (note.domain !== 'KNOWLEDGE_HUB' && note.domain !== 'RAW_SCRATCHPAD') return false;
      } else if (selectedGroupFilter === 'tab-concepts') {
        if (note.domain !== 'TAXONOMY_LEXICON' && note.domain !== 'PATH_DIRECTORY') return false;
      }

      // Domain filter
      if (selectedDomain !== 'ALL' && note.domain !== selectedDomain) return false;

      // Daily Pulse bucket filter
      if (
        selectedDailyBucket !== 'ALL' &&
        note.domain === 'DAILY_PULSE' &&
        note.dailyCategory !== selectedDailyBucket
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        return matchesNoteSearch(note, searchQuery, searchMode);
      }
      return true;
    });
  }, [
    notes,
    showArchived,
    selectedGroupFilter,
    selectedDomain,
    selectedDailyBucket,
    searchQuery,
    searchMode
  ]);

  // Tab Management
  const handleOpenNoteTab = (noteId: string) => {
    if (!openTabIds.includes(noteId)) {
      if (openTabIds.length >= MAX_OPEN_TABS) {
        setOpenTabIds((prev) => [...prev.slice(1), noteId]);
      } else {
        setOpenTabIds((prev) => [...prev, noteId]);
      }
    }
    setActiveTabId(noteId);
  };

  const handleCloseTab = (tabId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const remaining = openTabIds.filter((id) => id !== tabId);
    setOpenTabIds(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1] || '');
    }
    if (bottomDockNoteId === tabId) {
      setBottomDockNoteId(null);
    }
  };

  // Create Note
  const handleCreateNewNote = (domain: NoteDomain = 'AI_ENGINE') => {
    const newId = `note-${Date.now()}`;
    const newNote: StudioNote = {
      id: newId,
      title: `Untitled Note ${notes.length + 1}`,
      briefBeneath: '',
      domain,
      mainCategory: 'General',
      subCategory: 'Draft',
      tags: ['new-note'],
      properties: { Status: 'Draft', Priority: 'Medium' },
      viewStyle: 'EDITOR_BLOCKS',
      content: '',
      copyBlocks: [],
      tableRows: [
        {
          id: `row-${Date.now()}`,
          selected: true,
          capturedText: '',
          source: 'ChatGPT',
          intent: 'Clarify',
          notes: ''
        }
      ],
      checklistItems:
        domain === 'DAILY_PULSE'
          ? [{ id: `chk-${Date.now()}`, text: 'First task', completed: false, bucket: 'Daily_AI' }]
          : [],
      targetFolders: [],
      isPinned: false,
      isArchived: false,
      fontSize: 'base',
      fontSizePx: 14,
      wordWrap: true,
      undoStack: [],
      redoStack: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);
    handleOpenNoteTab(newId);
  };

  // State Mutation with 5-step Undo / Redo
  const updateNoteWithUndo = (
    noteId: string,
    updater: (current: StudioNote) => StudioNote
  ) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const currentSnapshotStr = JSON.stringify({
          title: n.title,
          content: n.content,
          briefBeneath: n.briefBeneath,
          properties: n.properties,
          tags: n.tags
        });
        const updated = updater(n);
        const newUndoStack = [...n.undoStack, currentSnapshotStr].slice(-MAX_UNDO_STEPS);
        return {
          ...updated,
          updatedAt: new Date().toISOString(),
          undoStack: newUndoStack,
          redoStack: []
        };
      })
    );
  };

  const handleUndo = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId || n.undoStack.length === 0) return n;
        const prevSnapshotStr = n.undoStack[n.undoStack.length - 1];
        const currentSnapshotStr = JSON.stringify({
          title: n.title,
          content: n.content,
          briefBeneath: n.briefBeneath,
          properties: n.properties,
          tags: n.tags
        });
        try {
          const restored = JSON.parse(prevSnapshotStr);
          return {
            ...n,
            ...restored,
            updatedAt: new Date().toISOString(),
            undoStack: n.undoStack.slice(0, -1),
            redoStack: [...n.redoStack, currentSnapshotStr].slice(-MAX_UNDO_STEPS)
          };
        } catch {
          return n;
        }
      })
    );
  };

  const handleRedo = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId || n.redoStack.length === 0) return n;
        const nextSnapshotStr = n.redoStack[n.redoStack.length - 1];
        const currentSnapshotStr = JSON.stringify({
          title: n.title,
          content: n.content,
          briefBeneath: n.briefBeneath,
          properties: n.properties,
          tags: n.tags
        });
        try {
          const restored = JSON.parse(nextSnapshotStr);
          return {
            ...n,
            ...restored,
            updatedAt: new Date().toISOString(),
            undoStack: [...n.undoStack, currentSnapshotStr].slice(-MAX_UNDO_STEPS),
            redoStack: n.redoStack.slice(0, -1)
          };
        } catch {
          return n;
        }
      })
    );
  };

  // Copy Helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // True Selection-Based Formatting Insertion (Req #15)
  const applySelectionFormatting = (
    noteId: string,
    prefix: string,
    suffix: string = '',
    defaultPlaceholder: string = 'text'
  ) => {
    const textarea = textareaRefs.current[noteId];
    if (!textarea) {
      updateNoteWithUndo(noteId, (n) => ({
        ...n,
        content: `${n.content}\n${prefix}${defaultPlaceholder}${suffix}`
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selected = currentVal.substring(start, end);

    const replacement =
      selected.length > 0
        ? `${prefix}${selected}${suffix}`
        : `${prefix}${defaultPlaceholder}${suffix}`;

    const newContent = `${currentVal.substring(0, start)}${replacement}${currentVal.substring(end)}`;

    updateNoteWithUndo(noteId, (n) => ({
      ...n,
      content: newContent
    }));

    setTimeout(() => {
      textarea.focus();
      const newCursorPos =
        start + prefix.length + (selected.length || defaultPlaceholder.length);
      textarea.setSelectionRange(start + prefix.length, newCursorPos);
    }, 10);
  };

  // Add Custom Tab to Upload 1 Group
  const handleAddGroupTab = (groupId: string) => {
    const label = window.prompt('Enter new tab name (e.g. Protocols, Verbatim, Audits):');
    if (!label) return;
    const summaryLine =
      window.prompt('Enter 1-line brief for what is inside this tab:') ||
      `${label} curated entries & views.`;
    const newTabId = `tab-${Date.now()}`;
    setCollapsibleGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tabs: [...g.tabs, { id: newTabId, label, icon: '✨', summaryLine }] }
          : g
      )
    );
    setActiveGroupTab((prev) => ({ ...prev, [groupId]: newTabId }));
  };

  // Open notes as StudioNote objects
  const openNotes = useMemo(() => {
    return openTabIds
      .map((id) => notes.find((n) => n.id === id))
      .filter((n): n is StudioNote => Boolean(n));
  }, [openTabIds, notes]);

  // Determine which note is docked to the horizontal bottom dock
  const bottomDockNote = useMemo<StudioNote | null>(() => {
    if (splitMode !== 'TWO_PLUS_BOTTOM' && splitMode !== 'THREE_PLUS_BOTTOM') {
      return null;
    }
    if (openNotes.length === 0) return null;

    // 1. If user explicitly selected a note for the bottom dock and it's still open
    if (bottomDockNoteId) {
      const explicit = openNotes.find((n) => n.id === bottomDockNoteId);
      if (explicit) return explicit;
    }

    // 2. Default fallback based on mode:
    if (splitMode === 'THREE_PLUS_BOTTOM') {
      // In 3-Vert + 1-Dock: if 4 or more notes, 4th note is the horizontal bottom dock!
      if (openNotes.length >= 4) return openNotes[3];
      // If 3 notes and explicitly desired or fallback
      if (openNotes.length === 3 && bottomDockNoteId) return openNotes[2];
    } else if (splitMode === 'TWO_PLUS_BOTTOM') {
      // In 2-Vert + 1-Dock: if 3 or more notes, 3rd note is bottom dock!
      if (openNotes.length >= 3) return openNotes[2];
      if (openNotes.length === 2 && bottomDockNoteId === openNotes[1].id) return openNotes[1];
    }
    return null;
  }, [openNotes, splitMode, bottomDockNoteId]);

  // Determine Top Vertical Notes (excluding bottom dock note)
  const topNotes = useMemo<StudioNote[]>(() => {
    const withoutBottom = bottomDockNote
      ? openNotes.filter((n) => n.id !== bottomDockNote.id)
      : openNotes;

    const maxCols = splitMode === 'TWO_PLUS_BOTTOM' ? 2 : 3;
    return withoutBottom.slice(0, maxCols);
  }, [openNotes, bottomDockNote, splitMode]);

  // Determine Active Notes to render in the current Split Mode (Upload 2 Sketch 2)
  const visiblePaneNotes = useMemo(() => {
    if (openNotes.length === 0 && notes.length > 0) return [notes[0]];

    if (maximizedPaneId) {
      const maxNote = notes.find((n) => n.id === maximizedPaneId);
      if (maxNote) return [maxNote];
    }

    if (splitMode === 'SINGLE_PANE') {
      const active = notes.find((n) => n.id === activeTabId) || openNotes[0];
      return active ? [active] : [];
    }

    if (splitMode === 'TWO_PLUS_BOTTOM' || splitMode === 'THREE_PLUS_BOTTOM') {
      return bottomDockNote ? [...topNotes, bottomDockNote] : topNotes;
    }

    // GRID_3X2: up to 6 notes in a 3x2 matrix
    return openNotes.slice(0, 6);
  }, [openNotes, notes, activeTabId, splitMode, maximizedPaneId, bottomDockNote, topNotes]);

  // Animated Tab / Pane Highlight Trigger (Req: Glow when clicking top header)
  const triggerNoteHighlight = (noteId: string) => {
    setActiveTabId(noteId);

    // If the note is not currently visible on screen in the active multi-pane layout,
    // bring it to the front of openTabIds so it renders in the primary top column
    const isCurrentlyVisible =
      (splitMode === 'SINGLE_PANE' && activeTabId === noteId) ||
      (splitMode === 'GRID_3X2' && openNotes.slice(0, 6).some((n) => n.id === noteId)) ||
      topNotes.some((n) => n.id === noteId) ||
      bottomDockNote?.id === noteId;

    if (!isCurrentlyVisible) {
      setOpenTabIds((prev) => {
        const remaining = prev.filter((id) => id !== noteId);
        return [noteId, ...remaining];
      });
    }

    setHighlightedNoteId(noteId);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedNoteId(null);
    }, 1800);
  };

  // Toggle Note Orientation (Vertical Column <-> Horizontal Bottom Dock)
  const handleToggleNoteOrientation = (noteId: string) => {
    if (splitMode !== 'TWO_PLUS_BOTTOM' && splitMode !== 'THREE_PLUS_BOTTOM') {
      setSplitMode('THREE_PLUS_BOTTOM');
    }

    const isCurrentlyInBottom = bottomDockNote?.id === noteId;

    if (isCurrentlyInBottom) {
      // Swapping FROM Horizontal Bottom Dock TO Top Vertical Column:
      const otherOpenNotes = openNotes.filter((n) => n.id !== noteId);
      const newBottomId = otherOpenNotes.length >= 3 ? otherOpenNotes[otherOpenNotes.length - 1].id : null;
      setBottomDockNoteId(newBottomId);
      setOpenTabIds((prev) => {
        const without = prev.filter((id) => id !== noteId);
        return [noteId, ...without];
      });
      triggerNoteHighlight(noteId);
    } else {
      // Swapping FROM Vertical Column TO Horizontal Bottom Dock:
      setBottomDockNoteId(noteId);
      setBottomDrawerCollapsed(false);
      triggerNoteHighlight(noteId);
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify({ notes, collapsibleGroups }, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `om_notes_studio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // Rich Markdown Renderer for Preview & Split Modes (with Live Editable Code Blocks & Language Selectors)
  const renderMarkdownPreview = (content: string, noteId?: string, fontSizePx?: number) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines: string[] = [];
    let codeBlockCount = 0;

    // Helper to format inline markdown elements (`code`, **bold**, ==highlight==, etc.) cleanly adapting to Light/Dark modes
    const renderInlineMarkdown = (text: string): React.ReactNode => {
      const parts = text.split(
        /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==|~~[^~]+~~|<u>[^<]+<\/u>)/g
      );
      return parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--accent)'
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return (
            <strong key={idx} className="font-semibold" style={{ color: 'var(--text-main)' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
          return (
            <mark
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded font-medium text-amber-950 dark:text-amber-100 bg-amber-300 dark:bg-amber-600/50 border border-amber-400/40"
            >
              {part.slice(2, -2)}
            </mark>
          );
        }
        if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
          return (
            <del key={idx} className="line-through opacity-60">
              {part.slice(2, -2)}
            </del>
          );
        }
        if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
          return (
            <u key={idx} className="underline decoration-indigo-400 underline-offset-2">
              {part.slice(3, -4)}
            </u>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return (
            <em key={idx} className="italic" style={{ color: 'var(--text-main)' }}>
              {part.slice(1, -1)}
            </em>
          );
        }
        return part;
      });
    };

    const flushCodeBlock = (key: string | number) => {
      const fullCode = codeLines.join('\n');
      const lang = codeLanguage || 'code';
      const thisBlockIdx = codeBlockCount++;
      const blockId = `code-block-${noteId || 'preview'}-${thisBlockIdx}`;

      if (noteId) {
        elements.push(
          <EditableCodeBlock
            key={blockId}
            noteId={noteId}
            blockIdx={thisBlockIdx}
            initialCode={fullCode}
            lang={lang}
            fontSizePx={fontSizePx || 12}
            onUpdateCode={updateCodeBlockInMarkdown}
            onAddBelow={addCodeBlockBelow}
            onRemove={removeCodeBlockFromMarkdown}
          />
        );
      } else {
        elements.push(
          <div
            key={blockId}
            className="my-3 rounded-xl border overflow-hidden font-mono text-xs shadow-sm transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5 border-b text-[11px]"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                <span
                  className="font-bold uppercase tracking-wider text-[11px]"
                  style={{ color: 'var(--accent)' }}
                >
                  {lang}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(fullCode, blockId)}
                className="flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded text-[11px] font-medium"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)'
                }}
              >
                Copy
              </button>
            </div>
            <pre
              className="p-3.5 overflow-x-auto leading-relaxed font-mono whitespace-pre text-[12px]"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-main)'
              }}
            >
              <code>
                {fullCode.trim() ? (
                  fullCode
                ) : (
                  <span className="italic opacity-50 select-none" style={{ color: 'var(--text-muted)' }}>
                    // empty {lang} code snippet
                  </span>
                )}
              </code>
            </pre>
          </div>
        );
      }
      codeLines = [];
      inCodeBlock = false;
      codeLanguage = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Multi-line Fenced Code Block Detection
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().replace(/^```/, '').trim();
          codeLines = [];
        } else {
          flushCodeBlock(i);
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={i}
            className="text-xl font-bold border-b pb-1 mt-4 mb-2"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            {renderInlineMarkdown(line.slice(2))}
          </h1>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={i}
            className="text-lg font-semibold mt-3 mb-1"
            style={{ color: 'var(--text-main)' }}
          >
            {renderInlineMarkdown(line.slice(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={i}
            className="text-base font-semibold mt-2 mb-1"
            style={{ color: 'var(--accent)' }}
          >
            {renderInlineMarkdown(line.slice(4))}
          </h3>
        );
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={i}
            className="border-l-4 pl-3 py-1 italic rounded-r text-xs my-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--accent)',
              color: 'var(--text-muted)'
            }}
          >
            {renderInlineMarkdown(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Task Checkboxes
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const checked = line.startsWith('- [x] ');
        elements.push(
          <div key={i} className="flex items-center gap-2 text-xs my-0.5">
            {checked ? (
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Square className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
            <span className={checked ? 'line-through opacity-60' : ''}>
              {renderInlineMarkdown(line.slice(6))}
            </span>
          </div>
        );
        continue;
      }

      // Lists
      if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-4 list-disc text-xs" style={{ color: 'var(--text-main)' }}>
            {renderInlineMarkdown(line.slice(2))}
          </li>
        );
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={i} className="ml-4 list-decimal text-xs" style={{ color: 'var(--text-main)' }}>
            {renderInlineMarkdown(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
        continue;
      }

      // Markdown Tables
      if (line.startsWith('|')) {
        elements.push(
          <pre
            key={i}
            className="text-[11px] font-mono px-2 py-0.5 overflow-x-auto rounded border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
          >
            {line}
          </pre>
        );
        continue;
      }

      // Empty Lines
      if (line.trim() === '') {
        elements.push(<div key={i} className="h-1.5" />);
        continue;
      }

      // Regular Paragraph
      elements.push(
        <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text-main)' }}>
          {renderInlineMarkdown(line)}
        </p>
      );
    }

    if (inCodeBlock) {
      flushCodeBlock('trailing');
    }

    return <div className="space-y-1.5 leading-relaxed text-sm select-text">{elements}</div>;
  };

  // Render a Single Note Pane (Obsidian-Grade Clean Workbench)
  const renderNotePane = (
    note: StudioNote,
    paneLabel: string,
    isBottomDock = false
  ) => {
    const isCollapsed = Boolean(collapsedPanes[note.id]);
    const isHighlighted = highlightedNoteId === note.id;
    const currentMode =
      paneViewModes[note.id] || (note.viewStyle === 'EDITOR_BLOCKS' ? 'edit' : 'preview');
    const isPropsOpen = Boolean(propertiesDrawerOpen[note.id]);
    const currentFontSizePx =
      note.fontSizePx ||
      (note.fontSize === 'sm' ? 12 : note.fontSize === 'lg' ? 16 : note.fontSize === 'xl' ? 18 : 14);

    return (
      <div
        key={note.id}
        data-ag-id={`NotesStudio_Pane_${note.id}`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          minWidth: isBottomDock ? '100%' : '100px'
        }}
        className={`flex flex-col rounded-xl border shadow-sm transition-all duration-300 overflow-hidden ${
          isHighlighted
            ? 'scale-[1.025] ring-2 ring-zinc-400/80 shadow-[0_0_24px_rgba(255,255,255,0.25)] z-20'
            : ''
        } ${isBottomDock ? 'w-full h-full min-h-0' : 'flex-1 h-full min-h-0'}`}
      >
        {/* PANE TOP CONTROL BAR — Anti-Collision Responsive Header */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)'
          }}
          className="flex items-center justify-between px-2.5 py-1.5 border-b gap-1.5 shrink-0 select-none min-h-[36px] transition-colors duration-300"
        >
          {/* Left: Pane Label Badge + Note Switcher */}
          <div className="flex items-center gap-1 min-w-0 shrink">
            <span
              className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--accent)'
              }}
            >
              {paneLabel}
            </span>

            {isHighlighted && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-500 bg-zinc-800 text-zinc-100 font-mono animate-bounce shrink-0 shadow-sm">
                ✨ FOCUS
              </span>
            )}

            {/* Note Selector Dropdown */}
            <select
              value={note.id}
              onChange={(e) => {
                const targetId = e.target.value;
                if (!openTabIds.includes(targetId)) {
                  handleOpenNoteTab(targetId);
                } else {
                  setActiveTabId(targetId);
                }
              }}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)'
              }}
              className="text-[11px] font-semibold rounded px-1.5 py-0.5 border truncate max-w-[95px] sm:max-w-[130px] cursor-pointer focus:outline-none"
              title="Switch note displayed in this pane"
            >
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.isPinned ? '📌 ' : ''}
                  {n.title}
                </option>
              ))}
            </select>
          </div>

          {/* Middle: Compact View Mode Switcher Icons (Prevents text overlap collisions) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
            className="flex items-center rounded-lg border p-0.5 gap-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => {
                setPaneViewModes((prev) => ({ ...prev, [note.id]: 'edit' }));
                updateNoteWithUndo(note.id, (n) => ({ ...n, viewStyle: 'EDITOR_BLOCKS' }));
              }}
              style={{
                backgroundColor:
                  currentMode === 'edit' && note.viewStyle === 'EDITOR_BLOCKS'
                    ? 'var(--accent)'
                    : 'transparent',
                color:
                  currentMode === 'edit' && note.viewStyle === 'EDITOR_BLOCKS'
                    ? 'var(--bg-primary)'
                    : 'var(--text-muted)'
              }}
              className="p-1 rounded text-[10px] transition-colors cursor-pointer"
              title="Markdown Editor"
            >
              <Edit3 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                setPaneViewModes((prev) => ({ ...prev, [note.id]: 'preview' }));
                updateNoteWithUndo(note.id, (n) => ({ ...n, viewStyle: 'EDITOR_BLOCKS' }));
              }}
              style={{
                backgroundColor:
                  currentMode === 'preview' && note.viewStyle === 'EDITOR_BLOCKS'
                    ? 'var(--accent)'
                    : 'transparent',
                color:
                  currentMode === 'preview' && note.viewStyle === 'EDITOR_BLOCKS'
                    ? 'var(--bg-primary)'
                    : 'var(--text-muted)'
              }}
              className="p-1 rounded text-[10px] transition-colors cursor-pointer"
              title="Rich Markdown Live Preview"
            >
              <Eye className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                setPaneViewModes((prev) => ({ ...prev, [note.id]: 'split' }));
                updateNoteWithUndo(note.id, (n) => ({ ...n, viewStyle: 'EDITOR_BLOCKS' }));
              }}
              style={{
                backgroundColor:
                  currentMode === 'split' && note.viewStyle === 'EDITOR_BLOCKS'
                    ? 'var(--accent)'
                    : 'transparent',
                color:
                  currentMode === 'split' && note.viewStyle === 'EDITOR_BLOCKS'
                    ? 'var(--bg-primary)'
                    : 'var(--text-muted)'
              }}
              className="p-1 rounded text-[10px] transition-colors cursor-pointer"
              title="Side-by-Side Editor & Preview"
            >
              <Columns className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() =>
                updateNoteWithUndo(note.id, (n) => ({
                  ...n,
                  viewStyle: n.viewStyle === 'NOTEPAD_TABLE' ? 'EDITOR_BLOCKS' : 'NOTEPAD_TABLE'
                }))
              }
              style={{
                backgroundColor:
                  note.viewStyle === 'NOTEPAD_TABLE' ? 'var(--accent)' : 'transparent',
                color:
                  note.viewStyle === 'NOTEPAD_TABLE' ? 'var(--bg-primary)' : 'var(--text-muted)'
              }}
              className="p-1 rounded text-[10px] transition-colors cursor-pointer"
              title="Windows Notepad Tabular Scratchpad for Chat Gems"
            >
              <Table className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() =>
                updateNoteWithUndo(note.id, (n) => ({
                  ...n,
                  viewStyle:
                    n.viewStyle === 'CHECKLIST_BOARD' ? 'EDITOR_BLOCKS' : 'CHECKLIST_BOARD'
                }))
              }
              style={{
                backgroundColor:
                  note.viewStyle === 'CHECKLIST_BOARD' ? 'var(--accent)' : 'transparent',
                color:
                  note.viewStyle === 'CHECKLIST_BOARD' ? 'var(--bg-primary)' : 'var(--text-muted)'
              }}
              className="p-1 rounded text-[10px] transition-colors cursor-pointer"
              title="Daily Pulse Checklists"
            >
              <CheckSquare className="w-3 h-3" />
            </button>
          </div>

          {/* Right: Actions (Orientation, Annotations, Pin, Properties, Maximize, Collapse) */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* 1. Orientation Switcher (Vertical <-> Horizontal) */}
            <button
              type="button"
              onClick={() => handleToggleNoteOrientation(note.id)}
              style={{
                color: isBottomDock ? 'var(--accent)' : 'var(--text-muted)'
              }}
              className="p-1 rounded hover:opacity-80 hover:bg-zinc-700/30 cursor-pointer transition-colors"
              title={
                isBottomDock
                  ? 'Switch Orientation to Vertical (Move to Top Column)'
                  : 'Switch Orientation to Horizontal (Dock to Bottom Drawer)'
              }
            >
              {isBottomDock ? (
                <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setAnnotationFilterNoteId(note.id);
                setIsAnnotationDeckOpen(true);
              }}
              style={{
                color: (note.annotations && note.annotations.length > 0) ? 'var(--accent)' : 'var(--text-muted)'
              }}
              className="p-1 rounded hover:opacity-80 cursor-pointer transition-colors flex items-center gap-0.5"
              title={`View ChatGPT-style Annotations for this note (${note.annotations?.length || 0})`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {note.annotations && note.annotations.length > 0 && (
                <span className="text-[9px] font-bold font-mono px-1 rounded-full bg-indigo-500 text-white">
                  {note.annotations.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                updateNoteWithUndo(note.id, (n) => ({ ...n, isPinned: !n.isPinned }))
              }
              style={{ color: note.isPinned ? '#eab308' : 'var(--text-muted)' }}
              className="p-1 rounded hover:opacity-80 cursor-pointer transition-colors"
              title={note.isPinned ? 'Unpin Note' : 'Pin Note'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setPropertiesDrawerOpen((prev) => ({ ...prev, [note.id]: !prev[note.id] }))
              }
              style={{
                color: isPropsOpen ? 'var(--accent)' : 'var(--text-muted)'
              }}
              className="p-1 rounded hover:opacity-80 cursor-pointer transition-colors"
              title="Toggle Notion-style Properties"
            >
              <Tag className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setMaximizedPaneId((prev) => (prev === note.id ? null : note.id))
              }
              style={{ color: 'var(--text-muted)' }}
              className="p-1 rounded hover:opacity-80 cursor-pointer transition-colors"
              title={maximizedPaneId === note.id ? 'Restore Pane' : 'Maximize Pane'}
            >
              {maximizedPaneId === note.id ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setCollapsedPanes((prev) => ({ ...prev, [note.id]: !prev[note.id] }))
              }
              style={{ color: 'var(--text-muted)' }}
              className="p-1 rounded hover:opacity-80 cursor-pointer transition-colors"
              title={isCollapsed ? 'Expand Pane' : 'Collapse Pane'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCloseTab(note.id)}
              style={{ color: 'var(--text-muted)' }}
              className="p-1 rounded hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
              title="Close Note (Exit Pane)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* IF COLLAPSED: Show Compact Strip */}
        {isCollapsed && (
          <div
            onClick={() =>
              setCollapsedPanes((prev) => ({ ...prev, [note.id]: false }))
            }
            className="p-2 cursor-pointer text-xs font-semibold flex items-center justify-between"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>
              {note.isPinned ? '📌 ' : ''}
              {note.title} (Collapsed)
            </span>
            <span className="text-[10px] font-mono">Click to unfold</span>
          </div>
        )}

        {/* IF EXPANDED: Main Pane Content */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* SELECTION-BASED FORMATTING TOOLBAR (Req #15) */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
              className="flex items-center justify-between px-2.5 py-1 border-b gap-1 text-xs shrink-0 select-none overflow-hidden"
            >
              {/* Text formatting tools (Scrollable container without wrapping) */}
              <div className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar shrink min-w-0 pr-1">
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '**', '**', 'bold text')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Bold (**text**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '*', '*', 'italic text')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Italic (*text*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '<u>', '</u>', 'underlined text')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Underline (<u>text</u>)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '~~', '~~', 'strikethrough text')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Strikethrough (~~text~~)"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '==', '==', 'highlighted text')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Highlight (==text==)"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarAnnotate(note.id)}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--accent)' }}
                  title="Annotate Selection for AI Deck (✏️)"
                >
                  <PenTool className="w-3.5 h-3.5" />
                </button>
                <div className="h-3 w-[1px] bg-zinc-700 mx-1 shrink-0" />
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '# ', '', 'Heading 1')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Heading 1 (#)"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '## ', '', 'Heading 2')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Heading 2 (##)"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '### ', '', 'Heading 3')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Heading 3 (###)"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '- ', '', 'Bullet item')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Bullet List (-)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '1. ', '', 'Numbered item')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Numbered List (1.)"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '- [ ] ', '', 'Checklist task')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Task Checkbox (- [ ])"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applySelectionFormatting(
                      note.id,
                      '\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Data A | Data B |\n',
                      '',
                      ''
                    )
                  }
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Insert Table"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applySelectionFormatting(note.id, '> ', '', 'Blockquote text')}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Quote (>)"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const textarea = textareaRefs.current[note.id];
                    const start = textarea?.selectionStart ?? 0;
                    const end = textarea?.selectionEnd ?? 0;
                    const currentVal = textarea?.value ?? note.content;
                    const selected = currentVal.substring(start, end);
                    const snippet = selected.trim() ? selected : '// Write code or shell script here';
                    applySelectionFormatting(note.id, '```typescript\n', '\n```\n', snippet);
                  }}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  style={{ color: 'var(--text-main)' }}
                  title="Fenced Code Block (```typescript)"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Undo / Redo, WordWrap & Granular Font Size Controls (8px to 20px) */}
              <div
                style={{ borderColor: 'var(--border-color)' }}
                className="flex items-center gap-1 shrink-0 pl-1.5 border-l"
              >
                <button
                  type="button"
                  disabled={note.undoStack.length === 0}
                  onClick={() => handleUndo(note.id)}
                  style={{
                    color: note.undoStack.length > 0 ? 'var(--text-main)' : 'var(--text-muted)',
                    opacity: note.undoStack.length > 0 ? 1 : 0.4
                  }}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  title={`Undo (5-step history, ${note.undoStack.length} available)`}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={note.redoStack.length === 0}
                  onClick={() => handleRedo(note.id)}
                  style={{
                    color: note.redoStack.length > 0 ? 'var(--text-main)' : 'var(--text-muted)',
                    opacity: note.redoStack.length > 0 ? 1 : 0.4
                  }}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  title={`Redo (5-step history, ${note.redoStack.length} available)`}
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateNoteWithUndo(note.id, (n) => ({
                      ...n,
                      wordWrap: !n.wordWrap
                    }))
                  }
                  style={{
                    color: note.wordWrap ? 'var(--accent)' : 'var(--text-muted)'
                  }}
                  className="p-1 rounded hover:opacity-75 cursor-pointer shrink-0"
                  title="Toggle Word Wrap"
                >
                  <WrapText className="w-3.5 h-3.5" />
                </button>

                {/* Granular Font Size Controller: 8px to 20px with +/- buttons */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                  className="flex items-center gap-0.5 border rounded px-1 py-0.5 shrink-0 select-none text-xs"
                >
                  <button
                    type="button"
                    disabled={currentFontSizePx <= 8}
                    onClick={() =>
                      updateNoteWithUndo(note.id, (n) => ({
                        ...n,
                        fontSizePx: Math.max(8, (n.fontSizePx || currentFontSizePx) - 1)
                      }))
                    }
                    className="px-1 hover:text-indigo-400 disabled:opacity-30 cursor-pointer font-bold text-[11px]"
                    title="Decrease font size (-1px, min 8px)"
                  >
                    A-
                  </button>

                  <select
                    value={currentFontSizePx}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateNoteWithUndo(note.id, (n) => ({ ...n, fontSizePx: val }));
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-main)'
                    }}
                    className="text-[10px] font-mono font-semibold cursor-pointer focus:outline-none"
                    title="Pick font size (8px to 20px)"
                  >
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((px) => (
                      <option key={px} value={px} style={{ backgroundColor: 'var(--bg-card)' }}>
                        {px}px
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={currentFontSizePx >= 20}
                    onClick={() =>
                      updateNoteWithUndo(note.id, (n) => ({
                        ...n,
                        fontSizePx: Math.min(20, (n.fontSizePx || currentFontSizePx) + 1)
                      }))
                    }
                    className="px-1 hover:text-indigo-400 disabled:opacity-30 cursor-pointer font-bold text-[11px]"
                    title="Increase font size (+1px, max 20px)"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* NOTION-STYLE PROPERTIES DRAWER (Req #4 & Req #5) */}
            {isPropsOpen && (
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
                className="p-3 border-b text-xs space-y-2 select-none shrink-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Domain
                    </label>
                    <select
                      value={note.domain}
                      onChange={(e) =>
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          domain: e.target.value as NoteDomain
                        }))
                      }
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                      className="w-full text-xs rounded p-1 border mt-0.5 cursor-pointer"
                    >
                      <option value="AI_ENGINE">🤖 AI Prompts & Protocols</option>
                      <option value="KNOWLEDGE_HUB">📚 Project & Video Verbatim</option>
                      <option value="RAW_SCRATCHPAD">📋 Misc Notepad Table</option>
                      <option value="TAXONOMY_LEXICON">🧬 Taxonomy & Canonicals</option>
                      <option value="PATH_DIRECTORY">🗂️ Target Folders Map</option>
                      <option value="DAILY_PULSE">⚡ Daily Checklists & Pulse</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Main Category
                    </label>
                    <input
                      type="text"
                      value={note.mainCategory}
                      onChange={(e) =>
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          mainCategory: e.target.value
                        }))
                      }
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                      className="w-full text-xs rounded p-1 border mt-0.5"
                    />
                  </div>

                  <div>
                    <label
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Sub Category
                    </label>
                    <input
                      type="text"
                      value={note.subCategory}
                      onChange={(e) =>
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          subCategory: e.target.value
                        }))
                      }
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                      className="w-full text-xs rounded p-1 border mt-0.5"
                    />
                  </div>
                </div>

                {/* Notion Extensible Custom Properties (Req #4) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Notion Custom Properties ({Object.keys(note.properties).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const propKey = window.prompt(
                          'Enter property name (e.g. Status, Priority, Source_URL, Owner):'
                        );
                        if (!propKey) return;
                        const propVal = window.prompt(`Enter value for ${propKey}:`) || '';
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          properties: { ...n.properties, [propKey]: propVal }
                        }));
                      }}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--accent)'
                      }}
                      className="text-[10px] px-2 py-0.5 rounded border hover:opacity-80 cursor-pointer"
                    >
                      + Add Property
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {Object.entries(note.properties).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)'
                        }}
                        className="flex items-center justify-between p-1.5 rounded border text-[11px] gap-1 shadow-sm"
                      >
                        <span
                          className="font-semibold font-mono truncate"
                          style={{ color: 'var(--accent)' }}
                        >
                          {key}:
                        </span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const nextVal = e.target.value;
                            updateNoteWithUndo(note.id, (n) => ({
                              ...n,
                              properties: { ...n.properties, [key]: nextVal }
                            }));
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--text-main)'
                          }}
                          className="flex-1 min-w-0 text-[11px] focus:outline-none px-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateNoteWithUndo(note.id, (n) => {
                              const copy = { ...n.properties };
                              delete copy[key];
                              return { ...n, properties: copy };
                            });
                          }}
                          className="text-zinc-500 hover:text-red-400 p-0.5 cursor-pointer"
                          title="Remove property"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags and Timestamps */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Tags:
                  </span>
                  {note.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--accent)'
                      }}
                      className="px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 font-mono"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() =>
                          updateNoteWithUndo(note.id, (n) => ({
                            ...n,
                            tags: n.tags.filter((_, idx) => idx !== tIdx)
                          }))
                        }
                        className="hover:opacity-75 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newTag = window.prompt('Enter new tag:');
                      if (newTag) {
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          tags: [...n.tags, newTag.trim().toLowerCase().replace(/\s+/g, '-')]
                        }));
                      }
                    }}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-muted)'
                    }}
                    className="px-2 py-0.5 rounded-full border text-[10px] cursor-pointer hover:opacity-80"
                  >
                    + Add Tag
                  </button>

                  <div
                    className="ml-auto text-[10px] font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Created: {new Date(note.createdAt).toLocaleDateString()} · Updated:{' '}
                    {new Date(note.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PANE BODY / WORKSPACE */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col">
              {/* NOTE TITLE & BRIEF BENEATH HEADER (Upload 1 & 2) */}
              <div className="mb-2 shrink-0">
                <input
                  type="text"
                  value={note.title}
                  onChange={(e) =>
                    updateNoteWithUndo(note.id, (n) => ({
                      ...n,
                      title: e.target.value
                    }))
                  }
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-main)',
                    borderColor: 'transparent'
                  }}
                  className="w-full text-sm font-bold focus:outline-none border-b focus:border-zinc-700 py-0.5 truncate"
                  placeholder="Note Title..."
                />
                <input
                  type="text"
                  value={note.briefBeneath}
                  onChange={(e) =>
                    updateNoteWithUndo(note.id, (n) => ({
                      ...n,
                      briefBeneath: e.target.value
                    }))
                  }
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)'
                  }}
                  className="w-full text-xs italic focus:outline-none py-0.5 mt-0.5 truncate"
                  placeholder="Brief description shown beneath header (Upload 1)..."
                />
              </div>

              {/* VIEW 1: EDITOR_BLOCKS (Markdown Editor / Live Preview / Split Mode) */}
              {note.viewStyle === 'EDITOR_BLOCKS' && (
                <div className="flex-1 flex flex-col min-h-0">
                  {currentMode === 'edit' && (
                    <textarea
                      ref={(el) => {
                        textareaRefs.current[note.id] = el;
                      }}
                      value={note.content}
                      onChange={(e) =>
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          content: e.target.value
                        }))
                      }
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)',
                        whiteSpace: note.wordWrap ? 'pre-wrap' : 'pre',
                        minHeight: '180px',
                        fontSize: `${currentFontSizePx}px`
                      }}
                      className="flex-1 w-full rounded-lg border p-3 font-mono focus:outline-none resize-none leading-relaxed select-text"
                      placeholder="Start typing your note here (Markdown, headings, lists, tables, prompts)..."
                    />
                  )}

                  {currentMode === 'preview' && (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        minHeight: '180px',
                        fontSize: `${currentFontSizePx}px`
                      }}
                      className="flex-1 rounded-lg border p-3.5 overflow-y-auto select-text"
                    >
                      {renderMarkdownPreview(note.content, note.id, currentFontSizePx)}
                    </div>
                  )}

                  {currentMode === 'split' && (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-h-0">
                      <textarea
                        ref={(el) => {
                          textareaRefs.current[note.id] = el;
                        }}
                        value={note.content}
                        onChange={(e) =>
                          updateNoteWithUndo(note.id, (n) => ({
                            ...n,
                            content: e.target.value
                          }))
                        }
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)',
                          whiteSpace: note.wordWrap ? 'pre-wrap' : 'pre',
                          minHeight: '180px',
                          fontSize: `${currentFontSizePx}px`
                        }}
                        className="w-full h-full rounded-lg border p-3 font-mono focus:outline-none resize-none leading-relaxed select-text"
                        placeholder="Start typing your note here..."
                      />
                      <div
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)',
                          minHeight: '180px',
                          fontSize: `${currentFontSizePx}px`
                        }}
                        className="h-full rounded-lg border p-3 overflow-y-auto select-text"
                      >
                        {renderMarkdownPreview(note.content, note.id, currentFontSizePx)}
                      </div>
                    </div>
                  )}

                  {/* 1-CLICK COPY PROMPT CARDS (Collapsible - Issue 2) */}
                  {note.copyBlocks.length > 0 && (
                    <div
                      className="mt-3 shrink-0 rounded-xl border p-2 transition-all shadow-sm"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <div
                        onClick={() =>
                          setCopyBlocksCollapsed((prev) => ({
                            ...prev,
                            [note.id]: prev[note.id] === undefined ? false : !prev[note.id]
                          }))
                        }
                        className="flex items-center justify-between cursor-pointer select-none py-0.5 px-1 hover:opacity-90"
                      >
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                          style={{ color: 'var(--accent)' }}
                        >
                          {copyBlocksCollapsed[note.id] ?? true ? (
                            <ChevronRight className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          <Sparkles className="w-3.5 h-3.5" />
                          1-Click Copyable Prompt Blocks ({note.copyBlocks.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {copyBlocksCollapsed[note.id] ?? true ? 'Click to unfold' : 'Click to collapse'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const title = window.prompt('Enter Prompt Card Title:');
                              if (!title) return;
                              const content = window.prompt('Enter Prompt Content:');
                              if (!content) return;
                              updateNoteWithUndo(note.id, (n) => ({
                                ...n,
                                copyBlocks: [
                                  ...n.copyBlocks,
                                  {
                                    id: `blk-${Date.now()}`,
                                    title,
                                    blockType: 'Prompt',
                                    content
                                  }
                                ]
                              }));
                            }}
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-main)'
                            }}
                            className="text-[10px] px-2 py-0.5 rounded border hover:opacity-80 cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Card
                          </button>
                        </div>
                      </div>

                      {!(copyBlocksCollapsed[note.id] ?? true) && (
                        <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                          {note.copyBlocks.map((blk) => (
                            <div
                              key={blk.id}
                              style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-color)'
                              }}
                              className="rounded-lg border p-2.5 space-y-1.5 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                                  {blk.title}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span
                                    className="text-[10px] font-mono px-1.5 py-0.2 rounded border"
                                    style={{
                                      backgroundColor: 'var(--bg-card)',
                                      borderColor: 'var(--border-color)',
                                      color: 'var(--text-muted)'
                                    }}
                                  >
                                    {blk.blockType}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(blk.content, blk.id)}
                                    style={{
                                      backgroundColor:
                                        copiedId === blk.id ? '#10b981' : 'var(--accent)',
                                      color: 'var(--bg-primary)'
                                    }}
                                    className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-all cursor-pointer shadow-sm"
                                  >
                                    {copiedId === blk.id ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy Prompt</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <pre
                                className="text-[11px] font-mono p-2 rounded whitespace-pre-wrap overflow-x-auto border"
                                style={{
                                  backgroundColor: 'var(--bg-card)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-main)'
                                }}
                              >
                                {blk.content}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: NOTEPAD TABLE VIEW (Req #6c & Req #15) */}
              {note.viewStyle === 'NOTEPAD_TABLE' && (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  {/* Informational Purpose Banner explaining the Tabular Scratchpad */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                    className="p-2.5 rounded-lg border text-[11px] leading-relaxed shrink-0 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                        <span>📋</span> Tabular Scratchpad Purpose
                      </span>
                      <span className="text-[10px] font-mono opacity-70">
                        {note.tableRows.length} rows captured
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Quickly capture text snippets from AI chats & websites row-by-row, tag them with intent (Clarify, Audit, Ask), select checkboxes, and 1-click compile them into clean AI prompts to feed back to ChatGPT / Claude.
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                      Raw Chat & Snippet Gems Table
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const formatted = buildPureCodeAiPrompt(note.tableRows);
                          copyToClipboard(formatted, `refeed-${note.id}`);
                        }}
                        style={{
                          backgroundColor:
                            copiedId === `refeed-${note.id}` ? '#10b981' : 'var(--accent)',
                          color: 'var(--bg-primary)'
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer shadow-sm transition-all"
                        title="Wrap selected rows into structured markdown prompt and copy to clipboard"
                      >
                        {copiedId === `refeed-${note.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied AI Prompt!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate AI Prompt (1-Click Copy)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newRow: ScratchpadTableRow = {
                            id: `row-${Date.now()}`,
                            selected: true,
                            capturedText: '',
                            source: 'ChatGPT',
                            intent: 'Clarify',
                            notes: ''
                          };
                          updateNoteWithUndo(note.id, (n) => ({
                            ...n,
                            tableRows: [...n.tableRows, newRow]
                          }));
                        }}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)'
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border hover:opacity-80 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Row</span>
                      </button>
                    </div>
                  </div>

                  {/* Horizontally & Vertically Scrollable Table with Resizable Columns and Rows (Point 1) */}
                  <div
                    className="border rounded-lg overflow-auto w-full flex-1 min-h-[160px] max-h-[500px]"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <table className="w-full min-w-[660px] text-left text-xs border-collapse table-fixed">
                      <thead
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-muted)'
                        }}
                        className="border-b font-mono text-[10px] uppercase sticky top-0 z-10"
                      >
                        <tr>
                          <th style={{ width: `${tableColWidths.sel}px` }} className="p-2 text-center select-none">
                            Sel
                          </th>
                          <th
                            style={{ width: `${tableColWidths.snippet}px` }}
                            className="p-2 relative group select-none"
                          >
                            <span>Captured Text / Snippet</span>
                            <div
                              onPointerDown={(e) => startTableColResize('snippet', e)}
                              className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/60 transition-colors touch-none"
                              title="Drag to resize column"
                            />
                          </th>
                          <th
                            style={{ width: `${tableColWidths.source}px` }}
                            className="p-2 relative group select-none"
                          >
                            <span>Source</span>
                            <div
                              onPointerDown={(e) => startTableColResize('source', e)}
                              className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/60 transition-colors touch-none"
                              title="Drag to resize column"
                            />
                          </th>
                          <th
                            style={{ width: `${tableColWidths.intent}px` }}
                            className="p-2 relative group select-none"
                          >
                            <span>Action Intent</span>
                            <div
                              onPointerDown={(e) => startTableColResize('intent', e)}
                              className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/60 transition-colors touch-none"
                              title="Drag to resize column"
                            />
                          </th>
                          <th
                            style={{ width: `${tableColWidths.notes}px` }}
                            className="p-2 relative group select-none"
                          >
                            <span>User Question / Notes</span>
                            <div
                              onPointerDown={(e) => startTableColResize('notes', e)}
                              className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/60 transition-colors touch-none"
                              title="Drag to resize column"
                            />
                          </th>
                          <th style={{ width: `${tableColWidths.del}px` }} className="p-2 text-center select-none">
                            Del
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                        {note.tableRows.map((row) => (
                          <tr
                            key={row.id}
                            style={{
                              backgroundColor: row.selected
                                ? 'var(--bg-card-hover)'
                                : 'var(--bg-card)'
                            }}
                          >
                            <td className="p-2 text-center align-top pt-3" style={{ width: `${tableColWidths.sel}px` }}>
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={(e) =>
                                  updateNoteWithUndo(note.id, (n) => ({
                                    ...n,
                                    tableRows: n.tableRows.map((r) =>
                                      r.id === row.id ? { ...r, selected: e.target.checked } : r
                                    )
                                  }))
                                }
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="p-1.5 align-top" style={{ width: `${tableColWidths.snippet}px` }}>
                              <textarea
                                value={row.capturedText}
                                onChange={(e) =>
                                  updateNoteWithUndo(note.id, (n) => ({
                                    ...n,
                                    tableRows: n.tableRows.map((r) =>
                                      r.id === row.id
                                        ? { ...r, capturedText: e.target.value }
                                        : r
                                    )
                                  }))
                                }
                                rows={2}
                                style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-main)',
                                  fontSize: `${currentFontSizePx}px`
                                }}
                                className="w-full rounded p-1.5 font-mono border focus:outline-none resize-y min-h-[56px] whitespace-pre-wrap break-words leading-relaxed"
                                placeholder="Paste raw chat text, prompt, or code snippet here..."
                              />
                            </td>
                            <td className="p-1.5 align-top" style={{ width: `${tableColWidths.source}px` }}>
                              <input
                                type="text"
                                value={row.source}
                                onChange={(e) =>
                                  updateNoteWithUndo(note.id, (n) => ({
                                    ...n,
                                    tableRows: n.tableRows.map((r) =>
                                      r.id === row.id ? { ...r, source: e.target.value } : r
                                    )
                                  }))
                                }
                                style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-main)'
                                }}
                                className="w-full rounded p-1 text-xs border focus:outline-none"
                              />
                            </td>
                            <td className="p-1.5 align-top" style={{ width: `${tableColWidths.intent}px` }}>
                              <select
                                value={row.intent}
                                onChange={(e) =>
                                  updateNoteWithUndo(note.id, (n) => ({
                                    ...n,
                                    tableRows: n.tableRows.map((r) =>
                                      r.id === row.id
                                        ? { ...r, intent: e.target.value as typeof row.intent }
                                        : r
                                    )
                                  }))
                                }
                                style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--accent)'
                                }}
                                className="w-full rounded p-1 text-xs border font-semibold cursor-pointer focus:outline-none"
                              >
                                <option value="Clarify">Clarify</option>
                                <option value="Understand">Understand</option>
                                <option value="Ask">Ask</option>
                                <option value="Audit">Audit</option>
                                <option value="Synthesize">Synthesize</option>
                              </select>
                            </td>
                            <td className="p-1.5 align-top" style={{ width: `${tableColWidths.notes}px` }}>
                              <textarea
                                value={row.notes}
                                onChange={(e) =>
                                  updateNoteWithUndo(note.id, (n) => ({
                                    ...n,
                                    tableRows: n.tableRows.map((r) =>
                                      r.id === row.id ? { ...r, notes: e.target.value } : r
                                    )
                                  }))
                                }
                                rows={2}
                                placeholder="What to ask AI about this snippet?"
                                style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-main)',
                                  fontSize: `${currentFontSizePx}px`
                                }}
                                className="w-full rounded p-1.5 font-mono border focus:outline-none resize-y min-h-[56px] whitespace-pre-wrap break-words"
                              />
                            </td>
                            <td className="p-1.5 text-center align-top pt-3" style={{ width: `${tableColWidths.del}px` }}>
                              <button
                                type="button"
                                onClick={() =>
                                  updateNoteWithUndo(note.id, (n) => ({
                                    ...n,
                                    tableRows: n.tableRows.filter((r) => r.id !== row.id)
                                  }))
                                }
                                className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer rounded"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Freeform Markdown Notes & Observations BELOW the Table */}
                  <div className="pt-2 border-t flex flex-col flex-1 min-h-[160px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-main)' }}>
                        ✍️ Freeform Notes & Observations Below Table
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Write notes, make additional markdown tables, or code blocks
                      </span>
                    </div>
                    <textarea
                      value={note.content}
                      onChange={(e) =>
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          content: e.target.value
                        }))
                      }
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)',
                        whiteSpace: note.wordWrap ? 'pre-wrap' : 'pre',
                        fontSize: `${currentFontSizePx}px`,
                        minHeight: '140px'
                      }}
                      className="w-full flex-1 rounded-lg border p-3 font-mono focus:outline-none resize-y leading-relaxed"
                      placeholder="Write markdown notes, explanations, or additional thoughts below your table..."
                    />
                  </div>
                </div>
              )}

              {/* VIEW 3: TARGET FOLDERS DIRECTORY MAP (Req #7 & Decision 4) */}
              {note.viewStyle === 'DIRECTORY_MAP' && (
                <div className="flex-1 flex flex-col space-y-2 min-h-0">
                  <div
                    className="flex items-center justify-between p-2 rounded-lg border shrink-0"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <span
                      className="text-xs font-semibold flex items-center gap-1.5"
                      style={{ color: 'var(--text-main)' }}
                    >
                      <FolderTree className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      Selected Target Folders Registry (PC, Laptop & Om OS)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const folderPath = window.prompt('Enter folder absolute path:');
                        if (!folderPath) return;
                        const whatIsInside = window.prompt('What is inside this folder?') || '';
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          targetFolders: [
                            ...n.targetFolders,
                            {
                              id: `dir-${Date.now()}`,
                              device: 'Windows_PC',
                              folderPath,
                              mainCategory: 'App_Data',
                              subCategory: 'Directory',
                              whatIsInside,
                              lastVerified: new Date().toISOString().slice(0, 10)
                            }
                          ]
                        }));
                      }}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                      className="text-xs px-2.5 py-1 rounded border hover:opacity-80 cursor-pointer"
                    >
                      + Add Folder
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto">
                    {note.targetFolders.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)'
                        }}
                        className="rounded-lg border p-3 space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded border"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--accent)'
                            }}
                          >
                            {f.device}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(f.folderPath, f.id)}
                            style={{ color: 'var(--text-muted)' }}
                            className="text-xs flex items-center gap-1 hover:opacity-80 cursor-pointer"
                          >
                            {copiedId === f.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copy Path</span>
                          </button>
                        </div>
                        <div
                          className="font-mono text-xs font-semibold truncate"
                          style={{ color: 'var(--text-main)' }}
                        >
                          {f.folderPath}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {f.whatIsInside}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 4: DAILY PULSE CHECKLIST BOARD (Req #10) */}
              {note.viewStyle === 'CHECKLIST_BOARD' && (
                <div className="flex-1 flex flex-col space-y-2 min-h-0">
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border shrink-0"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      {(
                        ['ALL', 'Daily_AI', 'Work', 'List', 'Special', 'Remember', 'Learn', 'Ponder'] as const
                      ).map((bucket) => {
                        const isSel = selectedDailyBucket === bucket;
                        return (
                          <button
                            key={bucket}
                            type="button"
                            onClick={() => setSelectedDailyBucket(bucket)}
                            style={{
                              backgroundColor: isSel ? 'var(--accent)' : 'var(--bg-card)',
                              color: isSel ? 'var(--bg-primary)' : 'var(--text-muted)',
                              borderColor: 'var(--border-color)'
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors"
                          >
                            {bucket.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const text = window.prompt('Enter checklist task:');
                        if (!text) return;
                        updateNoteWithUndo(note.id, (n) => ({
                          ...n,
                          checklistItems: [
                            ...n.checklistItems,
                            {
                              id: `chk-${Date.now()}`,
                              text,
                              completed: false,
                              bucket:
                                selectedDailyBucket === 'ALL' ? 'Daily_AI' : selectedDailyBucket
                            }
                          ]
                        }));
                      }}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                      className="text-xs px-2 py-1 rounded border hover:opacity-80 cursor-pointer"
                    >
                      + Add Task
                    </button>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto">
                    {note.checklistItems
                      .filter((item) =>
                        selectedDailyBucket === 'ALL'
                          ? true
                          : item.bucket === selectedDailyBucket
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-color)'
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border gap-2 shadow-sm"
                        >
                          <label className="flex items-center gap-2 cursor-pointer text-xs select-none flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={(e) =>
                                updateNoteWithUndo(note.id, (n) => ({
                                  ...n,
                                  checklistItems: n.checklistItems.map((c) =>
                                    c.id === item.id ? { ...c, completed: e.target.checked } : c
                                  )
                                }))
                              }
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            <span
                              className={`truncate ${
                                item.completed ? 'line-through opacity-50' : ''
                              }`}
                              style={{ color: 'var(--text-main)' }}
                            >
                              {item.text}
                            </span>
                          </label>

                          <span
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--accent)'
                            }}
                          >
                            {item.bucket.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      data-ag-id="NotesStudio_Root_Container"
      className="w-full h-full flex flex-col overflow-hidden select-auto"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-main)'
      }}
    >
      {/* 1. TOP GLOBAL TOOLBAR & 20-TAB HORIZONTAL RIBBON (Upload 2 Sketch 1) */}
      <header
        data-ag-id="NotesStudio_Top_GlobalNavbar"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}
        className="flex items-center justify-between border-b px-2 py-1 gap-2 shrink-0 h-11"
      >
        {/* Left: Collapsible Dashboard Menu Toggle Button (Sketch 2 [:=]) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            style={{
              backgroundColor: sidebarOpen ? 'var(--bg-card-hover)' : 'var(--accent)',
              color: sidebarOpen ? 'var(--text-main)' : 'var(--bg-primary)',
              borderColor: 'var(--border-color)'
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer shadow-sm transition-all"
            title="Toggle Dashboard Menu (Ctrl+B / Sideways Collapse)"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline font-mono">Menu</span>
          </button>
        </div>

        {/* Center: 20-Tab Horizontal Ribbon (Upload 2 Sketch 1: "upto 20" tabs) */}
        <div
          data-ag-id="NotesStudio_TabRibbon_20Bar"
          className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar px-1 min-w-0"
        >
          {openTabIds.map((tabId, idx) => {
            const tabNote = notes.find((n) => n.id === tabId);
            if (!tabNote) return null;
            const isCurrent = activeTabId === tabId;
            const isGlow = highlightedNoteId === tabId;
            return (
              <div
                key={tabId}
                draggable
                onDragStart={(e) => handleTabDragStart(idx, e)}
                onDragOver={(e) => handleTabDragOver(idx, e)}
                onDrop={(e) => handleTabDrop(idx, e)}
                onDragEnd={handleTabDragEnd}
                onClick={() => triggerNoteHighlight(tabId)}
                style={{
                  backgroundColor: isGlow
                    ? 'var(--bg-card-hover)'
                    : isCurrent
                    ? 'var(--bg-card)'
                    : 'transparent',
                  borderColor: isGlow
                    ? 'var(--accent)'
                    : isCurrent
                    ? 'var(--accent)'
                    : 'transparent',
                  color: isCurrent || isGlow ? 'var(--text-main)' : 'var(--text-muted)'
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t-lg border-b-2 text-xs font-medium cursor-grab active:cursor-grabbing shrink-0 transition-all ${
                  isCurrent || isGlow ? 'shadow-sm font-semibold scale-[1.02]' : 'hover:opacity-80'
                } ${isGlow ? 'ring-1 ring-zinc-400/80 shadow-md scale-[1.04]' : ''} ${
                  draggedTabIdx === idx ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
                }`}
                title={`Drag to reorder tabs. Click to focus "${tabNote.title}"`}
              >
                <span className="text-[10px] font-mono opacity-50">#{idx + 1}</span>
                {tabNote.isPinned && <span className="text-[10px]">📌</span>}
                <span className="max-w-[120px] truncate">{tabNote.title}</span>
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(tabId, e)}
                  className="rounded hover:opacity-75 p-0.5 cursor-pointer ml-1"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {openTabIds.length < MAX_OPEN_TABS && (
            <button
              type="button"
              onClick={() => handleCreateNewNote('AI_ENGINE')}
              style={{
                color: 'var(--text-muted)'
              }}
              className="p-1 rounded hover:opacity-80 cursor-pointer shrink-0"
              title="Add New Tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Layout Modes & Global Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Split Mode Switcher (Upload 2 Sketch 2: 1-Pane | 2+1 | 3+1 | 3x2) */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
            className="flex items-center rounded-lg border p-0.5"
          >
            <button
              type="button"
              onClick={() => {
                setSplitMode('SINGLE_PANE');
                setMaximizedPaneId(null);
              }}
              style={{
                backgroundColor: splitMode === 'SINGLE_PANE' ? 'var(--accent)' : 'transparent',
                color: splitMode === 'SINGLE_PANE' ? 'var(--bg-primary)' : 'var(--text-muted)'
              }}
              className="p-1 rounded text-xs transition-colors cursor-pointer"
              title="Single Pane (Focus View)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSplitMode('TWO_PLUS_BOTTOM');
                setMaximizedPaneId(null);
              }}
              style={{
                backgroundColor:
                  splitMode === 'TWO_PLUS_BOTTOM' ? 'var(--accent)' : 'transparent',
                color:
                  splitMode === 'TWO_PLUS_BOTTOM' ? 'var(--bg-primary)' : 'var(--text-muted)'
              }}
              className="p-1 rounded text-xs transition-colors cursor-pointer"
              title="2 Vertical Columns + 1 Horizontal Bottom Dock (2+1 Layout)"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSplitMode('THREE_PLUS_BOTTOM');
                setMaximizedPaneId(null);
              }}
              style={{
                backgroundColor:
                  splitMode === 'THREE_PLUS_BOTTOM' ? 'var(--accent)' : 'transparent',
                color:
                  splitMode === 'THREE_PLUS_BOTTOM' ? 'var(--bg-primary)' : 'var(--text-muted)'
              }}
              className="p-1 rounded text-xs transition-colors cursor-pointer"
              title="3 Vertical Columns + 1 Horizontal Bottom Dock (Upload 2 Sketch 2 Flagship)"
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSplitMode('GRID_3X2');
                setMaximizedPaneId(null);
              }}
              style={{
                backgroundColor: splitMode === 'GRID_3X2' ? 'var(--accent)' : 'transparent',
                color: splitMode === 'GRID_3X2' ? 'var(--bg-primary)' : 'var(--text-muted)'
              }}
              className="p-1 rounded text-xs transition-colors cursor-pointer"
              title="3x2 Grid (Up to 6 simultaneous panes)"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
            className="p-1.5 rounded-lg border hover:opacity-80 cursor-pointer"
            title="Search Notes (Ctrl+F, Exact & Fuzzy)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)'
            }}
            className="p-1.5 rounded-lg border hover:opacity-80 cursor-pointer"
            title="Export JSON Backup"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* ChatGPT-Style Annotations Deck Trigger (Point 3) */}
          <button
            type="button"
            onClick={() => setIsAnnotationDeckOpen((prev) => !prev)}
            style={{
              backgroundColor: isAnnotationDeckOpen ? 'var(--accent)' : 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: isAnnotationDeckOpen ? '#ffffff' : 'var(--text-main)'
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold hover:opacity-90 cursor-pointer transition-all shadow-sm shrink-0"
            title="Toggle ChatGPT-style Annotations Deck"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Annotations</span>
            {allAnnotations.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isAnnotationDeckOpen ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white'
                }`}
              >
                {allAnnotations.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY: LEFT SIDEWAYS COLLAPSIBLE MENU + RIGHT MULTI-PANE CANVAS */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* SIDEWAYS HORIZONTAL COLLAPSIBLE MENU (Upload 1 & Upload 2) */}
        <aside
          data-ag-id="NotesStudio_Left_Sidebar"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            width: sidebarOpen ? `${sidebarWidth}px` : '0px'
          }}
          className={`shrink-0 border-r flex flex-col transition-all duration-150 ease-in-out overflow-hidden ${
            !sidebarOpen ? 'border-r-0' : ''
          }`}
        >
          {/* Top Quick Search & Filter Controls */}
          <div
            className="p-2.5 border-b space-y-2 shrink-0"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)'
                }}
                className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs"
              >
                <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter notes..."
                  style={{ color: 'var(--text-main)' }}
                  className="w-full bg-transparent focus:outline-none text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:opacity-75 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Exact vs Approximate mode toggle */}
              <button
                type="button"
                onClick={() =>
                  setSearchMode((prev) => (prev === 'EXACT' ? 'APPROXIMATE' : 'EXACT'))
                }
                style={{
                  backgroundColor:
                    searchMode === 'APPROXIMATE' ? 'var(--accent)' : 'var(--bg-card)',
                  color: searchMode === 'APPROXIMATE' ? 'var(--bg-primary)' : 'var(--text-muted)',
                  borderColor: 'var(--border-color)'
                }}
                className="text-[10px] px-2 py-1 rounded-lg border font-mono font-semibold cursor-pointer shrink-0"
                title="Toggle Exact match vs Approximate (Fuzzy Levenshtein) match"
              >
                {searchMode === 'APPROXIMATE' ? '~Fuzzy' : 'Exact'}
              </button>
            </div>

            {selectedGroupFilter && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono text-indigo-400">
                  Filter: {selectedGroupFilter}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGroupFilter(null)}
                  className="text-[10px] text-zinc-400 hover:text-white cursor-pointer underline"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Accordions Inside Left Menu */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {/* UPLOAD 1 MATCH: Collapsible Groups (Knowledge Data & Views / Content Model) */}
            {collapsibleGroups.map((group) => {
              const isOpen = openSections[group.id] ?? true;
              const currentPillId = activeGroupTab[group.id] || group.tabs[0]?.id;
              const currentPill = group.tabs.find((t) => t.id === currentPillId) || group.tabs[0];

              return (
                <div
                  key={group.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)'
                  }}
                  className="rounded-xl border p-2.5 space-y-2 shadow-sm"
                >
                  {/* Collapsible Accordion Header */}
                  <div
                    onClick={() =>
                      setOpenSections((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                    }
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div
                      className="flex items-center gap-1.5 font-bold text-xs"
                      style={{ color: 'var(--text-main)' }}
                    >
                      <span>{isOpen ? '▼' : '▶'}</span>
                      <span>{group.icon}</span>
                      <span>{group.title}</span>
                    </div>
                  </div>

                  {/* Underneath Brief & Interactive Tabs (Upload 1) */}
                  {isOpen && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {group.whatIsHereBrief}
                      </p>

                      <div
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)'
                        }}
                        className="rounded-lg border p-2 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center gap-1">
                          {group.tabs.map((tab) => {
                            const isPillActive = tab.id === currentPillId;
                            const isFiltering = selectedGroupFilter === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                  setActiveGroupTab((prev) => ({ ...prev, [group.id]: tab.id }));
                                  setSelectedGroupFilter((prev) =>
                                    prev === tab.id ? null : tab.id
                                  );
                                }}
                                style={{
                                  backgroundColor: isFiltering
                                    ? 'var(--accent)'
                                    : isPillActive
                                    ? 'var(--bg-card)'
                                    : 'transparent',
                                  color: isFiltering
                                    ? 'var(--bg-primary)'
                                    : isPillActive
                                    ? 'var(--text-main)'
                                    : 'var(--text-muted)',
                                  borderColor: isFiltering
                                    ? 'var(--accent)'
                                    : 'var(--border-color)'
                                }}
                                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border cursor-pointer transition-all ${
                                  isFiltering ? 'shadow-sm' : ''
                                }`}
                                title="Click to view brief and filter notes"
                              >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => handleAddGroupTab(group.id)}
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-muted)'
                            }}
                            className="rounded-full px-1.5 py-0.5 text-[10px] border hover:opacity-80 cursor-pointer"
                            title="Add Custom View Tab"
                          >
                            +
                          </button>
                        </div>

                        {currentPill && (
                          <p
                            className="text-[11px] font-medium px-1"
                            style={{ color: 'var(--text-main)' }}
                          >
                            {currentPill.summaryLine}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* DOMAINS ACCORDION (Upload 2 Sketch 1 Main Headings -> Sub Headings) */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}
              className="rounded-xl border p-2.5 space-y-1.5 shadow-sm"
            >
              <div
                onClick={() =>
                  setOpenSections((prev) => ({ ...prev, domains: !prev.domains }))
                }
                className="flex items-center justify-between cursor-pointer font-bold text-xs"
                style={{ color: 'var(--text-main)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span>{openSections.domains ? '▼' : '▶'}</span>
                  <span>Canonical Domains</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {filteredNotes.length} notes
                </span>
              </div>

              {openSections.domains && (
                <div className="space-y-1 pt-1">
                  {(
                    [
                      ['ALL', 'All Domains', '🌐'],
                      ['AI_ENGINE', 'AI Prompts & Protocols', '🤖'],
                      ['KNOWLEDGE_HUB', 'Project & Video Verbatim', '📚'],
                      ['RAW_SCRATCHPAD', 'Misc Notepad Table', '📋'],
                      ['TAXONOMY_LEXICON', 'Taxonomy & Canonicals', '🧬'],
                      ['PATH_DIRECTORY', 'Target Folders Map', '🗂️'],
                      ['DAILY_PULSE', 'Daily Checklists & Pulse', '⚡']
                    ] as const
                  ).map(([domKey, label, icon]) => {
                    const isSel = selectedDomain === domKey;
                    const count =
                      domKey === 'ALL'
                        ? notes.length
                        : notes.filter((n) => n.domain === domKey).length;

                    return (
                      <button
                        key={domKey}
                        type="button"
                        onClick={() => setSelectedDomain(domKey)}
                        style={{
                          backgroundColor: isSel ? 'var(--bg-card-hover)' : 'transparent',
                          borderColor: isSel ? 'var(--accent)' : 'transparent',
                          color: isSel ? 'var(--accent)' : 'var(--text-muted)'
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSel ? 'font-semibold' : 'hover:opacity-80'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{icon}</span>
                          <span className="truncate">{label}</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-70 shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* NOTES VAULT LIST ACCORDION */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}
              className="rounded-xl border p-2.5 space-y-1.5 shadow-sm"
            >
              <div
                onClick={() =>
                  setOpenSections((prev) => ({ ...prev, notesList: !prev.notesList }))
                }
                className="flex items-center justify-between cursor-pointer font-bold text-xs"
                style={{ color: 'var(--text-main)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span>{openSections.notesList ? '▼' : '▶'}</span>
                  <span>Notes Vault ({filteredNotes.length})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewNote(selectedDomain === 'ALL' ? 'AI_ENGINE' : selectedDomain);
                  }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--accent)'
                  }}
                  className="px-1.5 py-0.2 rounded border text-[10px] hover:opacity-80 cursor-pointer"
                  title="Create Note in Current Domain"
                >
                  + New
                </button>
              </div>

              {openSections.notesList && (
                <div className="space-y-1 pt-1">
                  {filteredNotes.map((n) => {
                    const isTabOpen = openTabIds.includes(n.id);
                    const isCurrent = activeTabId === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleOpenNoteTab(n.id)}
                        style={{
                          backgroundColor: isCurrent
                            ? 'var(--bg-card-hover)'
                            : isTabOpen
                            ? 'var(--bg-secondary)'
                            : 'transparent',
                          borderColor: isCurrent ? 'var(--accent)' : 'transparent'
                        }}
                        className="p-2 rounded-lg border cursor-pointer transition-all hover:opacity-90 space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-xs font-semibold truncate"
                            style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-main)' }}
                          >
                            {n.isPinned && '📌 '}
                            {n.title}
                          </span>
                          <span
                            className="text-[10px] font-mono shrink-0"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {n.subCategory}
                          </span>
                        </div>
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {n.briefBeneath}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Sidebar Draggable Splitter Handle */}
        {sidebarOpen && (
          <div
            onPointerDown={startSidebarResize}
            onDoubleClick={() => setSidebarWidth(310)}
            className="w-1.5 shrink-0 hover:bg-indigo-500/40 active:bg-indigo-500/70 cursor-col-resize flex items-center justify-center transition-colors group select-none z-10 touch-none"
            title="Drag to resize sidebar width (Double-click to reset)"
          >
            <div className="w-[2px] h-8 rounded-full bg-zinc-600 group-hover:bg-indigo-400 group-active:bg-indigo-400" />
          </div>
        )}

        {/* 3. MULTI-PANE SPLIT WORKSPACE CANVAS (Upload 2 Sketch 2) */}
        <main
          data-ag-id="NotesStudio_Main_MultiPaneCanvas"
          style={{ backgroundColor: 'var(--bg-primary)' }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* 1. SINGLE PANE (FOCUS VIEW) */}
          {splitMode === 'SINGLE_PANE' && (
            <div className="flex-1 p-2 min-h-0 overflow-hidden">
              {visiblePaneNotes[0] ? (
                renderNotePane(visiblePaneNotes[0], 'Focus Note')
              ) : (
                <div
                  className="h-full flex items-center justify-center text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No open notes. Click "+ New Note" to start.
                </div>
              )}
            </div>
          )}

          {/* 2. TWO PLUS BOTTOM OR THREE PLUS BOTTOM (Upload 2 Sketch 2 Flagship Layouts!) */}
          {(splitMode === 'TWO_PLUS_BOTTOM' || splitMode === 'THREE_PLUS_BOTTOM') && (
            <div className="flex-1 flex flex-col p-2 gap-1.5 min-h-0 overflow-hidden w-full">
              {/* Top Vertical Columns (Dynamically fills 100% width with 1, 2, or 3 columns — ZERO space on right!) */}
              {topNotes.length === 1 && (
                <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden w-full">
                  {renderNotePane(topNotes[0], 'Note 1')}
                </div>
              )}

              {topNotes.length === 2 && (
                <div
                  ref={columnsContainerRef}
                  className="flex-1 flex flex-row min-h-0 overflow-hidden min-w-0 w-full"
                >
                  {/* Column 1 */}
                  <div
                    style={{ flex: `0 0 ${colPercents2[0]}%`, minWidth: '100px' }}
                    className="h-full min-h-0 flex flex-col overflow-hidden"
                  >
                    {renderNotePane(topNotes[0], 'Note 1')}
                  </div>

                  {/* Draggable Gutter (Between Note 1 and Note 2) */}
                  <div
                    onPointerDown={startCol2Resize}
                    onDoubleClick={() => setColPercents2([50, 50])}
                    className="w-2 shrink-0 hover:bg-indigo-500/40 active:bg-indigo-500/70 cursor-col-resize flex items-center justify-center transition-colors group select-none z-10 touch-none"
                    title="Drag to resize 2 columns (Double-click to balance 50/50)"
                  >
                    <div className="w-[2px] h-8 rounded-full bg-zinc-600 group-hover:bg-indigo-400 group-active:bg-indigo-400" />
                  </div>

                  {/* Column 2: flex-1 ensures it spans the exact remainder to the right border with zero leftover space */}
                  <div className="flex-1 h-full min-h-0 min-w-[100px] flex flex-col overflow-hidden">
                    {renderNotePane(topNotes[1], 'Note 2')}
                  </div>
                </div>
              )}

              {topNotes.length >= 3 && (
                <div
                  ref={columnsContainerRef}
                  className="flex-1 flex flex-row min-h-0 overflow-hidden min-w-0 w-full"
                >
                  {/* Column 1 */}
                  <div
                    style={{ flex: `0 0 ${columnPercents[0]}%`, minWidth: '100px' }}
                    className="h-full min-h-0 flex flex-col overflow-hidden"
                  >
                    {renderNotePane(topNotes[0], 'Note 1')}
                  </div>

                  {/* Draggable Gutter 1 */}
                  <div
                    onPointerDown={(e) => startColumnResize(0, e)}
                    onDoubleClick={resetColumnPercents}
                    className="w-2 shrink-0 hover:bg-indigo-500/40 active:bg-indigo-500/70 cursor-col-resize flex items-center justify-center transition-colors group select-none z-10 touch-none"
                    title="Drag to resize columns (Double-click to balance equal)"
                  >
                    <div className="w-[2px] h-8 rounded-full bg-zinc-600 group-hover:bg-indigo-400 group-active:bg-indigo-400" />
                  </div>

                  {/* Column 2 */}
                  <div
                    style={{ flex: `0 0 ${columnPercents[1]}%`, minWidth: '100px' }}
                    className="h-full min-h-0 flex flex-col overflow-hidden"
                  >
                    {renderNotePane(topNotes[1], 'Note 2')}
                  </div>

                  {/* Draggable Gutter 2 */}
                  <div
                    onPointerDown={(e) => startColumnResize(1, e)}
                    onDoubleClick={resetColumnPercents}
                    className="w-2 shrink-0 hover:bg-indigo-500/40 active:bg-indigo-500/70 cursor-col-resize flex items-center justify-center transition-colors group select-none z-10 touch-none"
                    title="Drag to resize columns (Double-click to balance equal)"
                  >
                    <div className="w-[2px] h-8 rounded-full bg-zinc-600 group-hover:bg-indigo-400 group-active:bg-indigo-400" />
                  </div>

                  {/* Column 3: flex-1 ensures it spans the exact remainder to the right border with zero leftover space */}
                  <div className="flex-1 h-full min-h-0 min-w-[100px] flex flex-col overflow-hidden">
                    {renderNotePane(topNotes[2], 'Note 3')}
                  </div>
                </div>
              )}

              {topNotes.length === 0 && (
                <div
                  className="flex-1 h-full flex items-center justify-center text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No open vertical notes. Click "+ New Note" or pick from the left menu.
                </div>
              )}

              {/* Horizontal Draggable Splitter (Above Note 4 Bottom Dock) */}
              {bottomDockNote && !bottomDrawerCollapsed && (
                <div
                  onPointerDown={startBottomDockResize}
                  onDoubleClick={() => setBottomDrawerCollapsed(true)}
                  className="h-2 shrink-0 -my-0.5 hover:bg-indigo-500/40 active:bg-indigo-500/70 cursor-row-resize flex items-center justify-center transition-colors group select-none z-10 touch-none"
                  title="Drag to resize bottom drawer height (Double-click to minimize)"
                >
                  <div className="w-12 h-[2px] rounded-full bg-zinc-600 group-hover:bg-indigo-400 group-active:bg-indigo-400" />
                </div>
              )}

              {/* Bottom Horizontal Note Dock */}
              {bottomDockNote && (
                <div
                  style={{
                    height: bottomDrawerCollapsed ? '34px' : `${bottomDockHeight}px`
                  }}
                  className={`w-full shrink-0 flex flex-col transition-all duration-150 overflow-hidden ${
                    highlightedNoteId === bottomDockNote.id
                      ? 'ring-2 ring-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.65)]'
                      : ''
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)'
                    }}
                    className="flex items-center justify-between px-3 py-1 border rounded-t-lg text-xs font-semibold shrink-0"
                  >
                    <span className="flex items-center gap-1.5 min-w-0 shrink">
                      <button
                        type="button"
                        onClick={() => setBottomDrawerCollapsed((prev) => !prev)}
                        className="p-1 rounded hover:bg-zinc-700/30 text-indigo-400 cursor-pointer transition-colors"
                        title={bottomDrawerCollapsed ? 'Click to Expand Bottom Dock' : 'Click to Collapse Bottom Dock'}
                      >
                        {bottomDrawerCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="font-mono text-indigo-400 font-bold shrink-0">
                        Horizontal Bottom Dock:
                      </span>
                      <select
                        value={bottomDockNote.id}
                        onChange={(e) => {
                          setBottomDockNoteId(e.target.value);
                          triggerNoteHighlight(e.target.value);
                        }}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)'
                        }}
                        className="text-[11px] font-semibold rounded px-1.5 py-0.5 border truncate max-w-[160px] sm:max-w-[220px] cursor-pointer focus:outline-none"
                        title="Switch note displayed in horizontal bottom dock"
                      >
                        {notes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.isPinned ? '📌 ' : ''}{n.title}
                          </option>
                        ))}
                      </select>
                      {highlightedNoteId === bottomDockNote.id && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500 text-white animate-pulse">
                          📍 LOCATED
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBottomDrawerCollapsed((prev) => !prev)}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)'
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded border hover:bg-zinc-700/30 text-xs font-mono transition-colors cursor-pointer shadow-sm"
                        title={bottomDrawerCollapsed ? 'Click to Expand Bottom Dock' : 'Click to Collapse Bottom Dock'}
                      >
                        {bottomDrawerCollapsed ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] opacity-90 font-medium">Click to Expand</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] opacity-90 font-medium">Click to Collapse</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {!bottomDrawerCollapsed && (
                    <div className="flex-1 min-h-0">
                      {renderNotePane(bottomDockNote, 'Bottom Dock', true)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. 3x2 GRID (Up to 6 simultaneous panes) */}
          {splitMode === 'GRID_3X2' && (
            <div className="flex-1 p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 min-h-0 overflow-y-auto">
              {visiblePaneNotes.slice(0, 6).map((n, i) => (
                <div key={n.id} className="min-h-[320px] h-full flex flex-col min-w-0">
                  {renderNotePane(n, `Pane ${i + 1}`)}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* CHATGPT-STYLE SIDE-PANEL ANNOTATIONS DECK (Point 3) */}
        {isAnnotationDeckOpen && (
          <aside
            data-ag-id="NotesStudio_Annotations_SideDeck"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              width: 'min(360px, 92vw)'
            }}
            className="absolute sm:relative right-0 top-0 bottom-0 z-40 h-full border-l shrink-0 flex flex-col shadow-2xl transition-all min-h-0"
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
              className="p-3 border-b flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                  Annotations Deck ({allAnnotations.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const targetNote =
                      notes.find(
                        (n) => n.id === (annotationFilterNoteId === 'ALL' ? openTabIds[0] : annotationFilterNoteId)
                      ) || notes[0];
                    if (targetNote) {
                      handleToolbarAnnotate(targetNote.id);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
                  title="Add New Annotation"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnotationDeckOpen(false)}
                  className="p-1 rounded hover:opacity-75 cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Close Annotations Deck"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-2.5 border-b space-y-2 shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                onClick={() => {
                  const prompt = buildAnnotationAiPrompt(
                    annotationFilterNoteId === 'ALL'
                      ? allAnnotations
                      : allAnnotations.filter((a) => a.noteId === annotationFilterNoteId)
                  );
                  copyToClipboard(prompt, 'export-all-annotations');
                }}
                style={{
                  backgroundColor:
                    copiedId === 'export-all-annotations' ? '#10b981' : 'var(--accent)',
                  color: '#ffffff'
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer shadow transition-all active:scale-98"
                title="Compile all annotations into structured Markdown for ChatGPT / Claude"
              >
                {copiedId === 'export-all-annotations' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied AI Prompt to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>1-Click Export Annotations to AI Prompt</span>
                  </>
                )}
              </button>

              {/* Filter by Note */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span style={{ color: 'var(--text-muted)' }} className="shrink-0">
                  Filter:
                </span>
                <select
                  value={annotationFilterNoteId}
                  onChange={(e) => setAnnotationFilterNoteId(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                  className="w-full text-[11px] rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Notes ({allAnnotations.length})</option>
                  {openNotes.map((n) => {
                    const count = (n.annotations || []).length;
                    return (
                      <option key={n.id} value={n.id}>
                        {n.title} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Annotation Cards List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0">
              {(annotationFilterNoteId === 'ALL'
                ? allAnnotations
                : allAnnotations.filter((a) => a.noteId === annotationFilterNoteId)
              ).length === 0 ? (
                <div className="text-center py-8 space-y-2 opacity-60">
                  <PenTool className="w-8 h-8 mx-auto text-zinc-500" />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    No annotations yet.
                  </p>
                  <p className="text-[11px] leading-relaxed max-w-[220px] mx-auto text-zinc-400">
                    Highlight any text or code in a note to summon the floating selection pen.
                  </p>
                </div>
              ) : (
                (annotationFilterNoteId === 'ALL'
                  ? allAnnotations
                  : allAnnotations.filter((a) => a.noteId === annotationFilterNoteId)
                ).map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                    className={`rounded-xl border p-3 space-y-2 shadow-sm transition-all hover:border-zinc-500 ${
                      ann.resolved ? 'opacity-60 line-through' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        style={{
                          backgroundColor:
                            ann.intent === 'Refactor'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : ann.intent === 'Audit'
                              ? 'rgba(168, 85, 247, 0.15)'
                              : ann.intent === 'Explain'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(99, 102, 241, 0.15)',
                          color:
                            ann.intent === 'Refactor'
                              ? '#f59e0b'
                              : ann.intent === 'Audit'
                              ? '#a855f7'
                              : ann.intent === 'Explain'
                              ? '#10b981'
                              : '#6366f1'
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-current"
                      >
                        {ann.intent}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Quoted Snippet */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                      className="p-2 rounded-lg border font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words max-h-24 overflow-y-auto"
                    >
                      {ann.selectedText}
                    </div>

                    {/* User Comment */}
                    <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-main)' }}>
                      💬 {ann.comment}
                    </p>

                    {/* Actions: Jump to Source, Resolve Checkbox, Delete */}
                    <div className="flex items-center justify-between pt-1 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={ann.resolved}
                          onChange={() => handleToggleResolveAnnotation(ann.noteId, ann.id)}
                          className="cursor-pointer"
                        />
                        <span style={{ color: 'var(--text-muted)' }}>Resolved</span>
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleJumpToAnnotation(ann)}
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--accent)'
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold cursor-pointer hover:opacity-85 shadow-sm"
                          title="Jump directly to this note & highlight pane"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          <span>Jump</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnotation(ann.noteId, ann.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer rounded"
                          title="Delete annotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 5. ANNOTATION & PROMPT COMPOSER MODAL (Triggered via Toolbar Pen or Annotations Deck) */}
      {activeSelection && annotationPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
              width: 'min(420px, 94vw)'
            }}
            className="p-4 rounded-xl border shadow-2xl space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <span className="font-bold flex items-center gap-1.5 text-sm" style={{ color: 'var(--accent)' }}>
                <PenTool className="w-4 h-4" />
                <span>Add Annotation & Prompt</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAnnotationPromptOpen(false);
                  setActiveSelection(null);
                }}
                className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quoted Selection Snippet */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)'
              }}
              className="p-2.5 rounded-lg border font-mono text-[11px] max-h-28 overflow-y-auto italic line-clamp-4 leading-relaxed"
            >
              "{activeSelection.text}"
            </div>

            {/* Intent Selector */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Action Intent:
              </label>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(['Clarify', 'Refactor', 'Audit', 'Explain', 'Ask AI'] as const).map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => setAnnotationIntent(intent)}
                    style={{
                      backgroundColor: annotationIntent === intent ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: annotationIntent === intent ? '#ffffff' : 'var(--text-main)',
                      borderColor: 'var(--border-color)'
                    }}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer transition-all"
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            {/* User Comment / Prompt */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Your Question or Instructions:
              </label>
              <textarea
                value={annotationComment}
                onChange={(e) => setAnnotationComment(e.target.value)}
                placeholder="What to note or ask AI about this snippet?..."
                rows={3}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)'
                }}
                className="w-full mt-1 p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                autoFocus
              />
            </div>

            {/* Save / Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setAnnotationPromptOpen(false);
                  setActiveSelection(null);
                }}
                className="px-3 py-1.5 rounded text-xs hover:opacity-80 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAnnotation}
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff'
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer shadow flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Deck</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXACT & APPROXIMATE FUZZY SEARCH MODAL (Req #9) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 p-4">
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div
              className="p-3 border-b flex items-center gap-2"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Search className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, tags, prompt blocks, tables, folder paths..."
                style={{ color: 'var(--text-main)' }}
                className="w-full bg-transparent focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setSearchMode((prev) => (prev === 'EXACT' ? 'APPROXIMATE' : 'EXACT'))
                }
                style={{
                  backgroundColor:
                    searchMode === 'APPROXIMATE' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: searchMode === 'APPROXIMATE' ? 'var(--bg-primary)' : 'var(--text-muted)',
                  borderColor: 'var(--border-color)'
                }}
                className="text-xs px-2 py-1 rounded border font-mono font-semibold cursor-pointer shrink-0"
              >
                {searchMode === 'APPROXIMATE' ? '~ Fuzzy Levenshtein' : 'Exact Phrase'}
              </button>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded hover:opacity-75 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                Found {filteredNotes.length} matching notes ({searchMode} search):
              </div>
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    handleOpenNoteTab(n.id);
                    setIsSearchModalOpen(false);
                  }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                  className="p-3 rounded-xl border cursor-pointer hover:border-zinc-500 transition-colors space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                      {n.isPinned && '📌 '}
                      {n.title}
                    </span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.2 rounded border"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--accent)'
                      }}
                    >
                      {n.domain}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {n.briefBeneath}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesStudioView;
