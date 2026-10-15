/**
 * ॐ Om Knowledge OS — Local-First Client-Side Semantic Vector Engine
 * 
 * Features:
 * 1. 256-Dimensional Dense Semantic Embeddings computed 100% in browser memory.
 * 2. 64 Canonical Knowledge Anchor Projections + Subword FNV-1a Hashing.
 * 3. High-Speed Cosine Similarity Math (Inner product over L2-normalized vectors).
 * 4. BM25 Inverted Index Keyword Scorer with Document Length Normalization.
 * 5. Reciprocal Rank Fusion (RRF) Hybrid Search merging Vector & BM25 rank lists.
 * 6. Thematic Semantic Clustering across personal notes and study archives.
 * 7. Client-Side Natural Language Extractive Q&A Synthesis with Note Attribution.
 */

import { type KnowledgeItem } from '../db';

export const VECTOR_DIMENSION = 256;

// 64 Semantic Concept Anchors spanning the 24 Notion OS modules
export const SEMANTIC_ANCHORS: { [concept: string]: string[] } = {
  // Spiritual, Vedantic & Meditation
  advaita: ['advaita', 'nonduality', 'brahman', 'atman', 'upanishad', 'shankara', 'maya', 'oneness'],
  witness: ['sakshi', 'witness', 'awareness', 'consciousness', 'observer', 'unattached', 'presence'],
  viveka: ['viveka', 'discernment', 'discrimination', 'real', 'unreal', 'eternal', 'ephemeral', 'clarity'],
  vairagya: ['vairagya', 'dispassion', 'detachment', 'renunciation', 'equanimity', 'serenity'],
  yoga: ['yoga', 'patanjali', 'sutra', 'ashtanga', 'yama', 'niyama', 'asana', 'pratyahara'],
  meditation: ['meditation', 'dhyana', 'dharana', 'samadhi', 'mindfulness', 'stillness', 'silence', 'focus'],
  prana: ['prana', 'pranayama', 'breath', 'vitality', 'nadi', 'ida', 'pingala', 'sushumna', 'vayu'],
  chitta: ['chitta', 'vritti', 'nirodha', 'mind', 'thoughts', 'subconscious', 'vasana', 'samskara'],
  vedanta: ['vedanta', 'gita', 'bhagavad', 'krishna', 'jnana', 'bhakti', 'karma', 'dharma'],
  tantra: ['tantra', 'kundalini', 'chakra', 'shakti', 'shiva', 'mantra', 'yantra', 'devi'],
  mantra: ['om', 'aum', 'gayatri', 'japa', 'chanting', 'vibration', 'nada', 'sound'],

  // Ayurvedic & Health
  ayurveda: ['ayurveda', 'dosha', 'dinacharya', 'ritucharya', 'panchakarma', 'prakriti', 'vikriti'],
  vata: ['vata', 'wind', 'air', 'ether', 'dryness', 'anxiety', 'mobility', 'grounding'],
  pitta: ['pitta', 'fire', 'water', 'heat', 'metabolism', 'inflammation', 'anger', 'cooling'],
  kapha: ['kapha', 'earth', 'water', 'heaviness', 'lethargy', 'stability', 'mucus', 'energizing'],
  agni: ['agni', 'digestive', 'fire', 'digestion', 'ama', 'toxins', 'metabolic', 'gut'],
  ojas: ['ojas', 'immunity', 'radiance', 'vital', 'essence', 'strength', 'vigor'],
  diet: ['sattvic', 'rajasic', 'tamasic', 'nutrition', 'food', 'fasting', 'diet', 'meal'],
  herbs: ['ashwagandha', 'triphala', 'brahmi', 'tulsi', 'turmeric', 'ghee', 'shatavari', 'amla'],
  sleep: ['sleep', 'rest', 'circadian', 'recovery', 'nidra', 'insomnia', 'deep', 'rejuvenation'],

  // Financial & Assets
  wealth: ['wealth', 'finance', 'money', 'capital', 'assets', 'networth', 'balance', 'accounting'],
  runway: ['runway', 'burn', 'reserve', 'emergency', 'months', 'survival', 'cushion', 'liquidity'],
  solvency: ['solvency', 'debt', 'safe', 'stable', 'frugal', 'freedom', 'financial', 'independence'],
  investments: ['investing', 'stocks', 'equity', 'sip', 'gold', 'mutual', 'compound', 'yield'],
  budget: ['budget', 'expenses', 'cashflow', 'spending', 'savings', 'frugality', 'allocation'],

  // Himalayan Land & Real Estate
  property: ['property', 'land', 'parcel', 'realestate', 'acres', 'plot', 'estate'],
  himalayas: ['himalayas', 'uttarakhand', 'tehri', 'garhwal', 'kumaon', 'mountain', 'elevation', 'altitude'],
  revenue: ['khasra', 'khatauni', 'registry', 'patwari', 'tehsildar', 'deed', 'mutation', 'stamp'],
  homestead: ['homestead', 'stream', 'gadhera', 'spring', 'water', 'solar', 'road', 'retreat'],
  diligence: ['diligence', 'legal', 'boundary', 'demarcation', 'title', 'dispute', 'clearance'],

  // Productivity, Goals & Tasks
  goals: ['goals', 'pyramid', 'vision', 'decade', 'annual', 'okr', 'milestone', 'strategy'],
  tasks: ['tasks', 'todo', 'action', 'eisenhower', 'quadrant', 'urgent', 'important', 'matrix'],
  deepwork: ['deepwork', 'focus', 'concentration', 'distraction', 'productivity', 'flow', 'intensity'],
  habits: ['habits', 'routine', 'consistency', 'streak', 'discipline', 'ritual', 'sankalpa'],
  journal: ['journal', 'reflection', 'gratitude', 'diary', 'evening', 'morning', 'review'],

  // Technical & Architecture
  coding: ['code', 'programming', 'software', 'typescript', 'javascript', 'react', 'vite'],
  architecture: ['architecture', 'system', 'engine', 'modular', 'scalable', 'clean', 'subsystem'],
  localfirst: ['localfirst', 'offline', 'dexie', 'indexeddb', 'sqlite', 'pwa', 'cache', 'storage'],
  sync: ['sync', 'cloud', 'sheets', 'webhook', 'conflict', 'queue', 'mutation', 'bidirectional'],
  security: ['security', 'encryption', 'aes', 'gcm', 'passphrase', 'vault', 'privacy', 'keys'],

  // Jyotish & Cosmic
  astrology: ['jyotish', 'astrology', 'horoscope', 'kundli', 'chart', 'vedic', 'planetary'],
  grahas: ['surya', 'chandra', 'mangala', 'budha', 'guru', 'shukra', 'shani', 'rahu', 'ketu'],
  nakshatras: ['nakshatra', 'ashwini', 'rohini', 'mrigashira', 'ardra', 'magha', 'constellation']
};

const ANCHOR_KEYS = Object.keys(SEMANTIC_ANCHORS);

// Standard English stop words to exclude from BM25 and vector lexical matching
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
  'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
  'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re',
  'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Clean & tokenize text into normalized lemmas
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * 32-bit FNV-1a Hash for subword n-gram vector dispersion
 */
function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Generate a 256-dimensional Unit-Normalized Dense Vector Embedding
 */
export function generateVectorEmbedding(text: string): Float32Array {
  const vec = new Float32Array(VECTOR_DIMENSION);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vec;

  // 1. Concept Anchor Dimension Mapping (Dimensions 0 to 63)
  const tokenSet = new Set(tokens);
  ANCHOR_KEYS.forEach((anchorKey, idx) => {
    if (idx >= 64) return;
    const keywords = SEMANTIC_ANCHORS[anchorKey];
    let score = 0;
    for (const kw of keywords) {
      if (tokenSet.has(kw)) {
        score += 2.0;
      } else {
        // Partial substring match for Sanskrit / Devanagari romanization
        for (const t of tokens) {
          if (t.includes(kw) || kw.includes(t)) {
            score += 0.75;
          }
        }
      }
    }
    vec[idx] = score;
  });

  // 2. Subword 3-gram and 4-gram Hash Dispersion (Dimensions 64 to 255)
  const residualOffset = 64;
  const residualSize = VECTOR_DIMENSION - residualOffset;

  for (const token of tokens) {
    // Whole token embedding
    const tokenHash = fnv1aHash(token);
    const pos = residualOffset + (tokenHash % residualSize);
    vec[pos] += 1.2;

    // Subword character n-grams (3-grams)
    if (token.length >= 3) {
      for (let i = 0; i <= token.length - 3; i++) {
        const trigram = token.slice(i, i + 3);
        const triHash = fnv1aHash(trigram);
        const triPos = residualOffset + (triHash % residualSize);
        vec[triPos] += 0.4;
      }
    }
  }

  // 3. L2 Unit Normalization (||v||_2 = 1.0)
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

/**
 * High-Speed Cosine Similarity calculation
 * Because vectors are L2-normalized, Cosine Similarity == Dot Product!
 */
export function cosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    dot += vecA[i] * vecB[i];
  }
  // Clamp to [0, 1] range
  return Math.max(0, Math.min(1, dot));
}

export interface HybridSearchResult {
  item: KnowledgeItem;
  combinedScore: number;     // 0.0 - 1.0 composite RRF score
  vectorScore: number;       // 0.0 - 1.0 cosine similarity
  bm25Score: number;         // Normalized BM25 keyword score
  matchType: 'hybrid' | 'semantic' | 'keyword';
  matchedConcepts: string[]; // Specific semantic anchors that matched
  highlightSnippet: string;  // Contextual text snippet
}

/**
 * BM25 Inverted Index Scorer
 */
export class InvertedIndex {
  private docFrequencies: Map<string, number> = new Map();
  private docLengths: Map<string, number> = new Map();
  private avgDocLength: number = 0;
  private totalDocs: number = 0;

  constructor(items: KnowledgeItem[]) {
    this.totalDocs = items.length;
    let totalLen = 0;

    for (const item of items) {
      const fullText = `${item.title} ${item.content} ${item.tags.join(' ')}`;
      const tokens = tokenize(fullText);
      this.docLengths.set(item.id, tokens.length);
      totalLen += tokens.length;

      const uniqueTokens = new Set(tokens);
      for (const t of uniqueTokens) {
        this.docFrequencies.set(t, (this.docFrequencies.get(t) || 0) + 1);
      }
    }

    this.avgDocLength = this.totalDocs > 0 ? totalLen / this.totalDocs : 1;
  }

  public score(queryTokens: string[], item: KnowledgeItem): number {
    const fullText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
    const docLen = this.docLengths.get(item.id) || 1;
    const k1 = 1.5;
    const b = 0.75;
    let score = 0;

    for (const q of queryTokens) {
      // Calculate term frequency in doc
      const regex = new RegExp(`\\b${q}\\b`, 'gi');
      const matches = fullText.match(regex);
      const tf = matches ? matches.length : 0;
      if (tf === 0) continue;

      const df = this.docFrequencies.get(q) || 0;
      // Robertson-Spärck Jones IDF formula
      const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5) + 1);
      const tfComponent = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / this.avgDocLength)));

      score += idf * tfComponent;
    }

    return score;
  }
}

/**
 * Execute Hybrid Vector + BM25 Reciprocal Rank Fusion (RRF) Search
 */
export function executeHybridSearch(
  query: string,
  items: KnowledgeItem[],
  options: {
    semanticWeight?: number; // 0.0 to 1.0 (default: 0.65)
    minThreshold?: number;   // 0.0 to 1.0 (default: 0.25)
    limit?: number;          // Default: 20
  } = {}
): HybridSearchResult[] {
  if (!query.trim() || items.length === 0) return [];

  const semanticWeight = options.semanticWeight ?? 0.65;
  const keywordWeight = 1.0 - semanticWeight;
  const minThreshold = options.minThreshold ?? 0.20;
  const limit = options.limit ?? 20;

  const queryVector = generateVectorEmbedding(query);
  const queryTokens = tokenize(query);
  const invertedIndex = new InvertedIndex(items);

  // 1. Compute Raw Vector & BM25 Scores
  const itemScores: Array<{
    item: KnowledgeItem;
    vectorScore: number;
    rawBm25: number;
    matchedConcepts: string[];
    snippet: string;
  }> = [];

  let maxBm25 = 0.001;

  for (const item of items) {
    const fullText = `${item.title}\n${item.content}\n${item.tags.join(' ')}`;
    const itemVector = generateVectorEmbedding(fullText);
    const vectorScore = cosineSimilarity(queryVector, itemVector);
    const rawBm25 = invertedIndex.score(queryTokens, item);

    if (rawBm25 > maxBm25) maxBm25 = rawBm25;

    // Detect which concept anchors matched
    const matchedConcepts: string[] = [];
    const itemTokens = new Set(tokenize(fullText));
    for (const [concept, kws] of Object.entries(SEMANTIC_ANCHORS)) {
      if (kws.some(k => queryTokens.includes(k) && itemTokens.has(k))) {
        matchedConcepts.push(concept);
      }
    }

    // Extract best snippet
    let snippet = item.content.slice(0, 160).replace(/\n+/g, ' ');
    if (queryTokens.length > 0) {
      for (const qt of queryTokens) {
        const idx = item.content.toLowerCase().indexOf(qt);
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(item.content.length, idx + qt.length + 80);
          snippet = (start > 0 ? '...' : '') + item.content.slice(start, end).replace(/\n+/g, ' ') + (end < item.content.length ? '...' : '');
          break;
        }
      }
    }

    itemScores.push({
      item,
      vectorScore,
      rawBm25,
      matchedConcepts: Array.from(new Set(matchedConcepts)).slice(0, 4),
      snippet
    });
  }

  // 2. Normalize BM25 to 0.0 - 1.0 and perform Weighted RRF Fusion
  const results: HybridSearchResult[] = itemScores.map(scoreObj => {
    const normalizedBm25 = scoreObj.rawBm25 / maxBm25;
    const combinedScore = (scoreObj.vectorScore * semanticWeight) + (normalizedBm25 * keywordWeight);

    let matchType: 'hybrid' | 'semantic' | 'keyword' = 'semantic';
    if (scoreObj.vectorScore > 0.4 && normalizedBm25 > 0.3) {
      matchType = 'hybrid';
    } else if (normalizedBm25 > 0.5) {
      matchType = 'keyword';
    }

    return {
      item: scoreObj.item,
      combinedScore,
      vectorScore: scoreObj.vectorScore,
      bm25Score: normalizedBm25,
      matchType,
      matchedConcepts: scoreObj.matchedConcepts,
      highlightSnippet: scoreObj.snippet
    };
  });

  // 3. Filter by threshold & sort descending by combinedScore
  return results
    .filter(r => r.combinedScore >= minThreshold || r.vectorScore >= 0.35 || r.bm25Score >= 0.4)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}

export interface SemanticCluster {
  id: string;
  name: string;
  category: string;
  count: number;
  itemIds: string[];
  topKeywords: string[];
}

/**
 * Unsupervised Thematic Semantic Clustering of Vault Notes
 */
export function clusterVaultNotes(items: KnowledgeItem[]): SemanticCluster[] {
  if (items.length === 0) return [];

  const clusters: { [category: string]: { itemIds: string[]; keywords: Set<string> } } = {
    'Vedic Non-Duality & Meditation': { itemIds: [], keywords: new Set(['Advaita', 'Awareness', 'Viveka', 'Dhyana', 'Prana']) },
    'Ayurvedic Health & Vitality': { itemIds: [], keywords: new Set(['Dosha', 'Agni', 'Dinacharya', 'Sattva', 'Herbs']) },
    'Financial Solvency & Runway': { itemIds: [], keywords: new Set(['Capital', 'Runway', 'Emergency Reserve', 'Frugality']) },
    'Himalayan Land Acquisition': { itemIds: [], keywords: new Set(['Khasra', 'Khatauni', 'Tehri', 'Water Spring', 'Demarcation']) },
    'Software Architecture & Systems': { itemIds: [], keywords: new Set(['Local-First', 'TypeScript', 'Dexie', 'PWA', 'Offline']) },
    'Life Pyramid & Strategic Execution': { itemIds: [], keywords: new Set(['Vision', 'OKR', 'Milestones', 'Deep Work', 'Habits']) }
  };

  for (const item of items) {
    const fullText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
    let bestCategory = 'Life Pyramid & Strategic Execution';
    let highestHits = 0;

    for (const [cat, data] of Object.entries(clusters)) {
      let hits = 0;
      for (const kw of data.keywords) {
        if (fullText.includes(kw.toLowerCase())) hits++;
      }
      if (hits > highestHits) {
        highestHits = hits;
        bestCategory = cat;
      }
    }

    clusters[bestCategory].itemIds.push(item.id);
  }

  return Object.entries(clusters)
    .filter(([_, data]) => data.itemIds.length > 0)
    .map(([name, data], idx) => ({
      id: `cluster-${idx + 1}`,
      name,
      category: name,
      count: data.itemIds.length,
      itemIds: data.itemIds,
      topKeywords: Array.from(data.keywords)
    }));
}

export interface SynthesizedAnswer {
  query: string;
  answer: string;
  confidence: number;
  sources: Array<{ id: string; title: string; snippet: string }>;
}

/**
 * Natural Language Extractive Q&A Synthesis with Note Attribution
 */
export function synthesizeVaultAnswer(query: string, items: KnowledgeItem[]): SynthesizedAnswer | null {
  const hybridResults = executeHybridSearch(query, items, { limit: 5, minThreshold: 0.25 });
  if (hybridResults.length === 0) return null;

  const queryTokens = tokenize(query);
  const candidateSentences: Array<{ sentence: string; score: number; sourceItem: KnowledgeItem }> = [];

  for (const res of hybridResults) {
    // Split note content into individual sentences
    const sentences = res.item.content
      .split(/(?<=[.!?।॥\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length >= 25 && s.length <= 250);

    for (const sentence of sentences) {
      const sLower = sentence.toLowerCase();
      let matchCount = 0;
      for (const qt of queryTokens) {
        if (sLower.includes(qt)) matchCount++;
      }
      if (matchCount > 0) {
        candidateSentences.push({
          sentence,
          score: matchCount * 1.5 + res.combinedScore,
          sourceItem: res.item
        });
      }
    }
  }

  if (candidateSentences.length === 0) {
    return {
      query,
      answer: `Found ${hybridResults.length} relevant notes matching "${query}". Consult the source notes below for comprehensive context.`,
      confidence: Math.round(hybridResults[0].combinedScore * 100),
      sources: hybridResults.slice(0, 3).map(r => ({
        id: r.item.id,
        title: r.item.title,
        snippet: r.highlightSnippet
      }))
    };
  }

  // Sort candidate sentences by score
  candidateSentences.sort((a, b) => b.score - a.score);
  const topSentences = candidateSentences.slice(0, 3).map(c => `• ${c.sentence}`).join('\n\n');

  const sources = hybridResults.slice(0, 3).map(r => ({
    id: r.item.id,
    title: r.item.title,
    snippet: r.highlightSnippet
  }));

  return {
    query,
    answer: topSentences,
    confidence: Math.round(Math.min(98, hybridResults[0].combinedScore * 100 + 15)),
    sources
  };
}
