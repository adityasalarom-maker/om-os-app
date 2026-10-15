import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type InboxItem } from '../db';
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
  Copy
} from 'lucide-react';

interface ExtractedCandidate {
  id: string;
  type: 'task' | 'concept';
  title: string;
  details: string;
  suggestedQuadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  selected: boolean;
}

export const UniversalInboxAI: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState<'ChatGPT' | 'Gemini' | 'Web Note'>('ChatGPT');
  const [candidates, setCandidates] = useState<ExtractedCandidate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const inboxItems = useLiveQuery(() => db.inbox.orderBy('createdAt').reverse().toArray(), []) || [];

  // Deterministic AI conversation parser
  const handleParseConversation = () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setSuccessMessage('');

    const lines = rawText.split('\n');
    const newCandidates: ExtractedCandidate[] = [];

    let currentActionBatch: string[] = [];
    let currentTopic = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Extract headings / major topics as Concept candidates
      if (line.startsWith('#') || line.startsWith('**') && line.endsWith('**') && line.length < 80) {
        const cleanTitle = line.replace(/^[#*]+|\**$/g, '').trim();
        if (cleanTitle.length > 5) {
          currentTopic = cleanTitle;
          // Lookahead for explanation lines
          const nextLines = lines.slice(i + 1, i + 5).join(' ').trim();
          newCandidates.push({
            id: `cand-concept-${Date.now()}-${newCandidates.length}`,
            type: 'concept',
            title: cleanTitle,
            details: nextLines || 'Concept captured from AI conversation analysis.',
            selected: true
          });
        }
      }

      // Extract Action Items (TODOs, bullets with action verbs)
      const isTodoRegex = /^[-*]\s*(\[ \]|TODO:|Action Item:|Next Step:)?/i;
      const isImperativeAction = /^(Research|Build|Create|Configure|Implement|Review|Verify|Contact|Test|Schedule)\b/i;

      if (line.match(isTodoRegex) || line.match(isImperativeAction)) {
        const cleanTask = line.replace(/^[-*]\s*(\[[ xX]\]|TODO:|Action Item:)?\s*/i, '').trim();
        if (cleanTask.length > 8 && !cleanTask.endsWith('?')) {
          newCandidates.push({
            id: `cand-task-${Date.now()}-${newCandidates.length}`,
            type: 'task',
            title: cleanTask,
            details: currentTopic ? `Context: ${currentTopic}` : 'Extracted from conversation turn',
            suggestedQuadrant: 'Q2', // Default to Important Not Urgent Deep Work
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
        selected: true
      });
    }

    setCandidates(newCandidates);
    setIsProcessing(false);
  };

  const handleToggleCandidate = (id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleApproveAndImport = async () => {
    const selected = candidates.filter(c => c.selected);
    if (selected.length === 0) return;

    const now = Date.now();
    let tasksAdded = 0;
    let notesAdded = 0;

    for (const item of selected) {
      if (item.type === 'task') {
        await db.tasks.add({
          id: `task-${now}-${tasksAdded}`,
          title: item.title,
          status: 'To Do',
          priority: 'Important Not Urgent',
          quadrant: item.suggestedQuadrant || 'Q2',
          urgency: 'Medium',
          impact: 'High',
          energyRequired: 'Deep Work',
          isCompleted: false,
          createdAt: now,
          updatedAt: now
        });
        tasksAdded++;
      } else {
        await db.knowledge.add({
          id: `know-${now}-${notesAdded}`,
          title: item.title,
          type: 'Concept',
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

    setSuccessMessage(`Successfully imported ${tasksAdded} tasks to Task Intelligence and ${notesAdded} notes to Knowledge Vault!`);
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
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
                    Select the tasks and concepts you want to commit. Nothing is saved until you approve.
                  </p>
                </div>
                <button
                  onClick={handleApproveAndImport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Approve & Save ({candidates.filter(c => c.selected).length})</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {candidates.map(cand => (
                  <div
                    key={cand.id}
                    onClick={() => handleToggleCandidate(cand.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      cand.selected
                        ? 'bg-[#1e2336] border-indigo-500/50'
                        : 'bg-[#141622] border-[#272b3b] opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={cand.selected}
                      onChange={() => {}}
                      className="mt-1 rounded accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          cand.type === 'task'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        }`}>
                          {cand.type === 'task' ? '⚡ Action Task' : '🧠 Knowledge Concept'}
                        </span>
                        {cand.suggestedQuadrant && (
                          <span className="text-[9px] text-gray-400 font-mono">
                            {cand.suggestedQuadrant} • Important Not Urgent
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white">
                        {cand.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
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
                          className="text-gray-500 hover:text-rose-400 transition-colors p-0.5"
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
    </div>
  );
};
