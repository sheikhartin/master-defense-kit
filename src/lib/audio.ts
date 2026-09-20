/**
 * هشدار صوتی نرم جلسه تمرینی.
 * صدا فقط پس از ژست کاربر (شروع تایمر / آزمایش صدا) فعال می‌شود.
 * آستانه‌ها: ۱۰، ۵ و ۰ ثانیه مانده از زمان اسلاید.
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
    /* بی‌صدا */
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
    /* نادیده */
  }
}

/**
 * تشخیص لبه عبور از آستانه‌های ۱۰ / ۵ / ۰.
 * prevRem: باقی‌مانده صحیح قبلی (یا null در شروع اسلاید)
 * nextRem: باقی‌مانده صحیح فعلی
 * برمی‌گرداند nextRem (برای ذخیره به‌عنوان prev)
 */
export function cueRemaining(
  prevRem: number | null,
  nextRem: number,
  onCue: (rem: number) => void,
): number {
  if (prevRem !== null && nextRem < prevRem) {
    // هر آستانه‌ای که از بالا به آن یا زیر آن عبور کرده‌ایم (حتی اگر یک تیک چند ثانیه بپرد)
    for (const t of CUE_THRESHOLDS) {
      if (prevRem > t && nextRem <= t) onCue(t);
    }
  }
  return nextRem;
}

/** پخش نشانه‌های استاندارد ۱۰ / ۵ / ۰ */
export function playThresholdCue(rem: number): void {
  if (rem === 10 || rem === 5) beep(660, 0.16, 0.05);
  else if (rem === 0) beep(880, 0.3, 0.06);
}

/** آزمایش صدا از تنظیمات (ژست کاربر) */
export function playTestCue(): void {
  ensureAudio();
  beep(720, 0.18, 0.06);
  window.setTimeout(() => beep(880, 0.22, 0.05), 220);
}
