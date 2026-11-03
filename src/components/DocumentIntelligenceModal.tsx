import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Sparkles, 
  X, 
  RotateCw, 
  Sliders, 
  Check, 
  Copy, 
  Download, 
  Send, 
  BookOpen, 
  UtensilsCrossed, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  Cpu,
  Globe,
  Smartphone
} from 'lucide-react';
import { db } from '../db';
import { preprocessImage, loadImageElement, type ImageFilterOptions } from '../services/imagePreprocessor';
import { recognizeDocumentImage, type OcrLanguageMode, type OcrProgressUpdate } from '../services/ocrEngine';
import { 
  analyzeDocumentOcr, 
  generateVaultMarkdown, 
  type DocumentIntelligenceReport 
} from '../services/documentIntelligence';

interface DocumentIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavedToVault?: (noteId: string) => void;
  defaultImageFile?: File | null;
}

export const DocumentIntelligenceModal: React.FC<DocumentIntelligenceModalProps> = ({
  isOpen,
  onClose,
  onSavedToVault,
  defaultImageFile = null,
}) => {
  // Input & Capture state
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'camera'>('upload');
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preprocessing filters
  const [filters, setFilters] = useState<ImageFilterOptions>({
    grayscale: true,
    binarize: false,
    threshold: 130,
    contrast: 20,
    brightness: 10,
    rotation: 0,
  });

  // OCR state
  const [langMode, setLangMode] = useState<OcrLanguageMode>('eng+hin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OcrProgressUpdate>({ status: '', progress: 0 });
  const [intelligenceReport, setIntelligenceReport] = useState<DocumentIntelligenceReport | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'structured' | 'text' | 'markdown'>('structured');
  const [editedText, setEditedText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load default image file if passed
  useEffect(() => {
    if (defaultImageFile) {
      handleFileSelected(defaultImageFile);
    }
  }, [defaultImageFile]);

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelected(file);
            showFeedback('Pasted image from clipboard!');
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Camera stream teardown
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleFileSelected = async (file: File) => {
    stopCamera();
    try {
      const img = await loadImageElement(file);
      setOriginalImage(img);
      applyPreprocessing(img, filters);
    } catch (err: any) {
      alert('Could not read image: ' + err.message);
    }
  };

  const applyPreprocessing = async (img: HTMLImageElement, opts: ImageFilterOptions) => {
    try {
      const { dataUrl } = await preprocessImage(img, opts);
      setImageSource(dataUrl);
    } catch (err: any) {
      console.error('Preprocessing failed:', err);
    }
  };

  const updateFilters = (newOpts: Partial<ImageFilterOptions>) => {
    const updated = { ...filters, ...newOpts };
    setFilters(updated);
    if (originalImage) {
      applyPreprocessing(originalImage, updated);
    }
  };

  const rotateImage = () => {
    const nextRotation = (filters.rotation! + 90) % 360;
    updateFilters({ rotation: nextRotation });
  };

  // Camera handling
  const startCamera = async () => {
    setActiveInputTab('camera');
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      alert('Camera access unavailable or blocked: ' + err.message);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const img = await loadImageElement(dataUrl);
      setOriginalImage(img);
      applyPreprocessing(img, filters);
      stopCamera();
      setActiveInputTab('upload');
      showFeedback('Captured photo from camera!');
    }
  };

  // Run OCR
  const handleRunOcr = async () => {
    if (!imageSource) return;
    setIsProcessing(true);
    setProgress({ status: 'Initializing Tesseract WebAssembly Core...', progress: 10 });
    setIntelligenceReport(null);

    try {
      const ocrResult = await recognizeDocumentImage(imageSource, langMode, (upd) => {
        setProgress(upd);
      });

      const report = analyzeDocumentOcr(ocrResult);
      setIntelligenceReport(report);
      setEditedText(report.rawText);
      showFeedback(`Transcribed with ${report.confidence}% confidence (${report.documentType})`);
    } catch (err: any) {
      alert('OCR failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Save to Knowledge Vault
  const handleSaveToVault = async () => {
    if (!intelligenceReport) return;
    const updatedReport: DocumentIntelligenceReport = {
      ...intelligenceReport,
      rawText: editedText
    };

    const markdown = generateVaultMarkdown(updatedReport);
    const now = Date.now();
    const noteId = `know-ocr-${now}`;

    await db.knowledge.add({
      id: noteId,
      title: updatedReport.suggestedTitle,
      type: 'Note',
      content: markdown,
      tags: updatedReport.tags,
      createdAt: now,
      updatedAt: now,
    });

    showFeedback('Saved directly to Knowledge Vault!');
    if (onSavedToVault) onSavedToVault(noteId);
  };

  // 1-Click Send to Universal Inbox
  const handleSendToInbox = async () => {
    if (!intelligenceReport) return;
    const now = Date.now();
    const inboxId = `inbox-ocr-${now}`;

    await db.inbox.add({
      id: inboxId,
      title: intelligenceReport.suggestedTitle,
      content: editedText,
      type: 'Quick Note',
      source: `OCR Scanner (${intelligenceReport.documentType})`,
      status: 'Inbox',
      createdAt: now,
      updatedAt: now,
    });

    showFeedback('Sent to Universal Inbox for AI extraction!');
  };

  // 1-Click Add Line Items to Pantry
  const handleAddToPantry = async () => {
    if (!intelligenceReport?.invoiceData?.lineItems?.length) {
      alert('No invoice grocery line items detected.');
      return;
    }

    const items = intelligenceReport.invoiceData.lineItems;
    let addedCount = 0;
    const now = Date.now();

    for (const it of items) {
      if (it.name.length > 2) {
        await db.pantry.add({
          id: `pantry-ocr-${now}-${addedCount}`,
          itemName: it.name,
          category: 'Grains & Pulses',
          currentQty: it.qty || '1 unit',
          reorderPoint: '1 unit',
          status: 'In Stock',
          storageType: 'Pantry',
          updatedAt: now,
        });
        addedCount++;
      }
    }

    showFeedback(`Added ${addedCount} items to Kitchen & Pantry!`);
  };

  // Quick Presets
  const loadPreset = (type: 'invoice' | 'vedic' | 'land') => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw document background
    ctx.fillStyle = type === 'vedic' ? '#FFFDF5' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px sans-serif';

    if (type === 'invoice') {
      ctx.fillText('NATURE BASKET AYURVEDA & ORGANICS', 60, 80);
      ctx.font = '16px sans-serif';
      ctx.fillText('GSTIN: 05AAACH7409R1ZZ | Tax Invoice', 60, 115);
      ctx.fillText('Date: 15/10/2026 | Bill No: NB-2026-9812', 60, 140);
      ctx.fillText('Payment: UPI (Google Pay)', 60, 165);
      ctx.fillRect(60, 180, 780, 2);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Item Description                 Qty      Price', 60, 220);
      ctx.font = '18px sans-serif';
      ctx.fillText('Organic Basmati Rice Aged        5kg     450.00', 60, 260);
      ctx.fillText('Cold-Pressed Yellow Mustard Oil  1L      185.00', 60, 300);
      ctx.fillText('Desi Cow A2 Cultured Ghee        1kg     920.00', 60, 340);
      ctx.fillText('Organic Triphala Churna          250g    140.00', 60, 380);
      ctx.fillText('Ashwagandha Root Powder          100g    160.00', 60, 420);
      ctx.fillRect(60, 450, 780, 2);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Total Amount Paid: ₹ 1855.00', 60, 500);
      ctx.font = '14px sans-serif';
      ctx.fillText('CGST: ₹82.80 | SGST: ₹82.80 included', 60, 530);
    } else if (type === 'vedic') {
      ctx.fillText('॥ चरकसंहिता — सूत्रस्थानम् ॥', 60, 80);
      ctx.font = '22px sans-serif';
      ctx.fillText('हिताहितं सुखं दुःखमायुस्तस्य हिताहितम्।', 60, 140);
      ctx.fillText('मानं च तच्च यत्रोक्तमायुर्वेदः स उच्यते॥', 60, 180);
      ctx.fillRect(60, 210, 780, 2);

      ctx.font = '18px sans-serif';
      ctx.fillText('त्रयो दोषाः — वात, पित्त, कफ शमनार्थे त्रिफला घृतं च श्रेष्ठम्।', 60, 260);
      ctx.fillText('विवर्तवाद अनुसारं ब्रह्म सत्यं जगन्मिथ्या जीवो ब्रह्मैव नापरः।', 60, 310);
      ctx.fillText('सत्त्व-रजस्-तमस् गुणानां संतुलनम् स्वास्थ्यस्य मूलम्।', 60, 360);
      ctx.fillText('अश्वगंधा च ब्राह्मी मेध्यरसायन रूपेण कार्यं कुरुतः।', 60, 410);
    } else {
      ctx.fillText('उत्तराखंड राजस्व परिषद — खतौनी उद्धरण', 60, 80);
      ctx.font = '18px sans-serif';
      ctx.fillText('तहसील: भटवाड़ी | परगना: उत्तरकाशी | ग्राम: नेताला', 60, 120);
      ctx.fillText('खसरा संख्या: 142/1, 142/2 | गाटा संख्या: 89', 60, 160);
      ctx.fillText('रकबा: 4.5 नाली (temperate mountain ridge)', 60, 200);
      ctx.fillRect(60, 230, 780, 2);
      ctx.fillText('काश्तकार नाम: आदित्य नारायण एवं साझीदार', 60, 280);
      ctx.fillText('भूमि प्रकार: कृषि एवं बागवानी (पेरेनियल जल स्रोत निकट)', 60, 320);
      ctx.fillText('12-Year Khatauni Encumbrance Check: Verified Clear', 60, 360);
    }

    const dataUrl = canvas.toDataURL('image/png');
    loadImageElement(dataUrl).then(img => {
      setOriginalImage(img);
      applyPreprocessing(img, filters);
      showFeedback(`Loaded sample: ${type.toUpperCase()}`);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div data-ag-id="DocumentIntelligence_Modal_Dialog" className="relative w-full max-w-5xl bg-[#161822] border border-[#2b3046] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#24283b] flex items-center justify-between bg-[#13151f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Offline Multimodal Document Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  WASM OCR v7.0
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Offline Camera Snapshots • Indian GST Invoices • Vedic Devanagari • Land Deeds
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-[#1e2233] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className="absolute top-16 right-6 z-50 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
            <Sparkles size={14} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Top Source Input Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11131c] p-3 rounded-2xl border border-[#222638]">
            {/* Input Selection Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  stopCamera();
                  setActiveInputTab('upload');
                  fileInputRef.current?.click();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeInputTab === 'upload' && imageSource && !cameraActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#1b1e2e] text-gray-300 hover:text-white border border-[#2a2f45]'
                }`}
              >
                <Upload size={15} />
                <span>Choose Image</span>
              </button>
              
              <button
                onClick={() => {
                  if (cameraActive) stopCamera();
                  else startCamera();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  cameraActive 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20 animate-pulse'
                    : 'bg-[#1b1e2e] text-gray-300 hover:text-white border border-[#2a2f45]'
                }`}
              >
                <Camera size={15} />
                <span>{cameraActive ? 'Stop Camera' : 'Live Camera Snapshot'}</span>
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelected(f);
                }} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Quick Test Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-gray-400 mr-1 hidden sm:inline">Try Demo:</span>
              <button
                onClick={() => loadPreset('invoice')}
                className="px-2.5 py-1 rounded-lg bg-[#181b2a] hover:bg-[#22273d] text-indigo-300 border border-[#282d44] text-[11px]"
              >
                🧾 GST Bill
              </button>
              <button
                onClick={() => loadPreset('vedic')}
                className="px-2.5 py-1 rounded-lg bg-[#181b2a] hover:bg-[#22273d] text-amber-300 border border-[#282d44] text-[11px]"
              >
                🕉️ Vedic Shloka
              </button>
              <button
                onClick={() => loadPreset('land')}
                className="px-2.5 py-1 rounded-lg bg-[#181b2a] hover:bg-[#22273d] text-emerald-300 border border-[#282d44] text-[11px]"
              >
                ⛰️ Land Khasra
              </button>
            </div>
          </div>

          {/* Camera Stream View if Active */}
          {cameraActive && (
            <div className="relative bg-black rounded-2xl overflow-hidden border border-[#2a3047] flex flex-col items-center justify-center p-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="max-h-72 w-auto rounded-xl shadow-lg border border-gray-700"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={captureSnapshot}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Camera size={16} />
                  <span>Snap Document Snapshot</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Studio Split View: Preview & OCR Controls */}
          {imageSource && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Image Canvas & Enhancements (5 cols) */}
              <div className="lg:col-span-5 bg-[#12141c] border border-[#23273a] rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-400" />
                    <span>Image Enhancement</span>
                  </span>
                  <button
                    onClick={rotateImage}
                    title="Rotate 90 degrees"
                    className="p-1.5 rounded-lg bg-[#1a1d2c] hover:bg-[#24283d] text-gray-300 hover:text-white text-xs flex items-center gap-1"
                  >
                    <RotateCw size={13} />
                    <span>Rotate</span>
                  </button>
                </div>

                {/* Filter Toggles */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => updateFilters({ grayscale: !filters.grayscale })}
                    className={`px-3 py-1.5 rounded-xl border transition-colors ${
                      filters.grayscale 
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-semibold' 
                        : 'bg-[#181a26] border-[#292e42] text-gray-400'
                    }`}
                  >
                    Grayscale
                  </button>
                  <button
                    onClick={() => updateFilters({ binarize: !filters.binarize })}
                    className={`px-3 py-1.5 rounded-xl border transition-colors ${
                      filters.binarize 
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-semibold' 
                        : 'bg-[#181a26] border-[#292e42] text-gray-400'
                    }`}
                  >
                    High Contrast B&W
                  </button>
                </div>

                {/* Image Container */}
                <div className="relative flex-1 min-h-[260px] max-h-[360px] bg-black/40 rounded-xl overflow-hidden border border-[#212435] flex items-center justify-center p-2">
                  <img 
                    src={imageSource} 
                    alt="Document Scan Source" 
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>

                {/* Engine Language Selector & Run Button */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Globe size={13} className="text-indigo-400" />
                      <span>Script Model:</span>
                    </span>
                    <select
                      value={langMode}
                      onChange={(e) => setLangMode(e.target.value as OcrLanguageMode)}
                      className="bg-[#1a1d2c] border border-[#292e42] text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="eng+hin">Bilingual (English + Hindi)</option>
                      <option value="eng">English Only (Fast Bills)</option>
                      <option value="hin">Hindi / Sanskrit (Devanagari)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunOcr}
                    disabled={isProcessing}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isProcessing 
                        ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white hover:brightness-110 shadow-indigo-500/20 active:scale-98'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={15} className="animate-spin text-white" />
                        <span>Transcribing in WASM...</span>
                      </>
                    ) : (
                      <>
                        <Cpu size={15} />
                        <span>Run Offline Document OCR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: OCR Results & Intelligence Hub (7 cols) */}
              <div className="lg:col-span-7 bg-[#12141c] border border-[#23273a] rounded-2xl p-4 flex flex-col space-y-4">
                
                {/* Progress Bar when running */}
                {isProcessing && (
                  <div className="p-4 bg-[#181a28] border border-indigo-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-300 font-semibold">{progress.status}</span>
                      <span className="font-mono text-indigo-400">{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-[#10121d] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results Header Tabs */}
                {intelligenceReport && (
                  <>
                    <div className="flex items-center justify-between border-b border-[#222638] pb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveResultTab('structured')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            activeResultTab === 'structured'
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Structured Intelligence
                        </button>
                        <button
                          onClick={() => setActiveResultTab('text')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            activeResultTab === 'text'
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Raw Transcript
                        </button>
                        <button
                          onClick={() => setActiveResultTab('markdown')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            activeResultTab === 'markdown'
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Vault Markdown
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {intelligenceReport.confidence}% Conf.
                        </span>
                      </div>
                    </div>

                    {/* Tab 1: Structured Intelligence Cards */}
                    {activeResultTab === 'structured' && (
                      <div className="space-y-3.5 overflow-y-auto max-h-[380px] pr-1">
                        
                        {/* Title & Classification Banner */}
                        <div className="p-3 bg-[#181b28] border border-[#272b3d] rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400">
                              {intelligenceReport.documentType.replace('_', ' ')}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{intelligenceReport.suggestedTitle}</h4>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {intelligenceReport.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-[#11131e] text-gray-400 border border-[#25283a]">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Invoice & Bill Details */}
                        {intelligenceReport.documentType === 'INVOICE_RECEIPT' && intelligenceReport.invoiceData && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="p-2.5 bg-[#171926] rounded-xl border border-[#24283b]">
                                <span className="text-[10px] text-gray-400 block">Merchant</span>
                                <span className="text-xs font-semibold text-white truncate block">{intelligenceReport.invoiceData.merchantName}</span>
                              </div>
                              <div className="p-2.5 bg-[#171926] rounded-xl border border-[#24283b]">
                                <span className="text-[10px] text-gray-400 block">Total Amount</span>
                                <span className="text-xs font-bold text-emerald-400 block">
                                  {intelligenceReport.invoiceData.totalAmount ? `₹${intelligenceReport.invoiceData.totalAmount}` : 'Unparsed'}
                                </span>
                              </div>
                              <div className="p-2.5 bg-[#171926] rounded-xl border border-[#24283b]">
                                <span className="text-[10px] text-gray-400 block">Payment Mode</span>
                                <span className="text-xs font-semibold text-indigo-300 block">{intelligenceReport.invoiceData.paymentMode}</span>
                              </div>
                              <div className="p-2.5 bg-[#171926] rounded-xl border border-[#24283b]">
                                <span className="text-[10px] text-gray-400 block">GSTIN</span>
                                <span className="text-xs font-mono text-gray-300 truncate block">
                                  {intelligenceReport.invoiceData.gstin || 'None'}
                                </span>
                              </div>
                            </div>

                            {/* Extracted Line Items */}
                            {intelligenceReport.invoiceData.lineItems.length > 0 && (
                              <div className="p-3 bg-[#171926] rounded-xl border border-[#24283b] space-y-1.5">
                                <span className="text-xs font-semibold text-gray-300 block">Identified Line Items:</span>
                                <div className="space-y-1">
                                  {intelligenceReport.invoiceData.lineItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#202333] last:border-0">
                                      <span className="text-gray-200">{item.name}</span>
                                      <span className="text-gray-400 font-mono">
                                        {item.qty ? `${item.qty} • ` : ''}₹{item.price?.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vedic & Ayurvedic Details */}
                        {intelligenceReport.documentType === 'VEDIC_PHILOSOPHY' && intelligenceReport.vedicData && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 bg-[#171926] rounded-xl border border-[#24283b]">
                                <span className="text-[10px] text-gray-400 block">Script / Language</span>
                                <span className="text-xs font-semibold text-amber-300 block">
                                  {intelligenceReport.vedicData.primaryLanguage} ({intelligenceReport.vedicData.devanagariRatio}% Devanagari)
                                </span>
                              </div>
                              <div className="p-2.5 bg-[#171926] rounded-xl border border-[#24283b]">
                                <span className="text-[10px] text-gray-400 block">Botanicals & Herbs</span>
                                <span className="text-xs font-semibold text-emerald-300 block">
                                  {intelligenceReport.vedicData.herbsDetected.join(', ') || 'None specifically tagged'}
                                </span>
                              </div>
                            </div>

                            {intelligenceReport.vedicData.shlokas.length > 0 && (
                              <div className="p-3 bg-[#171926] rounded-xl border border-[#24283b] space-y-2">
                                <span className="text-xs font-semibold text-amber-200 block">Extracted Verses / Shlokas:</span>
                                {intelligenceReport.vedicData.shlokas.map((s, idx) => (
                                  <blockquote key={idx} className="pl-3 border-l-2 border-amber-500 text-xs text-gray-200 font-serif italic">
                                    {s}
                                  </blockquote>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Land & Property Details */}
                        {intelligenceReport.documentType === 'LAND_PROPERTY' && intelligenceReport.landData && (
                          <div className="p-3 bg-[#171926] rounded-xl border border-[#24283b] space-y-2">
                            <span className="text-xs font-semibold text-emerald-300 block">Revenue & Parcel Metrics:</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>Khasra: <span className="font-semibold text-white">{intelligenceReport.landData.khasraNumbers.join(', ') || 'N/A'}</span></div>
                              <div>Tehsil: <span className="font-semibold text-white">{intelligenceReport.landData.villageOrTehsil || 'N/A'}</span></div>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 bg-[#151722] p-2.5 rounded-lg border border-[#222536]">
                          {intelligenceReport.summary}
                        </p>
                      </div>
                    )}

                    {/* Tab 2: Raw Transcribed Text */}
                    {activeResultTab === 'text' && (
                      <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>Characters: {editedText.length} | Words: {editedText.split(/\s+/).filter(Boolean).length}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(editedText);
                              showFeedback('Copied raw text to clipboard!');
                            }}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                          >
                            <Copy size={12} />
                            <span>Copy Text</span>
                          </button>
                        </div>
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          rows={11}
                          className="w-full bg-[#10121d] border border-[#242738] rounded-xl p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>
                    )}

                    {/* Tab 3: Generated Markdown Preview */}
                    {activeResultTab === 'markdown' && (
                      <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>GFM Markdown with YAML Frontmatter</span>
                          <button
                            onClick={() => {
                              const md = generateVaultMarkdown({ ...intelligenceReport, rawText: editedText });
                              navigator.clipboard.writeText(md);
                              showFeedback('Copied markdown to clipboard!');
                            }}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                          >
                            <Copy size={12} />
                            <span>Copy Markdown</span>
                          </button>
                        </div>
                        <pre className="w-full bg-[#10121d] border border-[#242738] rounded-xl p-3 text-xs text-gray-300 font-mono overflow-y-auto max-h-[300px] whitespace-pre-wrap">
                          {generateVaultMarkdown({ ...intelligenceReport, rawText: editedText })}
                        </pre>
                      </div>
                    )}

                    {/* Action Integration Buttons */}
                    <div className="pt-2 border-t border-[#23273a] flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleSaveToVault}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                      >
                        <BookOpen size={14} />
                        <span>Save to Knowledge Vault</span>
                      </button>

                      <button
                        onClick={handleSendToInbox}
                        className="px-4 py-2.5 rounded-xl bg-[#1b1e2c] hover:bg-[#252a3d] text-indigo-300 hover:text-white border border-[#2e3449] font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <Send size={14} />
                        <span>Send to Inbox for AI Tasks</span>
                      </button>

                      {intelligenceReport.documentType === 'INVOICE_RECEIPT' && intelligenceReport.invoiceData?.lineItems?.length ? (
                        <button
                          onClick={handleAddToPantry}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <UtensilsCrossed size={14} />
                          <span>Add to Pantry</span>
                        </button>
                      ) : null}
                    </div>
                  </>
                )}

                {/* Empty State before OCR run */}
                {!intelligenceReport && !isProcessing && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 space-y-2">
                    <Sparkles size={32} className="text-indigo-400 opacity-60" />
                    <p className="text-xs font-medium text-gray-300">Ready to Extract Document Intelligence</p>
                    <p className="text-[11px] max-w-sm text-gray-400">
                      Click "Run Offline Document OCR" to process text via WebAssembly, detect Indian GSTIN/bills, transcribe Devanagari Sanskrit verses, or parse land records.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty Prompt if no image loaded yet */}
          {!imageSource && !cameraActive && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#292f44] hover:border-indigo-500/60 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#11131d]/60 space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1b1e2e] flex items-center justify-center text-indigo-400 shadow-inner">
                <Upload size={24} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Choose a Document Image or Snap a Photo</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-md">
                  Supports Indian receipts, Sanskrit/Hindi handwritten or printed texts, land deeds, and bills. Works 100% offline via local WebAssembly.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-mono">
                <span>PNG, JPG, WEBP</span>
                <span>•</span>
                <span>Ctrl+V to Paste</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#222538] bg-[#12141c] flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% Local-First Tesseract WASM Engine</span>
          </span>
          <span className="font-mono text-gray-400">Om Knowledge OS v2.1</span>
        </div>
      </div>
    </div>
  );
};
