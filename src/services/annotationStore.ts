import type { AnnotationRecord, AnnotationStatus } from '../types/annotation';

const STORAGE_KEY = 'om_dev_visual_annotations_v1';

export function getStoredAnnotations(): AnnotationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load annotations from localStorage:', err);
    return [];
  }
}

export function saveAnnotation(record: AnnotationRecord): AnnotationRecord[] {
  try {
    const current = getStoredAnnotations();
    const updated = [record, ...current.filter(a => a.id !== record.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('om-annotations-updated', { detail: { annotations: updated } }));
    return updated;
  } catch (err) {
    console.error('Failed to save annotation:', err);
    return getStoredAnnotations();
  }
}

export function updateAnnotationStatus(id: string, status: AnnotationStatus): AnnotationRecord[] {
  try {
    const current = getStoredAnnotations();
    const updated = current.map(a => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('om-annotations-updated', { detail: { annotations: updated } }));
    return updated;
  } catch (err) {
    console.error('Failed to update annotation status:', err);
    return getStoredAnnotations();
  }
}

export function deleteAnnotation(id: string): AnnotationRecord[] {
  try {
    const current = getStoredAnnotations();
    const updated = current.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('om-annotations-updated', { detail: { annotations: updated } }));
    return updated;
  } catch (err) {
    console.error('Failed to delete annotation:', err);
    return getStoredAnnotations();
  }
}

export function clearAnnotations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('om-annotations-updated', { detail: { annotations: [] } }));
  } catch (err) {
    console.error('Failed to clear annotations:', err);
  }
}

/**
 * 1-Click Markdown Directive Compiler (Single Annotation)
 * Generates high-density, zero-ambiguity telemetry directly ready for Antigravity chat.
 */
export function formatAnnotationDirective(ann: AnnotationRecord): string {
  const target = ann.target;
  const canonicalStr = target.canonicalId ? `data-ag-id="${target.canonicalId}"` : 'None (Auto-Selector)';
  const box = target.rect;
  
  return `### 🎯 [VISUAL UI ANNOTATION FEEDBACK]
- **Target Landmark**: \`${canonicalStr}\`
- **Target Element**: \`${target.selector}\` (${target.tag})
- **Component File**: \`${target.componentHint || 'Auto-detect from DOM landmark'}\`
- **Action Intent**: **${ann.comment.intent}**
- **Viewport Coordinates**: \`{ top: ${Math.round(box.top)}px, left: ${Math.round(box.left)}px, width: ${Math.round(box.width)}px, height: ${Math.round(box.height)}px }\`
- **Page Context**: \`${ann.page.title}\` (\`${ann.page.route}\`)
${target.textSnippet ? `- **Selected Text Context**: "${target.textSnippet}"\n` : ''}- **User Directive**: "${ann.comment.userText || 'Inspect and refine target component as specified'}"

> Please inspect this element, identify its implementation file, and apply the requested change directly.`;
}

/**
 * 1-Click Batch Directives Compiler (All Pending Annotations)
 */
export function formatBatchAnnotationsDirective(annotations: AnnotationRecord[]): string {
  const pending = annotations.filter(a => a.status === 'pending');
  if (pending.length === 0) return 'No pending visual annotations found.';

  const items = pending.map((ann, idx) => {
    const t = ann.target;
    const can = t.canonicalId ? `\`data-ag-id="${t.canonicalId}"\`` : `\`${t.selector}\``;
    return `| ${idx + 1} | **${ann.comment.intent}** | ${can} | \`${Math.round(t.rect.width)}×${Math.round(t.rect.height)}px\` | ${ann.comment.userText || 'Refine as indicated'} |`;
  }).join('\n');

  return `### 🎯 [BATCH VISUAL UI ANNOTATIONS — ${pending.length} ITEMS]
Please process the following visual feedback annotations collected from the live application inspect overlay:

| # | Action Intent | Target Landmark | Dimensions | Directive / Notes |
| :--- | :--- | :--- | :--- | :--- |
${items}

#### Detailed Technical Directives:
${pending.map((ann, idx) => `
**Item #${idx + 1}**:
- Target: \`${ann.target.canonicalId || ann.target.selector}\` (${ann.target.tag})
- Selector: \`${ann.target.selector}\`
- Rect: \`{ top: ${Math.round(ann.target.rect.top)}, left: ${Math.round(ann.target.rect.left)}, w: ${Math.round(ann.target.rect.width)}, h: ${Math.round(ann.target.rect.height)} }\`
- Intent: ${ann.comment.intent}
- Instruction: "${ann.comment.userText}"
`).join('')}

> Output Directives: Review the affected components, apply the modifications, and confirm verification status.`;
}

/**
 * Universal Resilient Clipboard Copier
 * Tries navigator.clipboard.writeText first; automatically falls back to
 * document.execCommand('copy') with an offscreen textarea to guarantee zero copy drops.
 */
export async function copyToClipboardResilient(text: string): Promise<boolean> {
  // Method 1: Async Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Async clipboard write failed, using fallback:', err);
    }
  }

  // Method 2: Synchronous textarea fallback (works in all environments and iframes)
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) return true;
    } catch (err) {
      console.error('execCommand fallback failed:', err);
    }
  }

  return false;
}
