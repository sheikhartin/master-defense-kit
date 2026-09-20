/**
 * جلسه تمرینی: شبیه‌سازی زمان‌دار ارائه با توقف هم‌زمان هر دو تایمر،
 * هشدار نرم پایان زمان، شروع از هر اسلاید، ادامه از آخرین جایگاه،
 * یادداشت شخصی و هایلایت نکته‌ها و پشتیبانی کامل صفحه‌کلید.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flag,
  Keyboard,
  Lightbulb,
  Maximize2,
  MessageCircleQuestion,
  Pause,
  Play,
  RotateCcw,
  Star,
  Target,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { chapters } from '../data/deck';
import { planSlides, practiceWindow, totalSession, totalTalk } from '../lib/session';
import { useApp, rememberSession } from '../lib/app-context';
import {
  digitFromCode,
  isEditableTarget,
  isInteractiveTarget,
  snapshot,
} from '../lib/keys';
import { overlaysOpen } from '../lib/ui-bus';
import { readStore, removeStore, useStoredState, writeStore } from '../lib/storage';
import { formatClock, toPersianDigits } from '../lib/persian';
import { TeX } from '../lib/tex';
import { cueRemaining, ensureAudio, playThresholdCue } from '../lib/audio';
import {
  coachNoteHlKey,
  slideHlKey,
  slideNoteKey,
  speechHlKey,
} from '../lib/content-keys';
import { MarkButton, NoteBox, Tag, TimeRange } from '../components/ui';

export default function PracticeLab() {
  const app = useApp();
  const plan = useMemo(() => planSlides(), []);
  const talkTotal = useMemo(() => totalTalk(), []);

  /* وضعیت تایمر: یک منبع حقیقت واحد */
  const timer = useRef({ total: 0, slide: 0 });
  const [, setVer] = useState(0);
  const bump = useCallback(() => setVer((v) => v + 1), []);

  const [current, setCurrent] = useState(0);
  const [running, setRunning] = useState(false);
  const prevRem = useRef<number | null>(null);
  const runningRef = useRef(false);
  const audibleRef = useRef(app.audible);
  const currentRef = useRef(0);
  const planRef = useRef(plan);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    audibleRef.current = app.audible;
  }, [app.audible]);
  useEffect(() => {
    currentRef.current = current;
    prevRem.current = null;
  }, [current]);
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  /* شروع از اسلاید درخواستی (از نقشه راه) */
  useEffect(() => {
    if (!app.pendingStart) return;
    const idx = Math.max(0, Math.min(app.pendingStart.slide, plan.length - 1));
    app.consumeStart();
    timer.current = { total: Math.max(0, plan[idx]?.start ?? 0), slide: 0 };
    setCurrent(idx);
    setRunning(false);
    prevRem.current = null;
    if (idx === 0) removeStore('session:last');
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.pendingStart]);

  /* ادامه از آخرین جایگاه ذخیره‌شده */
  useEffect(() => {
    if (app.pendingStart) return;
    const m = readStore<{
      slide: number;
      total?: number;
      totalSeconds?: number;
      slideSeconds: number;
      running: boolean;
    } | null>('session:last', null);
    if (!m) return;
    const clamped = Math.max(0, Math.min(m.slide ?? 0, plan.length - 1));
    timer.current = {
      total: m.totalSeconds ?? m.total ?? 0,
      slide: m.slideSeconds ?? 0,
    };
    setCurrent(clamped);
    setRunning(false);
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* تیک تایمر + هشدار صوتی لبه (۱۰ / ۵ / ۰) داخل همان حلقه */
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const d = (now - last) / 1000;
      last = now;
      timer.current.total += d;
      timer.current.slide += d;

      const slide = planRef.current[currentRef.current];
      if (slide && audibleRef.current && runningRef.current) {
        const rem = Math.ceil(slide.duration - timer.current.slide);
        prevRem.current = cueRemaining(prevRem.current, rem, playThresholdCue);
      }

      bump();
    }, 200);
    return () => window.clearInterval(id);
  }, [running, bump]);

  /* ذخیره جایگاه برای ادامه بعدی */
  useEffect(() => {
    if (running) {
      const id = window.setInterval(() => saveMarker(), 4000);
      return () => window.clearInterval(id);
    }
    saveMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, current]);

  const saveMarker = () => {
    rememberSession({
      slide: current,
      totalSeconds: Math.floor(timer.current.total),
      slideSeconds: Math.floor(timer.current.slide),
      running,
      stamp: Date.now(),
    });
  };

  const slide = plan[current];
  const totalSec = timer.current.total;
  const slideSec = timer.current.slide;
  const remaining = Math.max(0, slide.duration - slideSec);
  const overrun = slideSec > slide.duration ? slideSec - slide.duration : 0;

  const stage: 'ok' | 'warn' | 'end' =
    slideSec >= slide.duration ? 'end' : remaining <= 20 ? 'warn' : 'ok';

  const startFrom = (i: number) => {
    if (running) setRunning(false);
    timer.current = { total: plan[i].start, slide: 0 };
    setCurrent(i);
    prevRem.current = null;
    saveMarker();
    bump();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSession = () => {
    if (running) setRunning(false);
    timer.current = { total: plan[0].start, slide: 0 };
    setCurrent(0);
    prevRem.current = null;
    removeStore('session:last');
    bump();
  };

  const toggleRun = () => {
    const next = !running;
    if (next && app.audible) ensureAudio();
    if (next) prevRem.current = Math.ceil(slide.duration - timer.current.slide);
    setRunning(next);
    if (!next) saveMarker();
  };

  const resetSlideTimer = () => {
    timer.current.slide = 0;
    prevRem.current = null;
    bump();
  };

  const go = (dir: 1 | -1) => {
    const target = current + dir;
    if (target < 0 || target >= plan.length) return;
    startFrom(target);
  };

  const jumpTo = (n: number) => {
    const target = n - 1;
    if (target >= 0 && target < plan.length) startFrom(target);
  };

  const act = useRef({
    next: (d: 1 | -1) => go(d),
    prev: (d: 1 | -1) => go(d),
    first: () => startFrom(0),
    last: () => startFrom(plan.length - 1),
    toggleRun,
    resetSlide: resetSlideTimer,
    resetAll: resetSession,
    jump: jumpTo,
    enabled: app.shortcutsOn,
  });
  useEffect(() => {
    act.current = {
      next: (d: 1 | -1) => go(d),
      prev: (d: 1 | -1) => go(d),
      first: () => startFrom(0),
      last: () => startFrom(plan.length - 1),
      toggleRun,
      resetSlide: resetSlideTimer,
      resetAll: resetSession,
      jump: jumpTo,
      enabled: app.shortcutsOn,
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlaysOpen() || isEditableTarget(e)) return;
      const a = act.current;
      const k = snapshot(e);
      if (k.ctrl || k.meta || k.alt) return;

      const clearFocus = () => {
        const el = document.activeElement;
        if (el instanceof HTMLElement) el.blur();
      };

      if (k.code === 'ArrowLeft' || k.code === 'PageDown') {
        e.preventDefault();
        a.next(1);
        clearFocus();
        return;
      }
      if (k.code === 'ArrowRight' || k.code === 'PageUp') {
        e.preventDefault();
        a.prev(-1);
        clearFocus();
        return;
      }
      if (k.code === 'Home') {
        e.preventDefault();
        a.first();
        clearFocus();
        return;
      }
      if (k.code === 'End') {
        e.preventDefault();
        a.last();
        clearFocus();
        return;
      }

      if (!a.enabled || k.repeat) return;

      if (k.code === 'Space') {
        if (isInteractiveTarget(e)) return;
        e.preventDefault();
        a.toggleRun();
        return;
      }
      if (k.code === 'KeyP') {
        e.preventDefault();
        a.toggleRun();
        return;
      }
      if (k.code === 'KeyR') {
        if (k.shift) a.resetAll();
        else a.resetSlide();
        return;
      }
      const n = digitFromCode(k.code, k.shift);
      if (n !== null) {
        e.preventDefault();
        a.jump(n);
        clearFocus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ch = chapters.find((c) => c.id === slide.chapterId) ?? { num: 'شروع', title: 'شروع جلسه' };
  const sessionTotal = totalSession();
  const targetWindow = practiceWindow();
  const slideKey = slide.id;
  const shownNumber = current + 1;
  const legacyNum = String(slide.num);

  return (
    <div className="space-y-5 md:space-y-6">
      {/* نوار وضعیت و تایمر */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Tag tone="pine">
              بخش {ch.num} · {ch.title}
            </Tag>
            <h2 className="min-w-0 text-base font-extrabold text-ink md:text-lg">{slide.title}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" className="icon-btn" title="راهنمای کلیدها (H)" onClick={() => app.setGuideOpen(true)}>
              <Keyboard className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className={`icon-btn ${app.focus ? 'bg-pine-soft text-pine-deep' : ''}`}
              title="حالت تمرکز (F)"
              onClick={() => app.setFocus(!app.focus)}
            >
              <Maximize2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className="icon-btn"
              title="هشدار صوتی (M)"
              onClick={() => {
                const next = !app.audible;
                if (next) ensureAudio();
                app.setAudible(next);
              }}
            >
              {app.audible ? <Volume2 className="h-4.5 w-4.5 text-pine" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
          <div className="min-w-0 bg-surface px-5 py-5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Timer className="h-3.5 w-3.5" />
              زمان کل ارائه
              <span className="font-normal text-muted/70">(ثانیه:دقیقه)</span>
            </p>
            <p className="mt-1.5 text-3xl font-black tracking-tight text-ink">
              <span className="timer-num">{formatClock(totalSec)}</span>
              <span className="mr-2 text-sm font-bold text-muted">از {formatClock(talkTotal)}</span>
            </p>
            <p className="mt-1.5 text-xs font-bold text-pine">
              مانده تا پایان گفتار: <span className="timer-num">{formatClock(Math.max(0, talkTotal - totalSec))}</span>
            </p>
          </div>

          <div className="min-w-0 bg-surface px-5 py-5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Flag className="h-3.5 w-3.5" />
              زمان این اسلاید
              <span className="font-normal text-muted/70">(ثانیه:دقیقه)</span>
            </p>
            <p className="mt-1.5 text-3xl font-black tracking-tight text-ink">
              <span className="timer-num">{formatClock(slideSec)}</span>
              <span className="mr-2 text-sm font-bold text-muted">از {formatClock(slide.duration)}</span>
            </p>
            <p className="mt-1.5 text-xs font-bold text-muted">
              پنجره برنامه‌ریزی: <TimeRange from={slide.start} to={slide.end} />
            </p>
          </div>

          <div className={`min-w-0 bg-surface px-5 py-5 transition-colors duration-700 ${stage === 'end' ? 'bg-clay-soft/50' : ''}`}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Lightbulb className="h-3.5 w-3.5" />
              وضعیت زمان
            </p>
            <p className="mt-1.5 text-3xl font-black tracking-tight">
              <span key={stage} className="swap-fade">
                {stage === 'ok' && <span className="text-pine">آرام پیش می‌روی</span>}
                {stage === 'warn' && (
                  <span className="flex items-center gap-2 text-ochre">
                    <span className="inline-block h-2 w-2 rounded-full bg-ochre" aria-hidden="true" />
                    {remaining <= 10 ? 'پایان نزدیک است' : 'کمی سرعت بگیر'}
                  </span>
                )}
                {stage === 'end' && <span className="text-clay">زمان اسلاید تمام شد</span>}
              </span>
            </p>
            <p className="mt-1.5 text-xs font-bold text-muted">
              {stage !== 'end' && (
                <>
                  باقی‌مانده: <span className="timer-num">{formatClock(remaining)}</span>
                </>
              )}
              {stage === 'end' && (
                <>
                  عبور از زمان: <span className="timer-num text-clay">{formatClock(overrun)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => go(-1)} title="اسلاید قبلی">
              <ChevronRight className="h-4 w-4" />
              قبلی
            </button>
            <button
              type="button"
              className={`btn btn-sm ${running ? 'btn-ghost' : 'btn-primary'}`}
              onClick={toggleRun}
              aria-pressed={running}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'توقف' : 'شروع / ادامه'}
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => go(1)} title="اسلاید بعدی">
              بعدی
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
            <button type="button" className="btn btn-quiet btn-sm" onClick={resetSlideTimer} title="شروع دوباره تایمر این اسلاید (R)">
              <RotateCcw className="h-3.5 w-3.5" />
              تایمر اسلاید
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={resetSession} title="جلسه از اول (Shift+R)">
              <RotateCcw className="h-3.5 w-3.5" />
              جلسه از اول
            </button>
          </div>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-bold text-muted">
            <span>
              اسلاید <span className="text-ink">{toPersianDigits(current + 1)}</span> از {toPersianDigits(plan.length)}
            </span>
            <span className="text-line-strong">·</span>
            <span className="flex items-center gap-x-1.5">
              هدف پایان:
              <TimeRange from={targetWindow.from} to={targetWindow.to} />
            </span>
          </p>
        </div>
      </section>

      {/* نوار پیشرفت کل جلسه */}
      <section className="card px-5 py-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-muted">
          <span>پیشرفت کل جلسه</span>
          <span className="flex items-center gap-x-1.5">
            <span className="timer-num">{formatClock(Math.min(totalSec, sessionTotal))}</span>
            <span>از</span>
            <span className="timer-num">{formatClock(sessionTotal)}</span>
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={Math.round(Math.min(100, (totalSec / sessionTotal) * 100))}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-fill" style={{ width: `${Math.min(100, (totalSec / sessionTotal) * 100)}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.7rem] font-bold text-muted">
          <span>شروع</span>
          <span>پایان گفتار {formatClock(talkTotal)}</span>
          <span>حداکثر {formatClock(sessionTotal)}</span>
        </div>
      </section>

      {/* ناوبری سریع اسلایدها (بدون متن آموزشی دائمی) */}
      <section className="card focus-hidden px-4 py-4 sm:px-5" aria-label="ناوبری اسلایدها">
        <p className="mb-2.5 text-[0.7rem] font-bold text-muted">اسلایدها</p>
        <div className="hbar flex min-w-0 gap-1.5 overflow-x-auto px-0.5 pb-1.5 pt-0.5">
          {plan.map((p, i) => (
            <button
              key={p.id}
              type="button"
              title={p.title}
              className={`slide-dot ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}
              onClick={() => startFrom(i)}
            >
              {toPersianDigits(i + 1)}
            </button>
          ))}
        </div>
      </section>

      {/* کارت اسلاید */}
      <article className="card overflow-hidden">
        <div key={slideKey} className="slide-enter">
          <div className="border-b border-line px-6 py-5 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-muted">
                  اسلاید {toPersianDigits(shownNumber)} از {toPersianDigits(plan.length)}
                  {slide.estimatedTime ? (
                    <span className="mr-2 text-muted/80" dir="ltr">
                      · {slide.estimatedTime}
                    </span>
                  ) : null}
                </p>
                <h3 className="mt-1 text-xl font-black text-ink md:text-2xl">{slide.title}</h3>
              </div>
              <MarkButton storageKey={slideHlKey(slide.id)} label="اسلاید مهم" />
            </div>

            {slide.goal && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-pine-wash px-3.5 py-2.5 text-[0.88em] leading-[var(--reading-lh)] text-pine-deep">
                <Target className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <b className="font-extrabold">هدف اسلاید: </b>
                  {slide.goal}
                </span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-7 px-6 py-6 md:px-8">
              {slide.tex.length > 0 && (
                <div className="rounded-xl border border-line bg-surface-2/70 p-2">
                  {slide.tex.map((f, i) => (
                    <figure key={i} className="px-2 py-2 text-center">
                      <TeX tex={f.tex} display />
                      {f.caption && (
                        <figcaption className="mt-1 text-center text-xs font-bold text-muted">{f.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {slide.visual.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                    <BookOpen className="h-4 w-4 text-pine" />
                    آنچه روی اسلاید است
                  </h4>
                  <ul className="dot-list">
                    {slide.visual.map((v, i) => (
                      <li key={i} className="text-[0.95em] leading-[var(--reading-lh)] text-ink-soft">
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                  <MessageCircleQuestion className="h-4 w-4 text-pine" />
                  متن گفتار
                </h4>
                <div className="space-y-3">
                  {slide.speech.map((para, i) => (
                    <SpeechLine
                      key={i}
                      para={para}
                      hlKey={speechHlKey(slide.id, i)}
                      legacyKeys={[`speech-hl:${legacyNum}-${i}`, `speech-hl:opt-${i}`]}
                    />
                  ))}
                </div>
              </div>

              {slide.phrase && (
                <blockquote className="hl-block rounded-xl px-5 py-4 text-[1.05em] font-extrabold leading-[var(--reading-lh)] text-ink">
                  {slide.phrase}
                </blockquote>
              )}

              {slide.transition && (
                <p className="rounded-xl border border-dashed border-line-strong bg-surface-2/50 px-4 py-3 text-[0.92em] leading-[var(--reading-lh)] text-ink-soft">
                  <b className="font-extrabold text-muted">جمله انتقال: </b>
                  {slide.transition}
                </p>
              )}
            </div>

            <aside className="min-w-0 space-y-5 border-t border-line bg-surface-2/40 px-6 py-6 lg:border-r lg:border-t-0">
              {slide.notes.length > 0 && (
                <div>
                  <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                    <Lightbulb className="h-4 w-4 text-ochre" />
                    یادداشت اجرا
                  </h4>
                  <ul className="space-y-2.5">
                    {slide.notes.map((n, i) => (
                      <CoachNoteRow key={i} text={n} storageKey={coachNoteHlKey(slide.id, i)} />
                    ))}
                  </ul>
                </div>
              )}
              <NoteBox
                storageKey={slideNoteKey(slide.id)}
                legacyKeys={[`slide-note:${legacyNum}`, 'slide-note:opt']}
              />
              <p className="rounded-xl bg-surface px-3.5 py-2.5 text-[0.72rem] leading-6 text-muted">
                یادداشت‌ها و هایلایت‌ها فقط در همین دستگاه ذخیره می‌شوند.
              </p>
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}

/* ---------- اجزای داخلی ---------- */

function SpeechLine({
  para,
  hlKey,
  legacyKeys,
}: {
  para: string;
  hlKey: string;
  legacyKeys: string[];
}) {
  const [on, setOn] = useState<boolean>(() => {
    const cur = readStore<boolean | null>(hlKey, null);
    if (cur !== null) return !!cur;
    for (const k of legacyKeys) {
      const v = readStore<boolean | null>(k, null);
      if (v !== null) {
        writeStore(hlKey, !!v);
        return !!v;
      }
    }
    return false;
  });

  return (
    <div className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 transition-colors ${on ? 'hl-block' : ''}`}>
      <p className="min-w-0 flex-1 text-[1.02em] leading-[var(--reading-lh)] text-ink">{para}</p>
      <button
        type="button"
        className={`note-marker mt-1 shrink-0 ${on ? 'text-ochre' : ''}`}
        aria-pressed={on}
        title={on ? 'حذف هایلایت' : 'هایلایت این پاراگراف'}
        onClick={() => {
          const next = !on;
          setOn(next);
          writeStore(hlKey, next);
        }}
      >
        <Star className={`h-4 w-4 ${on ? 'fill-ochre' : ''}`} />
      </button>
    </div>
  );
}

function CoachNoteRow({ text, storageKey }: { text: string; storageKey: string }) {
  const [on, setOn] = useStoredState<boolean>(storageKey, false);
  return (
    <li
      className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[0.85em] leading-[var(--reading-lh)] text-ink-soft ${
        on ? 'hl-block' : 'border border-line bg-surface'
      }`}
    >
      <span className="min-w-0 flex-1">{text}</span>
      <button
        type="button"
        className={`note-marker mt-0.5 shrink-0 ${on ? 'text-ochre' : ''}`}
        aria-pressed={on}
        title={on ? 'حذف علامت مهم' : 'علامت مهم'}
        onClick={() => setOn(!on)}
      >
        <Star className={`h-3.5 w-3.5 ${on ? 'fill-ochre' : ''}`} />
      </button>
    </li>
  );
}
