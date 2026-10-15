import React, { useState, useEffect } from 'react';
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
  Trash2, 
  Edit3, 
  Download,
  Lock,
  Unlock,
  Shield,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  isVaultEncrypted, 
  encryptVaultText, 
  decryptVaultText, 
  isSessionUnlocked, 
  setSessionPassphrase, 
  getSessionPassphrase 
} from '../services/vaultCrypto';

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
  const [encryptOnSave, setEncryptOnSave] = useState(false);

  // Vault Encryption state
  const [vaultUnlocked, setVaultUnlocked] = useState(isSessionUnlocked());
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [decryptedCache, setDecryptedCache] = useState<{ [id: string]: string }>({});
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const notes = useLiveQuery(() => db.knowledge.toArray(), []) || [];

  // When vault unlocks, decrypt active note if encrypted
  useEffect(() => {
    if (activeNote && isVaultEncrypted(activeNote.content) && vaultUnlocked) {
      decryptVaultText(activeNote.content).then(plain => {
        setDecryptedCache(prev => ({ ...prev, [activeNote.id]: plain }));
      }).catch(err => {
        setVaultError(err.message);
      });
    }
  }, [activeNote, vaultUnlocked]);

  const filteredNotes = notes.filter(note => {
    if (selectedType !== 'All' && note.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchTags = note.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchTags;
    }
    return true;
  });

  const handleStartNewNote = () => {
    setActiveNote(null);
    setEditTitle('');
    setEditContent('');
    setEditType('Note');
    setEditTags('');
    setEncryptOnSave(vaultUnlocked);
    setIsEditing(true);
  };

  const handleSelectNote = async (note: KnowledgeItem) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditType(note.type);
    setEditTags(note.tags.join(', '));
    setIsEditing(false);

    if (isVaultEncrypted(note.content)) {
      setEncryptOnSave(true);
      if (vaultUnlocked) {
        try {
          const plain = await decryptVaultText(note.content);
          setDecryptedCache(prev => ({ ...prev, [note.id]: plain }));
          setEditContent(plain);
        } catch (err: any) {
          setVaultError(err.message);
        }
      } else {
        setEditContent(note.content);
      }
    } else {
      setEncryptOnSave(false);
      setEditContent(note.content);
    }
  };

  const handleSaveNote = async () => {
    if (!editTitle.trim()) return;
    const now = Date.now();
    const tagArray = editTags.split(',').map(t => t.trim()).filter(Boolean);

    let finalContent = editContent;
    if (encryptOnSave) {
      if (!vaultUnlocked) {
        setShowPassphraseModal(true);
        return;
      }
      finalContent = await encryptVaultText(editContent);
    }

    if (activeNote) {
      await db.knowledge.update(activeNote.id, {
        title: editTitle.trim(),
        content: finalContent,
        type: editType,
        tags: tagArray,
        updatedAt: now
      });
      setActiveNote({
        ...activeNote,
        title: editTitle.trim(),
        content: finalContent,
        type: editType,
        tags: tagArray,
        updatedAt: now
      });
      if (!encryptOnSave) {
        setDecryptedCache(prev => {
          const copy = { ...prev };
          delete copy[activeNote.id];
          return copy;
        });
      }
    } else {
      const newId = `know-${now}`;
      const newRecord: KnowledgeItem = {
        id: newId,
        title: editTitle.trim(),
        content: finalContent,
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
    const contentToExport = decryptedCache[note.id] || note.content;
    const blob = new Blob([contentToExport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseInput.trim()) return;

    setSessionPassphrase(passphraseInput.trim());
    setVaultUnlocked(true);
    setShowPassphraseModal(false);
    setVaultError(null);
    setPassphraseInput('');
  };

  const handleLockVault = () => {
    setSessionPassphrase(null);
    setVaultUnlocked(false);
    setDecryptedCache({});
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
            Atomic concepts, synthesis notes, and research sources with client-side AES-GCM-256 encryption.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Vault Lock/Unlock Status */}
          <button
            onClick={() => vaultUnlocked ? handleLockVault() : setShowPassphraseModal(true)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all border ${
              vaultUnlocked 
                ? 'bg-emerald-600/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
                : 'bg-amber-600/10 text-amber-300 border-amber-500/30 hover:bg-amber-600/20'
            }`}
          >
            {vaultUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{vaultUnlocked ? 'Vault Unlocked' : 'Unlock Vault'}</span>
          </button>

          <button
            onClick={handleStartNewNote}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Note</span>
          </button>
        </div>
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
          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-8 text-center text-gray-500 text-xs">
                No notes found matching current filters.
              </div>
            ) : (
              filteredNotes.map(note => {
                const isEnc = isVaultEncrypted(note.content);
                const isSelected = activeNote?.id === note.id;

                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#1f2436] border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : 'bg-[#181a24] hover:bg-[#1a1d29] border-[#272b3b]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{note.title}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {isEnc && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Lock size={10} />
                            <span>AES-256</span>
                          </span>
                        )}
                        <span className="text-[10px] bg-[#141622] text-gray-400 px-2 py-0.5 rounded-full border border-[#262b3d]">
                          {note.type}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {isEnc ? (
                        <span className="font-mono text-gray-500 italic">?? Encrypted ciphertext payload</span>
                      ) : (
                        note.content.replace(/#+\s/g, '').slice(0, 120)
                      )}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map(tag => (
                          <span key={tag} className="text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono">{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Editor / Reader Pane (7 cols) */}
        <div className="lg:col-span-7 bg-[#181a24] border border-[#272b3b] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          {isEditing ? (
            /* Editing / Creating Mode */
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#272b3b] pb-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note Title / Concept Name..."
                  className="bg-transparent text-lg font-bold text-white focus:outline-none w-full"
                />
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="bg-[#141622] border border-[#2d344d] text-xs font-semibold rounded-lg px-2.5 py-1 text-gray-200"
                >
                  <option value="Concept">Concept</option>
                  <option value="Note">Note</option>
                  <option value="Source">Source</option>
                  <option value="Quote">Quote</option>
                  <option value="Question">Question</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs">
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="Tags separated by commas (e.g. Vedanta, Metaphysics)..."
                  className="bg-[#141622] border border-[#282d3e] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 w-2/3"
                />

                {/* Encrypt on save toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={encryptOnSave}
                    onChange={(e) => setEncryptOnSave(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span className="flex items-center gap-1 text-[11px]">
                    <Shield size={12} className={encryptOnSave ? 'text-indigo-400' : 'text-gray-500'} />
                    <span>AES-256 Encrypt</span>
                  </span>
                </label>
              </div>

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write markdown note, reflection, synthesis, or citations..."
                className="w-full flex-1 min-h-[360px] bg-[#141622] border border-[#272b3d] rounded-xl p-4 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  Save Note
                </button>
              </div>
            </div>
          ) : activeNote ? (
            /* Reading / Viewing Mode */
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-[#272b3b] pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{activeNote.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-[#141622] text-indigo-300 border border-[#272b3d] px-2 py-0.5 rounded-full">
                        {activeNote.type}
                      </span>
                      {isVaultEncrypted(activeNote.content) && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={11} />
                          <span>AES-GCM-256 Protected</span>
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 font-mono">
                        Updated {new Date(activeNote.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportMarkdown(activeNote)}
                      title="Export as Markdown"
                      className="p-2 rounded-xl bg-[#141622] hover:bg-[#202538] text-gray-400 hover:text-white border border-[#272b3d] transition-colors"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      title="Edit Note"
                      className="p-2 rounded-xl bg-[#141622] hover:bg-[#202538] text-gray-400 hover:text-white border border-[#272b3d] transition-colors"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      title="Delete Note"
                      className="p-2 rounded-xl bg-[#141622] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-[#272b3d] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Content View */}
                {isVaultEncrypted(activeNote.content) && !vaultUnlocked ? (
                  /* Locked Vault Prompt */
                  <div className="bg-[#12141d] border border-[#2d344d] rounded-2xl p-8 text-center space-y-4 my-6">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">This Note is Encrypted</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        Zero-knowledge AES-GCM-256 encryption. Unlock the vault with your master passphrase to read this note.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPassphraseModal(true)}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-600/30 inline-flex items-center gap-1.5"
                    >
                      <KeyRound size={14} />
                      <span>Unlock with Passphrase</span>
                    </button>
                  </div>
                ) : (
                  /* Decrypted / Plaintext content */
                  <div className="bg-[#141622] border border-[#262b3d] rounded-xl p-5 text-xs text-gray-200 leading-relaxed font-mono whitespace-pre-wrap overflow-y-auto max-h-[480px]">
                    {decryptedCache[activeNote.id] || activeNote.content}
                  </div>
                )}
              </div>

              {/* Tags Footer */}
              <div className="pt-4 border-t border-[#272b3b] flex items-center gap-1.5 flex-wrap">
                <Tag size={13} className="text-gray-500 mr-1" />
                {activeNote.tags.map(tag => (
                  <span key={tag} className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-3">
              <BookOpen size={36} className="text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-400">No Note Selected</p>
                <p className="text-[11px] text-gray-500">Select a note from the left to view, decrypt, or edit.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Master Passphrase Unlock Modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUnlockSubmit} className="bg-[#181a24] border border-[#2c334d] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2c334d] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="text-indigo-400" size={18} />
                <span>Unlock AES-GCM-256 Vault</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPassphraseModal(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ? Close
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Enter your master passphrase. The key will be derived in-memory with PBKDF2 (100,000 rounds) and never stored on disk.
            </p>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                placeholder="Enter master vault passphrase..."
                autoFocus
                className="w-full bg-[#12141e] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {vaultError && (
              <p className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {vaultError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPassphraseModal(false)}
                className="text-xs text-gray-400 hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
              >
                Unlock Vault
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
