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
  CircleHelp,
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
import { planSlides, slideWindow, totalSession, totalTalk, practiceTarget } from '../lib/session';
import { useApp, rememberSession } from '../lib/app-context';
import { readStore, removeStore, useStoredState } from '../lib/storage';
import { formatClock, toPersianDigits } from '../lib/persian';
import { TeX } from '../lib/tex';
import { MarkButton, NoteBox, Tag } from '../components/ui';

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
  const [helpOpen, setHelpOpen] = useState(false);
  const prevRem = useRef<number | null>(null);

  /* شروع از اسلاید درخواستی (از نقشه راه) */
  useEffect(() => {
    if (!app.pendingStart) return;
    const raw = Math.max(0, Math.min(app.pendingStart.slide, plan.length - 1));
    const idx = includeOptional ? toExtended(raw) : raw;
    app.consumeStart();
    timer.current = { total: Math.max(0, plan[Math.min(idx, plan.length - 1)]?.start ?? 0) * 1000, slide: 0 };
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
  const totalMs = timer.current.total;
  const slideMs = timer.current.slide;
  const remaining = Math.max(0, slide.duration - slideMs);
  const overrun = slideMs > slide.duration ? slideMs - slide.duration : 0;

  const stage: 'ok' | 'warn' | 'end' =
    slideMs >= slide.duration ? 'end' : remaining <= 20 ? 'warn' : 'ok';

  const startFrom = (i: number) => {
    if (running) setRunning(false);
    timer.current = { total: plan[i].start * 1000, slide: 0 };
    setCurrent(i);
    saveMarker();
    bump();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSession = () => {
    if (running) setRunning(false);
    timer.current = { total: plan[0].start * 1000, slide: 0 };
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

  /* صفحه‌کلید کامل */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const k = e.key;

      if (k === 'ArrowLeft') { e.preventDefault(); go(1); return; }
      if (k === 'ArrowRight') { e.preventDefault(); go(-1); return; }
      if (k === 'PageDown') { e.preventDefault(); go(1); return; }
      if (k === 'PageUp') { e.preventDefault(); go(-1); return; }
      if (k === 'Home') { e.preventDefault(); startFrom(0); return; }
      if (k === 'End') { e.preventDefault(); startFrom(plan.length - 1); return; }
      if (k === ' ' || k === 'p' || k === 'P') { e.preventDefault(); toggleRun(); return; }
      if (k === 'r' && !e.shiftKey) { resetSlideTimer(); return; }
      if (k === 'R') { resetSession(); return; }
      if (k === 'f' || k === 'F') { app.setFocus(!app.focus); return; }
      if (k === 'm' || k === 'M') { app.setAudible(!app.audible); return; }
      if (k === 'h' || k === '?') { setHelpOpen((v) => !v); return; }
      if (k === 'Escape') { setHelpOpen(false); if (app.focus) app.setFocus(false); return; }

      if (/^[0-9]$/.test(k)) {
        e.preventDefault();
        const n = k === '0' ? 10 : Number(k);
        const target = plan.findIndex((p) => p.num === n && !p.optional);
        if (target >= 0) startFrom(target);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, plan, running, app.focus]);

  const ch = chapters.find((c) => c.id === slide.chapterId) ?? { num: 'شروع', title: 'شروع جلسه' };
  const sessionTotal = totalSession(includeOptional);

  return (
    <div className="space-y-5">
      {/* نوار وضعیت و تایمر */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Tag tone={slide.optional ? 'ochre' : 'pine'}>
              {slide.optional ? 'اسلاید اختیاری' : `بخش ${ch.num} · ${ch.title}`}
            </Tag>
            <h2 className="min-w-0 text-base font-extrabold text-ink md:text-lg">{slide.title}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" className="icon-btn" title="راهنمای کلیدها (H)" onClick={() => setHelpOpen((v) => !v)}>
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
          <div className="bg-surface px-5 py-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Timer className="h-3.5 w-3.5" />
              زمان کل ارائه
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight text-ink">
              <span className="timer-num">{formatClock(totalMs)}</span>
              <span className="mr-2 text-sm font-bold text-muted">
                از {formatClock(talkTotal)}
              </span>
            </p>
            <p className="mt-1 text-xs font-bold text-pine">
              مانده تا پایان گفتار: <span className="timer-num">{formatClock(Math.max(0, talkTotal - totalMs))}</span>
            </p>
          </div>

          <div className="bg-surface px-5 py-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Flag className="h-3.5 w-3.5" />
              زمان این اسلاید
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight text-ink">
              <span className="timer-num">{formatClock(slideMs)}</span>
              <span className="mr-2 text-sm font-bold text-muted">
                از {formatClock(slide.duration)}
              </span>
            </p>
            <p className="mt-1 text-xs font-bold text-muted">
              پنجره برنامه‌ریزی: <span className="timer-num">{slideWindow(slide)}</span>
            </p>
          </div>

          <div className={`bg-surface px-5 py-4 ${stage === 'end' ? 'bg-clay-soft/50' : ''}`}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <Lightbulb className="h-3.5 w-3.5" />
              وضعیت زمان
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight">
              {stage === 'ok' && <span className="text-pine">آرام پیش می‌روی</span>}
              {stage === 'warn' && (
                <span className={`text-ochre ${remaining <= 10 ? 'pulse-soft' : ''}`}>
                  {remaining <= 10 ? 'پایان نزدیک است' : 'کمی سرعت بگیر'}
                </span>
              )}
              {stage === 'end' && <span className="text-clay">زمان اسلاید تمام شد</span>}
            </p>
            <p className="mt-1 text-xs font-bold text-muted">
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
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
          <p className="text-xs font-bold text-muted">
            اسلاید <span className="text-ink">{toPersianDigits(current + 1)}</span> از{' '}
            {toPersianDigits(plan.length)}
            {' · '}
            هدف پایان: {practiceTarget()}
          </p>
        </div>
      </section>

      {/* نوار پیشرفت کل جلسه */}
      <section className="card px-5 py-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted">
          <span>پیشرفت کل جلسه</span>
          <span className="timer-num" dir="ltr">
            {formatClock(Math.min(totalMs, sessionTotal))} / {formatClock(sessionTotal)}
          </span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(Math.min(100, (totalMs / sessionTotal) * 100))} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${Math.min(100, (totalMs / sessionTotal) * 100)}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[0.7rem] font-bold text-muted">
          <span>شروع</span>
          <span>پایان گفتار {formatClock(talkTotal)}</span>
          <span>حداکثر {formatClock(sessionTotal)}</span>
        </div>
      </section>

      {/* ناوبری سریع اسلایدها */}
      <section className="card focus-hidden px-5 py-4">
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
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-pine-wash px-3.5 py-2.5 text-[0.85rem] leading-6 text-pine-deep">
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
                    <li key={i} className="text-[0.95rem] leading-8 text-ink-soft">{v}</li>
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
              <blockquote className="hl-mark rounded-2xl px-5 py-4 text-[1rem] font-extrabold leading-9 text-ink">
                {slide.phrase}
              </blockquote>
            )}

            {slide.transition && (
              <p className="rounded-xl border border-dashed border-line-strong bg-surface-2/50 px-4 py-3 text-[0.9rem] leading-7 text-ink-soft">
                <b className="font-extrabold text-muted">جمله انتقال: </b>
                {slide.transition}
              </p>
            )}
          </div>

          {/* ستون یادداشت */}
          <aside className="space-y-4 border-t border-line bg-surface-2/40 px-6 py-6 lg:border-r lg:border-t-0 md:px-5">
            {slide.notes.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                  <Lightbulb className="h-4 w-4 text-ochre" />
                  یادداشت اجرا
                </h4>
                <ul className="space-y-2">
                  {slide.notes.map((n, i) => (
                    <li key={i} className="rounded-xl border border-line bg-surface px-3 py-2 text-[0.8rem] leading-6 text-ink-soft">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <NoteBox storageKey={`slide-note:${slide.optional ? 'opt' : slide.num}`} />
            <p className="rounded-xl bg-surface px-3 py-2 text-[0.72rem] leading-6 text-muted">
              یادداشت‌ها و هایلایت‌ها فقط در همین دستگاه ذخیره می‌شوند.
            </p>
          </aside>
        </div>
      </article>

      {/* راهنمای کلیدها */}
      {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} />}
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
      <p className="min-w-0 flex-1 text-[1.02rem] leading-9 text-ink">{para}</p>
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

function HelpSheet({ onClose }: { onClose: () => void }) {
  const keys: Array<[string, string]> = [
    ['اسلاید بعد', 'کلید چپ یا PageDown'],
    ['اسلاید قبلی', 'کلید راست یا PageUp'],
    ['شروع و توقف هم‌زمان تایمرها', 'Space یا P'],
    ['تایمر این اسلاید از نو', 'R'],
    ['کل جلسه از نو', 'Shift+R'],
    ['پرش به اسلاید', 'عدد ۱ تا ۹ و ۰ برای ۱۰'],
    ['اولین و آخرین اسلاید', 'Home و End'],
    ['حالت تمرکز', 'F'],
    ['صدا روشن و خاموش', 'M'],
    ['بستن این راهنما', 'H یا Escape'],
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div className="card fade-up w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
            <Keyboard className="h-5 w-5 text-pine" />
            راهنمای کلیدهای جلسه تمرینی
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="بستن">
            <CircleHelp className="h-4 w-4" />
          </button>
        </div>
        <ul className="divide-y divide-line">
          {keys.map(([label, k]) => (
            <li key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="font-bold text-ink-soft">{label}</span>
              <span className="text-xs font-bold text-muted">{k}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl bg-pine-wash px-4 py-3 text-xs leading-6 text-pine-deep">
          توقف تایمر اسلاید، تایمر کل ارائه را در همان لحظه متوقف می‌کند؛
          یعنی هر دو تایمر همیشه یک وضعیت دارند و هرگز از هم جدا نمی‌شوند.
        </p>
      </div>
    </div>
  );
}
