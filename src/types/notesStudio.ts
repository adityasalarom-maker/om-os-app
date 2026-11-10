// File: om_os_app/src/types/notesStudio.ts

export type NoteDomain =
  | 'AI_ENGINE'        // Prompts, protocols, agent rules (compare & copy)
  | 'KNOWLEDGE_HUB'    // Projects, AI notes, YouTube verbatim, PDF extracts
  | 'RAW_SCRATCHPAD'   // Misc chat/IDE/Codex text in Notepad table format
  | 'TAXONOMY_LEXICON' // Canonicals, Vedic & AI terminology to learn/use
  | 'PATH_DIRECTORY'   // Selected PC/Laptop/App folders & file structure map
  | 'DAILY_PULSE';     // Daily checklists: Daily AI, Work, List, Special, Remember, Learn, Ponder

export type DailyPulseCategory =
  | 'Daily_AI'
  | 'Work'
  | 'List'
  | 'Special'
  | 'Remember'
  | 'Learn'
  | 'Ponder';

export type StudioViewStyle =
  | 'EDITOR_BLOCKS'    // Phase 1: Rich Markdown + Collapsible Toggles + Copy Prompt Blocks
  | 'NOTEPAD_TABLE'    // Phase 2: Windows Notepad style table + Pure-code AI prompt wrapper
  | 'DIRECTORY_MAP'    // Phase 2: Selected PC/Laptop target folder registry
  | 'CHECKLIST_BOARD'  // Interactive daily checklist items
  | 'COMPACT_CARDS';   // High-density comparison cards

export type SplitLayoutMode =
  | 'SINGLE_PANE'       // 1 full-width note
  | 'TWO_PLUS_BOTTOM'   // 2 Vertical Columns + 1 Horizontal Bottom Dock
  | 'THREE_PLUS_BOTTOM' // Upload 2 Sketch 2: 3 Vertical Columns + 1 Horizontal Bottom Dock
  | 'GRID_3X2';         // 3x2 Grid (up to 6 simultaneous collapsible panes)

export interface CopyablePromptBlock {
  id: string;
  title: string;
  blockType: 'Prompt' | 'Protocol' | 'Code' | 'Canonical' | 'Extract';
  content: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  bucket: DailyPulseCategory;
}

export interface ScratchpadTableRow {
  id: string;
  selected: boolean;
  capturedText: string;
  source: string; // e.g., "ChatGPT Go", "Gemini", "Antigravity IDE", "YouTube"
  intent: 'Clarify' | 'Understand' | 'Ask' | 'Audit' | 'Synthesize';
  notes: string;
}

export interface TargetFolderEntry {
  id: string;
  device: 'Windows_PC' | 'Laptop_SSD' | 'Om_OS_App' | 'S25_Ultra';
  folderPath: string;
  mainCategory: string;
  subCategory: string;
  whatIsInside: string;
  lastVerified: string;
}

export interface StudioAnnotation {
  id: string;
  noteId: string;
  noteTitle?: string;
  selectedText: string;
  comment: string;
  intent: 'Clarify' | 'Refactor' | 'Audit' | 'Explain' | 'Ask AI';
  resolved: boolean;
  createdAt: string;
}

export interface CollapsibleGroupConfig {
  id: string;
  icon: string;
  title: string;
  whatIsHereBrief: string; // Upload 1: "What is here: ..."
  tabs: { id: string; label: string; icon: string; summaryLine: string }[];
}

export interface StudioNote {
  id: string;
  title: string;
  briefBeneath: string; // Upload 1: Brief description shown beneath collapsible header
  domain: NoteDomain;
  mainCategory: string;
  subCategory: string;
  dailyCategory?: DailyPulseCategory;
  tags: string[];
  properties: Record<string, string>; // Notion-style extensible properties
  viewStyle: StudioViewStyle;
  content: string;
  copyBlocks: CopyablePromptBlock[];
  tableRows: ScratchpadTableRow[];
  checklistItems: ChecklistItem[];
  targetFolders: TargetFolderEntry[];
  annotations?: StudioAnnotation[];
  isPinned: boolean;
  isArchived: boolean;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontSizePx?: number; // Granular font size range 8px to 20px
  wordWrap: boolean;
  undoStack: string[]; // Max 5 snapshots
  redoStack: string[]; // Max 5 snapshots
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
}

/**
 * Pure TypeScript Levenshtein Distance for Approximate / Fuzzy Search (Zero Dependencies)
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const dp: number[][] = Array.from({ length: s1.length + 1 }, (_, i) =>
    Array.from({ length: s2.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[s1.length][s2.length];
}

/**
 * Dual Search Engine: Supports Exact Phrase Match AND Approximate/Fuzzy Match
 */
export function matchesNoteSearch(
  note: StudioNote,
  rawQuery: string,
  mode: 'EXACT' | 'APPROXIMATE'
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const searchableCorpus = [
    note.title,
    note.briefBeneath,
    note.domain,
    note.mainCategory,
    note.subCategory,
    note.content,
    ...note.tags,
    ...Object.entries(note.properties).map(([k, v]) => `${k}:${v}`),
    ...note.copyBlocks.map((b) => `${b.title} ${b.content}`),
    ...note.tableRows.map((r) => `${r.capturedText} ${r.source} ${r.notes}`),
    ...note.targetFolders.map((f) => `${f.folderPath} ${f.whatIsInside}`)
  ]
    .join(' ')
    .toLowerCase();

  // 1. Exact Phrase Match (or quoted string)
  const cleanExact = q.replace(/^"|"$/g, '');
  if (searchableCorpus.includes(cleanExact)) {
    return true;
  }
  if (mode === 'EXACT') {
    return false;
  }

  // 2. Approximate / Estimated Fuzzy Match (Token-level Levenshtein <= 2)
  const queryTokens = cleanExact.split(/\s+/).filter(Boolean);
  const corpusWords = searchableCorpus.split(/[^a-z0-9_]+/).filter((w) => w.length > 2);

  return queryTokens.every((qToken) => {
    if (searchableCorpus.includes(qToken)) return true;
    if (qToken.length < 4) return false;
    const maxDist = qToken.length >= 7 ? 2 : 1;
    return corpusWords.some(
      (word) =>
        Math.abs(word.length - qToken.length) <= maxDist &&
        levenshteinDistance(qToken, word) <= maxDist
    );
  });
}

/**
 * 100% Pure-Code Deterministic AI Re-Feed Prompt Formatter (Zero AI API usage)
 */
export function buildPureCodeAiPrompt(
  rows: ScratchpadTableRow[],
  customHeader?: string
): string {
  const activeRows = rows.filter((r) => r.selected);
  const targetRows = activeRows.length > 0 ? activeRows : rows;

  const lines: string[] = [
    customHeader ||
      '### [STRUCTURED AI AUDIT & CLARIFICATION REQUEST — GENERATED FROM NOTES STUDIO]',
    'Please process the following captured snippets according to their specified Action Intent (Clarify / Understand / Ask / Audit / Synthesize):',
    '',
    '| # | Action Intent | Source | Captured Text / Data | User Context / Question |',
    '| :--- | :--- | :--- | :--- | :--- |'
  ];

  targetRows.forEach((row, idx) => {
    const safeText = row.capturedText.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
    const safeNotes = row.notes.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
    lines.push(
      `| ${idx + 1} | **${row.intent.toUpperCase()}** | ${row.source} | ${safeText} | ${safeNotes || 'Analyze & explain clearly'} |`
    );
  });

  lines.push(
    '',
    '**Output Instructions:**',
    '1. Address each row by its index number (#).',
    '2. Provide a direct, source-grounded explanation or audit without filler.',
    '3. Extract reusable canonical terms or action items at the end.'
  );

  return lines.join('\n');
}

/**
 * Compiles active note annotations into a structured AI review & refactoring prompt (ChatGPT / Claude / Codex ready)
 */
export function buildAnnotationAiPrompt(annotations: StudioAnnotation[]): string {
  const activeAnnotations = annotations.filter((a) => !a.resolved);
  const target = activeAnnotations.length > 0 ? activeAnnotations : annotations;

  const lines: string[] = [
    '# [CODE & NOTES TARGETED AI ANNOTATION REVIEW REQUEST]',
    'The following snippets have been highlighted and annotated in Om Knowledge OS Notes Studio. Please review each item according to its specified intent:',
    ''
  ];

  target.forEach((ann, idx) => {
    lines.push(`### Item ${idx + 1}: [${ann.intent.toUpperCase()}] in "${ann.noteTitle || 'Active Note'}"`);
    lines.push('**Highlighted Code / Snippet:**');
    lines.push('```');
    lines.push(ann.selectedText);
    lines.push('```');
    lines.push(`**User Note / Question:** ${ann.comment}`);
    lines.push('');
  });

  lines.push('**Directives for AI Response:**');
  lines.push('1. Provide targeted code replacements or localized explanations for each highlighted snippet.');
  lines.push('2. Explain the architectural trade-offs or rationale clearly.');
  lines.push('3. Provide production-grade, drop-in replacement snippets.');

  return lines.join('\n');
}
