# TASK-17: Pranayama, Breathwork Metronome & Bio-Energy Prana Tracking Subsystem

**System Component:** Breathwork Metronome & Bio-Energy Pranic Engine  
**Milestone:** Phase 17  
**Target Platform:** Windows 11 Desktop (x64) & Samsung Galaxy S25 Ultra (Local-First Offline PWA)  
**Storage Substratum:** Dexie.js (IndexedDB v11)  

---

## 1. Executive Specification & Operational Intent

This specification establishes an interactive, precision-timed Breathwork Metronome, Prāṇāyāma Pacer, and Bio-Energy Prāṇa Tracking Engine for Om Knowledge OS. It models the classical 4-stage breath cycle (*Catur-Aṅga Prāṇāyāma*):
1. **Pūraka** (Inhalation)
2. **Antara Kumbhaka** (Internal Breath Retention)
3. **Recaka** (Exhalation)
4. **Bāhya Kumbhaka** (External / Empty Breath Retention)

It provides real-time Web Audio binaural/harmonic transition cues, haptic vibration pulses for eyes-closed practice, Swara Yoga active nostril observation (*Iḍā* / *Piṅgalā* / *Suṣumṇā*), and the 5-fold Prāṇa Vāyu balance assessment (*Prāṇa*, *Apāna*, *Samāna*, *Udāna*, *Vyāna*).

---

## 2. Classical Breathwork Patterns & Mathematical Ratios

| Pattern | Ratio (Pūraka : Antara : Recaka : Bāhya) | Target Cadence (s) | Physiological & Energetic Effect |
| :--- | :--- | :--- | :--- |
| **Sama Vṛtti** (Box Breathing) | 1 : 1 : 1 : 1 | 4 : 4 : 4 : 4 | Parasympathetic stabilization, vagal nerve tone, mental balance |
| **Viṣama Vṛtti** (Extended Exhale) | 1 : 0 : 2 : 0 | 4 : 0 : 8 : 0 | Rapid heart-rate deceleration, anxiety purge, pre-sleep sedation |
| **Nāḍī Śodhana** (Alternate Nostril)| 1 : 4 : 2 : 1 | 4 : 16 : 8 : 4 | Left/Right hemisphere synchronization, purification of 72,000 nāḍīs |
| **Kumbhaka Intensive** | 1 : 4 : 2 : 2 | 4 : 16 : 8 : 8 | Cellular hypercapnic adaptation, nitric oxide surge, deep dhyāna |
| **Kapālabhāti** (Frontal Skull Cleansing)| 0 : 0 : 1 : 0 (Rapid) | 0.5s active exhale pulse | Diaphragmatic stimulation, digestive fire (*Jathara Agni*), energetic wakefulness |
| **Bhrāmarī** (Bee Humming Resonance)| 1 : 0 : 3 : 0 | 4 : 0 : 12 : 0 | Nitric oxide production in paranasal sinuses (15x increase), pineal stimulation |
| **Śītalī / Śītkārī** (Cooling Breath)| 1 : 1 : 1 : 0 | 5 : 5 : 5 : 0 | Pitta reduction, thermal homeostasis, autonomic down-regulation |

---

## 3. Data Schema Extension (Dexie v11)

```typescript
export interface PranayamaSessionRecord {
  id: string; // e.g. "prana-1729188000000"
  timestamp: number;
  patternName: 'Sama Vritti' | 'Visama Vritti' | 'Nadi Shodhana' | 'Kumbhaka Intensive' | 'Kapalabhati' | 'Bhramari' | 'Sheetali' | 'Custom';
  ratio: [number, number, number, number]; // [puraka, antara, rechaka, bahya] in seconds
  totalCycles: number;
  totalDurationSeconds: number;
  swaraActive: 'Chandra (Ida / Left)' | 'Surya (Pingala / Right)' | 'Sushumna (Equilibrium / Both)';
  retentionComfortScore: number; // 1 to 10
  pranaVayus: {
    prana: number;   // Chest / Inhalation vitality (1-10)
    apana: number;   // Pelvic / Grounding / Elimination (1-10)
    samana: number;  // Solar plexus / Digestion / Balance (1-10)
    udana: number;   // Throat / Speech / Ascending focus (1-10)
    vyana: number;   // Whole body / Circulation / Radiance (1-10)
  };
  heartRateEstimateBpm?: number;
  ambientNotes?: string;
  createdAt: number;
}
```

---

## 4. Audio-Visual Engine Specifications

1. **Visual Pacer**: Real-time animated circular breath mandala that expands smoothly on Pūraka, holds in brilliant gold on Antara Kumbhaka, contracts on Recaka, and pauses in deep void indigo on Bāhya Kumbhaka.
2. **Audio Metronome**: Web Audio synthesized sine tones with smooth gain ramps:
   - Inhale cue: 432 Hz ascending envelope.
   - Internal Retention cue: 528 Hz ("Miracle tone") steady harmonic chime.
   - Exhale cue: 396 Hz grounding descending tone.
   - External Void cue: 216 Hz deep grounding sub-tone.
3. **Haptic Engine**: Short 40ms vibration pulse at each phase transition on supported mobile devices (Samsung S25 Ultra).
