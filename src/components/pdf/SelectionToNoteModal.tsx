import React, { useState } from 'react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  FileText, 
  CheckCircle2, 
  Plus, 
  X, 
  Copy, 
  FileDown, 
  Quote, 
  BookOpen,
  Highlighter,
  Lightbulb,
  Bookmark,
  Sparkles,
  Link2
} from 'lucide-react';

interface SelectionToNoteModalProps {
  selectedText?: string;
  documentTitle: string;
  documentAuthor?: string;
  pageNumber: number;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const SelectionToNoteModal: React.FC<SelectionToNoteModalProps> = ({
  selectedText = '',
  documentTitle,
  documentAuthor = '',
  pageNumber,
  onClose,
  onSuccess
}) => {
  const [extractionType, setExtractionType] = useState<'Quote' | 'Highlight' | 'Key Takeaway' | 'Reading Note'>('Quote');
  const [author, setAuthor] = useState<string>(documentAuthor || 'Unknown Author');
  const [passageText, setPassageText] = useState<string>(selectedText);
  const [userReflection, setUserReflection] = useState<string>('');
  const [format, setFormat] = useState<'md' | 'txt'>('md');
  const [destinationMode, setDestinationMode] = useState<'new' | 'existing'>('new');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [newNoteTitle, setNewNoteTitle] = useState<string>(
    `${extractionType} from [[${documentTitle}]] (p. ${pageNumber})`
  );
  const [tagInput, setTagInput] = useState<string>('Reading-Extraction, Book-Quote');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const existingNotes = useLiveQuery(() => db.knowledge.toArray(), []) || [];
  const recentDestinations = useLiveQuery(() => db.noteDestinations.orderBy('lastUsedAt').reverse().limit(4).toArray(), []) || [];

  const timestamp = new Date().toLocaleString();
  const dateIso = new Date().toISOString().split('T')[0];

  // Authentic Notion OS & OKTP v1.0 formatted extraction with [[wikilink]] backlink
  const formattedMarkdown = `---
type: Reading Extraction
book: "[[${documentTitle}]]"
author: "${author.trim()}"
page: ${pageNumber}
extraction_type: ${extractionType}
captured_at: "${dateIso}"
tags:
  - Reading-Extraction
  - Book-${extractionType.replace(/\s+/g, '')}
---

# [[${documentTitle}]] — ${extractionType} (p. ${pageNumber})

> [!QUOTE] Page ${pageNumber} — [[${documentTitle}]] by ${author.trim()}
> ${passageText.replace(/\n/g, '\n> ')}

${userReflection.trim() ? `**Reflection & Synthesis:**\n${userReflection.trim()}\n\n` : ''}**Source Reference & Backlinks:**
- Source Book: [[${documentTitle}]]
- Author: ${author.trim()}
- Page: ${pageNumber}
- Reading Hub: [[Reading Library]]
- Captured on: ${timestamp}
`;

  const formattedPlain = `[${extractionType.toUpperCase()} - Page ${pageNumber} - ${documentTitle}]
Author: ${author.trim()}
Quote:
${passageText}

${userReflection.trim() ? `Reflection: ${userReflection.trim()}\n` : ''}Captured on: ${timestamp}
Source Link: [[${documentTitle}]]
----------------------------------------`;

  const formattedContent = format === 'md' ? formattedMarkdown : formattedPlain;

  const handleAppendToNote = async () => {
    const now = Date.now();

    if (destinationMode === 'existing') {
      const targetNote = existingNotes.find(n => n.id === selectedNoteId);
      if (!targetNote) {
        alert('Please select an existing destination note.');
        return;
      }

      const appendBlock = format === 'md'
        ? `\n\n---\n### ${extractionType} from [[${documentTitle}]] (p. ${pageNumber})\n> [!QUOTE] Page ${pageNumber} — [[${documentTitle}]] (${author.trim()})\n> ${passageText.replace(/\n/g, '\n> ')}\n\n${userReflection.trim() ? `*Reflection: ${userReflection.trim()}*\n\n` : ''}*Captured from [[${documentTitle}]] on ${timestamp}*\n`
        : `\n\n[${extractionType} - Page ${pageNumber} - ${documentTitle}]\n${passageText}\n${userReflection.trim() ? `Reflection: ${userReflection.trim()}\n` : ''}Captured: ${timestamp}\n`;

      await db.knowledge.update(targetNote.id, {
        content: targetNote.content + appendBlock,
        updatedAt: now
      });

      // Update LRU destination record
      await db.noteDestinations.put({
        id: targetNote.id,
        title: targetNote.title,
        format,
        lastUsedAt: now
      });

      onSuccess(`Extracted ${extractionType.toLowerCase()} appended to note "${targetNote.title}" with [[${documentTitle}]] backlink!`);
      onClose();
    } else {
      // Create new atomic note in Knowledge Vault
      if (!newNoteTitle.trim()) return;

      const rawTags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const resolvedTags = Array.from(new Set([
        'Reading-Extraction',
        `Book-${extractionType.replace(/\s+/g, '')}`,
        documentTitle.slice(0, 25).trim(),
        ...rawTags
      ]));

      const newId = `know-${now}`;
      await db.knowledge.add({
        id: newId,
        title: newNoteTitle.trim(),
        type: 'Note',
        content: formattedContent,
        tags: resolvedTags,
        createdAt: now,
        updatedAt: now
      });

      await db.noteDestinations.put({
        id: newId,
        title: newNoteTitle.trim(),
        format,
        lastUsedAt: now
      });

      onSuccess(`New vault note "${newNoteTitle.trim()}" created with [[${documentTitle}]] bidirectional wikilink!`);
      onClose();
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(formattedContent);
    onSuccess('Copied formatted extraction to clipboard!');
  };

  const handleDownloadStandaloneFile = () => {
    const blob = new Blob([formattedContent], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_')}_p${pageNumber}_${extractionType}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onSuccess(`Downloaded ${format.toUpperCase()} extraction file`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-[#141622] border-b border-[#252a3b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Quote size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Extract to Knowledge Vault</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                  <Link2 size={10} />
                  <span>[[${documentTitle.slice(0, 20)}]]</span>
                </span>
              </h3>
              <p className="text-gray-400 text-xs">
                Page {pageNumber} • Automatic bidirectional wikilink & source metadata
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#202538]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* Extraction Type Selector (Authentic Notion OS Taxonomy) */}
          <div>
            <label className="text-gray-300 font-semibold block mb-1.5">Extraction Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'Quote', icon: Quote, desc: 'Verbatim passage' },
                { type: 'Highlight', icon: Highlighter, desc: 'Key sentence' },
                { type: 'Key Takeaway', icon: Lightbulb, desc: 'Core insight' },
                { type: 'Reading Note', icon: BookOpen, desc: 'Study synthesis' }
              ].map(({ type, icon: Icon, desc }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setExtractionType(type as any);
                    setNewNoteTitle(`${type} from [[${documentTitle}]] (p. ${pageNumber})`);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    extractionType === type
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-[#141622] border-[#272b3b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Icon size={13} className={extractionType === type ? 'text-indigo-400' : 'text-gray-500'} />
                    <span>{type}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Author & Source Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Author / Source Creator</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name (e.g. Swami Vivekananda, Shankara)"
                className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Source Wikilink</label>
              <div className="bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-indigo-300 font-mono text-[11px] flex items-center gap-1.5">
                <Link2 size={12} className="text-indigo-400 shrink-0" />
                <span className="truncate">[[${documentTitle}]]</span>
              </div>
            </div>
          </div>

          {/* Captured Passage Text */}
          <div>
            <label className="text-gray-300 font-semibold block mb-1">Extracted Text (Page {pageNumber})</label>
            <textarea
              rows={4}
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
              placeholder="Captured passage..."
              className="w-full bg-[#141622] border border-[#272b3b] rounded-xl p-3 text-white font-serif placeholder-gray-500 focus:outline-none focus:border-indigo-500 leading-relaxed text-xs"
            />
          </div>

          {/* User Reflection / Synthesis (Optional) */}
          <div>
            <label className="text-gray-300 font-semibold block mb-1 flex items-center justify-between">
              <span>Personal Synthesis / Reflection (Optional)</span>
              <span className="text-[10px] text-gray-500">Adds your perspective to vault</span>
            </label>
            <textarea
              rows={2}
              value={userReflection}
              onChange={(e) => setUserReflection(e.target.value)}
              placeholder="Why does this matter? How does it connect to your current sadhana, project, or thesis?"
              className="w-full bg-[#141622] border border-[#272b3b] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Destination Selector */}
          <div className="space-y-3 pt-2 border-t border-[#252a3b]">
            <div className="flex items-center justify-between">
              <label className="text-gray-300 font-semibold">Knowledge Vault Destination</label>
              <div className="flex bg-[#141622] p-0.5 rounded-lg border border-[#272b3b]">
                <button
                  type="button"
                  onClick={() => setDestinationMode('new')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    destinationMode === 'new' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create New Note
                </button>
                <button
                  type="button"
                  onClick={() => setDestinationMode('existing')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    destinationMode === 'existing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Append to Existing
                </button>
              </div>
            </div>

            {destinationMode === 'new' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="New note title..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-1.5 text-gray-300 text-[11px] placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose an Existing Note in Knowledge Vault --</option>
                  {existingNotes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.type || 'Note'})
                    </option>
                  ))}
                </select>

                {recentDestinations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-500">Recent:</span>
                    {recentDestinations.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedNoteId(r.id)}
                        className="text-[10px] bg-[#141622] border border-[#272b3b] hover:border-indigo-500/50 text-gray-300 hover:text-white px-2 py-0.5 rounded-lg transition-colors truncate max-w-[150px]"
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <span>{showPreview ? 'Hide Markdown Preview' : 'Show Markdown & Frontmatter Preview'}</span>
            </button>
            {showPreview && (
              <pre className="mt-2 bg-[#10121a] p-3 rounded-xl border border-[#272b3b] text-gray-300 font-mono text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {formattedContent}
              </pre>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#141622] border-t border-[#252a3b] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="p-2 text-gray-400 hover:text-white bg-[#181a24] hover:bg-[#202538] rounded-xl border border-[#272b3b] text-xs flex items-center gap-1"
              title="Copy to Clipboard"
            >
              <Copy size={14} />
              <span className="hidden sm:inline">Copy</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadStandaloneFile}
              className="p-2 text-gray-400 hover:text-white bg-[#181a24] hover:bg-[#202538] rounded-xl border border-[#272b3b] text-xs flex items-center gap-1"
              title="Download File"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-[#202538] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAppendToNote}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{destinationMode === 'new' ? 'Save to Vault' : 'Append to Note'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
