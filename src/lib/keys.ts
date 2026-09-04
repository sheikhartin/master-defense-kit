/**
 * ابزارهای خالص صفحه‌کلید (بدون React) تا همه قلاب‌ها از یک قاعده پیروی کنند.
 *
 * چرا e.code به‌جای e.key؟ این برنامه فارسی است و بسیاری از کاربران کیبورد
 * فارسی فعال دارند؛ در چیدمان فارسی، فشردن همان کلید فیزیکی «R» حرف دیگری
 * تولید می‌کند و میان‌برهای تک‌حرفی قبلی عملاً کار نمی‌کردند. e.code به
 * «موقعیت فیزیکی» کلید اشاره دارد و مستقل از چیدمان زبان است؛ پس میان‌برها
 * هم روی کیبورد فارسی و هم انگلیسی دقیقاً یکسان عمل می‌کنند.
 */

/** خلاصه رویداد کلید برای تطبیق */
export interface KeySnapshot {
  code: string;
  key: string;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  repeat: boolean;
}

export function snapshot(e: KeyboardEvent): KeySnapshot {
  return {
    code: e.code,
    key: e.key,
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey,
    repeat: e.repeat,
  };
}

/** آیا رویداد از یک ورودی متنی می‌آید؟ در این حالت میان‌برها باید سکوت کنند. */
export function isEditableTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    t.isContentEditable === true
  );
}

/** آیا رویداد از یک عنصر تعاملی می‌آید که رفتار بومی Space/Enter دارد؟ */
export function isInteractiveTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return (
    tag === 'BUTTON' ||
    tag === 'A' ||
    tag === 'INPUT' ||
    tag === 'SELECT' ||
    tag === 'TEXTAREA' ||
    tag === 'SUMMARY' ||
    t.isContentEditable === true ||
    t.getAttribute('role') === 'checkbox' ||
    t.getAttribute('role') === 'button' ||
    t.getAttribute('role') === 'switch'
  );
}

/** آیا کلید، ترکیب «فقط یک نویسه» است (مشمول WCAG 2.1.4)؟ */
export function isCharacterOnly(k: KeySnapshot): boolean {
  if (k.ctrl || k.alt || k.meta) return false;
  // نویسه‌های قابل چاپ بدون مادیفایر غیر از Shift
  return k.key.length === 1 && !k.repeat ? true : k.key.length === 1;
}

/** نگاشت ارقام بالای کیبورد به شماره اسلاید: ۰ یعنی ۱۰، با Shift یعنی ۱۱ تا ۲۰ */
export function digitFromCode(code: string, shift: boolean): number | null {
  const m = /^Digit(\d)$/.exec(code);
  if (!m) return null;
  const d = Number(m[1]);
  const base = d === 0 ? 10 : d;
  return shift ? base + 10 : base;
}

/** برچسب خوانا برای راهنما */
export function labelFor(code: string, shift = false): string {
  const map: Record<string, string> = {
    ArrowLeft: 'کلید چپ',
    ArrowRight: 'کلید راست',
    PageDown: 'PageDown',
    PageUp: 'PageUp',
    Home: 'Home',
    End: 'End',
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    Slash: '/',
  };
  const base = map[code] ?? code.replace(/^Key|^Digit/, '');
  return shift ? `Shift + ${base}` : base;
}
