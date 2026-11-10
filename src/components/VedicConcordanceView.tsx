import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type VedicVerseRecord, type PhilosophicalVadaRecord } from '../db';
import {
  BookOpen,
  Scroll,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Bookmark,
  Layers,
  HelpCircle,
  ArrowRight,
  GitCompare,
  Plus,
  BookMarked,
  Eye,
  Flame,
  Award
} from 'lucide-react';

export const VedicConcordanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verses' | 'vadas' | 'adhyasa' | 'custom'>('verses');
  const [canonFilter, setCanonFilter] = useState<string>('All');
  const [vadaFilter, setVadaFilter] = useState<string>('All');
  const [onlyMahavakyas, setOnlyMahavakyas] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVadaComparison, setSelectedVadaComparison] = useState<string>('vada-vivarta');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [vaultSavedId, setVaultSavedId] = useState<string | null>(null);

  // Custom verse form state
  const [customCanon, setCustomCanon] = useState<VedicVerseRecord['canon']>('Upanishad');
  const [customSource, setCustomSource] = useState('Katha Upanishad');
  const [customChapterVerse, setCustomChapterVerse] = useState('1.2.20');
  const [customDevanagari, setCustomDevanagari] = useState('');
  const [customIast, setCustomIast] = useState('');
  const [customEnglish, setCustomEnglish] = useState('');
  const [customBhashya, setCustomBhashya] = useState('');
  const [customVada, setCustomVada] = useState<VedicVerseRecord['philosophicalVada']>('Vivarta-Vada');
  const [customMahavakya, setCustomMahavakya] = useState(false);
  const [customTags, setCustomTags] = useState('Atman, Viveka, Self');
  const [formSavedNotice, setFormSavedNotice] = useState(false);

  // Live queries
  const verses = useLiveQuery(() => db.vedicVerses.toArray(), []) || [];
  const vadas = useLiveQuery(() => db.philosophicalVadas.toArray(), []) || [];

  // Filtered verses
  const filteredVerses = useMemo(() => {
    return verses.filter(v => {
      const matchCanon = canonFilter === 'All' || v.canon === canonFilter;
      const matchVada = vadaFilter === 'All' || v.philosophicalVada === vadaFilter;
      const matchMahavakya = !onlyMahavakyas || v.mahavakya;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        v.sourceText.toLowerCase().includes(q) ||
        v.chapterVerse.toLowerCase().includes(q) ||
        v.sanskritDevanagari.includes(q) ||
        v.transliterationIast.toLowerCase().includes(q) ||
        v.englishTranslation.toLowerCase().includes(q) ||
        v.shankaraBhashyaSummary.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q));
      return matchCanon && matchVada && matchMahavakya && matchSearch;
    });
  }, [verses, canonFilter, vadaFilter, onlyMahavakyas, searchQuery]);

  // Handle Save to Knowledge Vault
  const handleSaveToVault = async (verse: VedicVerseRecord) => {
    const vaultItem = {
      id: `vault-vedic-${Date.now()}`,
      title: `${verse.sourceText} (${verse.chapterVerse})`,
      type: 'Concept' as const,
      category: 'Vedic Philosophy & Prasthanatrayi',
      summary: verse.englishTranslation,
      content: `### Sanskrit Devanāgarī\n\n> ${verse.sanskritDevanagari}\n\n**IAST:** *${verse.transliterationIast}*\n\n### English Translation\n\n${verse.englishTranslation}\n\n### Śaṅkara Bhāṣya Synthesis\n\n${verse.shankaraBhashyaSummary}\n\n**Philosophical Vāda:** ${verse.philosophicalVada}\n**Canon:** ${verse.canon}`,
      tags: [...verse.tags, 'Vedic Engine', verse.philosophicalVada, verse.canon],
      confidenceScore: 10,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.knowledge.add(vaultItem);
    setVaultSavedId(verse.id);
    setTimeout(() => setVaultSavedId(null), 3000);
  };

  // Handle Copy to Clipboard
  const handleCopyVerse = (verse: VedicVerseRecord) => {
    const text = `${verse.sourceText} (${verse.chapterVerse})\n${verse.sanskritDevanagari}\n${verse.transliterationIast}\n\n"${verse.englishTranslation}"\n\nShankara Bhashya:\n${verse.shankaraBhashyaSummary}`;
    navigator.clipboard.writeText(text);
    setCopiedId(verse.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Custom Verse Submit
  const handleAddCustomVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDevanagari.trim() || !customEnglish.trim()) return;

    const newVerse: VedicVerseRecord = {
      id: `verse-custom-${Date.now()}`,
      canon: customCanon,
      sourceText: customSource.trim(),
      chapterVerse: customChapterVerse.trim(),
      sanskritDevanagari: customDevanagari.trim(),
      transliterationIast: customIast.trim(),
      wordBreakdown: [],
      englishTranslation: customEnglish.trim(),
      shankaraBhashyaSummary: customBhashya.trim(),
      philosophicalVada: customVada,
      mahavakya: customMahavakya,
      crossReferences: [],
      tags: customTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.vedicVerses.add(newVerse);
    setFormSavedNotice(true);
    setCustomDevanagari('');
    setCustomIast('');
    setCustomEnglish('');
    setCustomBhashya('');
    setTimeout(() => {
      setFormSavedNotice(false);
      setActiveTab('verses');
    }, 1500);
  };

  return (
    <div data-ag-id="VedicConcordance_Root_Workspace" className="space-y-6 text-gray-100 font-sans">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#171a29] via-[#1a1c2d] to-[#141622] border border-[#292d40] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-amber-600/20">
              ॐ
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Vedic & Philosophical Cross-Reference Engine</span>
              <span className="text-amber-400 font-serif text-sm">शङ्करभाष्य</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-700/50">
              Phase 16 Engine
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Prasthānatrayī canonical concordances (Upaniṣads, Gītā, Brahma Sūtras), Śaṅkara Bhāṣya interlinear Sanskrit, and the 7-Vāda causation simulator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('custom')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Custom Verse</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#282c3e] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('verses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'verses'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
          }`}
        >
          <BookOpen size={14} className={activeTab === 'verses' ? 'text-amber-400' : ''} />
          <span>Prasthānatrayī Verses ({verses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vadas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'vadas'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
          }`}
        >
          <GitCompare size={14} className={activeTab === 'vadas' ? 'text-indigo-400' : ''} />
          <span>7-Vāda Causation Simulator ({vadas.length} Schools)</span>
        </button>

        <button
          onClick={() => setActiveTab('adhyasa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'adhyasa'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
          }`}
        >
          <Scroll size={14} className={activeTab === 'adhyasa' ? 'text-purple-400' : ''} />
          <span>Adhyāsa Bhāṣya & Mahāvākyas</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
          }`}
        >
          <Plus size={14} className={activeTab === 'custom' ? 'text-emerald-400' : ''} />
          <span>Verse Ingestion Portal</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRASTHANATRAYI VERSES & INTERLINEAR SANSKRIT                       */}
      {/* ========================================================================= */}
      {activeTab === 'verses' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search Sanskrit, IAST, English, tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#171a26] border border-[#292d3f] text-gray-200 placeholder-gray-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Canon selector */}
              <select
                value={canonFilter}
                onChange={e => setCanonFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#171a26] border border-[#292d3f] text-gray-200 outline-none cursor-pointer"
              >
                <option value="All">All Canons</option>
                <option value="Upanishad">Upanishads (Śruti)</option>
                <option value="Bhagavad Gita">Bhagavad Gītā (Smṛti)</option>
                <option value="Brahma Sutras">Brahma Sūtras (Nyāya)</option>
                <option value="Shankara Bhashya">Śaṅkara Bhāṣya</option>
                <option value="Nath Agama">Nātha Āgama</option>
              </select>

              {/* Vada selector */}
              <select
                value={vadaFilter}
                onChange={e => setVadaFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#171a26] border border-[#292d3f] text-gray-200 outline-none cursor-pointer"
              >
                <option value="All">All Causation Vādas</option>
                <option value="Vivarta-Vada">Vivarta-Vāda (Advaita)</option>
                <option value="Cid-Vilasa-Vada">Cid-Vilāsa-Vāda (Nath)</option>
                <option value="Abhasa-Vada">Ābhāsa-Vāda (Kashmir Shaivism)</option>
                <option value="Parinama-Vada">Pariṇāma-Vāda</option>
                <option value="Satkaryavada">Satkāryavāda</option>
              </select>

              {/* Mahavakya Toggle */}
              <button
                onClick={() => setOnlyMahavakyas(!onlyMahavakyas)}
                className={`px-3 py-2 rounded-xl border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  onlyMahavakyas
                    ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-[#171a26] border-[#292d3f] text-gray-300 hover:text-white'
                }`}
              >
                <Sparkles size={13} className={onlyMahavakyas ? 'text-black' : 'text-amber-400'} />
                <span>Mahāvākyas Only</span>
              </button>
            </div>
          </div>

          {/* Verses List */}
          <div className="space-y-4">
            {filteredVerses.map(verse => (
              <div
                key={verse.id}
                className="p-6 rounded-2xl bg-[#161824] border border-[#262a3b] hover:border-[#3a3f5a] shadow-lg transition-all space-y-4"
              >
                {/* Header row: Source text + Chapter + Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#25283a] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{verse.sourceText}</span>
                    <span className="text-gray-500">•</span>
                    <span className="font-mono text-xs text-amber-300">{verse.chapterVerse}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#202538] text-gray-300 border border-[#2b314a]">
                      {verse.canon}
                    </span>
                    {verse.mahavakya && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        ⭐ Mahāvākya
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800">
                      {verse.philosophicalVada}
                    </span>
                    <button
                      onClick={() => handleCopyVerse(verse)}
                      className="p-1.5 rounded-lg bg-[#1e2233] hover:bg-[#252b40] text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy verse and commentary"
                    >
                      {copiedId === verse.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleSaveToVault(verse)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-[11px] font-medium text-indigo-200 transition-colors cursor-pointer"
                      title="Export note to Dexie Knowledge Vault"
                    >
                      <Bookmark size={12} className={vaultSavedId === verse.id ? 'text-emerald-400' : 'text-indigo-400'} />
                      <span>{vaultSavedId === verse.id ? 'Saved!' : 'Save to Vault'}</span>
                    </button>
                  </div>
                </div>

                {/* Sanskrit Devanagari Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1f30] to-[#181a28] border border-[#2c3148] space-y-1">
                  <div className="text-lg sm:text-xl font-serif text-amber-200 tracking-wide leading-relaxed font-semibold">
                    {verse.sanskritDevanagari}
                  </div>
                  <div className="text-xs font-mono text-gray-400 italic pt-1">
                    {verse.transliterationIast}
                  </div>
                </div>

                {/* Word-for-Word Breakdown (Padachheda) */}
                {verse.wordBreakdown && verse.wordBreakdown.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                      पदच्छेद (Word-for-Word Grammatical Breakdown)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {verse.wordBreakdown.map((wb, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-[#1a1d2c] border border-[#282d42] text-[11px]"
                        >
                          <span className="font-semibold text-amber-300 font-serif mr-1">{wb.word}:</span>
                          <span className="text-gray-300">{wb.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* English Translation */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                    English Canonical Translation
                  </span>
                  <p className="text-xs leading-relaxed text-gray-200 font-medium pl-2 border-l-2 border-amber-500/50">
                    "{verse.englishTranslation}"
                  </p>
                </div>

                {/* Adi Shankaracharya Bhashya Synthesis */}
                {verse.shankaraBhashyaSummary && (
                  <div className="p-3.5 rounded-xl bg-[#1b1e2e]/70 border border-[#2e344e] space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                      <Scroll size={13} />
                      <span>Śrīmad Śāṅkara-Bhāṣya Commentary Synthesis</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed pl-1">
                      {verse.shankaraBhashyaSummary}
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {verse.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1c1f2e] text-gray-400 border border-[#282c40]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 7-VADA CAUSATION SIMULATOR & COMPARATIVE MATRIX                   */}
      {/* ========================================================================= */}
      {activeTab === 'vadas' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#181a27] border border-[#272b3c] text-xs text-gray-300">
            <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <GitCompare size={15} className="text-indigo-400" />
              <span>Kārya-Kāraṇa Siddhānta (Indian Causation Theories)</span>
            </h3>
            <p>
              Does the effect pre-exist in the cause (<strong className="text-amber-300">Satkāryavāda</strong>) or is it a brand-new creation (<strong className="text-rose-300">Asatkāryavāda</strong>)? 
              How does Advaita's apparent transformation (<strong className="text-purple-300">Vivarta</strong>) contrast with Gorakhnath's playful consciousness (<strong className="text-emerald-300">Cid-Vilāsa</strong>) and Kashmir Shaivism's mirror reflections (<strong className="text-cyan-300">Ābhāsa</strong>)?
            </p>
          </div>

          {/* Interactive School Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {vadas.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVadaComparison(v.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedVadaComparison === v.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-[#161824] text-gray-400 hover:text-white border border-[#272b3b]'
                }`}
              >
                {v.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Detailed Selected Vada Deep Dive Card */}
          {(() => {
            const currentVada = vadas.find(v => v.id === selectedVadaComparison) || vadas[0];
            if (!currentVada) return null;
            return (
              <div className="p-6 rounded-2xl bg-[#161824] border border-[#2c3148] shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#25283a] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{currentVada.name}</h2>
                    <span className="text-xs text-indigo-400 font-medium">School: {currentVada.school} • Proponent: {currentVada.proponent}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                    Status of World: {currentVada.worldStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#1b1e2e] border border-[#2b3046] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                      Canonical Analogy (Dṛṣṭānta)
                    </span>
                    <p className="text-gray-200 leading-relaxed font-medium">
                      {currentVada.coreAnalogy}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1b1e2e] border border-[#2b3046] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                      Cause-and-Effect Relationship (Kārya-Kāraṇa)
                    </span>
                    <p className="text-gray-200 leading-relaxed">
                      {currentVada.karyaKaranaRelation}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#181a28] border border-[#282d42] space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
                    Philosophical Mechanics & Critique
                  </span>
                  <p className="text-gray-300 leading-relaxed">
                    {currentVada.detailedCritique}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-gray-400 font-medium">Key Canonical Texts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentVada.keyScriptures.map((ks, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1f2335] text-indigo-300 border border-[#2d334c]">
                        {ks}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Master 7-Vāda Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#272b3c] bg-[#161824]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1b1e2e] text-gray-400 border-b border-[#272b3c] font-semibold">
                <tr>
                  <th className="p-3">Theory (Vāda)</th>
                  <th className="p-3">School & Master</th>
                  <th className="p-3">World Reality</th>
                  <th className="p-3">Core Metaphor</th>
                  <th className="p-3">Cause-Effect Mechanic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232738]">
                {vadas.map(v => (
                  <tr key={v.id} className="hover:bg-[#1c2030] transition-colors">
                    <td className="p-3 font-bold text-white whitespace-nowrap">{v.name.split(' ')[0]}</td>
                    <td className="p-3 text-indigo-300">{v.proponent}</td>
                    <td className="p-3 font-mono text-[11px] text-amber-300">{v.worldStatus}</td>
                    <td className="p-3 text-gray-300 italic">{v.coreAnalogy}</td>
                    <td className="p-3 text-gray-400">{v.karyaKaranaRelation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHANKARA ADHYASA BHASHYA & 4 MAHAVAKYAS                           */}
      {/* ========================================================================= */}
      {activeTab === 'adhyasa' && (
        <div className="space-y-6">
          {/* Adhyasa Bhashya Foundational Card */}
          <div className="p-6 rounded-2xl bg-[#161824] border border-[#2b3046] shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#25283a] pb-3">
              <Scroll className="text-amber-400" size={18} />
              <h2 className="text-base font-bold text-white">The Adhyāsa Bhāṣya (Superimposition Preamble)</h2>
              <span className="text-xs text-gray-400">• Opening of Brahma Sūtra Bhāṣya</span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Before commenting on the aphorisms of Bādarāyaṇa, Adi Śaṅkara pens the celebrated <strong className="text-white">Adhyāsa Bhāṣya</strong>. 
              He defines human bondage not as an ontological defect of the soul, but as an <strong className="text-amber-300">epistemological error of superimposition</strong>.
            </p>

            <div className="p-4 rounded-xl bg-[#1b1e2e] border border-[#2d3248] space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                The Subject-Object Polarity (Viṣaya vs Viṣayin)
              </span>
              <p className="text-xs text-gray-200 leading-relaxed">
                The Knower (Asmat-pratyaya: Pure Consciousness) and the Known (Yuṣmad-pratyaya: mind, senses, body, world) are mutually opposed like <strong className="text-white">Light and Darkness</strong>. 
                Yet, due to beginningless natural ignorance (Naisargika Avidyā), the human mind couples the Real with the Unreal, asserting: <em>"I am this body; this wealth is mine; I am happy; I am miserable."</em>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#191b29] border border-[#282d40] text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                Classical Definition of Adhyāsa
              </span>
              <p className="text-amber-200 font-serif italic text-sm">
                "स्मृतिरूपः परत्र पूर्वदृष्टावभासः" (Smṛti-rūpaḥ paratra pūrva-dṛṣṭāvabhāsaḥ)
              </p>
              <p className="text-gray-400 text-[11px]">
                The apparent presentation to consciousness, in some other locus, of something previously perceived elsewhere, which partakes of the nature of memory.
              </p>
            </div>
          </div>

          {/* The 4 Great Vedic Mahāvākyas */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>The 4 Great Mahāvākyas of the Vedas</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  veda: 'Ṛg Veda (Aitareya Upaniṣad)',
                  sanskrit: 'प्रज्ञानं ब्रह्म',
                  iast: 'Prajñānaṁ Brahma',
                  meaning: 'Consciousness is Brahman',
                  nature: 'Lakṣaṇa Vākya (Definition of Reality)',
                  comment: 'Establishes that the ultimate reality is not an inert void or substance, but Pure Apprehending Consciousness itself.'
                },
                {
                  veda: 'Sāma Veda (Chāndogya Upaniṣad)',
                  sanskrit: 'तत्त्वमसि',
                  iast: 'Tat Tvam Asi',
                  meaning: 'That Thou Art (You are That)',
                  nature: 'Upadeśa Vākya (Instruction from Guru to Disciple)',
                  comment: 'The teacher Uddalaka instructs Shvetaketu that his innermost core is identical with the cosmic substratum.'
                },
                {
                  veda: 'Yajur Veda (Bṛhadāraṇyaka Upaniṣad)',
                  sanskrit: 'अहं ब्रह्मास्मि',
                  iast: 'Ahaṁ Brahmāsmi',
                  meaning: 'I am Brahman',
                  nature: 'Anubhava Vākya (Direct Experiential Realization)',
                  comment: 'The sovereign inner flash of awakening wherein the sage recognizes their transcendent non-dual nature.'
                },
                {
                  veda: 'Atharva Veda (Māṇḍūkya Upaniṣad)',
                  sanskrit: 'अयमात्मा ब्रह्म',
                  iast: 'Ayam Ātmā Brahma',
                  meaning: 'This Self is Brahman',
                  nature: 'Sākṣātkāra Vākya (Direct Introspective Demonstration)',
                  comment: 'Pointing inward to the immediate, non-mediated sense of "I" (Sakshi) as being one with the infinite.'
                }
              ].map((mv, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#161824] border border-[#272b3c] space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>{mv.veda}</span>
                    <span className="text-amber-400 font-semibold">{mv.nature}</span>
                  </div>
                  <div className="text-xl font-serif font-bold text-amber-200">{mv.sanskrit}</div>
                  <div className="text-xs font-mono text-purple-300 italic">{mv.iast} — "{mv.meaning}"</div>
                  <p className="text-xs text-gray-300 leading-relaxed pt-1">{mv.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOM VERSE INGESTION PORTAL                                     */}
      {/* ========================================================================= */}
      {activeTab === 'custom' && (
        <div className="p-6 rounded-2xl bg-[#161824] border border-[#2b3046] shadow-xl max-w-2xl mx-auto space-y-4">
          <div className="border-b border-[#25283a] pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus size={16} className="text-amber-400" />
              <span>Ingest New Vedic Verse or Commentary Note</span>
            </h2>
            <p className="text-xs text-gray-400">Add verses directly into your local encrypted Dexie database.</p>
          </div>

          <form onSubmit={handleAddCustomVerse} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 font-medium block mb-1">Canon</label>
                <select
                  value={customCanon}
                  onChange={e => setCustomCanon(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-white outline-none"
                >
                  <option value="Upanishad">Upanishad</option>
                  <option value="Bhagavad Gita">Bhagavad Gita</option>
                  <option value="Brahma Sutras">Brahma Sutras</option>
                  <option value="Shankara Bhashya">Shankara Bhashya</option>
                  <option value="Nath Agama">Nath Agama</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 font-medium block mb-1">Source Text</label>
                <input
                  type="text"
                  value={customSource}
                  onChange={e => setCustomSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 font-medium block mb-1">Chapter & Verse</label>
                <input
                  type="text"
                  value={customChapterVerse}
                  onChange={e => setCustomChapterVerse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-white outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 font-medium block mb-1">Philosophical Vāda</label>
                <select
                  value={customVada}
                  onChange={e => setCustomVada(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-white outline-none"
                >
                  <option value="Vivarta-Vada">Vivarta-Vada (Advaita)</option>
                  <option value="Cid-Vilasa-Vada">Cid-Vilasa-Vada (Nath)</option>
                  <option value="Abhasa-Vada">Abhasa-Vada (Kashmir Shaivism)</option>
                  <option value="Parinama-Vada">Parinama-Vada</option>
                  <option value="Satkaryavada">Satkaryavada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-400 font-medium block mb-1">Sanskrit Devanāgarī Text</label>
              <textarea
                rows={2}
                value={customDevanagari}
                onChange={e => setCustomDevanagari(e.target.value)}
                placeholder="सत्यं ज्ञानमनन्तं ब्रह्म..."
                className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-amber-200 font-serif text-base outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-gray-400 font-medium block mb-1">IAST Transliteration</label>
              <input
                type="text"
                value={customIast}
                onChange={e => setCustomIast(e.target.value)}
                placeholder="satyaṁ jñānam anantaṁ brahma..."
                className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-gray-300 font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-gray-400 font-medium block mb-1">English Translation</label>
              <textarea
                rows={2}
                value={customEnglish}
                onChange={e => setCustomEnglish(e.target.value)}
                placeholder="Brahman is Truth, Knowledge, and Infinity..."
                className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-white outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-gray-400 font-medium block mb-1">Śaṅkara Bhāṣya Commentary / Notes</label>
              <textarea
                rows={3}
                value={customBhashya}
                onChange={e => setCustomBhashya(e.target.value)}
                placeholder="Philosophical significance and Shankara commentary synthesis..."
                className="w-full px-3 py-2 rounded-xl bg-[#1a1d2c] border border-[#282d42] text-gray-300 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customMahavakya}
                  onChange={e => setCustomMahavakya(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-gray-300 font-semibold">Mark as Mahāvākya</span>
              </label>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-600/20 cursor-pointer"
              >
                Save Verse to Dexie
              </button>
            </div>

            {formSavedNotice && (
              <p className="text-xs font-mono text-emerald-400 text-center animate-bounce">
                ✔ Verse successfully stored in Dexie database!
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
