import { db, type KnowledgeItem } from '../db';

export interface GraphNode {
  id: string;
  label: string;
  type: KnowledgeItem['type'] | 'Concept';
  tags: string[];
  linkCount: number;
  isVirtual?: boolean; // referenced in [[wikilink]] but not yet an atomic note
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
  color?: string;
}

export interface GraphLink {
  source: string; // node id
  target: string; // node id
  sourceLabel: string;
  targetLabel: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface BacklinkItem {
  sourceNote: KnowledgeItem;
  snippet: string;
}

export interface UnlinkedMentionItem {
  sourceNote: KnowledgeItem;
  snippet: string;
  matchIndex: number;
}

// Regex to capture [[Target Title]] or [[Target Title | Display Alias]]
export const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Extracts all wikilink target titles from text.
 */
export const extractWikilinks = (text: string): string[] => {
  if (!text) return [];
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(WIKILINK_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    const targetTitle = match[1].trim();
    if (targetTitle && !matches.includes(targetTitle)) {
      matches.push(targetTitle);
    }
  }
  return matches;
};

/**
 * Builds the complete semantic graph dataset from knowledge items.
 */
export const buildKnowledgeGraph = (notes: KnowledgeItem[]): GraphData => {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const titleToIdMap = new Map<string, string>();

  // 1. Populate real note nodes
  for (const note of notes) {
    titleToIdMap.set(note.title.trim().toLowerCase(), note.id);
    nodesMap.set(note.id, {
      id: note.id,
      label: note.title,
      type: note.type,
      tags: note.tags || [],
      linkCount: 0,
      isVirtual: false
    });
  }

  // 2. Extract links and discover virtual concept nodes
  for (const note of notes) {
    const rawContent = note.content || '';
    const targets = extractWikilinks(rawContent);

    for (const targetTitle of targets) {
      const lowerTarget = targetTitle.toLowerCase();
      let targetNodeId = titleToIdMap.get(lowerTarget);

      // If target title is not an existing note, create a virtual concept node
      if (!targetNodeId) {
        targetNodeId = `concept-${lowerTarget.replace(/\s+/g, '-')}`;
        titleToIdMap.set(lowerTarget, targetNodeId);
        nodesMap.set(targetNodeId, {
          id: targetNodeId,
          label: targetTitle,
          type: 'Concept',
          tags: ['uncreated-concept'],
          linkCount: 0,
          isVirtual: true
        });
      }

      // Add link (avoid self-links)
      if (note.id !== targetNodeId) {
        links.push({
          source: note.id,
          target: targetNodeId,
          sourceLabel: note.title,
          targetLabel: targetTitle
        });

        // Increment link counts for node sizing
        const sourceNode = nodesMap.get(note.id);
        const targetNode = nodesMap.get(targetNodeId);
        if (sourceNode) sourceNode.linkCount++;
        if (targetNode) targetNode.linkCount++;
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links
  };
};

/**
 * Extracts context snippet surrounding a search phrase or match.
 */
export const extractContextSnippet = (text: string, phrase: string): string => {
  if (!text || !phrase) return '';
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  const idx = lowerText.indexOf(lowerPhrase);
  if (idx === -1) return text.slice(0, 100);

  const start = Math.max(0, idx - 45);
  const end = Math.min(text.length, idx + phrase.length + 55);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return prefix + text.slice(start, end).replace(/\n/g, ' ') + suffix;
};

/**
 * Finds all notes that link to the active note via [[wikilink]].
 */
export const getBacklinksForNote = (
  targetNote: KnowledgeItem,
  allNotes: KnowledgeItem[]
): BacklinkItem[] => {
  const backlinks: BacklinkItem[] = [];
  const targetTitleLower = targetNote.title.trim().toLowerCase();

  for (const sourceNote of allNotes) {
    if (sourceNote.id === targetNote.id) continue;

    const wikilinks = extractWikilinks(sourceNote.content || '');
    const hasLink = wikilinks.some(link => link.toLowerCase() === targetTitleLower);

    if (hasLink) {
      const snippet = extractContextSnippet(sourceNote.content || '', targetNote.title);
      backlinks.push({
        sourceNote,
        snippet
      });
    }
  }

  return backlinks;
};

/**
 * Finds all unlinked mentions: notes that contain the title of targetNote in plain text,
 * but do not have it wrapped in [[...]].
 */
export const getUnlinkedMentionsForNote = (
  targetNote: KnowledgeItem,
  allNotes: KnowledgeItem[]
): UnlinkedMentionItem[] => {
  const unlinkedMentions: UnlinkedMentionItem[] = [];
  const targetTitle = targetNote.title.trim();
  if (targetTitle.length < 3) return []; // avoid matching tiny single words

  const escapedTitle = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match word boundary to avoid partial sub-word collisions
  const mentionRegex = new RegExp(`(?<!\\[\\[)\\b${escapedTitle}\\b(?!\\]\\])`, 'gi');

  for (const sourceNote of allNotes) {
    if (sourceNote.id === targetNote.id) continue;
    const content = sourceNote.content || '';

    // Check if there is an unlinked mention
    const match = mentionRegex.exec(content);
    if (match) {
      const snippet = extractContextSnippet(content, targetTitle);
      unlinkedMentions.push({
        sourceNote,
        snippet,
        matchIndex: match.index
      });
    }
    mentionRegex.lastIndex = 0; // reset regex state
  }

  return unlinkedMentions;
};

/**
 * Converts a plain-text mention into an explicit [[wikilink]] in Dexie.
 */
export const convertMentionToWikilink = async (
  sourceNoteId: string,
  targetTitle: string
): Promise<boolean> => {
  const sourceNote = await db.knowledge.get(sourceNoteId);
  if (!sourceNote || !sourceNote.content) return false;

  const escapedTitle = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentionRegex = new RegExp(`(?<!\\[\\[)\\b(${escapedTitle})\\b(?!\\]\\])`, 'i');

  const updatedContent = sourceNote.content.replace(mentionRegex, '[[$1]]');
  if (updatedContent !== sourceNote.content) {
    await db.knowledge.update(sourceNoteId, {
      content: updatedContent,
      updatedAt: Date.now()
    });
    return true;
  }

  return false;
};


// ---------------------------------------------------------------------------
// VAULT-WIDE BIDIRECTIONAL AUTO-LINKER & UNLINKED MENTIONS ENGINE (Milestone D)
// ---------------------------------------------------------------------------

export interface VaultUnlinkedMention {
  id: string; // unique key: `${sourceNoteId}-${targetNoteId}-${startIndex}`
  sourceNoteId: string;
  sourceNoteTitle: string;
  targetNoteId: string;
  targetTitle: string;
  matchedText: string;
  snippet: string;
  startIndex: number;
  endIndex: number;
}

export interface VaultUnlinkedScanResult {
  totalMentions: number;
  distinctTargetsCount: number;
  mentions: VaultUnlinkedMention[];
  byTargetTitle: Record<string, VaultUnlinkedMention[]>;
}

export interface AutoLinkExecutionResult {
  updatedNotesCount: number;
  linksCreatedCount: number;
  details: {
    noteId: string;
    noteTitle: string;
    linksAdded: string[];
  }[];
}

/**
 * Computes protected text ranges that must not have plain mentions converted:
 * - YAML frontmatter: ^---...---
 * - Code blocks: ```...```
 * - Inline code: `...`
 * - Existing wikilinks: [[...]]
 * - Markdown links: [...](...)
 * - URLs: https?://...
 */
export function getProtectedRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];

  // Frontmatter
  const fmMatch = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (fmMatch) {
    ranges.push([0, fmMatch[0].length]);
  }

  // Code blocks ```...```
  const codeBlockRegex = /```[\s\S]*?```/g;
  let m: RegExpExecArray | null;
  while ((m = codeBlockRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  // Inline code `...`
  const inlineCodeRegex = /`[^`\n]+`/g;
  while ((m = inlineCodeRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  // Existing wikilinks [[...]]
  const wikilinkRegex = /\[\[[^\]]+\]\]/g;
  while ((m = wikilinkRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  // Markdown links [...](...)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((m = mdLinkRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  // Raw URLs
  const urlRegex = /https?:\/\/[^\s)]+/g;
  while ((m = urlRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }

  return ranges;
}

/**
 * Checks if a match index overlaps with any protected range.
 */
export function isInsideProtected(index: number, length: number, ranges: [number, number][]): boolean {
  const matchEnd = index + length;
  for (const [start, end] of ranges) {
    if (index >= start && index < end) return true;
    if (matchEnd > start && matchEnd <= end) return true;
    if (index <= start && matchEnd >= end) return true;
  }
  return false;
}

/**
 * Scans the entire vault across all notes to identify unlinked concept mentions.
 */
export function scanVaultForUnlinkedMentions(notes: KnowledgeItem[]): VaultUnlinkedScanResult {
  const mentions: VaultUnlinkedMention[] = [];
  const byTargetTitle: Record<string, VaultUnlinkedMention[]> = {};

  // Build list of eligible target titles (length >= 3, excluding generic single words)
  const genericExclusions = new Set([
    'note', 'notes', 'concept', 'page', 'type', 'database', 'table', 'view', 
    'overview', 'summary', 'template', 'home', 'dashboard', 'daily', 'weekly', 'annual'
  ]);

  interface TargetCandidate {
    id: string;
    title: string;
    searchPhrase: string;
  }

  const candidates: TargetCandidate[] = [];

  for (const note of notes) {
    const rawTitle = note.title.trim();
    if (rawTitle.length < 3) continue;
    if (genericExclusions.has(rawTitle.toLowerCase())) continue;

    candidates.push({
      id: note.id,
      title: rawTitle,
      searchPhrase: rawTitle
    });

    // Also support aliases for numbered files like "04_Mati vivek" -> "Mati vivek"
    const cleanedNumbered = rawTitle.replace(/^\d{1,3}[_\s-]+/i, '').trim();
    if (cleanedNumbered.length >= 4 && cleanedNumbered.toLowerCase() !== rawTitle.toLowerCase()) {
      candidates.push({
        id: note.id,
        title: rawTitle,
        searchPhrase: cleanedNumbered
      });
    }
  }

  // Scan each source note's content
  for (const sourceNote of notes) {
    const content = sourceNote.content || '';
    if (!content || content.length < 10) continue;

    const protectedRanges = getProtectedRanges(content);

    for (const target of candidates) {
      // Don't search for self-mentions
      if (sourceNote.id === target.id) continue;
      if (sourceNote.title.toLowerCase() === target.title.toLowerCase()) continue;

      const escapedPhrase = target.searchPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const phraseRegex = new RegExp(`\\b(${escapedPhrase})\\b`, 'gi');

      let m: RegExpExecArray | null;
      while ((m = phraseRegex.exec(content)) !== null) {
        const matchIdx = m.index;
        const matchLen = m[0].length;

        if (!isInsideProtected(matchIdx, matchLen, protectedRanges)) {
          const snippet = extractContextSnippet(content, target.searchPhrase);
          const mentionItem: VaultUnlinkedMention = {
            id: `${sourceNote.id}-${target.id}-${matchIdx}`,
            sourceNoteId: sourceNote.id,
            sourceNoteTitle: sourceNote.title,
            targetNoteId: target.id,
            targetTitle: target.title,
            matchedText: m[0],
            snippet,
            startIndex: matchIdx,
            endIndex: matchIdx + matchLen
          };

          mentions.push(mentionItem);

          if (!byTargetTitle[target.title]) {
            byTargetTitle[target.title] = [];
          }
          byTargetTitle[target.title].push(mentionItem);
        }
      }
    }
  }

  return {
    totalMentions: mentions.length,
    distinctTargetsCount: Object.keys(byTargetTitle).length,
    mentions,
    byTargetTitle
  };
}

/**
 * Batch converts approved plain-text mentions into formal [[wikilinks]] in Dexie.
 * Applies replacements in reverse order of index to preserve offset integrity.
 */
export async function batchConvertMentionsToWikilinks(
  mentionsToLink: VaultUnlinkedMention[]
): Promise<AutoLinkExecutionResult> {
  const bySourceNote: Record<string, VaultUnlinkedMention[]> = {};

  for (const m of mentionsToLink) {
    if (!bySourceNote[m.sourceNoteId]) {
      bySourceNote[m.sourceNoteId] = [];
    }
    bySourceNote[m.sourceNoteId].push(m);
  }

  let updatedNotesCount = 0;
  let linksCreatedCount = 0;
  const details: { noteId: string; noteTitle: string; linksAdded: string[] }[] = [];

  for (const [sourceId, list] of Object.entries(bySourceNote)) {
    const note = await db.knowledge.get(sourceId);
    if (!note || !note.content) continue;

    // Re-verify protected ranges on active content
    const protectedRanges = getProtectedRanges(note.content);

    // Sort descending by startIndex so replacements don't shift prior indices
    const sortedMentions = [...list].sort((a, b) => b.startIndex - a.startIndex);
    let updatedContent = note.content;
    const linksAddedForNote: string[] = [];

    for (const m of sortedMentions) {
      // Re-verify that this specific occurrence is still valid and not protected
      if (!isInsideProtected(m.startIndex, m.matchedText.length, protectedRanges)) {
        const currentSlice = updatedContent.slice(m.startIndex, m.endIndex);
        if (currentSlice.toLowerCase() === m.matchedText.toLowerCase()) {
          const replacement = `[[${m.targetTitle}]]`;
          updatedContent = 
            updatedContent.slice(0, m.startIndex) + 
            replacement + 
            updatedContent.slice(m.endIndex);
          
          linksCreatedCount++;
          if (!linksAddedForNote.includes(m.targetTitle)) {
            linksAddedForNote.push(m.targetTitle);
          }
        }
      }
    }

    if (updatedContent !== note.content) {
      await db.knowledge.update(sourceId, {
        content: updatedContent,
        updatedAt: Date.now()
      });
      updatedNotesCount++;
      details.push({
        noteId: sourceId,
        noteTitle: note.title,
        linksAdded: linksAddedForNote
      });
    }
  }

  return {
    updatedNotesCount,
    linksCreatedCount,
    details
  };
}

/**
 * 1-Click Vault-Wide Auto-Linker: Scans all notes and automatically converts high-confidence mentions.
 */
export async function autoLinkAllHighConfidenceMentions(
  notes: KnowledgeItem[]
): Promise<AutoLinkExecutionResult> {
  const scan = scanVaultForUnlinkedMentions(notes);
  if (scan.totalMentions === 0) {
    return {
      updatedNotesCount: 0,
      linksCreatedCount: 0,
      details: []
    };
  }
  return await batchConvertMentionsToWikilinks(scan.mentions);
}
