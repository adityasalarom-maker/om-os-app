import fs from 'node:fs';
import path from 'node:path';

const modules = [
  { id: 'dashboard', name: 'Executive Dashboard', file: 'ExecutiveDashboard.tsx' },
  { id: 'tracker', name: 'Daily Life Tracker', file: 'tracker/DailyTrackerView.tsx' },
  { id: 'projects', name: 'Project Portfolio', file: 'ProjectPortfolioView.tsx' },
  { id: 'tasks', name: 'Task Intelligence', file: 'TaskIntelligence.tsx' },
  { id: 'knowledge', name: 'Knowledge Vault', file: 'KnowledgeVault.tsx' },
  { id: 'notes', name: 'Notes Studio', file: 'notes/NotesStudioView.tsx' },
  { id: 'notes_workspace', name: 'Notes Workspace', file: 'NotesWorkspace.tsx' },
  { id: 'notes_preview', name: 'Notes Studio Preview', file: 'NotesStudioPreviewView.tsx' },
  { id: 'notes_pro', name: 'Notes Studio Pro', file: 'NotesStudioProView.tsx' },
  { id: 'pdf', name: 'Reading Library & PDF', file: 'pdf/PdfReaderView.tsx' },
  { id: 'research', name: 'Structured Research Hub', file: 'ResearchHubView.tsx' },
  { id: 'inbox', name: 'Universal Inbox & AI', file: 'UniversalInboxAI.tsx' },
  { id: 'goals', name: 'Goals Pyramid', file: 'GoalsPyramid.tsx' },
  { id: 'journal', name: 'Journal & Reflection', file: 'JournalView.tsx' },
  { id: 'health', name: 'Health Tracker', file: 'HealthTracker.tsx' },
  { id: 'property', name: 'Himalayan Spatial GIS', file: 'HimalayanSpatialGis.tsx' },
  { id: 'pantry', name: 'Kitchen & Pantry', file: 'PantryView.tsx' },
  { id: 'sheets', name: 'Google Sheets Bridge', file: 'GoogleSheetsSyncModal.tsx' },
  { id: 'analytics', name: 'Analytics View', file: 'AnalyticsView.tsx' },
  { id: 'jyotish', name: 'Jyotish & Ephemeris', file: 'JyotishView.tsx' },
  { id: 'sadhana', name: 'Dream & Sadhana OS', file: 'DreamSadhanaView.tsx' },
  { id: 'vedic', name: 'Vedic Concordance', file: 'VedicConcordanceView.tsx' },
  { id: 'pranayama', name: 'Pranayama View', file: 'PranayamaView.tsx' },
  { id: 'sovereign_studio', name: 'Sovereign Studio V2', file: 'SovereignStudioV2.tsx' },
];

const basePath = 'C:/Users/adity/Ag Folder/om_os_app/src/components';

console.log('AUDITING ALL 24 CORE OM OS MODULES 1-BY-1\n');

for (const mod of modules) {
  const filePath = path.join(basePath, mod.file);
  if (!fs.existsSync(filePath)) {
    console.log(`[FAIL] ${mod.name} (${mod.id}): File not found at ${filePath}`);
    continue;
  }
  const code = fs.readFileSync(filePath, 'utf8');

  // Issues detection
  const issues = [];

  // 1. Check root container styling
  const rootDivMatch = code.match(/return\s*\(\s*<div[^>]*className=["']([^"']+)["']/);
  const rootStyleMatch = code.match(/return\s*\(\s*<div[^>]*style=\{\{([^}]+)\}\}/);

  // 2. Hardcoded dark colors that aren't mapped
  const hexBgs = code.match(/bg-\[#([a-fA-F0-9]{3,8})\]/g) || [];
  const unmappedHex = [];
  // Read index.css to see if the hex is mapped
  const indexCss = fs.readFileSync('C:/Users/adity/Ag Folder/om_os_app/src/index.css', 'utf8');
  for (const h of hexBgs) {
    const escaped = h.replace('[', '\\[').replace(']', '\\]');
    if (!indexCss.includes(escaped) && !indexCss.includes(h)) {
      unmappedHex.push(h);
    }
  }
  if (unmappedHex.length > 0) {
    issues.push(`Unmapped hex backgrounds: ${Array.from(new Set(unmappedHex)).join(', ')}`);
  }

  // 3. Raw text-white that might become invisible in light themes
  // If index.css has .light-mode .text-white { color: var(--text-main) !important; }, it's covered globally.
  // But check if the file uses inline color: '#ffffff' or 'white'
  const rawWhiteInline = code.match(/color:\s*['"](?:#fff(?:fff)?|white)['"]/g) || [];
  if (rawWhiteInline.length > 0) {
    issues.push(`Raw white inline text (${rawWhiteInline.length} places)`);
  }

  // 4. Check for font declarations
  const customFonts = code.match(/font-\[[^\]]+\]/g) || [];
  if (customFonts.length > 0) {
    issues.push(`Custom fonts: ${customFonts.join(', ')}`);
  }

  // 5. Check data-ag-id on root/landmarks
  const agIds = code.match(/data-ag-id=["']([^"']+)["']/g) || [];

  console.log(`\n### ${mod.name} [id: ${mod.id}]`);
  console.log(`- File: ${mod.file}`);
  console.log(`- Canonical Landmarks: ${agIds.length} found (${agIds.slice(0, 3).join(', ')}${agIds.length > 3 ? '...' : ''})`);
  console.log(`- Hex bgs: ${hexBgs.length} (unmapped: ${unmappedHex.length})`);
  if (issues.length === 0) {
    console.log(`- Status: ✔ Clean theme & color compliance`);
  } else {
    console.log(`- Issues detected (${issues.length}):`);
    issues.forEach(iss => console.log(`  * ${iss}`));
  }
}
