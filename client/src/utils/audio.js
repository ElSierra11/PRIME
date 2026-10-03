/**
 * Web Audio API Sound Synthesizer
 * Zero external audio files, works completely offline and instantly.
 * Ensures AudioContext is safely initiated/resumed on user interaction.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.hasUserInteracted = false;
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.hasUserInteracted = true;
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.hasUserInteracted) {
      this.ctx.resume().catch(() => {});
    }
  }

  playToastChime() {
    try {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playWaterDropSound() {
    try {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.22);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playDuolingoAlarmSound() {
    try {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const now = this.ctx.currentTime;

      // Aggressive 3-beep alarm
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + (i * 0.18);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(740, start); // F#5
        osc.frequency.setValueAtTime(987.77, start + 0.08); // B5

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.15);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playSuccessChime() {
    try {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + (idx * 0.08);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

export const sounds = new SoundEngine();
