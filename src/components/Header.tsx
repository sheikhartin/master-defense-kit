/**
 * سربرگ سایت: برند، ناوبری پنج‌بخشی و کنترل‌های سراسری
 * (مقیاس متن، فاصله سطر، صدای هشدار، حالت تمرکز).
 */

import { useEffect, useState } from 'react';
import {
  Compass,
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
import { useApp, type TabId } from '../lib/app-context';
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

export default function Header() {
  const app = useApp();
  const [panel, setPanel] = useState(false);
  /* رفتار یکپارچه لایه باز: Escape، به‌دام‌انداختن Tab و ثبت در شمارنده لایه‌ها */
  const panelRef = useModalBehavior<HTMLDivElement>(panel, () => setPanel(false));

  /* بستن با کلیک بیرون پنل */
  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanel(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [panel, panelRef]);

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

          {/* کنترل‌های سراسری */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              title="حالت تمرکز (کلید F)"
              className={`icon-btn ${app.focus ? 'bg-pine-soft text-pine-deep' : ''}`}
              aria-pressed={app.focus}
              onClick={() => app.setFocus(!app.focus)}
            >
              {app.focus ? <Maximize2 className="h-4.5 w-4.5" /> : <Focus className="h-4.5 w-4.5" />}
            </button>

            <div className="relative" ref={panelRef}>
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
                <div className="pop-in absolute left-0 top-12 z-50 w-72 rounded-2xl border border-line bg-surface p-4 shadow-lift">
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
