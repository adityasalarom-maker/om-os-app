// Image Preprocessing Utility for Mobile Camera Snapshots & Document OCR
export interface ImageFilterOptions {
  grayscale?: boolean;
  binarize?: boolean;
  threshold?: number; // 0 - 255 (default 128)
  contrast?: number; // -100 to 100 (default 20)
  brightness?: number; // -100 to 100 (default 10)
  rotation?: number; // 0, 90, 180, 270 degrees
}

/**
 * Preprocesses an image or canvas element for optimal Tesseract OCR accuracy.
 * Enhances contrast, removes chromatic noise, and creates sharp binarized text.
 */
export async function preprocessImage(
  source: HTMLImageElement | HTMLCanvasElement,
  options: ImageFilterOptions = {}
): Promise<{ canvas: HTMLCanvasElement; dataUrl: string }> {
  const {
    grayscale = true,
    binarize = false,
    threshold = 135,
    contrast = 25,
    brightness = 10,
    rotation = 0
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Handle Rotation Dimensions
  const isRotatedQuarter = rotation === 90 || rotation === 270;
  canvas.width = isRotatedQuarter ? source.height : source.width;
  canvas.height = isRotatedQuarter ? source.width : source.height;

  // Apply transformations
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  ctx.restore();

  // If no pixel processing requested, return original rotated canvas
  if (!grayscale && !binarize && contrast === 0 && brightness === 0) {
    return { canvas, dataUrl: canvas.toDataURL('image/png') };
  }

  // Get pixel data for digital processing
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const numPixels = data.length;

  // Contrast factor calculation
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < numPixels; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Grayscale luminance (Rec. 709 HDTV standard)
    let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // 2. Brightness adjustment
    gray += brightness;

    // 3. Contrast adjustment
    gray = factor * (gray - 128) + 128;

    // Clamp value
    gray = Math.max(0, Math.min(255, gray));

    // 4. Adaptive Binarization (Otsu-style hard threshold)
    if (binarize) {
      gray = gray >= threshold ? 255 : 0;
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    // data[i + 3] (alpha) remains unchanged
  }

  ctx.putImageData(imgData, 0, 0);
  return { canvas, dataUrl: canvas.toDataURL('image/png') };
}

/**
 * Loads an image file (File, Blob, or Data URL) into an HTMLImageElement
 */
export function loadImageElement(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    }
  });
}
