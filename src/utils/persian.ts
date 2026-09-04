/**
 * توابع کمکی برای تبدیل و قالب‌بندی ارقام و متون به زبان فارسی
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * تبدیل تمام ارقام انگلیسی درون یک رشته یا عدد به ارقام فارسی
 */
export function toPersianDigits(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[parseInt(w, 10)]);
}

/**
 * فرمت کردن زمان (بر حسب ثانیه) به ساختار mm:ss با ارقام فارسی
 * مثلا 75 ثانیه تبدیل می‌شود به «۰۱:۱۵»
 */
export function formatTimePersian(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSec / 60).toString().padStart(2, '0');
  const s = (safeSec % 60).toString().padStart(2, '0');
  return `${toPersianDigits(m)}:${toPersianDigits(s)}`;
}

/**
 * پاکسازی خط‌های فاصله فرنگی (em-dash و en-dash) و تبدیل به معادل فارسی
 */
export function sanitizePersianText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2014]/g, ' ؛ ') // em-dash
    .replace(/[\u2013]/g, ' تا ') // en-dash
    .replace(/--/g, ' - ');
}
