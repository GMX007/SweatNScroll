/**
 * FormForge Audio Service
 * Uses Web Audio API oscillator-based sounds — no external files needed.
 * All sounds are short, satisfying, and gym-themed.
 */

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3, rampDown = true) {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // Silently fail — audio is non-critical
    console.warn('[FormForge] Audio failed:', err.message);
  }
}

/**
 * Rep completed — short satisfying "ding"
 * Quick rising two-note chirp
 */
export function playRepComplete() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    // Note 1: quick tap
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Note 2: higher chirp
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1175, now + 0.06); // D6
    gain2.gain.setValueAtTime(0.2, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.15);
  } catch (err) {
    console.warn('[FormForge] Audio failed:', err.message);
  }
}

/**
 * Set/exercise completed — triumphant three-note chord
 */
export function playSetComplete() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5 — major chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  } catch (err) {
    console.warn('[FormForge] Audio failed:', err.message);
  }
}

/**
 * Level up — epic ascending fanfare
 */
export function playLevelUp() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;
    // Rising arpeggio: C5 → E5 → G5 → C6
    const notes = [523, 659, 784, 1047];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });

    // Final sustain chord
    const chordDelay = notes.length * 0.12;
    [1047, 1319, 1568].forEach(freq => { // C6, E6, G6
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + chordDelay);
      gain.gain.setValueAtTime(0.2, now + chordDelay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + chordDelay + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + chordDelay);
      osc.stop(now + chordDelay + 0.8);
    });
  } catch (err) {
    console.warn('[FormForge] Audio failed:', err.message);
  }
}

/**
 * Form warning — short low "boop" to alert without being annoying
 */
export function playFormWarning() {
  playTone(280, 0.15, 'square', 0.15);
}

/**
 * Form break / pause — two descending notes
 */
export function playFormBreak() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(400, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(300, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);
  } catch (err) {
    console.warn('[FormForge] Audio failed:', err.message);
  }
}

/**
 * Countdown tick — crisp beep for the positioning countdown
 */
export function playCountdownTick() {
  playTone(660, 0.12, 'sine', 0.25);
}

/**
 * Personal best — exciting quick ascending burst
 */
export function playPersonalBest() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;
    const notes = [784, 988, 1175, 1397, 1568]; // G5 up to G6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.2, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  } catch (err) {
    console.warn('[FormForge] Audio failed:', err.message);
  }
}
