/**
 * راهنمای سراسری کلیدها (کلید H یا ?).
 * یک پنجره دسترس‌پذیر با به‌دام‌انداختن فوکوس؛ میان‌برهای هر بخش را بر پایه
 * تب فعلی برجسته می‌کند تا کاربر بداند همین حالا چه کلیدهایی فعال‌اند.
 */

import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useApp, type TabId } from '../lib/app-context';
import { useModalBehavior } from '../lib/use-modal';
import { snapshot } from '../lib/keys';
import { toPersianDigits } from '../lib/persian';

type Row = { action: string; keys: string[] };

const GLOBAL_ROWS: Row[] = [
  { action: 'باز و بسته‌کردن همین راهنما', keys: ['H', '؟'] },
  { action: 'حالت تمرکز', keys: ['F'] },
  { action: 'هشدار صوتی روشن و خاموش', keys: ['M'] },
  { action: 'بستن لایه باز / خروج از تمرکز', keys: ['Esc'] },
  { action: 'پرش به یکی از پنج بخش', keys: ['Alt', '۱ تا ۵'] },
  { action: 'خروجی PDF بخش فعلی', keys: ['Alt', 'P'] },
  { action: 'خروجی PDF کل وب‌سایت', keys: ['Alt', 'Shift', 'P'] },
];

const PRACTICE_ROWS: Row[] = [
  { action: 'اسلاید بعد / قبلی', keys: ['چپ', 'راست'] },
  { action: 'شروع و توقف هم‌زمان تایمرها', keys: ['Space', 'P'] },
  { action: 'تایمر این اسلاید از نو', keys: ['R'] },
  { action: 'کل جلسه از نو', keys: ['Shift', 'R'] },
  { action: 'پرش به اسلاید ۱ تا ۱۰', keys: ['۱ تا ۹', '۰'] },
  { action: 'پرش به اسلایدهای ۱۱ به بعد', keys: ['Shift', 'عدد'] },
  { action: 'اولین و آخرین اسلاید', keys: ['Home', 'End'] },
  { action: 'چیدمان گسترده با اسلاید اختیاری', keys: ['O'] },
];

const QA_ROWS: Row[] = [
  { action: 'پرسش بعدی در شبیه‌ساز', keys: ['N'] },
  { action: 'نمایش / پنهان‌کردن پاسخ', keys: ['Enter'] },
  { action: 'چینش تازه پرسش‌ها', keys: ['R'] },
];

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1" dir="ltr">
      {keys.map((k) => (
        <kbd key={k}>{toPersianDigits(k)}</kbd>
      ))}
    </span>
  );
}

function Section({ title, active, rows }: { title: string; active?: boolean; rows: Row[] }) {
  return (
    <section className={`rounded-2xl border p-4 ${active ? 'border-pine/40 bg-pine-wash/60' : 'border-line bg-surface-2/40'}`}>
      <h4 className="mb-2 text-xs font-extrabold text-ink">{title}</h4>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.action} className="flex items-center justify-between gap-3 text-[0.82rem] leading-6">
            <span className="font-bold text-ink-soft">{r.action}</span>
            <Keys keys={r.keys} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ShortcutGuide() {
  const app = useApp();
  const ref = useModalBehavior<HTMLDivElement>(true, () => app.setGuideOpen(false));
  const tab: TabId = app.tab;

  /* همان کلید بازکردن (H یا ?) آن را می‌بندد؛ چون هنگام بازبودن، میان‌بر
     سراسری سکوت می‌کند تا چیزی پشت پنجره فعال نشود. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = snapshot(e);
      if (k.code === 'KeyH' || (k.code === 'Slash' && k.shift)) {
        e.preventDefault();
        e.stopPropagation();
        app.setGuideOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [app]);

  return (
    <div
      className="overlay fixed inset-0 z-[70] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={() => app.setGuideOpen(false)}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="راهنمای کلیدهای میان‌بر"
        className="card pop-in max-h-[85vh] w-full max-w-xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
            <Keyboard className="h-5 w-5 text-pine" />
            راهنمای کلیدهای میان‌بر
          </h3>
          <button type="button" className="icon-btn" onClick={() => app.setGuideOpen(false)} aria-label="بستن">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <Section title="در همه بخش‌ها" rows={GLOBAL_ROWS} active />
          {tab === 'practice' && <Section title="جلسه تمرینی" rows={PRACTICE_ROWS} active />}
          {tab === 'qa' && <Section title="پرسش‌های داور" rows={QA_ROWS} active />}
          {tab !== 'practice' && tab !== 'qa' && (
            <>
              <Section title="جلسه تمرینی" rows={PRACTICE_ROWS} />
              <Section title="پرسش‌های داور" rows={QA_ROWS} />
            </>
          )}
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-sm font-bold text-ink-soft">
          <span>میان‌برهای تک‌کلیدی (F، H، اعداد و…)</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-pine"
            checked={app.shortcutsOn}
            onChange={(e) => app.setShortcutsOn(e.target.checked)}
          />
        </label>
        <p className="mt-2 text-[0.72rem] leading-6 text-muted">
          ترکیب‌های Alt و کلیدهای جهت‌دار همیشه فعال‌اند؛ خاموش‌کردن بالا فقط میان‌برهای تک‌کلیدی را
          غیرفعال می‌کند تا با ورودی گفتاری و فناوری‌های کمکی تداخل نداشته باشند (دسترس‌پذیری WCAG).
        </p>
      </div>
    </div>
  );
}
