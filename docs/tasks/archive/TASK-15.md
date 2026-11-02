# TASK-15: Metaphysical Dream Journaling, Astral Log & Sadhana Metrics Engine

**System Component:** Metaphysical Journaling & Spiritual Practice Analytics  
**Milestone:** Phase 15  
**Target Platform:** Windows 11 Desktop (x64) & Samsung Galaxy S25 Ultra (Local-First Offline PWA)  
**Storage Substratum:** Dexie.js (IndexedDB v9) + Web Audio API Synthesis  

---

## 1. Executive Specification & Operational Intent

This specification establishes a local-first, zero-dependency Metaphysical Dream Journal, Astral Projection Log, and Sadhana Metrics Engine integrated into Om Knowledge OS. It bridges metaphysical introspections from `my_notes/` (Nath Cid-Vilāsa-Vāda, Kashmir Shaivism, Kaya-Sadhana, and Viveka) with empirical daily discipline tracking.

### Core Problems Solved
1. **Sleep-State Amnesia & Melatonin Disruption:** Recording dreams upon waking in the dark with standard high-contrast bright screens disrupts circadian rhythms and destroys dream recall. The engine provides an AMOLED Red/Amber Photon Shield (<650nm) for instantaneous night-waking capture.
2. **Astral & Lucidity Nuance:** Ordinary note apps fail to capture subtle states like pre-projection vibrational rushes, hypnagogic imagery, sleep paralysis breakthroughs, and lucidity levels (Sakshi / Witness Consciousness).
3. **Sadhana Quantization & Japa Tracking:** Spiritual practices (Japa Mala, Nadi Shodhana breath retention, Dhyana stillness) require seamless distraction-free counters with tactile haptic feedback and pure harmonic audio synthesis without requiring cloud timers.
4. **Lunar & Cosmic Synchronicity:** Correlates dream lucidity, astral depth, and meditative stillness directly with Phase 13 Jyotish Ephemeris data (Tithi, Chandra Nakshatra, and Moon phase).

---

## 2. Mathematical & Algorithmic Foundations

### 2.1 Ojas Vitality & Practice Momentum Index (0–100)
Calculates the daily spiritual discipline score from weighted practice metrics:

$$\text{Ojas Base} = \left(\frac{T_{\text{japa}}}{30} \times 25\right) + \left(\frac{T_{\text{dhyana}}}{30} \times 25\right) + \left(\frac{T_{\text{pranayama}}}{20} \times 20\right) + \left(\frac{S_{\text{stillness}}}{10} \times 15\right) + B_{\text{brahma}}$$

Where:
* $T_{\text{japa}}, T_{\text{dhyana}}, T_{\text{pranayama}}$ are durations in minutes (capped at 1.0).
* $S_{\text{stillness}}$ is the subjectively rated stillness on a scale of 1 to 10.
* $B_{\text{brahma}} = 15$ if practiced during Brahma Muhurta (04:00–06:00 AM local time), else $0$.
* Consecutive practice streak yields a logarithmic momentum multiplier:
  $$M_{\text{streak}} = 1.0 + 0.05 \times \ln(1 + \text{StreakDays})$$
* Final Ojas Index:
  $$\text{Ojas Index} = \min(100, \text{round}(\text{Ojas Base} \times M_{\text{streak}}))$$

### 2.2 Pure Harmonic Audio Bell Synthesis (Web Audio API)
Generates an authentic meditative Tibetan singing bowl harmonic chime directly in the browser with zero MP3/WAV file downloads:
* Fundamental frequency: $f_0 = 432\text{ Hz}$ (Vedic tuning).
* Overtones: $f_1 = 2.76 f_0$, $f_2 = 5.40 f_0$.
* Exponential decay envelope: $A(t) = A_0 e^{-t / \tau}$ where $\tau = 2.4\text{ s}$.

### 2.3 Lucidity & Consciousness Scale (0–5)
1. **Level 0 (Unconscious):** Fragmentary REM dream, passive spectator, low recall.
2. **Level 1 (Flicker Awareness):** Momentary realization that one is dreaming, quickly forgotten.
3. **Level 2 (Semi-Lucid):** Aware of the dream state, but cannot alter dream geography or narrative.
4. **Level 3 (Active Lucid Control):** Full voluntary control over movement, flight, speech, and summoning elements.
5. **Level 4 (Sakshi / Witness Consciousness):** Detached observer of cosmic phenomena without egoic manipulation.
6. **Level 5 (Turiya / Astral Flight):** Full out-of-body separation, silver cord perception, etheric navigation.

---

## 3. Data Schema & Architecture (`src/db/index.ts`)

```typescript
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
```
