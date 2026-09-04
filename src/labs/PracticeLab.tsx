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
import { readStore, removeStore, useStoredState } from '../lib/storage';
import { formatClock, toPersianDigits } from '../lib/persian';
import { TeX } from '../lib/tex';
import { MarkButton, NoteBox, Tag, TimeRange } from '../components/ui';

/* ---------- صدا ---------- */
let audioCtx: AudioContext | null = null;
function ensureAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx?.state === 'suspended') void audioCtx.resume();
  } catch {
    /* بی‌صدا */
  }
}
function beep(freq = 660, len = 0.16, gain = 0.05) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + len);
    osc.connect(g).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + len + 0.02);
  } catch {
    /* نادیده */
  }
}

/* نگاشت ایندکس بین چیدمان فشرده و گسترده */
const toExtended = (c: number) => (c >= 10 ? c + 1 : c);
const toCompact = (e: number) => (e > 10 ? e - 1 : e);

export default function PracticeLab() {
  const app = useApp();
  const [includeOptional, setIncludeOptional] = useStoredState<boolean>('pref:optionalSlide', false);

  const plan = useMemo(() => planSlides(includeOptional), [includeOptional]);
  const talkTotal = useMemo(() => totalTalk(includeOptional), [includeOptional]);

  /* وضعیت تایمر: یک منبع حقیقت واحد */
  const timer = useRef({ total: 0, slide: 0 });
  const [, setVer] = useState(0);
  const bump = useCallback(() => setVer((v) => v + 1), []);

  const [current, setCurrent] = useState(0);
  const [running, setRunning] = useState(false);
  const prevRem = useRef<number | null>(null);

  /* شروع از اسلاید درخواستی (از نقشه راه) */
  useEffect(() => {
    if (!app.pendingStart) return;
    const raw = Math.max(0, Math.min(app.pendingStart.slide, plan.length - 1));
    const idx = includeOptional ? toExtended(raw) : raw;
    app.consumeStart();
    timer.current = { total: Math.max(0, plan[Math.min(idx, plan.length - 1)]?.start ?? 0), slide: 0 };
    setCurrent(Math.min(idx, plan.length - 1));
    setRunning(false);
    if (raw === 0) removeStore('session:last');
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.pendingStart]);

  /* ادامه از آخرین جایگاه ذخیره‌شده */
  useEffect(() => {
    if (app.pendingStart) return;
    const m = readStore<{ slide: number; total: number; slideSeconds: number; running: boolean; optional: boolean } | null>('session:last', null);
    if (!m) return;
    const idx = (m.optional === includeOptional ? m.slide : m.optional ? toCompact(m.slide) : toExtended(m.slide)) ?? 0;
    const clamped = Math.max(0, Math.min(idx, plan.length - 1));
    timer.current = { total: m.total ?? 0, slide: m.slideSeconds ?? 0 };
    setCurrent(clamped);
    setRunning(m.running && !app.pendingStart);
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* تیک تایمر */
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const d = (now - last) / 1000;
      last = now;
      timer.current.total += d;
      timer.current.slide += d;
      bump();
    }, 200);
    return () => window.clearInterval(id);
  }, [running, bump]);

  /* هشدار نرم صوتی در مرزهای ۱۰، ۵ و صفر ثانیه */
  useEffect(() => {
    const slide = plan[current];
    if (!slide || !running) return;
    const rem = Math.ceil(slide.duration - timer.current.slide);
    if (prevRem.current !== null && rem !== prevRem.current && app.audible) {
      if (rem === 10 || rem === 5) beep(660);
      if (rem === 0) beep(880, 0.3);
    }
    prevRem.current = rem;
    return () => {
      prevRem.current = null;
    };
  }, [running, current, plan, app.audible, timer]);

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
    saveMarker();
    bump();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSession = () => {
    if (running) setRunning(false);
    timer.current = { total: plan[0].start, slide: 0 };
    setCurrent(0);
    removeStore('session:last');
    bump();
  };

  const toggleRun = () => {
    const next = !running;
    if (next && app.audible) ensureAudio();
    setRunning(next);
    if (!next) saveMarker();
  };

  const resetSlideTimer = () => {
    timer.current.slide = 0;
    bump();
  };

  const go = (dir: 1 | -1) => {
    const target = current + dir;
    if (target < 0 || target >= plan.length) return;
    startFrom(target);
  };

  /* پرش به اسلاید بر اساس شماره (۱ تا ۲۰) */
  const jumpTo = (n: number) => {
    const target = plan.findIndex((p) => p.num === n && !p.optional);
    if (target >= 0) startFrom(target);
  };

  /* آخرین نسخه اکشن‌ها تا شنونده تنها یک‌بار سوار شود و هرگز کهنه نماند */
  const act = useRef({
    next: (d: 1 | -1) => go(d),
    prev: (d: 1 | -1) => go(d),
    first: () => startFrom(0),
    last: () => startFrom(plan.length - 1),
    toggleRun,
    resetSlide: resetSlideTimer,
    resetAll: resetSession,
    toggleOptional: (v: boolean) => setIncludeOptional(v),
    jump: jumpTo,
    enabled: app.shortcutsOn,
    optional: includeOptional,
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
      toggleOptional: (v: boolean) => setIncludeOptional(v),
      jump: jumpTo,
      enabled: app.shortcutsOn,
      optional: includeOptional,
    };
  });

  /* صفحه‌کلید دقیق جلسه تمرینی */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlaysOpen() || isEditableTarget(e)) return;
      const a = act.current;
      const k = snapshot(e);
      if (k.ctrl || k.meta || k.alt) return; // مادیفایر = میان‌بر مرورگر/سراسری

      // کلیدهای غیرکاراکتری همیشه فعال‌اند (جهت‌دار، صفحه، ابتدا/انتها)
      if (k.code === 'ArrowLeft' || k.code === 'PageDown') { e.preventDefault(); a.next(1); return; }
      if (k.code === 'ArrowRight' || k.code === 'PageUp') { e.preventDefault(); a.prev(-1); return; }
      if (k.code === 'Home') { e.preventDefault(); a.first(); return; }
      if (k.code === 'End') { e.preventDefault(); a.last(); return; }

      // بقیه تک‌کلیدی‌اند و فقط با رضایت کاربر
      if (!a.enabled || k.repeat) return;

      if (k.code === 'Space') {
        if (isInteractiveTarget(e)) return; // اجازه فعال‌شدن بومی دکمه فوکوس‌شده
        e.preventDefault();
        a.toggleRun();
        return;
      }
      if (k.code === 'KeyP') { e.preventDefault(); a.toggleRun(); return; }
      if (k.code === 'KeyR') { if (k.shift) a.resetAll(); else a.resetSlide(); return; }
      if (k.code === 'KeyO') { a.toggleOptional(!a.optional); a.resetAll(); return; }
      const n = digitFromCode(k.code, k.shift);
      if (n !== null) { e.preventDefault(); a.jump(n); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ch = chapters.find((c) => c.id === slide.chapterId) ?? { num: 'شروع', title: 'شروع جلسه' };
  const sessionTotal = totalSession(includeOptional);
  const targetWindow = practiceWindow();
  const slideKey = slide.optional ? 'opt' : String(slide.num);

  return (
    <div className="space-y-5">
      {/* نوار وضعیت و تایمر */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Tag tone={slide.optional ? 'ochre' : 'pine'}>
              {slide.optional ? 'اسلاید اختیاری' : `بخش ${ch.num} · ${ch.title}`}
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
              onClick={() => app.setAudible(!app.audible)}
            >
              {app.audible ? <Volume2 className="h-4.5 w-4.5 text-pine" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* سه نمایشگر زمان */}
        <div className="grid gap-px bg-line sm:grid-cols-3">
          <div className="bg-surface px-5 py-5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Timer className="h-3.5 w-3.5" />
              زمان کل ارائه
              <span className="font-normal text-muted/70">(دقیقه:ثانیه)</span>
            </p>
            <p className="mt-1.5 text-3xl font-black tracking-tight text-ink">
              <span className="timer-num">{formatClock(totalSec)}</span>
              <span className="mr-2 text-sm font-bold text-muted">
                از {formatClock(talkTotal)}
              </span>
            </p>
            <p className="mt-1.5 text-xs font-bold text-pine">
              مانده تا پایان گفتار: <span className="timer-num">{formatClock(Math.max(0, talkTotal - totalSec))}</span>
            </p>
          </div>

          <div className="bg-surface px-5 py-5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Flag className="h-3.5 w-3.5" />
              زمان این اسلاید
              <span className="font-normal text-muted/70">(دقیقه:ثانیه)</span>
            </p>
            <p className="mt-1.5 text-3xl font-black tracking-tight text-ink">
              <span className="timer-num">{formatClock(slideSec)}</span>
              <span className="mr-2 text-sm font-bold text-muted">
                از {formatClock(slide.duration)}
              </span>
            </p>
            <p className="mt-1.5 text-xs font-bold text-muted">
              پنجره برنامه‌ریزی: <TimeRange from={slide.start} to={slide.end} />
            </p>
          </div>

          <div className={`bg-surface px-5 py-5 transition-colors duration-700 ${stage === 'end' ? 'bg-clay-soft/50' : ''}`}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Lightbulb className="h-3.5 w-3.5" />
              وضعیت زمان
            </p>
            <p className="mt-1.5 text-3xl font-black tracking-tight">
              <span key={stage} className="swap-fade">
                {stage === 'ok' && <span className="text-pine">آرام پیش می‌روی</span>}
                {stage === 'warn' && (
                  /* پایدار و بدون چشمک: فقط رنگ و یک نقطه ثابت برای جلب توجه آرام */
                  <span className="flex items-center gap-2 text-ochre">
                    <span className="inline-block h-2 w-2 rounded-full bg-ochre" aria-hidden="true" />
                    {remaining <= 10 ? 'پایان نزدیک است' : 'کمی سرعت بگیر'}
                  </span>
                )}
                {stage === 'end' && <span className="text-clay">زمان اسلاید تمام شد</span>}
              </span>
            </p>
            <p className="mt-1.5 text-xs font-bold text-muted">
              {stage === 'ok' && (
                <>
                  باقی‌مانده: <span className="timer-num">{formatClock(remaining)}</span>
                </>
              )}
              {stage === 'warn' && (
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

        {/* کنترل‌ها */}
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
              اسلاید <span className="text-ink">{toPersianDigits(current + 1)}</span> از{' '}
              {toPersianDigits(plan.length)}
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
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(Math.min(100, (totalSec / sessionTotal) * 100))} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${Math.min(100, (totalSec / sessionTotal) * 100)}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.7rem] font-bold text-muted">
          <span>شروع</span>
          <span>پایان گفتار {formatClock(talkTotal)}</span>
          <span>حداکثر {formatClock(sessionTotal)}</span>
        </div>
      </section>

      {/* ناوبری سریع اسلایدها */}
      <section className="card focus-hidden p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-muted">
            ناوبری سریع: روی هر اسلاید بزن، یا با کلیدهای ۱ تا ۹ و ۰ پرش کن
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-ink-soft">
            <input
              type="checkbox"
              className="h-4 w-4 accent-pine"
              checked={includeOptional}
              onChange={(e) => {
                setIncludeOptional(e.target.checked);
                resetSession();
              }}
            />
            چیدمان گسترده با اسلاید اختیاری وراثت و رقابت
          </label>
        </div>
        <div className="no-hbar flex gap-1.5 overflow-x-auto pb-1">
          {plan.map((p, i) => (
            <button
              key={`${p.num}-${i}`}
              type="button"
              title={`${p.title} ${p.optional ? '(اختیاری)' : ''}`}
              className={`slide-dot ${i === current ? 'active' : ''} ${p.optional ? 'optional' : ''} ${
                i < current ? 'done' : ''
              }`}
              onClick={() => startFrom(i)}
            >
              {p.optional ? '★' : toPersianDigits(p.num)}
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
                {slide.optional ? 'اسلاید اختیاری' : `اسلاید ${toPersianDigits(slide.num)} از ${toPersianDigits(20)}`}
                {slide.backupRef ? ` · ${slide.backupRef}` : ''}
              </p>
              <h3 className="mt-1 text-xl font-black text-ink md:text-2xl">{slide.title}</h3>
            </div>
            <MarkButton storageKey={`slide-hl:${slide.optional ? 'opt' : slide.num}`} label="اسلاید مهم" />
          </div>

          {slide.goal && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-pine-wash px-3.5 py-2.5 text-[0.88em] leading-[var(--reading-lh)] text-pine-deep">
              <Target className="mt-0.5 h-4 w-4 shrink-0" />
              <span><b className="font-extrabold">هدف اسلاید: </b>{slide.goal}</span>
            </p>
          )}
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* ستون اصلی */}
          <div className="min-w-0 space-y-7 px-6 py-6 md:px-8">
            {slide.tex.length > 0 && (
              <div className="rounded-2xl border border-line bg-surface-2/70 p-2">
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
                    <li key={i} className="text-[0.95em] leading-[var(--reading-lh)] text-ink-soft">{v}</li>
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
                  <SpeechLine key={i} para={para} hlKey={`speech-hl:${slide.optional ? 'opt' : slide.num}-${i}`} />
                ))}
              </div>
            </div>

            {slide.phrase && (
              <blockquote className="hl-mark rounded-2xl px-5 py-4 text-[1.05em] font-extrabold leading-[var(--reading-lh)] text-ink">
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

          {/* ستون یادداشت */}
          <aside className="space-y-5 border-t border-line bg-surface-2/40 px-6 py-6 lg:border-r lg:border-t-0">
            {slide.notes.length > 0 && (
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                  <Lightbulb className="h-4 w-4 text-ochre" />
                  یادداشت اجرا
                </h4>
                <ul className="space-y-2.5">
                  {slide.notes.map((n, i) => (
                    <li key={i} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[0.85em] leading-[var(--reading-lh)] text-ink-soft">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <NoteBox storageKey={`slide-note:${slide.optional ? 'opt' : slide.num}`} />
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

function SpeechLine({ para, hlKey }: { para: string; hlKey: string }) {
  const [on, setOn] = useStoredState<boolean>(hlKey, false);
  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-1.5 transition-colors ${on ? 'hl-mark' : ''}`}
    >
      <p className="min-w-0 flex-1 text-[1.02em] leading-[var(--reading-lh)] text-ink">{para}</p>
      <button
        type="button"
        className={`note-marker mt-2 shrink-0 ${on ? 'text-ochre' : ''}`}
        aria-pressed={on}
        title={on ? 'حذف هایلایت' : 'هایلایت این نکته'}
        onClick={() => setOn(!on)}
      >
        <Star className={`h-4 w-4 ${on ? 'fill-ochre' : ''}`} />
      </button>
    </div>
  );
}


