import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type InboxItem, type TaskItem, type KnowledgeItem } from '../db';
import { 
  Inbox, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  FileText, 
  Cpu, 
  ListTodo, 
  BookOpen,
  Copy,
  Brain,
  Zap,
  Edit2,
  Check,
  Camera,
  Database,
  FolderGit2,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  analyzeCorpusCandidates, 
  runBatchCorpusIngestion, 
  type IngestionSummaryReport,
  type IngestionPreview 
} from '../services/corpusIngestionEngine';

const DocumentIntelligenceModal = React.lazy(() => import('./DocumentIntelligenceModal').then(m => ({ default: m.DocumentIntelligenceModal })));

interface ExtractedCandidate {
  id: string;
  type: 'task' | 'concept';
  title: string;
  details: string;
  suggestedQuadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  conceptType?: 'Concept' | 'Note' | 'Question' | 'Quote';
  selected: boolean;
}

export const UniversalInboxAI: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState<'ChatGPT' | 'Gemini' | 'Web Note'>('ChatGPT');
  const [candidates, setCandidates] = useState<ExtractedCandidate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // Authentic Archive Ingestion State
  const [corpusPreview, setCorpusPreview] = useState<IngestionPreview | null>(null);

  useEffect(() => {
    analyzeCorpusCandidates().then(p => setCorpusPreview(p)).catch(() => {});
  }, []);
  const [isIngestingCorpus, setIsIngestingCorpus] = useState(false);
  const [corpusProgress, setCorpusProgress] = useState<string>('');
  const [ingestionReport, setIngestionReport] = useState<IngestionSummaryReport | null>(null);
  const [showCorpusBreakdown, setShowCorpusBreakdown] = useState(false);

  const inboxItems = useLiveQuery(() => db.inbox.orderBy('createdAt').reverse().toArray(), []) || [];
  const totalVaultCount = useLiveQuery(() => db.knowledge.count(), []) || 0;
  const totalTasksCount = useLiveQuery(() => db.tasks.count(), []) || 0;
  const totalGoalsCount = useLiveQuery(() => db.goals.count(), []) || 0;

  // Batch Ingestion Handler
  const handleBatchIngestCorpus = async () => {
    setIsIngestingCorpus(true);
    setSuccessMessage('');
    try {
      const report = await runBatchCorpusIngestion((step) => {
        setCorpusProgress(step);
      });
      setIngestionReport(report);
      setSuccessMessage(
        `Batch Ingestion Complete: Processed ${report.docsProcessed} files (${(report.totalBytesProcessed / 1024).toFixed(1)} KB) -> Created ${report.conceptsIngested} Concepts, ${report.tasksIngested} Tasks, ${report.goalsIngested} Goals, and formed ${report.wikilinksFormed} [[wikilinks]] in ${report.durationMs}ms.`
      );
    } catch (err: any) {
      setSuccessMessage(`Ingestion failed: ${err.message || String(err)}`);
    } finally {
      setIsIngestingCorpus(false);
      setCorpusProgress('');
    }
  };

  // Deterministic AI conversation parser with code block tokenization
  const handleParseConversation = () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setSuccessMessage('');

    const lines = rawText.split('\n');
    const newCandidates: ExtractedCandidate[] = [];

    let inCodeBlock = false;
    let currentTopic = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      const isHeader = line.startsWith('#') || (line.startsWith('**') && line.endsWith('**') && line.length < 90);
      if (isHeader) {
        const cleanTitle = line.replace(/^[#*]+|\**$/g, '').trim();
        if (cleanTitle.length > 4 && !cleanTitle.toLowerCase().startsWith('step ') && !cleanTitle.toLowerCase().startsWith('action')) {
          currentTopic = cleanTitle;
          const nextLines = lines
            .slice(i + 1, i + 6)
            .filter(l => !l.trim().startsWith('#') && !l.trim().startsWith('```') && l.trim().length > 0)
            .join(' ');

          newCandidates.push({
            id: `cand-${Date.now()}-${newCandidates.length}`,
            type: 'concept',
            title: cleanTitle,
            details: nextLines || `Extracted concept from ${sourceType} conversation.`,
            suggestedQuadrant: 'Q2',
            conceptType: 'Concept',
            selected: true
          });
        }
      }

      const isChecklist = /^[-*]\s*\[([ xX])\]\s*(.+)$/.exec(line);
      const isActionPrefix = /^(TODO|ACTION|NEXT STEP|TASK):?\s*(.+)$/i.exec(line);
      const isImperativeLine = /^[-*]\s+(Implement|Build|Fix|Verify|Audit|Deploy|Update|Refactor|Design|Add)\b\s*(.+)$/i.exec(line);

      let taskTitle = '';
      if (isChecklist) taskTitle = isChecklist[2];
      else if (isActionPrefix) taskTitle = isActionPrefix[2];
      else if (isImperativeLine) taskTitle = `${isImperativeLine[1]} ${isImperativeLine[2]}`;

      if (taskTitle) {
        const cleanTask = taskTitle.replace(/<[^>]+>/g, '').trim();
        let suggestedQuad: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q2';
        const lower = cleanTask.toLowerCase();
        if (lower.includes('urgent') || lower.includes('critical') || lower.includes('bug') || lower.includes('asap') || lower.includes('fix')) {
          suggestedQuad = 'Q1';
        } else if (lower.includes('delegate') || lower.includes('ask') || lower.includes('send') || lower.includes('email')) {
          suggestedQuad = 'Q3';
        } else if (lower.includes('someday') || lower.includes('maybe') || lower.includes('consider')) {
          suggestedQuad = 'Q4';
        }

        newCandidates.push({
          id: `cand-${Date.now()}-${newCandidates.length}`,
          type: 'task',
          title: cleanTask,
          details: currentTopic ? `Context: ${currentTopic}` : `Extracted action item from ${sourceType}`,
          suggestedQuadrant: suggestedQuad,
          selected: true
        });
      }
    }

    if (newCandidates.length === 0) {
      newCandidates.push({
        id: `cand-${Date.now()}-0`,
        type: 'concept',
        title: rawText.slice(0, 50).trim() + (rawText.length > 50 ? '...' : ''),
        details: rawText,
        suggestedQuadrant: 'Q2',
        conceptType: 'Note',
        selected: true
      });
    }

    setCandidates(newCandidates);
    setIsProcessing(false);
  };

  const handleToggleCandidate = (id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleUpdateCandidateQuadrant = (id: string, quad: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, suggestedQuadrant: quad } : c));
  };

  const handleUpdateCandidateConceptType = (id: string, cType: 'Concept' | 'Note' | 'Question' | 'Quote') => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, conceptType: cType } : c));
  };

  const handleCommitStaged = async () => {
    const selected = candidates.filter(c => c.selected);
    if (selected.length === 0) return;

    const now = Date.now();
    let tasksAdded = 0;
    let notesAdded = 0;

    await db.transaction('rw', [db.tasks, db.knowledge, db.inbox], async () => {
      for (const item of selected) {
        if (item.type === 'task') {
          const quad = item.suggestedQuadrant;
          await db.tasks.add({
            id: `task-${now}-${tasksAdded}`,
            title: item.title,
            status: 'To Do',
            priority: quad === 'Q1' ? 'Urgent & Important' : quad === 'Q2' ? 'Important Not Urgent' : 'Neither',
            quadrant: quad,
            urgency: quad === 'Q1' || quad === 'Q3' ? 'High' : 'Low',
            impact: quad === 'Q1' || quad === 'Q2' ? 'High' : 'Low',
            energyRequired: quad === 'Q3' ? 'Quick Win' : 'Deep Work',
            isCompleted: false,
            createdAt: now,
            updatedAt: now
          });
          tasksAdded++;
        } else {
          await db.knowledge.add({
            id: `know-${now}-${notesAdded}`,
            title: item.title,
            type: item.conceptType || 'Concept',
            content: `${item.details}\n\n*Source: Imported from ${sourceType} conversation transcript.*`,
            tags: ['AI-Ingestion', sourceType],
            createdAt: now,
            updatedAt: now
          });
          notesAdded++;
        }
      }

      await db.inbox.add({
        id: `inbox-${now}`,
        title: `${sourceType} Import (${tasksAdded} tasks, ${notesAdded} notes)`,
        content: rawText,
        type: 'AI Conversation',
        source: sourceType,
        status: 'Processed',
        createdAt: now,
        updatedAt: now
      });
    });

    setSuccessMessage(`Atomic transaction complete: imported ${tasksAdded} tasks and ${notesAdded} notes. Verbatim transcript archived in Universal Inbox!`);
    setRawText('');
    setCandidates([]);
  };

  const handleDeleteInbox = async (id: string) => {
    await db.inbox.delete(id);
  };

  return (
    <div data-ag-id="UniversalInbox_Root_Workspace" className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" size={22} />
            <span>Universal Inbox & AI Conversation Ingestion</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Parse complete transcripts and batch-ingest the authentic 40 Notion OS & My Notes archives directly into Dexie.
          </p>
        </div>

        {/* Live Substratum Metrics */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-[#12141d] border border-[#272b3b] flex items-center gap-1.5 font-mono text-gray-300">
            <BookOpen size={13} className="text-indigo-400" />
            <span>{totalVaultCount} Vault Notes</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#12141d] border border-[#272b3b] flex items-center gap-1.5 font-mono text-gray-300">
            <ListTodo size={13} className="text-emerald-400" />
            <span>{totalTasksCount} Tasks</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#12141d] border border-[#272b3b] flex items-center gap-1.5 font-mono text-gray-300">
            <Sparkles size={13} className="text-amber-400" />
            <span>{totalGoalsCount} Goals</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* MILESTONE A: Authentic Archive Ingestion Hub */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-[#181a24] to-purple-950/30 border border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Authentic Archive Ingestion Hub
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  Milestone A
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Seamlessly bridges all <b>40 authentic markdown archives</b> from <code className="text-indigo-300 text-[11px]">notion_os/</code> and <code className="text-indigo-300 text-[11px]">my_notes/</code> (including <i>Mati-Vivek</i> 113 kB, <i>Vivarta-Vada</i> 44 kB, and <i>Uttarkashi Due Diligence</i> 48 kB) into Dexie with automated bidirectional <code className="text-purple-300 text-[11px]">[[wikilinks]]</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowCorpusBreakdown(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-[#141622] hover:bg-[#1a1e2f] border border-[#272b3b] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderGit2 size={13} className="text-indigo-400" />
              <span>{showCorpusBreakdown ? 'Hide Breakdown' : 'View 40 Files'}</span>
              {showCorpusBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              type="button"
              onClick={handleBatchIngestCorpus}
              disabled={isIngestingCorpus}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isIngestingCorpus ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-white" />
                  <span>{corpusProgress || 'Ingesting Corpus...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-300" />
                  <span>Ingest All 40 Archives into Dexie</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Corpus Metrics Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#12141e]/80 border border-[#252a3d] p-3 rounded-xl">
            <div className="text-[10px] font-mono uppercase text-gray-400">Total Archive Volume</div>
            <div className="text-base font-bold text-white mt-0.5">
              {corpusPreview ? `${(corpusPreview.totalBytes / 1024).toFixed(1)} KB` : '402.7 KB'}
            </div>
            <div className="text-[10px] text-indigo-400 mt-0.5">40 Verified Markdown Files</div>
          </div>

          <div className="bg-[#12141e]/80 border border-[#252a3d] p-3 rounded-xl">
            <div className="text-[10px] font-mono uppercase text-gray-400">Core Concepts</div>
            <div className="text-base font-bold text-indigo-300 mt-0.5">
              {corpusPreview ? corpusPreview.concepts.length : '50+'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Atomic Vault Nodes</div>
          </div>

          <div className="bg-[#12141e]/80 border border-[#252a3d] p-3 rounded-xl">
            <div className="text-[10px] font-mono uppercase text-gray-400">Actionable Tasks</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">
              {corpusPreview ? corpusPreview.tasks.length : '80+'}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Eisenhower Q1-Q4 Mapped</div>
          </div>

          <div className="bg-[#12141e]/80 border border-[#252a3d] p-3 rounded-xl">
            <div className="text-[10px] font-mono uppercase text-gray-400">Relational Graph</div>
            <div className="text-base font-bold text-purple-300 mt-0.5">
              {ingestionReport ? `${ingestionReport.wikilinksFormed} Links` : 'Auto [[Wikilinks]]'}
            </div>
            <div className="text-[10px] text-purple-400 mt-0.5">Bidirectional Backlink Index</div>
          </div>
        </div>

        {/* Collapsible File Breakdown Drawer */}
        {showCorpusBreakdown && corpusPreview && (
          <div className="bg-[#12141d] border border-[#25293d] rounded-xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold text-gray-300">Corpus Manifest (35+ Modules & Study Archives)</span>
              <span>Showing all 40 files ready for Dexie ingestion</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {corpusPreview.concepts.map(c => (
                <div key={c.id} className="bg-[#181a24] p-2 rounded-lg border border-[#232738] flex items-center justify-between text-[11px]">
                  <span className="text-gray-200 truncate font-medium">{c.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                    c.category === 'Notion OS Module' ? 'bg-blue-500/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'
                  }`}>
                    {c.category === 'Notion OS Module' ? 'Notion' : 'Notes'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Column Ingestion Staging, Right Column Raw Archives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Paste & Staging */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu size={15} className="text-indigo-400" />
                Step 1: Paste Transcript or Conversation
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOcrOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  title="Scan document, bill, or Sanskrit text via offline Tesseract OCR"
                >
                  <Camera size={13} className="text-indigo-400" />
                  <span>Scan OCR</span>
                </button>
                <div className="flex items-center gap-1 bg-[#141622] p-1 rounded-lg border border-[#272b3c] text-xs">
                  {(['ChatGPT', 'Gemini', 'Web Note'] as const).map(src => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSourceType(src)}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        sourceType === src ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste dialogue turns or export text from ChatGPT / Gemini here...

Example:
Assistant: Here are the key findings on Vivarta Vada.
- [ ] Research Tehsil revenue records for Uttarkashi property
- [ ] Build Google Sheets sync connector"
              rows={8}
              className="w-full bg-[#141622] border border-[#272b3d] rounded-xl p-3 text-xs text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />

            <button
              onClick={handleParseConversation}
              disabled={isProcessing || !rawText.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Cpu size={14} />
              <span>{isProcessing ? 'Tokenizing Code Blocks & Parsing...' : 'Parse & Extract Entities'}</span>
            </button>
          </div>

          {/* Staged Candidates Approval Box */}
          {candidates.length > 0 && (
            <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  Step 2: Staged Approval Interface ({candidates.filter(c => c.selected).length} Selected)
                </span>
                <button
                  onClick={handleCommitStaged}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Commit Staged Entities to DB</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {candidates.map(cand => (
                  <div
                    key={cand.id}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      cand.selected
                        ? 'bg-[#1e2336] border-indigo-500/50'
                        : 'bg-[#141622] border-[#272b3b] opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={cand.selected}
                      onChange={() => handleToggleCandidate(cand.id)}
                      className="mt-1.5 rounded accent-indigo-600 cursor-pointer shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                          cand.type === 'task'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        }`}>
                          {cand.type === 'task' ? <Zap size={10} /> : <BookOpen size={10} />}
                          <span>{cand.type === 'task' ? 'Task Item' : 'Knowledge Concept'}</span>
                        </span>

                        {cand.type === 'task' ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-gray-400 text-[10px]">Quadrant:</span>
                            <select
                              value={cand.suggestedQuadrant}
                              onChange={(e: any) => handleUpdateCandidateQuadrant(cand.id, e.target.value)}
                              className="bg-[#141622] border border-[#2c3247] text-white text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                            >
                              <option value="Q1">Q1: Urgent & Important</option>
                              <option value="Q2">Q2: Important Not Urgent</option>
                              <option value="Q3">Q3: Urgent Not Important</option>
                              <option value="Q4">Q4: Someday / Backlog</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-gray-400 text-[10px]">Type:</span>
                            <select
                              value={cand.conceptType || 'Concept'}
                              onChange={(e: any) => handleUpdateCandidateConceptType(cand.id, e.target.value)}
                              className="bg-[#141622] border border-[#2c3247] text-white text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                            >
                              <option value="Concept">Concept</option>
                              <option value="Note">Note</option>
                              <option value="Question">Question</option>
                              <option value="Quote">Quote</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-white leading-snug">{cand.title}</p>
                      <p className="text-xs text-gray-400 font-mono line-clamp-2 leading-relaxed">{cand.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Verbatim Inbox Archive */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Brain size={15} className="text-purple-400" />
                Raw Inbox Archive ({inboxItems.length})
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Immutable Local Store</span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {inboxItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 font-mono border border-dashed border-[#272b3b] rounded-xl">
                  Inbox archive is currently empty.
                </div>
              ) : (
                inboxItems.map(item => (
                  <div key={item.id} className="p-3 bg-[#141622] border border-[#232738] rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white truncate">{item.title}</span>
                      <button
                        onClick={() => handleDeleteInbox(item.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1 border-t border-[#1e2336]">
                      <span>{item.source || 'Manual'}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal Document Intelligence & OCR Modal */}
      {isOcrOpen && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center text-white text-xs">Loading Document Intelligence...</div>}>
          <DocumentIntelligenceModal
            isOpen={isOcrOpen}
            onClose={() => setIsOcrOpen(false)}
            onSavedToVault={() => {
              setIsOcrOpen(false);
              setSuccessMessage('Scanned document saved directly to Knowledge Vault!');
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

