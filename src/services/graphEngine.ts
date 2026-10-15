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
