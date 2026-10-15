import React, { useState } from 'react';
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
  Camera
} from 'lucide-react';
import { DocumentIntelligenceModal } from './DocumentIntelligenceModal';

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

  const inboxItems = useLiveQuery(() => db.inbox.orderBy('createdAt').reverse().toArray(), []) || [];

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

      // 1. Code Block Tokenization: Never detect tasks or headers inside code snippets
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // 2. Extract Headings / Major Topics as Concept Candidates
      const isHeader = line.startsWith('#') || (line.startsWith('**') && line.endsWith('**') && line.length < 90);
      if (isHeader) {
        const cleanTitle = line.replace(/^[#*]+|\**$/g, '').trim();
        if (cleanTitle.length > 4 && !cleanTitle.toLowerCase().startsWith('step ') && !cleanTitle.toLowerCase().startsWith('action')) {
          currentTopic = cleanTitle;
          // Lookahead for synthesis paragraph lines
          const nextLines = lines
            .slice(i + 1, i + 6)
            .filter(l => !l.trim().startsWith('#') && !l.trim().startsWith('```') && !l.trim().startsWith('- [ ]'))
            .join(' ')
            .trim();

          newCandidates.push({
            id: `cand-concept-${Date.now()}-${newCandidates.length}`,
            type: 'concept',
            title: cleanTitle,
            details: nextLines || `Synthesized key concept from ${sourceType} conversation turn.`,
            suggestedQuadrant: 'Q2',
            conceptType: 'Concept',
            selected: true
          });
        }
      }

      // 3. Extract Action Items (TODO bullets or imperative verbs)
      const isTodoBullet = /^[-*]\s*(\[[ xX]?\]|TODO:|Action Item:|Next Step:)/i.test(line);
      const isImperativeAction = /^[-*]?\s*(Research|Build|Create|Configure|Implement|Review|Verify|Contact|Test|Schedule|Deploy|Design|Audit)\b/i.test(line);

      if (isTodoBullet || isImperativeAction) {
        const cleanTask = line.replace(/^[-*]\s*(\[[ xX]?\]|TODO:|Action Item:|Next Step:)?\s*/i, '').trim();
        if (cleanTask.length > 6 && !cleanTask.endsWith('?')) {
          // Infer suggested quadrant from keywords
          let quad: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q2';
          const lower = cleanTask.toLowerCase();
          if (lower.includes('urgent') || lower.includes('crisis') || lower.includes('asap') || lower.includes('immediately')) {
            quad = 'Q1';
          } else if (lower.includes('quick') || lower.includes('call') || lower.includes('email') || lower.includes('order')) {
            quad = 'Q3';
          } else if (lower.includes('someday') || lower.includes('backlog') || lower.includes('later')) {
            quad = 'Q4';
          }

          newCandidates.push({
            id: `cand-task-${Date.now()}-${newCandidates.length}`,
            type: 'task',
            title: cleanTask,
            details: currentTopic ? `Context: ${currentTopic}` : `Turn extracted from ${sourceType}`,
            suggestedQuadrant: quad,
            selected: true
          });
        }
      }
    }

    // Fallback if no specific markdown items matched
    if (newCandidates.length === 0) {
      newCandidates.push({
        id: `cand-fallback-${Date.now()}`,
        type: 'concept',
        title: `AI Synthesis (${sourceType})`,
        details: rawText.slice(0, 300) + '...',
        suggestedQuadrant: 'Q2',
        conceptType: 'Concept',
        selected: true
      });
    }

    setCandidates(newCandidates);
    setIsProcessing(false);
  };

  const handleToggleCandidate = (id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleUpdateCandidateTitle = (id: string, newTitle: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const handleUpdateCandidateQuadrant = (id: string, quad: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, suggestedQuadrant: quad } : c));
  };

  const handleUpdateCandidateConceptType = (id: string, type: 'Concept' | 'Note' | 'Question' | 'Quote') => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, conceptType: type } : c));
  };

  // Atomic Dexie transaction commit
  const handleApproveAndImport = async () => {
    const selected = candidates.filter(c => c.selected);
    if (selected.length === 0) return;

    const now = Date.now();
    let tasksAdded = 0;
    let notesAdded = 0;

    const priorityMap: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', TaskItem['priority']> = {
      Q1: 'Urgent & Important',
      Q2: 'Important Not Urgent',
      Q3: 'Urgent Not Important',
      Q4: 'Neither'
    };

    await db.transaction('rw', [db.tasks, db.knowledge, db.inbox], async () => {
      for (const item of selected) {
        if (item.type === 'task') {
          const quad = item.suggestedQuadrant || 'Q2';
          await db.tasks.add({
            id: `task-${now}-${tasksAdded}`,
            title: item.title,
            status: 'To Do',
            priority: priorityMap[quad],
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

      // Save full original transcript to Inbox archive
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
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" size={22} />
            <span>Universal Inbox & AI Conversation Ingestion</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Paste complete ChatGPT or Gemini transcripts. Extract tasks and atomic knowledge with an approval review screen.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Analyze & Extract Entities (Approval Staging)</span>
            </button>
          </div>

          {/* Staging & Approval Review Screen */}
          {candidates.length > 0 && (
            <div className="bg-[#181a24] border border-indigo-500/40 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#282d3f]">
                <div>
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo size={15} />
                    Step 2: Review & Approve Extracted Entities
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Select, edit titles, and choose target quadrants before committing.
                  </p>
                </div>
                <button
                  onClick={handleApproveAndImport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>Approve & Save ({candidates.filter(c => c.selected).length})</span>
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

                      {/* Editable Title */}
                      <input
                        type="text"
                        value={cand.title}
                        onChange={(e) => handleUpdateCandidateTitle(cand.id, e.target.value)}
                        className="w-full bg-[#141622] border border-[#2c3248] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />

                      <p className="text-[11px] text-gray-400 line-clamp-2 bg-[#141724]/60 p-2 rounded border border-[#242838]">
                        {cand.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (5 cols): Ingested History & Source Archive */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Inbox size={15} className="text-indigo-400" />
              Ingestion Source Archive ({inboxItems.length})
            </h3>
            <p className="text-[11px] text-gray-400">
              Original full transcripts are preserved verbatim for auditing and historical reference.
            </p>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {inboxItems.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  No previous imports yet.
                </div>
              ) : (
                inboxItems.map(item => (
                  <div key={item.id} className="bg-[#141622] border border-[#262b3d] rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        {item.source || item.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteInbox(item.id)}
                          className="text-gray-500 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                          title="Delete archive item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-medium text-white line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono line-clamp-2 bg-[#181b28] p-2 rounded border border-[#282d3f]">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Multimodal Document Intelligence & OCR Modal */}
      <DocumentIntelligenceModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onSavedToVault={() => {
          setIsOcrOpen(false);
          setSuccessMessage('Scanned document saved directly to Knowledge Vault!');
        }}
      />
    </div>
  );
};
