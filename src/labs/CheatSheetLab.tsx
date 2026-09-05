/**
 * برگه تقلب: روابط ریاضی کامل، سه مفهوم پرکاربرد روز دفاع، ارقام و مرزهای ادعا.
 * همه فرمول‌ها از کش پیش‌رندر می‌آیند و باز شدن این بخش هیچ تأخیری ندارد.
 */

import { BookOpen, Printer, ScrollText, ShieldCheck, Sigma } from 'lucide-react';
import { coreEquations, conceptCards, keyFacts, reliabilityRows, ablationRows, parameterRows, effectSizeRows } from '../data/cheat';
import { useApp } from '../lib/app-context';
import { TeX } from '../lib/tex';
import { MarkButton, NoteBox, SectionHead, Tag } from '../components/ui';
import { toPersianDigits } from '../lib/persian';
import type { ConceptCard, Equation } from '../types';

export default function CheatSheetLab() {
  const app = useApp();

  return (
    <div className="stagger space-y-12">
      {/* سربرگ */}
      <section className="card relative overflow-hidden p-7 md:p-9">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-ochre-soft/60 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">
              <ScrollText className="h-3.5 w-3.5" />
              مرجع شب دفاع
            </span>
            <h2 className="mt-3 text-2xl font-black leading-10 text-ink md:text-3xl">
              برگه تقلب و فرمول‌های کلیدی
            </h2>
            <p className="mt-2 max-w-2xl text-[1em] leading-[var(--reading-lh)] text-ink-soft">
              همه روابط دقیقاً مطابق پایان‌نامه و مقاله BCOA نوشته شده‌اند؛ زیر هر فرمول،
              توضیح فارسی نمادها و راهنمای گفتن آن بدون روخوانی آمده است.
            </p>
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={() => app.openPrint('cheat')}>
            <Printer className="h-4 w-4" />
            نسخه چاپی / PDF
          </button>
        </div>
      </section>

      {/* روابط ریاضی */}
      <section>
        <SectionHead
          index={1}
          title="روابط ریاضی اصلی"
          subtitle="هر رابطه با تشریح پارامترها و جمله‌های گفتاری پیشنهادی"
        />
        <div className="mt-5 space-y-5">
          {coreEquations.map((eq, i) => (
            <EquationCard key={eq.id} eq={eq} n={i + 1} />
          ))}
        </div>
      </section>

      {/* سه مفهوم پرکاربرد */}
      <section>
        <SectionHead
          index={2}
          title="سه مفهوم پرکاربرد در روز دفاع"
          subtitle="فریدمن، ویلکاکسون و نگاشت متغیرهای گسسته؛ تسلط سی‌ثانیه‌ای برای پاسخ مقتدرانه"
        />
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {conceptCards.map((c) => (
            <ConceptCardView key={c.id} card={c} />
          ))}
        </div>
      </section>

      {/* ارقام و مرزها */}
      <section>
        <SectionHead index={3} title="ارقام و مرزهای ادعا" subtitle="فقط همین اعداد را با مکث بگو؛ فراتر از آن نرو" />
        <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {keyFacts.map((f) => (
            <div
              key={f.label}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                f.kind === 'bound' ? 'border-clay/25 bg-clay-soft/40' : 'border-line bg-surface-2/50'
              }`}
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.kind === 'bound' ? 'bg-clay' : 'bg-pine'}`} />
              <div className="min-w-0">
                <p className="text-[0.72rem] font-extrabold text-muted">{f.label}</p>
                <p className="text-[0.92rem] font-bold leading-7 text-ink">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* جدول‌های پشتیبان */}
      <section>
        <SectionHead index={4} title="جدول‌های پشتیبان برای پرسش‌های دقیق" subtitle="این ارقام برای پرسش‌های ریز داوران است؛ نه برای اسلاید اصلی" />
        {/* گرید جدول‌ها: ترکِ تک‌ستونه صریح (grid-cols-1) تا در صفحه‌های باریک
            چیدمان بر اساس min-content محتوا منفجر نشود و هر کارت با min-w-0
            بتواند کوچک‌تر از عریض‌ترین محتوایش شود. */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card min-w-0 p-6">
            <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-ink">
              <ShieldCheck className="h-5 w-5 text-pine" />
              نرخ موفقیت هفت مسئله (۳۰ اجرا)
            </h3>
            <div className="table-wrap">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>مسئله</th>
                    <th>نرخ</th>
                    <th>معادل اجرا</th>
                  </tr>
                </thead>
                <tbody>
                  {reliabilityRows.map((r) => (
                    <tr key={r.problem}>
                      <td className="font-bold">{r.problem}</td>
                      <td className="text-pine-deep">{r.rate}</td>
                      <td className="text-muted">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card min-w-0 p-6">
            <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-ink">
              <Sigma className="h-5 w-5 text-pine" />
              تحلیل حذف مؤلفه‌ها (میانگین رتبه)
            </h3>
            <div className="table-wrap">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>نسخه</th>
                    <th>رتبه</th>
                    <th>نکته</th>
                  </tr>
                </thead>
                <tbody>
                  {ablationRows.map((r) => (
                    <tr key={r.version}>
                      <td className="font-bold">{r.version}</td>
                      <td className="text-ink">{r.rank}</td>
                      <td className="text-muted">{r.note ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mb-3 mt-6 flex items-center gap-2 text-base font-extrabold text-ink">
              پارامترهای گزارش‌شده مقاله
            </h3>
            <div className="flex flex-wrap gap-2">
              {parameterRows.map((p) => (
                <span key={p.sym} className="chip chip-pine chip-wrap">
                  <TeX tex={p.sym} />
                  <span>{p.value}</span>
                  <span className="font-normal text-pine-deep/80">{p.role}</span>
                </span>
              ))}
            </div>

            <h3 className="mb-3 mt-6 text-base font-extrabold text-ink">اندازه اثر وارا و دلینی (پشتیبان)</h3>
            <div className="hbar flex min-w-0 gap-2 pb-2">
              {effectSizeRows.map((r) => (
                <span key={r.rival} className="chip chip-mute shrink-0">
                  {r.rival} <b>{r.value}</b> <span className="font-normal">{r.level}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* کارت رابطه                                                           */
/* ------------------------------------------------------------------ */

function EquationCard({ eq, n }: { eq: Equation; n: number }) {
  return (
    <article className="card overflow-hidden" id={`eq-${eq.id}`}>
      <div className="px-6 pb-5 pt-6 md:px-8">
        {/* سربرگ کارت: عنوان فارسی و برچسب انگلیسی در جای درست خودش */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-pine/20 bg-pine-soft text-sm font-black text-pine-deep">
              {toPersianDigits(n)}
            </span>
            <h3 className="min-w-0 text-lg font-extrabold leading-8 text-ink">{eq.title}</h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Tag tone="mute">{eq.ref}</Tag>
            <span dir="ltr" className="text-left text-[0.72rem] font-semibold text-muted">
              {eq.en}
            </span>
          </div>
        </div>

        {/* فرمول */}
        <div className="mt-4 rounded-2xl border border-line bg-surface-2/60">
          <TeX tex={eq.tex} display className="text-ink" />
        </div>

        {/* مفهوم و راهنمای گفتن */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <p className="rounded-2xl bg-pine-wash px-5 py-4 text-[0.98em] leading-[var(--reading-lh)] text-pine-deep">
            <b className="mb-1 block text-sm font-extrabold">معنی رابطه</b>
            {eq.meaning}
          </p>
          <div className="rounded-2xl border-r-4 border-ochre bg-ochre-soft/50 px-5 py-4">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-extrabold text-ochre">
              <BookOpen className="h-4 w-4" />
              چطور به فارسی بگوییم
            </p>
            <p className="text-[0.98em] leading-[var(--reading-lh)] text-ink-soft">{eq.verbal}</p>
          </div>
        </div>

        {/* تشریح نمادها */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-extrabold text-muted">تشریح نمادهای رابطه</p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {eq.params.map((p, i) => (
              <div key={`${eq.id}-${i}`} className="rounded-xl border border-line bg-surface-2/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg border border-line bg-surface px-2 py-0.5">
                    <TeX tex={p.sym} />
                  </span>
                  <span className="text-xs font-extrabold text-ink">{p.name}</span>
                </div>
                <p className="mt-1.5 text-[0.78rem] leading-6 text-ink-soft">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* یادداشت شخصی و هایلایت */}
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-2">
            <MarkButton storageKey={`eq-hl:${eq.id}`} label="این رابطه مهم است" />
          </div>
          <div className="min-w-0 flex-1">
            <NoteBox storageKey={`eq-note:${eq.id}`} compact />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* کارت مفهوم سه‌گانه: برچسب فارسی همیشه در جای درست و کامل نمایش داده می‌شود */
/* ------------------------------------------------------------------ */

function ConceptCardView({ card }: { card: ConceptCard }) {
  return (
    <article className="card flex flex-col p-6">
      <div className="mb-4 flex flex-col items-start gap-2">
        <Tag tone={card.tone}>{card.label}</Tag>
        <span dir="ltr" className="text-left text-[0.7rem] font-semibold text-muted">
          {card.en}
        </span>
      </div>
      <h3 className="mb-2 text-base font-extrabold text-ink">{card.heading}</h3>
      <ul className="dot-list space-y-2">
        {card.body.map((b) => (
          <li key={b} className="text-[0.85rem] leading-7 text-ink-soft">
            {b}
          </li>
        ))}
      </ul>
    </article>
  );
}
