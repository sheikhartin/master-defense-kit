/**
 * بافت سراسری برنامه: تنظیمات تایپوگرافی، حالت تمرکز، وضعیت چاپ و پیمایش.
 * همه این تنظیمات (جز حالت تمرکز) در localStorage نگهداری می‌شوند.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStoredState, writeStore } from './storage';

export type TabId = 'home' | 'practice' | 'cheat' | 'qa' | 'checklist';

interface AppState {
  tab: TabId;
  go: (tab: TabId, slideIndex?: number) => void;
  /** درخواست شروع تمرین از اسلاید خاص (شماره صفر یعنی از اول) */
  pendingStart: { slide: number; stamp: number } | null;
  consumeStart: () => void;

  /** تایپوگرافی سراسری خواندن */
  textScale: number;      // 0.9 تا 1.15
  setTextScale: (v: number) => void;
  lineHeight: number;     // 1.7 تا 2.2
  setLineHeight: (v: number) => void;

  /** هشدار شنیداری نرم (اختیاری) */
  audible: boolean;
  setAudible: (v: boolean) => void;

  /** حالت تمرکز */
  focus: boolean;
  setFocus: (v: boolean) => void;

  /** میان‌برهای تک‌کلیدی (WCAG 2.1.4: کاربر می‌تواند خاموش کند) */
  shortcutsOn: boolean;
  setShortcutsOn: (v: boolean) => void;

  /** راهنمای سراسری کلیدها */
  guideOpen: boolean;
  setGuideOpen: (v: boolean) => void;

  /** چاپ برگه تقلب */
  printOpen: boolean;
  openPrint: () => void;
  closePrint: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('home');
  const [pendingStart, setPendingStart] = useState<{ slide: number; stamp: number } | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  const [textScale, setTextScale] = useStoredState<number>('pref:textScale', 1);
  const [lineHeight, setLineHeight] = useStoredState<number>('pref:lineHeight', 1.95);
  const [audible, setAudible] = useStoredState<boolean>('pref:audible', false);
  const [shortcutsOn, setShortcutsOn] = useStoredState<boolean>('pref:shortcuts', true);
  const [focus, setFocusState] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const go = useCallback((next: TabId, slideIndex?: number) => {
    setTab(next);
    if (next === 'practice' && slideIndex !== undefined) {
      setPendingStart({ slide: slideIndex, stamp: Date.now() });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const consumeStart = useCallback(() => setPendingStart(null), []);

  const setFocus = useCallback((v: boolean) => setFocusState(v), []);

  const openPrint = useCallback(() => setPrintOpen(true), []);
  const closePrint = useCallback(() => setPrintOpen(false), []);

  const state = useMemo<AppState>(
    () => ({
      tab,
      go,
      pendingStart,
      consumeStart,
      textScale,
      setTextScale,
      lineHeight,
      setLineHeight,
      audible,
      setAudible,
      focus,
      setFocus,
      shortcutsOn,
      setShortcutsOn,
      guideOpen,
      setGuideOpen,
      printOpen,
      openPrint,
      closePrint,
    }),
    [
      tab,
      go,
      pendingStart,
      consumeStart,
      textScale,
      setTextScale,
      lineHeight,
      setLineHeight,
      audible,
      setAudible,
      focus,
      setFocus,
      shortcutsOn,
      setShortcutsOn,
      guideOpen,
      setGuideOpen,
      printOpen,
      openPrint,
      closePrint,
    ],
  );

  // همگام‌سازی کلاس حالت تمرکز روی body
  useEffect(() => {
    document.body.classList.toggle('focus-active', focus);
    return () => document.body.classList.remove('focus-active');
  }, [focus]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AppProvider یافت نشد');
  return ctx;
}

/** ذخیره آخرین جایگاه تمرین برای «ادامه از همان‌جا» */
export interface SessionMarker {
  slide: number;       // ایندکس صفر-پایه
  totalSeconds: number;
  slideSeconds: number;
  running: boolean;
  stamp: number;
}

export function rememberSession(marker: SessionMarker): void {
  writeStore('session:last', marker);
}

/**
 * اعمال مقیاس قلم و فاصله سطر روی یک ناحیه.
 * اندازه با درصد روی ظرف تنظیم می‌شود تا فرزندانِ `em` از آن پیروی کنند و
 * فاصله سطر هم به‌صورت متغیر `--reading-lh` و هم به‌صورت lineHeight ارثی اعمال
 * می‌شود تا متن‌هایی که leading اختصاصی ندارند هم از آن بهره ببرند.
 */
export function readingStyle(scale: number, lineHeight: number): React.CSSProperties {
  return {
    fontSize: `${Math.round(scale * 100)}%`,
    lineHeight,
    ['--reading-lh' as string]: `${lineHeight}`,
  } as React.CSSProperties;
}
