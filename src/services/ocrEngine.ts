import { createWorker } from 'tesseract.js';

export type OcrLanguageMode = 'eng+hin' | 'eng' | 'hin';

export interface OcrProgressUpdate {
  status: string;
  progress: number; // 0 - 100
}

export interface OcrWordInfo {
  text: string;
  confidence: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
  durationMs: number;
  languageMode: OcrLanguageMode;
  words: OcrWordInfo[];
}

let activeWorkerPromise: Promise<any> | null = null;
let currentLanguageMode: OcrLanguageMode = 'eng+hin';

/**
 * Unicode NFC Normalization for Devanagari Hindi/Sanskrit text.
 * Resolves font rendering issues, zero-width joiners, and loose nuktas.
 */
export function normalizeDevanagariUnicode(raw: string): string {
  if (!raw) return '';
  // Unicode Normalization Form C
  let normalized = raw.normalize('NFC');
  // Strip zero-width space anomalies & phantom joiners
  normalized = normalized.replace(/[\u200B\uFEFF]/g, '');
  // Clean whitespace preceding nuktas (\u093C)
  normalized = normalized.replace(/\s+(\u093C)/g, '$1');
  // Normalize danda (। or ||)
  normalized = normalized.replace(/\|\|/g, '॥').replace(/\|/g, '।');
  return normalized.trim();
}

/**
 * Gets or initializes a shared Tesseract.js worker instance with IndexedDB model caching.
 */
export async function getOcrWorker(
  langMode: OcrLanguageMode = 'eng+hin',
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<any> {
  // If language mode changed, re-initialize worker
  if (activeWorkerPromise && currentLanguageMode !== langMode) {
    try {
      const existingWorker = await activeWorkerPromise;
      await existingWorker.terminate();
    } catch (e) {
      console.warn('Worker termination caught:', e);
    }
    activeWorkerPromise = null;
  }

  currentLanguageMode = langMode;

  if (!activeWorkerPromise) {
    activeWorkerPromise = (async () => {
      const langs = langMode === 'eng+hin' ? ['eng', 'hin'] : [langMode];
      
      const worker = await createWorker(langs, undefined, {
        logger: (m) => {
          if (onProgress) {
            let label = 'Initializing OCR Engine...';
            if (m.status === 'loading tesseract core') label = 'Loading WebAssembly Core...';
            else if (m.status === 'initializing tesseract') label = 'Initializing Language Models...';
            else if (m.status === 'loading language traineddata') label = `Loading ${langMode} Data...`;
            else if (m.status === 'initializing api') label = 'Setting Up Recognition Matrix...';
            else if (m.status === 'recognizing text') label = 'Transcribing Document Text...';

            const pct = typeof m.progress === 'number' ? Math.round(m.progress * 100) : 0;
            onProgress({ status: label, progress: pct });
          }
        }
      });

      return worker;
    })();
  }

  return activeWorkerPromise;
}

/**
 * Performs full OCR recognition on a canvas, image, or image file.
 */
export async function recognizeDocumentImage(
  imageSource: HTMLCanvasElement | HTMLImageElement | string | File | Blob,
  langMode: OcrLanguageMode = 'eng+hin',
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<OcrResult> {
  const startTime = Date.now();
  onProgress?.({ status: 'Starting Document Scan...', progress: 5 });

  const worker = await getOcrWorker(langMode, onProgress);
  onProgress?.({ status: 'Transcribing Text & Character Matrix...', progress: 40 });

  const result = await worker.recognize(imageSource);
  const durationMs = Date.now() - startTime;

  const rawText = result.data?.text || '';
  const cleanText = normalizeDevanagariUnicode(rawText);
  const confidence = Math.round(result.data?.confidence || 0);

  const words: OcrWordInfo[] = (result.data?.words || []).map((w: any) => ({
    text: normalizeDevanagariUnicode(w.text),
    confidence: Math.round(w.confidence || 0)
  })).filter((w: OcrWordInfo) => w.text.length > 0);

  onProgress?.({ status: 'Transcription Completed!', progress: 100 });

  return {
    text: cleanText,
    confidence,
    durationMs,
    languageMode: langMode,
    words
  };
}
