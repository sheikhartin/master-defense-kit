/**
 * سربرگ سایت: برند، ناوبری پنج‌بخشی و کنترل‌های سراسری
 * (مقیاس متن، فاصله سطر، صدای هشدار، حالت تمرکز).
 */

import { useEffect, useState } from 'react';
import {
  BookOpenText,
  Compass,
  FileDown,
  Focus,
  GraduationCap,
  Keyboard,
  ListChecks,
  Maximize2,
  MessageCircleQuestion,
  ScrollText,
  Settings2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp, type PrintScope, type TabId } from '../lib/app-context';
import { useModalBehavior } from '../lib/use-modal';
import { toPersianDigits } from '../lib/persian';
import BrandMark from './BrandMark';

const TABS: Array<{ id: TabId; label: string; hint: string; Icon: typeof Compass }> = [
  { id: 'home', label: 'نقشه راه دفاع', hint: 'ساختار و زمان‌بندی جلسه', Icon: Compass },
  { id: 'practice', label: 'جلسه تمرینی', hint: 'شبیه‌سازی زمان‌دار ارائه', Icon: GraduationCap },
  { id: 'cheat', label: 'برگه تقلب', hint: 'فرمول‌ها و ارقام کلیدی', Icon: ScrollText },
  { id: 'qa', label: 'پرسش‌های داور', hint: 'پاسخ‌های پیشنهادی', Icon: MessageCircleQuestion },
  { id: 'checklist', label: 'چک‌لیست روز دفاع', hint: 'آمادگی و کنترل', Icon: ListChecks },
];

/** گزینه‌های منوی خروجی PDF: کل وب‌سایت در صدر، سپس تک‌بخش‌ها */
const PDF_OPTIONS: Array<{ scope: PrintScope; label: string; hint: string; Icon: typeof Compass }> = [
  { scope: 'all', label: 'کل وب‌سایت', hint: 'همه بخش‌ها در یک سند تمیز', Icon: BookOpenText },
  { scope: 'roadmap', label: 'نقشه راه دفاع', hint: 'ساختار، زمان‌بندی و مرزهای ادعا', Icon: Compass },
  { scope: 'deck', label: 'متن کامل ارائه', hint: 'نوزده اسلاید + پشتیبان اختیاری', Icon: GraduationCap },
  { scope: 'cheat', label: 'برگه تقلب', hint: 'فرمول‌ها، ارقام و جدول‌ها', Icon: ScrollText },
  { scope: 'qa', label: 'بانک پرسش داور', hint: 'همه پرسش‌ها و پاسخ‌ها', Icon: MessageCircleQuestion },
  { scope: 'checklist', label: 'چک‌لیست روز دفاع', hint: 'همه چک‌لیست‌ها و نگو/بگو', Icon: ListChecks },
];

export default function Header() {
  const app = useApp();
  const [panel, setPanel] = useState(false);
  const [pdfMenu, setPdfMenu] = useState(false);
  /* رفتار یکپارچه لایه باز: Escape، به‌دام‌انداختن Tab و ثبت در شمارنده لایه‌ها */
  const panelRef = useModalBehavior<HTMLDivElement>(panel, () => setPanel(false));
  const pdfRef = useModalBehavior<HTMLDivElement>(pdfMenu, () => setPdfMenu(false));

  /* بستن با کلیک بیرون پنل */
  useEffect(() => {
    if (!panel && !pdfMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel && panelRef.current && !panelRef.current.contains(t)) setPanel(false);
      if (pdfMenu && pdfRef.current && !pdfRef.current.contains(t)) setPdfMenu(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [panel, pdfMenu, panelRef, pdfRef]);

  const startPdf = (scope: PrintScope) => {
    setPdfMenu(false);
    /* اجازه بده منو اول بسته شود، سپس گفت‌وگوی چاپ باز شود */
    requestAnimationFrame(() => app.openPrint(scope));
  };

  return (
    <header className="site-header sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-2 pt-3 md:px-6">
        {/* ردیف بالا */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandMark className="h-10 w-10 shrink-0 shadow-soft" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-6 text-ink md:text-lg">
                بستار دفاع ارشد BCOA
              </h1>
              <p className="hidden truncate text-xs text-muted sm:block">
                تمرین گام‌به‌گام جلسه دفاع پایان‌نامه، کاملاً آفلاین و خصوصی
              </p>
            </div>
          </div>

          {/* کنترل‌های سراسری: لنگر منوها روی کل گروه است تا در صفحه‌های باریک
              هرگز از لبه دید بیرون نزنند (به‌جای لنگر روی هر دکمه جداگانه) */}
          <div className="relative flex shrink-0 items-center gap-1">
            <div ref={pdfRef}>
              <button
                type="button"
                title="دانلود PDF (Alt + P برای بخش فعلی)"
                aria-label="دانلود PDF"
                className={`icon-btn ${pdfMenu ? 'bg-surface-2 text-ink' : ''}`}
                aria-expanded={pdfMenu}
                aria-haspopup="menu"
                onClick={() => setPdfMenu((v) => !v)}
              >
                <FileDown className="h-4.5 w-4.5" />
              </button>

              {pdfMenu && (
                <div
                  role="menu"
                  aria-label="دانلود PDF"
                  className="pop-in absolute left-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-2 shadow-lift"
                >
                  <p className="px-3 pb-1 pt-2 text-xs font-extrabold text-muted">
                    دانلود PDF تمیز و قابل چاپ
                  </p>
                  {PDF_OPTIONS.map(({ scope, label, hint, Icon }) => (
                    <button
                      key={scope}
                      type="button"
                      role="menuitem"
                      onClick={() => startPdf(scope)}
                      className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-right transition-colors hover:bg-surface-2 ${
                        scope === 'all' ? 'mb-1 border border-pine/20 bg-pine-wash/70 hover:bg-pine-wash' : ''
                      }`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${scope === 'all' ? 'text-pine' : 'text-muted'}`} />
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold ${scope === 'all' ? 'text-pine-deep' : 'text-ink'}`}>
                          {label}
                        </span>
                        <span className="block text-[0.72rem] leading-5 text-muted">{hint}</span>
                      </span>
                    </button>
                  ))}
                  <p className="border-t border-line px-3 pb-2 pt-2 text-[0.7rem] leading-5 text-muted">
                    در پنجره چاپ مرورگر، «ذخیره به‌صورت PDF» را انتخاب کن.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              title="حالت تمرکز (کلید F)"
              className={`icon-btn ${app.focus ? 'bg-pine-soft text-pine-deep' : ''}`}
              aria-pressed={app.focus}
              onClick={() => app.setFocus(!app.focus)}
            >
              {app.focus ? <Maximize2 className="h-4.5 w-4.5" /> : <Focus className="h-4.5 w-4.5" />}
            </button>

            <div ref={panelRef}>
              <button
                type="button"
                title="تنظیمات خواندن"
                aria-label="تنظیمات خواندن"
                className={`icon-btn ${panel ? 'bg-surface-2 text-ink' : ''}`}
                aria-expanded={panel}
                onClick={() => setPanel((v) => !v)}
              >
                <Settings2 className="h-4.5 w-4.5" />
              </button>

              {panel && (
                <div className="pop-in absolute left-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-4 shadow-lift">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-ink">تنظیمات خواندن</h3>
                    <button className="icon-btn h-7 w-7" onClick={() => setPanel(false)} aria-label="بستن">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink-soft">
                        <span>اندازه متن</span>
                        <span dir="ltr">{toPersianDigits(Math.round(app.textScale * 100))}٪</span>
                      </div>
                      <input
                        type="range"
                        min={85}
                        max={125}
                        step={5}
                        value={Math.round(app.textScale * 100)}
                        onChange={(e) => app.setTextScale(Number(e.target.value) / 100)}
                        className="w-full accent-pine"
                        aria-label="اندازه متن"
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 text-xs font-bold text-ink-soft">فاصله خطوط</div>
                      <div className="flex gap-1" role="group" aria-label="فاصله خطوط">
                        {[1.7, 1.9, 2.1].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => app.setLineHeight(v)}
                            className={`btn btn-sm flex-1 ${app.lineHeight === v ? 'btn-soft' : 'btn-quiet'}`}
                          >
                            {toPersianDigits(String(v).replace('.', '٫'))}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => app.setAudible(!app.audible)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-sm font-bold text-ink-soft"
                    >
                      <span className="flex items-center gap-2">
                        {app.audible ? <Volume2 className="h-4 w-4 text-pine" /> : <VolumeX className="h-4 w-4" />}
                        هشدار صوتی پایان زمان
                      </span>
                      <span
                        className={`relative h-5 w-9 rounded-full transition-colors ${app.audible ? 'bg-pine' : 'bg-line-strong'}`}
                        aria-hidden="true"
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all ${app.audible ? 'right-0.5' : 'right-4'}`}
                        />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => app.setShortcutsOn(!app.shortcutsOn)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-sm font-bold text-ink-soft"
                      aria-pressed={app.shortcutsOn}
                    >
                      <span className="flex items-center gap-2">
                        <Keyboard className={`h-4 w-4 ${app.shortcutsOn ? 'text-pine' : ''}`} />
                        میان‌برهای تک‌کلیدی
                      </span>
                      <span
                        className={`relative h-5 w-9 rounded-full transition-colors ${app.shortcutsOn ? 'bg-pine' : 'bg-line-strong'}`}
                        aria-hidden="true"
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all ${app.shortcutsOn ? 'right-0.5' : 'right-4'}`}
                        />
                      </span>
                    </button>

                    <p className="border-t border-line pt-3 text-[0.72rem] leading-6 text-muted">
                      همه تنظیمات و یادداشت‌ها فقط در همین دستگاه ذخیره می‌شوند.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ناوبری */}
        <nav aria-label="بخش‌های برنامه" className="no-hbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          {TABS.map(({ id, label, Icon }) => {
            const active = app.tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => app.go(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                  active
                    ? 'bg-pine text-surface shadow-soft'
                    : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-surface/90' : 'text-muted'}`} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
