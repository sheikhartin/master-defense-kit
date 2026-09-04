/**
 * نقشه راه دفاع: معرفی کوتاه، ادامه تمرین و نمای کامل ساختار نسخه ۲.
 * این صفحه عمداً کم‌عنصر است: فقط راهنمای جلسه، نه تکرار محتوای برگه تقلب.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Play, RotateCcw, Target } from 'lucide-react';
import { chapters } from '../data/deck';
import { governingPrinciple } from '../data/roadmap';
import { planSlides } from '../lib/session';
import { readStore, removeStore } from '../lib/storage';
import type { SessionMarker } from '../lib/app-context';
import { useApp } from '../lib/app-context';
import { clockOf, toPersianDigits } from '../lib/persian';
import { SectionHead, TimeRange } from '../components/ui';

export default function HomeLab() {
  const app = useApp();
  const plan = useMemo(() => planSlides(false), []);
  const [marker, setMarker] = useState<SessionMarker | null>(() =>
    readStore<SessionMarker | null>('session:last', null),
  );

  const chapterRows = chapters.map((ch) => {
    const items = plan.filter((p) => p.chapterId === ch.id);
    const first = items[0];
    const last = items[items.length - 1];
    return { ch, items, first, last };
  });

  const startChapter = (chId: string) => {
    const idx = plan.findIndex((p) => p.chapterId === chId);
    if (idx >= 0) app.go('practice', idx);
  };

  const resumeTo = (slide: number) => app.go('practice', Math.min(slide, plan.length - 1));

  return (
    <div className="stagger space-y-12">
      {/* معرفی */}
      <section className="card relative overflow-hidden p-7 md:p-9">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pine-soft/70 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="eyebrow">
            <Target className="h-3.5 w-3.5" />
            سناریوی نهایی نسخه ۲
          </span>
          <h2 className="mt-5 max-w-3xl text-2xl font-black leading-10 text-ink md:text-[1.9rem] md:leading-[1.5]">
            جلسه دفاع پایان‌نامه خود را آرام و گام‌به‌گام تمرین کنید
          </h2>
          <p className="mt-3 max-w-3xl leading-9 text-ink-soft">
            این بستار، سناریوی رسمی دفاع پایان‌نامه شما را به ابزار تمرینی تبدیل کرده است:
            متن گفتار، زمان‌بندی دقیق، فرمول‌های کامل، پرسش‌های داور و چک‌لیست روز دفاع.
          </p>
          <blockquote className="mt-5 max-w-3xl rounded-2xl border-r-4 border-ochre bg-ochre-soft/60 px-5 py-4 leading-8 text-ink-soft">
            <span className="font-extrabold text-ochre">اصل حاکم: </span>
            {governingPrinciple}
          </blockquote>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => app.go('practice', 0)}>
              <Play className="h-4 w-4" />
              شروع تمرین کامل
            </button>
            <button type="button" className="btn btn-soft" onClick={() => app.go('cheat')}>
              <BookOpen className="h-4 w-4" />
              فرمول‌ها و برگه تقلب
            </button>
          </div>
        </div>
      </section>

      {/* ادامه از آخرین جایگاه */}
      {marker && marker.slide > 0 && (
        <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <RotateCcw className="h-5 w-5 shrink-0 text-pine" />
            <p className="min-w-0 text-sm font-bold leading-7 text-ink">
              آخرین تمرین شما در اسلاید {toPersianDigits((marker.slide % plan.length) + 1)} متوقف شد.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => {
              removeStore('session:last');
              setMarker(null);
            }}>
              پاک‌کردن جایگاه
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => resumeTo(marker.slide)}>
              <Play className="h-4 w-4" />
              ادامه تمرین
            </button>
          </div>
        </section>
      )}

      {/* نقشه راه هشت‌بخشی */}
      <section aria-labelledby="roadmap-title">
        <SectionHead
          index={1}
          title="نقشه راه جلسه دفاع"
          subtitle="ساختار، ترتیب و پنجره زمانی هر بخش مطابق نسخه ۲"
        />
        <div className="mt-6 space-y-4">
          {chapterRows.map(({ ch, items, first, last }) => (
            <div key={ch.id} className="card hover-card p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pine text-base font-black text-surface">
                    {ch.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-extrabold text-ink">{ch.title}</h3>
                      <span className="text-xs font-bold text-muted">
                        اسلاید {toPersianDigits(first.num)} تا {toPersianDigits(last.num)}
                        {' · '}
                        <span className="timer-num">{clockOf(items.reduce((s2, p) => s2 + p.duration, 0))}</span>
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-7 text-ink-soft">{ch.summary}</p>
                    {ch.goal && (
                      <p className="mt-2 text-[0.8rem] leading-6 text-muted">
                        <span className="font-bold text-pine-deep">هدف بخش: </span>
                        {ch.goal}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 lg:pt-1">
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => startChapter(ch.id)}>
                    تمرین از این بخش
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-2 border-t border-line pt-5 sm:grid-cols-2">
                {items.map((p) => (
                  <li key={`${ch.id}-${p.index}`} className="flex items-baseline gap-3 text-[0.85rem] leading-6">
                    <span className="shrink-0 font-black text-muted">اسلاید {toPersianDigits(p.num)}</span>
                    <span className="min-w-0 flex-1 truncate font-bold text-ink">{p.title}</span>
                    <span className="shrink-0 text-xs text-muted">
                      <TimeRange from={p.start} to={p.end} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-dashed border-line-strong bg-surface-2/50 px-4 py-3 text-[0.82rem] leading-6 text-muted">
          <Target className="mt-1 h-4 w-4 shrink-0 text-ochre" />
          <span>
            اسلاید «وراثت جهت و رقابت سرزمینی» در چیدمان گسترده، به‌صورت اسلاید مستقل به مدت ۴۵ ثانیه
            پس از اسلاید ۱۰ اضافه می‌شود (مجموع گفتار به ۱۹:۴۵ می‌رسد). در چیدمان فشرده همانند نسخه ۲،
            همین نکته را کوتاه در اسلاید ۱۰ بیان می‌کنید و اسلاید مستقل به‌عنوان پشتیبان می‌ماند.
          </span>
        </p>
      </section>
    </div>
  );
}
