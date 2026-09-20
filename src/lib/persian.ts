/**
 * Persian language helpers
 * Note: never put Persian digits or letters inside LaTeX expressions;
 * every math expression must contain ASCII characters only (enforced by the tests).
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Convert English digits to Persian */
export function toPersianDigits(value: number | string | null | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  return String(value).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[Number(w)]);
}

/** Format seconds as "minute:second" with Persian digits; 65 becomes "01:05" */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return (
    toPersianDigits(String(m).padStart(2, '0')) +
    ':' +
    toPersianDigits(String(r).padStart(2, '0'))
  );
}

/** Format minute:second for scheduled times such as "09:30 to 10:15" */
export function clockOf(totalSeconds: number): string {
  return formatClock(totalSeconds);
}

/** "Slide time window from the total seconds" */
export function windowLabel(fromSeconds: number, toSeconds: number): string {
  return `${clockOf(fromSeconds)} تا ${clockOf(toSeconds)}`;
}

/** Turn a number like 1.09 (Persian or English decimal mark) into 1/09 for display */
export function faNumber(value: number | string, decimals?: number): string {
  const n = typeof value === 'number' ? value : Number(String(value).replace(/٫/g, '.'));
  const fixed = decimals !== undefined ? n.toFixed(decimals) : String(n);
  return toPersianDigits(fixed.replace(/\./g, '٫'));
}

/** Percentage with Persian digits: 96.7 becomes 96.7 percent */
export function faPercent(value: string | number): string {
  return faNumber(value, 1).replace(/٫0$/, '') + '٪';
}

/** Strip en dash and em dash characters from user-facing text */
export function cleanText(text: string): string {
  return text.replace(/[\u2013\u2014]/g, ' ');
}

/** Does the string contain ASCII characters only (suitable for LaTeX)? */
export function isAsciiOnly(text: string): boolean {
  return /^[\x20-\x7E]+$/.test(text.trim());
}
