import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  type PdfDocument, 
  type PdfReadingState, 
  type PdfAnnotation,
  type ReadingStatus,
  type ReadingDocType 
} from '../../db';
import { pdfjsLib } from './pdfViewerSetup';
import { PDF_THEMES, type PdfTheme } from './themes';
import { performPageOcr } from './ocrService';
import { SelectionToNoteModal } from './SelectionToNoteModal';
import { 
  BookOpen, 
  Upload, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Palette, 
  Bookmark, 
  BookmarkCheck, 
  Cpu, 
  Quote, 
  ArrowLeft, 
  Trash2, 
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
  Library,
  Clock,
  CheckCircle,
  Edit3,
  ExternalLink,
  Filter,
  BarChart3,
  X,
  Plus,
  Play
} from 'lucide-react';

export const PdfReaderView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<PdfDocument | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [activeTheme, setActiveTheme] = useState<PdfTheme>(PDF_THEMES[1]); // Warm Parchment default
  
  // Pipeline & Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | 'To Read' | 'Reading Now' | 'Completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchDocQuery, setSearchDocQuery] = useState('');

  // Editing Metadata Modal State
  const [editingDoc, setEditingDoc] = useState<PdfDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<ReadingDocType>('Book');
  const [editStatus, setEditStatus] = useState<ReadingStatus>('To Read');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  
  // OCR state
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<{ text: string; confidence: number } | null>(null);

  // Selection popup & Note modal state
  const [selectionModalData, setSelectionModalData] = useState<{ text: string; page: number } | null>(null);
  const [floatingSelectionBtn, setFloatingSelectionBtn] = useState<{ x: number; y: number; text: string } | null>(null);

  // Status notification
  const [notification, setNotification] = useState<string>('');

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const pdfInstanceRef = useRef<any>(null);

  // Query live documents & reading states
  const libraryDocs = useLiveQuery(() => db.pdfDocuments.orderBy('lastOpenedAt').reverse().toArray(), []) || [];
  const readingStates = useLiveQuery(() => db.pdfReadingStates.toArray(), []) || [];
  
  // Map documentId to lastPage
  const readingStatesMap = useMemo(() => {
    const map = new Map<string, PdfReadingState>();
    for (const rs of readingStates) {
      map.set(rs.documentId, rs);
    }
    return map;
  }, [readingStates]);

  const currentDocBookmarks = useLiveQuery<PdfAnnotation[]>(
    () => (activeDoc ? db.pdfAnnotations.where('documentId').equals(activeDoc.id).toArray() : Promise.resolve<PdfAnnotation[]>([])),
    [activeDoc]
  ) || [];

  const isPageBookmarked = currentDocBookmarks.some(b => b.pageNumber === currentPage && b.type === 'bookmark');

  // Reading Velocity Metrics
  const velocityMetrics = useMemo(() => {
    const total = libraryDocs.length;
    let readingNow = 0;
    let toRead = 0;
    let completed = 0;
    let totalPagesRead = 0;

    for (const doc of libraryDocs) {
      const status = doc.readingStatus || (doc.readingProgress && doc.readingProgress > 0 ? (doc.readingProgress >= 100 ? 'Completed' : 'Reading Now') : 'To Read');
      if (status === 'Reading Now') readingNow++;
      else if (status === 'Completed') completed++;
      else toRead++;

      const state = readingStatesMap.get(doc.id);
      const readPages = state ? state.lastPage : (doc.readingProgress ? Math.round((doc.readingProgress * doc.totalPages) / 100) : 0);
      totalPagesRead += Math.min(readPages, doc.totalPages);
    }

    return { total, readingNow, toRead, completed, totalPagesRead };
  }, [libraryDocs, readingStatesMap]);

  // Load PDF when activeDoc changes
  useEffect(() => {
    if (!activeDoc) return;

    let isMounted = true;
    const loadPdfData = async () => {
      try {
        const arrayBuffer = await activeDoc.dataBlob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: '/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/standard_fonts/'
        });

        const pdf = await loadingTask.promise;
        if (isMounted) {
          pdfInstanceRef.current = pdf;
          renderPage(currentPage);
        }
      } catch (err: any) {
        setNotification(`Error parsing PDF: ${err.message}`);
      }
    };

    loadPdfData();

    return () => {
      isMounted = false;
    };
  }, [activeDoc]);

  // Re-render page and persist reading progress
  useEffect(() => {
    if (pdfInstanceRef.current && activeDoc) {
      renderPage(currentPage);
      
      const now = Date.now();
      const progress = Math.min(100, Math.round((currentPage / activeDoc.totalPages) * 100));

      // Save reading state in Dexie
      db.pdfReadingStates.put({
        documentId: activeDoc.id,
        lastPage: currentPage,
        zoomScale: scale,
        scrollOffsetTop: 0,
        activeThemeId: activeTheme.id,
        updatedAt: now
      });

      // Update doc readingProgress and auto-transition to Reading Now if was To Read
      const newStatus = activeDoc.readingStatus === 'Completed'
        ? 'Completed'
        : (progress >= 100 ? 'Completed' : 'Reading Now');

      db.pdfDocuments.update(activeDoc.id, {
        readingProgress: progress,
        readingStatus: newStatus,
        lastOpenedAt: now
      });
    }
  }, [currentPage, scale]);

  const renderPage = async (pageNumber: number) => {
    if (!pdfInstanceRef.current || !canvasRef.current) return;

    try {
      const page = await pdfInstanceRef.current.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render graphics
      await page.render({
        canvasContext: context,
        viewport
      }).promise;

      // Render text layer for text selection
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        textLayerRef.current.style.width = `${viewport.width}px`;
        textLayerRef.current.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();
        for (const item of (textContent.items as any[])) {
          if (!item.str) continue;
          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.left = `${item.transform[4] * scale}px`;
          span.style.top = `${viewport.height - (item.transform[5] * scale)}px`;
          span.style.fontSize = `${item.height * scale}px`;
          span.style.fontFamily = item.fontName || 'sans-serif';
          span.className = 'absolute select-text cursor-text pointer-events-auto leading-none text-transparent';
          textLayerRef.current.appendChild(span);
        }
      }
    } catch (err: any) {
      console.error('Page render error:', err);
    }
  };

  // Text selection listener
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 3) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setFloatingSelectionBtn({
          x: Math.max(10, rect.left + rect.width / 2 - 70),
          y: Math.max(10, rect.top - 45),
          text
        });
      }
    } else {
      setFloatingSelectionBtn(null);
    }
  };

  // Import new Book / PDF
  const handleImportPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');
      const now = Date.now();
      const newDoc: PdfDocument = {
        id: `pdf-${now}-${file.name.replace(/[^a-z0-9]/gi, '_')}`,
        title: rawTitle,
        filename: file.name,
        filesize: file.size,
        totalPages: pdf.numPages,
        category: 'Study Archive',
        tags: ['Reading-Hub', 'PDF'],
        dataBlob: file,
        createdAt: now,
        lastOpenedAt: now,
        author: 'Unknown Author',
        readingStatus: 'To Read',
        readingProgress: 0,
        type: 'Book'
      };

      await db.pdfDocuments.add(newDoc);
      setNotification(`Imported "${rawTitle}" (${pdf.numPages} pages) into Reading Library`);
    } catch (err: any) {
      alert(`Could not import PDF: ${err.message}`);
    }
  };

  // Open Document
  const handleOpenDoc = async (doc: PdfDocument, mode: 'resume' | 'first') => {
    const savedState = await db.pdfReadingStates.where('documentId').equals(doc.id).first();
    const targetPage = mode === 'resume' && savedState ? savedState.lastPage : 1;
    const targetScale = savedState ? savedState.zoomScale : 1.2;
    const targetTheme = savedState ? PDF_THEMES.find(t => t.id === savedState.activeThemeId) || PDF_THEMES[1] : PDF_THEMES[1];

    const now = Date.now();
    await db.pdfDocuments.update(doc.id, { 
      lastOpenedAt: now,
      readingStatus: doc.readingStatus === 'Completed' ? 'Completed' : 'Reading Now'
    });

    setActiveDoc(doc);
    setCurrentPage(targetPage);
    setScale(targetScale);
    setActiveTheme(targetTheme);
    setOcrResult(null);
  };

  // Quick Status Switcher
  const handleUpdateStatus = async (docId: string, newStatus: ReadingStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await db.pdfDocuments.update(docId, { 
      readingStatus: newStatus,
      readingProgress: newStatus === 'Completed' ? 100 : (newStatus === 'To Read' ? 0 : 10)
    });
    setNotification(`Updated status to "${newStatus}"`);
  };

  // Open Metadata Editor
  const handleOpenEditModal = (doc: PdfDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditAuthor(doc.author || '');
    setEditCategory(doc.category || 'Study Archive');
    setEditType(doc.type || 'Book');
    setEditStatus(doc.readingStatus || 'To Read');
    setEditSourceUrl(doc.sourceUrl || '');
  };

  const handleSaveMetadata = async () => {
    if (!editingDoc) return;
    await db.pdfDocuments.update(editingDoc.id, {
      title: editTitle.trim() || editingDoc.title,
      author: editAuthor.trim() || 'Unknown Author',
      category: editCategory.trim() || 'General',
      type: editType,
      readingStatus: editStatus,
      sourceUrl: editSourceUrl.trim()
    });
    setNotification(`Updated details for "${editTitle.trim()}"`);
    setEditingDoc(null);
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this document from the reading library?')) return;
    await db.pdfDocuments.delete(id);
    await db.pdfReadingStates.delete(id);
    await db.pdfAnnotations.where('documentId').equals(id).delete();
    if (activeDoc?.id === id) {
      setActiveDoc(null);
    }
    setNotification('Document removed from library');
  };

  // OCR on active page
  const handleRunOcr = async () => {
    if (!canvasRef.current) return;
    setIsOcrRunning(true);
    setOcrProgress(0);
    setOcrResult(null);

    try {
      const res = await performPageOcr(canvasRef.current, (pct) => {
        setOcrProgress(pct);
      });
      setOcrResult(res);
      setNotification(`OCR Complete (${res.confidence}% confidence)`);
    } catch (err: any) {
      alert(`OCR failed: ${err.message}`);
    } finally {
      setIsOcrRunning(false);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    if (!activeDoc) return;
    const existing = currentDocBookmarks.find(b => b.pageNumber === currentPage && b.type === 'bookmark');
    if (existing) {
      await db.pdfAnnotations.delete(existing.id);
      setNotification(`Removed bookmark from page ${currentPage}`);
    } else {
      await db.pdfAnnotations.add({
        id: `bm-${Date.now()}`,
        documentId: activeDoc.id,
        pageNumber: currentPage,
        type: 'bookmark',
        color: '#f59e0b',
        createdAt: Date.now()
      });
      setNotification(`Bookmarked page ${currentPage}`);
    }
  };

  // Filtered Library Documents
  const filteredLibrary = useMemo(() => {
    return libraryDocs.filter(d => {
      const docStatus = d.readingStatus || (d.readingProgress && d.readingProgress > 0 ? (d.readingProgress >= 100 ? 'Completed' : 'Reading Now') : 'To Read');
      if (statusFilter !== 'all' && docStatus !== statusFilter) return false;
      if (typeFilter !== 'all' && (d.type || 'Book') !== typeFilter) return false;
      
      if (searchDocQuery.trim()) {
        const q = searchDocQuery.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesAuthor = d.author ? d.author.toLowerCase().includes(q) : false;
        const matchesCategory = d.category ? d.category.toLowerCase().includes(q) : false;
        const matchesTags = d.tags ? d.tags.some(t => t.toLowerCase().includes(q)) : false;
        return matchesTitle || matchesAuthor || matchesCategory || matchesTags;
      }
      return true;
    });
  }, [libraryDocs, statusFilter, typeFilter, searchDocQuery]);

  return (
    <div data-ag-id="PdfReader_Root_Workspace" className="space-y-4 pb-20 md:pb-6 select-none">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#1e2336] border border-indigo-500/40 text-indigo-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Floating Selection Popup */}
      {floatingSelectionBtn && activeDoc && (
        <div
          className="fixed z-50 flex items-center gap-1 bg-[#181a24] border border-[#2e344d] rounded-xl p-1.5 shadow-2xl animate-in zoom-in-95"
          style={{ left: `${floatingSelectionBtn.x}px`, top: `${floatingSelectionBtn.y}px` }}
        >
          <button
            onClick={() => {
              setSelectionModalData({ text: floatingSelectionBtn.text, page: currentPage });
              setFloatingSelectionBtn(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>Extract to Vault</span>
          </button>
        </div>
      )}

      {/* VIEW A: UNIFIED READING LIBRARY & PIPELINE SHELF */}
      {!activeDoc ? (
        <div className="space-y-6">
          
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b] shadow-md">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <Library size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Unified Reading Library & Knowledge Hub</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Notion OS Pipeline
                    </span>
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">
                    To Read → Reading Now → Completed shelf with page persistence and 1-click [[wikilink]] extraction.
                  </p>
                </div>
              </div>
            </div>

            <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer self-start sm:self-auto">
              <Upload size={15} />
              <span>Import Book / PDF</span>
              <input type="file" accept=".pdf" onChange={handleImportPdf} className="hidden" />
            </label>
          </div>

          {/* Reading Velocity & Pipeline Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
                <BookOpen size={14} className="text-indigo-400" />
                <span>Total Volumes</span>
              </span>
              <span className="text-2xl font-bold text-white mt-1 font-mono">{velocityMetrics.total}</span>
            </div>

            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] text-amber-400 flex items-center gap-1.5 font-medium">
                <Clock size={14} />
                <span>To Read</span>
              </span>
              <span className="text-2xl font-bold text-amber-300 mt-1 font-mono">{velocityMetrics.toRead}</span>
            </div>

            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] text-indigo-400 flex items-center gap-1.5 font-medium">
                <Play size={14} />
                <span>Reading Now</span>
              </span>
              <span className="text-2xl font-bold text-indigo-300 mt-1 font-mono">{velocityMetrics.readingNow}</span>
            </div>

            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle size={14} />
                <span>Completed</span>
              </span>
              <span className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{velocityMetrics.completed}</span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#181a24] border border-[#272b3b] rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] text-purple-400 flex items-center gap-1.5 font-medium">
                <BarChart3 size={14} />
                <span>Pages Explored</span>
              </span>
              <span className="text-2xl font-bold text-purple-300 mt-1 font-mono">{velocityMetrics.totalPagesRead}</span>
            </div>
          </div>

          {/* Pipeline Shelf Tabs & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181a24] p-3 rounded-2xl border border-[#272b3b]">
            
            {/* Shelf Switcher */}
            <div className="flex items-center gap-1 bg-[#141622] p-1 rounded-xl border border-[#272b3b] overflow-x-auto">
              {[
                { id: 'all', label: 'All Volumes' },
                { id: 'Reading Now', label: 'Reading Now', badge: velocityMetrics.readingNow },
                { id: 'To Read', label: 'To Read', badge: velocityMetrics.toRead },
                { id: 'Completed', label: 'Completed', badge: velocityMetrics.completed }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      statusFilter === tab.id ? 'bg-indigo-800 text-white' : 'bg-[#1e2336] text-gray-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Type Filter & Search Bar */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="all">All Types</option>
                <option value="Book">Book</option>
                <option value="Paper">Research Paper</option>
                <option value="Article">Article</option>
                <option value="PDF">PDF</option>
                <option value="Manuscript">Manuscript</option>
              </select>

              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                <input
                  type="text"
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  placeholder="Search title, author, tag..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

          </div>

          {/* Book Cards Shelf Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLibrary.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-500 text-xs bg-[#181a24] border border-[#272b3b] rounded-2xl p-8">
                <Library size={44} className="mx-auto mb-3 text-gray-600" />
                <p className="font-semibold text-gray-300 text-sm">No volumes found in this shelf</p>
                <p className="mt-1">
                  {statusFilter !== 'all' 
                    ? `There are currently no items marked as "${statusFilter}".`
                    : 'Click "Import Book / PDF" above to add research papers, Sanskrit texts, or books.'}
                </p>
              </div>
            ) : (
              filteredLibrary.map(doc => {
                const docStatus = doc.readingStatus || (doc.readingProgress && doc.readingProgress > 0 ? (doc.readingProgress >= 100 ? 'Completed' : 'Reading Now') : 'To Read');
                const progress = doc.readingProgress || 0;
                const readingState = readingStatesMap.get(doc.id);
                const lastPage = readingState ? readingState.lastPage : 1;

                return (
                  <div
                    key={doc.id}
                    className="bg-[#181a24] border border-[#272b3b] hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 group transition-all shadow-sm"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between text-[11px] mb-2.5">
                        <span className="font-mono bg-[#141622] px-2 py-0.5 rounded-lg border border-[#282d3e] text-gray-400">
                          {doc.type || 'Book'} • {doc.totalPages} Pages
                        </span>

                        {/* Status Switcher Dropdown */}
                        <select
                          value={docStatus}
                          onChange={(e) => handleUpdateStatus(doc.id, e.target.value as ReadingStatus)}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                            docStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : docStatus === 'Reading Now'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <option value="To Read" className="bg-[#181a24] text-amber-400">To Read</option>
                          <option value="Reading Now" className="bg-[#181a24] text-indigo-400">Reading Now</option>
                          <option value="Completed" className="bg-[#181a24] text-emerald-400">Completed</option>
                        </select>
                      </div>

                      {/* Title & Author */}
                      <h3 
                        onClick={() => handleOpenDoc(doc, 'resume')}
                        className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        {doc.title}
                      </h3>
                      
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                        <span>By {doc.author || 'Unknown Author'}</span>
                        <span className="text-gray-500">{(doc.filesize / 1024 / 1024).toFixed(1)} MB</span>
                      </p>

                      {/* Reading Progress Bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-400">p. {lastPage} of {doc.totalPages}</span>
                          <span className={`font-bold ${progress === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-[#141622] h-1.5 rounded-full overflow-hidden border border-[#272b3b]">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#252a3b] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenDoc(doc, 'resume')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen size={14} />
                        <span>Continue Reading</span>
                      </button>

                      <button
                        onClick={() => handleOpenDoc(doc, 'first')}
                        className="p-1.5 bg-[#141622] hover:bg-[#202538] text-gray-300 hover:text-white rounded-xl border border-[#272b3b] text-xs font-medium"
                        title="Start from Page 1"
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button
                        onClick={(e) => handleOpenEditModal(doc, e)}
                        className="p-1.5 bg-[#141622] hover:bg-[#202538] text-gray-300 hover:text-white rounded-xl border border-[#272b3b] text-xs font-medium"
                        title="Edit Book Details"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="p-1.5 bg-[#141622] hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-xl border border-[#272b3b] text-xs"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* VIEW B: ACTIVE PDF VIEWPORT & KNOWLEDGE EXTRACTION READER */
        <div className="space-y-3">
          
          {/* Top Control Bar */}
          <div data-ag-id="PdfReader_Toolbar_Controls" className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap shadow-md">
            
            {/* Left: Back & Document Metadata */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveDoc(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#202538] transition-colors flex items-center gap-1 text-xs"
                title="Back to Reading Library"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline font-semibold">Library Shelf</span>
              </button>

              <div className="h-4 w-px bg-[#272b3b]" />

              <div>
                <h3 className="text-xs font-bold text-white max-w-[200px] sm:max-w-xs truncate" title={activeDoc.title}>
                  {activeDoc.title}
                </h3>
                <p className="text-[10px] text-gray-400 truncate">
                  {activeDoc.author || 'Author not set'} • p. {currentPage}/{activeDoc.totalPages} ({Math.min(100, Math.round((currentPage / activeDoc.totalPages) * 100))}%)
                </p>
              </div>

              {/* Status Selector Pill in Toolbar */}
              <select
                value={activeDoc.readingStatus || 'Reading Now'}
                onChange={(e) => handleUpdateStatus(activeDoc.id, e.target.value as ReadingStatus)}
                className="bg-[#141622] border border-[#272b3b] text-[10px] font-semibold text-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value="To Read">To Read</option>
                <option value="Reading Now">Reading Now</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono bg-[#141622] px-2.5 py-1 rounded-xl border border-[#272b3d]">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span>{currentPage} / {activeDoc.totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(activeDoc.totalPages, p + 1))}
                disabled={currentPage >= activeDoc.totalPages}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#141622] p-1 rounded-xl border border-[#272b3d] text-xs">
              <button
                onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                className="p-1 text-gray-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="font-mono text-[11px] text-gray-300 px-1">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                className="p-1 text-gray-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Actions: Theme, Bookmark, Extract, OCR */}
            <div className="flex items-center gap-1.5">
              
              {/* Direct Extract Note Button */}
              <button
                onClick={() => setSelectionModalData({ text: '', page: currentPage })}
                className="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
                title="Extract Quote or Reflection to Knowledge Vault with [[wikilink]]"
              >
                <Quote size={13} />
                <span className="hidden sm:inline">Extract</span>
              </button>

              {/* Theme Selector */}
              <select
                value={activeTheme.id}
                onChange={(e) => {
                  const th = PDF_THEMES.find(t => t.id === e.target.value);
                  if (th) setActiveTheme(th);
                }}
                className="bg-[#141622] border border-[#272b3d] text-xs text-gray-300 rounded-xl px-2 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
              >
                {PDF_THEMES.map(t => (
                  <option key={t.id} value={t.id}>🎨 {t.name}</option>
                ))}
              </select>

              {/* Bookmark Toggle */}
              <button
                onClick={handleToggleBookmark}
                className={`p-1.5 rounded-xl border transition-colors ${
                  isPageBookmarked 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-[#141622] text-gray-400 hover:text-white border-[#272b3d]'
                }`}
                title={isPageBookmarked ? 'Remove Bookmark' : 'Bookmark Page'}
              >
                {isPageBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>

              {/* OCR Action Button */}
              <button
                onClick={handleRunOcr}
                disabled={isOcrRunning}
                className="bg-[#24293d] hover:bg-indigo-600 border border-[#343b54] text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                title="Extract text from scanned page"
              >
                <Cpu size={14} className={isOcrRunning ? 'animate-spin text-amber-400' : 'text-indigo-400'} />
                <span className="hidden sm:inline">{isOcrRunning ? `OCR ${ocrProgress}%` : 'OCR'}</span>
              </button>
            </div>

          </div>

          {/* OCR Result Banner if available */}
          {ocrResult && (
            <div className="bg-[#1c2132] border border-indigo-500/30 rounded-2xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span>🔍 Extracted Bilingual Text ({ocrResult.confidence}% Confidence)</span>
                <button
                  onClick={() => {
                    setSelectionModalData({ text: ocrResult.text, page: currentPage });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1 rounded-lg shadow-sm flex items-center gap-1"
                >
                  <Quote size={12} />
                  <span>Save to Note with [[Wikilink]]</span>
                </button>
              </div>
              <p className="text-xs text-gray-200 font-serif leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap bg-[#141622] p-3 rounded-xl border border-[#272b3c]">
                {ocrResult.text}
              </p>
            </div>
          )}

          {/* Page Canvas Container with Dynamic Theme */}
          <div
            data-ag-id="PdfReader_Canvas_DocumentViewer" className="rounded-2xl p-4 md:p-8 flex justify-center items-center overflow-auto min-h-[600px] transition-colors relative"
            style={{ backgroundColor: activeTheme.bg }}
            onMouseUp={handleMouseUp}
          >
            <div
              className="relative shadow-2xl rounded-sm transition-all"
              style={{ backgroundColor: activeTheme.pageBg }}
            >
              <canvas
                ref={canvasRef}
                style={{ filter: activeTheme.canvasFilter }}
                className="block max-w-full h-auto rounded-sm"
              />
              {/* Text Layer Overlay */}
              <div
                ref={textLayerRef}
                className="absolute inset-0 overflow-hidden pointer-events-none"
              />
            </div>
          </div>

        </div>
      )}

      {/* Note Capture / Extraction Modal */}
      {selectionModalData && activeDoc && (
        <SelectionToNoteModal
          selectedText={selectionModalData.text}
          documentTitle={activeDoc.title}
          documentAuthor={activeDoc.author}
          pageNumber={selectionModalData.page}
          onClose={() => setSelectionModalData(null)}
          onSuccess={(msg) => setNotification(msg)}
        />
      )}

      {/* Edit Metadata Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="p-4 bg-[#141622] border-b border-[#252a3b] flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Edit3 size={15} className="text-indigo-400" />
                <span>Edit Volume Details</span>
              </h3>
              <button 
                onClick={() => setEditingDoc(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Author</label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  placeholder="Author or translator..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as ReadingDocType)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Book">Book</option>
                    <option value="Paper">Research Paper</option>
                    <option value="Article">Article</option>
                    <option value="PDF">PDF</option>
                    <option value="Manuscript">Manuscript</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Reading Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ReadingStatus)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="To Read">To Read</option>
                    <option value="Reading Now">Reading Now</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Category / Domain</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. Advaita Vedanta, Science, History"
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Source Link (Optional)</label>
                <input
                  type="text"
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-[#141622] border-t border-[#252a3b] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="px-3.5 py-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#202538]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMetadata}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-xl shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
