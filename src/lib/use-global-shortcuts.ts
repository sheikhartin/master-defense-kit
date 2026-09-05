/**
 * میان‌برهای سراسری که در همه تب‌ها کار می‌کنند:
 *   راهنما (H / ؟)، حالت تمرکز (F)، صدا (M)، بستن (Esc)،
 *   پرش به بخش‌ها (Alt + ۱ تا ۵)، خروجی PDF بخش فعلی (Alt + P)
 *   و خروجی PDF کل وب‌سایت (Alt + Shift + P).
 *
 * قواعد دقت:
 *   تطبیق با e.code (مستقل از چیدمان فارسی/انگلیسی)، نادیده‌گرفتن وقتی یک
 *   لایه باز است یا کاربر در ورودی متنی تایپ می‌کند، و نادیده‌گرفتن
 *   Ctrl/Meta تا با میان‌برهای مرورگر (مثل Ctrl+P برای چاپ) تداخل نشود.
 *   میان‌برهای تک‌کلیدی فقط وقتی کاربر آن‌ها را فعال نگه داشته باشد کار می‌کنند
 *   (دسترس‌پذیری WCAG 2.1.4)؛ ترکیب‌های Alt همیشه فعال‌اند.
 */

import { useEffect, useRef } from 'react';
import { printScopeOfTab, useApp, type TabId } from './app-context';
import { isEditableTarget, snapshot } from './keys';
import { overlaysOpen } from './ui-bus';

const TAB_ORDER: TabId[] = ['home', 'practice', 'cheat', 'qa', 'checklist'];

export function useGlobalShortcuts() {
  const app = useApp();
  const appRef = useRef(app);
  useEffect(() => {
    appRef.current = app;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = appRef.current;
      const k = snapshot(e);

      if (overlaysOpen()) return; // لایه باز: فقط Escape که خود لایه می‌بندد
      if (isEditableTarget(e)) return; // تایپ در یادداشت/ورودی: سکوت

      // ترکیب‌های Alt (خارج از دامنه تک‌کلیدی WCAG) همیشه فعال‌اند
      if (k.alt && !k.ctrl && !k.meta) {
        const m = /^Digit([1-5])$/.exec(k.code);
        if (m) {
          e.preventDefault();
          a.go(TAB_ORDER[Number(m[1]) - 1]);
          return;
        }
        if (k.code === 'KeyP') {
          e.preventDefault();
          /* Alt + P: خروجی PDF بخش فعلی؛ Alt + Shift + P: کل وب‌سایت */
          a.openPrint(k.shift ? 'all' : printScopeOfTab[a.tab]);
          return;
        }
        return;
      }
      // هر مادیفایر دیگر (Ctrl/Cmd) یعنی میان‌بر مرورگر؛ دست نزن
      if (k.ctrl || k.meta || k.alt) return;

      if (k.code === 'Escape') {
        if (a.focus) a.setFocus(false);
        return;
      }

      // میان‌برهای تک‌کلیدی، فقط با رضایت کاربر
      if (!a.shortcutsOn) return;
      if (k.code === 'KeyF' && !k.repeat) {
        a.setFocus(!a.focus);
        return;
      }
      if (k.code === 'KeyM' && !k.repeat) {
        a.setAudible(!a.audible);
        return;
      }
      if (k.code === 'KeyH' || (k.code === 'Slash' && k.shift)) {
        e.preventDefault();
        a.setGuideOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
