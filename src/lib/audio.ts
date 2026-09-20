/**
 * Soft audio alerts for the practice session.
 * Sound only arms after a user gesture (starting the timer / test sound).
 * Thresholds: 10, 5 and 0 seconds left on the slide timer.
 */

let audioCtx: AudioContext | null = null;

export const CUE_THRESHOLDS = [10, 5, 0] as const;

export function ensureAudio(): void {
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx?.state === 'suspended') void audioCtx.resume();
  } catch {
    /* silent */
  }
}

export function beep(freq = 660, len = 0.16, gain = 0.05): void {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + len);
    osc.connect(g).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + len + 0.02);
  } catch {
    /* ignored */
  }
}

/**
 * Detect crossing the 10 / 5 / 0 second thresholds.
 * prevRem: previous whole remaining value (or null at slide start)
 * nextRem: current whole remaining value
 * Returns nextRem (to be stored as prev)
 */
export function cueRemaining(
  prevRem: number | null,
  nextRem: number,
  onCue: (rem: number) => void,
): number {
  if (prevRem !== null && nextRem < prevRem) {
    // any threshold we crossed from above or below (even if one tick skips several seconds)
    for (const t of CUE_THRESHOLDS) {
      if (prevRem > t && nextRem <= t) onCue(t);
    }
  }
  return nextRem;
}

/** Play the standard 10 / 5 / 0 cues */
export function playThresholdCue(rem: number): void {
  if (rem === 10 || rem === 5) beep(660, 0.16, 0.05);
  else if (rem === 0) beep(880, 0.3, 0.06);
}

/** Test sound from the settings panel (user gesture) */
export function playTestCue(): void {
  ensureAudio();
  beep(720, 0.18, 0.06);
  window.setTimeout(() => beep(880, 0.22, 0.05), 220);
}
