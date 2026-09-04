/**
 * ابزارهای زبانی فارسی
 * نکته: هرگز ارقام یا حروف فارسی را داخل عبارت‌های LaTeX وارد نکنید؛
 * همه عبارت‌های ریاضی باید فقط نویسه‌های ASCII داشته باشند (در tests بررسی می‌شود).
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** تبدیل ارقام انگلیسی به فارسی */
export function toPersianDigits(value: number | string | null | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  return String(value).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[Number(w)]);
}

/** قالب‌بندی ثانیه به «دقیقه:ثانیه» با ارقام فارسی؛ ۶۵ به «۰۱:۰۵» */
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

/** قالب‌بندی دقیقه:ثانیه برای زمان‌های برنامه‌ریزی مثل «۰۹:۳۰ تا ۱۰:۱۵» */
export function clockOf(totalSeconds: number): string {
  return formatClock(totalSeconds);
}

/** «از روی ثانیه کل، بازه پنجره اسلاید» */
export function windowLabel(fromSeconds: number, toSeconds: number): string {
  return `${clockOf(fromSeconds)} تا ${clockOf(toSeconds)}`;
}

/** تبدیل عددی مانند ۱٫۰۹ (با ممیز فارسی یا انگلیسی) به ۱/۰۹ برای نمایش */
export function faNumber(value: number | string, decimals?: number): string {
  const n = typeof value === 'number' ? value : Number(String(value).replace(/٫/g, '.'));
  const fixed = decimals !== undefined ? n.toFixed(decimals) : String(n);
  return toPersianDigits(fixed.replace(/\./g, '٫'));
}

/** درصد با ارقام فارسی: ۹۶.7 -> ۹۶٫۷٪ */
export function faPercent(value: string | number): string {
  return faNumber(value, 1).replace(/٫0$/, '') + '٪';
}

/** حذف خط‌های فاصله (en dash و em dash) از متن‌های واسط کاربر */
export function cleanText(text: string): string {
  return text.replace(/[\u2013\u2014]/g, ' ');
}

/** آیا رشته فقط نویسه‌های ASCII (مناسب LaTeX) دارد؟ */
export function isAsciiOnly(text: string): boolean {
  return /^[\x20-\x7E]+$/.test(text.trim());
}
