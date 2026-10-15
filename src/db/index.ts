import Dexie, { type Table } from 'dexie';

export interface Project {
  id: string;
  name: string;
  status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  healthStatus: 'On Track' | 'At Risk' | 'Behind';
  progress: number; // 0 - 100
  budget?: string;
  deadline?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskItem {
  id: string;
  title: string;
  projectId?: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Waiting';
  priority: 'Urgent & Important' | 'Important Not Urgent' | 'Urgent Not Important' | 'Neither'; // Eisenhower
  quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  deadline?: string;
  urgency: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  energyRequired: 'Deep Work' | 'Low Energy' | 'Quick Win';
  delegationFit?: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: 'Note' | 'Concept' | 'Source' | 'Bookmark' | 'Quote' | 'Question';
  content: string; // Markdown / block text
  tags: string[];
  projectId?: string;
  sourceUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GoalItem {
  id: string;
  title: string;
  level: 'Life Vision' | '10-Year' | '5-Year' | '1-Year' | 'Quarterly OKR';
  status: 'Active' | 'Achieved' | 'Pivoted';
  progress: number; // 0-100
  lifeArea: 'Spiritual & Inner' | 'Health & Vitality' | 'Wealth & Assets' | 'Career & Skills' | 'Family & Relationships';
  parentId?: string;
  targetDate?: string;
  keyResults?: { id: string; text: string; done: boolean }[];
  linkedProjectIds?: string[];
  autoRollup?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface InboxItem {
  id: string;
  title: string;
  content: string;
  type: 'AI Conversation' | 'Quick Note' | 'Web Link' | 'Voice Memo';
  source?: string;
  status: 'Inbox' | 'Processed' | 'Archived';
  rawMetadata?: string;
  createdAt: number;
  updatedAt: number;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  entryType: 'Daily' | 'Weekly Review' | 'Monthly Review';
  moodScore: number; // 1-10
  energyScore: number; // 1-10
  clarityScore?: number; // 1-10
  morningTop3: string[];
  morningCompleted?: boolean[];
  eveningWins: string[];
  gratitude?: string[];
  lessonsLearned?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface PantryItem {
  id: string;
  itemName: string;
  category: 'Grains & Pulses' | 'Spices & Oils' | 'Fresh Fruits & Veg' | 'Dairy & Essentials' | 'Herbs & Supplements';
  currentQty: string;
  reorderPoint: string;
  status: 'In Stock' | 'Low' | 'Need to Order';
  storageType: 'Pantry' | 'Fridge' | 'Spice Rack';
  updatedAt: number;
}

export interface SyncConflict {
  id: string;
  table: string;
  recordId: string;
  localData: any;
  remoteData: any;
  resolved: boolean;
  resolution?: 'local' | 'remote';
  timestamp: number;
}

export interface SyncSetting {
  id: string;
  value: string;
  updatedAt: number;
}

export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  recordId: string;
  payload?: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retries: number;
  errorMessage?: string;
}

export interface PdfDocument {
  id: string;
  title: string;
  filename: string;
  filesize: number;
  totalPages: number;
  category: string;
  tags: string[];
  dataBlob: Blob;
  createdAt: number;
  lastOpenedAt: number;
}

export interface PdfReadingState {
  documentId: string;
  lastPage: number;
  zoomScale: number;
  scrollOffsetTop: number;
  activeThemeId: string;
  updatedAt: number;
}

export interface PdfAnnotation {
  id: string;
  documentId: string;
  pageNumber: number;
  type: 'highlight' | 'bookmark' | 'note';
  color: string;
  text?: string;
  noteText?: string;
  createdAt: number;
}

export interface HealthEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sleepHours: number;
  sleepQuality: 'Deep / Restful' | 'Moderate' | 'Disturbed';
  digestionAgni: 'Sama (Balanced)' | 'Manda (Sluggish)' | 'Tikshna (Intense)' | 'Vishama (Irregular)';
  doshaState: {
    vata: 'Balanced' | 'Elevated';
    pitta: 'Balanced' | 'Elevated';
    kapha: 'Balanced' | 'Elevated';
  };
  pranaScore: number; // 1-10
  yogaPranayamaMin: number;
  dietType: 'Sattvic' | 'Rajasic' | 'Tamasic' | 'Mixed';
  herbsTaken: string[];
  symptomsOrNotes: string;
  createdAt: number;
  updatedAt: number;
}

export interface PropertyParcel {
  id: string;
  title: string;
  location: string;
  elevationMeters: number;
  areaSize: string;
  askingPrice: string;
  pricePerUnit: string;
  roadAccess: 'Paved Motor Road' | 'Kaccha Jeep Track' | 'Foot Trail';
  waterSource: 'Perennial Stream (Gadhera)' | 'Spring Water' | 'Borewell' | 'Piped';
  solarExposure: 'South Facing (Full Day)' | 'East Facing' | 'West Facing' | 'Shaded';
  status: 'Shortlisted' | 'Site Visited' | 'Due Diligence' | 'Acquired' | 'Archived';
  diligenceChecks: {
    khatauni12YrVerified: boolean;
    necObtained: boolean;
    disasterFloodSafe: boolean;
    boundaryDemarcated: boolean;
    localTehsilApproved: boolean;
  };
  legalNotes: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteDestination {
  id: string;
  title: string;
  format: 'md' | 'txt';
  lastUsedAt: number;
}

export interface SemanticEmbeddingRecord {
  id: string;
  itemId: string;
  itemType: 'knowledge' | 'task' | 'journal' | 'property';
  textHash: string;
  vector: number[];
  topKeywords: string[];
  updatedAt: number;
}

export interface JyotishChartRecord {
  id: string;
  title: string;
  dateTime: string;
  locationName: string;
  latitude: number;
  longitude: number;
  notes?: string;
  lagnaRashi: string;
  lagnaDegree: string;
  chandraRashi: string;
  chandraNakshatra: string;
  tithi: string;
  vara: string;
  grahasJson: string; // JSON serialized Graha positions
  createdAt: number;
  updatedAt: number;
}

export class OmKnowledgeDatabase extends Dexie {
  projects!: Table<Project, string>;
  tasks!: Table<TaskItem, string>;
  knowledge!: Table<KnowledgeItem, string>;
  goals!: Table<GoalItem, string>;
  inbox!: Table<InboxItem, string>;
  journal!: Table<JournalEntry, string>;
  pantry!: Table<PantryItem, string>;
  syncConflicts!: Table<SyncConflict, string>;
  syncSettings!: Table<SyncSetting, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  pdfDocuments!: Table<PdfDocument, string>;
  pdfReadingStates!: Table<PdfReadingState, string>;
  pdfAnnotations!: Table<PdfAnnotation, string>;
  noteDestinations!: Table<NoteDestination, string>;
  health!: Table<HealthEntry, string>;
  properties!: Table<PropertyParcel, string>;
  semanticEmbeddings!: Table<SemanticEmbeddingRecord, string>;
  jyotishCharts!: Table<JyotishChartRecord, string>;

  constructor() {
    super('OmKnowledgeOS_DB');
    this.version(2).stores({
      projects: 'id, name, status, priority, healthStatus, updatedAt',
      tasks: 'id, title, projectId, status, priority, quadrant, isCompleted, energyRequired, deadline, updatedAt',
      knowledge: 'id, title, type, *tags, projectId, updatedAt',
      goals: 'id, title, level, status, lifeArea, updatedAt',
      inbox: 'id, title, type, status, createdAt',
      journal: 'id, date, entryType, moodScore, energyScore, updatedAt',
      pantry: 'id, itemName, category, status, updatedAt',
      syncConflicts: 'id, table, recordId, resolved, timestamp',
      syncSettings: 'id, value, updatedAt',
    });

    this.version(4).stores({
      projects: 'id, name, status, priority, healthStatus, updatedAt',
      tasks: 'id, title, projectId, status, priority, quadrant, isCompleted, energyRequired, deadline, updatedAt',
      knowledge: 'id, title, type, *tags, projectId, updatedAt',
      goals: 'id, title, level, status, lifeArea, updatedAt',
      inbox: 'id, title, type, status, createdAt',
      journal: 'id, date, entryType, moodScore, energyScore, createdAt, updatedAt',
      pantry: 'id, itemName, category, status, updatedAt',
      syncConflicts: 'id, table, recordId, resolved, timestamp',
      syncSettings: 'id, value, updatedAt',
      pdfDocuments: 'id, title, category, *tags, lastOpenedAt',
      pdfReadingStates: 'documentId, lastPage, updatedAt',
      pdfAnnotations: 'id, documentId, pageNumber, type, createdAt',
      noteDestinations: 'id, title, format, lastUsedAt',
      health: 'id, date, pranaScore, createdAt, updatedAt',
      properties: 'id, title, location, status, updatedAt',
    });

    this.version(5).stores({
      projects: 'id, name, status, priority, healthStatus, updatedAt',
      tasks: 'id, title, projectId, status, priority, quadrant, isCompleted, energyRequired, deadline, updatedAt',
      knowledge: 'id, title, type, *tags, projectId, updatedAt',
      goals: 'id, title, level, status, lifeArea, updatedAt',
      inbox: 'id, title, type, status, createdAt',
      journal: 'id, date, entryType, moodScore, energyScore, createdAt, updatedAt',
      pantry: 'id, itemName, category, status, updatedAt',
      syncConflicts: 'id, table, recordId, resolved, timestamp',
      syncSettings: 'id, value, updatedAt',
      syncQueue: 'id, table, action, recordId, timestamp, status',
      pdfDocuments: 'id, title, category, *tags, lastOpenedAt',
      pdfReadingStates: 'documentId, lastPage, updatedAt',
      pdfAnnotations: 'id, documentId, pageNumber, type, createdAt',
      noteDestinations: 'id, title, format, lastUsedAt',
      health: 'id, date, pranaScore, createdAt, updatedAt',
      properties: 'id, title, location, status, updatedAt',
    });

    this.version(6).stores({
      projects: 'id, name, status, priority, healthStatus, updatedAt',
      tasks: 'id, title, projectId, status, priority, quadrant, isCompleted, energyRequired, deadline, updatedAt',
      knowledge: 'id, title, type, *tags, projectId, updatedAt',
      goals: 'id, title, level, status, lifeArea, updatedAt',
      inbox: 'id, title, type, status, createdAt',
      journal: 'id, date, entryType, moodScore, energyScore, createdAt, updatedAt',
      pantry: 'id, itemName, category, status, updatedAt',
      syncConflicts: 'id, table, recordId, resolved, timestamp',
      syncSettings: 'id, value, updatedAt',
      syncQueue: 'id, table, action, recordId, timestamp, status',
      pdfDocuments: 'id, title, category, *tags, lastOpenedAt',
      pdfReadingStates: 'documentId, lastPage, updatedAt',
      pdfAnnotations: 'id, documentId, pageNumber, type, createdAt',
      noteDestinations: 'id, title, format, lastUsedAt',
      health: 'id, date, pranaScore, createdAt, updatedAt',
      properties: 'id, title, location, status, updatedAt',
      semanticEmbeddings: 'id, itemId, itemType, updatedAt',
    });

    this.version(7).stores({
      projects: 'id, name, status, priority, healthStatus, updatedAt',
      tasks: 'id, title, projectId, status, priority, quadrant, isCompleted, energyRequired, deadline, updatedAt',
      knowledge: 'id, title, type, *tags, projectId, updatedAt',
      goals: 'id, title, level, status, lifeArea, updatedAt',
      inbox: 'id, title, type, status, createdAt',
      journal: 'id, date, entryType, moodScore, energyScore, createdAt, updatedAt',
      pantry: 'id, itemName, category, status, updatedAt',
      syncConflicts: 'id, table, recordId, resolved, timestamp',
      syncSettings: 'id, value, updatedAt',
      syncQueue: 'id, table, action, recordId, timestamp, status',
      pdfDocuments: 'id, title, category, *tags, lastOpenedAt',
      pdfReadingStates: 'documentId, lastPage, updatedAt',
      pdfAnnotations: 'id, documentId, pageNumber, type, createdAt',
      noteDestinations: 'id, title, format, lastUsedAt',
      health: 'id, date, pranaScore, createdAt, updatedAt',
      properties: 'id, title, location, status, updatedAt',
      semanticEmbeddings: 'id, itemId, itemType, updatedAt',
      jyotishCharts: 'id, title, dateTime, locationName, createdAt, updatedAt',
    });
  }
}

export const db = new OmKnowledgeDatabase();

// Seed initial realistic data from Om Knowledge OS v2.0 if database is empty
export async function initializeSeedDataIfEmpty() {
  const projectCount = await db.projects.count();
  if (projectCount > 0) return;

  const now = Date.now();

  // Seed Projects
  const p1Id = 'proj-1';
  const p2Id = 'proj-2';
  const p3Id = 'proj-3';

  await db.projects.bulkAdd([
    {
      id: p1Id,
      name: 'Om Knowledge OS Architecture & Deployment',
      status: 'In Progress',
      priority: 'High',
      healthStatus: 'On Track',
      progress: 65,
      budget: 'Zero Extra Spend',
      deadline: '2026-11-01',
      tags: ['OS Architecture', 'PKM', 'Desktop & Mobile'],
      createdAt: now - 86400000 * 5,
      updatedAt: now,
    },
    {
      id: p2Id,
      name: 'Health & Ayurveda Routine Optimization',
      status: 'In Progress',
      priority: 'High',
      healthStatus: 'On Track',
      progress: 40,
      budget: 'Personal Care',
      deadline: '2026-12-31',
      tags: ['Ayurveda', 'Wellness', 'Daily Log'],
      createdAt: now - 86400000 * 10,
      updatedAt: now,
    },
    {
      id: p3Id,
      name: 'Land & Property Due Diligence Research',
      status: 'Not Started',
      priority: 'Medium',
      healthStatus: 'On Track',
      progress: 15,
      budget: 'Asset Research',
      deadline: '2027-03-31',
      tags: ['Real Estate', 'Due Diligence', 'Location Study'],
      createdAt: now - 86400000 * 15,
      updatedAt: now,
    },
  ]);

  // Seed Tasks (Eisenhower Matrix)
  await db.tasks.bulkAdd([
    {
      id: 'task-1',
      title: 'Configure Google Sheets Sync bridge for Tasks table',
      projectId: p1Id,
      status: 'In Progress',
      priority: 'Urgent & Important',
      quadrant: 'Q1',
      deadline: '2026-10-20',
      urgency: 'High',
      impact: 'High',
      energyRequired: 'Deep Work',
      isCompleted: false,
      createdAt: now - 3600000 * 6,
      updatedAt: now,
    },
    {
      id: 'task-2',
      title: 'Review and categorize AI conversation exports from ChatGPT & Gemini',
      projectId: p1Id,
      status: 'To Do',
      priority: 'Important Not Urgent',
      quadrant: 'Q2',
      deadline: '2026-10-25',
      urgency: 'Medium',
      impact: 'High',
      energyRequired: 'Deep Work',
      isCompleted: false,
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'task-3',
      title: 'Morning Surya Namaskar and triphala herbal intake',
      projectId: p2Id,
      status: 'Done',
      priority: 'Urgent & Important',
      quadrant: 'Q1',
      deadline: '2026-10-15',
      urgency: 'High',
      impact: 'High',
      energyRequired: 'Quick Win',
      isCompleted: true,
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'task-4',
      title: 'Verify flood zone and road width metrics for Uttarakhand land parcel',
      projectId: p3Id,
      status: 'To Do',
      priority: 'Important Not Urgent',
      quadrant: 'Q2',
      deadline: '2026-11-15',
      urgency: 'Low',
      impact: 'High',
      energyRequired: 'Deep Work',
      isCompleted: false,
      createdAt: now - 3600000 * 48,
      updatedAt: now,
    },
    {
      id: 'task-5',
      title: 'Quick kitchen inventory reorder check for basmati rice and cold-pressed mustard oil',
      status: 'To Do',
      priority: 'Urgent Not Important',
      quadrant: 'Q3',
      deadline: '2026-10-16',
      urgency: 'High',
      impact: 'Low',
      energyRequired: 'Quick Win',
      isCompleted: false,
      createdAt: now - 3600000 * 2,
      updatedAt: now,
    },
  ]);

  // Seed Knowledge Vault
  await db.knowledge.bulkAdd([
    {
      id: 'know-1',
      title: 'Vivarta Vada vs Parinama Vada: Core Metaphysics',
      type: 'Concept',
      content: `### Vivarta Vada (Apparent Transformation)
In Advaita Vedanta, **Vivarta Vada** explains that the universe is an apparent manifestation (superimposition or Adhyasa) of Brahman through Maya, without Brahman undergoing any real intrinsic mutation.
- Example: The rope appearing as a serpent in dim light. The rope never actually transforms into venomous organic matter; only the observer's perception superimposes snake-attributes upon the substratum.

### Parinama Vada (Real Transformation)
Associated with Samkhya and Vishishtadvaita. The cause undergoes actual physical modification into the effect.
- Example: Milk genuinely curdling into yogurt.`,
      tags: ['Vedanta', 'Philosophy', 'Metaphysics', 'Vivarta Vada'],
      projectId: p1Id,
      createdAt: now - 86400000 * 4,
      updatedAt: now,
    },
    {
      id: 'know-2',
      title: 'Mati & Vivek: The Cognitive Filter of Discrimination',
      type: 'Note',
      content: `**Viveka** is the razor-sharp faculty of discernment between Nitya (the eternal, unmoving conscious witness) and Anitya (the transient, changing appearances of phenomena, moods, thoughts, and external conditions).

When integrating personal knowledge into an OS:
1. Don't store indiscriminate raw data.
2. Filter thoughts through *Vivek*: Does this note serve long-term wisdom, actionable execution, or spiritual clarity?`,
      tags: ['Mind Mastery', 'Viveka', 'Discernment'],
      createdAt: now - 86400000 * 3,
      updatedAt: now,
    },
    {
      id: 'know-3',
      title: 'Uttarkashi Himalayan Sanctuary Site Criteria',
      type: 'Source',
      content: `Key parameters for evaluating spiritual retreat or sustainable homestead property in Uttarakhand:
- **Elevation**: 1100m â€“ 1600m (temperate summers, brisk winters).
- **Water Source**: Perennial mountain stream (gadhera) or gravity-fed spring within 200m.
- **Solar Exposure**: South or South-East facing ridge for maximum winter insolation.
- **Title Verification**: Verify 12-year revenue record (Khatauni) and non-encumbrance certificate at local Tehsil.`,
      tags: ['Land Research', 'Uttarkashi', 'Property', 'Himalayas'],
      projectId: p3Id,
      createdAt: now - 86400000 * 6,
      updatedAt: now,
    },
  ]);

  // Seed Goals (Life Pyramid)
  await db.goals.bulkAdd([
    {
      id: 'goal-1',
      title: 'Realize Self-Mastery & Consistent Meditative Absorption (Dhyana)',
      level: 'Life Vision',
      status: 'Active',
      progress: 75,
      lifeArea: 'Spiritual & Inner',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'goal-2',
      title: 'Build Autonomous, Portable Personal Knowledge Operating System',
      level: '1-Year',
      status: 'Active',
      progress: 60,
      lifeArea: 'Career & Skills',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'goal-3',
      title: 'Attain Peak Pranic Vitality via Ayurvedic Dinacharya & Sattvic Nutrition',
      level: '1-Year',
      status: 'Active',
      progress: 50,
      lifeArea: 'Health & Vitality',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'goal-4',
      title: 'Complete Land Due Diligence & Acquire Peaceful Mountain Homestead',
      level: '5-Year',
      status: 'Active',
      progress: 20,
      lifeArea: 'Wealth & Assets',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // Seed Pantry / Kitchen Operations
  await db.pantry.bulkAdd([
    {
      id: 'pantry-1',
      itemName: 'Organic Basmati Rice (Aged)',
      category: 'Grains & Pulses',
      currentQty: '4.5 kg',
      reorderPoint: '2.0 kg',
      status: 'In Stock',
      storageType: 'Pantry',
      updatedAt: now,
    },
    {
      id: 'pantry-2',
      itemName: 'Cold-Pressed Yellow Mustard Oil',
      category: 'Spices & Oils',
      currentQty: '0.8 L',
      reorderPoint: '1.0 L',
      status: 'Low',
      storageType: 'Pantry',
      updatedAt: now,
    },
    {
      id: 'pantry-3',
      itemName: 'Desi Cow A2 Cultured Ghee',
      category: 'Dairy & Essentials',
      currentQty: '1.2 kg',
      reorderPoint: '0.5 kg',
      status: 'In Stock',
      storageType: 'Pantry',
      updatedAt: now,
    },
    {
      id: 'pantry-4',
      itemName: 'Organic Triphala Churna',
      category: 'Herbs & Supplements',
      currentQty: '250 g',
      reorderPoint: '100 g',
      status: 'In Stock',
      storageType: 'Spice Rack',
      updatedAt: now,
    },
  ]);

  // Seed Today's Journal Entry
  const todayStr = new Date().toISOString().split('T')[0];
  await db.journal.add({
    id: `journal-${todayStr}`,
    date: todayStr,
    entryType: 'Daily',
    moodScore: 8,
    energyScore: 9,
    morningTop3: [
      'Scaffold Om Knowledge OS Path A on desktop & phone',
      'Morning pranayama and sunlight exposure',
      'Review task matrix and plan next sprint',
    ],
    eveningWins: [
      'Successfully initialized local-first database architecture',
      'Cleared unneeded blockers and verified toolchain',
    ],
    content: 'A day of focused progress. The vision of unifying knowledge, spiritual practice, health, and execution into one private operating system is coming to life.',
    createdAt: now,
    updatedAt: now,
  });
}



