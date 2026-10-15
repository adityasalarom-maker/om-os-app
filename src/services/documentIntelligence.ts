// Document Intelligence Engine for Indian Bills, Sanskrit/Hindi Texts, and Land Deeds
import { type OcrResult } from './ocrEngine';

export type DocumentType = 
  | 'INVOICE_RECEIPT' 
  | 'VEDIC_PHILOSOPHY' 
  | 'LAND_PROPERTY' 
  | 'GENERAL_NOTE';

export interface InvoiceData {
  merchantName: string;
  invoiceNumber?: string;
  date?: string;
  gstin?: string;
  totalAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  paymentMode?: string;
  lineItems: { name: string; qty?: string; price?: number }[];
}

export interface VedicTextData {
  primaryLanguage: 'Hindi' | 'Sanskrit' | 'English' | 'Bilingual';
  devanagariRatio: number;
  shlokas: string[];
  herbsDetected: string[];
  philosophicalConcepts: string[];
}

export interface LandRecordData {
  khasraNumbers: string[];
  khatauniNumber?: string;
  villageOrTehsil?: string;
  district?: string;
  areaDimensions?: string[];
  deedType?: string;
}

export interface DocumentIntelligenceReport {
  documentType: DocumentType;
  confidence: number;
  rawText: string;
  summary: string;
  tags: string[];
  suggestedTitle: string;
  invoiceData?: InvoiceData;
  vedicData?: VedicTextData;
  landData?: LandRecordData;
}

// Common Indian herbs and Ayurvedic terms
const AYURVEDIC_HERBS = [
  'triphala', 'ashwagandha', 'brahmi', 'ghee', 'ghrita', 'guggulu', 'giloy', 'guduchi',
  'tulsi', 'shatavari', 'chyawanprash', 'haritaki', 'amla', 'amalaki', 'bibhitaki',
  'neem', 'haldi', 'turmeric', 'mulethi', 'shankhpushpi', 'tirtham', 'mustard oil'
];

const VEDIC_CONCEPTS = [
  'vivarta vada', 'parinama vada', 'brahman', 'maya', 'atman', 'viveka', 'vairagya',
  'dhyana', 'samadhi', 'sattva', 'rajas', 'tamas', 'dosha', 'vata', 'pitta', 'kapha',
  'agni', 'prana', 'upanishad', 'vedanta', 'gita', 'sutra', 'moksha'
];

/**
 * Classifies the document text based on structural tokens and semantic markers.
 */
export function classifyDocument(text: string): DocumentType {
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();

  // 1. Invoice / Receipt detection
  const invoiceKeywords = ['INVOICE', 'TAX INVOICE', 'GSTIN', 'GST NO', 'RECEIPT', 'CASH MEMO', 'TOTAL:', 'GRAND TOTAL', 'NET AMOUNT', 'SUB TOTAL', 'CGST', 'SGST', 'BILL NO'];
  const invoiceHits = invoiceKeywords.filter(k => upper.includes(k)).length;
  if (invoiceHits >= 2 || (upper.includes('GSTIN') && upper.includes('TOTAL'))) {
    return 'INVOICE_RECEIPT';
  }

  // 2. Land / Property Deed detection
  const landKeywords = ['खसरा', 'खातौनी', 'गाटा', 'तहसील', 'परगना', 'बैनामा', 'रजिस्ट्री', 'रकबा', 'khasra', 'khatauni', 'tehsil', 'deed', 'registry', 'bigha', 'nali'];
  const landHits = landKeywords.filter(k => lower.includes(k)).length;
  if (landHits >= 2) {
    return 'LAND_PROPERTY';
  }

  // 3. Vedic / Ayurvedic text detection
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const devanagariRatio = text.length > 0 ? devanagariCount / text.length : 0;
  const vedicHits = [...AYURVEDIC_HERBS, ...VEDIC_CONCEPTS].filter(c => lower.includes(c)).length;

  if (devanagariRatio > 0.25 || vedicHits >= 2 || text.includes('॥') || text.includes('।')) {
    return 'VEDIC_PHILOSOPHY';
  }

  return 'GENERAL_NOTE';
}

/**
 * Parses Indian bills, retail invoices, and grocery receipts.
 */
export function parseInvoice(text: string): InvoiceData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract Merchant Name (usually first 1-3 prominent lines)
  let merchantName = 'Store / Retailer';
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const line = lines[i];
    if (!/invoice|tax|receipt|cash|welcome|phone|gstin|date/i.test(line) && line.length > 3) {
      merchantName = line.replace(/^[^\w\u0900-\u097F]+|[^\w\u0900-\u097F]+$/g, '');
      break;
    }
  }

  // GSTIN 15-character Indian format
  const gstinMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/);
  const gstin = gstinMatch ? gstinMatch[0] : undefined;

  // Date
  const dateMatch = text.match(/\b(\d{1,2}[-/.](?:\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-/.](?:\d{4}|\d{2}))\b/i);
  const date = dateMatch ? dateMatch[0] : undefined;

  // Invoice / Bill Number
  const invMatch = text.match(/(?:INV(?:OICE)?|BILL|RECEIPT|MEMO)\s*(?:NO|NUMBER|#)?\s*[:.-]?\s*([A-Za-z0-9/-]+)/i);
  const invoiceNumber = invMatch ? invMatch[1] : undefined;

  // Total Amount (Matches ₹, Rs., Total, Grand Total)
  let totalAmount: number | undefined;
  const totalMatches = Array.from(text.matchAll(/(?:Total|Grand Total|Net Amount|Total Payable|Net Payable|Amount Paid|Cash|UPI)\s*[:₹Rs.]*\s*([0-9,]+(?:\.[0-9]{2})?)/gi));
  if (totalMatches.length > 0) {
    const lastTotal = totalMatches[totalMatches.length - 1][1].replace(/,/g, '');
    const parsed = parseFloat(lastTotal);
    if (!isNaN(parsed) && parsed > 0) totalAmount = parsed;
  }

  // Payment Mode
  let paymentMode = 'Cash';
  if (/upi|google\s?pay|gpay|phonepe|paytm/i.test(text)) paymentMode = 'UPI';
  else if (/visa|mastercard|rupay|card|debit|credit/i.test(text)) paymentMode = 'Card';
  else if (/net\s?banking|neft|rtgs/i.test(text)) paymentMode = 'Bank Transfer';

  // Line items heuristic
  const lineItems: { name: string; qty?: string; price?: number }[] = [];
  for (const line of lines) {
    // Look for lines ending with a currency amount e.g. "Rice 5kg 350.00"
    const itemMatch = line.match(/^([A-Za-z\u0900-\u097F\s&/-]{3,35})\s+(\d+(?:\.\d+)?\s*(?:kg|g|l|ml|pc|unit|pcs)?)?\s*[:₹Rs.]*\s*(\d+(?:\.\d{2})?)$/i);
    if (itemMatch && !/total|cgst|sgst|tax|discount|change|balance/i.test(itemMatch[1])) {
      lineItems.push({
        name: itemMatch[1].trim(),
        qty: itemMatch[2]?.trim(),
        price: parseFloat(itemMatch[3])
      });
    }
  }

  return {
    merchantName,
    invoiceNumber,
    date,
    gstin,
    totalAmount,
    paymentMode,
    lineItems
  };
}

/**
 * Parses Sanskrit, Hindi, Vedic, or Ayurvedic texts.
 */
export function parseVedicText(text: string): VedicTextData {
  const lower = text.toLowerCase();
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const devanagariRatio = text.length > 0 ? Math.round((devanagariCount / text.length) * 100) : 0;

  // Language Detection
  let primaryLanguage: VedicTextData['primaryLanguage'] = 'English';
  if (devanagariRatio > 60) primaryLanguage = 'Hindi';
  else if (devanagariRatio > 15) primaryLanguage = 'Bilingual';

  // Shlokas / Verses extraction
  const shlokaLines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.includes('॥') || l.includes('।') || /^[ॐ\u0900-\u097F]/.test(l))
    .filter(l => l.length > 8);

  // Herbs & Concepts detected
  const herbsDetected = AYURVEDIC_HERBS.filter(h => lower.includes(h));
  const philosophicalConcepts = VEDIC_CONCEPTS.filter(c => lower.includes(c));

  return {
    primaryLanguage,
    devanagariRatio,
    shlokas: shlokaLines.slice(0, 8),
    herbsDetected,
    philosophicalConcepts
  };
}

/**
 * Parses Land & Property Records (Khatauni / Khasra / Himalayan Land).
 */
export function parseLandRecord(text: string): LandRecordData {
  const khasraNumbers: string[] = [];
  const khasraMatches = Array.from(text.matchAll(/(?:खसरा|गाटा|khasra|gata)\s*(?:नं|संख्या|no)?\s*[:.-]?\s*([0-9\u0966-\u096F/,-]+)/gi));
  for (const m of khasraMatches) {
    if (m[1] && !khasraNumbers.includes(m[1])) khasraNumbers.push(m[1]);
  }

  const khatauniMatch = text.match(/(?:खातौनी|khatauni)\s*(?:नं|संख्या|no)?\s*[:.-]?\s*([0-9\u0966-\u096F/,-]+)/i);
  const khatauniNumber = khatauniMatch ? khatauniMatch[1] : undefined;

  const tehsilMatch = text.match(/(?:तहसील|ग्राम|परगना|tehsil|village)\s*[:.-]?\s*([A-Za-z\u0900-\u097F\s]{3,25})/i);
  const villageOrTehsil = tehsilMatch ? tehsilMatch[1].trim() : undefined;

  const areaMatches = Array.from(text.matchAll(/(\d+(?:\.\d+)?\s*(?:बीघा|नाली|बिस्वा|हेक्टेयर|bigha|nali|sq\.?\s?ft|acre))/gi)).map(m => m[0]);

  return {
    khasraNumbers,
    khatauniNumber,
    villageOrTehsil,
    areaDimensions: areaMatches
  };
}

/**
 * Master Document Analysis pipeline
 */
export function analyzeDocumentOcr(ocr: OcrResult, filenameHint?: string): DocumentIntelligenceReport {
  const text = ocr.text;
  const docType = classifyDocument(text);
  const dateStr = new Date().toISOString().split('T')[0];

  let summary = '';
  let tags: string[] = ['OCR', 'Document-Scan'];
  let suggestedTitle = filenameHint ? filenameHint.replace(/\.[^/.]+$/, '') : `Document Scan ${dateStr}`;

  let invoiceData: InvoiceData | undefined;
  let vedicData: VedicTextData | undefined;
  let landData: LandRecordData | undefined;

  switch (docType) {
    case 'INVOICE_RECEIPT': {
      invoiceData = parseInvoice(text);
      tags.push('Receipt', 'Expense', 'Financial');
      if (invoiceData.gstin) tags.push('GST');
      if (invoiceData.merchantName && invoiceData.merchantName !== 'Store / Retailer') {
        suggestedTitle = `Receipt: ${invoiceData.merchantName} (${invoiceData.totalAmount ? `₹${invoiceData.totalAmount}` : dateStr})`;
      } else {
        suggestedTitle = `Retail Invoice (${invoiceData.totalAmount ? `₹${invoiceData.totalAmount}` : dateStr})`;
      }
      summary = `Verified ${invoiceData.paymentMode} receipt from ${invoiceData.merchantName}. Total: ${invoiceData.totalAmount ? `₹${invoiceData.totalAmount}` : 'Unspecified'}.`;
      break;
    }

    case 'VEDIC_PHILOSOPHY': {
      vedicData = parseVedicText(text);
      tags.push('Philosophy', 'Vedanta', 'Ayurveda', vedicData.primaryLanguage);
      if (vedicData.herbsDetected.length > 0) tags.push('Herbs');
      if (vedicData.philosophicalConcepts.length > 0) {
        suggestedTitle = `Synthesis: ${vedicData.philosophicalConcepts.slice(0, 2).map(c => c.toUpperCase()).join(' & ')}`;
      } else {
        suggestedTitle = `Vedic & Ayurvedic Transcription (${dateStr})`;
      }
      summary = `Devanagari text (${vedicData.devanagariRatio}%). Detected ${vedicData.shlokas.length} verses and ${vedicData.herbsDetected.length} Ayurvedic botanical references.`;
      break;
    }

    case 'LAND_PROPERTY': {
      landData = parseLandRecord(text);
      tags.push('Land-Record', 'Due-Diligence', 'Property');
      suggestedTitle = `Land Diligence: Khasra ${landData.khasraNumbers.join(', ') || 'Record'}`;
      summary = `Property parcel diligence record. Khasra: ${landData.khasraNumbers.join(', ') || 'N/A'}, Tehsil: ${landData.villageOrTehsil || 'N/A'}.`;
      break;
    }

    case 'GENERAL_NOTE':
    default: {
      tags.push('Note', 'General');
      suggestedTitle = `Scanned Note (${dateStr})`;
      summary = `Scanned document transcribed with ${ocr.confidence}% character confidence.`;
      break;
    }
  }

  return {
    documentType: docType,
    confidence: ocr.confidence,
    rawText: text,
    summary,
    tags,
    suggestedTitle,
    invoiceData,
    vedicData,
    landData
  };
}

/**
 * Synthesizes a standardized GitHub-Flavored Markdown note with YAML frontmatter.
 */
export function generateVaultMarkdown(report: DocumentIntelligenceReport): string {
  const now = new Date().toISOString();
  const yaml = [
    '---',
    `id: ocr-scan-${Date.now()}`,
    `title: "${report.suggestedTitle}"`,
    `type: Note`,
    `documentType: "${report.documentType}"`,
    `confidence: ${report.confidence}%`,
    `tags: [${report.tags.map(t => `"${t}"`).join(', ')}]`,
    `createdAt: "${now}"`,
    '---',
    ''
  ].join('\n');

  let body = `# ${report.suggestedTitle}\n\n`;
  body += `> **OCR Synthesis & Intelligence** (${report.confidence}% Confidence | ${report.documentType})\n`;
  body += `> ${report.summary}\n\n`;

  // Specific structured sections
  if (report.documentType === 'INVOICE_RECEIPT' && report.invoiceData) {
    const inv = report.invoiceData;
    body += `### Financial & Invoice Breakdown\n\n`;
    body += `| Parameter | Value |\n`;
    body += `| :--- | :--- |\n`;
    body += `| **Merchant** | ${inv.merchantName} |\n`;
    if (inv.date) body += `| **Date** | ${inv.date} |\n`;
    if (inv.invoiceNumber) body += `| **Invoice #** | ${inv.invoiceNumber} |\n`;
    if (inv.gstin) body += `| **GSTIN** | \`${inv.gstin}\` |\n`;
    if (inv.totalAmount) body += `| **Total Amount** | **₹${inv.totalAmount.toFixed(2)}** |\n`;
    body += `| **Payment Mode** | ${inv.paymentMode || 'Cash'} |\n\n`;

    if (inv.lineItems.length > 0) {
      body += `#### Extracted Line Items\n\n`;
      body += `| Item | Qty | Price |\n`;
      body += `| :--- | :--- | :--- |\n`;
      for (const item of inv.lineItems) {
        body += `| ${item.name} | ${item.qty || '1'} | ${item.price ? `₹${item.price.toFixed(2)}` : '—'} |\n`;
      }
      body += `\n`;
    }
  } else if (report.documentType === 'VEDIC_PHILOSOPHY' && report.vedicData) {
    const ved = report.vedicData;
    body += `### Philosophical & Ayurvedic Overview\n\n`;
    body += `- **Script / Language**: ${ved.primaryLanguage} (${ved.devanagariRatio}% Devanagari script ratio)\n`;
    if (ved.philosophicalConcepts.length > 0) {
      body += `- **Concepts Identified**: ${ved.philosophicalConcepts.map(c => `[[${c}]]`).join(', ')}\n`;
    }
    if (ved.herbsDetected.length > 0) {
      body += `- **Ayurvedic Botanicals**: ${ved.herbsDetected.map(h => `\`#${h}\``).join(', ')}\n`;
    }
    body += `\n`;

    if (ved.shlokas.length > 0) {
      body += `#### Transcribed Shlokas & Verses\n\n`;
      for (const shloka of ved.shlokas) {
        body += `> ${shloka}\n\n`;
      }
    }
  } else if (report.documentType === 'LAND_PROPERTY' && report.landData) {
    const land = report.landData;
    body += `### Land Due Diligence Metadata\n\n`;
    body += `| Metric | Registered Details |\n`;
    body += `| :--- | :--- |\n`;
    body += `| **Khasra / Gata** | ${land.khasraNumbers.join(', ') || 'Pending verification'} |\n`;
    if (land.khatauniNumber) body += `| **Khatauni No** | ${land.khatauniNumber} |\n`;
    if (land.villageOrTehsil) body += `| **Tehsil / Village** | ${land.villageOrTehsil} |\n`;
    if (land.areaDimensions?.length) body += `| **Registered Area** | ${land.areaDimensions.join(', ')} |\n`;
    body += `\n`;
  }

  // Raw Transcript Section
  body += `### Complete Transcription\n\n`;
  body += `<details>\n<summary>Click to expand raw OCR transcribed text</summary>\n\n`;
  body += `\`\`\`text\n${report.rawText}\n\`\`\`\n\n`;
  body += `</details>\n`;

  return yaml + body;
}
