import { db, type KnowledgeItem, type TaskItem, type GoalItem, type IngestionCandidate } from '../db';
import type { RawCorpusDoc } from '../data/authenticCorpusArchive';

export interface IngestionPreview {
  totalFiles: number;
  totalBytes: number;
  concepts: Array<{ id: string; title: string; category: string; type: KnowledgeItem['type']; tags: string[] }>;
  tasks: Array<{ id: string; title: string; quadrant: TaskItem['quadrant']; energy: TaskItem['energyRequired']; source: string }>;
  goals: Array<{ id: string; title: string; level: GoalItem['level']; lifeArea: GoalItem['lifeArea'] }>;
}

export interface IngestionSummaryReport {
  timestamp: number;
  docsProcessed: number;
  conceptsIngested: number;
  tasksIngested: number;
  goalsIngested: number;
  wikilinksFormed: number;
  totalBytesProcessed: number;
  durationMs: number;
}

// Dynamic on-demand loader to keep initial bundle size lean (< 650 kB)
let cachedDocs: RawCorpusDoc[] | null = null;
export async function getCorpusDocs(): Promise<RawCorpusDoc[]> {
  if (!cachedDocs) {
    const mod = await import('../data/authenticCorpusArchive');
    cachedDocs = mod.AUTHENTIC_CORPUS_DOCS;
  }
  return cachedDocs;
}

function makeStableId(prefix: string, str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const safeTitle = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
  return `${prefix}-${safeTitle}-${hex}`;
}

export async function analyzeCorpusCandidates(): Promise<IngestionPreview> {
  const docs = await getCorpusDocs();
  const concepts: IngestionPreview['concepts'] = [];
  const tasks: IngestionPreview['tasks'] = [];
  const goals: IngestionPreview['goals'] = [];
  let totalBytes = 0;

  for (const doc of docs) {
    totalBytes += doc.byteLength;
    const baseTags = deriveTagsFromDoc(doc);

    concepts.push({
      id: makeStableId('concept', doc.title),
      title: doc.title,
      category: doc.category,
      type: doc.category === 'Notion OS Module' ? 'Note' : 'Concept',
      tags: baseTags
    });

    const extractedTasks = extractTasksFromContent(doc);
    tasks.push(...extractedTasks);

    if (doc.filename.includes('Goals')) {
      const extractedGoals = extractGoalsFromContent(doc);
      goals.push(...extractedGoals);
    }
  }

  return {
    totalFiles: docs.length,
    totalBytes,
    concepts,
    tasks,
    goals
  };
}

export async function runBatchCorpusIngestion(
  onProgress?: (step: string, percent: number) => void
): Promise<IngestionSummaryReport> {
  const startTime = Date.now();
  onProgress?.('Loading 40 authentic markdown archives on-demand...', 10);

  const docs = await getCorpusDocs();
  const knowledgeItems: KnowledgeItem[] = [];
  const taskItems: TaskItem[] = [];
  const goalItems: GoalItem[] = [];
  let wikilinksCount = 0;

  const coreConceptTitles = docs.map(d => d.title.trim()).filter(t => t.length > 3);
  coreConceptTitles.push(
    'Vivarta Vada',
    'Mati Vivek',
    'Uttarkashi Land',
    'Khasra Diligence',
    'Pranayama',
    'Shankara Bhashya',
    'Prasthanatrayi',
    'Eisenhower Matrix',
    'Knowledge Vault',
    'Life Pyramid'
  );

  onProgress?.('Extracting concepts, tasks, and goals...', 30);

  for (const doc of docs) {
    const now = Date.now();
    const baseTags = deriveTagsFromDoc(doc);

    let linkedContent = doc.content;
    for (const term of coreConceptTitles) {
      if (term.toLowerCase() === doc.title.toLowerCase()) continue;
      const regex = new RegExp(`(?<!\\[\\[)\\b(${escapeRegex(term)})\\b(?!\\]\\])`, 'gi');
      if (regex.test(linkedContent)) {
        wikilinksCount++;
        linkedContent = linkedContent.replace(regex, '[[$1]]');
      }
    }

    knowledgeItems.push({
      id: makeStableId('kn', doc.title),
      title: doc.title,
      type: doc.category === 'Notion OS Module' ? 'Note' : 'Concept',
      content: linkedContent,
      tags: baseTags,
      sourceUrl: doc.notionId ? `notion://id/${doc.notionId}` : `local://${doc.filename}`,
      createdAt: now,
      updatedAt: now
    });

    if (doc.byteLength > 40000) {
      const subSections = extractSubSections(doc, baseTags);
      knowledgeItems.push(...subSections);
    }

    const tasks = extractTasksFromContent(doc);
    for (const t of tasks) {
      const isUrgent = t.quadrant === 'Q1';
      taskItems.push({
        id: t.id,
        title: t.title,
        status: 'To Do',
        priority: isUrgent ? 'Urgent & Important' : 'Important Not Urgent',
        quadrant: t.quadrant,
        urgency: isUrgent ? 'High' : 'Medium',
        impact: 'High',
        energyRequired: t.energy,
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      });
    }

    if (doc.filename.includes('Goals')) {
      const goals = extractGoalsFromContent(doc);
      for (const g of goals) {
        goalItems.push({
          id: g.id,
          title: g.title,
          level: g.level,
          status: 'Active',
          progress: 25,
          lifeArea: g.lifeArea,
          createdAt: now,
          updatedAt: now
        });
      }
    }
  }

  onProgress?.(`Writing ${knowledgeItems.length} concepts, ${taskItems.length} tasks, and ${goalItems.length} goals into Dexie...`, 70);

  await db.transaction('rw', [db.knowledge, db.tasks, db.goals], async () => {
    for (const item of knowledgeItems) {
      await db.knowledge.put(item);
    }
    for (const t of taskItems) {
      await db.tasks.put(t);
    }
    for (const g of goalItems) {
      await db.goals.put(g);
    }
  });

  onProgress?.('Corpus Ingestion complete!', 100);

  const durationMs = Date.now() - startTime;
  return {
    timestamp: Date.now(),
    docsProcessed: docs.length,
    conceptsIngested: knowledgeItems.length,
    tasksIngested: taskItems.length,
    goalsIngested: goalItems.length,
    wikilinksFormed: wikilinksCount,
    totalBytesProcessed: docs.reduce((acc, d) => acc + d.byteLength, 0),
    durationMs
  };
}

function deriveTagsFromDoc(doc: RawCorpusDoc): string[] {
  const tags: string[] = [doc.category === 'Notion OS Module' ? 'Notion-OS' : 'My-Notes'];
  const name = doc.filename.toLowerCase();

  if (name.includes('mati vivek')) tags.push('Mati-Vivek', 'Vedanta', 'Philosophy', 'Dialogue');
  else if (name.includes('vivarta')) tags.push('Vivarta-Vada', 'Causation', 'Vedanta', 'Darshana');
  else if (name.includes('uttarkashi')) tags.push('Uttarkashi', 'Land-Diligence', 'Himalayas', 'Sanctuary');
  else if (name.includes('task')) tags.push('Task-Intelligence', 'Productivity', 'Eisenhower');
  else if (name.includes('goals')) tags.push('Life-Pyramid', 'Goals', 'Vision');
  else if (name.includes('journal')) tags.push('Journal', 'Reflection', 'Daily-Review');
  else if (name.includes('health')) tags.push('Health', 'Ayurveda', 'Dinacharya');
  else if (name.includes('kitchen') || name.includes('pantry')) tags.push('Kitchen', 'Pantry', 'Household');
  else if (name.includes('astrology')) tags.push('Jyotish', 'Astrology', 'Sadhana');
  else if (name.includes('protocol')) tags.push('OKTP', 'Protocol', 'AI-Ingestion');
  else tags.push('Core-Module');

  return tags;
}

function extractTasksFromContent(doc: RawCorpusDoc): IngestionPreview['tasks'] {
  const tasks: IngestionPreview['tasks'] = [];
  const lines = doc.content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const checkMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)$/);
    const actionMatch = line.match(/^(\d+)\.\s+(.+\b(?:verify|check|clearance|owner|title|permissible|mutation|apply|books|plants|study)\b.*)$/i);

    if (checkMatch) {
      const title = checkMatch[2].replace(/<[^>]+>/g, '').trim();
      if (title.length > 5) {
        tasks.push({
          id: makeStableId('task', `${doc.title}-${title}`),
          title,
          quadrant: determineQuadrant(title),
          energy: title.length > 40 ? 'Deep Work' : 'Quick Win',
          source: doc.title
        });
      }
    } else if (actionMatch && (doc.filename.includes('Uttarkashi') || doc.filename.includes('To do'))) {
      const title = actionMatch[2].replace(/<[^>]+>/g, '').trim();
      if (title.length > 8 && title.length < 140) {
        tasks.push({
          id: makeStableId('task', `${doc.title}-${title}`),
          title,
          quadrant: determineQuadrant(title),
          energy: 'Deep Work',
          source: doc.title
        });
      }
    }
  }

  return tasks.slice(0, 15);
}

function determineQuadrant(title: string): TaskItem['quadrant'] {
  const t = title.toLowerCase();
  if (t.includes('legal') || t.includes('clearance') || t.includes('verify') || t.includes('urgent') || t.includes('owner')) {
    return 'Q1';
  }
  if (t.includes('read') || t.includes('study') || t.includes('sadhana') || t.includes('protocol') || t.includes('plan')) {
    return 'Q2';
  }
  if (t.includes('buy') || t.includes('fix') || t.includes('clean') || t.includes('table') || t.includes('call')) {
    return 'Q3';
  }
  return 'Q4';
}

function extractGoalsFromContent(_doc: RawCorpusDoc): IngestionPreview['goals'] {
  return [
    {
      id: makeStableId('goal', 'Moksha & Spiritual Realization'),
      title: 'Moksha & Spiritual Self-Realization (Vedantic Vivek)',
      level: 'Life Vision',
      lifeArea: 'Spiritual & Inner'
    },
    {
      id: makeStableId('goal', 'Himalayan Sanctuary Establishment'),
      title: 'Establish Himalayan Sanctuary in Uttarkashi (Clear Title & Off-Grid Autonomy)',
      level: '10-Year',
      lifeArea: 'Wealth & Assets'
    },
    {
      id: makeStableId('goal', 'Ayurvedic & Dinacharya Mastery'),
      title: 'Cultivate Dinacharya, Prana Harmony, and Ayurvedic Vitality',
      level: '5-Year',
      lifeArea: 'Health & Vitality'
    },
    {
      id: makeStableId('goal', 'Digital Sovereignty with Om OS'),
      title: 'Complete 100% Local-First Digital Sovereignty across all 24 Modules',
      level: '1-Year',
      lifeArea: 'Career & Skills'
    },
    {
      id: makeStableId('goal', 'Family & Homestead Abundance'),
      title: 'Flourishing Household Harmony, Kitchen Pantry Resilience & Study Space',
      level: 'Quarterly OKR',
      lifeArea: 'Family & Relationships'
    }
  ];
}

function extractSubSections(doc: RawCorpusDoc, baseTags: string[]): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const sections = doc.content.split(/^##\s+/gm);

  for (const sec of sections) {
    const lines = sec.trim().split('\n');
    const header = lines[0]?.trim();
    const body = lines.slice(1).join('\n').trim();

    if (header && body.length > 200 && !header.includes('Content') && !header.includes('Properties')) {
      const title = `${doc.title}: ${header.replace(/<[^>]+>/g, '').trim()}`;
      items.push({
        id: makeStableId('kn-sub', title),
        title,
        type: 'Concept',
        content: body,
        tags: [...baseTags, 'Atomic-Decomposition'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }

  return items.slice(0, 6);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Processes a single transcript turn according to TASK-18 Ingestion Engine specs.
 * Shields code blocks, extracts Task candidates via imperative verbs/checkboxes,
 * extracts Concept candidates via markdown headings, and returns structured IngestionCandidate records.
 */
export function processTranscriptTurn(turnText: string, sourceFile = 'Universal-Inbox-Turn'): IngestionCandidate[] {
  // Step 1: Shield code blocks using regex mask
  const codeBlocks: string[] = [];
  const maskedText = turnText.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  const candidates: IngestionCandidate[] = [];

  const restoreCodeBlocks = (text: string): string => {
    return text.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)] || '');
  };

  const cleanMarkdown = (str: string): string => {
    return str.replace(/^[#*-\s\[\]xX]+|[:*]+$/g, '').trim();
  };

  const determineQuadrant = (line: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' => {
    const lower = line.toLowerCase();
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('bug') || lower.includes('asap') || lower.includes('fix')) {
      return 'Q1';
    }
    if (lower.includes('delegate') || lower.includes('ask') || lower.includes('send') || lower.includes('email')) {
      return 'Q3';
    }
    return 'Q2';
  };

  const calculateScore = (str: string): number => {
    let score = 0.7;
    if (str.length > 30) score += 0.15;
    if (/\[[ xX]\]/.test(str)) score += 0.1;
    return Math.min(1.0, score);
  };

  // Step 2: Extract Task Candidates via Imperative Verbs and Checklist Tokens
  const lines = maskedText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[-*]\s*\[([ xX])\]/.test(line) || /^(TODO|ACTION|NEXT STEP|TASK):/i.test(line) || /^[-*]\s+(Implement|Build|Fix|Verify|Audit|Deploy|Update|Refactor|Design|Add)\b/i.test(line)) {
      candidates.push({
        id: makeStableId('task-cand', line),
        sourceFile,
        turnRole: 'assistant',
        score: calculateScore(line),
        rawText: restoreCodeBlocks(line),
        suggestedType: 'Task',
        extractedMetadata: {
          title: cleanMarkdown(line),
          quadrant: determineQuadrant(line),
          energyLevel: line.length > 50 ? 'Deep Work' : 'Quick Win',
          tags: ['Extracted-Task', 'AI-Ingestion']
        },
        approvalStatus: 'Pending'
      });
    }
  }

  // Step 3: Extract Conceptual Headings and Wikilinks
  const headingMatches = maskedText.match(/^(#{1,3})\s+(.+)$/gm);
  if (headingMatches) {
    for (const heading of headingMatches) {
      const cleanTitle = cleanMarkdown(heading);
      if (cleanTitle.length > 4 && !cleanTitle.toLowerCase().startsWith('step ') && !cleanTitle.toLowerCase().startsWith('action')) {
        candidates.push({
          id: makeStableId('concept-cand', cleanTitle),
          sourceFile,
          turnRole: 'assistant',
          score: calculateScore(heading),
          rawText: restoreCodeBlocks(heading),
          suggestedType: 'Concept',
          extractedMetadata: {
            title: cleanTitle,
            tags: ['Extracted-Concept', 'Knowledge-Vault']
          },
          approvalStatus: 'Pending'
        });
      }
    }
  }

  return candidates;
}
