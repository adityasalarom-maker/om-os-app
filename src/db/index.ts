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

export interface KhasraParcelRecord {
  id: string; // e.g. "khasra-142-1"
  khasraNumber: string; // e.g. "142/1"
  khataNumber: string; // e.g. "00045"
  fasliYear: string; // e.g. "1431-1436 Fasli"
  villageTehsil: string; // e.g. "Netala, Bhatwari Tehsil, Uttarkashi"
  landClassification: 'Krishi (Agricultural)' | 'Bagicha (Orchard)' | 'Abadi (Residential)' | 'Banjar (Uncultivated)';
  bhumidharNames: string[];
  shareFraction?: string;
  areaNali: number;
  areaMutthi: number;
  areaSqMeters: number;
  coordinates: [number, number][]; // [lon, lat]
  elevationMin: number;
  elevationMax: number;
  slopePercent: number;
  aspectDirection: 'South' | 'South-East' | 'East' | 'South-West' | 'North' | 'North-East' | 'North-West' | 'West';
  waterStreamDistanceMeters: number;
  roadDistanceMeters: number;
  riskScore: number;
  diligenceStatus: 'Clear' | 'Conditional' | 'High Risk' | 'Pending';
  legalChecks: {
    khatauni12Yr: boolean;
    nec12Yr: boolean;
    section143Cleared: boolean;
    patwariDemarcated: boolean;
    disasterSafe: boolean;
  };
  encumbranceNotes: string;
  propertyId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DreamLogRecord {
  id: string;
  date: string; // YYYY-MM-DD
  wakeTime?: string;
  title: string;
  narrative: string;
  state: 'Lucid Dream' | 'Astral Projection (OBE)' | 'Prophetic / Archetypal' | 'Symbolic Teaching' | 'Ordinary REM' | 'Nidra Shadow';
  lucidityLevel: number; // 0 - 5
  clarityScore: number; // 1 - 10
  recallQuality: 'Faint' | 'Moderate' | 'Vivid' | 'Photographic';
  symbols: string[];
  astralVibrations: boolean;
  silverCordFelt: boolean;
  astralDestination?: string;
  primaryChakraResonance: 'Muladhara' | 'Svadhisthana' | 'Manipura' | 'Anahata' | 'Vishuddha' | 'Ajna' | 'Sahasrara';
  lunarTithi?: string;
  lunarNakshatra?: string;
  interpretation?: string;
  isNightmare: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SadhanaLogRecord {
  id: string;
  date: string; // YYYY-MM-DD
  brahmaMuhurta: boolean;
  japaMantra: string;
  japaCount: number;
  japaMalas: number;
  japaMinutes: number;
  pranayamaTechnique: string;
  pranayamaMinutes: number;
  kumbhakaRetentionSeconds: number;
  dhyanaTechnique: string;
  dhyanaMinutes: number;
  stillnessScore: number; // 1 - 10
  asanaKayaMinutes: number;
  swadhyayaText?: string;
  swadhyayaMinutes: number;
  ojasScore: number; // 0 - 100
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VedicVerseRecord {
  id: string; // e.g. "mandukya-1" or "gita-2-16"
  canon: 'Upanishad' | 'Bhagavad Gita' | 'Brahma Sutras' | 'Shankara Bhashya' | 'Nath Agama';
  sourceText: string;
  chapterVerse: string;
  sanskritDevanagari: string;
  transliterationIast: string;
  wordBreakdown: { word: string; meaning: string; grammar?: string }[];
  englishTranslation: string;
  shankaraBhashyaSummary: string;
  philosophicalVada: 'Vivarta-Vada' | 'Parinama-Vada' | 'Cid-Vilasa-Vada' | 'Abhasa-Vada' | 'Satkaryavada' | 'Asatkaryavada' | 'Pratityasamutpada' | 'Samanvaya';
  mahavakya: boolean;
  crossReferences: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PhilosophicalVadaRecord {
  id: string;
  name: string;
  school: string;
  proponent: string;
  coreAnalogy: string;
  karyaKaranaRelation: string;
  worldStatus: 'Mithya (Dependent Reality)' | 'Satya (Divine Expression)' | 'Shunya (Empty/Momentary)' | 'Real Physical Evolution' | 'Atomic Creation';
  keyScriptures: string[];
  detailedCritique: string;
}

export interface PranayamaSessionRecord {
  id: string; // e.g. "prana-1729188000000"
  date: string; // YYYY-MM-DD
  timestamp: number;
  patternName: 'Sama Vritti' | 'Visama Vritti' | 'Nadi Shodhana' | 'Kumbhaka Intensive' | 'Kapalabhati' | 'Bhramari' | 'Sheetali' | 'Custom';
  ratio: [number, number, number, number]; // [puraka, antara, rechaka, bahya] in seconds
  totalCycles: number;
  totalDurationSeconds: number;
  swaraActive: 'Chandra (Ida / Left)' | 'Surya (Pingala / Right)' | 'Sushumna (Equilibrium / Both)';
  retentionComfortScore: number; // 1 to 10
  pranaVayus: {
    prana: number;   // Chest / Vitality (1-10)
    apana: number;   // Grounding / Elimination (1-10)
    samana: number;  // Solar plexus / Digestion (1-10)
    udana: number;   // Throat / Ascending focus (1-10)
    vyana: number;   // Whole body / Circulation (1-10)
  };
  heartRateEstimateBpm?: number;
  notes?: string;
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
  khasraParcels!: Table<KhasraParcelRecord, string>;
  dreamLogs!: Table<DreamLogRecord, string>;
  sadhanaLogs!: Table<SadhanaLogRecord, string>;
  vedicVerses!: Table<VedicVerseRecord, string>;
  philosophicalVadas!: Table<PhilosophicalVadaRecord, string>;
  pranayamaSessions!: Table<PranayamaSessionRecord, string>;

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

    this.version(8).stores({
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
      khasraParcels: 'id, khasraNumber, khataNumber, villageTehsil, propertyId, diligenceStatus, updatedAt',
    });

    this.version(9).stores({
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
      khasraParcels: 'id, khasraNumber, khataNumber, villageTehsil, propertyId, diligenceStatus, updatedAt',
      dreamLogs: 'id, date, state, lucidityLevel, primaryChakraResonance, createdAt, updatedAt',
      sadhanaLogs: 'id, date, japaMantra, ojasScore, brahmaMuhurta, createdAt, updatedAt',
    });

    this.version(10).stores({
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
      khasraParcels: 'id, khasraNumber, khataNumber, villageTehsil, propertyId, diligenceStatus, updatedAt',
      dreamLogs: 'id, date, state, lucidityLevel, primaryChakraResonance, createdAt, updatedAt',
      sadhanaLogs: 'id, date, japaMantra, ojasScore, brahmaMuhurta, createdAt, updatedAt',
      vedicVerses: 'id, canon, sourceText, philosophicalVada, mahavakya, *tags, updatedAt',
      philosophicalVadas: 'id, name, school, worldStatus, updatedAt',
    });

    this.version(11).stores({
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
      khasraParcels: 'id, khasraNumber, khataNumber, villageTehsil, propertyId, diligenceStatus, updatedAt',
      dreamLogs: 'id, date, state, lucidityLevel, primaryChakraResonance, createdAt, updatedAt',
      sadhanaLogs: 'id, date, japaMantra, ojasScore, brahmaMuhurta, createdAt, updatedAt',
      vedicVerses: 'id, canon, sourceText, philosophicalVada, mahavakya, *tags, updatedAt',
      philosophicalVadas: 'id, name, school, worldStatus, updatedAt',
      pranayamaSessions: 'id, date, timestamp, patternName, swaraActive, createdAt, updatedAt',
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

  // Seed Himalayan Khasra cadastral parcels
  await ensureSeedKhasraParcelsIfEmpty();
}

export async function ensureSeedKhasraParcelsIfEmpty() {
  const count = await db.khasraParcels.count();
  if (count > 0) return;

  const now = Date.now();
  await db.khasraParcels.bulkAdd([
    {
      id: 'khasra-142-1',
      khasraNumber: '142/1',
      khataNumber: '00042',
      fasliYear: '1431-1436 Fasli',
      villageTehsil: 'Netala, Bhatwari Tehsil, Uttarkashi',
      landClassification: 'Bagicha (Orchard)',
      bhumidharNames: ['Sundar Singh Negi', 'Devendra Singh Negi'],
      shareFraction: '1/2 Joint Tenancy',
      areaNali: 4.5,
      areaMutthi: 0,
      areaSqMeters: 903.02,
      coordinates: [
        [78.4912, 30.7654],
        [78.4925, 30.7658],
        [78.4929, 30.7649],
        [78.4915, 30.7645],
      ],
      elevationMin: 1360,
      elevationMax: 1385,
      slopePercent: 18,
      aspectDirection: 'South-East',
      waterStreamDistanceMeters: 45,
      roadDistanceMeters: 25,
      riskScore: 95,
      diligenceStatus: 'Clear',
      legalChecks: {
        khatauni12Yr: true,
        nec12Yr: true,
        section143Cleared: true,
        patwariDemarcated: true,
        disasterSafe: true,
      },
      encumbranceNotes: '12-Year Khatauni inspected at Bhatwari Tehsil. Clear hereditary Bhumidhari title with transferable rights. 200m buffer from Bhagirathi river intact; 45m from perennial Netala Gadhera.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'khasra-142-2',
      khasraNumber: '142/2',
      khataNumber: '00042',
      fasliYear: '1431-1436 Fasli',
      villageTehsil: 'Netala, Bhatwari Tehsil, Uttarkashi',
      landClassification: 'Krishi (Agricultural)',
      bhumidharNames: ['Sundar Singh Negi', 'Devendra Singh Negi'],
      shareFraction: '1/2 Joint Tenancy',
      areaNali: 3.2,
      areaMutthi: 3.2,
      areaSqMeters: 642.15,
      coordinates: [
        [78.4925, 30.7658],
        [78.4938, 30.7662],
        [78.4941, 30.7653],
        [78.4929, 30.7649],
      ],
      elevationMin: 1375,
      elevationMax: 1398,
      slopePercent: 16,
      aspectDirection: 'South-East',
      waterStreamDistanceMeters: 80,
      roadDistanceMeters: 60,
      riskScore: 90,
      diligenceStatus: 'Clear',
      legalChecks: {
        khatauni12Yr: true,
        nec12Yr: true,
        section143Cleared: true,
        patwariDemarcated: true,
        disasterSafe: true,
      },
      encumbranceNotes: 'Adjoining upper terraced orchard slope. Gravity-fed spring water channel easement registered in Khatauni remarks.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'khasra-89-b',
      khasraNumber: '89/B',
      khataNumber: '00118',
      fasliYear: '1430-1435 Fasli',
      villageTehsil: 'Ranikhet Sun-facing Apple Ridge, Almora',
      landClassification: 'Bagicha (Orchard)',
      bhumidharNames: ['Kailash Chandra Joshi'],
      shareFraction: 'Sole Bhumidhar',
      areaNali: 8.0,
      areaMutthi: 0,
      areaSqMeters: 1605.37,
      coordinates: [
        [79.4310, 29.6450],
        [79.4328, 29.6456],
        [79.4332, 29.6442],
        [79.4314, 29.6436],
      ],
      elevationMin: 1820,
      elevationMax: 1865,
      slopePercent: 22,
      aspectDirection: 'South',
      waterStreamDistanceMeters: 120,
      roadDistanceMeters: 15,
      riskScore: 75,
      diligenceStatus: 'Conditional',
      legalChecks: {
        khatauni12Yr: true,
        nec12Yr: true,
        section143Cleared: false,
        patwariDemarcated: false,
        disasterSafe: true,
      },
      encumbranceNotes: 'Clean 12-year revenue chain. Requires Section 143 conversion and physical demarcation stone survey with Patwari prior to sale deed execution.',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // Seed Metaphysical Dream & Astral Logs
  await db.dreamLogs.bulkAdd([
    {
      id: 'dream-1',
      date: new Date(now - 86400000).toISOString().split('T')[0],
      wakeTime: '04:15',
      title: 'Himalayan Astral Flight Over Mount Kailash & Om Parvat',
      narrative: 'Awakened at 03:45 AM during Brahma Muhurta. High-frequency electrical vibrations surged from feet to crown (Ajna resonance). Experienced classic kinetic separation out of the physical body. A luminous silver cord remained anchored to the solar plexus. Navigated northeast at immense velocity towards the Great Himalayan divide. Viewed Mount Kailash under pristine starlight with natural snow-inscribed Om glyph radiating subtle blue-violet bioluminescence. Overwhelming sense of Cid-Vilāsa (consciousness observing its own joyful play). Complete absence of fear.',
      state: 'Astral Projection (OBE)',
      lucidityLevel: 5,
      clarityScore: 10,
      recallQuality: 'Photographic',
      symbols: ['Mount Kailash', 'Om Parvat', 'Silver Cord', 'Astral Flight', 'Shiva', 'Pure Light'],
      astralVibrations: true,
      silverCordFelt: true,
      astralDestination: 'Kailash Inner Sanctum & Manasarovar Etheric Grid',
      primaryChakraResonance: 'Ajna',
      lunarTithi: 'Shukla Panchami',
      lunarNakshatra: 'Mula',
      interpretation: 'Direct somatic confirmation of Gorakhnath Cid-Vilasa-Vada—the universe as the active, joyous overflow of Shiva’s creative freedom. Ajna and Sahasrara activation indicates deep meditation residue from evening Japa.',
      isNightmare: false,
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'dream-2',
      date: new Date(now - 86400000 * 3).toISOString().split('T')[0],
      wakeTime: '05:10',
      title: 'The Ancient Copper Scroll & Kashmir Shaivism Dialogue',
      narrative: 'Found myself standing in an open stone pavilion alongside a mountain river. An ascetic in saffron robes presented a hand-engraved copper scroll containing verses on Spanda and the mirror-analogy of Abhasa-Vada. The teacher pointed to the reflection of trees in the water: "The reflection does not wet the mirror, yet the reflection is real." Woke with extreme intellectual clarity.',
      state: 'Symbolic Teaching',
      lucidityLevel: 3,
      clarityScore: 9,
      recallQuality: 'Vivid',
      symbols: ['Copper Plate Inscription', 'Kashmir Temple', 'River Vitasta', 'Guru Gorakshanath', 'Spanda'],
      astralVibrations: false,
      silverCordFelt: false,
      primaryChakraResonance: 'Vishuddha',
      lunarTithi: 'Shukla Tritiya',
      lunarNakshatra: 'Anuradha',
      interpretation: 'Deep consolidation of study notes on Vivarta vs Abhasa vs Cid-Vilasa-Vada. Vishuddha (space/speech/transmission) resonance.',
      isNightmare: false,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 3,
    },
    {
      id: 'dream-3',
      date: new Date(now - 86400000 * 5).toISOString().split('T')[0],
      wakeTime: '04:50',
      title: 'Luminous Sri Yantra Geometry in Space',
      narrative: 'Suspended in deep indigo space without a physical container. A golden, three-dimensional Sri Yantra rotated slowly on its vertical axis. Each interlocking triangle emitted a distinct acoustic tone that coalesced into the sound of Om (Nada). Full conscious awareness of being the observer rather than any physical form.',
      state: 'Lucid Dream',
      lucidityLevel: 4,
      clarityScore: 9,
      recallQuality: 'Vivid',
      symbols: ['Sri Yantra', 'Golden Geometry', 'Nada Om Tone', 'Cosmic Indigo Space', 'Sakshi Bhava'],
      astralVibrations: true,
      silverCordFelt: false,
      primaryChakraResonance: 'Sahasrara',
      lunarTithi: 'Pratipada',
      lunarNakshatra: 'Chitra',
      interpretation: 'Pure contemplative yantra darshan. Deep stillness and pratyahara manifestation.',
      isNightmare: false,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 5,
    },
  ]);

  // Seed Sadhana Discipline & Practice Logs
  await db.sadhanaLogs.bulkAdd([
    {
      id: 'sadhana-1',
      date: new Date(now).toISOString().split('T')[0],
      brahmaMuhurta: true,
      japaMantra: 'Maha Mrityunjaya Mantra',
      japaCount: 1080,
      japaMalas: 10,
      japaMinutes: 45,
      pranayamaTechnique: 'Nadi Shodhana + Antar Kumbhaka (1:4:2 ratio)',
      pranayamaMinutes: 20,
      kumbhakaRetentionSeconds: 32,
      dhyanaTechnique: 'Sakshi Bhava (Witness Consciousness)',
      dhyanaMinutes: 30,
      stillnessScore: 9,
      asanaKayaMinutes: 25,
      swadhyayaText: 'Gorakhnath Cid-Vilāsa-Vāda & Siddha Siddhanta Paddhati',
      swadhyayaMinutes: 30,
      ojasScore: 94,
      notes: 'Deep stillness achieved early during Brahma Muhurta. Heartbeat felt rhythmic and slowed to 52 bpm during Kumbhaka. Spontaneous Ajna pulsation.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sadhana-2',
      date: new Date(now - 86400000).toISOString().split('T')[0],
      brahmaMuhurta: true,
      japaMantra: 'Gayatri Mantra',
      japaCount: 540,
      japaMalas: 5,
      japaMinutes: 30,
      pranayamaTechnique: 'Kapalabhati + Sheetali',
      pranayamaMinutes: 15,
      kumbhakaRetentionSeconds: 24,
      dhyanaTechnique: 'Nada Yoga (Inner Sound Contemplation)',
      dhyanaMinutes: 25,
      stillnessScore: 8,
      asanaKayaMinutes: 20,
      swadhyayaText: 'Kashmir Shaivism Shiva Sutras & Spanda Karika',
      swadhyayaMinutes: 25,
      ojasScore: 86,
      notes: 'Subtle high-pitched Nada bell sound perceived clearly in right ear during meditation.',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'sadhana-3',
      date: new Date(now - 86400000 * 2).toISOString().split('T')[0],
      brahmaMuhurta: false,
      japaMantra: 'Om Namah Shivaya',
      japaCount: 324,
      japaMalas: 3,
      japaMinutes: 20,
      pranayamaTechnique: 'Bhastrika + Anulom Vilom',
      pranayamaMinutes: 15,
      kumbhakaRetentionSeconds: 20,
      dhyanaTechnique: 'Chakra Anusandhana',
      dhyanaMinutes: 20,
      stillnessScore: 7,
      asanaKayaMinutes: 30,
      swadhyayaText: 'Bhagavad Gita Chapter 6 (Dhyana Yoga)',
      swadhyayaMinutes: 20,
      ojasScore: 78,
      notes: 'Steady grounding practice. Muladhara and Manipura balance stabilized.',
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
  ]);

  // Seed Canonical Vedic & Philosophical Verses
  await db.vedicVerses.bulkAdd([
    {
      id: 'verse-mandukya-1',
      canon: 'Upanishad',
      sourceText: 'Māṇḍūkya Upaniṣad',
      chapterVerse: 'Verse 1',
      sanskritDevanagari: 'ओमित्येतदक्षरमिदं सर्वं तस्योपव्याख्यानं भूतं भवद्भवविष्यदिति सर्वमोङ्कार एव। यच्चान्यत् त्रिकालातीतं तदप्योङ्कार एव॥',
      transliterationIast: 'om ity etad akṣaram idaṁ sarvaṁ tasyopavyākhyānaṁ bhūtaṁ bhavad bhaviṣyad iti sarvam oṅkāra eva | yac cānyat trikālātītaṁ tad apy oṅkāra eva ||',
      wordBreakdown: [
        { word: 'om', meaning: 'The sacred syllable OM, the ultimate matrix of consciousness' },
        { word: 'iti', meaning: 'thus' },
        { word: 'etad akṣaram', meaning: 'this imperishable syllable' },
        { word: 'idam sarvam', meaning: 'all this visible and invisible universe' },
        { word: 'tasyopavyākhyānam', meaning: 'its comprehensive exposition' },
        { word: 'bhūtam bhavad bhaviṣyat', meaning: 'the past, present, and future' },
        { word: 'sarvam oṅkāra eva', meaning: 'all is indeed the syllable OM' },
        { word: 'trikālātītam', meaning: 'that which transcends the three dimensions of time' }
      ],
      englishTranslation: 'OM: This syllable is all this. An explanation thereof is: whatever has existed in the past, whatever exists in the present, and whatever shall exist in the future—all this is indeed OM. And whatever transcends the threefold division of time—that too is indeed OM.',
      shankaraBhashyaSummary: 'Shankara establishes in the Mandukya Bhashya that the Name (Abhidhāna: Om) and the Named Object (Abhidheya: Brahman) are non-different. The entire cosmos of sensory appearances is a phonetic and vibrational superimposition (Vivarta) upon pure changeless Awareness.',
      philosophicalVada: 'Vivarta-Vada',
      mahavakya: false,
      crossReferences: ['verse-mandukya-7', 'verse-brahmasutra-1-1-1'],
      tags: ['Mandukya', 'Om', 'Pranava', 'Nonduality', 'Time Transcendence'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'verse-mandukya-7',
      canon: 'Upanishad',
      sourceText: 'Māṇḍūkya Upaniṣad',
      chapterVerse: 'Verse 7 (Turīya)',
      sanskritDevanagari: 'नान्तःप्रज्ञं न बहिष्प्रज्ञं नोभयतःप्रज्ञं न प्रज्ञानघनं न प्रज्ञं नाप्रज्ञम्। अदृष्टमव्यवहार्यमग्राह्यमलक्षणमचिन्त्यमव्यपदेश्यमेकात्मप्रत्ययसारं प्रपञ्चोपशमं शान्तं शिवमद्वैतं चतुर्थं मन्यन्ते स आत्मा स विज्ञेयः॥',
      transliterationIast: 'nāntaḥ-prajñaṁ na bahiṣ-prajñaṁ nobhayataḥ-prajñaṁ na prajñāna-ghanaṁ na prajñaṁ nāprajñam | adṛṣṭam avyavahāryam agrāhyam alakṣaṇam acintyam avyapadeśyam ekātma-pratyaya-sāraṁ prapañcopaśamaṁ śāntaṁ śivam advaitaṁ caturthaṁ manyante sa ātmā sa vijñeyaḥ ||',
      wordBreakdown: [
        { word: 'na antaḥ-prajñam', meaning: 'not conscious of the internal dream world' },
        { word: 'na bahiṣ-prajñam', meaning: 'not conscious of the external waking world' },
        { word: 'na ubhayataḥ-prajñam', meaning: 'not conscious of both simultaneously' },
        { word: 'prapañcopaśamam', meaning: 'the complete cessation of all phenomenal plurality' },
        { word: 'śāntam', meaning: 'tranquil, undisturbed' },
        { word: 'śivam', meaning: 'auspicious, pure bliss' },
        { word: 'advaitam', meaning: 'non-dual, without a second' },
        { word: 'caturtham', meaning: 'the Fourth state (Turīya)' },
        { word: 'sa ātmā sa vijñeyaḥ', meaning: 'That is the Self; That is to be realized' }
      ],
      englishTranslation: 'Turīya is not that which is conscious of the inner subjective world, nor that which is conscious of the outer objective world, nor that which is a mass of consciousness. It is unperceived, unrelated, incomprehensible, uninferable, unthinkable, and indescribable. Its essence is the certitude of its own Self. It is the cessation of all phenomena; it is all peace, all bliss, and non-dual. This is the Self, and This is to be realized.',
      shankaraBhashyaSummary: 'The crown jewel of Advaita ontology. Shankara demonstrates that Turiya is not a numerical fourth state sequential to waking, dreaming, and deep sleep, but the unchanging substratum (Adhiṣṭhāna) upon which the three temporary states playfully appear and dissolve.',
      philosophicalVada: 'Vivarta-Vada',
      mahavakya: true,
      crossReferences: ['verse-mandukya-1', 'verse-adhyasa-bhashya'],
      tags: ['Turiya', 'Advaita', 'Witness Sakshi', 'Mandukya', 'Transcendence'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'verse-chandogya-6-8-7',
      canon: 'Upanishad',
      sourceText: 'Chāndogya Upaniṣad',
      chapterVerse: '6.8.7 (Mahāvākya)',
      sanskritDevanagari: 'स य एषोऽणिमैतदात्म्यमिदं सर्वं तत्सत्यं स आत्मा तत्त्वमसि श्वेतकेतो इति॥',
      transliterationIast: 'sa ya eṣo \'ṇimaitad-ātmyam idaṁ sarvaṁ tat satyaṁ sa ātmā tat tvam asi śvetaketo iti ||',
      wordBreakdown: [
        { word: 'sa yaḥ eṣaḥ', meaning: 'That which is this' },
        { word: 'aṇimā', meaning: 'subtle, finest essence' },
        { word: 'etad-ātmyam idam sarvam', meaning: 'all this has this subtle Essence as its Self' },
        { word: 'tat satyam', meaning: 'That alone is the Ultimate Truth' },
        { word: 'sa ātmā', meaning: 'That is the True Self' },
        { word: 'tat tvam asi', meaning: 'THAT THOU ART (You are That)' },
        { word: 'śvetaketo', meaning: 'O Shvetaketu' }
      ],
      englishTranslation: 'That which is the subtlest essence—all this universe has That for its Self. That is the Truth. That is the Self. That Thou Art, O Shvetaketu!',
      shankaraBhashyaSummary: 'The famous Sama Veda Mahāvākya. Shankara in the Bhashya utilizes Jahad-Ajahallakṣaṇā (exclusive-inclusive implication): stripping away the contradictory finite attributes of the individual Jīva (limited body-mind) and the cosmic attributes of Īśvara (omniscience/creator) to reveal the absolute identity of Pure Consciousness.',
      philosophicalVada: 'Vivarta-Vada',
      mahavakya: true,
      crossReferences: ['verse-brihadaranyaka-1-4-10', 'verse-brahmasutra-1-1-4'],
      tags: ['Mahavakya', 'Tat Tvam Asi', 'Chandogya', 'Identity', 'Uddalaka'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'verse-brihadaranyaka-1-4-10',
      canon: 'Upanishad',
      sourceText: 'Bṛhadāraṇyaka Upaniṣad',
      chapterVerse: '1.4.10 (Mahāvākya)',
      sanskritDevanagari: 'ब्रह्म वा इदमग्र आसीत् तदात्मानमेवावेत् अहं ब्रह्मास्मीति। तस्मात् तत्सर्वमभवत्॥',
      transliterationIast: 'brahma vā idam agra āsīt tad ātmānam evāvet ahaṁ brahmāsmīti | tasmāt tat sarvam abhavat ||',
      wordBreakdown: [
        { word: 'brahma vā idam agre āsīt', meaning: 'In the beginning this universe was indeed Brahman' },
        { word: 'tat ātmānam eva avet', meaning: 'It knew only Itself' },
        { word: 'aham brahma asmi iti', meaning: 'as "I am Brahman"' },
        { word: 'tasmāt tat sarvam abhavat', meaning: 'therefore It became all this' }
      ],
      englishTranslation: 'This universe was indeed Brahman in the beginning. It knew only Itself as, "I am Brahman." Therefore It became all. Whosoever among the gods had this direct awakening, they indeed became That.',
      shankaraBhashyaSummary: 'Yajur Veda Mahāvākya establishing subjective realization. Shankara explains that realization is not an action (Kriyā) producing something new, but the destruction of primal ignorance (Avidyā-Nivṛtti), revealing the ever-present fact of identity.',
      philosophicalVada: 'Vivarta-Vada',
      mahavakya: true,
      crossReferences: ['verse-chandogya-6-8-7', 'verse-mandukya-7'],
      tags: ['Mahavakya', 'Aham Brahmasmi', 'Brihadaranyaka', 'Yajnavalkya'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'verse-gita-2-16',
      canon: 'Bhagavad Gita',
      sourceText: 'Bhagavad Gītā',
      chapterVerse: 'Chapter 2, Verse 16',
      sanskritDevanagari: 'नासतो विद्यते भावो नाभावो विद्यते सतः। उभयोरपि दृष्टोऽन्तस्त्वनयोस्तत्त्वदर्शिभिः॥',
      transliterationIast: 'nāsato vidyate bhāvo nābhāvo vidyate sataḥ | ubhayor api dṛṣṭo \'ntas tv anayos tattva-darśibhiḥ ||',
      wordBreakdown: [
        { word: 'na asataḥ', meaning: 'of the unreal / changing phenomena' },
        { word: 'vidyate bhāvaḥ', meaning: 'there is no permanent existence or being' },
        { word: 'na abhāvaḥ', meaning: 'there is no non-existence or cessation' },
        { word: 'vidyate sataḥ', meaning: 'of the Real (Sat / Brahman)' },
        { word: 'ubhayor api', meaning: 'of both these two' },
        { word: 'dṛṣṭaḥ antaḥ', meaning: 'the definitive conclusion is realized' },
        { word: 'tattva-darśibhiḥ', meaning: 'by the seers of the Ultimate Truth' }
      ],
      englishTranslation: 'The unreal has no existence; the real never ceases to be. The ultimate truth concerning both these has been directly perceived by the seers of Reality.',
      shankaraBhashyaSummary: 'The cardinal criterion of reality in Advaita Vedānta. That which is subject to modification (Vikāra) or cancellation (Bādha) is Asat (Mithyā); that whose presence is never canceled across past, present, or future is Sat (Brahman).',
      philosophicalVada: 'Vivarta-Vada',
      mahavakya: false,
      crossReferences: ['verse-brahmasutra-1-1-1', 'verse-adhyasa-bhashya'],
      tags: ['Gita', 'Sat-Asat', 'Ontology', 'Criterion of Truth'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'verse-brahmasutra-1-1-1',
      canon: 'Brahma Sutras',
      sourceText: 'Brahma Sūtras',
      chapterVerse: 'Sūtra 1.1.1',
      sanskritDevanagari: 'अथातो ब्रह्मजिज्ञासा॥',
      transliterationIast: 'athāto brahma-jijñāsā ||',
      wordBreakdown: [
        { word: 'atha', meaning: 'Now, subsequent to the attainment of the Fourfold Qualifications (Sādhana-Catuṣṭaya)' },
        { word: 'ataḥ', meaning: 'therefore, because worldly and celestial fruits are impermanent' },
        { word: 'brahma-jijñāsā', meaning: 'the dedicated inquiry and desire to directly know Brahman' }
      ],
      englishTranslation: 'Now, therefore, the inquiry into Brahman.',
      shankaraBhashyaSummary: 'In the opening of the Catuhsutri, Shankara clarifies that "Atha" does not mean temporal sequence to Vedic rituals (Karma-Kanda), but rather the inner awakening of Viveka (discrimination), Vairāgya (dispassion), Śamādi-Ṣaṭka-Sampatti (sixfold mental virtues), and Mumukṣutva (burning yearning for liberation). Knowledge of Brahman is Vastu-Tantra (dependent entirely on reality), not Purusha-Tantra (dependent on human whim).',
      philosophicalVada: 'Vivarta-Vada',
      mahavakya: false,
      crossReferences: ['verse-adhyasa-bhashya', 'verse-gita-2-16'],
      tags: ['Brahma Sutras', 'Catuhsutri', 'Sadhana Chatushtaya', 'Jijnasa'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'verse-adhyasa-bhashya',
      canon: 'Shankara Bhashya',
      sourceText: 'Śrīmad Śāṅkara-Bhāṣya (Adhyāsa-Bhāṣya)',
      chapterVerse: 'Preamble to Brahma Sutras',
      sanskritDevanagari: 'युष्मदस्मत्प्रत्ययगोचरयोर्विषयविषयिणोस्तमःप्रकाशवद्विरुद्धस्वभावयोरितरेतरभावानुपपत्तौ सिद्धायाम्... तमसोऽविवेकेन इतरेतराविवेकेन अन्योन्यस्मिन्नन्योन्यात्मकतामन्योन्यधर्मांश्चाध्यस्य...',
      transliterationIast: 'yuṣmad-asmat-pratyaya-gocarayor viṣaya-viṣayiṇos tamaḥ-prakāśavad viruddha-svabhāvayor itaretara-bhāvānupapattau siddhāyām... tamaso \'vivekena itaretarāvivekena anyonyasminn anyonyātmakatām anyonya-dharmāṁś cādhyasya...',
      wordBreakdown: [
        { word: 'yuṣmad-pratyaya-gocara', meaning: 'The sphere of the object ("You" / Not-Self / Body-Mind / Jagat)' },
        { word: 'asmat-pratyaya-gocara', meaning: 'The sphere of the Subject ("I" / Self / Pure Consciousness)' },
        { word: 'tamaḥ-prakāśavat', meaning: 'like absolute darkness and light' },
        { word: 'viruddha-svabhāvayoḥ', meaning: 'being mutually opposed in nature' },
        { word: 'adhyāsya', meaning: 'superimposing through primal lack of discrimination (Avidyā)' }
      ],
      englishTranslation: 'It being a matter of established certainty that the Object and the Subject—whose spheres of reference are the notions of "Thou" (the Not-Self) and "I" (the Self), and which are as opposed to each other as darkness and light—cannot be identified with each other... yet, by coupling the real and the unreal through failure of discrimination, there is a natural human superimposition (Adhyāsa): "I am this body, this mind is mine."',
      shankaraBhashyaSummary: 'The epistemological bedrock of Advaita Vedanta. Superimposition (Adhyāsa) is defined as "Smṛti-rūpaḥ paratra pūrva-dṛṣṭāvabhāsaḥ" (the apparent presentation of something previously observed in some other locus, resembling memory). All human bondage, suffering, and transmigration is a psychological mistaking of the body-mind complex for the transcendent Knower.',
      philosophicalVada: 'Vivarta-Vada',
      mahavakya: false,
      crossReferences: ['verse-brahmasutra-1-1-1', 'verse-mandukya-7'],
      tags: ['Adhyasa', 'Epistemology', 'Subject-Object', 'Superimposition', 'Bhashya'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'verse-siddha-siddhanta-1-1',
      canon: 'Nath Agama',
      sourceText: 'Siddha Siddhānta Paddhati (Guru Gorakhnāth)',
      chapterVerse: 'Paṭala 1, Verse 1',
      sanskritDevanagari: 'पिण्डब्रह्माण्डयोरैक्यं ज्ञातव्यं सिद्धियोगिना। चैतन्यस्य विलासस्तु जगत्सर्वं चराचरम्॥',
      transliterationIast: 'piṇḍa-brahmāṇḍayor aikyaṁ jñātavyaṁ siddha-yoginā | caitanyasya vilāsas tu jagat sarvaṁ carācaram ||',
      wordBreakdown: [
        { word: 'piṇḍa-brahmāṇḍayoḥ', meaning: 'of the human physical vessel (Pinda) and the macrocosmic universe (Brahmanda)' },
        { word: 'aikyam', meaning: 'the absolute non-dual identity and organic unity' },
        { word: 'jñātavyam', meaning: 'must be somatically and spiritually realized' },
        { word: 'siddha-yoginā', meaning: 'by the adept master yogi' },
        { word: 'caitanyasya vilāsaḥ', meaning: 'the playful spontaneous joyful sport of Consciousness (Cid-Vilāsa)' },
        { word: 'jagat sarvam', meaning: 'this entire animate and inanimate cosmos' }
      ],
      englishTranslation: 'The unity between the individual somatic vessel (Pinda) and the macrocosmic universe (Brahmanda) must be directly realized by the accomplished yogi. For this entire animate and inanimate universe is nothing other than the joyous, playful sport (Vilāsa) of Supreme Consciousness (Caitanya).',
      shankaraBhashyaSummary: 'The foundational verse of Nath Sampradaya and Cid-Vilāsa-Vāda. Unlike Shankara who calls the world an illusory superimposition (Mithyā/Adhyāsa), Guru Gorakshanath asserts that the world is an authentic, divine dance of Shiva’s creative freedom (Vilāsa). The body is not a prison of ignorance, but a micro-universe to be spiritualized through Kaya-Sadhana.',
      philosophicalVada: 'Cid-Vilasa-Vada',
      mahavakya: true,
      crossReferences: ['verse-mandukya-1', 'verse-gita-13-2'],
      tags: ['Nath', 'Gorakhnath', 'Cid-Vilasa', 'Pinda-Brahmanda', 'Kaya-Sadhana'],
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // Seed The 7 Classical Causation Vadas
  await db.philosophicalVadas.bulkAdd([
    {
      id: 'vada-vivarta',
      name: 'Vivarta-Vāda (Apparent Transformation)',
      school: 'Advaita Vedānta',
      proponent: 'Adi Śaṅkarācārya',
      coreAnalogy: 'Rope mistaken for a Snake (Rajju-Sarpa); Gold appearing as various ornaments without losing its gold nature.',
      karyaKaranaRelation: 'The effect (Kārya) has no independent reality apart from the cause (Kāraṇa). The cause remains changeless and untouched.',
      worldStatus: 'Mithya (Dependent Reality)',
      keyScriptures: ['Māṇḍūkya Upaniṣad', 'Brahma Sūtras (Catuhsutri)', 'Vivekacūḍāmaṇi'],
      detailedCritique: 'The universe is not physically created out of nothing, nor is God physically converted into matter. The universe appears to exist on Brahman due to Avidyā/Māyā. Dissolving ignorance through Viveka reveals only pure Brahman.'
    },
    {
      id: 'vada-parinama',
      name: 'Pariṇāma-Vāda (Real Transformation)',
      school: 'Sāṅkhya & Viśiṣṭādvaita',
      proponent: 'Kapila Maharṣi / Śrī Rāmānujācārya',
      coreAnalogy: 'Milk transforming into Curd / Yogurt (Kṣīra-Dadhi); Clay shaped into a pot.',
      karyaKaranaRelation: 'The cause physically and irreversibly mutates its real state to become the manifest effect.',
      worldStatus: 'Real Physical Evolution',
      keyScriptures: ['Sāṅkhya Kārikā', 'Śrī Bhāṣya'],
      detailedCritique: 'In Sāṅkhya, unmanifest Prakriti real-transforms into the 23 evolutes (Mahat, Ahamkara, Tanmatras). In Vishishtadvaita, Brahman transforms His subtle body (Chit and Achit) into the gross universe. Advaita refutes this because if Brahman transformed, Brahman would be finite and perishable.'
    },
    {
      id: 'vada-cid-vilasa',
      name: 'Cid-Vilāsa-Vāda (Joyous Play of Consciousness)',
      school: 'Nātha Sampradāya / Siddha Siddhānta',
      proponent: 'Guru Gorakhnāth & Matsyendranāth',
      coreAnalogy: 'A master dancer and their dance; A musician and their spontaneous melody.',
      karyaKaranaRelation: 'The universe is a spontaneous, willful expression of pure joy (Ānanda) and creative play bursting from Consciousness (Cit).',
      worldStatus: 'Satya (Divine Expression)',
      keyScriptures: ['Siddha Siddhānta Paddhati', 'Gorakṣa Śataka', 'Yoni Tantra'],
      detailedCritique: 'Rejects Advaita\'s claim that the world is an illusion or cosmic error. Gorakshanath argues that calling the universe an illusion insults Shiva\'s sovereign power. The cosmos is Shiva\'s deliberate dance, structured into both Pinda (the human body) and Brahmanda (the cosmos).'
    },
    {
      id: 'vada-abhasa',
      name: 'Ābhāsa-Vāda (Cosmic Shining Reflection)',
      school: 'Kashmir Shaivism (Pratyabhijñā)',
      proponent: 'Ācārya Abhinavagupta & Somānanda',
      coreAnalogy: 'A magnificent city reflected perfectly in a spotless crystal mirror.',
      karyaKaranaRelation: 'The universe is an array of "shining appearances" projected on the mirror of Cosmic Consciousness (Samvit) through divine light (Prakāśa).',
      worldStatus: 'Satya (Divine Expression)',
      keyScriptures: ['Tantrāloka', 'Īśvara-Pratyabhijñā-Kārikā', 'Śiva Sūtras'],
      detailedCritique: 'Unlike Vivarta where the reflection is illusory, here the reflection is genuine and divine. Shiva remains the supreme artist who projects forms out of Himself, onto Himself, and observes Himself.'
    },
    {
      id: 'vada-svatantrya',
      name: 'Svātantrya-Vāda (Doctrine of Absolute Free Will)',
      school: 'Trika Shaivism',
      proponent: 'Utpaladeva & Kṣemarāja',
      coreAnalogy: 'A yogi who manifests physical objects purely through mental sovereignty and willpower without external materials.',
      karyaKaranaRelation: 'Creation occurs without any external instrument or material cause, solely through the autonomous power (Svātantrya-Śakti) of Paramaśiva.',
      worldStatus: 'Satya (Divine Expression)',
      keyScriptures: ['Pratyabhijñāhṛdayam', 'Spanda Kārikā'],
      detailedCritique: 'Asserts that Shiva is not bound by any laws of causation or karmic determinism. The universe exists because Consciousness delights in sovereign freedom.'
    },
    {
      id: 'vada-arambha',
      name: 'Ārambha-Vāda / Asatkāryavāda (New Beginning Theory)',
      school: 'Nyāya-Vaiśeṣika',
      proponent: 'Kaṇāda & Gautama Akṣapāda',
      coreAnalogy: 'Threads woven into a cloth; Bricks assembled into a wall.',
      karyaKaranaRelation: 'The effect does NOT exist before creation; it is a brand-new entity created out of atomic aggregation (Paramāṇu).',
      worldStatus: 'Atomic Creation',
      keyScriptures: ['Vaiśeṣika Sūtras', 'Nyāya Bhāṣya'],
      detailedCritique: 'Materialistic and mechanistic realism. The world is an assembly line of independent atoms. Both Vedanta and Kashmir Shaivism reject this because dead atoms cannot account for unified conscious experience.'
    },
    {
      id: 'vada-pratityasamutpada',
      name: 'Pratītyasamutpāda (Dependent Origination)',
      school: 'Madhyamaka Buddhism',
      proponent: 'Ārya Nāgārjuna',
      coreAnalogy: 'A candle flame lighting another flame before dying; Interlocking sheaves of reeds.',
      karyaKaranaRelation: 'Nothing exists intrinsically (Niḥsvabhāva); everything arises in dependence upon conditions and ceases when conditions vanish.',
      worldStatus: 'Shunya (Empty/Momentary)',
      keyScriptures: ['Mūlamadhyamakakārikā', 'Prajñāpāramitā Sūtras'],
      detailedCritique: 'Rejects any eternal unchanging cause (Brahman/Atman). All phenomena are momentary and empty of inherent existence. Vedanta counters that dependent chains require an uncaused, eternal foundation (Adhiṣṭhāna).'
    }
  ]);

  // Seed Pranayama Sessions if empty
  const pranaCount = await db.pranayamaSessions.count();
  if (pranaCount === 0) {
    await db.pranayamaSessions.bulkAdd([
      {
        id: 'prana-seed-1',
        date: new Date(now - 86400000 * 2).toISOString().split('T')[0],
        timestamp: now - 86400000 * 2,
        patternName: 'Sama Vritti',
        ratio: [4, 4, 4, 4],
        totalCycles: 16,
        totalDurationSeconds: 256,
        swaraActive: 'Sushumna (Equilibrium / Both)',
        retentionComfortScore: 9,
        pranaVayus: { prana: 9, apana: 8, samana: 9, udana: 8, vyana: 9 },
        heartRateEstimateBpm: 58,
        notes: 'Brahma Muhurta square box breathing. Deep vagal calming with immediate mental stillness.',
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000 * 2,
      },
      {
        id: 'prana-seed-2',
        date: new Date(now - 86400000).toISOString().split('T')[0],
        timestamp: now - 86400000,
        patternName: 'Nadi Shodhana',
        ratio: [4, 16, 8, 4],
        totalCycles: 12,
        totalDurationSeconds: 384,
        swaraActive: 'Chandra (Ida / Left)',
        retentionComfortScore: 8,
        pranaVayus: { prana: 8, apana: 9, samana: 8, udana: 9, vyana: 8 },
        heartRateEstimateBpm: 55,
        notes: 'Alternate nostril with full Antara Kumbhaka (16s hold). Cooling lunar channel activation.',
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
      },
      {
        id: 'prana-seed-3',
        date: new Date(now).toISOString().split('T')[0],
        timestamp: now - 3600000 * 3,
        patternName: 'Bhramari',
        ratio: [4, 0, 12, 0],
        totalCycles: 15,
        totalDurationSeconds: 240,
        swaraActive: 'Surya (Pingala / Right)',
        retentionComfortScore: 10,
        pranaVayus: { prana: 10, apana: 8, samana: 9, udana: 10, vyana: 9 },
        heartRateEstimateBpm: 52,
        notes: 'Low humming bee exhalation resonance. Intense cranial vibration and Ajna clarity.',
        createdAt: now - 3600000 * 3,
        updatedAt: now - 3600000 * 3,
      }
    ]);
  }
}



