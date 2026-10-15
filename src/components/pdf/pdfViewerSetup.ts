import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker in Vite using worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export { pdfjsLib };
