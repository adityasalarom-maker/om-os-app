import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type KnowledgeItem } from '../db';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Tag, 
  Bookmark, 
  Quote, 
  HelpCircle, 
  FileText, 
  Share2, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Download
} from 'lucide-react';

export const KnowledgeVault: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNote, setActiveNote] = useState<KnowledgeItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<KnowledgeItem['type']>('Note');
  const [editTags, setEditTags] = useState('');

  const notes = useLiveQuery(() => db.knowledge.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];

  const filteredNotes = notes.filter(note => {
    if (selectedType !== 'All' && note.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchContent = note.content.toLowerCase().includes(q);
      const matchTags = note.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchTags;
    }
    return true;
  });

  const handleStartNewNote = () => {
    setActiveNote(null);
    setEditTitle('');
    setEditContent('');
    setEditType('Note');
    setEditTags('');
    setIsEditing(true);
  };

  const handleSelectNote = (note: KnowledgeItem) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditType(note.type);
    setEditTags(note.tags.join(', '));
    setIsEditing(false);
  };

  const handleSaveNote = async () => {
    if (!editTitle.trim()) return;
    const now = Date.now();
    const tagArray = editTags.split(',').map(t => t.trim()).filter(Boolean);

    if (activeNote) {
      await db.knowledge.update(activeNote.id, {
        title: editTitle.trim(),
        content: editContent,
        type: editType,
        tags: tagArray,
        updatedAt: now
      });
      setActiveNote({
        ...activeNote,
        title: editTitle.trim(),
        content: editContent,
        type: editType,
        tags: tagArray,
        updatedAt: now
      });
    } else {
      const newId = `know-${now}`;
      const newRecord: KnowledgeItem = {
        id: newId,
        title: editTitle.trim(),
        content: editContent,
        type: editType,
        tags: tagArray,
        createdAt: now,
        updatedAt: now
      };
      await db.knowledge.add(newRecord);
      setActiveNote(newRecord);
    }
    setIsEditing(false);
  };

  const handleDeleteNote = async (id: string) => {
    await db.knowledge.delete(id);
    if (activeNote?.id === id) {
      setActiveNote(null);
      setIsEditing(false);
    }
  };

  const handleExportMarkdown = (note: KnowledgeItem) => {
    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={22} />
            <span>Knowledge Vault & Synthesis Hub</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Atomic concepts, synthesis notes, and research sources with full-text search and export.
          </p>
        </div>
        <button
          onClick={handleStartNewNote}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Note / Concept</span>
        </button>
      </div>

      {/* Main Dual-Pane Layout: Left List, Right Editor/Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left List Pane (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords, concepts, or tags..."
                className="w-full bg-[#141622] border border-[#272b3d] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['All', 'Concept', 'Note', 'Source', 'Quote', 'Question'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#141622] text-gray-400 hover:text-white border border-[#282d3e]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Note Cards List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
            {filteredNotes.length === 0 ? (
              <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-8 text-center text-gray-500 text-xs">
                No matching notes found. Click "New Note" to create one.
              </div>
            ) : (
              filteredNotes.map(note => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e2336] border-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'bg-[#181a24] border-[#272b3b] hover:bg-[#1d2130] hover:border-[#353c52]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {note.type}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                      {note.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {note.content.replace(/^[#*-\s]+/gm, '')}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                        {note.tags.map(t => (
                          <span key={t} className="text-[9px] bg-[#141622] text-gray-400 px-1.5 py-0.5 rounded border border-[#282d3e]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Reader / Editor Pane (7 cols) */}
        <div className="lg:col-span-7 bg-[#181a24] border border-[#272b3b] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          {isEditing ? (
            /* Editing / Creating Mode */
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#272b3b]">
                <h3 className="text-sm font-bold text-white">
                  {activeNote ? 'Edit Knowledge Record' : 'Create New Knowledge Record'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md"
                  >
                    Save Note
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Record Type</label>
                  <select
                    value={editType}
                    onChange={(e: any) => setEditType(e.target.value)}
                    className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Concept">Concept (Atomic Idea)</option>
                    <option value="Note">Note (Synthesis / Summary)</option>
                    <option value="Source">Source (Book / Article / Research)</option>
                    <option value="Quote">Quote</option>
                    <option value="Bookmark">Bookmark</option>
                    <option value="Question">Open Question</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Vedanta, Philosophy, Health"
                    className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Advaita Metaphysics and Maya"
                  className="w-full bg-[#141622] border border-[#272b3d] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-xs text-gray-400 block mb-1">Content (Markdown Supported)</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write notes, headings (#), bullet points (-), or code blocks..."
                  rows={14}
                  className="w-full flex-1 bg-[#141622] border border-[#272b3d] rounded-xl p-3 text-xs text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          ) : activeNote ? (
            /* Reading Mode */
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#272b3b]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {activeNote.type}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Last updated {new Date(activeNote.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportMarkdown(activeNote)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252a3d] transition-colors"
                    title="Export as Markdown File"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-indigo-400 rounded-lg hover:bg-[#252a3d] transition-colors"
                    title="Edit Note"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-[#252a3d] transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">
                {activeNote.title}
              </h2>

              {activeNote.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeNote.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-[#141622] text-indigo-300 px-2 py-0.5 rounded-full border border-[#2b3147]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Rendered content */}
              <div className="flex-1 bg-[#141622] border border-[#252a3b] rounded-xl p-5 overflow-y-auto text-xs text-gray-300 space-y-3 leading-relaxed whitespace-pre-wrap">
                {activeNote.content}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <BookOpen size={48} className="text-gray-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-300">No Note Selected</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Select a knowledge note from the list on the left, or create a new atomic concept to expand your second brain.
              </p>
              <button
                onClick={handleStartNewNote}
                className="mt-4 bg-[#212638] hover:bg-indigo-600 border border-[#30374e] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Create First Note
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
