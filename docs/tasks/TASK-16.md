# TASK-16: Advanced Vedic & Philosophical Cross-Reference Engine with Shankara Bhashya Concordance

**System Component:** Canonical Vedic Matrix & Philosophical Causation Engine  
**Milestone:** Phase 16  
**Target Platform:** Windows 11 Desktop (x64) & Samsung Galaxy S25 Ultra (Local-First Offline PWA)  
**Storage Substratum:** Dexie.js (IndexedDB v10)  

---

## 1. Executive Specification & Operational Intent

This specification establishes an interactive, computational Vedic Cross-Reference Engine and Canonical Commentary Concordance for Om Knowledge OS. It bridges the foundational texts of the *Prasthānatrayī* (Upanishads, Bhagavad Gita, Brahma Sutras) with Adi Shankaracharya's commentaries (*Shankara Bhāṣya*), while providing an interactive comparative simulation of India's classical causation theories (*Kārya-Kāraṇa Vādas*), including Advaita *Vivarta-Vāda*, Kashmir Shaivism *Ābhāsa-Vāda*, and Nath *Cid-Vilāsa-Vāda*.

### Core Problems Solved
1. **Unstructured Scriptural Notes:** Metaphysical notes stored in plain text or markdown lack grammatical interlinear breakdowns (*Padachheda*), IAST transliteration, and root-etymology linking.
2. **Commentary Fragmentation:** Cross-referencing an Upanishadic statement (e.g., *Chāndogya* 6.8.7 "Tat Tvam Asi") with the *Brahma Sūtra* 1.1.4 (*Samanvaya*) and *Gītā* 2.16 requires juggling separate volumes. The engine provides unified cross-index concordances on a single local-first screen.
3. **Philosophical Causation Confusion:** Learners struggle to map the precise mechanics distinguishing *Vivarta-Vāda* (apparent transformation) from *Śakti-Pariṇāma-Vāda* (divine energy transformation) and Gorakhnath's *Cid-Vilāsa-Vāda* (joyous conscious play). The 7-Vāda simulator provides visual interactive mechanics, analogies, and ontological comparisons.

---

## 2. Canonical Structure & Conceptual Mechanics

### 2.1 The Prasthānatrayī Triad
1. **Śruti Prasthāna (Foundational Revelation):** The 10 Principal Upanishads (Māṇḍūkya, Chāndogya, Bṛhadāraṇyaka, Kaṭha, Kena, Īśā, Taittirīya, Muṇḍaka, Praśna, Aitareya).
2. **Smṛti Prasthāna (Applied Practical Living):** The *Bhagavad Gītā* (Sāṅkhya Yoga, Karma Yoga, Jñāna Yoga, Dhyāna Yoga, Kṣetra-Kṣetrajña Viveka).
3. **Nyāya Prasthāna (Systematic Dialectic & Logic):** Bādarāyaṇa's *Brahma Sūtras* (Adhyāsa Bhāṣya, Catuḥsūtrī, Janmādyasya Yataḥ, Avirodha, Sādhana, Phala).

### 2.2 The 7 Causation Vādas (Kārya-Kāraṇa Siddhānta)
| Vāda | School & Core Proponent | Nature of Manifestation | Reality of World | Classic Analogy |
| :--- | :--- | :--- | :--- | :--- |
| **Vivarta-Vāda** | Advaita Vedānta (Adi Shankara) | Apparent transformation; Cause remains pristine | Mithyā (Dependent reality) | Rope mistaken for a snake (*Rajju-Sarpa*) |
| **Pariṇāma-Vāda** | Sāṅkhya / Viśiṣṭādvaita (Ramanuja) | Real transformation of cause into effect | Real (Satya) | Milk curdling into yogurt (*Kṣīra-Dadhi*) |
| **Cid-Vilāsa-Vāda**| Nātha Sampradāya (Gorakhnath) | Spontaneous playful dance of pure Cit | Real & Joyous (Vilāsa) | Dancer and dance; Musician and melody |
| **Ābhāsa-Vāda** | Kashmir Shaivism (Abhinavagupta)| Shining reflections in cosmic consciousness | Real Reflection (Ābhāsa)| City reflected in a clean mirror |
| **Svātantrya-Vāda**| Kashmir Shaivism / Trika | Unconstrained divine sovereign free-will | Real Divine Expression | Spontaneous artistic creation without external tool |
| **Ārambha-Vāda** | Nyāya-Vaiśeṣika (Kanada, Gautama) | Entirely new product from atomic aggregation | Independent atomic reality| Cloth woven thread by thread |
| **Pratītyasamutpāda**| Buddhism (Nagarjuna, Madhyamaka) | Dependent origination; Mutual interdependence | Empty (*Śūnya*) / Momentary | Candle flame lighting another flame |

---

## 3. Data Schema & Architecture (`src/db/index.ts`)

```typescript
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
  worldStatus: string;
  keyScriptures: string[];
  detailedCritique: string;
}
```
