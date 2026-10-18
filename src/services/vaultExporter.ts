/**
 * Om Knowledge OS - Two-Way Living Markdown Vault Exporter
 * Conforms to OKTP v1.0 and om-os-knowledge-markdown-bridge specifications.
 * 
 * Provides:
 * 1. YAML frontmatter formatting with tag taxonomies and [[wikilink]] preservation.
 * 2. Native File System Access API direct folder sync (showDirectoryPicker).
 * 3. Zero-dependency, ultra-lightweight PKZip generation for discrete .md archive exports.
 * 4. Master combined .md archive compilation.
 */

import type { KnowledgeItem } from '../db';

export interface VaultExportOptions {
  includeYamlFrontmatter?: boolean;
  folderPrefix?: string;
  decryptedCache?: Record<string, string>;
  generateIndex?: boolean;
}

export interface DirectoryExportResult {
  success: boolean;
  count: number;
  folderName?: string;
  error?: string;
  userCancelled?: boolean;
}

// ---------------------------------------------------------------------------
// CRC32 Calculation for Standard PKZip Generation (Zero External Dependencies)
// ---------------------------------------------------------------------------
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c >>> 0;
}

function calculateCRC32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function getDosDateTime(date: Date = new Date()): { time: number; date: number } {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  const time = (hours << 11) | (minutes << 5) | seconds;

  const year = Math.max(1980, date.getFullYear()) - 1980;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dDate = (year << 9) | (month << 5) | day;

  return { time, date: dDate };
}

// ---------------------------------------------------------------------------
// Filename Sanitization & YAML Frontmatter Formatter
// ---------------------------------------------------------------------------

/**
 * Sanitizes note title into a valid filesystem filename
 */
export function sanitizeNoteFilename(title: string, fallbackId: string): string {
  const cleaned = title
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  const baseName = cleaned.length > 0 ? cleaned : ('note_' + fallbackId);
  return baseName + '.md';
}

/**
 * Formats a KnowledgeItem into GFM Markdown with standardized YAML frontmatter
 */
export function formatNoteWithYAML(note: KnowledgeItem, decryptedCache?: Record<string, string>): string {
  const rawBody = decryptedCache?.[note.id] || note.content || '';
  
  // Check if content already contains YAML frontmatter
  const hasExistingFrontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(rawBody);
  let cleanedBody = rawBody;

  if (hasExistingFrontmatter) {
    // Strip existing frontmatter so we don't duplicate
    cleanedBody = rawBody.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
  }

  const dateCreatedStr = new Date(note.createdAt || Date.now()).toISOString();
  const dateUpdatedStr = new Date(note.updatedAt || Date.now()).toISOString();
  const tagsFormatted = note.tags && note.tags.length > 0
    ? '[' + note.tags.map(t => '"' + t.replace(/"/g, '\\"') + '"').join(', ') + ']'
    : '[]';

  const yamlLines = [
    '---',
    'id: "' + note.id + '"',
    'title: "' + note.title.replace(/"/g, '\\"') + '"',
    'type: "' + note.type + '"',
    'tags: ' + tagsFormatted,
    'createdAt: "' + dateCreatedStr + '"',
    'updatedAt: "' + dateUpdatedStr + '"'
  ];

  if (note.sourceUrl) {
    yamlLines.push('sourceUrl: "' + note.sourceUrl.replace(/"/g, '\\"') + '"');
  }
  if (note.projectId) {
    yamlLines.push('projectId: "' + note.projectId + '"');
  }

  yamlLines.push('---');
  yamlLines.push('');

  // If the body does not start with an H1 heading matching the title, add it for reading clarity
  if (!cleanedBody.startsWith('# ')) {
    yamlLines.push('# ' + note.title);
    yamlLines.push('');
  }

  yamlLines.push(cleanedBody);
  return yamlLines.join('\n');
}

/**
 * Generates an INDEX.md summary table and tag taxonomy manifest
 */
export function generateVaultIndex(notes: KnowledgeItem[]): string {
  const tagCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  for (const n of notes) {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    if (Array.isArray(n.tags)) {
      for (const t of n.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
  }

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const lines = [
    '# Om Knowledge OS - Knowledge Vault Master Index',
    '*Generated on ' + new Date().toLocaleString() + ' | Total Notes: ' + notes.length + '*',
    '',
    '## 1. Type Distribution',
    ...sortedTypes.map(([type, count]) => '- **' + type + '**: ' + count + ' notes'),
    '',
    '## 2. Top Tag Taxonomies',
    ...sortedTags.slice(0, 20).map(([tag, count]) => '- `#' + tag + '`: ' + count + ' notes'),
    '',
    '## 3. Vault Manifest',
    '| Note Title | Type | Tags | Last Updated | Filename |',
    '|---|---|---|---|---|'
  ];

  for (const n of notes) {
    const updated = new Date(n.updatedAt).toISOString().split('T')[0];
    const filename = sanitizeNoteFilename(n.title, n.id);
    const tagsStr = (n.tags || []).map(t => '`' + t + '`').join(', ') || '-';
    lines.push('| [[' + n.title + ']] | ' + n.type + ' | ' + tagsStr + ' | ' + updated + ' | [' + filename + '](./' + filename + ') |');
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// PKZip Binary Packager (Zero External Dependencies)
// ---------------------------------------------------------------------------

interface ZipEntry {
  name: string;
  content: string;
}

/**
 * Compiles a list of text files into a standard PKZip Uint8Array
 */
function buildZipArchive(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let currentOffset = 0;
  const { time, date } = getDosDateTime();

  for (const entry of entries) {
    const filenameBytes = encoder.encode(entry.name);
    const contentBytes = encoder.encode(entry.content);
    const crc = calculateCRC32(contentBytes);
    const size = contentBytes.length;

    // Local file header (30 bytes + name + content)
    const localHeader = new Uint8Array(30 + filenameBytes.length + size);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true); // Local header signature
    localView.setUint16(4, 20, true);         // Version needed: 2.0
    localView.setUint16(6, 0x0800, true);      // General purpose bit flag (UTF-8)
    localView.setUint16(8, 0, true);           // Compression: 0 (Stored)
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, size, true);       // Compressed size
    localView.setUint32(22, size, true);       // Uncompressed size
    localView.setUint16(26, filenameBytes.length, true);
    localView.setUint16(28, 0, true);          // Extra field length

    localHeader.set(filenameBytes, 30);
    localHeader.set(contentBytes, 30 + filenameBytes.length);
    localHeaders.push(localHeader);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true); // Central header signature
    centralView.setUint16(4, 20, true);          // Version made by: 2.0
    centralView.setUint16(6, 20, true);          // Version needed: 2.0
    centralView.setUint16(8, 0x0800, true);       // UTF-8
    centralView.setUint16(10, 0, true);          // Compression: 0
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, size, true);
    centralView.setUint32(24, size, true);
    centralView.setUint16(28, filenameBytes.length, true);
    centralView.setUint16(30, 0, true);          // Extra field length
    centralView.setUint16(32, 0, true);          // Comment length
    centralView.setUint16(34, 0, true);          // Disk start
    centralView.setUint16(36, 0, true);          // Internal attributes
    centralView.setUint32(38, 0, true);          // External attributes
    centralView.setUint32(42, currentOffset, true); // Relative offset of local header

    centralHeader.set(filenameBytes, 46);
    centralHeaders.push(centralHeader);

    currentOffset += localHeader.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true); // Disk number
  eocdView.setUint16(6, 0, true); // CD start disk
  eocdView.setUint16(8, entries.length, true); // Records on this disk
  eocdView.setUint16(10, entries.length, true); // Total records
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, centralDirOffset, true);
  eocdView.setUint16(20, 0, true); // Comment length

  // Combine into single Uint8Array
  const totalLength = currentOffset + centralDirSize + 22;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const lh of localHeaders) {
    result.set(lh, pos);
    pos += lh.length;
  }
  for (const ch of centralHeaders) {
    result.set(ch, pos);
    pos += ch.length;
  }
  result.set(eocd, pos);
  return result;
}

// ---------------------------------------------------------------------------
// Public Export APIs
// ---------------------------------------------------------------------------

/**
 * Checks if the browser supports the File System Access API showDirectoryPicker
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Exports all Knowledge Items as discrete .md files into a user-selected folder via showDirectoryPicker
 */
export async function exportVaultToDirectoryPicker(
  notes: KnowledgeItem[],
  options?: VaultExportOptions
): Promise<DirectoryExportResult> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      count: 0,
      error: 'File System Access API (showDirectoryPicker) is not supported in this browser environment.'
    };
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'om_knowledge_vault_export',
      mode: 'readwrite',
      startIn: 'documents'
    });

    const usedFilenames = new Set<string>();
    let writtenCount = 0;

    for (const note of notes) {
      let filename = sanitizeNoteFilename(note.title, note.id);
      
      // Deduplicate filenames if multiple notes share the exact title
      let counter = 1;
      while (usedFilenames.has(filename.toLowerCase())) {
        const base = filename.replace(/\.md$/i, '');
        filename = base + '_' + counter + '.md';
        counter++;
      }
      usedFilenames.add(filename.toLowerCase());

      const markdownContent = formatNoteWithYAML(note, options?.decryptedCache);
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(markdownContent);
      await writable.close();
      writtenCount++;
    }

    // Write INDEX.md if requested (default true)
    if (options?.generateIndex !== false) {
      const indexContent = generateVaultIndex(notes);
      const indexHandle = await dirHandle.getFileHandle('INDEX.md', { create: true });
      const writableIndex = await indexHandle.createWritable();
      await writableIndex.write(indexContent);
      await writableIndex.close();
    }

    return {
      success: true,
      count: writtenCount,
      folderName: dirHandle.name
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        success: false,
        count: 0,
        userCancelled: true
      };
    }
    return {
      success: false,
      count: 0,
      error: err?.message || 'Failed to write markdown files to directory.'
    };
  }
}

/**
 * Packages all Knowledge Items into a multi-file .zip archive Blob
 */
export async function exportVaultToZip(
  notes: KnowledgeItem[],
  options?: VaultExportOptions
): Promise<Blob> {
  const entries: ZipEntry[] = [];
  const usedFilenames = new Set<string>();

  for (const note of notes) {
    let filename = sanitizeNoteFilename(note.title, note.id);
    let counter = 1;
    while (usedFilenames.has(filename.toLowerCase())) {
      const base = filename.replace(/\.md$/i, '');
      filename = base + '_' + counter + '.md';
      counter++;
    }
    usedFilenames.add(filename.toLowerCase());

    const markdownContent = formatNoteWithYAML(note, options?.decryptedCache);
    entries.push({
      name: filename,
      content: markdownContent
    });
  }

  // Include INDEX.md
  if (options?.generateIndex !== false) {
    entries.push({
      name: 'INDEX.md',
      content: generateVaultIndex(notes)
    });
  }

  const zipBytes = buildZipArchive(entries);
  return new Blob([zipBytes as any], { type: 'application/zip' });
}

/**
 * Compiles entire Knowledge Vault into a single consolidated master markdown file
 */
export function exportVaultAsMasterMarkdown(
  notes: KnowledgeItem[],
  options?: VaultExportOptions
): Blob {
  const timestamp = new Date().toISOString().split('T')[0];
  const separator = '\n\n' + '='.repeat(80) + '\n\n';

  const combined = [
    '# Om Knowledge OS - Knowledge Vault Master Archive',
    '*Generated on ' + new Date().toLocaleString() + ' | Total Notes: ' + notes.length + '*',
    separator,
    notes.map(note => formatNoteWithYAML(note, options?.decryptedCache)).join(separator)
  ].join('\n');

  return new Blob([combined], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Triggers a client-side file download for any Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
