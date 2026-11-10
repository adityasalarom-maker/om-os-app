import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type KnowledgeItem } from '../db';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Tag, 
  Bookmark, 
  Quote, 
  HelpCircle, 
  Trash2, 
  Edit3, 
  Download,
  Copy,
  Check,
  Upload,
  ArrowDown,
  ArrowUp,
  Lock,
  Unlock,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  FolderArchive,
  Highlighter,
  ExternalLink,
  Network,
  Link2,
  CornerDownRight,
  Sparkles,
  Camera,
  Cpu,
  Zap,
  Layers
} from 'lucide-react';
import { 
  executeHybridSearch, 
  clusterVaultNotes, 
  synthesizeVaultAnswer, 
  type HybridSearchResult, 
  type SemanticCluster, 
  type SynthesizedAnswer 
} from '../services/semanticVectorEngine';
import { 
  isVaultEncrypted, 
  encryptVaultText, 
  decryptVaultText, 
  isSessionUnlocked, 
  setSessionPassphrase 
} from '../services/vaultCrypto';
import { 
  formatNoteWithYAML, 
  exportVaultToZip, 
  exportVaultToDirectoryPicker, 
  exportVaultAsMasterMarkdown, 
  downloadBlob, 
  isFileSystemAccessSupported, 
  sanitizeNoteFilename 
} from '../services/vaultExporter';
import { KnowledgeGraphView } from './KnowledgeGraphView';
import { WikilinkAutoLinkerModal } from './WikilinkAutoLinkerModal';
import { 
  getBacklinksForNote, 
  getUnlinkedMentionsForNote, 
  convertMentionToWikilink 
} from '../services/graphEngine';
const DocumentIntelligenceModal = React.lazy(() => import('./DocumentIntelligenceModal').then(m => ({ default: m.DocumentIntelligenceModal })));

export const KnowledgeVault: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'keyword' | 'ask'>('hybrid');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<KnowledgeItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [linkingNotification, setLinkingNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'notes' | 'graph'>('notes');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAutoLinkerOpen, setIsAutoLinkerOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // Form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<KnowledgeItem['type']>('Note');
  const [editTags, setEditTags] = useState('');
  const [encryptOnSave, setEncryptOnSave] = useState(false);

  // Vault Encryption state
  const [vaultUnlocked, setVaultUnlocked] = useState(isSessionUnlocked());
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [decryptedCache, setDecryptedCache] = useState<{ [id: string]: string }>({});
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const notes = useLiveQuery(() => db.knowledge.toArray(), []) || [];

  // When vault unlocks, decrypt active note if encrypted
  useEffect(() => {
    if (activeNote && isVaultEncrypted(activeNote.content) && vaultUnlocked) {
      decryptVaultText(activeNote.content).then(plain => {
        setDecryptedCache(prev => ({ ...prev, [activeNote.id]: plain }));
      }).catch(err => {
        setVaultError(err.message);
      });
    }
  }, [activeNote, vaultUnlocked]);

  // Full-Text Inverted Index Search & Match Snippet Extraction
  const getNoteSearchText = (note: KnowledgeItem): string => {
    if (isVaultEncrypted(note.content)) {
      return decryptedCache[note.id] || '';
    }
    return note.content;
  };

  const getMatchedSnippet = (text: string, query: string): string | null => {
    if (!query.trim()) return null;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    if (idx === -1) return null;

    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + query.length + 60);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return prefix + text.slice(start, end).replace(/\n/g, ' ') + suffix;
  };

  // Semantic Clustering across vault notes
  const semanticClusters = clusterVaultNotes(notes);

  // Hybrid Search Execution
  const hybridSearchResults: HybridSearchResult[] = (searchQuery.trim() && searchMode !== 'keyword')
    ? executeHybridSearch(searchQuery, notes, { semanticWeight: 0.65 })
    : [];

  // Extractive Direct Q&A Answer Synthesis
  const synthesizedAnswer: SynthesizedAnswer | null = (searchMode === 'ask' || searchQuery.includes('?')) && searchQuery.trim()
    ? synthesizeVaultAnswer(searchQuery, notes)
    : null;

  const filteredNotes = notes.filter(note => {
    if (selectedType !== 'All' && note.type !== selectedType) return false;

    if (selectedClusterId) {
      const cluster = semanticClusters.find(c => c.id === selectedClusterId);
      if (cluster && !cluster.itemIds.includes(note.id)) return false;
    }

    if (!searchQuery.trim()) return true;

    if (searchMode === 'hybrid') {
      const match = hybridSearchResults.find(h => h.item.id === note.id);
      return match !== undefined;
    }

    const q = searchQuery.toLowerCase();
    const matchTitle = note.title.toLowerCase().includes(q);
    const matchTags = note.tags.some(t => t.toLowerCase().includes(q));
    const bodyText = getNoteSearchText(note);
    const matchContent = bodyText.toLowerCase().includes(q);
    const matchType = note.type.toLowerCase().includes(q);
    return matchTitle || matchTags || matchContent || matchType;
  }).sort((a, b) => {
    if (searchQuery.trim() && searchMode === 'hybrid') {
      const scoreA = hybridSearchResults.find(h => h.item.id === a.id)?.combinedScore || 0;
      const scoreB = hybridSearchResults.find(h => h.item.id === b.id)?.combinedScore || 0;
      return scoreB - scoreA;
    }
    return b.updatedAt - a.updatedAt;
  });

  // Calculate matching blocks in active note for Jump-to-Location Highlighter
  const activeContentText = activeNote ? (decryptedCache[activeNote.id] || activeNote.content) : '';
  const noteBlocks = activeContentText ? activeContentText.split(/\n\s*\n/) : [];

  const matchedBlockIndices: number[] = [];
  if (searchQuery.trim() && activeNote && !isVaultEncrypted(activeNote.content) || (activeNote && vaultUnlocked)) {
    const qLower = searchQuery.toLowerCase();
    noteBlocks.forEach((block, idx) => {
      if (block.toLowerCase().includes(qLower)) {
        matchedBlockIndices.push(idx);
      }
    });
  }

  // Scroll to active match block
  const handleJumpToMatch = (direction: 'next' | 'prev') => {
    if (matchedBlockIndices.length === 0) return;
    let nextIdx = direction === 'next' ? currentMatchIndex + 1 : currentMatchIndex - 1;
    if (nextIdx >= matchedBlockIndices.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = matchedBlockIndices.length - 1;
    setCurrentMatchIndex(nextIdx);

    const targetBlockId = `vault-block-${matchedBlockIndices[nextIdx]}`;
    const el = document.getElementById(targetBlockId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleStartNewNote = () => {
    setActiveNote(null);
    setEditTitle('');
    setEditContent('');
    setEditType('Note');
    setEditTags('');
    setEncryptOnSave(vaultUnlocked);
    setIsEditing(true);
  };

  const handleSelectNote = async (note: KnowledgeItem) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditType(note.type);
    setEditTags(note.tags.join(', '));
    setIsEditing(false);
    setCurrentMatchIndex(0);

    if (isVaultEncrypted(note.content)) {
      setEncryptOnSave(true);
      if (vaultUnlocked) {
        try {
          const plain = await decryptVaultText(note.content);
          setDecryptedCache(prev => ({ ...prev, [note.id]: plain }));
          setEditContent(plain);
        } catch (err: any) {
          setVaultError(err.message);
        }
      } else {
        setEditContent(note.content);
      }
    } else {
      setEncryptOnSave(false);
      setEditContent(note.content);
    }
  };

  const handleSaveNote = async () => {
    if (!editTitle.trim()) return;
    const now = Date.now();
    const tagArray = editTags.split(',').map(t => t.trim()).filter(Boolean);

    let finalContent = editContent;
    if (encryptOnSave) {
      if (!vaultUnlocked) {
        setShowPassphraseModal(true);
        return;
      }
      finalContent = await encryptVaultText(editContent);
    }

    if (activeNote) {
      await db.knowledge.update(activeNote.id, {
        title: editTitle.trim(),
        content: finalContent,
        type: editType,
        tags: tagArray,
        updatedAt: now
      });
      setActiveNote({
        ...activeNote,
        title: editTitle.trim(),
        content: finalContent,
        type: editType,
        tags: tagArray,
        updatedAt: now
      });
      if (!encryptOnSave) {
        setDecryptedCache(prev => {
          const copy = { ...prev };
          delete copy[activeNote.id];
          return copy;
        });
      }
    } else {
      const newId = `know-${now}`;
      const newRecord: KnowledgeItem = {
        id: newId,
        title: editTitle.trim(),
        content: finalContent,
        type: editType,
        tags: tagArray,
        createdAt: now,
        updatedAt: now
      };
      await db.knowledge.add(newRecord);
      setActiveNote(newRecord);
    }
    setIsEditing(false);
  };

  const handleDeleteNote = async (id: string) => {
    await db.knowledge.delete(id);
    if (activeNote?.id === id) {
      setActiveNote(null);
      setIsEditing(false);
    }
  };

  // Generate GFM Markdown with YAML frontmatter
  // Two-Way Living Markdown Vault Export Handlers
  const handleExportToDirectory = async () => {
    if (notes.length === 0) return;
    setIsExporting(true);
    setExportStatusMessage(null);
    try {
      const result = await exportVaultToDirectoryPicker(notes, { decryptedCache });
      if (result.success) {
        setExportStatusMessage(`Synced ${result.count} notes directly to folder "${result.folderName}".`);
      } else if (!result.userCancelled && result.error) {
        setExportStatusMessage(`Error: ${result.error}`);
      }
    } catch (err: any) {
      setExportStatusMessage(`Failed: ${err?.message || 'Directory export failed'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZip = async () => {
    if (notes.length === 0) return;
    setIsExporting(true);
    setExportStatusMessage(null);
    try {
      const zipBlob = await exportVaultToZip(notes, { decryptedCache });
      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(zipBlob, `om_knowledge_vault_export_${timestamp}.zip`);
      setExportStatusMessage(`Packaged ${notes.length} notes into ZIP archive.`);
    } catch (err: any) {
      setExportStatusMessage(`Failed to build ZIP: ${err?.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllNotesMaster = () => {
    if (notes.length === 0) return;
    const blob = exportVaultAsMasterMarkdown(notes, { decryptedCache });
    const timestamp = new Date().toISOString().split('T')[0];
    downloadBlob(blob, `om_knowledge_vault_master_${timestamp}.md`);
    setExportStatusMessage(`Downloaded master archive (${notes.length} notes).`);
  };

  // Export single note as .md file with standardized YAML frontmatter
  const handleExportMarkdown = (note: KnowledgeItem) => {
    const markdown = formatNoteWithYAML(note, decryptedCache);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const filename = sanitizeNoteFilename(note.title, note.id);
    downloadBlob(blob, filename);
  };

  // Copy raw GFM Markdown with YAML frontmatter to clipboard
  const handleCopyMarkdown = async (note: KnowledgeItem) => {
    const markdown = formatNoteWithYAML(note, decryptedCache);
    await navigator.clipboard.writeText(markdown);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };



  // Import external .md file into Knowledge Vault
  const handleImportMarkdownFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    let title = file.name.replace(/\.md$/i, '');
    let content = text;
    let tags: string[] = ['Imported'];
    let type: KnowledgeItem['type'] = 'Note';

    // Parse YAML frontmatter if present
    const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      content = frontmatterMatch[2].trim();

      const titleMatch = yaml.match(/title:\s*"?([^"\r\n]+)"?/i);
      if (titleMatch) title = titleMatch[1].trim();

      const typeMatch = yaml.match(/type:\s*(\w+)/i);
      if (typeMatch && ['Concept', 'Note', 'Source', 'Quote', 'Question'].includes(typeMatch[1])) {
        type = typeMatch[1] as KnowledgeItem['type'];
      }

      const tagsMatch = yaml.match(/tags:\s*\[(.*?)\]/i);
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      }
    } else {
      // Look for first # Heading as title
      const headingMatch = text.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      }
    }

    const now = Date.now();
    const newNote: KnowledgeItem = {
      id: `know-import-${now}`,
      title,
      type,
      content,
      tags,
      createdAt: now,
      updatedAt: now
    };

    await db.knowledge.add(newNote);
    setActiveNote(newNote);
    setImportNotification(`Imported note: "${title}"`);
    setTimeout(() => setImportNotification(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseInput.trim()) return;

    setSessionPassphrase(passphraseInput.trim());
    setVaultUnlocked(true);
    setShowPassphraseModal(false);
    setVaultError(null);
    setPassphraseInput('');
  };

  const handleLockVault = () => {
    setSessionPassphrase(null);
    setVaultUnlocked(false);
    setDecryptedCache({});
  };

  // Jump to or instantiate a wikilink target note
  const handleJumpToWikilink = (targetTitle: string) => {
    const clean = targetTitle.trim().toLowerCase();
    const found = notes.find(n => n.title.trim().toLowerCase() === clean);
    if (found) {
      setActiveNote(found);
      setIsEditing(false);
      setViewMode('notes');
    } else {
      setEditTitle(targetTitle);
      setEditContent('');
      setEditType('Concept');
      setEditTags('concept');
      setIsEditing(true);
      setViewMode('notes');
    }
  };

  // 1-Click convert unlinked mention to formal [[wikilink]] in Dexie
  const handleLinkMention = async (sourceNoteId: string, sourceTitle: string) => {
    if (!activeNote) return;
    const success = await convertMentionToWikilink(sourceNoteId, activeNote.title);
    if (success) {
      setLinkingNotification(`Linked "[[${activeNote.title}]]" inside "${sourceTitle}"!`);
      setTimeout(() => setLinkingNotification(null), 3000);
    }
  };

  // Helper to render text with highlighted search query matches and clickable [[wikilinks]]
  const renderHighlightedText = (text: string, query: string) => {
    if (!text) return null;

    // Split by wikilinks [[Target]] or [[Target|Alias]]
    const wikiParts = text.split(/(\[\[[^\]]+\]\])/g);

    return wikiParts.map((segment, segIdx) => {
      const wikiMatch = segment.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
      if (wikiMatch) {
        const targetTitle = wikiMatch[1].trim();
        const displayLabel = (wikiMatch[2] || targetTitle).trim();
        const exists = notes.some(n => n.title.trim().toLowerCase() === targetTitle.toLowerCase());

        return (
          <span
            key={`wiki-${segIdx}`}
            onClick={(e) => {
              e.stopPropagation();
              handleJumpToWikilink(targetTitle);
            }}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer font-semibold transition-all border ${
              exists
                ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-900/80 shadow-sm'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-900/60'
            }`}
            title={exists ? `Jump to note: ${targetTitle}` : `Concept note not created yet (click to create: ${targetTitle})`}
          >
            <Link2 size={11} className={exists ? 'text-indigo-400' : 'text-amber-400'} />
            <span>{displayLabel}</span>
          </span>
        );
      }

      if (!query.trim()) return segment;

      const parts = segment.split(new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={`mark-${segIdx}-${i}`} className="bg-amber-400/40 text-amber-200 px-1 py-0.5 rounded font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      );
    });
  };

  // Backlinks & Unlinked Mentions for active note
  const backlinks = activeNote ? getBacklinksForNote(activeNote, notes) : [];
  const unlinkedMentions = activeNote ? getUnlinkedMentionsForNote(activeNote, notes) : [];

  return (
    <div data-ag-id="KnowledgeVault_Root_Workspace" className="space-y-6 pb-20 md:pb-6">
      {/* Hidden File Input for Markdown Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportMarkdownFile} 
        accept=".md,.txt,.markdown" 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={22} />
            <span>Knowledge Vault & Synthesis Hub</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Full-text indexed atomic concepts, block highlighting, and GFM export with client-side AES-GCM-256 encryption.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* View Mode Segmented Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#141622] border border-[#272b3b]">
            <button
              onClick={() => setViewMode('notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'notes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen size={14} />
              <span>Notes View</span>
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'graph' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Network size={14} />
              <span>Knowledge Graph</span>
            </button>
          </div>

                    {/* Bidirectional Wikilink Auto-Linker */}
          <button
            onClick={() => setIsAutoLinkerOpen(true)}
            title="Scan & Auto-Link Unlinked Mentions across all 40+ Vault Archives"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 hover:text-white border border-purple-500/30 shadow-sm cursor-pointer"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span className="hidden sm:inline">Auto-Linker</span>
          </button>

          {/* Export Vault to Markdown Action */}
          <button
            onClick={() => {
              setIsExportModalOpen(true);
              setExportStatusMessage(null);
            }}
            title="Export Vault to Markdown (Directory Sync, ZIP Archive, or Master File)"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 hover:from-indigo-600/30 hover:to-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 shadow-sm cursor-pointer"
          >
            <FolderArchive size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">Export Vault</span>
          </button>

          {/* Import Markdown File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import external .md note file"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all bg-[#141622] hover:bg-[#202538] text-gray-300 hover:text-white border border-[#282d3e]"
          >
            <Upload size={14} className="text-purple-400" />
            <span className="hidden sm:inline">Import .md</span>
          </button>

          {/* Scan / OCR Document Intelligence */}
          <button
            onClick={() => setIsOcrModalOpen(true)}
            title="Scan document, receipt, or Sanskrit text via offline Tesseract WASM OCR"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 shadow-sm"
          >
            <Camera size={14} className="text-indigo-400" />
            <span>Scan / OCR</span>
          </button>

          {/* Vault Lock/Unlock Status */}
          <button
            onClick={() => vaultUnlocked ? handleLockVault() : setShowPassphraseModal(true)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all border ${
              vaultUnlocked 
                ? 'bg-emerald-600/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
                : 'bg-amber-600/10 text-amber-300 border-amber-500/30 hover:bg-amber-600/20'
            }`}
          >
            {vaultUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{vaultUnlocked ? 'Vault Unlocked' : 'Unlock Vault'}</span>
          </button>

          {/* New Note Button */}
          <button
            onClick={handleStartNewNote}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Notification Banners */}
      {importNotification && (
        <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check size={16} className="text-purple-400 shrink-0" />
          <span>{importNotification}</span>
        </div>
      )}
      {linkingNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{linkingNotification}</span>
        </div>
      )}

      {/* Conditional View: Knowledge Graph View vs Dual-Pane Notes View */}
      {viewMode === 'graph' ? (
        <KnowledgeGraphView
          notes={notes}
          activeNoteId={activeNote?.id}
          onSelectNote={(noteId) => {
            const found = notes.find(n => n.id === noteId);
            if (found) {
              setActiveNote(found);
              // Deliberately stay in graph view so user can freely inspect nodes & connections
            }
          }}
          onOpenInEditor={(noteId) => {
            const found = notes.find(n => n.id === noteId);
            if (found) {
              setActiveNote(found);
              setViewMode('notes');
            }
          }}
        />
      ) : (
      /* Main Dual-Pane Layout: Left List, Right Editor/Reader */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left List Pane (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Full-Text Search & Filter Bar */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Full-text search keywords, concepts, tags, or body text..."
                className="w-full bg-[#141622] border border-[#272b3d] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Mode Segmented Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#141622] border border-[#272b3b] text-[11px] font-semibold">
              <button
                onClick={() => setSearchMode('hybrid')}
                className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  searchMode === 'hybrid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap size={11} className="text-cyan-400" />
                <span>Hybrid AI</span>
              </button>
              <button
                onClick={() => setSearchMode('keyword')}
                className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  searchMode === 'keyword' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search size={11} className="text-indigo-400" />
                <span>BM25 Keyword</span>
              </button>
              <button
                onClick={() => setSearchMode('ask')}
                className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  searchMode === 'ask' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={11} className="text-purple-400" />
                <span>Ask Vault</span>
              </button>
            </div>

            {/* Match Counter Badge */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between text-[11px] font-mono bg-cyan-950/30 border border-cyan-900/40 text-cyan-300 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1">
                  <Zap size={12} className="text-cyan-400" />
                  <span>{searchMode === 'hybrid' ? 'Semantic Vector Matches:' : 'BM25 Matches:'}</span>
                </span>
                <span className="font-bold">{filteredNotes.length} notes</span>
              </div>
            )}

            {/* Thematic Semantic Clusters Bar */}
            {semanticClusters.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-[#222536]">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><Layers size={10} /> Thematic Clusters:</span>
                  {selectedClusterId && (
                    <button onClick={() => setSelectedClusterId(null)} className="text-cyan-400 hover:underline">
                      Clear Filter
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  {semanticClusters.map(cl => (
                    <button
                      key={cl.id}
                      onClick={() => setSelectedClusterId(selectedClusterId === cl.id ? null : cl.id)}
                      className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors border ${
                        selectedClusterId === cl.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-[#12141f] text-gray-400 hover:text-gray-200 border-[#222638]'
                      }`}
                    >
                      {cl.name} ({cl.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['All', 'Concept', 'Note', 'Source', 'Quote', 'Question'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#141622] text-gray-400 hover:text-white border border-[#282d3e]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Extractive Direct Q&A Synthesized Answer Card */}
          {synthesizedAnswer && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/40 space-y-2.5 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" />
                  <span>Synthesized Vault Answer</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {synthesizedAnswer.confidence}% Confidence
                </span>
              </div>
              <div className="text-xs text-gray-200 whitespace-pre-line leading-relaxed bg-[#10121b]/60 p-3 rounded-xl border border-purple-500/20">
                {synthesizedAnswer.answer}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Source Notes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {synthesizedAnswer.sources.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        const note = notes.find(n => n.id === s.id);
                        if (note) setActiveNote(note);
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-900/30 text-purple-200 hover:text-white border border-purple-700/40 transition-colors"
                    >
                      📄 {s.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Note Cards List */}
          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-8 text-center text-gray-500 text-xs">
                No notes found matching current search query or filter.
              </div>
            ) : (
              filteredNotes.map(note => {
                const isEnc = isVaultEncrypted(note.content);
                const isSelected = activeNote?.id === note.id;
                const bodyText = getNoteSearchText(note);
                const matchedSnippet = searchQuery.trim() ? getMatchedSnippet(bodyText, searchQuery) : null;
                const hybridMatch = searchQuery.trim() && searchMode === 'hybrid'
                  ? hybridSearchResults.find(h => h.item.id === note.id)
                  : null;

                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-[#1f2436] border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : 'bg-[#181a24] hover:bg-[#1a1d29] border-[#272b3b]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {renderHighlightedText(note.title, searchQuery)}
                        </h4>
                        {hybridMatch && hybridMatch.matchedConcepts.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {hybridMatch.matchedConcepts.map(c => (
                              <span key={c} className="text-[9px] bg-cyan-900/30 text-cyan-200 border border-cyan-700/40 px-1.5 py-0.2 rounded font-medium">
                                🎯 {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {hybridMatch && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 ${
                            hybridMatch.matchType === 'hybrid'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : hybridMatch.matchType === 'semantic'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          }`}>
                            <Zap size={10} />
                            <span>{Math.round(hybridMatch.combinedScore * 100)}% Match</span>
                          </span>
                        )}
                        {isEnc && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                            <Lock size={10} />
                            <span>AES-256</span>
                          </span>
                        )}
                        <span className="text-[10px] bg-[#141622] text-gray-400 px-2 py-0.5 rounded-full border border-[#262b3d]">
                          {note.type}
                        </span>
                      </div>
                    </div>

                    {/* Matched Content Snippet or Preview */}
                    {matchedSnippet ? (
                      <div className="text-[11px] text-indigo-200/90 bg-[#131623] p-2 rounded-lg border border-indigo-500/20 font-mono leading-relaxed">
                        <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold block mb-0.5">Match Snippet:</span>
                        {renderHighlightedText(matchedSnippet, searchQuery)}
                      </div>
                    ) : hybridMatch?.highlightSnippet ? (
                      <div className="text-[11px] text-cyan-200/90 bg-[#111420] p-2 rounded-lg border border-cyan-500/20 font-mono leading-relaxed">
                        <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block mb-0.5">Semantic Vector Snippet:</span>
                        <span>{hybridMatch.highlightSnippet}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        {isEnc ? (
                          <span className="font-mono text-gray-500 italic">🔒 Encrypted ciphertext payload</span>
                        ) : (
                          note.content.replace(/#+\s/g, '').slice(0, 130)
                        )}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map(tag => (
                          <span key={tag} className="text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            #{renderHighlightedText(tag, searchQuery)}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono">{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Editor / Reader Pane (7 cols) */}
        <div className="lg:col-span-7 bg-[#181a24] border border-[#272b3b] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          {isEditing ? (
            /* Editing / Creating Mode */
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#272b3b] pb-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note Title / Concept Name..."
                  className="bg-transparent text-lg font-bold text-white focus:outline-none w-full"
                />
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="bg-[#141622] border border-[#2d344d] text-xs font-semibold rounded-lg px-2.5 py-1 text-gray-200"
                >
                  <option value="Concept">Concept</option>
                  <option value="Note">Note</option>
                  <option value="Source">Source</option>
                  <option value="Quote">Quote</option>
                  <option value="Question">Question</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs">
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="Tags separated by commas (e.g. Vedanta, Metaphysics)..."
                  className="bg-[#141622] border border-[#282d3e] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 w-2/3"
                />

                {/* Encrypt on save toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={encryptOnSave}
                    onChange={(e) => setEncryptOnSave(e.target.checked)}
                    className="accent-indigo-500 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-[11px]">
                    <Shield size={12} className={encryptOnSave ? 'text-indigo-400' : 'text-gray-500'} />
                    <span>AES-256 Encrypt</span>
                  </span>
                </label>
              </div>

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write GFM markdown note, reflection, synthesis, or citations..."
                className="w-full flex-1 min-h-[360px] bg-[#141622] border border-[#272b3d] rounded-xl p-4 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#272b3b]">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  Save Note
                </button>
              </div>
            </div>
          ) : activeNote ? (
            /* Reading / Viewing Mode with Block Highlighting */
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Header Actions */}
                <div className="flex items-start justify-between gap-4 border-b border-[#272b3b] pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {renderHighlightedText(activeNote.title, searchQuery)}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] bg-[#141622] text-indigo-300 border border-[#272b3d] px-2 py-0.5 rounded-full">
                        {activeNote.type}
                      </span>
                      {isVaultEncrypted(activeNote.content) && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                          <Lock size={11} />
                          <span>AES-GCM-256 Protected</span>
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 font-mono">
                        Updated {new Date(activeNote.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Note Action Toolbar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyMarkdown(activeNote)}
                      title="Copy GFM Markdown to clipboard"
                      className="p-2 rounded-xl bg-[#141622] hover:bg-[#202538] text-gray-400 hover:text-white border border-[#272b3d] transition-colors flex items-center gap-1 text-xs"
                    >
                      {copiedId === activeNote.id ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    </button>
                    <button
                      onClick={() => handleExportMarkdown(activeNote)}
                      title="Download as GFM Markdown (.md)"
                      className="p-2 rounded-xl bg-[#141622] hover:bg-[#202538] text-gray-400 hover:text-white border border-[#272b3d] transition-colors"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      title="Edit Note"
                      className="p-2 rounded-xl bg-[#141622] hover:bg-[#202538] text-gray-400 hover:text-white border border-[#272b3d] transition-colors"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      title="Delete Note"
                      className="p-2 rounded-xl bg-[#141622] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-[#272b3d] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Jump-to-Location Search Match Navigation Bar */}
                {matchedBlockIndices.length > 0 && (
                  <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Highlighter size={14} className="text-amber-400" />
                      <span className="text-indigo-200 font-mono text-[11px]">
                        Match {currentMatchIndex + 1} of {matchedBlockIndices.length} blocks
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleJumpToMatch('prev')}
                        className="p-1 rounded-lg bg-[#141622] hover:bg-[#202538] text-gray-300 hover:text-white border border-[#272b3d]"
                        title="Previous Match"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => handleJumpToMatch('next')}
                        className="p-1 rounded-lg bg-[#141622] hover:bg-[#202538] text-gray-300 hover:text-white border border-[#272b3d]"
                        title="Next Match"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Structured Block Content View */}
                {isVaultEncrypted(activeNote.content) && !vaultUnlocked ? (
                  /* Locked Vault Prompt */
                  <div className="bg-[#12141d] border border-[#2d344d] rounded-2xl p-8 text-center space-y-4 my-6">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">This Note is Encrypted</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        Zero-knowledge AES-GCM-256 encryption. Unlock the vault with your master passphrase to read this note.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPassphraseModal(true)}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-600/30 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound size={14} />
                      <span>Unlock with Passphrase</span>
                    </button>
                  </div>
                ) : (
                  /* Render Blocks with Match Highlight */
                  <div 
                    ref={viewerContainerRef}
                    className="bg-[#141622] border border-[#262b3d] rounded-xl p-5 text-xs text-gray-200 leading-relaxed font-mono overflow-y-auto max-h-[500px] space-y-3.5"
                  >
                    {noteBlocks.map((block, idx) => {
                      const isMatched = matchedBlockIndices.includes(idx);
                      const isCurrentMatch = matchedBlockIndices[currentMatchIndex] === idx;

                      return (
                        <div
                          key={idx}
                          id={`vault-block-${idx}`}
                          className={`transition-all duration-200 rounded-lg whitespace-pre-wrap ${
                            isCurrentMatch 
                              ? 'bg-indigo-950/70 border-l-4 border-amber-400 p-3 shadow-md ring-1 ring-amber-400/30'
                              : isMatched 
                                ? 'bg-indigo-950/30 border-l-2 border-indigo-400 p-2.5'
                                : ''
                          }`}
                        >
                          {renderHighlightedText(block, searchQuery)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags Footer */}
              <div className="pt-4 border-t border-[#272b3b] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag size={13} className="text-gray-500 mr-1" />
                  {activeNote.tags.map(tag => (
                    <span key={tag} className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                      #{renderHighlightedText(tag, searchQuery)}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleCopyMarkdown(activeNote)}
                  className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  <Copy size={12} />
                  <span>Copy GFM</span>
                </button>
              </div>

              {/* Bidirectional Backlinks & Unlinked Mentions Section */}
              <div className="pt-5 border-t border-[#272b3b] space-y-5">
                {/* Direct Backlinks */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 size={13} className="text-indigo-400" />
                      <span>Linked Backlinks ({backlinks.length})</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">Explicit [[{activeNote.title}]]</span>
                  </div>

                  {backlinks.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic bg-[#141622] p-3 rounded-xl border border-white/5">
                      No other notes currently link directly to this note. Add <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded font-mono">[[{activeNote.title}]]</code> in any note to connect them.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {backlinks.map((b, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveNote(b.sourceNote)}
                          className="p-3 rounded-xl bg-[#141622] hover:bg-[#1a1d2c] border border-[#272b3d] hover:border-indigo-500/50 cursor-pointer transition-all space-y-1.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              <CornerDownRight size={13} className="text-indigo-400" />
                              {b.sourceNote.title}
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/20">
                              {b.sourceNote.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-2 italic font-mono pl-4">
                            "{b.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unlinked Mentions */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>Unlinked Mentions ({unlinkedMentions.length})</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">Mentions without [[ ]]</span>
                  </div>

                  {unlinkedMentions.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic bg-[#141622] p-3 rounded-xl border border-white/5">
                      No unlinked mentions found across your vault.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {unlinkedMentions.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#141622] border border-[#272b3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="space-y-1 max-w-md">
                            <span 
                              onClick={() => setActiveNote(m.sourceNote)}
                              className="font-bold text-xs text-white hover:text-indigo-300 cursor-pointer block"
                            >
                              {m.sourceNote.title}
                            </span>
                            <p className="text-[11px] text-gray-400 line-clamp-2 italic font-mono">
                              "{m.snippet}"
                            </p>
                          </div>

                          <button
                            onClick={() => handleLinkMention(m.sourceNote.id, m.sourceNote.title)}
                            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md shadow-indigo-600/30"
                            title={`Convert plain mention in "${m.sourceNote.title}" to formal [[${activeNote.title}]]`}
                          >
                            <Link2 size={12} />
                            <span>1-Click Link</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-3">
              <BookOpen size={36} className="text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-400">No Note Selected</p>
                <p className="text-[11px] text-gray-500">Select a note from the left to view, search, decrypt, or export.</p>
              </div>
            </div>
          )}
        </div>

      </div>
      )}

      {/* Master Passphrase Unlock Modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUnlockSubmit} className="bg-[#181a24] border border-[#2c334d] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2c334d] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="text-indigo-400" size={18} />
                <span>Unlock AES-GCM-256 Vault</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPassphraseModal(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Enter your master passphrase. The key will be derived in-memory with PBKDF2 (100,000 rounds) and never stored on disk.
            </p>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                placeholder="Enter master vault passphrase..."
                autoFocus
                className="w-full bg-[#12141e] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {vaultError && (
              <p className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {vaultError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPassphraseModal(false)}
                className="text-xs text-gray-400 hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
              >
                Unlock Vault
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Multimodal Document Intelligence & OCR Modal */}
      {isOcrModalOpen && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center text-white text-xs">Loading Document Intelligence...</div>}>
          <DocumentIntelligenceModal
            isOpen={isOcrModalOpen}
            onClose={() => setIsOcrModalOpen(false)}
            onSavedToVault={async (noteId) => {
              setIsOcrModalOpen(false);
              const saved = await db.knowledge.get(noteId);
              if (saved) {
                setActiveNote(saved);
                setViewMode('notes');
              }
            }}
          />
        </React.Suspense>
      )}


      {/* Two-Way Living Markdown Vault Exporter Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a24] border border-[#2c334d] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2c334d] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <FolderArchive size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Export Vault to Markdown</h3>
                  <p className="text-[11px] text-gray-400">Two-way bridge preserving YAML frontmatter & tag taxonomies ({notes.length} notes)</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-[#202538] transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Status Message */}
            {exportStatusMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Check size={16} className="shrink-0 text-emerald-400" />
                <span>{exportStatusMessage}</span>
              </div>
            )}

            {/* Export Options Grid */}
            <div className="space-y-3">
              {/* Option 1: Native Directory Picker */}
              <div className="p-4 bg-[#141622] border border-[#282d3e] hover:border-indigo-500/50 rounded-xl transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-white">Sync Directly to Disk Folder</h4>
                      {isFileSystemAccessSupported() ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Native API Supported
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Browser Unsupported
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Select a local folder (e.g. <code>my_notes/</code>, Obsidian vault). Writes each note as an individual <code>.md</code> file with YAML frontmatter + <code>INDEX.md</code>.
                    </p>
                  </div>
                </div>
                <button
                  disabled={isExporting || !isFileSystemAccessSupported() || notes.length === 0}
                  onClick={handleExportToDirectory}
                  className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <FolderArchive size={14} />
                  <span>{isExporting ? 'Syncing Notes to Disk...' : 'Select Target Folder & Sync'}</span>
                </button>
              </div>

              {/* Option 2: Download ZIP Archive */}
              <div className="p-4 bg-[#141622] border border-[#282d3e] hover:border-purple-500/50 rounded-xl transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-white">Download Multi-File ZIP Archive</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        Zero-Dependency PKZip
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Packages all {notes.length} notes into a portable <code>.zip</code> file with discrete <code>.md</code> files and <code>INDEX.md</code>. Universal cross-platform support.
                    </p>
                  </div>
                </div>
                <button
                  disabled={isExporting || notes.length === 0}
                  onClick={handleExportZip}
                  className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-purple-600/30"
                >
                  <Download size={14} />
                  <span>Download All Notes (.zip)</span>
                </button>
              </div>

              {/* Option 3: Consolidated Master File */}
              <div className="p-4 bg-[#141622] border border-[#282d3e] hover:border-indigo-500/30 rounded-xl transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Download Master Combined File</h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      All notes concatenated into a single large master markdown file with divider headers. Ideal for LLM feeding or offline search.
                    </p>
                  </div>
                </div>
                <button
                  disabled={isExporting || notes.length === 0}
                  onClick={handleExportAllNotesMaster}
                  className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-[#202538] hover:bg-[#282d3e] text-gray-200 border border-[#2c334d] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <BookOpen size={14} className="text-indigo-400" />
                  <span>Download Master Archive (.md)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Bidirectional Wikilink Auto-Linker Modal (Milestone D) */}
      <WikilinkAutoLinkerModal
        isOpen={isAutoLinkerOpen}
        notes={notes}
        onClose={() => setIsAutoLinkerOpen(false)}
      />
    </div>
  );
};
