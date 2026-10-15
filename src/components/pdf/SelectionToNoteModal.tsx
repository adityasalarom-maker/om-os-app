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
  BookOpen 
} from 'lucide-react';

interface SelectionToNoteModalProps {
  selectedText: string;
  documentTitle: string;
  pageNumber: number;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const SelectionToNoteModal: React.FC<SelectionToNoteModalProps> = ({
  selectedText,
  documentTitle,
  pageNumber,
  onClose,
  onSuccess
}) => {
  const [format, setFormat] = useState<'md' | 'txt'>('md');
  const [destinationMode, setDestinationMode] = useState<'existing' | 'new'>('existing');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [newNoteTitle, setNewNoteTitle] = useState<string>(`Notes from ${documentTitle}`);

  const existingNotes = useLiveQuery(() => db.knowledge.toArray(), []) || [];
  const recentDestinations = useLiveQuery(() => db.noteDestinations.orderBy('lastUsedAt').reverse().limit(4).toArray(), []) || [];

  const timestamp = new Date().toLocaleString();

  const formattedQuote = format === 'md'
    ? `\n\n> [!QUOTE] Page ${pageNumber} — ${documentTitle}\n> ${selectedText.replace(/\n/g, '\n> ')}\n\n*Captured on: ${timestamp}*\n---`
    : `\n\n[Quote - Page ${pageNumber} - ${documentTitle}]\n${selectedText}\nCaptured: ${timestamp}\n----------------------`;

  const handleAppendToNote = async () => {
    const now = Date.now();

    if (destinationMode === 'existing') {
      const targetNote = existingNotes.find(n => n.id === selectedNoteId);
      if (!targetNote) {
        alert('Please select a destination note.');
        return;
      }

      await db.knowledge.update(targetNote.id, {
        content: targetNote.content + formattedQuote,
        updatedAt: now
      });

      // Update LRU destination record
      await db.noteDestinations.put({
        id: targetNote.id,
        title: targetNote.title,
        format,
        lastUsedAt: now
      });

      onSuccess(`Passage appended to note "${targetNote.title}"!`);
      onClose();
    } else {
      // Create new note in Knowledge Vault
      if (!newNoteTitle.trim()) return;

      const newId = `know-${now}`;
      await db.knowledge.add({
        id: newId,
        title: newNoteTitle.trim(),
        type: 'Note',
        content: `# ${newNoteTitle.trim()}\n${formattedQuote}`,
        tags: ['PDF-Clipping', documentTitle.slice(0, 20)],
        createdAt: now,
        updatedAt: now
      });

      await db.noteDestinations.put({
        id: newId,
        title: newNoteTitle.trim(),
        format,
        lastUsedAt: now
      });

      onSuccess(`New note "${newNoteTitle.trim()}" created with captured quote!`);
      onClose();
    }
  };

  const handleDownloadStandaloneFile = () => {
    const blob = new Blob([formattedQuote], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_')}_p${pageNumber}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    onSuccess('Downloaded standalone clipping file!');
    onClose();
  };

  const handleCopyClipboard = async () => {
    await navigator.clipboard.writeText(formattedQuote);
    onSuccess('Formatted quote copied to clipboard!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[#181a24] border border-[#2e344d] w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#282d3e]">
          <div className="flex items-center gap-2">
            <Quote className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-white">Capture Passage to Notes</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Selected Text Preview */}
        <div className="bg-[#141622] border border-[#262b3d] rounded-xl p-3 max-h-36 overflow-y-auto">
          <span className="text-[10px] font-mono text-gray-500 block mb-1">
            SOURCE: {documentTitle} (Page {pageNumber})
          </span>
          <p className="text-xs text-gray-200 italic font-serif leading-relaxed">
            "{selectedText}"
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Output Format:</span>
          <div className="flex bg-[#141622] p-1 rounded-lg border border-[#272b3c] text-xs">
            <button
              onClick={() => setFormat('md')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                format === 'md' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => setFormat('txt')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                format === 'txt' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Plain Text (.txt)
            </button>
          </div>
        </div>

        {/* Destination Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-200">
              <input
                type="radio"
                name="dest"
                checked={destinationMode === 'existing'}
                onChange={() => setDestinationMode('existing')}
                className="accent-indigo-600"
              />
              <span>Append to Existing Note</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-200">
              <input
                type="radio"
                name="dest"
                checked={destinationMode === 'new'}
                onChange={() => setDestinationMode('new')}
                className="accent-indigo-600"
              />
              <span>Create New Note File</span>
            </label>
          </div>

          {destinationMode === 'existing' ? (
            <div>
              <select
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose destination note --</option>
                {existingNotes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.type})
                  </option>
                ))}
              </select>

              {recentDestinations.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-gray-500">Recent:</span>
                  {recentDestinations.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDestinationMode('existing');
                        setSelectedNoteId(d.id);
                      }}
                      className="text-[10px] bg-[#141622] text-indigo-300 hover:text-white px-2 py-0.5 rounded border border-[#272b3c]"
                    >
                      {d.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Enter new note title..."
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#282d3e] gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyClipboard}
              className="p-2 text-xs text-gray-300 hover:text-white bg-[#1f2436] hover:bg-[#282e46] rounded-xl border border-[#2d344d] flex items-center gap-1.5"
              title="Copy to Clipboard"
            >
              <Copy size={14} />
              <span className="hidden sm:inline">Copy</span>
            </button>
            <button
              onClick={handleDownloadStandaloneFile}
              className="p-2 text-xs text-gray-300 hover:text-white bg-[#1f2436] hover:bg-[#282e46] rounded-xl border border-[#2d344d] flex items-center gap-1.5"
              title="Download Standalone File"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAppendToNote}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>{destinationMode === 'existing' ? 'Append to Note' : 'Create & Save'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
