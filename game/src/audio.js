// Every sound in Lantern Lane, synthesised with WebAudio — no audio files.
//
// The context is created lazily on the first user gesture (browsers block
// audio before one), and everything is a short oscillator envelope, so the
// game ships no sound assets at all.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  tone(freq, startAt, length, type, volume) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + startAt;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + length + 0.05);
  }

  // Two-note chime when a difference is found.
  chime() {
    this.tone(880, 0, 0.35, 'sine', 0.22);
    this.tone(1318.5, 0.09, 0.5, 'sine', 0.18);
  }

  // Low buzz for a wrong click.
  wrong() {
    this.tone(140, 0, 0.22, 'sawtooth', 0.08);
    this.tone(110, 0.05, 0.22, 'sawtooth', 0.06);
  }

  // Soft shimmer when a hint fires.
  hint() {
    this.tone(1567.98, 0, 0.3, 'triangle', 0.1);
    this.tone(2093, 0.12, 0.4, 'triangle', 0.08);
  }

  // Rising arpeggio for a finished round.
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * 0.11, 0.5, 'sine', 0.2));
  }

  // Short tick when the clock runs low.
  tick() {
    this.tone(1200, 0, 0.07, 'square', 0.05);
  }

  // Quiet click for buttons.
  click() {
    this.tone(660, 0, 0.08, 'sine', 0.08);
  }
}
