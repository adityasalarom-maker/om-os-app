// PDF Reader OCR Service Adapter - Delegating to Unified ocrEngine
import { recognizeDocumentImage, normalizeDevanagariUnicode as baseNormalize } from '../../services/ocrEngine';

export const normalizeDevanagariUnicode = baseNormalize;

export async function performPageOcr(
  canvas: HTMLCanvasElement,
  onProgress?: (pct: number) => void
): Promise<{ text: string; confidence: number }> {
  const result = await recognizeDocumentImage(canvas, 'eng+hin', (upd) => {
    if (onProgress) onProgress(upd.progress);
  });

  return {
    text: result.text,
    confidence: result.confidence
  };
}
