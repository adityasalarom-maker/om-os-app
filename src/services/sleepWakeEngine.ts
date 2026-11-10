/**
 * ॐ Om Knowledge OS — Sleep & Wake Resilience Engine
 * 
 * Automatically detects when Windows 11 resumes from sleep, modern standby,
 * or hibernation. Continuously monitors connectivity, verifies server health,
 * and automatically reconnects or reloads the application without requiring
 * manual user intervention or terminal fixes.
 */

export interface SleepWakeStatusDetail {
  message: string;
  status: 'info' | 'warning' | 'success';
  attempts?: number;
}

type WakeListener = (info: { elapsedMs: number; isOnline: boolean }) => void;

class SleepWakeEngine {
  private lastTick: number = Date.now();
  private isCheckingHealth: boolean = false;
  private isReconnecting: boolean = false;
  private listeners: Set<WakeListener> = new Set();
  private maxAllowedDriftMs: number = 4500; // 4.5s without tick implies system sleep

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. Clock drift heartbeat (1-second tick)
    this.lastTick = Date.now();
    window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastTick;
      if (elapsed > this.maxAllowedDriftMs) {
        console.log(`[SleepWakeEngine] Clock drift detected: ${elapsed}ms. System resumed from sleep.`);
        this.triggerWakeSequence(elapsed);
      }
      this.lastTick = now;
    }, 1000);

    // 2. Visibility change (user opened laptop lid / switched back to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - this.lastTick;
        if (elapsed > this.maxAllowedDriftMs) {
          console.log(`[SleepWakeEngine] Tab visible after sleep: ${elapsed}ms.`);
          this.triggerWakeSequence(elapsed);
        } else {
          this.verifyHealthSilently();
        }
      }
    });

    // 3. Network online event (Wi-Fi re-established after wake)
    window.addEventListener('online', () => {
      console.log('[SleepWakeEngine] Network online event fired.');
      this.triggerWakeSequence(0);
    });

    // 4. Window focus
    window.addEventListener('focus', () => {
      const elapsed = Date.now() - this.lastTick;
      if (elapsed > this.maxAllowedDriftMs) {
        this.triggerWakeSequence(elapsed);
      }
    });
  }

  public onWake(listener: WakeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`/api/health?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`/manifest.json?_t=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res.ok;
      } catch {
        return false;
      }
    }
  }

  public triggerWakeSequence(elapsedMs: number = 0) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    this.listeners.forEach(fn => {
      try {
        fn({ elapsedMs, isOnline: navigator.onLine });
      } catch (err) {
        console.error('[SleepWakeEngine] Listener error:', err);
      }
    });

    this.pollUntilHealthyAndReload();
  }

  private async verifyHealthSilently() {
    if (this.isCheckingHealth) return;
    this.isCheckingHealth = true;
    try {
      const isAlive = await this.checkHealth();
      if (!isAlive) {
        this.triggerWakeSequence(0);
      }
    } finally {
      this.isCheckingHealth = false;
    }
  }

  private async pollUntilHealthyAndReload() {
    let attempts = 0;
    const maxAttempts = 45; // Poll up to ~60-90s

    const emitStatus = (message: string, status: 'info' | 'warning' | 'success') => {
      window.dispatchEvent(new CustomEvent('om-sleep-wake-status', {
        detail: { message, status, attempts }
      }));
    };

    emitStatus('⚡ System woke from sleep · Reconnecting to Om OS...', 'info');

    const poll = async () => {
      attempts++;
      const isHealthy = await this.checkHealth();

      if (isHealthy) {
        emitStatus('✔ Om OS Connected · Refreshing workspace...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 700);
        return;
      }

      if (attempts < maxAttempts) {
        emitStatus(`⏳ Waiting for Om OS server to respond... (Attempt ${attempts})`, 'warning');
        setTimeout(poll, Math.min(800 + attempts * 150, 2500));
      } else {
        emitStatus('⚠️ Local server unreachable. Start server via npm run dev or serve:prod', 'warning');
        this.isReconnecting = false;
      }
    };

    poll();
  }
}

export const sleepWakeEngine = new SleepWakeEngine();
