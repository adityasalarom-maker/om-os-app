import { createWorker } from 'tesseract.js';

let workerPromise: Promise<any> | null = null;

export async function getSharedOcrWorker(onProgress?: (progress: number) => void) {
  if (!workerPromise) {
    workerPromise = (async () => {
      // Initialize Tesseract with English and Hindi models
      const worker = await createWorker(['eng', 'hin'], undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress && typeof m.progress === 'number') {
            onProgress(Math.round(m.progress * 100));
          }
        }
      });
      return worker;
    })();
  }
  return workerPromise;
}

export function normalizeDevanagariUnicode(raw: string): string {
  if (!raw) return '';
  // Unicode Normalization Form C
  let normalized = raw.normalize('NFC');
  // Clean zero-width space anomalies
  normalized = normalized.replace(/\u200B/g, '');
  // Clean whitespace preceding nuktas
  normalized = normalized.replace(/\s+(\u093C)/g, '$1');
  return normalized.trim();
}

export async function performPageOcr(
  canvas: HTMLCanvasElement,
  onProgress?: (pct: number) => void
): Promise<{ text: string; confidence: number }> {
  const worker = await getSharedOcrWorker(onProgress);
  const result = await worker.recognize(canvas);
  const cleanText = normalizeDevanagariUnicode(result.data.text);
  return {
    text: cleanText,
    confidence: Math.round(result.data.confidence)
  };
}
