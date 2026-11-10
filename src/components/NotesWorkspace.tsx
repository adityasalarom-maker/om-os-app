import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Bold, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3, Columns3, Copy, FileText, Folder, Highlighter, Italic, LayoutGrid, List, ListChecks, Maximize2, Minimize2, Minus, Pin, Plus, Search, SlidersHorizontal, Tag, Underline, X } from 'lucide-react';
import './NotesWorkspace.css';

type NoteKind = 'Prompt' | 'Protocol' | 'Learning' | 'Source excerpt' | 'Concept' | 'Daily note' | 'Checklist' | 'Capture' | 'Quick note';
type NoteRecord = {
  id: string; title: string; kind: NoteKind; domain: string; category: string; tags: string[];
  project?: string; source?: string; folder?: string; content: string; editor: 'rich' | 'markdown';
  pinned: boolean; archived: boolean; createdAt: number; updatedAt: number; properties: Record<string, string>;
};

const STORAGE_KEY = 'om-notes-demo-v1';
const now = Date.now();
const demoNotes: NoteRecord[] = [
  { id: 'n-prompt', title: 'Audit a long AI answer', kind: 'Prompt', domain: 'AI & Tools', category: 'Prompts', tags: ['audit', 'reusable', 'AI'], project: 'Om Knowledge OS', source: 'ChatGPT', folder: 'Notes/AI & Tools/Prompts', editor: 'markdown', pinned: true, archived: false, createdAt: now - 86400000 * 3, updatedAt: now - 3600000, properties: { Status: 'Active', Confidence: 'Reviewed' }, content: '# Audit a long AI answer\n\nCheck the answer against the request and source material. Separate **direct evidence** from *inference*.\n\n- Find missing assumptions\n- Check dates and calculations\n- List unresolved questions\n\n> Keep the original response intact when comparing versions.' },
  { id: 'n-protocol', title: 'Chat → Notion copy protocol', kind: 'Protocol', domain: 'AI & Tools', category: 'Protocols', tags: ['workflow', 'Notion'], project: 'Knowledge capture', source: 'My Notes archive', folder: 'Notes/AI & Tools/Protocols', editor: 'rich', pinned: true, archived: false, createdAt: now - 86400000 * 8, updatedAt: now - 7200000, properties: { Status: 'Reference', Confidence: 'Established' }, content: '<h2>Capture without losing context</h2><p>Preserve the source, headings, and useful structure before turning a conversation into a durable note.</p><ul><li>Keep the original source link</li><li>Mark summaries as summaries</li><li>Link follow-up tasks to the project</li></ul>' },
  { id: 'n-learning', title: 'IndexedDB notes for offline apps', kind: 'Learning', domain: 'Technology', category: 'Local-first systems', tags: ['Dexie', 'offline', 'database'], project: 'Om Knowledge OS', source: 'Docs and implementation notes', folder: 'Notes/Technology/Local-first', editor: 'markdown', pinned: false, archived: false, createdAt: now - 86400000 * 2, updatedAt: now - 86400000, properties: { Status: 'Learning', Confidence: 'Working note' }, content: 'A local database makes capture available without a network. Sync should be treated as a separate process with explicit conflict rules.\n\n## Questions\n- What data needs cross-device sync?\n- Which fields are safe to send to Sheets?' },
  { id: 'n-video', title: 'Video transcript: attention and learning', kind: 'Source excerpt', domain: 'Learning', category: 'Media notes', tags: ['video', 'transcript', 'learning'], source: 'YouTube · add source URL', folder: 'Notes/Learning/Media notes', editor: 'rich', pinned: false, archived: false, createdAt: now - 86400000, updatedAt: now - 5400000, properties: { Status: 'To review', Confidence: 'Unverified' }, content: '<p><strong>Verbatim excerpt</strong></p><blockquote>“The useful question is not only what did I hear, but what can I retrieve and explain later?”</blockquote><p><em>My note:</em> Verify wording against the original transcript before quoting.</p>' },
  { id: 'n-term', title: 'Canonical term: source note', kind: 'Concept', domain: 'Knowledge system', category: 'Taxonomy & terms', tags: ['canonical', 'taxonomy'], project: 'Om Knowledge OS', source: 'Working glossary', folder: 'Notes/Knowledge system/Taxonomy', editor: 'markdown', pinned: false, archived: false, createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 2, properties: { Status: 'Draft', Confidence: 'Proposed' }, content: 'A **source note** records where information came from and preserves enough citation context to check it later.\n\nAliases: source record, reference note.\n\nRelated: [[Learning note]], [[Concept note]].' },
  { id: 'n-daily', title: 'Today · capture and review', kind: 'Daily note', domain: 'Daily', category: 'Daily notes', tags: ['today', 'review'], folder: 'Notes/Daily/2026', editor: 'rich', pinned: false, archived: false, createdAt: now - 14400000, updatedAt: now - 1800000, properties: { Status: 'In progress', Confidence: 'Personal' }, content: '<h2>Today</h2><p>Capture first; classify during review.</p><ul><li>Check current project priorities</li><li>Sort useful AI captures</li><li>Save one learning for later</li></ul>' },
  { id: 'n-check', title: 'Daily checklist · work', kind: 'Checklist', domain: 'Daily', category: 'Checklists', tags: ['daily', 'work', 'review'], project: 'Personal operations', source: 'Local Notion export · To do lists', folder: 'Notes/Daily/Checklists', editor: 'markdown', pinned: false, archived: false, createdAt: now - 7200000, updatedAt: now - 900000, properties: { Status: 'Open', Confidence: 'Personal', Cadence: 'Daily' }, content: '- [ ] Capture important work notes\n- [ ] Link useful learning to a project\n- [ ] Review reminders before ending work' },
  { id: 'n-misc', title: 'Unsorted capture · ask Codex later', kind: 'Capture', domain: 'Inbox', category: 'Unsorted', tags: ['inbox', 'AI follow-up'], project: 'Om Knowledge OS', source: 'Local Notion export · Universal Inbox', folder: 'Notes/Inbox', editor: 'markdown', pinned: false, archived: false, createdAt: now - 2400000, updatedAt: now - 1200000, properties: { Status: 'Needs sorting', Confidence: 'Unreviewed', 'Next action': 'Ask an AI to explain' }, content: 'Paste a useful paragraph here. Keep the source and decide later whether it is a prompt, a learning, a question, or an archive.\n\nQuestion for later: what context would an AI need to interpret this accurately?' },
  { id: 'n-inbox-notion', title: 'Inbox capture: sort after saving', kind: 'Protocol', domain: 'Inbox', category: 'Quick Capture', tags: ['capture', 'triage', 'Notion'], project: 'Om Knowledge OS', source: 'Local Notion export · Universal Inbox', folder: 'Notes/Inbox/Quick Capture', editor: 'rich', pinned: false, archived: false, createdAt: now - 86400000 * 6, updatedAt: now - 86400000, properties: { Status: 'Ready to sort', Confidence: 'Established', 'Next action': 'Choose a domain' }, content: '<h2>Capture now, classify during review</h2><p>The Universal Inbox collects thoughts, voice notes, web clippings, and other incoming items before deciding what they become.</p><ul><li>Keep the source or conversation link</li><li>Label the original capture type</li><li>Later convert it to a task, research question, knowledge note, or archive</li></ul>' },
  { id: 'n-vault-notion', title: 'Knowledge entry types', kind: 'Concept', domain: 'Knowledge system', category: 'Content model', tags: ['taxonomy', 'knowledge vault', 'canonical'], project: 'Om Knowledge OS', source: 'Local Notion export · Knowledge Vault', folder: 'Notes/Knowledge system/Content model', editor: 'markdown', pinned: true, archived: false, createdAt: now - 86400000 * 9, updatedAt: now - 86400000 * 2, properties: { Status: 'Reference', Confidence: 'Established', 'Review cycle': 'Quarterly' }, content: '## A practical note taxonomy\n\n- **Source** — where an idea came from\n- **Note** — a useful explanation or synthesis\n- **Concept** — one idea with a clear definition\n- **Quote** — exact words with attribution\n- **Question** — something still unresolved\n\nUse tags for cross-cutting topics and link project-specific knowledge to its project.' },
  { id: 'n-research-notion', title: 'Research pipeline · evidence to decision', kind: 'Protocol', domain: 'Learning', category: 'Research workflow', tags: ['research', 'evidence', 'workflow'], project: 'Research Hub', source: 'Local Notion export · Research Hub', folder: 'Notes/Learning/Research', editor: 'markdown', pinned: false, archived: false, createdAt: now - 86400000 * 4, updatedAt: now - 86400000, properties: { Status: 'In use', Confidence: 'Established', 'Next action': 'Validate sources' }, content: 'Capture → Define the question → Collect sources → Validate evidence → Analyze → Synthesize → Decide → Archive.\n\nKeep source claims, your interpretation, and open questions visibly separate so the conclusion can be checked later.' },
  { id: 'n-directory-notion', title: 'Folder map: where project material lives', kind: 'Learning', domain: 'Knowledge system', category: 'Directory & filing', tags: ['directory', 'files', 'maintenance'], project: 'Om Knowledge OS', source: 'Local Notion export · System Documentation', folder: 'Notes/Knowledge system/Directory', editor: 'rich', pinned: false, archived: false, createdAt: now - 86400000 * 7, updatedAt: now - 86400000 * 3, properties: { Status: 'Maintain', Confidence: 'Working practice', 'Review cycle': 'Monthly' }, content: '<h2>Folder map</h2><p>Use this note as a directory: record what belongs in each folder and where it lives on each device. This prototype stores locations as references only.</p><table><thead><tr><th>Area</th><th>Contains</th><th>Location</th></tr></thead><tbody><tr><td>Notes/Inbox</td><td>Unsorted captures</td><td>Add your PC folder path</td></tr><tr><td>Notes/Projects</td><td>Project learning and decisions</td><td>Add your laptop folder path</td></tr></tbody></table>' },
  { id: 'n-quick-demo', title: 'Quick thought · verify later', kind: 'Quick note', domain: 'Quick Notes', category: 'Quick notes', tags: ['quick', 'review'], folder: 'Notes/Quick Notes', editor: 'markdown', pinned: false, archived: false, createdAt: now - 1800000, updatedAt: now - 900000, properties: { Status: 'Unsorted', Confidence: 'Unreviewed' }, content: 'Keep this small capture here. Add a source or move it into a project note when it grows.' },
];

const domains = ['Inbox', 'Daily', 'AI & Tools', 'Learning', 'Technology', 'Knowledge system'];
const views = ['Library', 'Thinking', 'Connections', 'Quick Notes'];
const viewDescriptions: Record<string, string> = {
  Library: 'Browse and search all notes.',
  Thinking: 'Review ideas, learnings, questions, and notes still taking shape.',
  Connections: 'Explore notes through projects, sources, domains, and canonical terms.',
  'Quick Notes': 'See all Quick Notes as compact cards. Select a card to open it.',
};
const timestamp = (value: number) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const textCache = new Map<string, string>();
const stripMarkup = (value: string) => {
  const cached = textCache.get(value);
  if (cached !== undefined) return cached;
  const result = value.replace(/<[^>]*>/g, ' ').replace(/[#*_`>\[\]-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (textCache.size >= 48) textCache.delete(textCache.keys().next().value as string);
  textCache.set(value, result);
  return result;
};
const sanitizedHtmlCache = new Map<string, string>();
const safeHtml = (html: string) => {
  const cached = sanitizedHtmlCache.get(html);
  if (cached !== undefined) return cached;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const allowed = new Set(['P','BR','HR','H2','H3','STRONG','B','EM','I','U','MARK','UL','OL','LI','BLOCKQUOTE','PRE','CODE','TABLE','THEAD','TBODY','TR','TH','TD','A','DETAILS','SUMMARY','DIV','BUTTON']);
  const clean = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof HTMLElement) || !allowed.has(node.tagName)) return Array.from(node.childNodes).map(clean).join('');
    const tag = node.tagName.toLowerCase();
    const href = tag === 'a' ? node.getAttribute('href') : null;
    const safeHref = href && /^https?:\/\//i.test(href) ? ` href="${href.replace(/"/g, '&quot;')}" rel="noreferrer"` : '';
    const tabClass = tag === 'div' && node.classList.contains('notes-tabset') ? ' class="notes-tabset"' : '';
    const tabIndex = ['button','div'].includes(tag) ? node.getAttribute('data-notes-tab') || node.getAttribute('data-notes-panel') : null;
    const tabAttribute = tabIndex !== null && /^\d+$/.test(tabIndex) ? ` data-notes-${tag === 'button' ? 'tab' : 'panel'}="${tabIndex}"` : '';
    const addTab = tag === 'button' && node.hasAttribute('data-notes-add-tab') ? ' data-notes-add-tab="true" aria-label="Add tab"' : '';
    const selected = tag === 'button' && node.hasAttribute('data-notes-tab') && node.getAttribute('aria-selected') === 'true' ? ' aria-selected="true"' : '';
    const open = tag === 'details' && node.hasAttribute('open') ? ' open' : '';
    const hidden = tag === 'div' && node.hasAttribute('hidden') ? ' hidden' : '';
    const type = tag === 'button' && node.hasAttribute('data-notes-tab') ? ' type="button"' : '';
    return `<${tag}${safeHref}${tabClass}${tabAttribute}${addTab}${selected}${open}${hidden}${type}>${Array.from(node.childNodes).map(clean).join('')}</${tag}>`;
  };
  const cleaned = Array.from(parsed.body.childNodes).map(clean).join('');
  if (sanitizedHtmlCache.size >= 32) sanitizedHtmlCache.delete(sanitizedHtmlCache.keys().next().value as string);
  sanitizedHtmlCache.set(html, cleaned);
  return cleaned;
};
const textFromHtmlNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (!(node instanceof HTMLElement)) return '';
  if (node.tagName === 'BR') return '\n';
  if (node.tagName === 'UL' || node.tagName === 'OL') return Array.from(node.children).map(child => `• ${textFromHtmlNode(child)}`).join('\n');
  if (node.tagName === 'TR') return Array.from(node.children).map(child => textFromHtmlNode(child).trim()).join('\t');
  return Array.from(node.childNodes).map(textFromHtmlNode).join('');
};
const richText = (html: string) => {
  const parsed = new DOMParser().parseFromString(safeHtml(html), 'text/html');
  return Array.from(parsed.body.childNodes).map(textFromHtmlNode).filter(text => text.trim()).join('\n\n').replace(/[ \t]+\n/g, '\n').trim();
};
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inlineMarkdownToHtml = (value: string) => escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/__(.+?)__/g, '<u>$1</u>');
const extractRichTabsets = (source: string) => {
  const tabs: string[] = [];
  let text = '';
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.toLowerCase().indexOf('<div class="notes-tabset"', cursor);
    if (start < 0) { text += source.slice(cursor); break; }
    text += source.slice(cursor, start);
    let scan = start;
    let depth = 0;
    const tags = /<\/?div\b[^>]*>/gi;
    tags.lastIndex = start;
    let match: RegExpExecArray | null;
    let end = start;
    while ((match = tags.exec(source))) {
      if (/^<\/div/i.test(match[0])) depth -= 1; else depth += 1;
      if (depth === 0) { end = tags.lastIndex; break; }
    }
    if (!end) { text += source.slice(start); break; }
    const tabIndex = tabs.push(source.slice(start, end)) - 1;
    text += `\n\nNOTESTAB${tabIndex}\n\n`;
    cursor = end;
  }
  return { text, tabs };
};
const markdownToHtml = (markdown: string) => {
  const toggles: string[] = [];
  const withoutToggles = markdown.replace(/<details\b[\s\S]*?<\/details>/gi, html => `\n\nNOTESTOGGLE${toggles.push(html) - 1}\n\n`);
  const preserved = extractRichTabsets(withoutToggles);
  if (/<table\b/i.test(preserved.text) && !/^\s*\|/m.test(preserved.text)) {
    let raw = preserved.text.replace(/NOTESTAB(\d+)/g, (_match, index) => preserved.tabs[Number(index)] || '');
    raw = raw.replace(/NOTESTOGGLE(\d+)/g, (_match, index) => toggles[Number(index)] || '');
    return safeHtml(raw);
  }
  const lines = preserved.text.replace(/\r/g, '').split('\n');
  const blocks: string[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (/^\s*---+\s*$/.test(line)) { blocks.push('<hr>'); index += 1; continue; }
    const heading = line.match(/^\s*(#{1,3})\s+(.+)$/);
    if (heading) { blocks.push(`<${heading[1].length === 1 ? 'h2' : 'h3'}>${inlineMarkdownToHtml(heading[2])}</${heading[1].length === 1 ? 'h2' : 'h3'}>`); index += 1; continue; }
    const nextTableLine = (() => { let next = index + 1; while (next < lines.length && !lines[next].trim()) next += 1; return next; })();
    if (line.trim().startsWith('|') && lines[nextTableLine]?.trim().startsWith('|')) {
      const cells = (source: string) => source.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
      const headings = cells(line);
      const body: string[][] = [];
      index = nextTableLine + 1;
      while (index < lines.length) {
        if (!lines[index].trim()) { index += 1; continue; }
        if (!lines[index].trim().startsWith('|')) break;
        body.push(cells(lines[index])); index += 1;
      }
      blocks.push(`<table><thead><tr>${headings.map(cell => `<th>${inlineMarkdownToHtml(cell)}</th>`).join('')}</tr></thead><tbody>${body.map(row => `<tr>${headings.map((_, cellIndex) => `<td>${inlineMarkdownToHtml(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) { items.push(`<li>${inlineMarkdownToHtml(lines[index].replace(/^\s*[-*+]\s+/, ''))}</li>`); index += 1; }
      blocks.push(`<ul>${items.join('')}</ul>`); continue;
    }
    if (/^\s*>\s*\[!toggle\]/i.test(line)) {
      const summary = line.replace(/^\s*>\s*\[!toggle\]\s*/i, '');
      const body: string[] = []; index += 1;
      while (index < lines.length && /^\s*>/.test(lines[index])) { body.push(lines[index].replace(/^\s*>\s?/, '')); index += 1; }
      blocks.push(`<details open><summary>${inlineMarkdownToHtml(summary || 'Toggle')}</summary><p>${body.map(inlineMarkdownToHtml).join('<br>')}</p></details>`); continue;
    }
    if (/^\s*>\s?/.test(line)) { blocks.push(`<blockquote>${inlineMarkdownToHtml(line.replace(/^\s*>\s?/, ''))}</blockquote>`); index += 1; continue; }
    const paragraph = [line]; index += 1;
    while (index < lines.length && lines[index].trim() && !/^\s*(#{1,3}\s|---+\s*$|[-*+]\s+|>\s?)/.test(lines[index])) { paragraph.push(lines[index]); index += 1; }
    blocks.push(`<p>${paragraph.map(inlineMarkdownToHtml).join('<br>')}</p>`);
  }
  let rendered = blocks.join('');
  preserved.tabs.forEach((html, index) => { rendered = rendered.replace(`<p>NOTESTAB${index}</p>`, html); });
  toggles.forEach((html, index) => { rendered = rendered.replace(`<p>NOTESTOGGLE${index}</p>`, html); });
  return safeHtml(rendered);
};
const richContentHtml = (content: string) => {
  if (content.includes('|') && /\|\s*:?-{3,}/.test(content)) return markdownToHtml(richToMarkdown(content));
  const looksLikeMarkdown = /^\s*(?:#{1,3}\s|\|\s|---+\s*$|[-*+]\s+)/m.test(content);
  return looksLikeMarkdown ? markdownToHtml(content) : safeHtml(content);
};
const richToMarkdown = (html: string) => {
  const parsed = new DOMParser().parseFromString(safeHtml(html), 'text/html');
  const inline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof HTMLElement)) return '';
    const inner = Array.from(node.childNodes).map(inline).join('');
    if (node.tagName === 'STRONG' || node.tagName === 'B') return `**${inner}**`;
    if (node.tagName === 'EM' || node.tagName === 'I') return `*${inner}*`;
    if (node.tagName === 'U') return `__${inner}__`;
    if (node.tagName === 'BR') return '\n';
    if (node.tagName === 'A') return `${inner} (${node.getAttribute('href') || ''})`;
    return inner;
  };
  const blocks = (nodes: NodeListOf<ChildNode> | HTMLCollection): string => Array.from(nodes).map(node => {
    if (!(node instanceof HTMLElement)) return inline(node).trim();
    if (node.tagName === 'HR') return '---';
    if (node.tagName === 'H2') return `## ${inline(node)}`;
    if (node.tagName === 'H3') return `### ${inline(node)}`;
    if (node.tagName === 'P') return inline(node).trim();
    if (node.tagName === 'UL' || node.tagName === 'OL') return Array.from(node.children).map((item, i) => `${node.tagName === 'UL' ? '- ' : `${i + 1}. `}${inline(item).trim()}`).join('\n');
    if (node.tagName === 'BLOCKQUOTE') return inline(node).trim().split('\n').map(line => `> ${line}`).join('\n');
    if (node.tagName === 'DETAILS') { const summary = inline(node.querySelector('summary') || node); const body = Array.from(node.children).filter(child => child.tagName !== 'SUMMARY').map(child => richText(child.outerHTML)).filter(Boolean).join('\n'); return `> [!toggle] ${summary}\n${body.split('\n').map(line => `> ${line}`).join('\n')}`; }
    if (node.tagName === 'TABLE') {
      const rows = Array.from(node.querySelectorAll('tr')).map(row => `| ${Array.from(row.children).map(cell => inline(cell).trim()).join(' | ')} |`);
      if (rows.length) rows.splice(1, 0, `| ${Array.from(node.querySelector('tr')?.children || []).map(() => '---').join(' | ')} |`);
      return rows.join('\n');
    }
    if (node.classList.contains('notes-tabset')) return node.outerHTML;
    return blocks(node.childNodes as NodeListOf<ChildNode>);
  }).filter(Boolean).join('\n\n');
  return blocks(parsed.body.childNodes as NodeListOf<ChildNode>).trim();
};
const copySectionsFor = (note: NoteRecord) => {
  if (note.editor === 'markdown') return note.content.split(/\r?\n/).map(section => section.trim()).filter(Boolean);
  const parsed = new DOMParser().parseFromString(safeHtml(note.content), 'text/html');
  const sections: string[] = [];
  const pushLines = (node: Node) => textFromHtmlNode(node).split(/\r?\n+/).map(line => line.trim()).filter(Boolean).forEach(line => sections.push(line));
  const visit = (node: Node) => {
    if (node instanceof HTMLElement && ['DIV','SECTION','ARTICLE'].includes(node.tagName) && Array.from(node.children).some(child => ['P','H1','H2','H3','UL','OL','BLOCKQUOTE','PRE','TABLE','DIV'].includes(child.tagName))) {
      Array.from(node.childNodes).forEach(visit);
      return;
    }
    if (node instanceof HTMLElement && (node.tagName === 'UL' || node.tagName === 'OL')) {
      Array.from(node.children).forEach(item => pushLines(item));
      return;
    }
    if (node instanceof HTMLElement && node.tagName === 'TABLE') {
      Array.from(node.querySelectorAll('tr')).forEach(row => pushLines(row));
      return;
    }
    pushLines(node);
  };
  Array.from(parsed.body.childNodes).forEach(visit);
  return sections;
};

export const NotesWorkspace: React.FC = () => {
  const [notes, setNotes] = useState<NoteRecord[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (!saved) return demoNotes; const existing = JSON.parse(saved) as NoteRecord[]; const ids = new Set(existing.map(note => note.id)); return [...existing, ...demoNotes.filter(note => !ids.has(note.id))]; } catch { return demoNotes; }
  });
  const [openIds, setOpenIds] = useState<string[]>(['n-prompt', 'n-protocol', 'n-learning', 'n-daily']);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);
  const [paneNotes, setPaneNotes] = useState<string[]>(['n-prompt']);
  const [focusedPane, setFocusedPane] = useState(0);
  const [layout, setLayout] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [closedPanes, setClosedPanes] = useState<number[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<string[]>(['Inbox','Daily','AI & Tools','Learning']);
  const [quickNotesExpanded, setQuickNotesExpanded] = useState(true);
  const [activeDomain, setActiveDomain] = useState('All notes');
  const [activeView, setActiveView] = useState('Library');
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'Exact'|'Phrase'|'Approx'>('Exact');
  const [showFilters, setShowFilters] = useState(false);
  const [copySectionsId, setCopySectionsId] = useState<string | null>(null);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [focusRequestedId, setFocusRequestedId] = useState<string | null>(null);
  const [status, setStatus] = useState('Saved locally');
  const [showProperties, setShowProperties] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const markdownEditorRef = useRef<HTMLTextAreaElement>(null);
  const pendingEditorRef = useRef<{ id: string; content: string } | null>(null);
  const editorSaveTimerRef = useRef<number | null>(null);
  const notesRef = useRef(notes);
  const openTabsRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeNote = notes.find(note => note.id === paneNotes[focusedPane]) || notes[0];
  const searchIndex = useMemo(() => notes.map(note => ({
    note,
    haystack: `${note.title} ${note.kind} ${note.domain} ${note.category} ${note.tags.join(' ')} ${note.source || ''} ${stripMarkup(note.content)}`.toLowerCase(),
  })), [notes]);
  const visibleIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchIndex.filter(({ note, haystack }) => {
      if (note.archived || !(activeDomain === 'All notes' || (activeDomain === 'Pinned' ? note.pinned : note.domain === activeDomain || note.kind === activeDomain || note.category === activeDomain))) return false;
      if (!q) return true;
      if (searchMode === 'Exact') return haystack.includes(q);
      if (searchMode === 'Phrase') return haystack.includes(` ${q} `) || haystack.startsWith(q) || haystack.endsWith(q);
      return q.split(/\s+/).every(term => haystack.includes(term) || haystack.split(/\s+/).some(word => word.startsWith(term.slice(0, Math.max(2, term.length - 1)))));
    }).map(({ note }) => note);
  }, [searchIndex, activeDomain, query, searchMode]);

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => {
    if (!focusRequestedId || paneNotes[focusedPane] !== focusRequestedId) return;
    const frame = window.requestAnimationFrame(() => {
      const note = notes.find(item => item.id === focusRequestedId);
      (note?.editor === 'markdown' ? markdownEditorRef.current : editorRef.current)?.focus();
      setFocusRequestedId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequestedId, paneNotes, focusedPane, notes]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft = pendingEditorRef.current;
        const withDraft = draft ? notes.map(note => note.id === draft.id ? { ...note, content: safeHtml(draft.content), updatedAt: Date.now() } : note) : notes;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withDraft));
        setStatus('Saved locally');
      } catch {
        setStatus('Local save failed');
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [notes]);
  useEffect(() => {
    const saveBeforeExit = () => {
      const draft = pendingEditorRef.current;
      const latest = draft ? notesRef.current.map(note => note.id === draft.id ? { ...note, content: safeHtml(draft.content), updatedAt: Date.now() } : note) : notesRef.current;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(latest)); } catch { /* Browser storage may be unavailable. */ }
    };
    window.addEventListener('pagehide', saveBeforeExit);
    return () => window.removeEventListener('pagehide', saveBeforeExit);
  }, []);
  useEffect(() => {
    const updateFullscreenState = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  const openNote = (id: string, pane = focusedPane) => {
    setOpenIds(current => current.includes(id) ? current : [...current, id]);
    setPaneNotes(current => { const next = [...current]; next[pane] = id; return next; });
    setFocusedPane(pane);
    window.requestAnimationFrame(() => openTabsRef.current?.querySelector(`[data-note-id="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }));
  };
  const selectDomain = (domain: string) => {
    setActiveDomain(domain);
    const isQuickLibrary = domain === 'Quick Notes' || notes.some(note => !note.archived && note.domain === 'Quick Notes' && note.category === domain);
    setActiveView(isQuickLibrary ? 'Quick Notes' : 'Library');
    if (isQuickLibrary) return;
    const firstMatch = notes.find(note => !note.archived && (domain === 'All notes' || (domain === 'Pinned' ? note.pinned : note.domain === domain || note.kind === domain || note.category === domain)));
    if (firstMatch) openNote(firstMatch.id, focusedPane);
  };
  const showAllQuickNotes = () => { setQuery(''); setActiveDomain('Quick Notes'); setActiveView('Quick Notes'); };
  const openQuickNote = (id: string) => { setQuery(''); setActiveDomain('Quick Notes'); setActiveView('Library'); openNote(id); };
  const editNote = (id: string, patch: Partial<NoteRecord>) => {
    setStatus(current => current === 'Saving…' ? current : 'Saving…');
    setNotes(current => current.map(note => note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note));
  };
  const flushEditorDraft = (id?: string) => {
    const draft = pendingEditorRef.current;
    if (!draft || (id && draft.id !== id)) return;
    if (editorSaveTimerRef.current !== null) window.clearTimeout(editorSaveTimerRef.current);
    editorSaveTimerRef.current = null;
    pendingEditorRef.current = null;
    editNote(draft.id, { content: safeHtml(draft.content) });
  };
  const persistEditorDraft = (id: string) => {
    const draft = pendingEditorRef.current;
    if (!draft || draft.id !== id) return;
    editorSaveTimerRef.current = null;
    try {
      const withDraft = notesRef.current.map(note => note.id === id ? { ...note, content: safeHtml(draft.content), updatedAt: Date.now() } : note);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withDraft));
      setStatus('Saved locally');
    } catch {
      setStatus('Local save failed');
    }
  };
  const queueEditorDraft = (id: string, content: string) => {
    pendingEditorRef.current = { id, content };
    setStatus(current => current === 'Saving…' ? current : 'Saving…');
    if (editorSaveTimerRef.current !== null) window.clearTimeout(editorSaveTimerRef.current);
    editorSaveTimerRef.current = window.setTimeout(() => persistEditorDraft(id), 500);
  };
  const createNote = (kind: NoteKind = 'Capture') => {
    const isQuickNote = kind === 'Quick note';
    const id = `n-${Math.random().toString(36).slice(2, 9)}`;
    const note: NoteRecord = { id, title: isQuickNote ? 'Quick note' : kind === 'Checklist' ? 'New checklist' : 'Untitled note', kind, domain: isQuickNote ? 'Quick Notes' : kind === 'Checklist' ? 'Daily' : 'Inbox', category: isQuickNote ? 'Quick notes' : kind === 'Checklist' ? 'Checklists' : 'Unsorted', tags: isQuickNote ? ['quick'] : [], folder: isQuickNote ? 'Notes/Quick Notes' : kind === 'Checklist' ? 'Notes/Daily/Checklists' : 'Notes/Inbox', content: kind === 'Checklist' ? '- [ ] First item' : isQuickNote ? '<ul><li><br></li></ul>' : '', editor: isQuickNote ? 'rich' : 'markdown', pinned: false, archived: false, createdAt: Date.now(), updatedAt: Date.now(), properties: { Status: isQuickNote ? 'Unsorted' : 'Needs sorting', Confidence: 'Unreviewed' } };
    setActiveView('Library'); setActiveDomain('All notes'); setQuery('');
    if (isQuickNote) setQuickNotesExpanded(true);
    setNotes(current => [note, ...current]); openNote(id); setFocusRequestedId(id);
  };
  const closeTab = (id: string) => {
    setOpenIds(current => current.filter(item => item !== id));
    setPaneNotes(current => current.map(item => item === id ? '' : item));
  };
  const toggleDomain = (domain: string) => setExpandedDomains(current => current.includes(domain) ? current.filter(item => item !== domain) : [...current, domain]);
  const runFormat = (command: string, value?: string) => { editorRef.current?.focus(); document.execCommand(command, false, value); if (activeNote && editorRef.current) queueEditorDraft(activeNote.id, editorRef.current.innerHTML); };
  const insertMarkdownAtCursor = (content: string) => {
    const input = markdownEditorRef.current;
    if (!input || !activeNote) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const next = `${input.value.slice(0, start)}${content}${input.value.slice(end)}`;
    input.value = next;
    const cursor = start + content.length;
    input.focus();
    input.setSelectionRange(cursor, cursor);
    queueEditorDraft(activeNote.id, next);
  };
  const insertDivider = () => {
    if (!activeNote) return;
    if (activeNote.editor === 'markdown') insertMarkdownAtCursor('\n\n---\n\n');
    else if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, '<hr><p><br></p>');
      queueEditorDraft(activeNote.id, editorRef.current.innerHTML);
    }
  };
  const insertRichBlock = (note: NoteRecord, html: string) => {
    if (note.editor === 'rich' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, html);
      queueEditorDraft(note.id, editorRef.current.innerHTML);
      return;
    }
    const source = pendingEditorRef.current?.id === note.id ? pendingEditorRef.current.content : markdownEditorRef.current?.value ?? note.content;
    if (editorSaveTimerRef.current !== null) window.clearTimeout(editorSaveTimerRef.current);
    editorSaveTimerRef.current = null;
    pendingEditorRef.current = null;
    const converted = markdownToHtml(source);
    setNotes(current => current.map(item => item.id === note.id ? { ...item, content: converted, editor: 'rich', updatedAt: Date.now() } : item));
    setStatus('Switched to Rich for this interactive block');
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false);
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
      document.execCommand('insertHTML', false, html);
      queueEditorDraft(note.id, editor.innerHTML);
    });
  };
  const insertToggle = () => {
    if (!activeNote) return;
    insertRichBlock(activeNote, '<details><summary>Toggle heading</summary><p>Write toggle content here.</p></details><p><br></p>');
  };
  const insertTabs = () => {
    if (!activeNote) return;
    const html = '<div class="notes-tabset"><div class="notes-tab-list"><button type="button" data-notes-tab="0" aria-selected="true">Tab 1</button><button type="button" data-notes-tab="1">Tab 2</button><button type="button" data-notes-add-tab="true" aria-label="Add tab">+</button></div><div data-notes-panel="0"><p>Write the first tab here.</p></div><div data-notes-panel="1" hidden><p>Write the second tab here.</p></div></div><p><br></p>';
    insertRichBlock(activeNote, html);
  };
  const handleRichEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const editor = event.currentTarget;
    const addButton = target.closest<HTMLButtonElement>('[data-notes-add-tab]');
    if (addButton) {
      event.preventDefault();
      const tabset = addButton.closest('.notes-tabset');
      const tabList = tabset?.querySelector('.notes-tab-list');
      if (!tabset || !tabList || !activeNote) return;
      const tabIndex = tabset.querySelectorAll('[data-notes-tab]').length;
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.notesTab = String(tabIndex); button.textContent = `Tab ${tabIndex + 1}`;
      tabList.insertBefore(button, addButton);
      const panel = document.createElement('div'); panel.dataset.notesPanel = String(tabIndex); panel.innerHTML = '<p>Write in this tab.</p>';
      tabset.appendChild(panel);
      tabset.querySelectorAll<HTMLElement>('[data-notes-panel]').forEach(item => { item.hidden = item !== panel; });
      tabset.querySelectorAll<HTMLButtonElement>('[data-notes-tab]').forEach(item => item.setAttribute('aria-selected', String(item === button)));
      queueEditorDraft(activeNote.id, editor.innerHTML);
      return;
    }
    const tabButton = target.closest<HTMLButtonElement>('[data-notes-tab]');
    if (!tabButton || !activeNote) return;
    event.preventDefault();
    const tabset = tabButton.closest('.notes-tabset');
    const selected = tabButton.dataset.notesTab;
    tabset?.querySelectorAll<HTMLElement>('[data-notes-panel]').forEach(panel => { panel.hidden = panel.dataset.notesPanel !== selected; });
    tabset?.querySelectorAll<HTMLButtonElement>('[data-notes-tab]').forEach(button => button.setAttribute('aria-selected', String(button === tabButton)));
    queueEditorDraft(activeNote.id, editor.innerHTML);
  };
  const changeEditorMode = (note: NoteRecord, target: 'rich' | 'markdown') => {
    if (note.editor === target) return;
    const pending = pendingEditorRef.current?.id === note.id ? pendingEditorRef.current : null;
    const source = pending?.content ?? (note.editor === 'rich' ? editorRef.current?.innerHTML : markdownEditorRef.current?.value) ?? note.content;
    if (target === 'markdown' && /<(?:table|details|div class="notes-tabset")/i.test(source)) {
      const proceed = window.confirm('This note contains a rich table, toggle, or tab set. The table will become Markdown rows; toggles and tabs stay as supported block markup. Markdown shows that markup as text. Continue? Cancel keeps the rich note unchanged.');
      if (!proceed) return;
    }
    if (editorSaveTimerRef.current !== null) window.clearTimeout(editorSaveTimerRef.current);
    editorSaveTimerRef.current = null;
    if (pending) pendingEditorRef.current = null;
    const content = target === 'markdown' ? richToMarkdown(source) : markdownToHtml(source);
    setStatus('Saving…');
    setNotes(current => current.map(item => item.id === note.id ? { ...item, content, editor: target, updatedAt: Date.now() } : item));
  };
  const insertQuickItem = () => {
    if (!activeNote || activeNote.kind !== 'Quick note') return;
    if (activeNote.editor === 'markdown') insertMarkdownAtCursor('\n');
    else if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, '<ul><li><br></li></ul>');
      queueEditorDraft(activeNote.id, editorRef.current.innerHTML);
    }
  };
  const insertTable = (rows: number, columns: number) => {
    if (!activeNote) return;
    if (activeNote.editor === 'markdown') {
      const header = `| ${Array.from({ length: columns }, (_, index) => `Column ${index + 1}`).join(' | ')} |`;
      const divider = `| ${Array.from({ length: columns }, () => '---').join(' | ')} |`;
      const body = Array.from({ length: Math.max(1, rows - 1) }, () => `| ${Array.from({ length: columns }, () => ' ').join(' | ')} |`).join('\n');
      const input = markdownEditorRef.current;
      const prefix = input?.selectionStart ? '\n' : '';
      insertMarkdownAtCursor(`${prefix}${header}\n${divider}${body ? `\n${body}` : ''}\n`);
    } else if (editorRef.current) {
      const header = `<thead><tr>${Array.from({ length: columns }, (_, index) => `<th>Column ${index + 1}</th>`).join('')}</tr></thead>`;
      const tableRows = Array.from({ length: Math.max(1, rows - 1) }, () => `<tr>${Array.from({ length: columns }, () => '<td><br></td>').join('')}</tr>`).join('');
      editorRef.current.focus();
      document.execCommand('insertHTML', false, `<table class="notes-inserted-table">${header}<tbody>${tableRows}</tbody></table><p><br></p>`);
      queueEditorDraft(activeNote.id, editorRef.current.innerHTML);
    }
    setTablePickerOpen(false);
  };
  const copyText = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setStatus(label);
      window.setTimeout(() => setStatus('Saved locally'), 1300);
    } catch {
      setStatus('Clipboard access unavailable');
      window.setTimeout(() => setStatus('Saved locally'), 1800);
    }
  };
  const copyContent = async (note: NoteRecord) => copyText(note.editor === 'rich' ? richText(note.content) : note.content, 'Copied note content');
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await rootRef.current?.requestFullscreen();
  };
  const paneCount = layout;
  const columns = Math.min(3, paneCount);
  const rows = Math.ceil(paneCount / 3);
  const quickNoteCategories = [...new Set(notes.filter(note => note.domain === 'Quick Notes' && !note.archived).map(note => note.category))];
  const quickNotes = notes.filter(note => note.domain === 'Quick Notes' && !note.archived).sort((a, b) => b.updatedAt - a.updatedAt);
  const quickNoteCount = quickNotes.length;
  const quickNotesForBoard = visibleIds.filter(note => note.domain === 'Quick Notes');
  const tablePicker = tablePickerOpen ? <div className="notes-table-picker" role="group" aria-label="Insert a table"><strong>Insert table</strong><div className="notes-table-picker-grid">{Array.from({ length: 5 }, (_, row) => <div className="notes-table-picker-row" key={row}>{Array.from({ length: 5 }, (_, column) => <button key={column} type="button" aria-label={`Insert ${row + 1} rows by ${column + 1} columns`} title={`${row + 1} rows × ${column + 1} columns`} onMouseDown={event => event.preventDefault()} onClick={() => insertTable(row + 1, column + 1)}>{row + 1}×{column + 1}</button>)}</div>)}</div><small>Choose rows × columns. Markdown uses the first row as headers.</small></div> : null;

  return <div ref={rootRef} className="notes-app" data-ag-id="Notes_Root_Workspace">
    <aside className={`notes-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="notes-brand"><div className="notes-brand-icon"><BookOpen size={17}/></div>{!collapsed && <div><strong>Notes</strong><small>Local-first workspace</small></div>}<button className="notes-icon-button notes-collapse" title={collapsed ? 'Expand directory' : 'Collapse directory'} onClick={() => setCollapsed(value => !value)}>{collapsed ? <ChevronRight size={16}/> : <ChevronDown size={16}/>}</button></div>
      {!collapsed && <>
        <div className="notes-sidebar-actions"><button onClick={() => createNote()}><Plus size={15}/> New note</button><button className="notes-quick-note-button" onClick={() => createNote('Quick note')}><FileText size={14}/> Quick note</button><button onClick={() => createNote('Checklist')}><ListChecks size={15}/> Checklist</button></div>
        <button className={`notes-nav-row ${activeDomain === 'All notes' ? 'selected' : ''}`} onClick={() => selectDomain('All notes')}><BookOpen size={15}/> All notes <span>{notes.filter(n => !n.archived).length}</span></button>
        <button className={`notes-nav-row ${activeDomain === 'Pinned' ? 'selected' : ''}`} onClick={() => selectDomain('Pinned')}><Pin size={15}/> Pinned</button>
        <div className="notes-quick-library">
          <div className="notes-domain-row"><button className="notes-disclosure" aria-label={quickNotesExpanded ? 'Collapse Quick Notes list' : 'Expand Quick Notes list'} onClick={() => setQuickNotesExpanded(value => !value)}>{quickNotesExpanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button><button className={`notes-quick-domain-button ${activeDomain === 'Quick Notes' ? 'active' : ''}`} onClick={() => selectDomain('Quick Notes')}><FileText size={14}/><span>Quick Notes</span><small>{quickNoteCount}</small></button><button className="notes-quick-show-all" aria-label="Show all Quick Notes" title="Show all Quick Notes on the right" onClick={showAllQuickNotes}><LayoutGrid size={14}/></button></div>
          {quickNotesExpanded && <><div className="notes-quick-category-list">{quickNoteCategories.map(category => <button key={category} className={`notes-category-row ${activeDomain === category ? 'active' : ''}`} onClick={() => selectDomain(category)}>{category}<small>{notes.filter(note => note.domain === 'Quick Notes' && note.category === category && !note.archived).length}</small></button>)}</div><div className="notes-quick-note-list" aria-label="Quick note list">{quickNotes.map(note => <button key={note.id} className={activeNote?.id === note.id ? 'active' : ''} title={note.title} onClick={() => openQuickNote(note.id)}><FileText size={12}/><span>{note.title || 'Untitled quick note'}</span></button>)}</div></>}
        </div>
        <div className="notes-section-caption">DOMAINS & CATEGORIES</div>
        <nav className="notes-domain-list">{domains.map(domain => {
          const count = notes.filter(note => !note.archived && (note.domain === domain || note.kind === domain)).length;
          const expanded = expandedDomains.includes(domain);
          const cats = [...new Set(notes.filter(note => note.domain === domain).map(note => note.category))];
          return <div key={domain}>
            <div className="notes-domain-row"><button className="notes-disclosure" onClick={() => toggleDomain(domain)}>{expanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button><button className={activeDomain === domain ? 'active' : ''} onClick={() => selectDomain(domain)}><Folder size={14}/><span>{domain}</span><small>{count}</small></button></div>
            {expanded && cats.map(category => <button key={category} className={`notes-category-row ${activeDomain === category ? 'active' : ''}`} onClick={() => selectDomain(category)}>{category}<small>{notes.filter(n => n.category === category && !n.archived).length}</small></button>)}
          </div>;
        })}</nav>
        <div className="notes-directory"><div className="notes-section-caption">DIRECTORY · LOCATION MAP</div><p>Folders are references only. Notes won’t move or rename PC files.</p>{activeNote && <label><Folder size={13}/><input aria-label="Mapped folder location" value={activeNote.folder || ''} onChange={e => editNote(activeNote.id, { folder: e.target.value })} placeholder="Add a folder location"/></label>}</div>
        <div className="notes-sidebar-footer"><span className="notes-online-dot"/> Saved on this device</div>
      </>}
    </aside>

    <section className={`notes-main ${activeView === 'Quick Notes' ? 'quick-notes-board-open' : ''}`}>
      <header className="notes-topbar"><div className="notes-view-tabs" role="tablist" aria-label="Notes views">{views.map(view => <button key={view} role="tab" aria-selected={activeView === view} title={viewDescriptions[view]} className={activeView === view ? 'active' : ''} onClick={() => { setActiveView(view); if (view === 'Connections') { setActiveDomain('All notes'); setQuery(''); } else if (view === 'Quick Notes') { setActiveDomain('Quick Notes'); } }}>{view === 'Library' ? '📚' : view === 'Thinking' ? '💡' : view === 'Connections' ? '🔗' : '🗒️'} <span>{view}</span></button>)}<button className="notes-add-view" title="Add a custom view (prototype action)" aria-label="Add a custom view" onClick={() => setStatus('Custom views are part of the next build phase')}>+</button></div><div className="notes-top-actions"><span className="notes-save-status"><Check size={13}/>{status}</span><button className={`notes-icon-button notes-properties-toggle ${showProperties ? 'active' : ''}`} title={showProperties ? 'Hide note properties' : 'Show note properties'} aria-label={showProperties ? 'Hide note properties' : 'Show note properties'} aria-pressed={showProperties} onClick={() => setShowProperties(value => !value)}><Tag size={15}/><span>Fields</span></button><button className="notes-icon-button" title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen workspace'} aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen workspace'} onClick={() => void toggleFullscreen()}>{isFullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</button><button className="notes-quick-note-button" onClick={() => createNote('Quick note')} title="Create a short note in the Quick Notes library"><FileText size={13}/> Quick note</button><button className="notes-primary-button" onClick={() => createNote()}><Plus size={15}/> New note</button></div></header>
      <div className={`notes-workspace-toolbar ${tabsCollapsed ? 'tabs-collapsed' : ''}`}>
        {!tabsCollapsed && <div className="notes-tabs-region"><button className="notes-tabs-scroll" title="Scroll tabs left" aria-label="Scroll tabs left" onClick={() => openTabsRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}><ChevronLeft size={14}/></button><div ref={openTabsRef} className="notes-open-tabs" aria-label="Open notes">{openIds.map(id => { const note = notes.find(item => item.id === id); if (!note) return null; return <div key={id} data-note-id={id} className={`notes-open-tab ${activeNote?.id === id ? 'active' : ''}`}><button onClick={() => openNote(id)} title={note.title}>{note.pinned && <Pin size={11}/>}<span>{note.title}</span></button><button className="tab-close" aria-label={`Close ${note.title}`} onClick={() => closeTab(id)}><X size={12}/></button></div>; })}</div><button className="notes-tabs-scroll" title="Scroll tabs right" aria-label="Scroll tabs right" onClick={() => openTabsRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}><ChevronRight size={14}/></button></div>}
        {tabsCollapsed && <button className="notes-tabs-summary" onClick={() => setTabsCollapsed(false)}>{openIds.length} open note tabs</button>}
        <div className="notes-layout-control"><button className="notes-tabs-toggle" aria-label={tabsCollapsed ? 'Show open note tabs' : 'Collapse open note tabs'} title={tabsCollapsed ? 'Show the horizontal list of open note tabs' : 'Hide the horizontal list of open note tabs'} onClick={() => setTabsCollapsed(value => !value)}>{tabsCollapsed ? <ChevronDown size={15}/> : <ChevronUp size={15}/>}</button><span className="notes-pane-layout-icon" title="Choose how many notes to show at once"><Columns3 size={14}/></span><select value={layout} aria-label="Visible note panes" title="Choose how many notes to show at once" onChange={e => { const value = Number(e.target.value); setLayout(value); setPaneNotes(current => { const candidates = [...openIds.map(id => notes.find(note => note.id === id)).filter((note): note is NoteRecord => Boolean(note && !note.archived)), ...visibleIds, ...notes.filter(note => !note.archived)].filter((note, index, all) => all.findIndex(item => item.id === note.id) === index); const used = new Set<string>(); return Array.from({ length: value }, (_, i) => { const currentId = current[i]; if (currentId && !used.has(currentId)) { used.add(currentId); return currentId; } const next = candidates.find(note => !used.has(note.id)); if (next) used.add(next.id); return next?.id || ''; }); }); setClosedPanes([]); }}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} pane{n > 1 ? 's' : ''}</option>)}</select></div>
      </div>
      <div className="notes-search-row"><div className="notes-search"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles, content, tags, sources…"/><button onClick={() => setQuery('')} aria-label="Clear search"><X size={13}/></button></div><select value={searchMode} onChange={e => setSearchMode(e.target.value as typeof searchMode)} aria-label="Search mode"><option>Exact</option><option>Phrase</option><option>Approx</option></select><button className={`notes-filter-toggle ${showFilters || activeDomain !== 'All notes' ? 'active' : ''}`} title="Show or hide note-type filters" aria-label="Show or hide note-type filters" onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters}><SlidersHorizontal size={13}/><span>Filters</span>{showFilters ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}</button><span className="notes-result-count">{visibleIds.length}</span></div>
      {showFilters && <div className="notes-kind-strip">{(['All notes','Prompt','Protocol','Learning','Source excerpt','Concept','Daily note','Checklist','Capture','Quick note'] as string[]).map(kind => <button key={kind} className={activeDomain === kind ? 'active' : ''} onClick={() => selectDomain(kind)}>{kind}</button>)}</div>}
      <div className="notes-content-area">
        {activeView === 'Thinking' ? <div className="notes-view-intro"><div className="notes-view-icon">💡</div><div><h2>Thinking</h2><p>Ideas, learnings, questions, and notes you’re still shaping.</p></div><div className="notes-kind-chips">{['Learning','Concept','Capture','Quick note'].map(kind => <button key={kind} onClick={() => setActiveDomain(kind)}>{kind}</button>)}</div></div> : activeView === 'Connections' ? <div className="notes-view-intro"><div className="notes-view-icon">🔗</div><div><h2>Connections</h2><p>Groups notes by shared projects. Select a project chip to filter related notes; source, domain, and canonical links are shown in each note’s fields.</p></div><div className="notes-kind-chips">{[...new Set(notes.map(note => note.project).filter(Boolean))].map(project => <button key={project} title={`Show notes linked to ${project}`} onClick={() => { setActiveDomain('All notes'); setQuery(project || ''); }}>{project}</button>)}</div></div> : null}
        {activeDomain === 'Pinned' && <div className="notes-filter-banner"><Pin size={14}/> Pinned notes <button onClick={() => setActiveDomain('All notes')}>Clear</button></div>}
        {activeDomain === 'Pinned' && null}
        {activeView === 'Quick Notes' ? <div className="notes-quick-board"><div className="notes-quick-board-heading"><div><h2>Quick Notes</h2><span>{quickNotesForBoard.length} {quickNotesForBoard.length === 1 ? 'note' : 'notes'}</span></div><button onClick={() => createNote('Quick note')}><Plus size={14}/> Quick note</button></div>{quickNotesForBoard.length ? <div className="notes-quick-card-grid">{quickNotesForBoard.map((note, index) => <button key={note.id} type="button" className={`notes-quick-card notes-quick-card-${index % 5}`} onClick={() => { openNote(note.id); setActiveView('Library'); }}><strong>{note.title || 'Untitled quick note'}</strong><span>{(note.editor === 'rich' ? richText(note.content) : stripMarkup(note.content)).slice(0, 220) || 'No note text yet.'}</span><small>{note.category} · Updated {timestamp(note.updatedAt)}</small></button>)}</div> : <div className="notes-empty"><FileText size={26}/><strong>No quick notes yet</strong><span>Create a small capture and it will appear here.</span><button onClick={() => createNote('Quick note')}>Create quick note</button></div>}</div> : visibleIds.length === 0 ? <div className="notes-empty"><FileText size={26}/><strong>No notes match</strong><span>Try another search or capture a new note.</span><button onClick={() => createNote()}>Create note</button></div> : <div className={`notes-pane-grid ${closedPanes.length ? 'has-collapsed' : ''}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(260px, 1fr))` }}>
          {Array.from({ length: paneCount }, (_, index) => {
            if (closedPanes.includes(index)) return <button key={`closed-${index}`} className="notes-collapsed-pane" onClick={() => setClosedPanes(current => current.filter(item => item !== index))}><Maximize2 size={14}/> Restore pane {index + 1}</button>;
            const usedPaneNoteIds = paneNotes.slice(0, index).filter(Boolean);
            const paneNote = notes.find(note => note.id === paneNotes[index] && !usedPaneNoteIds.includes(note.id)) || visibleIds.find(note => !usedPaneNoteIds.includes(note.id)) || notes.find(note => !note.archived && !usedPaneNoteIds.includes(note.id));
            if (!paneNote) return null;
            const isFocused = focusedPane === index;
            const copySections = copySectionsId === paneNote.id ? copySectionsFor(paneNote) : [];
            return <article key={`pane-${index}`} className={`notes-pane ${isFocused ? 'focused' : ''}`} onClick={() => setFocusedPane(index)}>
              <header className="notes-pane-header"><label className="notes-pane-note-picker"><span>Open note</span><select aria-label={`Choose note for pane ${index + 1}`} title="Choose which saved note to show in this pane" value={paneNote.id} onChange={e => openNote(e.target.value, index)}>{notes.filter(note => !note.archived).map(note => <option key={note.id} value={note.id}>{note.title}</option>)}</select></label><div className="notes-pane-actions"><span className="notes-kind-badge">{paneNote.kind}</span><button aria-label={`Copy entire note: ${paneNote.title}`} title="Copy the whole note with its line breaks" onClick={() => void copyContent(paneNote)}><Copy size={13}/></button><button className="notes-copy-sections-button" aria-label={`Show copyable sections: ${paneNote.title}`} title="Copy a paragraph, line, bullet, or table row separately" aria-expanded={copySectionsId === paneNote.id} onClick={() => setCopySectionsId(current => current === paneNote.id ? null : paneNote.id)}><List size={13}/><span>Copy sections</span></button><button aria-label="Collapse pane" title="Collapse pane" onClick={() => setClosedPanes(current => [...current, index])}><Minus size={14}/></button></div></header>
              {copySectionsId === paneNote.id && <div className="notes-copy-sections-popover" role="dialog" aria-label={`Copy sections from ${paneNote.title}`} onClick={event => event.stopPropagation()}><div className="notes-copy-sections-heading"><strong>Copy note sections</strong><button aria-label="Close section copy menu" title="Close" onClick={() => setCopySectionsId(null)}><X size={13}/></button></div><p>Each paragraph, line, bullet, or table row is separate. Press Enter or add a new line to make another copyable section.</p><button className="notes-copy-all-sections" onClick={() => void copyText(copySections.join('\n\n'), 'Copied all sections with line breaks')}>Copy all sections with line breaks</button>{copySections.length ? copySections.map((section, sectionIndex) => <div className="notes-copy-section-row" key={`${sectionIndex}-${section.slice(0, 24)}`}><span><small>Section {sectionIndex + 1}</small><span className="notes-copy-section-preview">{section}</span></span><button onClick={() => void copyText(section, `Copied section ${sectionIndex + 1}`)}>Copy</button></div>) : <span className="notes-no-copy-sections">This note has no text sections yet.</span>}</div>}
              <div className="notes-pane-meta"><span>{paneNote.domain} / {paneNote.category}</span><span>Updated {timestamp(paneNote.updatedAt)}</span></div>
              {isFocused && <div className="notes-pane-toolbar"><button onClick={() => editNote(paneNote.id, { pinned: !paneNote.pinned })} className={paneNote.pinned ? 'active' : ''}><Pin size={13}/>{paneNote.pinned ? 'Pinned' : 'Pin'}</button><button onClick={() => editNote(paneNote.id, { archived: true })}><Archive size={13}/>Archive</button><button onClick={() => { const name = window.prompt('Property name'); if (name?.trim()) editNote(paneNote.id, { properties: { ...paneNote.properties, [name.trim()]: '' } }); }}><Plus size={12}/>Property</button><div className="notes-editor-switch"><button className={paneNote.editor === 'rich' ? 'active' : ''} onClick={() => changeEditorMode(paneNote, 'rich')}>Rich</button><button className={paneNote.editor === 'markdown' ? 'active' : ''} onClick={() => changeEditorMode(paneNote, 'markdown')}>Markdown</button></div></div>}
              <input className="notes-title-input" aria-label="Note title" value={paneNote.title} onChange={e => editNote(paneNote.id, { title: e.target.value })}/>
              {isFocused && paneNote.editor === 'rich' && <div className="notes-format-toolbar"><button type="button" title="Bold" aria-label="Bold" onMouseDown={event => event.preventDefault()} onClick={() => runFormat('bold')}><Bold size={14}/></button><button type="button" title="Italic" aria-label="Italic" onMouseDown={event => event.preventDefault()} onClick={() => runFormat('italic')}><Italic size={14}/></button><button type="button" title="Underline" aria-label="Underline" onMouseDown={event => event.preventDefault()} onClick={() => runFormat('underline')}><Underline size={14}/></button><button type="button" title="Highlight" aria-label="Highlight" onMouseDown={event => event.preventDefault()} onClick={() => runFormat('hiliteColor', '#fef08a')}><Highlighter size={14}/></button><button type="button" title="Bulleted list" aria-label="Bulleted list" onMouseDown={event => event.preventDefault()} onClick={() => runFormat('insertUnorderedList')}><List size={14}/></button>{paneNote.kind === 'Quick note' && <button type="button" className="notes-insert-control" title="Add a separate quick-note row" onMouseDown={event => event.preventDefault()} onClick={insertQuickItem}>＋ Add item</button>}<button type="button" className="notes-insert-control" title="Insert a horizontal divider" onMouseDown={event => event.preventDefault()} onClick={insertDivider}>━ Divider</button><button type="button" className="notes-insert-control" title="Insert a collapsible toggle" onMouseDown={event => event.preventDefault()} onClick={insertToggle}>▸ Toggle</button><button type="button" className="notes-insert-control" title="Insert a tabbed section" onMouseDown={event => event.preventDefault()} onClick={insertTabs}>▤ Tabs</button><button type="button" className="notes-insert-control" aria-expanded={tablePickerOpen} title="Insert an editable table" onMouseDown={event => event.preventDefault()} onClick={() => setTablePickerOpen(current => !current)}>▦ Table</button><select title="Text size" aria-label="Text size" onChange={e => runFormat('fontSize', e.target.value)} defaultValue="3"><option value="2">Small</option><option value="3">Normal</option><option value="5">Large</option></select>{tablePicker}</div>}
              {isFocused && paneNote.editor === 'markdown' && <div className="notes-format-toolbar notes-markdown-toolbar">{paneNote.kind === 'Quick note' && <button type="button" className="notes-insert-control" title="Add a separate quick-note row" onClick={insertQuickItem}>＋ Add item</button>}<button type="button" className="notes-insert-control" title="Insert a horizontal divider" onClick={insertDivider}>━ Divider</button><button type="button" className="notes-insert-control" title="Insert a collapsible toggle" onClick={insertToggle}>▸ Toggle</button><button type="button" className="notes-insert-control" title="Insert a tabbed section" onClick={insertTabs}>▤ Tabs</button><button type="button" className="notes-insert-control" aria-expanded={tablePickerOpen} title="Insert a Markdown table" onClick={() => setTablePickerOpen(current => !current)}>▦ Table</button>{tablePicker}</div>}
              {isFocused ? paneNote.editor === 'markdown' ? <textarea key={`${paneNote.id}-${paneNote.editor}`} ref={markdownEditorRef} className="notes-editor notes-markdown-editor" aria-label="Markdown note editor" defaultValue={paneNote.content} onInput={e => queueEditorDraft(paneNote.id, e.currentTarget.value)} onBlur={e => { const currentDraft = pendingEditorRef.current; if (currentDraft?.id === paneNote.id) currentDraft.content = e.currentTarget.value; flushEditorDraft(paneNote.id); }} placeholder="Write Markdown…"/> : <div ref={editorRef} className="notes-editor notes-rich-editor" aria-label="Rich text note editor" contentEditable suppressContentEditableWarning onClick={handleRichEditorClick} onInput={e => queueEditorDraft(paneNote.id, e.currentTarget.innerHTML)} onBlur={e => { const currentDraft = pendingEditorRef.current; if (currentDraft?.id === paneNote.id) currentDraft.content = e.currentTarget.innerHTML; flushEditorDraft(paneNote.id); }} dangerouslySetInnerHTML={{ __html: richContentHtml(paneNote.content) }}/> : <div className="notes-pane-preview">{paneNote.editor === 'markdown' ? <pre>{paneNote.content}</pre> : <div dangerouslySetInnerHTML={{ __html: richContentHtml(paneNote.content) }}/>}</div>}
              {showProperties && isFocused && <footer className="notes-property-bar"><label>Type <select value={paneNote.kind} onChange={e => editNote(paneNote.id, { kind: e.target.value as NoteKind })}>{['Prompt','Protocol','Learning','Source excerpt','Concept','Daily note','Checklist','Capture','Quick note'].map(kind => <option key={kind}>{kind}</option>)}</select></label><label>Domain <input value={paneNote.domain} onChange={e => editNote(paneNote.id, { domain: e.target.value })}/></label><label>Category <input value={paneNote.category} onChange={e => editNote(paneNote.id, { category: e.target.value })}/></label><label>Tags <input value={paneNote.tags.join(', ')} onChange={e => editNote(paneNote.id, { tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}/></label><label>Source <input value={paneNote.source || ''} onChange={e => editNote(paneNote.id, { source: e.target.value })}/></label>{Object.entries(paneNote.properties).map(([key, value]) => <label key={key}>{key}<input value={value} onChange={e => editNote(paneNote.id, { properties: { ...paneNote.properties, [key]: e.target.value } })}/></label>)}</footer>}
              <div className="notes-pane-footer"><span><Clock3 size={12}/> Created {timestamp(paneNote.createdAt)}</span>{paneNote.project && <span>{paneNote.project}</span>}</div>
            </article>;
          })}
        </div>}
      </div>
      <footer className="notes-bottom-bar"><span><Check size={13}/> Demo notes autosave on this device only</span><span>Undo/redo and encrypted cross-device sync are planned for the next phase</span></footer>
    </section>
  </div>;
};
