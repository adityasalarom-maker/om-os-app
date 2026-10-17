/**
 * Om Knowledge OS — Sadhana Harmonic Sound & Haptic Synthesis Engine
 * 
 * Implements pure Web Audio API mathematical synthesis for:
 * 1. 432 Hz Vedic Tibetan Singing Bowl Harmonic Bell (Zero external audio file assets)
 * 2. Wooden Mala Bead Tactile Acoustic Click
 * 3. Samsung Galaxy S25 Ultra Haptic Actuator Triggering
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a resonant Tibetan singing bowl chime at 432 Hz with authentic overtone decay
 */
export function playSingingBowlChime(fundamentalFreq: number = 432): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(ctx.destination);

    // Partial frequencies matching traditional bronze singing bowl acoustics
    // Fundamental + Minor 3rd / Octave harmonic overtones
    const partials = [
      { freqMultiplier: 1.0, gain: 0.8, decay: 3.5 },
      { freqMultiplier: 2.76, gain: 0.35, decay: 2.4 },
      { freqMultiplier: 5.40, gain: 0.15, decay: 1.6 },
      { freqMultiplier: 8.92, gain: 0.08, decay: 0.9 },
    ];

    partials.forEach(({ freqMultiplier, gain: pGain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamentalFreq * freqMultiplier, now);

      // Attack: Instant strike (2ms)
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(pGain, now + 0.002);

      // Decay: Exponential natural acoustic fade
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(now);
      osc.stop(now + decay);
    });
  } catch (err) {
    console.warn('Web Audio synthesis not available or blocked by user gesture:', err);
  }
}

/**
 * Synthesizes a subtle, crisp wooden bead click for each bead in Japa Mala
 */
export function playBeadClick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch {
    // Non-blocking fallback
  }
}

/**
 * Triggers tactile vibration on supported mobile devices (Samsung S25 Ultra, etc.)
 */
export function triggerMalaHaptic(type: 'bead' | 'meru' | 'kumbhaka'): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'bead') {
      navigator.vibrate(18); // Crisp 18ms bead tick
    } else if (type === 'meru') {
      navigator.vibrate([40, 50, 60, 50, 120]); // Grand 108th Meru bead celebration pattern
    } else if (type === 'kumbhaka') {
      navigator.vibrate([30, 30, 30]); // Breath retention checkpoint
    }
  } catch {
    // Graceful fallback for non-vibrating devices
  }
}
