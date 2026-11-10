# Om Knowledge OS — Notes Studio Complete Architectural Feature Changelog & Blueprint
**Master Engineering Specification, Mechanics & Reusable Implementation Guide**
*Target: Full Reference for Replicating Functionality in Sister Modules & Workspaces*
*File Path: `C:\Users\adity\AG misc\NOTES_STUDIO_COMPLETE_FEATURE_CHANGELOG_BLUEPRINT.md`*

---

## 1. Executive Overview

This document provides a complete, granular, zero-loss technical inventory of every architectural component, state machine, UI pattern, DOM event handler, and bug fix engineered for **Notes Studio** (`om_os_app/src/components/notes/NotesStudioView.tsx`).

Use this blueprint as a direct implementation checklist to upgrade or build sister modules (such as Knowledge Vault, Scratchpad, Canvas, or Verbatim Studio) to full parity.

---

## 2. Core Feature & Mechanics Breakdown

### 2.1 Multi-Pane Dynamic Layout Engine (Split Modes)
- **Supported Layouts**:
  1. `SINGLE_PANE`: Full-focus view displaying the active note.
  2. `TWO_PLUS_BOTTOM`: 2 resizable vertical columns + 1 horizontal bottom dock.
  3. `THREE_PLUS_BOTTOM`: 3 resizable vertical columns + 1 horizontal bottom dock.
  4. `GRID_3X2`: Up to 6 simultaneous panes in a responsive CSS grid.
- **Zero Right Space Invariant**:
  - The rightmost vertical column always uses `flex-1 min-w-[100px]`, dynamically absorbing all remaining container width without leaving dead space.
- **Proportional Resizing Splitters**:
  - Vertical gutters calculate pixel delta against container width (`getBoundingClientRect().width`) and update normalized percentage tuples (`columnPercents` as `[p0, p1, p2]` summing to 100%, and `colPercents2` as `[p0, p1]`).
  - Horizontal splitter (`startBottomDockResize`) updates `bottomDockHeight` with min 100px and max 550px bounds.
  - Double-clicking any splitter instantly resets columns to balanced ratios (e.g. `[50, 50]` or `[33.33, 33.33, 33.34]`).
- **Orientation Flip Button on Every Note (`handleToggleNoteOrientation`)**:
  - A single dedicated icon button on every note header (`SplitSquareVertical` vs `SplitSquareHorizontal`).
  - If a note is in a vertical column, 1 click moves it into the horizontal bottom dock, un-collapses the drawer, and pulses visual focus.
  - If a note is in the horizontal dock, 1 click moves it to the top vertical deck (placed at Column 1) and swaps the next open note into the dock.
  - Automatically activates split mode if currently in single pane.

### 2.2 Top 20-Tab Ribbon & Drag-and-Drop Reordering
- **Tab Capacity**: Supports up to 20 open tabs (`MAX_OPEN_TABS = 20`) with horizontal scrolling (`no-scrollbar`).
- **HTML5 Drag-and-Drop**: Native `draggable`, `onDragStart`, `onDragOver`, `onDrop`, and `onDragEnd` allowing seamless tab position reordering.
- **Animated Focus Pulse (`triggerNoteHighlight`)**:
  - Clicking any tab triggers a glow ring (`ring-2 ring-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.65)]`) and a pulsing badge (`📍 LOCATED` / `🎯 FOCUS`) for 1.8 seconds.
  - If the target note is not in the visible viewport, it is automatically moved to the primary visible column.

### 2.3 Subcomponent Isolation for Code Blocks (`EditableCodeBlock`)
- **Performance Rationale**:
  - In large markdown documents with multiple code blocks, typing in a code block inside a parent component causes the entire markdown preview to re-render on every keystroke, introducing input lag.
- **Solution**:
  - Encapsulated into a `React.memo` subcomponent (`EditableCodeBlock`).
  - Manages `localCode` state with a 200ms debounce timer (`debounceTimerRef`) before committing mutations to the parent note's markdown string.
  - Commits immediately on blur (`onBlur`).
  - Language switcher dropdown dynamically rewrites the fenced code delimiter (e.g. ` ```typescript ` to ` ```python `).
  - Trailing unclosed code fences at EOF are handled gracefully with fallback regex parsing.
  - 1-click copy button with visual checkmark confirmation.

### 2.4 Multi-Style Workspace Modes per Note
Each note can toggle between 3 primary view styles independently:
1. **`EDITOR_BLOCKS`**:
   - **Edit Mode**: Direct monospace `<textarea>` with word wrap and persistent undo history.
   - **Preview Mode**: Live rendered HTML supporting:
     - Headings (`#`, `##`, `###`)
     - Blockquotes (`> `) with left accent border
     - Task checkboxes (`- [ ]`, `- [x]`) with interactive checkmarks
     - Lists (`- `, `1. `)
     - Inline formatting: Bold (`**`), Italic (`*`), Underline (`<u>`), Strikethrough (`~~`), and Highlight (`==text==` rendered as `<mark className="bg-amber-400/30 text-amber-200 px-1 py-0.5 rounded">`).
     - Fenced code blocks rendered with interactive `EditableCodeBlock`.
   - **Split Mode**: Side-by-side synchronized view with `<textarea>` on the left and live preview on the right.
2. **`NOTEPAD_TABLE` (Windows Notepad Tabular Scratchpad)**:
   - Dedicated table for capturing snippets from AI chats, YouTube transcripts, and IDE logs.
   - Columns: `Sel` (checkbox), `Captured Text / Snippet`, `Source`, `Action Intent`, `User Question / Notes`, `Delete`.
   - Resizable table columns with draggable header gutters.
   - **1-Click "Generate AI Prompt (1-Click Copy)"**: Compiles all checked rows into structured Markdown with intent tags to paste directly into ChatGPT/Claude.
3. **`CHECKLIST_BOARD`**:
   - Kanban-style task categories: Daily AI, Work, List, Special, Remember, Learn, Ponder.
   - Add/toggle/delete tasks with local state tracking.

### 2.5 Selection-Based Formatting Toolbar
- **True Textarea Selection Range**:
  - Calculates `textarea.selectionStart` and `selectionEnd`, wraps highlighted text with formatting delimiters, and repositions the cursor immediately (`textarea.setSelectionRange`).
- **Granular Font Size Controller**:
  - Range from 8px to 20px.
  - Controls: `A-` (-1px button), direct `<select>` dropdown (8px–20px), and `A+` (+1px button).
- **Notion-Style Properties Drawer**:
  - Expandable metadata accordion on each note: Domain, Main Category, Sub Category, Tags (add/remove), Status, Priority, Created/Updated timestamps.
- **5-Step Local Undo / Redo**:
  - Deep-snapshot stack (`undoStack` and `redoStack`) preserving title, content, brief, properties, and tags.

### 2.6 ChatGPT-Style Annotation Deck & AI Prompt Compiler
- **Data Model**:
  ```typescript
  interface StudioAnnotation {
    id: string;
    noteId: string;
    noteTitle?: string;
    selectedText: string;
    comment: string;
    intent: 'Clarify' | 'Refactor' | 'Audit' | 'Explain' | 'Ask AI';
    resolved: boolean;
    createdAt: string;
  }
  ```
- **Non-Invasive Architecture**:
  - Removed global mouseup hijacking to preserve native IDE selection and webview commenting (`@[Quote]`).
  - Triggered via toolbar pen (`PenTool`), note header badge (`MessageSquare`), global navbar button, or deck `+ Add` button.
  - Centered modal composer with backdrop preventing off-screen clipping.
  - Viewport-adaptive side deck (`absolute sm:relative right-0 top-0 bottom-0 z-40`) sliding in without being crushed by wide tables.
  - 1-Click compiler exporting all or filtered annotations into formatted prompts.

### 2.7 Collapsible Prompt Cards
- Attached prompt blocks (e.g. Note 1 "AI Prompts & Sovereign Protocols") feature prompt cards with 1-click copy buttons and a collapse toggle (`ChevronRight` / `ChevronDown`) defaulting to collapsed (28px height) to save vertical space.

### 2.8 Crash-Proof Bottom Dock Collapse
- Container header does not have `onClick`, preventing accidental collapse when interacting with the `<select>` note switcher or header whitespace.
- Collapse/expand is triggered strictly by dedicated `<button>` controls with `ChevronDown`/`ChevronUp` icons and textual labels.

### 2.9 Native IDE Webview & HMR Interoperability
- **Body User-Select Safeguard**:
  - `useEffect` hook on mount and unmount enforcing `document.body.style.userSelect = ''` and `document.body.style.cursor = ''`, preventing stuck `user-select: none` across Vite hot reloads.
- **DOM Selectability**:
  - Containers and previews explicitly tagged with `select-text`, ensuring native text selection and Antigravity IDE commenting always work.

### 2.10 Local-First Sovereign Persistence
- Auto-syncs to browser `localStorage` on any change:
  - `om_os_notes_studio_v2`: All notes data.
  - `om_os_notes_studio_groups_v2`: Collapsible sidebar groups.
  - `om_os_notes_studio_layout_v1`: Dimensions (sidebar width, column percents, bottom dock height, bottom dock note ID).
- 1-Click JSON backup exporter (`om_notes_studio_backup_YYYY-MM-DD.json`).

---

## 3. Implementation Checklist for Replicating in Sister Modules

When implementing these features in other modules:
- [ ] 1. Copy `StudioNote` and `StudioAnnotation` type contracts from `om_os_app/src/types/notesStudio.ts`.
- [ ] 2. Ensure layout columns use `flex: 0 0 P%` with `min-w-[100px]` and the final column uses `flex-1`.
- [ ] 3. Implement `EditableCodeBlock` as a `React.memo` subcomponent with local debounce to prevent lag.
- [ ] 4. Wrap header collapse controls in dedicated `<button>` elements; never put `onClick` on parent header rows.
- [ ] 5. Use centered modal dialogs for prompt composers rather than absolute coordinate popovers.
- [ ] 6. Include the body user-select cleanup `useEffect` on mount/unmount to protect against HMR styling traps.
- [ ] 7. Tag all editable and preview text areas with `className="select-text"`.
- [ ] 8. Add `handleToggleNoteOrientation` with `SplitSquareVertical` / `SplitSquareHorizontal` buttons.
