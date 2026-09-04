/**
 * نقشه راه دفاع: نمای کلی ساختار نسخه ۲، شروع سریع تمرین و پیام اصلی جلسه.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CircleHelp, Clock3, Play, RotateCcw, Target, Timer } from 'lucide-react';
import { chapters, slides, SAFETY_BUFFER } from '../data/deck';
import { claimBoundaries, fiveNumbers, governingPrinciple, memoryTakeaways, missionPoints, successLine } from '../data/roadmap';
import { planSlides, slideWindow, totalTalk, practiceTarget } from '../lib/session';
import { readStore, removeStore } from '../lib/storage';
import type { SessionMarker } from '../lib/app-context';
import { useApp } from '../lib/app-context';
import { clockOf, toPersianDigits } from '../lib/persian';
import { SectionHead } from '../components/ui';

export default function HomeLab() {
  const app = useApp();
  const plan = useMemo(() => planSlides(false), []);
  const [marker] = useState<SessionMarker | null>(() => readStore<SessionMarker | null>('session:last', null));

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

  return (
    <div className="space-y-12">
      {/* قهرمان صفحه */}
      <section className="card relative overflow-hidden p-7 md:p-10">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pine-soft/70 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="eyebrow">
            <Target className="h-3.5 w-3.5" />
            سناریوی نهایی نسخه ۲
          </span>
          <h2 className="mt-4 max-w-3xl text-2xl font-black leading-10 text-ink md:text-[2rem] md:leading-[1.5]">
            جلسه دفاع پایان‌نامه خود را آرام و گام‌به‌گام تمرین کنید
          </h2>
          <p className="mt-3 max-w-3xl text-[1.05rem] leading-9 text-ink-soft">
            الگوریتم بهینه‌سازی سسک سرسیاه (BCOA)، یک الگوریتم فراابتکاری جدید برای مسائل
            بهینه‌سازی سراسری و مهندسی. این بستار، همان سناریوی رسمی شما را به ابزار تمرینی
            تبدیل کرده است: متن گفتار، زمان‌بندی دقیق، فرمول‌های کامل، پرسش‌های داور و چک‌لیست روز دفاع.
          </p>
          <blockquote className="mt-5 max-w-3xl rounded-2xl border-r-4 border-ochre bg-ochre-soft/60 px-5 py-4 text-[0.98rem] leading-8 text-ink-soft">
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
            {marker && marker.slide > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => app.go('practice', Math.min(marker.slide, plan.length - 1))}
              >
                <RotateCcw className="h-4 w-4" />
                ادامه از اسلاید {toPersianDigits((marker.slide % plan.length) + 1)}
              </button>
            )}
          </div>
        </div>

        {/* آمار سریع */}
        <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-6 md:grid-cols-5">
          {[
            { v: '۲۰', l: 'اسلاید اصلی', Icon: Clock3 },
            { v: '۸', l: 'بخش رسمی', Icon: CircleHelp },
            { v: clockOf(totalTalk()), l: 'گفتار کامل', Icon: Timer },
            { v: clockOf(SAFETY_BUFFER), l: 'حاشیه امن', Icon: Timer },
            { v: practiceTarget(), l: 'هدف پایان گفتار', Icon: Target },
          ].map(({ v, l, Icon }) => (
            <div key={l} className="flex items-center gap-3 rounded-2xl bg-surface-2/70 px-4 py-3">
              <Icon className="h-5 w-5 shrink-0 text-pine" />
              <div className="min-w-0">
                <dt className="truncate text-[0.7rem] font-bold text-muted">{l}</dt>
                <dd className="truncate text-sm font-extrabold text-ink">{v}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* نقشه راه هشت‌بخشی */}
      <section aria-labelledby="roadmap-title">
        <SectionHead index={1} title="نقشه راه جلسه دفاع" subtitle="ساختار، ترتیب و زمان‌بندی هر بخش مطابق نسخه ۲" />
        <div className="mt-5 space-y-3">
          {chapterRows.map(({ ch, items, first, last }) => (
            <div key={ch.id} className="card p-5 transition-shadow hover:shadow-lift md:p-6">
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
                        {clockOf(items.reduce((s, p) => s + p.duration, 0))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-7 text-ink-soft">{ch.summary}</p>
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

              <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-line pt-4 sm:grid-cols-2">
                {items.map((p) => (
                  <li key={`${ch.id}-${p.index}`} className="flex items-baseline gap-2 text-[0.85rem] leading-6">
                    <span className="shrink-0 font-black text-muted">اسلاید {toPersianDigits(p.num)}</span>
                    <span className="min-w-0 flex-1 truncate font-bold text-ink">{p.title}</span>
                    <span className="shrink-0 text-xs text-muted" dir="ltr">
                      {slideWindow(p)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-dashed border-line-strong bg-surface-2/50 px-4 py-3 text-[0.82rem] leading-6 text-muted">
          <Target className="mt-1 h-4 w-4 shrink-0 text-ochre" />
          <span>
            اسلاید «وراثت جهت و رقابت سرزمینی» در چیدمان گسترده، به‌صورت اسلاید مستقل به مدت ۴۵ ثانیه
            پس از اسلاید ۱۰ اضافه می‌شود (مجموع گفتار به ۱۹:۴۵ می‌رسد). در چیدمان فشرده همانند نسخه ۲،
            همین نکته را کوتاه در اسلاید ۱۰ بیان می‌کنید و اسلاید مستقل به‌عنوان پشتیبان می‌ماند.
          </span>
        </p>
      </section>

      {/* پیام اصلی دفاع */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6 md:p-7">
          <SectionHead title="داستانی که داور باید بشنود" subtitle="پنج گزاره پس از بیست دقیقه" />
          <ul className="dot-list mt-4 space-y-3">
            {missionPoints.map((m, i) => (
              <li key={m} className="text-[0.95rem] leading-8 text-ink-soft">
                <span className="ml-2 font-black text-pine">{toPersianDigits(i + 1)}</span>
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-2xl bg-pine-soft/60 px-4 py-3 text-[0.9rem] leading-7 text-pine-deep">
            {successLine}
          </p>
        </div>

        <div className="space-y-6">
          <div className="card p-6 md:p-7">
            <SectionHead title="پنج عدد کلیدی" subtitle="ارقامی که با مکث گفته می‌شوند" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fiveNumbers.map((f) => (
                <div key={f.label} className="rounded-2xl border border-line bg-surface-2/60 p-3 text-center">
                  <div className="text-xl font-black text-pine">{f.n}</div>
                  <div className="mt-1 text-[0.72rem] font-bold leading-5 text-muted">{f.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 md:p-7">
            <SectionHead title="مرزهای ادعا" subtitle="جواب صریح به پرسش‌های دام‌دار" />
            <ul className="mt-4 space-y-2">
              {claimBoundaries.map((b) => (
                <li key={b.q} className="flex flex-wrap items-baseline gap-x-3 rounded-xl bg-surface-2/70 px-3.5 py-2.5">
                  <span className="font-extrabold text-ink">{b.q}</span>
                  <span className="text-sm font-bold text-clay">{b.a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 md:p-7">
            <SectionHead title="چه چیزی در ذهن داور می‌ماند؟" />
            <div className="mt-3 flex flex-wrap gap-2">
              {memoryTakeaways.map((t) => (
                <span key={t} className="chip chip-pine">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* برگه شروع دوباره */}
      {marker && (
        <section className="card flex flex-wrap items-center justify-between gap-4 border-ochre/30 bg-ochre-soft/40 p-5">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-ochre" />
            <p className="text-sm font-bold text-ink">
              آخرین تمرین شما در اسلاید {toPersianDigits((marker.slide % plan.length) + 1)} با{' '}
              {clockOf(marker.totalSeconds)} از زمان گفتار متوقف شد.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => removeStore('session:last')}
            >
              پاک‌کردن جایگاه
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => app.go('practice', Math.min(marker.slide, plan.length - 1))}
            >
              <Play className="h-4 w-4" />
              ادامه تمرین
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
