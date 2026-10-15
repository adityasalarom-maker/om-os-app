import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PdfDocument, type PdfReadingState, type PdfAnnotation } from '../../db';
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
  RotateCcw
} from 'lucide-react';

export const PdfReaderView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<PdfDocument | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [activeTheme, setActiveTheme] = useState<PdfTheme>(PDF_THEMES[1]); // Warm Parchment default
  const [searchDocQuery, setSearchDocQuery] = useState('');
  
  // OCR state
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<{ text: string; confidence: number } | null>(null);

  // Selection popup state
  const [selectionModalData, setSelectionModalData] = useState<{ text: string; page: number } | null>(null);
  const [floatingSelectionBtn, setFloatingSelectionBtn] = useState<{ x: number; y: number; text: string } | null>(null);

  // Status notification
  const [notification, setNotification] = useState<string>('');

  // Bookmarks drawer
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const pdfInstanceRef = useRef<any>(null);

  const libraryDocs = useLiveQuery(() => db.pdfDocuments.orderBy('lastOpenedAt').reverse().toArray(), []) || [];
  const currentDocBookmarks = useLiveQuery<PdfAnnotation[]>(
    () => (activeDoc ? db.pdfAnnotations.where('documentId').equals(activeDoc.id).toArray() : Promise.resolve<PdfAnnotation[]>([])),
    [activeDoc]
  ) || [];

  const isPageBookmarked = currentDocBookmarks.some(b => b.pageNumber === currentPage && b.type === 'bookmark');

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

  // Re-render page when currentPage or scale changes
  useEffect(() => {
    if (pdfInstanceRef.current && activeDoc) {
      renderPage(currentPage);
      // Save reading state
      db.pdfReadingStates.put({
        documentId: activeDoc.id,
        lastPage: currentPage,
        zoomScale: scale,
        scrollOffsetTop: 0,
        activeThemeId: activeTheme.id,
        updatedAt: Date.now()
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
        // Render text spans manually with layout metrics
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
          x: Math.max(10, rect.left + rect.width / 2 - 60),
          y: Math.max(10, rect.top - 45),
          text
        });
      }
    } else {
      setFloatingSelectionBtn(null);
    }
  };

  // Import new PDF
  const handleImportPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const now = Date.now();
      const newDoc: PdfDocument = {
        id: `pdf-${now}-${file.name.replace(/[^a-z0-9]/gi, '_')}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        filesize: file.size,
        totalPages: pdf.numPages,
        category: 'Uncategorized',
        tags: ['Imported'],
        dataBlob: file,
        createdAt: now,
        lastOpenedAt: now
      };

      await db.pdfDocuments.add(newDoc);
      setActiveDoc(newDoc);
      setCurrentPage(1);
      setNotification(`Imported "${file.name}" (${pdf.numPages} pages)`);
    } catch (err: any) {
      alert(`Could not import PDF: ${err.message}`);
    }
  };

  // Open Document (Resume or Start Page 1)
  const handleOpenDoc = async (doc: PdfDocument, mode: 'resume' | 'first') => {
    const savedState = await db.pdfReadingStates.where('documentId').equals(doc.id).first();
    const targetPage = mode === 'resume' && savedState ? savedState.lastPage : 1;
    const targetScale = savedState ? savedState.zoomScale : 1.2;
    const targetTheme = savedState ? PDF_THEMES.find(t => t.id === savedState.activeThemeId) || PDF_THEMES[1] : PDF_THEMES[1];

    await db.pdfDocuments.update(doc.id, { lastOpenedAt: Date.now() });

    setActiveDoc(doc);
    setCurrentPage(targetPage);
    setScale(targetScale);
    setActiveTheme(targetTheme);
    setOcrResult(null);
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this document from library?')) return;
    await db.pdfDocuments.delete(id);
    await db.pdfReadingStates.delete(id);
    await db.pdfAnnotations.where('documentId').equals(id).delete();
    if (activeDoc?.id === id) {
      setActiveDoc(null);
    }
  };

  // Run OCR on active page
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

  const filteredLibrary = libraryDocs.filter(d => 
    d.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
    d.filename.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 md:pb-6 select-none">
      
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
          className="fixed z-50 flex items-center gap-1 bg-[#181a24] border border-[#2e344d] rounded-xl p-1.5 shadow-2xl"
          style={{ left: `${floatingSelectionBtn.x}px`, top: `${floatingSelectionBtn.y}px` }}
        >
          <button
            onClick={() => {
              setSelectionModalData({ text: floatingSelectionBtn.text, page: currentPage });
              setFloatingSelectionBtn(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Quote size={13} />
            <span>Save to Note</span>
          </button>
        </div>
      )}

      {/* VIEW A: PDF LIBRARY (No document active) */}
      {!activeDoc ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="text-indigo-400" size={22} />
                <span>Personal PDF Research Library</span>
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                Read, extract, OCR Hindi/English passages, and append notes to your Knowledge Vault.
              </p>
            </div>

            <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer self-start sm:self-auto">
              <Upload size={16} />
              <span>Import PDF File</span>
              <input type="file" accept=".pdf" onChange={handleImportPdf} className="hidden" />
            </label>
          </div>

          {/* Search Library */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-gray-500" size={15} />
            <input
              type="text"
              value={searchDocQuery}
              onChange={(e) => setSearchDocQuery(e.target.value)}
              placeholder="Search library documents..."
              className="w-full bg-[#181a24] border border-[#272b3b] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLibrary.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-500 text-xs bg-[#181a24] border border-[#272b3b] rounded-2xl p-8">
                <FileText size={42} className="mx-auto mb-3 text-gray-600" />
                <p className="font-semibold text-gray-300">Your PDF Library is Empty</p>
                <p className="mt-1">Click "Import PDF File" above to add research papers, Sanskrit texts, or books.</p>
              </div>
            ) : (
              filteredLibrary.map(doc => (
                <div
                  key={doc.id}
                  className="bg-[#181a24] border border-[#272b3b] hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 group transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                      <span className="font-mono bg-[#141622] px-2 py-0.5 rounded border border-[#282d3e]">
                        {doc.totalPages} Pages
                      </span>
                      <span>{(doc.filesize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                      {doc.title}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#252a3b]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDoc(doc, 'resume')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <BookOpen size={14} />
                        <span>Resume</span>
                      </button>
                      <button
                        onClick={() => handleOpenDoc(doc, 'first')}
                        className="p-2 bg-[#141622] hover:bg-[#202538] text-gray-300 hover:text-white rounded-xl border border-[#272b3b] text-xs font-medium"
                        title="Start from Page 1"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="p-2 bg-[#141622] hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-xl border border-[#272b3b] text-xs"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* VIEW B: ACTIVE PDF VIEWPORT & READER */
        <div className="space-y-3">
          
          {/* Top Control Bar */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap shadow-md">
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveDoc(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#202538] transition-colors"
                title="Back to Library"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="text-xs font-bold text-white max-w-xs truncate" title={activeDoc.title}>
                {activeDoc.title}
              </h3>
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

            {/* Theme Selector (12 Palettes) */}
            <div className="flex items-center gap-1.5">
              <select
                value={activeTheme.id}
                onChange={(e) => {
                  const th = PDF_THEMES.find(t => t.id === e.target.value);
                  if (th) setActiveTheme(th);
                }}
                className="bg-[#141622] border border-[#272b3d] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
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
                className="bg-[#24293d] hover:bg-indigo-600 border border-[#343b54] text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                title="Extract text from scanned page"
              >
                <Cpu size={14} className={isOcrRunning ? 'animate-spin text-amber-400' : 'text-indigo-400'} />
                <span className="hidden sm:inline">{isOcrRunning ? `OCR ${ocrProgress}%` : 'OCR (Eng+Hin)'}</span>
              </button>
            </div>

          </div>

          {/* OCR Result Banner if available */}
          {ocrResult && (
            <div className="bg-[#1c2132] border border-indigo-500/30 rounded-2xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span>⚡ Extracted Bilingual Text ({ocrResult.confidence}% Confidence)</span>
                <button
                  onClick={() => {
                    setSelectionModalData({ text: ocrResult.text, page: currentPage });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1 rounded-lg shadow-sm flex items-center gap-1"
                >
                  <Quote size={12} />
                  <span>Save to Note</span>
                </button>
              </div>
              <p className="text-xs text-gray-200 font-serif leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap bg-[#141622] p-3 rounded-xl border border-[#272b3c]">
                {ocrResult.text}
              </p>
            </div>
          )}

          {/* Page Canvas Container with Dynamic Theme */}
          <div
            className="rounded-2xl p-4 md:p-8 flex justify-center items-center overflow-auto min-h-[600px] transition-colors relative"
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

      {/* Note Capture Modal */}
      {selectionModalData && activeDoc && (
        <SelectionToNoteModal
          selectedText={selectionModalData.text}
          documentTitle={activeDoc.title}
          pageNumber={selectionModalData.page}
          onClose={() => setSelectionModalData(null)}
          onSuccess={(msg) => setNotification(msg)}
        />
      )}

    </div>
  );
};
