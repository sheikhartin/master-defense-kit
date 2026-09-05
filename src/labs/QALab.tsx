/**
 * پرسش‌های داور: بانک پرسش با پاسخ‌های پیشنهادی، فیلتر دسته‌بندی،
 * شبیه‌ساز پرسش تصادفی و یادداشت شخصی برای هر پرسش.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Lightbulb, MessageCircleQuestion, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../lib/app-context';
import { isEditableTarget, isInteractiveTarget, snapshot } from '../lib/keys';
import { overlaysOpen } from '../lib/ui-bus';
import { qaMain, qaHard, qaDrill, qaCategories } from '../data/qa';
import { answerPattern, outOfScopeSteps } from '../data/roadmap';
import { MarkButton, NoteBox, SectionHead, Tag } from '../components/ui';
import type { QaCategory, QaItem } from '../types';

export default function QALab() {
  const [cat, setCat] = useState<QaCategory | 'همه'>('همه');

  const mainList = useMemo(
    () => (cat === 'همه' ? qaMain : qaMain.filter((q) => q.category === cat)),
    [cat],
  );
  const hardList = useMemo(
    () => (cat === 'همه' ? qaHard : qaHard.filter((q) => q.category === cat)),
    [cat],
  );

  return (
    <div className="stagger space-y-12">
      {/* سربرگ */}
      <section className="card p-7 md:p-9">
        <span className="eyebrow">
          <MessageCircleQuestion className="h-3.5 w-3.5" />
          بانک پرسش‌های داور
        </span>
        <h2 className="mt-3 text-2xl font-black leading-10 text-ink md:text-3xl">
          پرسش‌های احتمالی و پاسخ‌های پیشنهادی
        </h2>
        <p className="mt-2 max-w-3xl text-[1em] leading-[var(--reading-lh)] text-ink-soft">
          همه پرسش‌ها و پاسخ‌ها از سناریوی نهایی نسخه ۲ استخراج شده‌اند. اول خودت پاسخ بده،
          بعد پاسخ پیشنهادی را باز کن و آن را با ساختار «ادعا، دلیل، شاهد» مقایسه کن.
        </p>

        {/* ساختار پاسخ و پرسش خارج از پایان‌نامه (ترک تک‌ستونه صریح برای پایداری) */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border-r-4 border-pine bg-pine-wash px-5 py-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-pine-deep">
              <Sparkles className="h-4 w-4" />
              {answerPattern.title}
            </h3>
            <p className="text-[0.95em] leading-[var(--reading-lh)] text-pine-deep">{answerPattern.example}</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-line bg-surface-2/50 px-5 py-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
              <ShieldCheck className="h-4 w-4 text-ochre" />
              سؤال خارج از پایان‌نامه
            </h3>
            <ul className="space-y-1.5">
              {outOfScopeSteps.map((s) => (
                <li key={s} className="text-[0.85rem] leading-7 text-ink-soft">{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* شبیه‌ساز پرسش تصادفی */}
      <DrillZone />

      {/* فیلتر دسته‌بندی */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-muted">فیلتر دسته:</span>
          {(['همه', ...qaCategories] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`chip transition-colors ${cat === c ? 'chip-pine' : 'chip-mute hover:border-line-strong'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* پرسش‌های اصلی */}
      <section>
        <SectionHead index={1} title="پرسش‌های اصلی داور" subtitle="به ترتیب سناریو، هفده پرسش پرتکرار" />
        <div key={`main-${cat}`} className="fade-up mt-5 space-y-4">
          {mainList.map((q) => (
            <QaCard key={q.id} item={q} />
          ))}
        </div>
      </section>

      {/* پرسش‌های سخت‌تر */}
      {hardList.length > 0 && (
        <section>
          <SectionHead index={2} title="پرسش‌های سخت‌تر و دفاعی‌تر" subtitle="برای روزهایی که آمادگی کامل می‌خواهی" />
          <div className="mt-5 space-y-4">
            {hardList.map((q) => (
              <QaCard key={q.id} item={q} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function QaCard({ item }: { item: QaItem }) {
  const [open, setOpen] = useState(false);
  const tone: QaItem['category'] = item.category;

  return (
    <article className="card overflow-hidden">
      <div className="px-6 py-5 md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Tag tone="ochre">{tone}</Tag>
              <span className="text-[0.7rem] font-bold text-muted">پرسش {toFa(item.id)}</span>
            </div>
            <h3 className="text-[1em] font-extrabold leading-[var(--reading-lh)] text-ink md:text-[1.1em]">{item.question}</h3>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${open ? 'btn-ghost' : 'btn-soft'}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? 'بستن پاسخ' : 'نمایش پاسخ پیشنهادی'}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {open && (
          <div className="fade-up mt-4 space-y-3 border-t border-line pt-4">
            <p className="rounded-2xl bg-surface-2/70 px-5 py-4 text-[1em] leading-[var(--reading-lh)] text-ink">
              {item.answer}
            </p>
            {item.keySentence && (
              <p className="hl-mark rounded-xl px-4 py-2.5 text-sm font-extrabold leading-7 text-ink">
                جمله کلیدی: {item.keySentence}
              </p>
            )}
            {item.tip && (
              <p className="flex items-start gap-2 rounded-xl bg-ochre-soft/50 px-4 py-3 text-[0.85rem] leading-7 text-ink-soft">
                <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-ochre" />
                {item.tip}
              </p>
            )}
            <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-start">
              <MarkButton storageKey={`qa-hl:${item.id}`} label="برای روز دفاع مهم است" />
              <div className="min-w-0 flex-1">
                <NoteBox storageKey={`qa-note:${item.id}`} compact />
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function toFa(id: number): string {
  return String(id).replace(/[0-9]/g, (w) => '۰۱۲۳۴۵۶۷۸۹'[Number(w)]);
}

/* ------------------------------------------------------------------ */

function DrillZone() {
  const pool = useMemo(
    () =>
      qaDrill.map((d, i) => ({ ...d, uid: `drill-${i}` })).concat(
        qaHard.map((h, i) => ({
          role: 'داور سخت‌گیر',
          category: h.category,
          q: h.question,
          a: h.answer,
          uid: `hard-${i}`,
        })),
      ),
    [],
  );
  const app = useApp();
  const [stack, setStack] = useState<typeof pool>(() => [...pool].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = stack[idx];

  const next = () => {
    if (stack.length === 0) return;
    setIdx((i) => (i + 1) % stack.length);
    setRevealed(false);
  };

  const reshuffle = () => {
    setStack([...pool].sort(() => Math.random() - 0.5));
    setIdx(0);
    setRevealed(false);
  };

  /* میان‌برهای شبیه‌ساز: N پرسش بعدی، Enter پاسخ، R چینش تازه */
  const kb = useRef({ next, reshuffle, setRevealed, enabled: app.shortcutsOn });
  useEffect(() => {
    kb.current = { next, reshuffle, setRevealed, enabled: app.shortcutsOn };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlaysOpen() || isEditableTarget(e)) return;
      const h = kb.current;
      const k = snapshot(e);
      if (k.ctrl || k.meta || k.alt || k.repeat) return;
      if (!h.enabled) return;
      if (k.code === 'KeyN') { e.preventDefault(); h.next(); return; }
      if (k.code === 'KeyR') { e.preventDefault(); h.reshuffle(); return; }
      if (k.code === 'Enter') {
        if (isInteractiveTarget(e)) return;
        h.setRevealed((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
          <RefreshCw className="h-4.5 w-4.5 text-pine" />
          شبیه‌ساز پرسش تصادفی
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted">
            پرسش {toFa(((idx % stack.length) + 1))} از {toFa(stack.length)}
          </span>
          <button type="button" className="btn btn-quiet btn-sm" onClick={reshuffle}>
            <RefreshCw className="h-3.5 w-3.5" />
            چینش تازه
          </button>
        </div>
      </div>

      {stack.length > 0 && current && (
        <div className="px-6 py-6 md:px-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Tag tone="pine">{current.role}</Tag>
            <Tag tone="ochre">{current.category}</Tag>
          </div>
          <h4 className="text-[1.1em] font-extrabold leading-[var(--reading-lh)] text-ink">{current.q}</h4>

          {revealed ? (
            <div className="fade-up mt-4">
              <p className="rounded-2xl bg-pine-wash px-5 py-4 text-[1em] leading-[var(--reading-lh)] text-pine-deep">
                {current.a}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-soft btn-sm" onClick={next}>
                  پرسش بعدی
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRevealed(false)}>
                  دوباره پاسخ بده
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted">اول با صدای بلند پاسخ بده؛ سپس پاسخ پیشنهادی را ببین.</p>
              <button type="button" className="btn btn-primary mt-3" onClick={() => setRevealed(true)}>
                <Sparkles className="h-4 w-4" />
                نمایش پاسخ پیشنهادی
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
