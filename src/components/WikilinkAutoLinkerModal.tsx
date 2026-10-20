import React, { useState, useMemo } from 'react';
import { 
  type KnowledgeItem 
} from '../db';
import { 
  scanVaultForUnlinkedMentions, 
  batchConvertMentionsToWikilinks, 
  autoLinkAllHighConfidenceMentions,
  type VaultUnlinkedMention,
  type VaultUnlinkedScanResult,
  type AutoLinkExecutionResult 
} from '../services/graphEngine';
import { 
  X, 
  Network, 
  Link2, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  Filter, 
  RefreshCw, 
  Layers, 
  FileText, 
  TrendingUp,
  Check
} from 'lucide-react';

interface WikilinkAutoLinkerModalProps {
  isOpen: boolean;
  notes: KnowledgeItem[];
  onClose: () => void;
  onLinksUpdated?: () => void;
}

export const WikilinkAutoLinkerModal: React.FC<WikilinkAutoLinkerModalProps> = ({
  isOpen,
  notes,
  onClose,
  onLinksUpdated
}) => {
  const [selectedConcept, setSelectedConcept] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<AutoLinkExecutionResult | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  // Scan Vault across all notes
  const scanResult: VaultUnlinkedScanResult = useMemo(() => {
    return scanVaultForUnlinkedMentions(notes);
  }, [notes]);

  // Filtered mentions based on concept selection, search, and ignored IDs
  const activeMentions = useMemo(() => {
    return scanResult.mentions.filter(m => {
      if (ignoredIds.has(m.id)) return false;
      if (selectedConcept !== 'All' && m.targetTitle !== selectedConcept) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchTarget = m.targetTitle.toLowerCase().includes(q);
        const matchSource = m.sourceNoteTitle.toLowerCase().includes(q);
        const matchSnippet = m.snippet.toLowerCase().includes(q);
        return matchTarget || matchSource || matchSnippet;
      }
      return true;
    });
  }, [scanResult, selectedConcept, searchFilter, ignoredIds]);

  // Concept Pills List sorted by mention frequency
  const sortedConcepts = useMemo(() => {
    return Object.entries(scanResult.byTargetTitle)
      .map(([concept, list]) => ({
        concept,
        count: list.filter(item => !ignoredIds.has(item.id)).length
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [scanResult, ignoredIds]);

  if (!isOpen) return null;

  // 1-Click: Auto-Link ALL discovered high-confidence mentions
  const handleAutoLinkAll = async () => {
    setIsProcessing(true);
    try {
      const mentionsToConvert = scanResult.mentions.filter(m => !ignoredIds.has(m.id));
      const res = await batchConvertMentionsToWikilinks(mentionsToConvert);
      setExecutionResult(res);
      onLinksUpdated?.();
    } catch (err: any) {
      console.error('Failed to auto-link all mentions:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert single mention
  const handleConvertSingle = async (mention: VaultUnlinkedMention) => {
    try {
      await batchConvertMentionsToWikilinks([mention]);
      setIgnoredIds(prev => new Set(prev).add(mention.id));
      onLinksUpdated?.();
    } catch (err) {
      console.error('Failed to link mention:', err);
    }
  };

  // Ignore mention from list
  const handleIgnore = (id: string) => {
    setIgnoredIds(prev => new Set(prev).add(id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#181a24] border border-[#2c334d] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#2c334d] px-6 py-4 bg-[#141622] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 text-purple-400 rounded-xl border border-purple-500/30">
              <Network size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Bidirectional [[Wikilinks]] Auto-Linker
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Semantic Cross-Referencer
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Automatically resolves plain text mentions into dense, bidirectional graph edges across your archives.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-[#202538] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Metrics Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#141622] border-b border-[#2c334d] shrink-0">
          <div className="bg-[#181a24] p-3 rounded-xl border border-[#272b3d]">
            <span className="text-[10px] text-gray-400 block font-medium">Total Vault Archives</span>
            <div className="text-lg font-bold text-white mt-0.5">{notes.length} Notes</div>
            <span className="text-[10px] text-gray-500">Notion OS & My Notes</span>
          </div>
          <div className="bg-[#181a24] p-3 rounded-xl border border-[#272b3d]">
            <span className="text-[10px] text-gray-400 block font-medium">Discovered Plain Mentions</span>
            <div className="text-lg font-bold text-purple-400 mt-0.5">{activeMentions.length} Mentions</div>
            <span className="text-[10px] text-gray-500">Awaiting [[wikilinks]]</span>
          </div>
          <div className="bg-[#181a24] p-3 rounded-xl border border-[#272b3d]">
            <span className="text-[10px] text-gray-400 block font-medium">Target Concepts</span>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{sortedConcepts.length} Concepts</div>
            <span className="text-[10px] text-gray-500">Distinct bridge nodes</span>
          </div>
          <div className="bg-[#181a24] p-3 rounded-xl border border-[#272b3d]">
            <span className="text-[10px] text-gray-400 block font-medium">Graph Edge Boost</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">+{activeMentions.length} Edges</div>
            <span className="text-[10px] text-emerald-400/80 flex items-center gap-1">
              <TrendingUp size={11} /> High density mesh
            </span>
          </div>
        </div>

        {/* 1-Click Action & Filter Bar */}
        <div className="p-4 bg-[#161826] border-b border-[#2c334d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter mentions by concept or note..."
                className="bg-[#10121a] border border-[#2b3147] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 w-full"
              />
            </div>
            
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <button
            disabled={isProcessing || activeMentions.length === 0}
            onClick={handleAutoLinkAll}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 cursor-pointer shrink-0"
          >
            <Sparkles size={14} />
            <span>{isProcessing ? 'Auto-Linking Vault...' : `Auto-Link All ${activeMentions.length} Mentions`}</span>
          </button>
        </div>

        {/* Concept Filter Chips */}
        {sortedConcepts.length > 0 && (
          <div className="px-6 py-2.5 bg-[#141622] border-b border-[#282d3e] flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs">
            <span className="text-gray-500 text-[11px] font-semibold flex items-center gap-1 shrink-0 mr-1">
              <Filter size={11} /> Concepts:
            </span>
            <button
              onClick={() => setSelectedConcept('All')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedConcept === 'All'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1a1d2e] text-gray-400 hover:text-white border border-[#2a2f47]'
              }`}
            >
              All ({scanResult.mentions.length})
            </button>
            {sortedConcepts.map(c => (
              <button
                key={c.concept}
                onClick={() => setSelectedConcept(c.concept)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedConcept === c.concept
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1a1d2e] text-gray-400 hover:text-white border border-[#2a2f47]'
                }`}
              >
                [[{c.concept}]] ({c.count})
              </button>
            ))}
          </div>
        )}

        {/* Execution Success Banner */}
        {executionResult && (
          <div className="m-4 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block">Vault Semantic Graph Enriched!</span>
                <span className="text-[11px] text-emerald-400/90">
                  Successfully converted {executionResult.linksCreatedCount} plain mentions into bidirectional [[wikilinks]] across {executionResult.updatedNotesCount} archives.
                </span>
              </div>
            </div>
            <button
              onClick={() => setExecutionResult(null)}
              className="text-emerald-400 hover:text-white text-[11px] px-2.5 py-1 rounded bg-emerald-900/50"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Mentions Table Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeMentions.length === 0 ? (
            <div className="p-12 bg-[#141622] rounded-2xl border border-emerald-500/30 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h5 className="text-sm font-bold text-white">Full Semantic Coherence Achieved</h5>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No unlinked plain-text concept mentions remain across your 40+ archives. Every concept title mentioned in your notes is formally connected via [[wikilinks]].
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeMentions.map(m => (
                <div
                  key={m.id}
                  className="p-3.5 bg-[#141622] border border-[#272b3d] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 font-mono">
                        [[{m.targetTitle}]]
                      </span>
                      <span className="text-gray-500 text-xs">found inside</span>
                      <span className="text-xs font-semibold text-white bg-[#1e2235] px-2 py-0.5 rounded border border-[#2e354e]">
                        {m.sourceNoteTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 italic font-mono bg-[#10121a] p-2 rounded-lg border border-white/5 line-clamp-2">
                      "{m.snippet}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleConvertSingle(m)}
                      title={`Convert plain "${m.matchedText}" to [[${m.targetTitle}]]`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                    >
                      <Link2 size={13} />
                      <span>Link Now</span>
                    </button>
                    <button
                      onClick={() => handleIgnore(m.id)}
                      title="Skip this mention"
                      className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-[#1d202e] border border-[#2d3246] transition-colors cursor-pointer"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="border-t border-[#2c334d] px-6 py-3.5 bg-[#141622] flex items-center justify-between shrink-0 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>OKTP v1.0 Bidirectional Graph Coherence Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#202538] hover:bg-[#282d3e] text-gray-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
