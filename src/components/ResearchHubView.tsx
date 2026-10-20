import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  type ResearchInquiry, 
  type ResearchPipelineStage, 
  type EvidenceLevel, 
  type ResearchDomain,
  type ResearchEvidenceItem,
  initializeResearchInquiriesIfEmpty
} from '../db';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  Link2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  X, 
  Star, 
  FileText, 
  CheckCircle2, 
  Check, 
  Award, 
  ArrowRight,
  Filter,
  Layers,
  HelpCircle
} from 'lucide-react';

const PIPELINE_STAGES: ResearchPipelineStage[] = [
  'Capture',
  'Define Question',
  'Collect Sources',
  'Validate Evidence',
  'Analyze',
  'Synthesize',
  'Decision',
  'Archive'
];

const EVIDENCE_LEVELS: EvidenceLevel[] = [
  'Level A: Official Sources',
  'Level B: Peer-reviewed Research',
  'Level C: Published Books',
  'Level D: Expert Analysis',
  'Level E: Community Reports'
];

const RESEARCH_DOMAINS: ResearchDomain[] = [
  'AI & Cognitive Systems',
  'Health & Ayurveda',
  'Land & Himalayan GIS',
  'Spirituality & Vedanta',
  'Technology & Architecture',
  'General'
];

export const ResearchHubView: React.FC = () => {
  // Ensure seed data exists
  useEffect(() => {
    initializeResearchInquiriesIfEmpty();
  }, []);

  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedEvidenceLevel, setSelectedEvidenceLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Inquiry for Detail / Evidence Drawer
  const [activeInquiry, setActiveInquiry] = useState<ResearchInquiry | null>(null);

  // Modal State for New Inquiry
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState<ResearchDomain>('AI & Cognitive Systems');
  const [newObjective, setNewObjective] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [newEvidenceLevel, setNewEvidenceLevel] = useState<EvidenceLevel>('Level B: Peer-reviewed Research');
  const [newTags, setNewTags] = useState('Research, Investigation');

  // Modal State for Adding Evidence to Active Inquiry
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evAuthor, setEvAuthor] = useState('');
  const [evSourceUrl, setEvSourceUrl] = useState('');
  const [evLevel, setEvLevel] = useState<EvidenceLevel>('Level B: Peer-reviewed Research');
  const [evMethodology, setEvMethodology] = useState<number>(4);
  const [evBias, setEvBias] = useState<'Neutral' | 'Low' | 'Medium' | 'High'>('Neutral');
  const [evConfidence, setEvConfidence] = useState<number>(85);
  const [evSummary, setEvSummary] = useState('');

  // Toast Notification
  const [notification, setNotification] = useState('');

  // Live queries
  const inquiries = useLiveQuery(() => db.researchInquiries.orderBy('updatedAt').reverse().toArray(), []) || [];
  const existingNotes = useLiveQuery(() => db.knowledge.toArray(), []) || [];

  // Metrics
  const metrics = useMemo(() => {
    const total = inquiries.length;
    let highConfidenceCount = 0;
    let decisionCount = 0;
    let totalScore = 0;

    for (const inq of inquiries) {
      if (inq.confidenceScore >= 90) highConfidenceCount++;
      if (inq.pipelineStage === 'Decision' || inq.pipelineStage === 'Archive') decisionCount++;
      totalScore += inq.confidenceScore || 0;
    }

    const avgConfidence = total > 0 ? Math.round(totalScore / total) : 0;
    return { total, highConfidenceCount, decisionCount, avgConfidence };
  }, [inquiries]);

  // Stage counts map
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const stage of PIPELINE_STAGES) {
      counts[stage] = 0;
    }
    for (const inq of inquiries) {
      if (counts[inq.pipelineStage] !== undefined) {
        counts[inq.pipelineStage]++;
      }
    }
    return counts;
  }, [inquiries]);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inq => {
      if (selectedStage !== 'all' && inq.pipelineStage !== selectedStage) return false;
      if (selectedDomain !== 'all' && inq.domain !== selectedDomain) return false;
      if (selectedEvidenceLevel !== 'all' && inq.overallEvidenceLevel !== selectedEvidenceLevel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = inq.title.toLowerCase().includes(q);
        const matchesObjective = inq.objective.toLowerCase().includes(q);
        const matchesSynthesis = inq.synthesis ? inq.synthesis.toLowerCase().includes(q) : false;
        const matchesTags = inq.tags ? inq.tags.some(t => t.toLowerCase().includes(q)) : false;
        return matchesTitle || matchesObjective || matchesSynthesis || matchesTags;
      }
      return true;
    });
  }, [inquiries, selectedStage, selectedDomain, selectedEvidenceLevel, searchQuery]);

  // Stage Advancement Handler
  const handleAdvanceStage = async (inquiryId: string, currentStage: ResearchPipelineStage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
    if (currentIndex < PIPELINE_STAGES.length - 1) {
      const nextStage = PIPELINE_STAGES[currentIndex + 1];
      const now = Date.now();
      await db.researchInquiries.update(inquiryId, {
        pipelineStage: nextStage,
        updatedAt: now
      });
      if (activeInquiry?.id === inquiryId) {
        setActiveInquiry({ ...activeInquiry, pipelineStage: nextStage, updatedAt: now });
      }
      setNotification(`Inquiry advanced to stage: ${nextStage}`);
    }
  };

  // Create New Inquiry
  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newObjective.trim()) return;

    const now = Date.now();
    const rawTags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    const resolvedTags = Array.from(new Set(['Research', newDomain.replace(/\s+/g, '-'), ...rawTags]));

    const newInquiry: ResearchInquiry = {
      id: `res-${now}`,
      title: newTitle.trim(),
      domain: newDomain,
      pipelineStage: 'Define Question',
      status: 'Active',
      objective: newObjective.trim(),
      background: newBackground.trim(),
      evidenceItems: [],
      overallEvidenceLevel: newEvidenceLevel,
      confidenceScore: 75,
      tags: resolvedTags,
      relatedKnowledgeIds: [],
      relatedProjectIds: [],
      createdAt: now,
      updatedAt: now
    };

    await db.researchInquiries.add(newInquiry);
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewObjective('');
    setNewBackground('');
    setActiveInquiry(newInquiry);
    setNotification(`Created research inquiry: "${newInquiry.title}"`);
  };

  // Add Evidence Item
  const handleAddEvidence = async () => {
    if (!activeInquiry || !evTitle.trim()) return;

    const newEvidence: ResearchEvidenceItem = {
      id: `ev-${Date.now()}`,
      title: evTitle.trim(),
      author: evAuthor.trim() || undefined,
      sourceUrl: evSourceUrl.trim() || undefined,
      level: evLevel,
      methodologyRigor: evMethodology,
      biasAssessment: evBias,
      confidenceScore: evConfidence,
      summary: evSummary.trim()
    };

    const updatedEvidence = [...(activeInquiry.evidenceItems || []), newEvidence];
    
    // Recalculate average confidence
    const avgConf = Math.round(
      updatedEvidence.reduce((acc, curr) => acc + curr.confidenceScore, 0) / updatedEvidence.length
    );

    const now = Date.now();
    await db.researchInquiries.update(activeInquiry.id, {
      evidenceItems: updatedEvidence,
      confidenceScore: avgConf,
      updatedAt: now
    });

    setActiveInquiry({
      ...activeInquiry,
      evidenceItems: updatedEvidence,
      confidenceScore: avgConf,
      updatedAt: now
    });

    setIsAddEvidenceOpen(false);
    setEvTitle('');
    setEvAuthor('');
    setEvSourceUrl('');
    setEvSummary('');
    setNotification('Added validated evidence item');
  };

  // 1-Click Vault Synthesis with [[Wikilinks]]
  const handleSynthesizeToVault = async (inquiry: ResearchInquiry) => {
    const now = Date.now();
    const dateIso = new Date().toISOString().split('T')[0];

    const evidenceMarkdown = (inquiry.evidenceItems || []).map(ev => 
      `- **[${ev.level}]** ${ev.title} (${ev.author || 'Unknown'}) — *Confidence: ${ev.confidenceScore}%*\n  > ${ev.summary}`
    ).join('\n\n');

    const noteContent = `---
type: Research Synthesis
domain: "${inquiry.domain}"
pipeline_stage: "${inquiry.pipelineStage}"
overall_evidence_level: "${inquiry.overallEvidenceLevel}"
confidence_score: ${inquiry.confidenceScore}%
synthesized_at: "${dateIso}"
tags:
  - Research-Synthesis
  - ${inquiry.domain.replace(/\s+/g, '-')}
---

# [[${inquiry.title}]] — Structured Research Synthesis

### Core Objective & Question
${inquiry.objective}

${inquiry.background ? `### Background Context\n${inquiry.background}\n` : ''}
### Validated Evidence Matrix (${inquiry.overallEvidenceLevel})
${evidenceMarkdown || '*No discrete evidence items logged.*'}

${inquiry.contradictions ? `### Contradictions & Counter-Arguments\n${inquiry.contradictions}\n` : ''}
### Synthesized Conclusion
${inquiry.synthesis || 'Synthesis in progress. Empirical data validated against canonical injunctions.'}

### Operational Decision & Action Items
${inquiry.decisionLog || 'Decision logged under Research Hub pipeline.'}

---
**Backlinks & Grounding:**
- Research Inquiry: [[${inquiry.title}]]
- Domain: [[${inquiry.domain}]]
- Research Hub: [[Research Hub]]
`;

    const newNoteId = `know-res-${now}`;
    await db.knowledge.add({
      id: newNoteId,
      title: `Synthesis: [[${inquiry.title}]]`,
      type: 'Note',
      content: noteContent,
      tags: ['Research-Synthesis', inquiry.domain.replace(/\s+/g, '-'), ...inquiry.tags],
      createdAt: now,
      updatedAt: now
    });

    const updatedRelated = Array.from(new Set([...(inquiry.relatedKnowledgeIds || []), newNoteId]));
    await db.researchInquiries.update(inquiry.id, {
      relatedKnowledgeIds: updatedRelated,
      status: 'Verified',
      updatedAt: now
    });

    if (activeInquiry?.id === inquiry.id) {
      setActiveInquiry({
        ...activeInquiry,
        relatedKnowledgeIds: updatedRelated,
        status: 'Verified',
        updatedAt: now
      });
    }

    setNotification(`Synthesized atomic note into Knowledge Vault with bidirectional [[wikilinks]]!`);
  };

  const handleDeleteInquiry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this research inquiry?')) return;
    await db.researchInquiries.delete(id);
    if (activeInquiry?.id === id) setActiveInquiry(null);
    setNotification('Research inquiry deleted');
  };

  // Helper color functions
  const getEvidenceColor = (level: EvidenceLevel) => {
    if (level.includes('Level A')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (level.includes('Level B')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (level.includes('Level C')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (level.includes('Level D')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 select-none">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#1e2336] border border-indigo-500/40 text-indigo-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b] shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <FlaskConical size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Structured Research Hub & Evidence Pipeline</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                  8-Stage Pipeline
                </span>
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Authentic Notion OS inquiry lifecycle • Evidence Confidence Levels A–E • Direct [[wikilink]] vault synthesis
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Research Inquiry</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
            <Layers size={14} className="text-indigo-400" />
            <span>Active Inquiries</span>
          </span>
          <span className="text-2xl font-bold text-white mt-1 font-mono">{metrics.total}</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} />
            <span>High Confidence (≥90%)</span>
          </span>
          <span className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{metrics.highConfidenceCount}</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-cyan-400 flex items-center gap-1.5 font-medium">
            <Award size={14} />
            <span>Average Evidence Score</span>
          </span>
          <span className="text-2xl font-bold text-cyan-300 mt-1 font-mono">{metrics.avgConfidence}%</span>
        </div>

        <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
            <Check size={14} />
            <span>Decisions Enacted</span>
          </span>
          <span className="text-2xl font-bold text-amber-300 mt-1 font-mono">{metrics.decisionCount}</span>
        </div>
      </div>

      {/* 8-Stage Research Pipeline Visualizer */}
      <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span className="font-semibold text-gray-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Research Lifecycle Stages</span>
          </span>
          <button
            onClick={() => setSelectedStage('all')}
            className={`text-[11px] px-2 py-0.5 rounded-lg ${selectedStage === 'all' ? 'text-indigo-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Show All Stages
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const count = stageCounts[stage] || 0;
            const isSelected = selectedStage === stage;
            return (
              <button
                key={stage}
                onClick={() => setSelectedStage(isSelected ? 'all' : stage)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#141622] border-[#272b3b] text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-gray-500">{idx + 1}.</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    count > 0 ? (isSelected ? 'bg-indigo-600 text-white' : 'bg-[#22283a] text-indigo-300 font-bold') : 'text-gray-600'
                  }`}>
                    {count}
                  </span>
                </div>
                <span className="text-[11px] font-semibold leading-tight truncate" title={stage}>
                  {stage}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181a24] p-3 rounded-2xl border border-[#272b3b]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain Filter */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-[#141622] border border-[#272b3b] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Domains</option>
            {RESEARCH_DOMAINS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Evidence Level Filter */}
          <select
            value={selectedEvidenceLevel}
            onChange={(e) => setSelectedEvidenceLevel(e.target.value)}
            className="bg-[#141622] border border-[#272b3b] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Evidence Levels (A–E)</option>
            {EVIDENCE_LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inquiries, synthesis, tags..."
            className="w-full bg-[#141622] border border-[#272b3b] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Grid: Research Inquiries Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInquiries.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 text-xs bg-[#181a24] border border-[#272b3b] rounded-2xl p-8">
            <FlaskConical size={42} className="mx-auto mb-3 text-gray-600" />
            <p className="font-semibold text-gray-300 text-sm">No research inquiries match this filter</p>
            <p className="mt-1">Click "New Research Inquiry" above to formulate an empirical investigation question.</p>
          </div>
        ) : (
          filteredInquiries.map(inq => {
            const stageIndex = PIPELINE_STAGES.indexOf(inq.pipelineStage);
            const isCompletedStage = inq.pipelineStage === 'Decision' || inq.pipelineStage === 'Archive';

            return (
              <div
                key={inq.id}
                onClick={() => setActiveInquiry(inq)}
                className="bg-[#181a24] border border-[#272b3b] hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 group transition-all shadow-sm cursor-pointer"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between text-[11px] mb-2.5">
                    <span className="font-mono bg-[#141622] px-2 py-0.5 rounded-lg border border-[#282d3e] text-indigo-300">
                      {inq.domain}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getEvidenceColor(inq.overallEvidenceLevel)}`}>
                      {inq.overallEvidenceLevel.split(':')[0]}
                    </span>
                  </div>

                  {/* Title & Objective */}
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                    {inq.title}
                  </h3>

                  <p className="text-xs text-gray-400 mt-2 line-clamp-3 font-serif leading-relaxed">
                    {inq.objective}
                  </p>

                  {/* Evidence Items & Confidence Bar */}
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-[#252a3b]">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-gray-400">
                        {inq.evidenceItems?.length || 0} Sources Verified
                      </span>
                      <span className="text-cyan-400 font-bold">
                        {inq.confidenceScore}% Confidence
                      </span>
                    </div>

                    <div className="w-full bg-[#141622] h-1.5 rounded-full overflow-hidden border border-[#272b3b]">
                      <div 
                        className="h-full bg-cyan-500 transition-all duration-300"
                        style={{ width: `${inq.confidenceScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pipeline Stage Bar & Actions */}
                <div className="pt-2 border-t border-[#252a3b] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-mono text-[10px]">
                      Stage {stageIndex + 1}/8: <strong className="text-white">{inq.pipelineStage}</strong>
                    </span>

                    {!isCompletedStage && (
                      <button
                        onClick={(e) => handleAdvanceStage(inq.id, inq.pipelineStage, e)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold hover:bg-[#202538] px-2 py-0.5 rounded-lg transition-colors"
                        title="Advance to next pipeline stage"
                      >
                        <span>Next Stage</span>
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSynthesizeToVault(inq);
                      }}
                      className="flex-1 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      title="Synthesize to Knowledge Vault with [[wikilinks]]"
                    >
                      <Sparkles size={12} />
                      <span>Synthesize to Vault</span>
                    </button>

                    <button
                      onClick={(e) => handleDeleteInquiry(inq.id, e)}
                      className="p-1.5 bg-[#141622] hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-xl border border-[#272b3b] text-xs"
                      title="Delete Inquiry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inquiry Detail & Evidence Inspector Modal */}
      {activeInquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#141622] border-b border-[#252a3b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400">
                  <FlaskConical size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {activeInquiry.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>{activeInquiry.domain}</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-300">Stage: {activeInquiry.pipelineStage}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveInquiry(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#202538]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Objective & Background */}
              <div className="space-y-2 bg-[#141622] p-4 rounded-xl border border-[#272b3b]">
                <h4 className="text-gray-300 font-bold flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-400" />
                  <span>Research Objective & Hypothesis</span>
                </h4>
                <p className="text-gray-200 font-serif leading-relaxed text-xs">
                  {activeInquiry.objective}
                </p>
                {activeInquiry.background && (
                  <p className="text-gray-400 text-[11px] pt-2 border-t border-[#252a3b]">
                    <strong>Background:</strong> {activeInquiry.background}
                  </p>
                )}
              </div>

              {/* Evidence Items Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-gray-200 font-bold flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-400" />
                    <span>Validated Evidence Sources ({activeInquiry.evidenceItems?.length || 0})</span>
                  </h4>

                  <button
                    onClick={() => setIsAddEvidenceOpen(true)}
                    className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Plus size={13} />
                    <span>Add Source Evidence</span>
                  </button>
                </div>

                {(!activeInquiry.evidenceItems || activeInquiry.evidenceItems.length === 0) ? (
                  <div className="p-4 text-center text-gray-500 bg-[#141622] rounded-xl border border-[#272b3b]">
                    No evidence items verified yet. Click "Add Source Evidence" above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeInquiry.evidenceItems.map((ev, i) => (
                      <div
                        key={ev.id || i}
                        className="bg-[#141622] border border-[#272b3b] rounded-xl p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getEvidenceColor(ev.level)}`}>
                            {ev.level}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">
                            {ev.confidenceScore}% Confidence • Rigor {ev.methodologyRigor}/5
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-xs">{ev.title}</h5>
                        {ev.author && (
                          <p className="text-[10px] text-gray-400">Author/Institute: {ev.author}</p>
                        )}
                        <p className="text-gray-300 font-serif text-[11px] leading-relaxed">
                          {ev.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contradictions & Counter-Arguments */}
              {activeInquiry.contradictions && (
                <div className="bg-[#1e1b18] border border-amber-500/20 p-3.5 rounded-xl space-y-1">
                  <h4 className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle size={14} />
                    <span>Contradictions & Critical Counter-Arguments</span>
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {activeInquiry.contradictions}
                  </p>
                </div>
              )}

              {/* Synthesis & Decision Log */}
              <div className="space-y-3 bg-[#141622] p-4 rounded-xl border border-[#272b3b]">
                <h4 className="text-gray-200 font-bold flex items-center gap-1.5">
                  <Award size={15} className="text-indigo-400" />
                  <span>Synthesized Decision Log & Action Items</span>
                </h4>
                <p className="text-gray-300 font-serif text-xs leading-relaxed">
                  {activeInquiry.decisionLog || 'No operational decision finalized yet. Advance through the pipeline to Synthesize stage.'}
                </p>

                {activeInquiry.relatedKnowledgeIds?.length > 0 && (
                  <div className="pt-2 border-t border-[#252a3b] flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400">Linked Vault Syntheses:</span>
                    {activeInquiry.relatedKnowledgeIds.map(kid => (
                      <span key={kid} className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        [[${kid}]]
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#141622] border-t border-[#252a3b] flex items-center justify-between">
              <button
                onClick={() => handleAdvanceStage(activeInquiry.id, activeInquiry.pipelineStage)}
                className="bg-[#202538] hover:bg-[#282f48] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>Advance Stage ({activeInquiry.pipelineStage})</span>
                <ChevronRight size={14} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInquiry(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#202538]"
                >
                  Close
                </button>
                <button
                  onClick={() => handleSynthesizeToVault(activeInquiry)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Synthesize to Knowledge Vault</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {isAddEvidenceOpen && activeInquiry && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="p-4 bg-[#141622] border-b border-[#252a3b] flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Add Validated Evidence Source</span>
              </h3>
              <button onClick={() => setIsAddEvidenceOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Source Title / Reference</label>
                <input
                  type="text"
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="e.g. Clinical trial on Ashwagandha in sub-zero altitudes"
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Author / Institute</label>
                  <input
                    type="text"
                    value={evAuthor}
                    onChange={(e) => setEvAuthor(e.target.value)}
                    placeholder="e.g. AIIA, Dr. Vasant Lad"
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Evidence Level</label>
                  <select
                    value={evLevel}
                    onChange={(e) => setEvLevel(e.target.value as EvidenceLevel)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EVIDENCE_LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Methodology Rigor (1-5)</label>
                  <select
                    value={evMethodology}
                    onChange={(e) => setEvMethodology(Number(e.target.value))}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={5}>5 - Gold Standard / Canonical</option>
                    <option value={4}>4 - High Rigor Trial</option>
                    <option value={3}>3 - Observational Study</option>
                    <option value={2}>2 - Expert Commentary</option>
                    <option value={1}>1 - Anecdotal / Preliminary</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Confidence Score ({evConfidence}%)</label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={evConfidence}
                    onChange={(e) => setEvConfidence(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Key Evidence Summary & Excerpt</label>
                <textarea
                  rows={3}
                  value={evSummary}
                  onChange={(e) => setEvSummary(e.target.value)}
                  placeholder="Key empirical findings, statistical significance, or canonical verse..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-[#141622] border-t border-[#252a3b] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddEvidenceOpen(false)}
                className="px-3.5 py-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#202538]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvidence}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-xl shadow-sm"
              >
                Save Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Research Inquiry Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#181a24] border border-[#272b3b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="p-4 bg-[#141622] border-b border-[#252a3b] flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" />
                <span>Formulate New Research Inquiry</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInquiry} className="p-5 space-y-3.5">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Core Research Question / Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Snehana temperature compensation protocols in high altitudes"
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Research Domain</label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value as ResearchDomain)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {RESEARCH_DOMAINS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Initial Evidence Level</label>
                  <select
                    value={newEvidenceLevel}
                    onChange={(e) => setNewEvidenceLevel(e.target.value as EvidenceLevel)}
                    className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EVIDENCE_LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Objective & Investigation Hypothesis</label>
                <textarea
                  required
                  rows={3}
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="What empirical or scriptural question are you testing? What is the expected outcome?"
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-serif"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Background Context (Optional)</label>
                <textarea
                  rows={2}
                  value={newBackground}
                  onChange={(e) => setNewBackground(e.target.value)}
                  placeholder="Prior research, canonical context, or field conditions..."
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Ayurveda, Panchakarma, Protocol"
                  className="w-full bg-[#141622] border border-[#272b3b] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-[#252a3b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3.5 py-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-[#202538]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-xl shadow-sm"
                >
                  Create Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
